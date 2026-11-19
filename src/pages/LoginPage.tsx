import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type Mode = "login" | "signup";

function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        const result = await signIn(email.trim(), password);
        if (result) setError(result);
        else navigate(returnTo ? `${returnTo.pathname ?? "/"}${returnTo.search ?? ""}` : "/", { replace: true });
      } else {
        const result = await signUp(email.trim(), password, displayName.trim());
        if (result.error) setError(result.error);
        else if (result.needsEmailConfirmation) setMessage("確認メールを送りました。メール内のリンクを開いて登録を完了してください。");
        else navigate(returnTo ? `${returnTo.pathname ?? "/"}${returnTo.search ?? ""}` : "/", { replace: true });
      }
    } catch {
      setError("処理に失敗しました。通信状況を確認して、もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10 pb-28">
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-primary">HOSHII アカウント</p>
        <h1 className="mt-2 text-2xl font-bold">{mode === "login" ? "ログイン" : "新規登録"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">メールアドレスとパスワードを入力してください。</p>
        <div className="mt-6 grid grid-cols-2 rounded-xl bg-muted p-1" aria-label="認証方法">
          {(["login", "signup"] as const).map((item) => (
            <button key={item} type="button" onClick={() => { setMode(item); setMessage(""); setError(""); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === item ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}>
              {item === "login" ? "ログイン" : "新規登録"}
            </button>
          ))}
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && <label className="block text-sm font-semibold">表示名
            <input className="mt-2 w-full rounded-xl border border-input px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-ring" type="text" autoComplete="nickname" minLength={1} maxLength={40} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="例：みとさん" />
          </label>}
          <label className="block text-sm font-semibold">メールアドレス
            <input className="mt-2 w-full rounded-xl border border-input px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-ring" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </label>
          <label className="block text-sm font-semibold">パスワード
            <input className="mt-2 w-full rounded-xl border border-input px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-ring" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6文字以上" />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {message && <p role="status" className="text-sm text-primary">{message}</p>}
          <button className="w-full rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60" type="submit" disabled={submitting}>
            {submitting ? "処理中…" : mode === "login" ? "ログイン" : "アカウントを作成"}
          </button>
        </form>
        {mode === "login" && <Link className="mt-4 inline-block text-sm font-semibold text-muted-foreground underline" to="/reset-password">パスワードを忘れた方</Link>}
        <Link className="mt-5 block text-sm font-semibold text-muted-foreground underline" to="/">ホームに戻る</Link>
      </section>
    </main>
  );
}

export default LoginPage;
