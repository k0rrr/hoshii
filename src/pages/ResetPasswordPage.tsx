import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function RequestPasswordResetPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setBusy(true);
    try {
      const result = await requestPasswordReset(email.trim());
      if (result) setError(result);
      else setMessage("該当するアカウントがあれば、パスワード再設定メールを送信しました。メールをご確認ください。");
    } catch { setError("メールを送信できませんでした。時間をおいて再度お試しください。"); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-md px-5 py-10 pb-28"><section className="rounded-2xl border border-border bg-white p-6 sm:p-8"><h1 className="text-2xl font-bold">パスワード再設定</h1><p className="mt-2 text-sm text-muted-foreground">登録したメールアドレスに再設定リンクを送ります。</p><form className="mt-6 space-y-4" onSubmit={submit}><label className="block text-sm font-semibold">メールアドレス<input className="mt-2 w-full rounded-xl border border-input px-4 py-3 font-normal" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-primary">{message}</p>}<button disabled={busy} className="w-full rounded-full bg-primary px-5 py-3 font-bold text-white disabled:opacity-60">{busy ? "送信中…" : "再設定メールを送る"}</button></form><Link className="mt-5 inline-block text-sm underline" to="/login">ログインに戻る</Link></section></main>;
}

export function ConfirmPasswordResetPage() {
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await updatePassword(password);
      if (result) setError(result);
      else navigate("/mypage", { replace: true });
    } catch { setError("パスワードを更新できませんでした。再設定メールからもう一度お試しください。"); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-md px-5 py-10 pb-28"><section className="rounded-2xl border border-border bg-white p-6 sm:p-8"><h1 className="text-2xl font-bold">新しいパスワード</h1>{loading ? <p className="mt-4 text-muted-foreground">確認しています…</p> : !user ? <><p className="mt-4 text-sm text-muted-foreground">再設定リンクが無効か期限切れです。もう一度メールを送ってください。</p><Link className="mt-5 inline-block text-primary underline" to="/reset-password">再設定メールを送る</Link></> : <form className="mt-6 space-y-4" onSubmit={submit}><label className="block text-sm font-semibold">新しいパスワード<input className="mt-2 w-full rounded-xl border border-input px-4 py-3 font-normal" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button disabled={busy} className="w-full rounded-full bg-primary px-5 py-3 font-bold text-white disabled:opacity-60">{busy ? "更新中…" : "パスワードを更新"}</button></form>}</section></main>;
}
