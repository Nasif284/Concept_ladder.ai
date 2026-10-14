import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { cn } from "../lib/utils";
import { useState } from "react";

export function Home() {
  const navigate = useNavigate();
  const { topics, user, deleteTopic } = useData();
  const [inputValue, setInputValue] = useState("");

  const handleGenerate = () => {
    if (inputValue.trim()) {
        navigate(`/input?q=${encodeURIComponent(inputValue)}`);
    } else {
        navigate("/input");
    }
  };

  const getProgressColor = (level) => {
    switch (level) {
      case 'kid': return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
      case 'beginner': return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
      case 'advanced': return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
      case 'completed': return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex w-full h-full">
      <main className="flex-1 overflow-y-auto h-full">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Heading */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex min-w-72 flex-col gap-2">
              <p className="text-[#111418] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                Welcome back, {user?.name ? user.name.split(' ')[0] : 'Explorer'}!
              </p>
              <p className="text-[#617289] dark:text-gray-400 text-base font-normal leading-normal">
                Ready to climb the ladder of knowledge?
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex w-full flex-col gap-4 p-4 md:flex-row">
            <div className="flex h-12 flex-1 flex-col">
              <div className="flex h-full w-full flex-1 items-stretch rounded-lg">
                <div className="flex items-center justify-center rounded-l-lg border-y border-l border-gray-200 bg-white pl-4 dark:border-gray-700 dark:bg-background-dark">
                  <span className="material-symbols-outlined text-[#617289] dark:text-gray-400">search</span>
                </div>
                <Input 
                    className="rounded-l-none border-l-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                    placeholder="What do you want to learn today?" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGenerate();
                    }}
                />
              </div>
            </div>
            <Button onClick={handleGenerate} className="h-12 px-5 text-base font-bold">
              Generate
            </Button>
          </div>

          {/* Recent Topics */}
          <h2 className="text-[#111418] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
            Pick Up Where You Left Off
          </h2>
          
          {topics.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p>No topics yet. Start by generating one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {topics.slice(0, 3).map((topic) => (
                    <Card key={topic.id} className="flex flex-col gap-4 p-4 transition-shadow hover:shadow-lg h-full justify-between relative group">
                        <Link to={`/ladder/${topic.slug}`} className="absolute inset-0 z-0" />
                        <div className="flex justify-between items-start z-10 pointer-events-none">
                             <h3 className="font-semibold text-[#111418] dark:text-white line-clamp-2">{topic.title}</h3>
                             <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    if(confirm('Delete this topic?')) deleteTopic(topic.id);
                                }}
                                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto p-1"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                        <div className="flex items-center justify-between z-10 pointer-events-none">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Last viewed:</p>
                            <span className={cn("rounded-full px-3 py-1 text-xs font-medium capitalize", getProgressColor(topic.progress))}>
                                {topic.progress}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>
          )}

          {/* Suggested Topics */}
          <h2 className="text-[#111418] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-8">Explore New Concepts</h2>
          <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
            {[
                { name: "Blockchain", icon: "hub" },
                { name: "General Relativity", icon: "rocket_launch" },
                { name: "Machine Learning", icon: "neurology" },
                { name: "Stoicism", icon: "self_improvement" }
            ].map((topic) => (
                <Link to={`/input?q=${topic.name}`} key={topic.name}>
                    <Card className="flex cursor-pointer flex-col items-center justify-center gap-3 p-4 text-center transition-shadow hover:shadow-lg h-full">
                        <span className="material-symbols-outlined text-3xl text-primary">{topic.icon}</span>
                        <p className="text-sm font-medium text-[#111418] dark:text-white">{topic.name}</p>
                    </Card>
                </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
