import { RequestVersion } from "../lib/requestVersion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, RefreshCw } from "lucide-react";
import { listDemands, type Demand } from "../lib/demands";
import { useRegion, REGIONS } from "../contexts/RegionContext";

function MapPage() {
  const navigate = useNavigate();
  const { setRegion } = useRegion();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requests = useRef(new RequestVersion());
  const load = useCallback(() => {
    const isCurrent = requests.current.next();
    setLoading(true); setError("");
    void listDemands().then((items) => { if (isCurrent()) setDemands(items); }).catch(() => { if (isCurrent()) setError("投稿を読み込めませんでした。時間をおいて再度お試しください。"); }).finally(() => { if (isCurrent()) setLoading(false); });
  }, []);
  useEffect(() => {
    load();
    return () => requests.current.cancel();
  }, [load]);
  const counts = new Map(REGIONS.map((region) => [region, demands.filter((item) => item.area === region).length]));

  return <main className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-5 md:px-8"><h1 className="text-2xl font-bold">地域から探す</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">位置情報のない投稿は地図に置かず、地域ごとに表示します。エリアを選ぶと、その地域の投稿一覧を開きます。</p>
    {loading ? <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{REGIONS.map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-muted" />)}</div> : error ? <div className="mt-6 rounded-2xl border border-border bg-white p-6 text-center"><p role="alert" className="text-sm text-destructive">{error}</p><button onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><RefreshCw size={16} />再読み込み</button></div> : <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{REGIONS.map((region) => <button key={region} type="button" onClick={() => { setRegion(region); navigate("/"); }} className="rounded-2xl border border-border bg-white p-5 text-left transition-colors hover:border-primary"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-primary"><MapPin /></span><span className="mt-4 block font-bold">{region}</span><span className="mt-1 block text-sm text-muted-foreground">需要 {counts.get(region) ?? 0} 件</span></button>)}</div>}
  </main>;
}

export default MapPage;
