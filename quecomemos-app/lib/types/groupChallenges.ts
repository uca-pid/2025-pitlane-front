export interface Challenge {
  ChallengeID: number;
  groupId: number;
  name: string;
  description: string | null;
  ruleText: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ChallengeProgress {
  challenge: Challenge;
  completedDays: number;
  completedDates: string[];
  todayCompleted: boolean;
  streak: number;
  totalDays: number;
  percentage: number;
}

export interface ChallengeRankingRow {
  profileId: string;
  username: string;
  completedDays: number;
  totalDays: number;
  percentage: number;
}

export interface WeeklyMenuEntry {
  MenuEntryID: number;
  groupId: number;
  date: string;
  moment: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  mealId: number | null;
  customMeal: string | null;
  meal: {
    MealID: number;
    name: string;
    description: string | null;
    mealFoods: Array<{ quantity: number; food: { kCal: number } }>;
  } | null;
  proposals: MenuProposal[];
}

export interface MenuProposal {
  ProposalID: number;
  menuEntryId: number;
  proposedMealId: number | null;
  alternativeText: string | null;
  reason: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  proposedBy: { id: string; username: string } | null;
  proposedMeal: { MealID: number; name: string } | null;
}

export interface GroupMember {
  profile: { id: string; username: string; role: string };
  role: 'admin' | 'member';
}

export interface GroupData {
  GroupID: number;
  name: string;
  description?: string;
  createdBy: string;
  members: GroupMember[];
}
