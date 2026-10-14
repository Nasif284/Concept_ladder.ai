import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { useData } from "../context/DataContext";
import { marked } from 'marked';

export function Ladder() {
  const { topic: topicSlug } = useParams();
  const navigate = useNavigate();
  const { getTopic, unlockLevel, completeLevel } = useData();
  const [topicData, setTopicData] = useState(null);
  const [expandedLevel, setExpandedLevel] = useState("kid");

  useEffect(() => {
    const data = getTopic(topicSlug);
    if (!data) {
        // If topic doesn't exist, redirect to input
        navigate("/input");
    } else {
        setTopicData(data);
        if (data.levels.advanced.unlocked) setExpandedLevel("advanced");
        else if (data.levels.beginner.unlocked) setExpandedLevel("beginner");
        else setExpandedLevel("kid");
    }
  }, [topicSlug, getTopic, navigate]);

  if (!topicData) return null;

  const handleUnlockNext = (currentLevelId) => {
    if (currentLevelId === 'kid') {
        unlockLevel(topicData.id, 'beginner');
        setExpandedLevel('beginner');
    } else if (currentLevelId === 'beginner') {
        unlockLevel(topicData.id, 'advanced');
        setExpandedLevel('advanced');
    }
    // Refresh local state
    setTopicData(getTopic(topicSlug));
  };

  const levelOrder = ['kid', 'beginner', 'advanced'];

  return (
    <div className="flex flex-col h-full w-full bg-background-light dark:bg-background-dark overflow-y-auto">
      <Header showBack />
      <main className="flex-1 px-4 py-8 sm:px-6 md:px-10">
        <div className="flex flex-wrap justify-between gap-4 p-4">
          <div className="flex min-w-72 flex-col gap-2">
            <p className="text-gray-900 dark:text-gray-50 text-4xl font-black leading-tight tracking-[-0.033em]">
              Understanding {topicData.title}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
              Start from the beginning or jump to a level that suits you.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Progress / Steps Sidebar */}
          <div className="grid grid-cols-[auto_1fr] gap-x-4 h-fit md:w-72 md:shrink-0">
            {levelOrder.map((levelId, index) => {
              const level = topicData.levels[levelId];
              const isUnlocked = level.unlocked;
              
              return (
              <div key={levelId} className="contents group cursor-pointer" onClick={() => isUnlocked && setExpandedLevel(levelId)}>
                <div className="flex flex-col items-center gap-1 pt-3">
                  {index > 0 && <div className="w-[2px] bg-gray-300 dark:bg-gray-600 h-2"></div>}
                  <div className={cn(
                    "size-7 flex items-center justify-center rounded-full transition-colors",
                    expandedLevel === levelId ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800",
                    isUnlocked ? "text-primary" : "text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600"
                  )}>
                    <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {levelId === 'kid' ? 'child_care' : levelId === 'beginner' ? 'school' : 'science'}
                    </span>
                  </div>
                  {index < levelOrder.length - 1 && <div className="w-[2px] bg-gray-300 dark:bg-gray-600 h-full grow min-h-[40px]"></div>}
                </div>
                <div className={cn("flex flex-1 flex-col pt-3 pb-12", index === levelOrder.length - 1 && "pb-0")}>
                  <p className={cn("text-base font-medium leading-normal transition-colors", expandedLevel === levelId ? "text-primary" : "text-gray-900 dark:text-gray-50")}>
                    {level.title}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                    {level.subtitle}
                  </p>
                </div>
              </div>
            )})}
          </div>

          {/* Cards Area */}
          <div className="flex-1 flex flex-col gap-8">
            {levelOrder.map((levelId) => {
              const level = topicData.levels[levelId];
              const isUnlocked = level.unlocked;
              const isExpanded = expandedLevel === levelId;

              return (
              <motion.div
                key={levelId}
                layout
                initial={{ opacity: 0.8 }}
                animate={{ 
                    opacity: isUnlocked ? 1 : 0.6,
                    scale: isExpanded ? 1 : 0.98
                }}
                className={cn(
                    "flex flex-col items-stretch justify-start rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden transition-all",
                    isExpanded ? "ring-2 ring-primary ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark" : "hover:shadow-md"
                )}
                onClick={() => isUnlocked && setExpandedLevel(levelId)}
              >
                <div className="flex flex-col lg:flex-row">
                    <div 
                        className="w-full lg:w-1/3 bg-center bg-no-repeat aspect-video lg:aspect-auto lg:min-h-[200px] bg-cover" 
                        style={{ backgroundImage: `url('${level.image}')` }}
                    ></div>
                    <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-1 p-4 lg:p-6">
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal tracking-wider uppercase">
                            LEVEL {levelId === 'kid' ? 1 : levelId === 'beginner' ? 2 : 3}
                        </p>
                        <p className="text-gray-900 dark:text-gray-50 text-xl font-bold leading-tight tracking-[-0.015em]">
                            {level.title}
                        </p>
                        
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex flex-col gap-4 mt-2 pt-2">
                                        <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                                            {level.description}
                                        </p>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto">
                                            <div 
                                                className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: marked.parse(level.content) }}
                                            />
                                        </div>
                                        
                                        <div className="flex justify-end">
                                            {levelId !== 'advanced' ? (
                                                <Button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUnlockNext(levelId);
                                                    }}
                                                    className="w-full sm:w-auto"
                                                >
                                                    Complete & Unlock Next Level
                                                </Button>
                                            ) : (
                                                <Button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        completeLevel(topicData.id, 'advanced');
                                                        // Force refresh
                                                        setTopicData(prev => ({
                                                            ...prev,
                                                            levels: {
                                                                ...prev.levels,
                                                                advanced: { ...prev.levels.advanced, completed: true }
                                                            },
                                                            progress: 'completed'
                                                        }));
                                                    }}
                                                    disabled={level.completed}
                                                    className="w-full sm:w-auto"
                                                    variant={level.completed ? "outline" : "primary"}
                                                >
                                                    {level.completed ? "Ladder Completed!" : "Complete Ladder"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {!isExpanded && (
                             <div className="mt-2 flex items-center justify-between">
                                <p className="text-gray-500 dark:text-gray-400 text-sm truncate">Click to expand...</p>
                                {!isUnlocked && <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">Locked</span>}
                             </div>
                        )}
                    </div>
                </div>
              </motion.div>
            )})}
          </div>
        </div>
      </main>
    </div>
  );
}
