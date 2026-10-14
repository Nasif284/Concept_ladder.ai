import { Header } from "../components/layout/Header";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { motion } from "framer-motion";

export function TopicInput() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addTopic, isLoading } = useData();
  const [topic, setTopic] = useState("");

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setTopic(query);
      handleGenerate(query);
    }
  }, [searchParams]);

  const handleGenerate = async (targetTopic) => {
    if (isLoading) return;
    // Safely use string argument or fall back to input state
    const topicToUse = typeof targetTopic === "string" ? targetTopic : topic;
    const cleanTopic = topicToUse?.trim();

    if (cleanTopic) {
      const newTopic = await addTopic(cleanTopic);
      if (newTopic) {
        navigate(`/ladder/${newTopic.slug}`);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleGenerate(topic);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background-light dark:bg-background-dark overflow-y-auto">
      <Header />
      <main className="flex flex-1 justify-center py-16 px-4">
        <div className="flex flex-col items-center max-w-2xl w-full text-center">
          <h1 className="text-slate-900 dark:text-white text-4xl font-bold leading-tight tracking-tight px-4 pb-3 pt-6">
            Start a New Ladder
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-normal leading-normal pb-8 pt-1 px-4">
            What concept do you want to explore?
          </p>
          <div className="w-full max-w-lg mb-6 relative">
            <Input
              className="h-14 text-base shadow-sm pr-12"
              placeholder="e.g., Quantum Computing, Photosynthesis, Blockchain..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                />
              </div>
            )}
          </div>
          <Button
            onClick={() => handleGenerate(topic)}
            size="lg"
            className="px-8 text-base font-semibold shadow-lg shadow-primary/30 min-w-[160px]"
            disabled={isLoading || !topic.trim()}
          >
            {isLoading ? "Generating..." : "Generate Ladder"}
          </Button>

          <div className="flex gap-3 pt-12 flex-wrap justify-center items-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-1">
              Or try a trending topic:
            </p>
            {["AI", "History", "Economics"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTopic(t);
                  handleGenerate(t);
                }}
                className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-slate-200/80 dark:bg-slate-800 px-4 hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
              >
                <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal">
                  {t}
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>
      <footer className="flex items-center justify-center py-6 px-10 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <a href="#" className="hover:text-primary dark:hover:text-primary transition-colors">
            About
          </a>
          <a href="#" className="hover:text-primary dark:hover:text-primary transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-primary dark:hover:text-primary transition-colors">
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
