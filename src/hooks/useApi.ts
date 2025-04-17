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
        `${process.env.NEXT_PUBLIC_API_URL}/users/authenticate`,
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

  return {
    authenticateUser,
    getUserName,
    getAvailableJobsCount,
  };
};
