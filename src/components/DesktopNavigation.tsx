
import { NavLink } from "react-router-dom";

const tabs = [
  { path: "/", label: "ホーム" },
  { path: "/map", label: "マップ" },
  { path: "/post", label: "投稿" },
  { path: "/mypage", label: "マイページ" },
];

function DesktopNavigation() {
  return (
    <nav
      aria-label="PC用ナビゲーション"
      className="hidden items-center gap-6 md:flex"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end
          className={({ isActive }) =>
            isActive
              ? "font-bold text-primary"
              : "text-muted-foreground hover:text-foreground"
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default DesktopNavigation;
