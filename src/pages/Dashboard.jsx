import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useData } from "../context/DataContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export function Dashboard() {
  const { topics, deleteTopic } = useData();

  // Calculate Overall Stats
  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.progress === "completed").length;
  const inProgressTopics = topics.filter(
    (t) => t.progress !== "kid" && t.progress !== "completed"
  ).length;
  const favoriteTopics = topics.filter((t) => t.isFavorite).length;

  // Prepare Pie Chart Data
  const statusData = [
    {
      name: "Kid Level",
      value: topics.filter((t) => t.progress === "kid").length,
      color: "#22c55e",
    },
    {
      name: "Beginner",
      value: topics.filter((t) => t.progress === "beginner").length,
      color: "#3b82f6",
    },
    {
      name: "Advanced",
      value: topics.filter((t) => t.progress === "advanced").length,
      color: "#ef4444",
    },
    {
      name: "Completed",
      value: topics.filter((t) => t.progress === "completed").length,
      color: "#a855f7",
    },
  ].filter((d) => d.value > 0);

  // Calculate Weekly Activity (Last 7 days)
  const activityData = [];
  const today = new Date();
  let totalWeekActivity = 0;

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });

    const count = topics.filter((t) => {
      if (!t.lastAccessed) return false;
      const topicDate = new Date(t.lastAccessed);
      return topicDate.toDateString() === date.toDateString();
    }).length;

    totalWeekActivity += count;
    activityData.push({ name: dayLabel, topics: count });
  }

  const StatCard = ({ title, value, icon, colorClass, bgClass }) => (
    <Card className="p-4 sm:p-5 flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
          {title}
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
          {value}
        </p>
      </div>
      <div className={`p-2.5 sm:p-3 rounded-xl ${bgClass} shrink-0`}>
        <span className={`material-symbols-outlined text-xl sm:text-2xl ${colorClass}`}>
          {icon}
        </span>
      </div>
    </Card>
  );

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-y-auto">
      <Header title="Dashboard" />
      <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 lg:px-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8">
          {/* Header Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Learning Overview
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Monitor your curriculum progression and weekly study activity
              </p>
            </div>
            <Link to="/input">
              <Button size="sm" className="gap-1.5 shadow-sm text-sm">
                <span className="material-symbols-outlined text-base">add</span>
                <span>New Ladder</span>
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Total Topics"
              value={totalTopics}
              icon="library_books"
              colorClass="text-blue-600 dark:text-blue-400"
              bgClass="bg-blue-50 dark:bg-blue-900/20"
            />
            <StatCard
              title="In Progress"
              value={inProgressTopics}
              icon="trending_up"
              colorClass="text-amber-600 dark:text-amber-400"
              bgClass="bg-amber-50 dark:bg-amber-900/20"
            />
            <StatCard
              title="Completed"
              value={completedTopics}
              icon="trophy"
              colorClass="text-purple-600 dark:text-purple-400"
              bgClass="bg-purple-50 dark:bg-purple-900/20"
            />
            <StatCard
              title="Favorites"
              value={favoriteTopics}
              icon="favorite"
              colorClass="text-rose-600 dark:text-rose-400"
              bgClass="bg-rose-50 dark:bg-rose-900/20"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic Status Distribution Card */}
            <Card className="p-5 sm:p-6 flex flex-col justify-between shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Topic Mastery Distribution
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Current distribution across depth tiers
                </p>
              </div>

              {statusData.length > 0 ? (
                <div className="w-full h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                          borderRadius: "0.5rem",
                          color: "#fff",
                        }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center my-auto">
                  <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <span className="material-symbols-outlined text-3xl">donut_small</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    No Learning Progress Yet
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1.5 leading-relaxed">
                    Once you generate concepts and advance through Kid, Beginner, and Advanced tiers, your mastery spread will appear here.
                  </p>
                  <Link to="/input" className="mt-4">
                    <Button size="sm" variant="secondary" className="text-xs font-semibold">
                      Explore a Topic
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* Weekly Activity Card */}
            <Card className="p-5 sm:p-6 flex flex-col justify-between shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Weekly Activity
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Topic sessions visited over the last 7 days
                </p>
              </div>

              {totalWeekActivity > 0 ? (
                <div className="w-full h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={12}
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(100, 116, 139, 0.1)" }}
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                          borderRadius: "0.5rem",
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="topics"
                        name="Topics Studied"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center my-auto">
                  <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-3xl">bar_chart</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    No Activity This Week
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1.5 leading-relaxed">
                    Study sessions and ladder completions over the past 7 days will be logged here automatically.
                  </p>
                  <Link to="/" className="mt-4">
                    <Button size="sm" variant="secondary" className="text-xs font-semibold">
                      Browse Curriculum
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Resume Section */}
          {topics.length > 0 && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Recent Topics
                </h3>
                <Link
                  to="/topics"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {topics.slice(0, 3).map((topic) => (
                  <Card
                    key={topic.id}
                    className="p-4 flex flex-col justify-between gap-3 transition-shadow hover:shadow-md border border-gray-100 dark:border-gray-800 group relative"
                  >
                    <Link to={`/ladder/${topic.slug}`} className="absolute inset-0 z-0" />
                    <div className="flex justify-between items-start z-10 pointer-events-none">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                        {topic.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm("Delete this topic?")) deleteTopic(topic.id);
                        }}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto p-1"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 z-10 pointer-events-none">
                      <span className="capitalize font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {topic.progress} level
                      </span>
                      <span>
                        {topic.lastAccessed
                          ? new Date(topic.lastAccessed).toLocaleDateString()
                          : "Recently"}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
