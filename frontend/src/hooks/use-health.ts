import { useQuery } from "@tanstack/react-query";
import { checkHealth } from "@/services/api";

/**
 * Polls the FastAPI `/health` endpoint every 30 seconds.
 * Returns `isOnline` (boolean) plus standard query metadata.
 */
export function useHealthCheck() {
  const query = useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
    refetchInterval: 30_000,
    retry: 1,
    staleTime: 25_000,
  });

  return {
    ...query,
    isOnline: query.isSuccess && query.data?.status === "ok",
  };
}
