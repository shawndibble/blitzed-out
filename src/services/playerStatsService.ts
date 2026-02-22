import db from '@/stores/store';
import { GlobalPlayerStats } from '@/types/localPlayerDB';

const DEFAULT_STATS: Omit<GlobalPlayerStats, 'id' | 'ownerId'> = {
  diceRollCount: 0,
  diceRollSum: 0,
  diceDistribution: {},
  totalGamesStarted: 0,
  totalGamesCompleted: 0,
  totalPlayTimeMs: 0,
  lastActive: Date.now(),
  currentStreak: 0,
  bestStreak: 0,
  categoriesLandedOn: {},
  boardCategoriesPlayed: {},
  intensitiesPlayed: {},
};

async function getOrCreateStats(ownerId: string): Promise<GlobalPlayerStats> {
  const existing = await db.globalPlayerStats.where('ownerId').equals(ownerId).first();

  if (existing) {
    return { ...DEFAULT_STATS, ...existing };
  }

  const newStats = { ownerId, ...DEFAULT_STATS };
  const id = await db.globalPlayerStats.add(newStats);
  return { ...newStats, id };
}

export async function recordDiceRoll(ownerId: string, rollValue: number): Promise<void> {
  const stats = await getOrCreateStats(ownerId);

  const newDistribution = { ...stats.diceDistribution };
  newDistribution[rollValue] = (newDistribution[rollValue] || 0) + 1;

  await db.globalPlayerStats.update(stats.id!, {
    diceRollCount: stats.diceRollCount + 1,
    diceRollSum: stats.diceRollSum + rollValue,
    diceDistribution: newDistribution,
    lastActive: Date.now(),
  });
}

export async function recordGameStart(ownerId: string): Promise<void> {
  const stats = await getOrCreateStats(ownerId);

  await db.globalPlayerStats.update(stats.id!, {
    totalGamesStarted: stats.totalGamesStarted + 1,
    currentGameStartTime: Date.now(),
    lastActive: Date.now(),
  });
}

export async function recordGameComplete(ownerId: string): Promise<void> {
  const stats = await getOrCreateStats(ownerId);

  const newStreak = stats.currentStreak + 1;
  const playTimeMs = stats.currentGameStartTime ? Date.now() - stats.currentGameStartTime : 0;

  await db.globalPlayerStats.update(stats.id!, {
    totalGamesCompleted: stats.totalGamesCompleted + 1,
    totalPlayTimeMs: stats.totalPlayTimeMs + playTimeMs,
    currentStreak: newStreak,
    bestStreak: Math.max(stats.bestStreak, newStreak),
    currentGameStartTime: undefined,
    lastActive: Date.now(),
  });
}

export async function recordTileLanding(ownerId: string, category: string): Promise<void> {
  if (!category) return;

  const stats = await getOrCreateStats(ownerId);

  const newCategories = { ...stats.categoriesLandedOn };
  newCategories[category] = (newCategories[category] || 0) + 1;

  await db.globalPlayerStats.update(stats.id!, {
    categoriesLandedOn: newCategories,
    lastActive: Date.now(),
  });
}

export async function recordBoardCategories(ownerId: string, categories: string[]): Promise<void> {
  if (!categories?.length) return;

  const stats = await getOrCreateStats(ownerId);

  const newBoardCategories = { ...stats.boardCategoriesPlayed };
  const uniqueCategories = [...new Set(categories)];

  uniqueCategories.forEach((category) => {
    if (category) {
      newBoardCategories[category] = (newBoardCategories[category] || 0) + 1;
    }
  });

  await db.globalPlayerStats.update(stats.id!, {
    boardCategoriesPlayed: newBoardCategories,
    lastActive: Date.now(),
  });
}

export async function recordIntensities(ownerId: string, intensities: string[]): Promise<void> {
  if (!intensities?.length) return;

  const stats = await getOrCreateStats(ownerId);

  const newIntensities = { ...stats.intensitiesPlayed };

  intensities.forEach((intensity) => {
    if (intensity) {
      newIntensities[intensity] = (newIntensities[intensity] || 0) + 1;
    }
  });

  await db.globalPlayerStats.update(stats.id!, {
    intensitiesPlayed: newIntensities,
    lastActive: Date.now(),
  });
}

export async function fetchPlayerStats(ownerId: string): Promise<GlobalPlayerStats> {
  return getOrCreateStats(ownerId);
}
