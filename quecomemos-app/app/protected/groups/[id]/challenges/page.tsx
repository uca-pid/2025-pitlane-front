'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Target, CalendarDays, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/lib/config/api';
import { useUser } from '@/lib/contexts/UserContext';
import type { Challenge, ChallengeProgress, ChallengeRankingRow, GroupData } from '@/lib/types/groupChallenges';

export default function GroupChallengesPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { userData } = useUser();
  const profileId = userData?.profile?.id;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [ranking, setRanking] = useState<Record<number, ChallengeRankingRow[]>>({});
  const [progress, setProgress] = useState<Record<number, ChallengeProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', ruleText: '', startDate: '', endDate: '' });

  const isAdmin = Boolean(group && profileId && (
    group.createdBy === profileId ||
    group.members?.some((member) => member.profile.id === profileId && member.role === 'admin')
 ));

  const fetchData = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const [groupRes, challengesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/groups/${groupId}`),
        fetch(`${API_BASE_URL}/groups/${groupId}/challenges`),
      ]);
      if (!groupRes.ok || !challengesRes.ok) throw new Error('Failed to load challenges');
      const groupData = await groupRes.json();
      const challengeData = await challengesRes.json();
      setGroup(groupData);
      setChallenges(challengeData);

      for (const challenge of challengeData as Challenge[]) {
        const [progressRes, rankingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/challenges/${challenge.ChallengeID}/progress/${profileId}`),
          fetch(`${API_BASE_URL}/challenges/${challenge.ChallengeID}/ranking/${profileId}`),
        ]);
        if (progressRes.ok) {
          const data = await progressRes.json();
          setProgress((current) => ({ ...current, [challenge.ChallengeID]: data }));
        }
        if (rankingRes.ok) {
          const data = await rankingRes.json();
          setRanking((current) => ({ ...current, [challenge.ChallengeID]: data }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [groupId, profileId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createChallenge = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, profileId }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to create challenge');
      setForm({ name: '', description: '', ruleText: '', startDate: '', endDate: '' });
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const toggleToday = async (challenge: Challenge) => {
    if (!profileId) return;
    const today = new Date().toISOString().slice(0, 10);
    const current = progress[challenge.ChallengeID]?.completedDays || 0;
    // The server stores a date-specific completion; this simple toggle is a daily action.
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challenge.ChallengeID}/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, date: today, completed: true }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to mark completion');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) return <div className="container mx-auto p-6">Loading challenges...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Trophy className="w-7 h-7 text-amber-600" /> Group Challenges</h1>
          <p className="text-muted-foreground">Shared goals and daily progress for {group?.name}</p>
        </div>
        {isAdmin && <Button onClick={() => setShowForm((value) => !value)} className="bg-amber-700 text-white">Create challenge</Button>}
      </div>

      {error && <Card><CardContent className="p-4 text-destructive">{error}</CardContent></Card>}

      {showForm && isAdmin && (
        <Card>
          <CardHeader><CardTitle>New challenge</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createChallenge} className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Challenge name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input placeholder="Rule, example: no soft drinks" value={form.ruleText} onChange={(e) => setForm({ ...form, ruleText: e.target.value })} required />
              <Textarea className="md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              <div className="md:col-span-2 flex justify-end"><Button type="submit" className="bg-amber-700 text-white">Create</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {challenges.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground"><Target className="w-10 h-10 mx-auto mb-3" />No challenges yet</CardContent></Card>
      ) : challenges.map((challenge) => {
        const userProgress = progress[challenge.ChallengeID];
        const rows = ranking[challenge.ChallengeID] || [];
        return (
          <Card key={challenge.ChallengeID}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between"><span>{challenge.name}</span><span className="text-sm text-amber-600">{userProgress?.percentage || 0}%</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">{challenge.description || challenge.ruleText}</p>
              <div className="flex items-center gap-2 text-sm"><CalendarDays className="w-4 h-4" /> {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}</div>
              <div className="h-3 bg-muted rounded overflow-hidden"><div className="h-full bg-amber-600" style={{ width: `${userProgress?.percentage || 0}%` }} /></div>
              <p className="text-sm">You completed <strong>{userProgress?.completedDays || 0}</strong> of <strong>{userProgress?.totalDays || 0}</strong> days.</p>
              <Button onClick={() => toggleToday(challenge)} className="bg-green-700 text-white"><Check className="w-4 h-4 mr-2" />Mark today</Button>

              <div>
                <h3 className="font-semibold mb-2">Ranking</h3>
                <div className="space-y-2">
                  {rows.map((row, index) => (
                    <div key={row.profileId} className="flex items-center justify-between border-b pb-2">
                      <span>{index + 1}. {row.username || 'User'}</span>
                      <span className="text-sm text-amber-600">{row.completedDays}/{row.totalDays} ({row.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
