import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import type { GroupData, WeeklyMenuEntry } from '@/lib/types/groupChallenges';

interface UseWeeklyMenuResult {
  entries: WeeklyMenuEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWeeklyMenu(groupId: string, profileId: string | undefined): UseWeeklyMenuResult {
  const [entries, setEntries] = useState<WeeklyMenuEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/menu?profileId=${profileId}`);
      if (!response.ok) throw new Error('No pudimos cargar el menú semanal');
      setEntries(await response.json() as WeeklyMenuEntry[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [groupId, profileId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { entries, loading, error, refresh };
}

export function getGroupAdmin(group: GroupData | null, profileId: string | undefined): boolean {
  if (!group || !profileId) return false;
  return group.createdBy === profileId || group.members.some((member) =>
    member.profile.id === profileId && member.role === 'admin'
  );
}
