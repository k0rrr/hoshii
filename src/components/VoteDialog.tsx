import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { submitVote } from "../lib/demands";

const prices = ["〜500円", "501〜1,000円", "1,001〜2,000円", "2,001円以上"];
const frequencies = ["週に数回", "週に1回", "月に数回", "月に1回以下"];

type VoteDialogProps = { demandId: string; onClose: () => void; onSuccess: () => void };

export default function VoteDialog({ demandId, onClose, onSuccess }: VoteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  const [priceRange, setPriceRange] = useState("");
  const [usageFrequency, setUsageFrequency] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !priceRange || !usageFrequency) return;
    submitting.current = true;
    setError(""); setBusy(true);
    try {
      await submitVote({ demandId, priceRange, usageFrequency, comment: comment.trim() });
      onSuccess();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "賛同を登録できませんでした。";
      setError(message.includes("duplicate key") || message.includes("votes_demand_user_unique") ? "この投稿にはすでに賛同しています。" : message);
    } finally { submitting.current = false; setBusy(false); }
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="vote-title" onCancel={(event) => { event.preventDefault(); if (!submitting.current) onClose(); }} className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-end justify-center bg-transparent p-0 backdrop:bg-black/40 open:flex sm:items-center sm:p-4" onClick={(event) => { if (event.target === event.currentTarget && !submitting.current) onClose(); }}>
      <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-primary">需要アンケート</p><h2 id="vote-title" className="mt-1 text-xl font-bold">この需要に賛同する</h2></div><button type="button" aria-label="閉じる" disabled={busy} onClick={() => { if (!submitting.current) onClose(); }} className="rounded-full p-2 hover:bg-muted"><X size={20} /></button></div>
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <fieldset disabled={busy}><legend className="mb-3 font-semibold">希望価格帯</legend><div className="grid grid-cols-2 gap-2">{prices.map((item) => <label key={item} className={`cursor-pointer focus-within:ring-2 focus-within:ring-primary rounded-xl border p-3 text-center text-sm ${priceRange === item ? "border-primary bg-orange-50 text-primary" : "border-border"}`}><input className="sr-only" type="radio" name="price" required value={item} checked={priceRange === item} onChange={() => setPriceRange(item)} />{item}</label>)}</div></fieldset>
          <fieldset disabled={busy}><legend className="mb-3 font-semibold">利用頻度</legend><div className="grid grid-cols-2 gap-2">{frequencies.map((item) => <label key={item} className={`cursor-pointer focus-within:ring-2 focus-within:ring-primary rounded-xl border p-3 text-center text-sm ${usageFrequency === item ? "border-primary bg-orange-50 text-primary" : "border-border"}`}><input className="sr-only" type="radio" name="frequency" required value={item} checked={usageFrequency === item} onChange={() => setUsageFrequency(item)} />{item}</label>)}</div></fieldset>
          <label className="block font-semibold">コメント <span className="font-normal text-muted-foreground">（任意）</span><textarea disabled={busy} className="mt-2 w-full resize-none rounded-xl border border-input p-3 font-normal" rows={3} maxLength={240} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="利用したい理由など" /></label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button disabled={busy || !priceRange || !usageFrequency} className="w-full rounded-full bg-primary px-5 py-3.5 font-bold text-white disabled:opacity-50">{busy ? "登録中…" : "回答して賛同する"}</button>
        </form>
      </section>
    </dialog>
  );
}
