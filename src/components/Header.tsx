import { MapPin, ChevronDown, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DesktopNavigation from "./DesktopNavigation";
import { useAuth } from "../auth/AuthContext";
import { useRegion } from "../contexts/RegionContext";
import { REGIONS } from "../contexts/RegionContext";

function Header() {
  const { user, signOut } = useAuth();
  const { region, setRegion } = useRegion();
  const navigate = useNavigate();

  async function handleSignOut() {
    const error = await signOut();
    if (error) window.alert(`ログアウトできませんでした: ${error}`);
    else navigate("/");
  }

  return (
    <header className="flex items-center justify-between gap-2">
      <Link to="/" className="font-display text-2xl font-extrabold text-primary sm:text-3xl">HOSHII</Link>
      <div className="flex items-center gap-2 sm:gap-5">
        <DesktopNavigation />
        <label className="flex min-w-0 items-center gap-1 rounded-full border border-border px-2 py-2 sm:gap-2 sm:px-3">
          <MapPin className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
          <span className="sr-only">地域を選択</span>
          <select aria-label="地域を選択" value={region} onChange={(event) => setRegion(event.target.value as typeof region)} className="max-w-28 bg-transparent text-xs font-semibold outline-none sm:max-w-36 sm:text-sm">
            <option value="すべて">すべての地域</option>
            {REGIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
        </label>
        {user ? (
          <button type="button" onClick={() => void handleSignOut()} className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-2 text-xs font-semibold sm:px-3 sm:text-sm">
            <LogOut className="h-4 w-4" /><span>ログアウト</span>
          </button>
        ) : (
          <Link to="/login" className="shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground sm:px-4 sm:text-sm">ログイン</Link>
        )}
      </div>
    </header>
  );
}

export default Header;
