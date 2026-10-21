import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/topics", label: "My Topics", icon: "menu_book" },
  { to: "/favorites", label: "Favorites", icon: "favorite" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-background-dark/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 px-1 py-1.5 flex items-center justify-around shadow-lg">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors flex-1 min-w-0",
              isActive
                ? "text-primary dark:text-primary font-semibold"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined text-[22px] transition-transform",
                isActive ? "scale-110 filled" : ""
              )}
            >
              {item.icon}
            </span>
            <span className="text-[11px] leading-tight truncate mt-0.5">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
