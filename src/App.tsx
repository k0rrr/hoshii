import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { RegionProvider } from "./contexts/RegionContext";
import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";
const HomePage = lazy(() => import("./pages/HomePage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const PostPage = lazy(() => import("./pages/PostPage"));
const MyPage = lazy(() => import("./pages/MyPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DemandDetailPage = lazy(() => import("./pages/DemandDetailPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage").then((module) => ({ default: module.RequestPasswordResetPage })));
const ConfirmPasswordResetPage = lazy(() => import("./pages/ResetPasswordPage").then((module) => ({ default: module.ConfirmPasswordResetPage })));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RegionProvider>
          <div className="min-h-screen bg-background">
            <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-5 md:px-8 md:pt-6"><Header /></div>
            <Suspense fallback={<main className="mx-auto max-w-6xl px-5 py-16 text-center text-muted-foreground">画面を読み込んでいます…</main>}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/post" element={<RequireAuth><PostPage /></RequireAuth>} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/demands/:id" element={<DemandDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/reset-password/confirm" element={<ConfirmPasswordResetPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <BottomNavigation />
          </div>
        </RegionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
