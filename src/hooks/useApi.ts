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

  const markMatchAsSkipped = async (matchId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/matches/skip`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ matchId }),
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

  const createAnswer = async (question: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/create-answer`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ question }),
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
    getQuestion,
    postAnswer,
    uploadAudio,
    getAnsweredQuestions,
    skipQuestion,
    createAnswer,
    getUserProfile,
    updateUserEmail,
    updatePassword,
  };
};
