import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Layouts
import { ProtectedLayout, ProjectLayout } from "@/components/layouts";

// Lazy Pages
const LandingPage = lazy(() => import("@/pages/landing/LandingPage"));
const AuthPage = lazy(() => import("@/pages/auth/AuthPage"));
const LibraryPage = lazy(() => import("@/pages/library/LibraryPage"));
const EditorPage = lazy(() => import("@/pages/editor/EditorPage"));
const WorldPage = lazy(() => import("@/pages/world/WorldPage"));
const StatsPage = lazy(() => import("@/pages/stats/StatsPage"));
const ExportPage = lazy(() => import("@/pages/export/ExportPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const StudioPage = lazy(() => import("@/pages/studio/StudioPage"));

import { TextureOverlay } from "@/components/ui/TextureOverlay";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TextureOverlay />
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-paper text-sage-600 font-serif">
              Loading...
            </div>
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Demo Route - No Auth Required */}
            <Route path="/demo" element={<EditorPage isDemo={true} />} />

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/library" element={<LibraryPage />} />

              {/* Project Routes */}
              <Route path="/projects/:id" element={<ProjectLayout />}>
                <Route path="editor" element={<EditorPage />} />
                <Route path="studio" element={<StudioPage />} />
                <Route path="world" element={<WorldPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="export" element={<ExportPage />} />
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
  );
}

export default App;
