'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Flame, Target, Utensils, Clock3, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/config/api';
import { StreakFeedbackCard } from '@/components/challenges/StreakFeedbackCard';
import { ChallengeRanking } from '@/components/challenges/ChallengeRanking';
import { useChallengeStreak } from '@/lib/hooks/useChallengeStreak';
import { useWeeklyMenu } from '@/lib/hooks/useWeeklyMenu';
import type { Challenge, ChallengeRankingRow, WeeklyMenuEntry } from '@/lib/types/groupChallenges';

interface GroupDashboardViewProps {
  groupId: number;
  profileId: string;
  isAdmin: boolean;
}

const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function mealName(entry: WeeklyMenuEntry | undefined): string {
  return entry?.meal?.name || entry?.customMeal || 'Sin definir';
}

export function GroupDashboardView({ groupId, profileId, isAdmin }: GroupDashboardViewProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [ranking, setRanking] = useState<ChallengeRankingRow[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  const activeChallenge = challenges.find((challenge) => challenge.isActive) ?? null;
  const streakHook = useChallengeStreak(activeChallenge, profileId);
  const menu = useWeeklyMenu(String(groupId), profileId);

  useEffect(() => {
    let cancelled = false;
    async function loadChallenges() {
      setLoadingChallenges(true);
      try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/challenges`);
        if (!response.ok) throw new Error('Failed to load challenges');
        const data = await response.json() as Challenge[];
        if (!cancelled) setChallenges(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los retos');
      } finally {
        if (!cancelled) setLoadingChallenges(false);
      }
    }
    void loadChallenges();
    return () => { cancelled = true; };
  }, [groupId]);

  useEffect(() => {
    void streakHook.refresh();
  }, [streakHook.refresh]);

  useEffect(() => {
    setRanking(streakHook.ranking);
  }, [streakHook.ranking]);

  const groupAdherence = useMemo(() => {
    if (ranking.length === 0) return 0;
    return Math.round(ranking.reduce((sum, row) => sum + row.percentage, 0) / ranking.length);
  }, [ranking]);

  const pendingProposals = useMemo(() => menu.entries.reduce((sum, entry) =>
    sum + entry.proposals.filter((proposal) => proposal.status === 'pending').length, 0), [menu.entries]);

  const weekRows = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
    return dayLabels.map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateKey = date.toISOString().slice(0, 10);
      const lunch = menu.entries.find((entry) => entry.date.slice(0, 10) === dateKey && entry.moment === 'lunch');
      const dinner = menu.entries.find((entry) => entry.date.slice(0, 10) === dateKey && entry.moment === 'dinner');
      return { label, dateKey, lunch, dinner };
    });
  }, [menu.entries]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-neutral-800/80 bg-gradient-to-br from-orange-950/30 to-neutral-950">
          <CardContent className="p-5">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Racha personal</span><Flame className="h-5 w-5 text-orange-400" /></div>
            <p className="mt-3 text-4xl font-bold tracking-tight text-white">{streakHook.progress?.streak ?? 0}</p>
            <p className="mt-1 text-sm text-neutral-400">días consecutivos</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-800/80 bg-gradient-to-br from-emerald-950/30 to-neutral-950">
          <CardContent className="p-5">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Adherencia grupal</span><Target className="h-5 w-5 text-emerald-400" /></div>
            <p className="mt-3 text-4xl font-bold tracking-tight text-white">{groupAdherence}%</p>
            <p className="mt-1 text-sm text-neutral-400">promedio del reto activo</p>
          </CardContent>
        </Card>
        <Card className="border-neutral-800/80 bg-gradient-to-br from-blue-950/30 to-neutral-950">
          <CardContent className="p-5">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Por moderar</span><MessageSquare className="h-5 w-5 text-blue-400" /></div>
            <p className="mt-3 text-4xl font-bold tracking-tight text-white">{pendingProposals}</p>
            <p className="mt-1 text-sm text-neutral-400">propuestas pendientes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.35fr)]">
        <Card className="border-neutral-800/80 bg-neutral-950/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-5 w-5 text-amber-500" /> Menú de la semana</CardTitle>
          </CardHeader>
          <CardContent>
            {menu.loading ? (
              <div className="grid grid-cols-7 gap-2">{dayLabels.map((day) => <div key={day} className="h-28 animate-pulse rounded-xl bg-neutral-800/60" />)}</div>
            ) : menu.entries.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 px-6 text-center">
                <Utensils className="h-10 w-10 text-neutral-600" />
                <h3 className="mt-3 font-semibold text-neutral-200">El menú aún está vacío</h3>
                <p className="mt-1 max-w-sm text-sm text-neutral-500">Configurá almuerzos y cenas para que el grupo pueda organizar la semana.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
                {weekRows.map((day) => (
                  <div key={day.dateKey} className="space-y-2 rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{day.label}</p>
                    {(['lunch', 'dinner'] as const).map((moment) => {
                      const entry = moment === 'lunch' ? day.lunch : day.dinner;
                      const calories = entry?.meal?.mealFoods?.reduce((sum, mealFood) => sum + mealFood.quantity * mealFood.food.kCal, 0);
                      return (
                        <div key={moment} className="rounded-lg border border-neutral-800 bg-neutral-950 p-2.5">
                          <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase text-neutral-500"><Clock3 className="h-3 w-3" />{moment}</div>
                          <p className="min-h-10 text-sm font-medium leading-5 text-neutral-200">{mealName(entry)}</p>
                          {typeof calories === 'number' && <span className="mt-2 inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400">{calories} kcal</span>}
                          {entry && <div className="mt-3 flex gap-1"><Button size="sm" variant="outline" className="h-7 flex-1 px-2 text-[10px]">Proponer cambio</Button><Button size="sm" className="h-7 flex-1 px-2 text-[10px]">Consumir</Button></div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {activeChallenge ? (
            <StreakFeedbackCard
              progress={streakHook.progress}
              challengeName={activeChallenge.name}
              onMarkToday={streakHook.markToday}
            />
          ) : (
            <Card className="border-neutral-800/80 bg-neutral-950/60"><CardContent className="p-6 text-center"><Target className="mx-auto h-8 w-8 text-neutral-600" /><p className="mt-3 text-sm text-neutral-400">No hay un reto activo ahora.</p></CardContent></Card>
          )}
          <ChallengeRanking ranking={ranking} />
        </div>
      </div>
    </div>
  );
}
