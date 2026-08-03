import { Center, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const resolveDashboardRedirect = (search: string): string => {
  const params = new URLSearchParams(search);
  const tab = params.get("tab");
  const followup = params.get("followup");
  if (tab === "applied" && followup === "true") return "/tracker?followup=true";
  if (tab === "applied") return "/tracker";
  if (tab === "alljobs") return "/browse";
  return "/today";
};

const DashboardRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    const target = resolveDashboardRedirect(window.location.search);
    router.replace(target);
  }, [router]);

  return (
    <Center minH="100vh">
      <Spinner size="xl" />
    </Center>
  );
};

export default DashboardRedirect;
