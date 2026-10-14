import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useTheme } from "../components/theme-provider";
import { SignedIn, SignedOut, SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { useData } from "../context/DataContext";

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { clearAllTopics } = useData();

  const handleClearTopics = async () => {
    if (confirm("Are you sure you want to delete all your topics and progress from the database? This cannot be undone.")) {
      await clearAllTopics();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-y-auto">
      <Header title="Settings" />
      <main className="flex-1 px-4 py-8 sm:px-6 md:px-10">
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

          {/* Account Section */}
          <Card className="p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account</h2>
            <SignedIn>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user?.imageUrl && (
                    <img
                      src={user.imageUrl}
                      alt="Avatar"
                      className="size-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {user?.fullName || user?.firstName || "Signed in"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
                <SignOutButton>
                  <Button variant="outline" size="sm">
                    Sign Out
                  </Button>
                </SignOutButton>
              </div>
            </SignedIn>
            <SignedOut>
              <div className="flex items-center justify-between">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Sign in with Clerk to save and sync your topics across all devices in Supabase.
                </p>
                <SignInButton mode="modal">
                  <Button variant="primary" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
              </div>
            </SignedOut>
          </Card>

          {/* Appearance Section */}
          <Card className="p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
            <div className="flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">Theme</p>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </Button>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <SignedIn>
            <Card className="p-6 flex flex-col gap-4 border-red-200 dark:border-red-900/30">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-gray-900 dark:text-white font-medium">Delete All Topics</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Permanently delete all your topics and progress from Supabase.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                  onClick={handleClearTopics}
                >
                  Delete Topics
                </Button>
              </div>
            </Card>
          </SignedIn>
        </div>
      </main>
    </div>
  );
}
