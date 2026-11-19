import { RequestVersion } from "../lib/requestVersion";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { REGIONS, type Region } from "../contexts/RegionContext";
import VoteDialog from "../components/VoteDialog";
import { deleteDemand, getDemand, updateDemand, type Demand } from "../lib/demands";
import { formatRelativeTime } from "../lib/format";

const categories = ["飲食", "カフェ", "ジム", "買い物", "その他"];

function CountBreakdown({ title, counts }: { title: string; counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return <section><h3 className="font-bold">{title}</h3>{total === 0 ? <p className="mt-2 text-sm text-muted-foreground">まだ回答がありません</p> : <ul className="mt-3 space-y-3">{Object.entries(counts).map(([label, count]) => <li key={label}><div className="flex justify-between gap-3 text-sm"><span>{label}</span><span className="shrink-0 text-muted-foreground">{count}人 · {Math.round(count / total * 100)}%</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, count / total * 100)}%` }} /></div></li>)}</ul>}</section>;
}

function DemandDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [voting, setVoting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<Region>("水戸駅周辺");
  const [category, setCategory] = useState("飲食");
  const [description, setDescription] = useState("");

  const requests = useRef(new RequestVersion());
  const load = useCallback(() => {
    const isCurrent = requests.current.next();
    if (!id) return;
    setLoading(true); setError(""); setDemand(null);
    void getDemand(id, user?.id).then((item) => { if (!isCurrent()) return; setDemand(item); setTitle(item.title); setArea(item.area as Region); setCategory(item.category); setDescription(item.description); })
      .catch(() => { if (isCurrent()) setError("投稿を読み込めませんでした。"); })
      .finally(() => { if (isCurrent()) setLoading(false); });
  }, [id, user?.id]);
  useEffect(() => {
    load();
    return () => requests.current.cancel();
  }, [load]);

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!demand) return;
    setSaving(true); setError("");
    try { await updateDemand(demand.id, { title: title.trim(), area, category, description: description.trim() }); setEditing(false); load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "保存できませんでした。ログイン状態をご確認ください。"); }
    finally { setSaving(false); }
  }

  async function removeDemand() {
    if (!demand || !window.confirm("この投稿を削除しますか？ 賛同と回答も削除されます。")) return;
    setSaving(true); setError("");
    try { await deleteDemand(demand.id); navigate("/mypage", { replace: true }); }
    catch { setError("削除できませんでした。自分の投稿か、ログイン状態をご確認ください。"); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="mx-auto max-w-3xl px-5 py-10 pb-28"><div className="h-80 animate-pulse rounded-3xl bg-muted" /></main>;
  if (error && !demand) return <main className="mx-auto max-w-3xl px-5 py-10 pb-28"><p role="alert" className="rounded-2xl border border-border bg-white p-6 text-center text-sm text-destructive">投稿を読み込めませんでした。URLをご確認ください。</p><button onClick={load} className="mx-auto mt-4 flex items-center gap-2 text-sm"><RefreshCw size={16} />再読み込み</button></main>;
  if (!demand) return null;

  const isOwner = user?.id === demand.user_id;
  const totalAnswers = Math.max(Object.values(demand.priceCounts).reduce((a, b) => a + b, 0), Object.values(demand.frequencyCounts).reduce((a, b) => a + b, 0));
  return <main className="mx-auto max-w-4xl px-4 py-8 pb-28 sm:px-5 md:px-8"><Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={18} />投稿一覧へ</Link>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-destructive">{error}</p>}
    <article className="rounded-3xl border border-border bg-white p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 font-bold text-primary">{demand.author.charAt(0) || "H"}</span><div><p className="font-semibold">{demand.author}</p><p className="text-xs text-muted-foreground">{formatRelativeTime(demand.created_at)}</p></div></div>{isOwner && <div className="flex gap-2"><button type="button" onClick={() => setEditing((value) => !value)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">{editing ? "編集を閉じる" : "編集"}</button><button type="button" disabled={saving} onClick={() => void removeDemand()} aria-label="投稿を削除" className="rounded-full border border-border p-2 text-destructive disabled:opacity-50"><Trash2 size={18} /></button></div>}</div>
      {editing ? <form onSubmit={saveEdit} className="mt-7 space-y-5"><label className="block text-sm font-semibold">タイトル<input className="mt-2 w-full rounded-xl border border-input p-3 font-normal" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} /></label><label className="block text-sm font-semibold">地域<select className="mt-2 w-full rounded-xl border border-input p-3 font-normal" value={area} onChange={(e) => setArea(e.target.value as Region)}>{REGIONS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block text-sm font-semibold">カテゴリ<select className="mt-2 w-full rounded-xl border border-input p-3 font-normal" value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block text-sm font-semibold">欲しい理由<textarea className="mt-2 w-full resize-none rounded-xl border border-input p-3 font-normal" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={300} /></label><button disabled={saving} className="w-full rounded-full bg-primary px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? "保存中…" : "変更を保存"}</button></form> : <><p className="mt-7 text-sm font-semibold text-primary">{demand.area} ・ {demand.category}</p><h1 className="mt-3 text-2xl font-bold leading-relaxed sm:text-3xl">{demand.title}</h1><p className="mt-5 whitespace-pre-wrap leading-7">{demand.description}</p></>}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><div className="flex items-center gap-2 text-sm"><Heart className="h-5 w-5 text-primary" /><strong>賛同 {demand.supporterCount}人</strong></div>{<button type="button" disabled={demand.hasVoted} onClick={() => { if (!user) navigate("/login", { state: { from: { pathname: `/demands/${id}` } } }); else setVoting(true); }} className="rounded-full bg-primary px-5 py-3 font-bold text-white disabled:bg-muted disabled:text-muted-foreground">{demand.hasVoted ? "賛同済み" : "需要あり！"}</button>}</div>
    </article>
    <section className="mt-5 rounded-3xl border border-border bg-white p-5 sm:p-8"><div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-bold">賛同した人の声</h2><p className="mt-1 text-sm text-muted-foreground">アンケート回答 {totalAnswers}件</p></div></div><div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2"><CountBreakdown title="希望価格帯" counts={demand.priceCounts} /><CountBreakdown title="利用頻度" counts={demand.frequencyCounts} /></div></section>
    {voting && <VoteDialog demandId={demand.id} onClose={() => setVoting(false)} onSuccess={() => { setVoting(false); load(); }} />}
  </main>;
}

export default DemandDetailPage;
