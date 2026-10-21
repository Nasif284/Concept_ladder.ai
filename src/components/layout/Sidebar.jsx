import { Link, useLocation } from "react-router-dom";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/topics", label: "My Topics", icon: "menu_book" },
  { to: "/favorites", label: "Favorites", icon: "favorite" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar({ className }) {
  const location = useLocation();

  return (
    <aside className={cn("flex h-screen w-64 flex-col border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-background-dark sticky top-0", className)}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-3">
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-primary/10 flex items-center justify-center text-primary font-bold">
            CL
          </div>
          <div className="flex flex-col">
            <h1 className="text-[#111418] dark:text-white text-base font-medium leading-normal">Concept Ladder</h1>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  isActive
                    ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-white font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-white/10 text-[#111418] dark:text-gray-300"
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined",
                    isActive
                      ? "text-primary dark:text-white filled"
                      : "text-[#111418] dark:text-gray-300"
                  )}
                >
                  {item.icon}
                </span>
                <p className="text-sm font-medium leading-normal">{item.label}</p>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-1 border-t border-gray-100 dark:border-gray-800 pt-3">
        <SignedIn>
          <UserProfileItem />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-primary hover:bg-primary/5 transition-colors text-sm font-medium w-full text-left">
              <span className="material-symbols-outlined text-xl">login</span>
              <span>Sign In</span>
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </aside>
  );
}

function UserProfileItem() {
  const { user } = useUser();
  const displayName = user?.fullName || user?.firstName || user?.username || "Learner";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-lg overflow-hidden">
      {user?.imageUrl ? (
        <img
          src={user.imageUrl}
          alt={displayName}
          className="size-8 rounded-full object-cover shrink-0"
        />
      ) : (
        <span className="material-symbols-outlined text-[#111418] dark:text-gray-300">
          account_circle
        </span>
      )}
      <div className="flex flex-col min-w-0">
        <p className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-tight truncate">
          {displayName}
        </p>
        {email && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {email}
          </p>
        )}
      </div>
    </div>
  );
}
