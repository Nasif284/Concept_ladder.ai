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

function getOrCreateGuestId() {
  const GUEST_KEY = "concept_ladder_guest_id";
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = "guest_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch {
    return "guest_session";
  }
}

function getCachedTopics(userId) {
  try {
    const raw = localStorage.getItem(`concept_ladder_topics_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setCachedTopics(userId, topicsList) {
  try {
    localStorage.setItem(`concept_ladder_topics_${userId}`, JSON.stringify(topicsList));
  } catch {
    // Ignore storage quota errors
  }
}

export function DataProvider({ children }) {
  const { session, isSignedIn } = useSession();
  const { user: clerkUser } = useUser();

  // Active user ID: Clerk user ID or persistent guest ID
  const activeUserId = useMemo(() => {
    return isSignedIn && clerkUser?.id ? clerkUser.id : getOrCreateGuestId();
  }, [isSignedIn, clerkUser]);

  const [topics, setTopics] = useState(() => getCachedTopics(activeUserId));
  const [isLoading, setIsLoading] = useState(false);
  const processingRef = useRef(new Set());

  // Supabase client dynamically authorized with the active Clerk session JWT
  const supabase = useMemo(() => {
    return createClerkSupabaseClient(session);
  }, [session]);

  // Sync profile & topics with Supabase
  useEffect(() => {
    let isCancelled = false;

    // Load local cache immediately for this user
    const cached = getCachedTopics(activeUserId);
    setTopics(cached);

    async function initUserData() {
      setIsLoading(true);
      try {
        // 1. If signed in, sync user profile
        if (isSignedIn && clerkUser) {
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
        }

        // 2. Fetch Topics from Supabase for this user (or guest)
        const { data: dbTopics, error: topicsError } = await supabase
          .from("topics")
          .select("*")
          .eq("user_id", activeUserId)
          .order("last_accessed", { ascending: false });

        if (topicsError) {
          if (topicsError.code === "PGRST205") {
            console.warn("[Supabase] Tables not found. Using local cache.");
          } else {
            console.warn("[Supabase] Fetch notice:", topicsError.message);
          }
          return;
        }

        if (!isCancelled && dbTopics) {
          if (dbTopics.length > 0) {
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
            setCachedTopics(activeUserId, formatted);
          } else if (cached.length > 0) {
            // Push existing cached topics into Supabase
            for (const item of cached) {
              await supabase.from("topics").upsert({
                id: item.id,
                user_id: activeUserId,
                title: item.title,
                slug: item.slug,
                progress: item.progress,
                is_favorite: item.isFavorite,
                last_accessed: item.lastAccessed,
                levels: item.levels,
              });
            }
          }
        }
      } catch (err) {
        console.warn("[Supabase] Data initialization notice:", err?.message || err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    initUserData();

    return () => {
      isCancelled = true;
    };
  }, [activeUserId, isSignedIn, clerkUser, supabase]);

  // Add Topic: AI generates content -> Persisted to local cache & Supabase
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
        const updated = [
          existingTopic,
          ...topics.filter((t) => t.title.toLowerCase() !== normalizedName),
        ];
        setTopics(updated);
        setCachedTopics(activeUserId, updated);
        return existingTopic;
      }

      // Generate content via AI (throws on rate limit or failure)
      const newTopic = await generateTopicContent(topicName);

      // 1. Immediately persist to state & cache
      const updatedTopics = [newTopic, ...topics];
      setTopics(updatedTopics);
      setCachedTopics(activeUserId, updatedTopics);

      // 2. Persist to Supabase
      supabase
        .from("topics")
        .upsert({
          id: newTopic.id,
          user_id: activeUserId,
          title: newTopic.title,
          slug: newTopic.slug,
          progress: newTopic.progress,
          is_favorite: newTopic.isFavorite,
          last_accessed: newTopic.lastAccessed,
          levels: newTopic.levels,
        })
        .then(({ error }) => {
          if (error) {
            console.warn("[Supabase] Insert topic error:", error.message);
          }
        });

      return newTopic;
    } catch (err) {
      console.error("[Topic Generation Error]:", err.message);
      throw err; // Let TopicInput display the error to the user
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

      setCachedTopics(activeUserId, updatedTopics);

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

      setCachedTopics(activeUserId, updatedTopics);

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

      return updatedTopics;
    });
  };

  const deleteTopic = async (id) => {
    const nextTopics = topics.filter((t) => t.id !== id);
    setTopics(nextTopics);
    setCachedTopics(activeUserId, nextTopics);

    const { error } = await supabase.from("topics").delete().eq("id", id);
    if (error) console.warn("[Supabase] Delete topic error:", error.message);
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

      setCachedTopics(activeUserId, updatedTopics);

      supabase
        .from("topics")
        .update({ is_favorite: nextFav })
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("[Supabase] Toggle favorite error:", error.message);
        });

      return updatedTopics;
    });
  };

  const clearAllTopics = async () => {
    setTopics([]);
    setCachedTopics(activeUserId, []);
    const { error } = await supabase
      .from("topics")
      .delete()
      .eq("user_id", activeUserId);
    if (error) console.warn("[Supabase] Clear all topics error:", error.message);
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
