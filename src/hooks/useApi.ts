const getHeaders = () => {
  const token = localStorage.getItem("onlyjobs_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const useApi = () => {
  const authenticateUser = async (email: string, password: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Authentication failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Authentication error:", error);
      return { error: (error as Error).message };
    }
  };

  const getUserName = async (userId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/username`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user name");
      }

      return await response.json();
    } catch (error) {
      console.error("Fetch user name error:", error);
      return { error: (error as Error).message };
    }
  };

  const getAvailableJobsCount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/jobs/available-count`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch job count");
      }

      const data = await response.json();

      return data.count;
    } catch (error) {
      console.error("Fetch job count error:", error);
      return { error: (error as Error).message };
    }
  };

  const getActiveUserCount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/active-count`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch active user count"
        );
      }

      const data = await response.json();

      return data.activeUserCount;
    } catch (error) {
      console.error("Fetch active user count error:", error);
      return { error: (error as Error).message };
    }
  };

  const uploadCV = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/cv`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("onlyjobs_token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload CV");
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("CV upload error:", error);
      return { error: (error as Error).message };
    }
  };

  const getMatchCount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/count`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch match count");
      }

      const data = await response.json();

      return data.matchCount;
    } catch (error) {
      console.error("Fetch match count error:", error);
      return { error: (error as Error).message };
    }
  };

  const getMatches = async (minScore: number = 0) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches?minMatchScore=${minScore}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch matches");
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Fetch matches error:", error);
      return { error: (error as Error).message };
    }
  };

  const markMatchClick = async (matchId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/click`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ matchId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mark match as clicked");
      }

      return await response.json();
    } catch (error) {
      console.error("Mark match click error:", error);
      return { error: (error as Error).message };
    }
  };

  const markMatchAsSkipped = async (
    matchId: string,
    reason?: string,
    details?: string
  ) => {
    try {
      const body: {
        matchId: string;
        reason?: string;
        details?: string;
      } = { matchId };

      // Include reason/details if provided
      if (reason) {
        body.reason = reason;
        if (details) {
          body.details = details;
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/skip`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mark match as skipped");
      }

      return await response.json();
    } catch (error) {
      console.error("Mark match skip error:", error);
      return { error: (error as Error).message };
    }
  };

  const markMatchApplied = async (
    matchId: string,
    applied: boolean,
    reason?: string,
    details?: string
  ) => {
    try {
      const body: {
        matchId: string;
        applied: boolean;
        reason?: string;
        details?: string;
      } = { matchId, applied };

      // Only include reason/details when not applied
      if (!applied && reason) {
        body.reason = reason;
        if (details) {
          body.details = details;
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/applied`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to mark match applied status"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Mark match applied error:", error);
      return { error: (error as Error).message };
    }
  };

  const getQuestion = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/question`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch question");
      }

      const data = await response.json();

      return data.question;
    } catch (error) {
      console.error("Fetch question error:", error);
      return { error: (error as Error).message };
    }
  };

  const postAnswer = async (
    answer: string,
    questionId: string,
    mode: "text" | "voice" = "text"
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/answer`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            answer: {
              answer,
              questionId,
              mode,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to post answer");
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Post answer error:", error);
      return { error: (error as Error).message };
    }
  };

  const uploadAudio = async (file: File, questionId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("questionId", questionId);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/answer-audio`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("onlyjobs_token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload audio");
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Audio upload error:", error);
      return { error: (error as Error).message };
    }
  };

  const getAnsweredQuestions = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/answers`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch answered questions"
        );
      }

      const data = await response.json();

      return data.answeredQuestions;
    } catch (error) {
      console.error("Fetch answered questions error:", error);
      return { error: (error as Error).message };
    }
  };

  const skipQuestion = async (questionId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/skip-question`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ questionId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to skip question");
      }

      return await response.json();
    } catch (error) {
      console.error("Skip question error:", error);
      return { error: (error as Error).message };
    }
  };

  const createAnswer = async (question: string, jobResultId?: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/create-answer`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ question, jobResultId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create answer");
      }

      return await response.json();
    } catch (error) {
      console.error("Create answer error:", error);
      return { error: (error as Error).message };
    }
  };

  const getMatchQnAHistory = async (matchRecordId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/match-qna/${matchRecordId}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch Q&A history");
      }

      return await response.json();
    } catch (error) {
      console.error("Get Q&A history error:", error);
      return { error: (error as Error).message };
    }
  };

  const getUserProfile = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch user profile");
      }
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error("Fetch user profile error:", error);
      return { error: (error as Error).message };
    }
  };

  const updateUserEmail = async (email: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/update-email`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ email }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update email");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Update email error:", error);
      return { error: (error as Error).message };
    }
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/password`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update password");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Update password error:", error);
      return { error: (error as Error).message };
    }
  };

  const updateMinMatchScore = async (minScore: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/update-mini-score`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ minScore }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update minimum match score"
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Update minimum match score error:", error);
      return { error: (error as Error).message };
    }
  };

  const requestEmailChange = async (newEmail: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/email-change/request`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ newEmail }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to request email change");
      }

      return await response.json();
    } catch (error) {
      console.error("Request email change error:", error);
      return { error: (error as Error).message };
    }
  };

  const verifyEmailChange = async (token: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/email-change/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to verify email change");
      }

      return await response.json();
    } catch (error) {
      console.error("Verify email change error:", error);
      return { error: (error as Error).message };
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/resend-verification`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to resend verification email");
      }

      return await response.json();
    } catch (error) {
      console.error("Resend verification email error:", error);
      return { error: (error as Error).message };
    }
  };

  const verifyInitialEmail = async (token: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to verify email");
      }

      return await response.json();
    } catch (error) {
      console.error("Verify initial email error:", error);
      return { error: (error as Error).message };
    }
  };

  const factoryResetUserAccount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/factory-reset`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to factory reset user account"
        );
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Factory reset user account error:", error);
      return { error: (error as Error).message };
    }
  };

  const deleteUserAccount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/delete`,
        {
          method: "DELETE",
          headers: getHeaders(),
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user account");
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Delete user account error:", error);
      return { error: (error as Error).message };
    }
  };

  const updateUserProfile = async (resume: Partial<{
    summary: string;
    skills: string[];
    experience: string[];
    education: string[];
    projects: string[];
    certifications: string[];
    languages: string[];
    achievements: string[];
    volunteerExperience: string[];
    interests: string[];
  }>) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ resume }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user profile");
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Update user profile error:", error);
      return { error: (error as Error).message };
    }
  };

  const updatePreferences = async (preferences: Partial<{
    jobTypes: string[];
    industries: string[];
    location: string[];
    remoteOnly: boolean;
    minSalary: number;
    minScore: number;
    matchingEnabled: boolean;
  }>) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/preferences`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(preferences),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update preferences");
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Update preferences error:", error);
      return { error: (error as Error).message };
    }
  };

  const searchSkills = async (query: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/skills/search?q=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to search skills");
      }

      const data = await response.json();

      return data.skills || [];
    } catch (error) {
      console.error("Search skills error:", error);
      return [];
    }
  };

  const getWalletBalance = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wallet/balance`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch wallet balance");
      }

      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error("Fetch wallet balance error:", error);
      return { error: (error as Error).message };
    }
  };

  const createPaymentOrder = async (amount: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wallet/create-order`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ amount }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create payment order");
      }

      return await response.json();
    } catch (error) {
      console.error("Create payment order error:", error);
      return { error: (error as Error).message };
    }
  };

  const verifyPayment = async (
    orderId: string,
    paymentId: string,
    signature: string
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wallet/verify-payment`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ orderId, paymentId, signature }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to verify payment");
      }

      return await response.json();
    } catch (error) {
      console.error("Verify payment error:", error);
      return { error: (error as Error).message };
    }
  };

  const getTransactions = async (page: number = 1, limit: number = 20) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/wallet/transactions?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch transaction history"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Fetch transactions error:", error);
      return { error: (error as Error).message };
    }
  };

  const checkWalletBalance = async () => {
    try {
      const balance = await getWalletBalance();
      if (typeof balance === "object" && "error" in balance) {
        return { error: balance.error };
      }
      return { balance: balance as number, hasSufficientBalance: balance >= 0.3 };
    } catch (error) {
      console.error("Check wallet balance error:", error);
      return { error: (error as Error).message };
    }
  };

  const getGuideProgress = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/guide-progress`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch guide progress");
      }

      const data = await response.json();
      return data.guideProgress || {};
    } catch (error) {
      console.error("Get guide progress error:", error);
      return { error: (error as Error).message };
    }
  };

  const updateGuideProgress = async (
    pageId: string,
    completed?: boolean,
    skipped?: boolean
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/guide-progress`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ pageId, completed, skipped }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update guide progress");
      }

      return await response.json();
    } catch (error) {
      console.error("Update guide progress error:", error);
      return { error: (error as Error).message };
    }
  };

  const resetGuideProgress = async (pageId?: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/guide-progress/reset`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ pageId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset guide progress");
      }

      return await response.json();
    } catch (error) {
      console.error("Reset guide progress error:", error);
      return { error: (error as Error).message };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to request password reset");
      }

      return await response.json();
    } catch (error) {
      console.error("Request password reset error:", error);
      return { error: (error as Error).message };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, newPassword }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      return await response.json();
    } catch (error) {
      console.error("Reset password error:", error);
      return { error: (error as Error).message };
    }
  };

  return {
    authenticateUser,
    getUserName,
    getAvailableJobsCount,
    getActiveUserCount,
    uploadCV,
    getMatchCount,
    getMatches,
    markMatchClick,
    markMatchAsSkipped,
    markMatchApplied,
    getQuestion,
    postAnswer,
    uploadAudio,
    getAnsweredQuestions,
    skipQuestion,
    createAnswer,
    getMatchQnAHistory,
    getUserProfile,
    updateUserEmail,
    updatePassword,
    updateMinMatchScore,
    updatePreferences,
    requestEmailChange,
    verifyEmailChange,
    resendVerificationEmail,
    verifyInitialEmail,
    factoryResetUserAccount,
    deleteUserAccount,
    updateUserProfile,
    searchSkills,
    getWalletBalance,
    createPaymentOrder,
    verifyPayment,
    getTransactions,
    checkWalletBalance,
    getGuideProgress,
    updateGuideProgress,
    resetGuideProgress,
    requestPasswordReset,
    resetPassword,
  };
};
