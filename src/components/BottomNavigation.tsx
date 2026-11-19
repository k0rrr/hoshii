
import { NavLink } from "react-router-dom";
import { House, Map, Plus, UserRound } from "lucide-react";

const tabs = [
  { path: "/", label: "ホーム", icon: House },
  { path: "/map", label: "マップ", icon: Map },
  { path: "/post", label: "投稿", icon: Plus },
  { path: "/mypage", label: "マイページ", icon: UserRound },
];

function BottomNavigation() {
  return (
    <nav
      aria-label="メインナビゲーション"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white md:hidden"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-1 py-3 ${
                  isActive
                    ? "font-bold text-primary"
                    : "text-muted-foreground"
                }`
              }
            >
              <Icon size={23} strokeWidth={2} />
              <span className="text-xs">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;
