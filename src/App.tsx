import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEditorSettingStore } from "@/stores/useEditorSettingStore";

// Layouts
import { ProtectedLayout, ProjectLayout } from "@/components/layouts";

// Lazy Pages
const LandingPage = lazy(() => import("@/pages/landing/LandingPage"));
const AuthPage = lazy(() => import("@/pages/auth/AuthPage"));
const OAuth2Callback = lazy(() => import("@/pages/auth/OAuth2Callback"));
const LibraryPage = lazy(() => import("@/pages/library/LibraryPage"));
const EditorPage = lazy(() => import("@/pages/editor/EditorPage"));
const WorldPage = lazy(() => import("@/pages/world/WorldPage"));
const AnalyticsPage = lazy(() => import("@/pages/analytics/AnalyticsPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const CharacterIntegrationTest = lazy(
  () => import("@/pages/CharacterIntegrationTest"),
);

const SharedProjectPage = lazy(() => import("@/pages/share/SharedProjectPage"));

import { TextureOverlay } from "@/components/ui/TextureOverlay";
import { Toaster } from "@/components/ui/toaster";
import { ThemeSync } from "@stolink/ui";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Connect QueryClient to API client for cache clearing on logout
import { setQueryClient } from "@/api/client";
setQueryClient(queryClient);

import { useAuthInit } from "@/hooks/useAuthInit";

function App() {
  // Auth Initialization
  const isInitializing = useAuthInit();

  // Global theme application
  const theme = useEditorSettingStore((s) => s.visual?.theme ?? "light");

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove(
      "theme-light",
      "theme-dark",
      "theme-sepia",
      "theme-eye-care",
      "theme-true-black",
    );
    // Add current theme class
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  // 정상 로드 시 chunk-reload-count 초기화 (다음 에러 대응 가능하도록)
  useEffect(() => {
    sessionStorage.removeItem("chunk-reload-count");
  }, []);

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-paper text-mocha-500 gap-4">
        <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
        <p>Initializing...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        <TextureOverlay />
        <Toaster />
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="h-screen w-screen flex flex-col items-center justify-center bg-paper text-mocha-500 gap-4">
                <div className="w-8 h-8 border-2 border-mocha-500 border-t-transparent rounded-full animate-spin" />
                <p>Loading...</p>
              </div>
            }
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/oauth2/callback" element={<OAuth2Callback />} />
              <Route path="/share/:shareId" element={<SharedProjectPage />} />
              <Route
                path="/test/character-integration"
                element={<CharacterIntegrationTest />}
              />

              {/* Demo Route - No Auth Required */}
              <Route path="/demo" element={<EditorPage isDemo={true} />} />

              {/* Protected Routes */}
              <Route element={<ProtectedLayout />}>
                <Route path="/library" element={<LibraryPage />} />

                {/* Project Routes */}
                <Route path="/projects/:id" element={<ProjectLayout />}>
                  <Route path="editor" element={<EditorPage />} />

                  <Route path="world" element={<WorldPage />} />
                  <Route path="stats" element={<AnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="flex items-center justify-center h-screen">
                    페이지를 찾을 수 없습니다
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
// test
// test
// husky test Mon Jan  5 19:05:50 KST 2026
