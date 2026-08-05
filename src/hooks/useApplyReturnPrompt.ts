import { useCallback, useEffect, useState } from "react";
import { JobResult } from "@/types/JobResult";

interface UseApplyReturnPromptResult {
  selectedJobResult: JobResult | null;
  isDrawerOpen: boolean;
  registerPending: (jobResult: JobResult) => void;
  openDrawer: (jobResult: JobResult) => void;
  closeDrawer: () => void;
}

export const useApplyReturnPrompt = (): UseApplyReturnPromptResult => {
  const [pendingJob, setPendingJob] = useState<JobResult | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedJobResult, setSelectedJobResult] = useState<JobResult | null>(null);

  const registerPending = useCallback((jobResult: JobResult) => {
    setPendingJob(jobResult);
  }, []);

  const openDrawer = useCallback((jobResult: JobResult) => {
    setSelectedJobResult(jobResult);
    setIsDrawerOpen(true);
    setPendingJob((prev) => (prev?._id === jobResult._id ? null : prev));
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && pendingJob && !isDrawerOpen) {
        setSelectedJobResult(pendingJob);
        setIsDrawerOpen(true);
        setPendingJob(null);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pendingJob, isDrawerOpen]);

  return { selectedJobResult, isDrawerOpen, registerPending, openDrawer, closeDrawer };
};
