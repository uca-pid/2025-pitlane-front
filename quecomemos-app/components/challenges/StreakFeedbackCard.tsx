'use client';

import { Flame, Snowflake, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ChallengeProgress } from '@/lib/types/groupChallenges';

interface StreakFeedbackCardProps {
  progress: ChallengeProgress | null;
  challengeName: string;
  onMarkToday: () => Promise<void>;
}

export function StreakFeedbackCard({ progress, challengeName, onMarkToday }: StreakFeedbackCardProps) {
  const completedToday = progress?.todayCompleted ?? false;
  const streak = progress?.streak ?? 0;

  if (completedToday) {
    return (
      <Card className="overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-neutral-900/80 to-neutral-950 shadow-[0_12px_40px_-24px_rgba(16,185,129,0.55)]">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <Flame className="h-7 w-7 fill-orange-500 text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.55)]" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-neutral-950"><Check className="h-3 w-3" /></span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Racha activa</p>
              <h3 className="mt-1 text-xl font-bold text-white">{streak} día{streak === 1 ? '' : 's'} consecutivo{streak === 1 ? '' : 's'}</h3>
              <p className="mt-1 text-sm text-neutral-400">Completaste hoy: <span className="text-neutral-200">{challengeName}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-pulse overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-950/35 via-neutral-900/80 to-neutral-950 shadow-[0_12px_40px_-24px_rgba(245,158,11,0.5)]">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-400/30">
            <Snowflake className="h-6 w-6 text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">Racha en peligro</p>
            <h3 className="mt-1 text-lg font-bold text-white">¡Racha en riesgo!</h3>
            <p className="mt-1 text-sm text-neutral-400">Marcá antes de la medianoche para conservar tu racha.</p>
            <Button onClick={() => void onMarkToday()} className="mt-4 w-full bg-amber-600 text-neutral-950 hover:bg-amber-500">
              Completar hoy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
