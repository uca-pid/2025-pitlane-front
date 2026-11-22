'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Plus, Utensils, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/lib/config/api';
import { useUser } from '@/lib/contexts/UserContext';
import type { GroupData, WeeklyMenuEntry, MenuProposal } from '@/lib/types/groupChallenges';
import type { Meal } from '@/lib/contexts/MealsContext';

const moments = ['breakfast', 'lunch', 'snack', 'dinner'];

interface ProposalForm {
  alternativeText: string;
  reason: string;
  proposedMealId: string;
}

export default function GroupMenuPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { userData } = useUser();
  const profileId = userData?.profile?.id;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [entries, setEntries] = useState<WeeklyMenuEntry[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [proposalEntry, setProposalEntry] = useState<number | null>(null);
  const [proposal, setProposal] = useState<ProposalForm>({ alternativeText: '', reason: '', proposedMealId: '' });
  const [form, setForm] = useState({ date: '', moment: 'lunch', mealId: '', customMeal: '' });

  const isAdmin = Boolean(group && profileId && (
    group.createdBy === profileId ||
    group.members?.some((member) => member.profile.id === profileId && member.role === 'admin')
  ));

  const fetchData = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const [groupRes, menuRes, mealsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/groups/${groupId}`),
        fetch(`${API_BASE_URL}/groups/${groupId}/menu?profileId=${profileId}`),
        fetch(`${API_BASE_URL}/meals/all`),
      ]);
      if (!groupRes.ok || !menuRes.ok) throw new Error('Failed to load weekly menu');
      setGroup(await groupRes.json());
      setEntries(await menuRes.json());
      if (mealsRes.ok) setMeals(await mealsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [groupId, profileId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          date: form.date,
          moment: form.moment,
          mealId: form.mealId ? Number(form.mealId) : null,
          customMeal: form.customMeal,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to create menu entry');
      setForm({ date: '', moment: 'lunch', mealId: '', customMeal: '' });
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const submitProposal = async (entryId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu/${entryId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          proposedMealId: proposal.proposedMealId ? Number(proposal.proposedMealId) : null,
          alternativeText: proposal.alternativeText,
          reason: proposal.reason,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to propose alternative');
      setProposalEntry(null);
      setProposal({ alternativeText: '', reason: '', proposedMealId: '' });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const respondProposal = async (proposalId: number, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(`${API_BASE_URL}/menu-proposals/${proposalId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, status }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to respond');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (loading) return <div className="container mx-auto p-6">Loading weekly menu...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2"><CalendarDays className="w-7 h-7 text-amber-600" /> Weekly Menu</h1>
          <p className="text-muted-foreground">Coordinate meals for {group?.name}</p>
        </div>
        {isAdmin && <Button onClick={() => setShowForm((value) => !value)} className="bg-amber-700 text-white"><Plus className="w-4 h-4 mr-2" />Add menu item</Button>}
      </div>

      {error && <Card><CardContent className="p-4 text-destructive">{error}</CardContent></Card>}

      {showForm && isAdmin && (
        <Card>
          <CardHeader><CardTitle>Menu entry</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={createEntry} className="grid gap-4 md:grid-cols-2">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <select className="h-10 rounded border bg-background px-3" value={form.moment} onChange={(e) => setForm({ ...form, moment: e.target.value })}>
                {moments.map((moment) => <option key={moment} value={moment}>{moment}</option>)}
              </select>
              <select className="h-10 rounded border bg-background px-3" value={form.mealId} onChange={(e) => setForm({ ...form, mealId: e.target.value, customMeal: '' })}>
                <option value="">Use existing meal</option>
                {meals.map((meal) => <option key={meal.MealID} value={meal.MealID}>{meal.name}</option>)}
              </select>
              <Input placeholder="Or enter a custom meal name" value={form.customMeal} onChange={(e) => setForm({ ...form, customMeal: e.target.value, mealId: '' })} />
              <div className="md:col-span-2 flex justify-end"><Button type="submit" className="bg-amber-700 text-white">Save entry</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground"><Utensils className="w-10 h-10 mx-auto mb-3" />No menu entries for this week</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <Card key={entry.MenuEntryID}>
              <CardHeader><CardTitle className="text-lg">{new Date(entry.date).toLocaleDateString()} · {entry.moment}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium text-amber-600">{entry.meal?.name || entry.customMeal}</p>
                <Button variant="outline" onClick={() => setProposalEntry(proposalEntry === entry.MenuEntryID ? null : entry.MenuEntryID)}>
                  <MessageSquare className="w-4 h-4 mr-2" />Propose alternative
                </Button>

                {proposalEntry === entry.MenuEntryID && (
                  <div className="space-y-3 border-t pt-4">
                    <select className="w-full h-10 rounded border bg-background px-3" value={proposal.proposedMealId} onChange={(e) => setProposal({ ...proposal, proposedMealId: e.target.value, alternativeText: '' })}>
                      <option value="">Choose existing meal</option>
                      {meals.map((meal) => <option key={meal.MealID} value={meal.MealID}>{meal.name}</option>)}
                    </select>
                    <Input placeholder="Or alternative meal name" value={proposal.alternativeText} onChange={(e) => setProposal({ ...proposal, alternativeText: e.target.value, proposedMealId: '' })} />
                    <Textarea placeholder="Reason" value={proposal.reason} onChange={(e) => setProposal({ ...proposal, reason: e.target.value })} />
                    <Button onClick={() => submitProposal(entry.MenuEntryID)} className="bg-amber-700 text-white">Send proposal</Button>
                  </div>
                )}

                {entry.proposals?.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="font-semibold text-sm">Proposals</h4>
                    {entry.proposals.map((item: MenuProposal) => (
                      <div key={item.ProposalID} className="p-3 rounded border space-y-2">
                        <p className="text-sm font-medium">{item.proposedMeal?.name || item.alternativeText}</p>
                        {item.reason && <p className="text-xs text-muted-foreground">{item.reason}</p>}
                        <p className="text-xs">Status: {item.status}</p>
                        {isAdmin && item.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => respondProposal(item.ProposalID, 'accepted')} className="bg-green-700 text-white">Accept</Button>
                            <Button size="sm" variant="outline" onClick={() => respondProposal(item.ProposalID, 'rejected')}>Reject</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
