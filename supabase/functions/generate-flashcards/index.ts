import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_INPUT_LENGTH = 50000; // ~50KB max
const VALID_INPUT_TYPES = ["text", "pdf"];

interface FlashcardResult {
  question: string;
  answer: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[Internal] Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user's JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("[Internal] Auth validation failed:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`[Info] Request from authenticated user: ${userId}`);

    // Parse and validate input
    const { text, inputType } = await req.json();

    // Input validation: check text presence
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation: check text length
    if (text.length > MAX_INPUT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Text too long. Maximum ${MAX_INPUT_LENGTH} characters allowed.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation: validate inputType
    if (inputType && !VALID_INPUT_TYPES.includes(inputType)) {
      return new Response(
        JSON.stringify({ error: "Invalid input type. Must be 'text' or 'pdf'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[Internal] LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chunk text if it's too long (max ~3000 chars per chunk)
    const chunks = chunkText(text, 3000);
    const allFlashcards: FlashcardResult[] = [];

    for (const chunk of chunks) {
      const systemPrompt = `You are an expert study assistant that creates high-quality flashcards. 
Your task is to extract the most important concepts from the given text and convert them into clear, concise flashcards.

Guidelines:
- Create 5-10 flashcards per chunk of text
- Questions should be specific and answerable
- Answers should be concise (1-3 sentences)
- Focus on key concepts, definitions, and important facts
- Avoid trivial or obvious questions
- Make questions that test understanding, not just recall

IMPORTANT: You must respond with a JSON object containing a "flashcards" array. Each flashcard must have "question" and "answer" fields.`;

      const userPrompt = `Create flashcards from the following ${inputType || "text"}:

${chunk}

Respond with a JSON object like this:
{
  "flashcards": [
    { "question": "...", "answer": "..." },
    { "question": "...", "answer": "..." }
  ]
}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("[Internal] AI gateway error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "Unable to generate flashcards. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        const flashcards = parseFlashcards(content);
        allFlashcards.push(...flashcards);
      }
    }

    // Remove duplicates and limit to reasonable number
    const uniqueFlashcards = removeDuplicates(allFlashcards).slice(0, 20);

    console.log(`[Info] Generated ${uniqueFlashcards.length} flashcards for user ${userId}`);

    return new Response(
      JSON.stringify({
        flashcards: uniqueFlashcards,
        count: uniqueFlashcards.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Internal] Error generating flashcards:", error);
    return new Response(
      JSON.stringify({ error: "Unable to generate flashcards. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += paragraph + "\n\n";
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

function parseFlashcards(content: string): FlashcardResult[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*"flashcards"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.flashcards)) {
        return parsed.flashcards.filter(
          (card: any) => card.question && card.answer
        );
      }
    }

    // Fallback: try parsing the entire content as JSON
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.flashcards)) {
      return parsed.flashcards.filter(
        (card: any) => card.question && card.answer
      );
    }
    if (Array.isArray(parsed)) {
      return parsed.filter((card: any) => card.question && card.answer);
    }
  } catch (e) {
    console.error("[Internal] Failed to parse flashcards:", e);
  }
  return [];
}

function removeDuplicates(flashcards: FlashcardResult[]): FlashcardResult[] {
  const seen = new Set<string>();
  return flashcards.filter((card) => {
    const key = card.question.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
