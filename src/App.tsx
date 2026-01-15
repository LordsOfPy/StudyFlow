import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { AuthLoading } from "@/components/AuthLoading";
import React, { Suspense, lazy } from 'react';
import { Loader2 } from "lucide-react";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Timer = lazy(() => import("./pages/Timer"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Notes = lazy(() => import("./pages/Notes"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Library = lazy(() => import("./pages/Library"));
const StudyLive = lazy(() => import("./pages/StudyLive"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/timer" element={<Timer />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/library" element={<Library />} />
        <Route path="/live" element={<StudyLive />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AccessibilityProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AccessibilityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
