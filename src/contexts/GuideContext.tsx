import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "./AuthContext";

export interface GuideProgress {
  [pageId: string]: {
    completed: boolean;
    completedAt?: string;
    skipped: boolean;
    skippedAt?: string;
  };
}

interface GuideContextProps {
  guideProgress: GuideProgress;
  setGuideProgress: (progress: GuideProgress) => void;
  updatePageProgress: (
    pageId: string,
    completed?: boolean,
    skipped?: boolean
  ) => Promise<void>;
  resetPageProgress: (pageId?: string) => Promise<void>;
  isPageGuideCompleted: (pageId: string) => boolean;
  isPageGuideSkipped: (pageId: string) => boolean;
  isLoading: boolean;
}

const GuideContext = createContext<GuideContextProps | undefined>(undefined);

export const GuideProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [guideProgress, setGuideProgress] = useState<GuideProgress>({});
  const [isLoading, setIsLoading] = useState(true);
  const { getGuideProgress, updateGuideProgress, resetGuideProgress: resetGuideProgressApi } = useApi();
  const { isLoggedIn } = useAuth();
  const hasLoadedRef = useRef(false);

  // Load guide progress on mount and when user logs in
  useEffect(() => {
    const loadGuideProgress = async () => {
      if (isLoggedIn && !hasLoadedRef.current) {
        hasLoadedRef.current = true;
        try {
          setIsLoading(true);
          const progress = await getGuideProgress();
          if (!("error" in progress)) {
            setGuideProgress(progress as GuideProgress);
          }
        } catch (error) {
          console.error("Failed to load guide progress:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (!isLoggedIn) {
        hasLoadedRef.current = false;
        setIsLoading(false);
      }
    };

    loadGuideProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const updatePageProgress = useCallback(
    async (pageId: string, completed?: boolean, skipped?: boolean) => {
      try {
        await updateGuideProgress(pageId, completed, skipped);
        const newProgress = {
          ...guideProgress,
          [pageId]: {
            completed: completed ?? guideProgress[pageId]?.completed ?? false,
            completedAt:
              completed && !guideProgress[pageId]?.completed
                ? new Date().toISOString()
                : guideProgress[pageId]?.completedAt,
            skipped: skipped ?? guideProgress[pageId]?.skipped ?? false,
            skippedAt:
              skipped && !guideProgress[pageId]?.skipped
                ? new Date().toISOString()
                : guideProgress[pageId]?.skippedAt,
          },
        };
        setGuideProgress(newProgress);
      } catch (error) {
        console.error("Failed to update guide progress:", error);
      }
    },
    [guideProgress, updateGuideProgress]
  );

  const resetPageProgress = useCallback(
    async (pageId?: string) => {
      try {
        await resetGuideProgressApi(pageId);
        if (pageId) {
          const newProgress = { ...guideProgress };
          delete newProgress[pageId];
          setGuideProgress(newProgress);
        } else {
          setGuideProgress({});
        }
      } catch (error) {
        console.error("Failed to reset guide progress:", error);
      }
    },
    [guideProgress, resetGuideProgressApi]
  );

  const isPageGuideCompleted = useCallback(
    (pageId: string) => {
      return guideProgress[pageId]?.completed ?? false;
    },
    [guideProgress]
  );

  const isPageGuideSkipped = useCallback(
    (pageId: string) => {
      return guideProgress[pageId]?.skipped ?? false;
    },
    [guideProgress]
  );

  return (
    <GuideContext.Provider
      value={{
        guideProgress,
        setGuideProgress,
        updatePageProgress,
        resetPageProgress,
        isPageGuideCompleted,
        isPageGuideSkipped,
        isLoading,
      }}
    >
      {children}
    </GuideContext.Provider>
  );
};

export const useGuide = () => {
  const context = useContext(GuideContext);
  if (context === undefined) {
    throw new Error("useGuide must be used within a GuideProvider");
  }
  return context;
};

