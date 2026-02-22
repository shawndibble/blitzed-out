import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/hooks/useAuth';
import { fetchPlayerStats } from '@/services/playerStatsService';

export function usePlayerStats() {
  const { user } = useAuth();
  const ownerId = user?.uid || 'anonymous';

  const stats = useLiveQuery(() => fetchPlayerStats(ownerId), [ownerId]);

  return {
    stats,
    isLoading: stats === undefined,
  };
}

export default usePlayerStats;
