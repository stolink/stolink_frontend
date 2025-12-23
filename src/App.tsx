import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Layouts
import { ProtectedLayout, ProjectLayout } from "@/components/layouts";

// Pages
import LandingPage from "@/pages/landing/LandingPage";
import AuthPage from "@/pages/auth/AuthPage";
import LibraryPage from "@/pages/library/LibraryPage";
import EditorPage from "@/pages/editor/EditorPage";
import WorldPage from "@/pages/world/WorldPage";
import StatsPage from "@/pages/stats/StatsPage";
import ExportPage from "@/pages/export/ExportPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import StudioPage from "@/pages/studio/StudioPage";

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
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
