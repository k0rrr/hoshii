import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useRegion, REGIONS, type Region } from "../contexts/RegionContext";
import { createDemand } from "../lib/demands";

const categories = ["飲食", "カフェ", "ジム", "買い物", "その他"];

function PostPage() {
  const { user } = useAuth();
  const { region, setRegion } = useRegion();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<Region>(region === "すべて" ? "水戸駅周辺" : region);
  const [category, setCategory] = useState("飲食");
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const canProceed = title.trim().length > 0 && reason.trim().length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { navigate("/login", { state: { from: { pathname: "/post" } } }); return; }
    setSaving(true); setError("");
    try {
      await createDemand({ title: title.trim(), area, category, description: reason.trim() }, user);
      setRegion(area);
      navigate("/", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "投稿を保存できませんでした。時間をおいて再度お試しください。");
    } finally { setSaving(false); }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 pb-28 sm:px-5 md:px-8">
      <button type="button" onClick={() => step === 2 ? setStep(1) : navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={18} />戻る</button>
      <div className="mb-8"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">欲しいものを投稿</h1><span className="text-sm text-muted-foreground">STEP {step} / 2</span></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-primary transition-all" style={{ width: step === 1 ? "50%" : "100%" }} /></div></div>
      {step === 1 ? <form onSubmit={(event) => { event.preventDefault(); if (canProceed) setStep(2); }} className="space-y-7">
        <div><label htmlFor="title" className="mb-2 block font-semibold">何が欲しい？</label><input id="title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：駅前に24時間ジムがほしい" maxLength={80} required className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary" /><p className="mt-2 text-right text-xs text-muted-foreground">{title.length} / 80</p></div>
        <div><label htmlFor="area" className="mb-2 block font-semibold">どこに欲しい？</label><select id="area" value={area} onChange={(event) => setArea(event.target.value as Region)} className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary">{REGIONS.map((item) => <option key={item}>{item}</option>)}</select></div>
        <fieldset><legend className="mb-3 font-semibold">カテゴリ</legend><div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`rounded-full border px-5 py-2.5 text-sm font-medium ${category === item ? "border-primary bg-orange-50 text-primary" : "border-border bg-white"}`}>{item}</button>)}</div></fieldset>
        <div><label htmlFor="reason" className="mb-2 block font-semibold">欲しい理由</label><textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="どんなときに利用したいか教えてください" rows={5} maxLength={300} required className="w-full resize-none rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary" /><p className="mt-2 text-right text-xs text-muted-foreground">{reason.length} / 300</p></div>
        <button type="submit" disabled={!canProceed} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">確認画面へ進む<ArrowRight size={19} /></button>
      </form> : <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-xl font-bold">投稿内容の確認</h2><div className="space-y-5 rounded-2xl border border-border bg-white p-5"><div><p className="mb-1 text-xs text-muted-foreground">タイトル</p><p className="font-semibold">{title}</p></div><div><p className="mb-1 text-xs text-muted-foreground">地域</p><p>{area}</p></div><div><p className="mb-1 text-xs text-muted-foreground">カテゴリ</p><p>{category}</p></div><div><p className="mb-1 text-xs text-muted-foreground">欲しい理由</p><p className="whitespace-pre-wrap">{reason}</p></div></div>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-destructive">投稿できませんでした。ログイン状態と通信を確認して、もう一度お試しください。</p>}
        <button disabled={saving} type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-bold text-white disabled:opacity-60"><Check size={19} />{saving ? "投稿中…" : "この内容で投稿する"}</button>
        <button type="button" onClick={() => setStep(1)} className="w-full py-2 text-sm text-muted-foreground">入力内容を修正する</button>
      </form>}
    </main>
  );
}

export default PostPage;
