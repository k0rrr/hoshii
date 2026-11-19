import { RequestVersion } from "../lib/requestVersion";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, UserRound } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { listDemands, getVotedDemands, type Demand } from "../lib/demands";
import { getDisplayName, updateDisplayName } from "../lib/profiles";
import DemandCard from "../components/DemandCard";

function MyPage() {
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [myDemands, setMyDemands] = useState<Demand[]>([]);
  const [votedDemands, setVotedDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const requests = useRef(new RequestVersion());
  const load = useCallback(() => {
    const isCurrent = requests.current.next();
    if (!user) return;
    setLoading(true); setError("");
    setDisplayName(""); setMyDemands([]); setVotedDemands([]);
    void Promise.all([getDisplayName(user.id), listDemands({ authorId: user.id, viewerId: user.id }), getVotedDemands(user.id)])
      .then(([name, mine, voted]) => { if (!isCurrent()) return; setDisplayName(name); setNameInput(name); setMyDemands(mine); setVotedDemands(voted); })
      .catch(() => { if (isCurrent()) setError("マイページを読み込めませんでした。時間をおいて、更新をお試しください。"); })
      .finally(() => { if (isCurrent()) setLoading(false); });
  }, [user]);
  useEffect(() => {
    load();
    return () => requests.current.cancel();
  }, [load]);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return;
    setSavingName(true); setError(""); setNotice("");
    try { await updateDisplayName(user.id, nameInput); setDisplayName(nameInput.trim()); setEditingName(false); setNotice("表示名を更新しました。"); load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "表示名を更新できませんでした。"); }
    finally { setSavingName(false); }
  }

  if (authLoading) return <main className="mx-auto max-w-6xl px-5 py-10 pb-28 text-muted-foreground">ログイン状態を確認しています…</main>;
  if (!user) return <main className="mx-auto max-w-6xl px-5 py-8 pb-28"><h1 className="text-2xl font-bold">マイページ</h1><section className="mt-6 max-w-xl rounded-2xl border border-border bg-white p-6"><h2 className="font-bold">ログインして利用する</h2><p className="mt-2 text-sm text-muted-foreground">自分の投稿や賛同した需要を確認できます。</p><Link to="/login" className="mt-5 inline-block rounded-full bg-primary px-5 py-3 font-bold text-white">ログイン・新規登録</Link></section></main>;

  return <main className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-5 md:px-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">マイページ</h1><p className="mt-2 text-sm text-muted-foreground">投稿と賛同の履歴を確認できます。</p></div><button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><RefreshCw size={16} />更新</button></div>
    <section className="mt-6 flex max-w-2xl flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-5"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-primary"><UserRound /></span><div className="min-w-0 flex-1"><p className="font-bold">{displayName || "HOSHIIユーザー"}</p><p className="truncate text-sm text-muted-foreground">{user.email}</p></div>{!editingName && <button type="button" onClick={() => setEditingName(true)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">表示名を変更</button>}
      {editingName && <form onSubmit={saveName} className="flex w-full gap-2"><label className="sr-only" htmlFor="display-name">表示名</label><input id="display-name" className="min-w-0 flex-1 rounded-xl border border-input px-3 py-2" value={nameInput} onChange={(e) => setNameInput(e.target.value)} maxLength={40} required /><button disabled={savingName} className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{savingName ? "保存中…" : "保存"}</button><button type="button" onClick={() => { setEditingName(false); setNameInput(displayName); }} className="rounded-full border border-border px-4 py-2 text-sm">取消</button></form>}
    </section>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="mt-4 text-sm text-primary">{notice}</p>}
    {loading ? <div className="mt-8 h-48 animate-pulse rounded-2xl bg-muted" /> : <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2"><section><h2 className="text-xl font-bold">自分の投稿 <span className="text-sm font-medium text-muted-foreground">{myDemands.length}</span></h2>{myDemands.length ? <div className="mt-4 grid gap-4">{myDemands.map((item) => <DemandCard key={item.id} demand={item} onVoted={load} />)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-border bg-white p-6 text-sm text-muted-foreground">まだ投稿がありません。</p>}</section><section><h2 className="text-xl font-bold">賛同した投稿 <span className="text-sm font-medium text-muted-foreground">{votedDemands.length}</span></h2>{votedDemands.length ? <div className="mt-4 grid gap-4">{votedDemands.map((item) => <DemandCard key={item.id} demand={{ ...item, hasVoted: true }} />)}</div> : <p className="mt-4 rounded-2xl border border-dashed border-border bg-white p-6 text-sm text-muted-foreground">まだ賛同した投稿がありません。</p>}</section></div>}
  </main>;
}

export default MyPage;
