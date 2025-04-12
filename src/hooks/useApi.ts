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

  return {
    authenticateUser,
  };
};
