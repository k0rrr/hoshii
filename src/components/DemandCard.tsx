import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Soup, Coffee, Dumbbell, ShoppingBag, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../auth/AuthContext";
import type { Demand } from "../lib/demands";
import { formatRelativeTime } from "../lib/format";
import VoteDialog from "./VoteDialog";

type DemandCardProps = { demand: Demand; onVoted?: (id: string) => void };

function iconFor(category: string) {
  switch (category) {
    case "飲食": return <Soup className="h-8 w-8 text-primary" />;
    case "カフェ": return <Coffee className="h-8 w-8 text-green-700" />;
    case "ジム": return <Dumbbell className="h-8 w-8 text-primary" />;
    case "買い物": return <ShoppingBag className="h-8 w-8 text-primary" />;
    default: return <MapPin className="h-8 w-8 text-primary" />;
  }
}

function DemandCard({ demand, onVoted }: DemandCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [voting, setVoting] = useState(false);
  const [submittedBy, setSubmittedBy] = useState<string | null>(null);
  const hasVoted = demand.hasVoted || Boolean(user && submittedBy === user.id);

  function openVote() {
    if (hasVoted) return;
    if (!user) { navigate("/login", { state: { from: location } }); return; }
    setVoting(true);
  }

  return (
    <article className="rounded-card border border-border bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 font-bold text-primary">{demand.author.trim().charAt(0) || "H"}</div><p className="min-w-0 truncate text-sm text-muted-foreground">{demand.author} ・ {formatRelativeTime(demand.created_at)}</p></div>
      <div className="mt-4 flex items-start gap-3"><div className="min-w-0 flex-1"><Link to={`/demands/${demand.id}`} className="font-semibold leading-relaxed hover:text-primary">{demand.title}</Link><p className="mt-2 text-xs text-muted-foreground">{demand.area} ・ {demand.category}</p></div><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-50">{iconFor(demand.category)}</div></div>
      <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-6">{demand.description}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><div className="flex items-center gap-1.5 text-sm"><Heart className="h-4 w-4 text-primary" /><span>賛同 {demand.supporterCount}人</span></div><div className="flex items-center gap-2"><Link to={`/demands/${demand.id}`} className="px-2 py-2 text-sm font-semibold text-muted-foreground">詳細</Link><Button disabled={hasVoted} className="rounded-full px-4" onClick={openVote}>{hasVoted ? "賛同済み" : "需要あり！"}</Button></div></div>
      {voting && <VoteDialog demandId={demand.id} onClose={() => setVoting(false)} onSuccess={() => { setVoting(false); setSubmittedBy(user?.id ?? null); onVoted?.(demand.id); }} />}
    </article>
  );
}

export default DemandCard;
