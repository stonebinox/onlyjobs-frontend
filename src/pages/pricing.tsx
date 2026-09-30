import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PricingRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/how-it-works#pricing");
  }, [router]);

  return null;
};

export default PricingRedirect;
