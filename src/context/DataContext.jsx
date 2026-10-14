import { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { generateTopicContent } from "../lib/generator";
import { createClerkSupabaseClient } from "../lib/supabase";

const DataContext = createContext({
  topics: [],
  user: null,
  addTopic: async () => {},
  getTopic: () => {},
  unlockLevel: () => {},
  completeLevel: () => {},
  deleteTopic: () => {},
  toggleFavorite: () => {},
  clearAllTopics: async () => {},
  isLoading: false,
});

export function DataProvider({ children }) {
  const { session, isSignedIn } = useSession();
  const { user: clerkUser } = useUser();

  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const processingRef = useRef(new Set());

  // Supabase client dynamically authorized with the active Clerk session JWT
  const supabase = useMemo(() => {
    return createClerkSupabaseClient(session);
  }, [session]);

  // Sync Clerk user profile into Supabase 'profiles' table & load topics
  useEffect(() => {
    let isCancelled = false;

    if (!isSignedIn || !clerkUser || !session) {
      setTopics([]);
      return;
    }

    async function initUserData() {
      setIsLoading(true);
      try {
        // 1. Sync User Profile into Supabase 'profiles' table
        const profileData = {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          full_name: clerkUser.fullName || clerkUser.firstName || "Explorer",
          avatar_url: clerkUser.imageUrl || "",
          updated_at: new Date().toISOString(),
        };

        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(profileData, { onConflict: "id" });

        if (profileError && profileError.code !== "PGRST205") {
          console.warn("[Supabase] Profile sync notice:", profileError.message);
        }

        // 2. Fetch Topics from Supabase for this user
        const { data: dbTopics, error: topicsError } = await supabase
          .from("topics")
          .select("*")
          .order("last_accessed", { ascending: false });

        if (topicsError) {
          if (topicsError.code === "PGRST205") {
            console.warn(
              "[Supabase] Tables not found yet. Please run 'supabase/schema.sql' in your Supabase SQL Editor."
            );
          } else {
            console.error("[Supabase] Failed to fetch topics:", topicsError.message);
          }
          return;
        }

        if (!isCancelled && dbTopics) {
          const formatted = dbTopics.map((row) => ({
            id: row.id,
            title: row.title,
            slug: row.slug,
            progress: row.progress,
            isFavorite: row.is_favorite,
            lastAccessed: row.last_accessed,
            levels: row.levels,
          }));
          setTopics(formatted);
        }
      } catch (err) {
        console.error("[Supabase] Data initialization error:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    initUserData();

    return () => {
      isCancelled = true;
    };
  }, [isSignedIn, clerkUser, session, supabase]);

  // Add Topic: AI generates content -> Persisted directly to Supabase
  const addTopic = async (topicName) => {
    const normalizedName = topicName.trim().toLowerCase();

    if (processingRef.current.has(normalizedName)) {
      return topics.find((t) => t.title.toLowerCase() === normalizedName);
    }

    setIsLoading(true);
    processingRef.current.add(normalizedName);

    try {
      const existingTopic = topics.find(
        (t) => t.title.toLowerCase() === normalizedName
      );

      if (existingTopic) {
        setTopics((prev) => [
          existingTopic,
          ...prev.filter((t) => t.title.toLowerCase() !== normalizedName),
        ]);
        return existingTopic;
      }

      const newTopic = await generateTopicContent(topicName);

      // Persist to Supabase if authenticated
      if (isSignedIn && clerkUser) {
        const { error } = await supabase.from("topics").insert({
          id: newTopic.id,
          user_id: clerkUser.id,
          title: newTopic.title,
          slug: newTopic.slug,
          progress: newTopic.progress,
          is_favorite: newTopic.isFavorite,
          last_accessed: newTopic.lastAccessed,
          levels: newTopic.levels,
        });

        if (error) {
          console.warn("[Supabase] Insert topic error:", error.message);
        }
      }

      setTopics((prev) => [newTopic, ...prev]);
      return newTopic;
    } finally {
      processingRef.current.delete(normalizedName);
      setIsLoading(false);
    }
  };

  const getTopic = (identifier) => {
    return topics.find((t) => t.id === identifier || t.slug === identifier);
  };

  const unlockLevel = async (topicId, levelId) => {
    setTopics((prev) => {
      const topicIndex = prev.findIndex((t) => t.id === topicId);
      if (topicIndex === -1) return prev;

      const updatedTopics = [...prev];
      const topic = { ...updatedTopics[topicIndex] };

      if (topic.levels[levelId]) {
        topic.levels[levelId] = { ...topic.levels[levelId], unlocked: true };
      }

      if (levelId === "beginner" && topic.progress === "kid") topic.progress = "beginner";
      if (levelId === "advanced" && topic.progress === "beginner") topic.progress = "advanced";

      topic.lastAccessed = new Date().toISOString();
      updatedTopics[topicIndex] = topic;

      if (isSignedIn) {
        supabase
          .from("topics")
          .update({
            levels: topic.levels,
            progress: topic.progress,
            last_accessed: topic.lastAccessed,
          })
          .eq("id", topicId)
          .then(({ error }) => {
            if (error) console.warn("[Supabase] Unlock level update error:", error.message);
          });
      }

      return updatedTopics;
    });
  };

  const completeLevel = async (topicId, levelId) => {
    setTopics((prev) => {
      const topicIndex = prev.findIndex((t) => t.id === topicId);
      if (topicIndex === -1) return prev;

      const updatedTopics = [...prev];
      const topic = { ...updatedTopics[topicIndex] };

      if (topic.levels[levelId]) {
        topic.levels[levelId] = { ...topic.levels[levelId], completed: true };
      }

      if (levelId === "advanced") {
        topic.progress = "completed";
      }

      topic.lastAccessed = new Date().toISOString();
      updatedTopics[topicIndex] = topic;

      if (isSignedIn) {
        supabase
          .from("topics")
          .update({
            levels: topic.levels,
            progress: topic.progress,
            last_accessed: topic.lastAccessed,
          })
          .eq("id", topicId)
          .then(({ error }) => {
            if (error) console.warn("[Supabase] Complete level update error:", error.message);
          });
      }

      return updatedTopics;
    });
  };

  const deleteTopic = async (id) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));

    if (isSignedIn) {
      const { error } = await supabase.from("topics").delete().eq("id", id);
      if (error) console.warn("[Supabase] Delete topic error:", error.message);
    }
  };

  const toggleFavorite = async (id) => {
    setTopics((prev) => {
      let nextFav = false;
      const updatedTopics = prev.map((t) => {
        if (t.id === id) {
          nextFav = !t.isFavorite;
          return { ...t, isFavorite: nextFav };
        }
        return t;
      });

      if (isSignedIn) {
        supabase
          .from("topics")
          .update({ is_favorite: nextFav })
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.warn("[Supabase] Toggle favorite error:", error.message);
          });
      }

      return updatedTopics;
    });
  };

  const clearAllTopics = async () => {
    setTopics([]);
    if (isSignedIn && clerkUser) {
      const { error } = await supabase
        .from("topics")
        .delete()
        .eq("user_id", clerkUser.id);
      if (error) console.warn("[Supabase] Clear all topics error:", error.message);
    }
  };

  const currentUser = isSignedIn && clerkUser
    ? {
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || "Learner",
        avatar: clerkUser.imageUrl,
        email: clerkUser.primaryEmailAddress?.emailAddress,
      }
    : { name: "Learner", avatar: null };

  return (
    <DataContext.Provider
      value={{
        topics,
        user: currentUser,
        addTopic,
        getTopic,
        unlockLevel,
        completeLevel,
        deleteTopic,
        toggleFavorite,
        clearAllTopics,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined)
    throw new Error("useData must be used within a DataProvider");
  return context;
};
