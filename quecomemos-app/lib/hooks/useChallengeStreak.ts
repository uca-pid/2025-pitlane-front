import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/config/api';
import type { Challenge, ChallengeProgress, ChallengeRankingRow } from '@/lib/types/groupChallenges';

interface UseChallengeStreakResult {
  progress: ChallengeProgress | null;
  ranking: ChallengeRankingRow[];
  loading: boolean;
  markToday: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useChallengeStreak(
  challenge: Challenge | null,
  profileId: string | undefined,
): UseChallengeStreakResult {
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [ranking, setRanking] = useState<ChallengeRankingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!challenge || !profileId) return;
    setLoading(true);
    try {
      const [progressResponse, rankingResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/challenges/${challenge.ChallengeID}/progress/${profileId}`),
        fetch(`${API_BASE_URL}/challenges/${challenge.ChallengeID}/ranking/${profileId}`),
      ]);
      if (!progressResponse.ok || !rankingResponse.ok) throw new Error('Failed to refresh challenge');
      setProgress(await progressResponse.json() as ChallengeProgress);
      setRanking(await rankingResponse.json() as ChallengeRankingRow[]);
    } finally {
      setLoading(false);
    }
  }, [challenge, profileId]);

  const markToday = useCallback(async () => {
    if (!challenge || !profileId || progress?.todayCompleted) return;

    const previous = progress;
    const optimisticToday = new Date().toISOString().slice(0, 10);
    setProgress(previous ? {
      ...previous,
      todayCompleted: true,
      streak: previous.streak + 1,
      completedDays: previous.completedDays + 1,
      completedDates: [...previous.completedDates, optimisticToday],
      percentage: previous.totalDays
        ? Math.round((previous.completedDays + 1) * 100 / previous.totalDays)
        : previous.percentage,
    } : null);

    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challenge.ChallengeID}/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, date: optimisticToday, completed: true }),
      });
      if (!response.ok) {
        const body = await response.json() as { error?: string };
        throw new Error(body.error || 'Failed to mark challenge');
      }
      toast.success('¡Racha completada! 🔥', { description: 'Tu progreso se guardó correctamente.' });
      await refresh();
    } catch (error) {
      setProgress(previous);
      toast.error('No pudimos guardar el check-in', {
        description: error instanceof Error ? error.message : 'Intentá nuevamente.',
      });
    }
  }, [challenge, profileId, progress, refresh]);

  return { progress, ranking, loading, markToday, refresh };
}
