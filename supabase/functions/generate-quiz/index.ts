import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_INPUT_LENGTH = 50000;

interface QuizQuestion {
  id: string;
  type: string;
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
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
    console.log(`[Info] Quiz generation request from user: ${userId}`);

    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No content provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (content.length > MAX_INPUT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Content too long. Maximum ${MAX_INPUT_LENGTH} characters allowed.` }),
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

    const systemPrompt = `You are an expert quiz creator for educational purposes.
Your task is to create a comprehensive quiz based on the provided content.

Guidelines:
- Create 5-10 multiple choice questions
- Each question should have 4 options
- Questions should test understanding, not just memorization
- Include a mix of difficulty levels
- Provide a clear correct answer for each question
- Optionally include brief explanations

IMPORTANT: Respond with a valid JSON object containing "title" and "questions" array.`;

    const userPrompt = `Create a quiz from the following content:

${content}

Respond with a JSON object exactly like this:
{
  "title": "Quiz Title Based on Content",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation why this is correct",
      "points": 10
    }
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
        temperature: 0.4,
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
        JSON.stringify({ error: "Unable to generate quiz. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;

    if (!responseContent) {
      return new Response(
        JSON.stringify({ error: "No response from AI. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const quizData = parseQuizResponse(responseContent);
    
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
      return new Response(
        JSON.stringify({ error: "Failed to parse quiz. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Info] Generated quiz with ${quizData.questions.length} questions for user ${userId}`);

    return new Response(
      JSON.stringify(quizData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Internal] Error generating quiz:", error);
    return new Response(
      JSON.stringify({ error: "Unable to generate quiz. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseQuizResponse(content: string): { title: string; questions: QuizQuestion[] } | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*"questions"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.questions)) {
        return {
          title: parsed.title || "Generated Quiz",
          questions: parsed.questions.map((q: any, idx: number) => ({
            id: q.id || `q-${Date.now()}-${idx}`,
            type: q.type || "multiple_choice",
            text: q.text || "",
            options: q.options || [],
            correctAnswer: q.correctAnswer || "",
            explanation: q.explanation,
            points: q.points || 10,
          })),
        };
      }
    }

    // Fallback: try parsing the entire content as JSON
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.questions)) {
      return {
        title: parsed.title || "Generated Quiz",
        questions: parsed.questions.map((q: any, idx: number) => ({
          id: q.id || `q-${Date.now()}-${idx}`,
          type: q.type || "multiple_choice",
          text: q.text || "",
          options: q.options || [],
          correctAnswer: q.correctAnswer || "",
          explanation: q.explanation,
          points: q.points || 10,
        })),
      };
    }
  } catch (e) {
    console.error("[Internal] Failed to parse quiz response:", e);
  }
  return null;
}