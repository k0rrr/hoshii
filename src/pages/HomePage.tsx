import { RequestVersion } from "../lib/requestVersion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, RefreshCw } from "lucide-react";
import DemandCard from "../components/DemandCard";
import { listDemands, type Demand } from "../lib/demands";
import { useRegion } from "../contexts/RegionContext";
import { useAuth } from "../auth/AuthContext";

const categories = ["すべて", "飲食", "カフェ", "ジム", "買い物", "その他"];
type Sort = "new" | "popular";

function HomePage() {
  const { region } = useRegion();
  const { user } = useAuth();
  const [sort, setSort] = useState<Sort>("new");
  const [category, setCategory] = useState("すべて");
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requests = useRef(new RequestVersion());
  const load = useCallback(() => {
    const isCurrent = requests.current.next();
    setLoading(true); setError("");
    void listDemands({ area: region, category, sort, viewerId: user?.id })
      .then((items) => { if (isCurrent()) setDemands(items); })
      .catch(() => { if (isCurrent()) setError("投稿を読み込めませんでした。"); })
      .finally(() => { if (isCurrent()) setLoading(false); });
  }, [region, category, sort, user?.id]);

  useEffect(() => {
    load();
    return () => requests.current.cancel();
  }, [load]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 pb-28 sm:px-5 md:px-8">
      <section className="mt-4 flex flex-col gap-5 rounded-3xl bg-orange-50 p-5 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div><p className="text-sm font-bold text-primary">まちの声を、次のお店へ。</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">この街に、何が欲しい？</h1><p className="mt-2 text-sm text-muted-foreground">近所のみんなの「欲しい」を見てみよう</p></div>
        <Link to="/post" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-primary px-6 text-base font-bold text-white"><Plus className="mr-1 h-5 w-5" />欲しいものを投稿</Link>
      </section>

      <section className="mt-8" aria-labelledby="feed-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 id="feed-heading" className="text-xl font-bold">{region === "すべて" ? "みんなの投稿" : `${region}の投稿`}</h2><p className="mt-1 text-sm text-muted-foreground">投稿の新しさや賛同数で並び替えできます。</p></div>
          <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm"><Search className="h-4 w-4 text-muted-foreground" /><span className="sr-only">カテゴリで絞り込み</span><select aria-label="カテゴリで絞り込み" value={category} onChange={(event) => setCategory(event.target.value)} className="bg-transparent outline-none"><option value="すべて">すべてのカテゴリ</option>{categories.slice(1).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" aria-label="投稿の並び替え">
          {[{ id: "new" as const, label: "新着" }, { id: "popular" as const, label: "人気" }].map((tab) => <button key={tab.id} type="button" aria-pressed={sort === tab.id} className={`rounded-full border px-5 py-2 text-sm font-semibold ${sort === tab.id ? "border-primary bg-primary text-white" : "border-border bg-white"}`} onClick={() => setSort(tab.id)}>{tab.label}</button>)}
        </div>

        {loading ? <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="読み込み中">{[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-border bg-white p-5"><div className="h-4 w-24 rounded bg-muted" /><div className="mt-6 h-5 w-4/5 rounded bg-muted" /><div className="mt-3 h-4 w-2/3 rounded bg-muted" /><div className="mt-8 h-10 rounded bg-muted" /></div>)}</div>
          : error ? <div className="mt-6 rounded-2xl border border-border bg-white p-6 text-center"><p role="alert" className="text-sm text-destructive">投稿を読み込めませんでした。</p><button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold"><RefreshCw size={16} />もう一度読み込む</button></div>
          : demands.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-border bg-white px-5 py-12 text-center"><p className="text-lg font-bold">まだ投稿がありません</p><p className="mt-2 text-sm text-muted-foreground">最初の「欲しい」を投稿してみましょう。</p><Link to="/post" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 font-bold text-white">投稿する</Link></div>
          : <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{demands.map((demand) => <DemandCard key={demand.id} demand={demand} onVoted={load} />)}</div>}
      </section>
    </main>
  );
}

export default HomePage;
