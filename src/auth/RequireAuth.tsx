import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="mx-auto max-w-6xl px-5 py-16 text-center text-muted-foreground">ログイン状態を確認しています…</main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
