import db from '@/stores/store';
import { GlobalPlayerStats } from '@/types/localPlayerDB';

const DEFAULT_STATS: Omit<GlobalPlayerStats, 'id' | 'oderId'> = {
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

async function getOrCreateStats(oderId: string): Promise<GlobalPlayerStats> {
  const existing = await db.globalPlayerStats.where('oderId').equals(oderId).first();

  if (existing) {
    return { ...DEFAULT_STATS, ...existing };
  }

  const newStats = { oderId, ...DEFAULT_STATS };
  const id = await db.globalPlayerStats.add(newStats);
  return { ...newStats, id };
}

export async function recordDiceRoll(oderId: string, rollValue: number): Promise<void> {
  const stats = await getOrCreateStats(oderId);

  const newDistribution = { ...stats.diceDistribution };
  newDistribution[rollValue] = (newDistribution[rollValue] || 0) + 1;

  await db.globalPlayerStats.update(stats.id!, {
    diceRollCount: stats.diceRollCount + 1,
    diceRollSum: stats.diceRollSum + rollValue,
    diceDistribution: newDistribution,
    lastActive: Date.now(),
  });
}

export async function recordGameStart(oderId: string): Promise<void> {
  const stats = await getOrCreateStats(oderId);

  await db.globalPlayerStats.update(stats.id!, {
    totalGamesStarted: stats.totalGamesStarted + 1,
    currentGameStartTime: Date.now(),
    lastActive: Date.now(),
  });
}

export async function recordGameComplete(oderId: string): Promise<void> {
  const stats = await getOrCreateStats(oderId);

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

export async function recordTileLanding(oderId: string, category: string): Promise<void> {
  if (!category) return;

  const stats = await getOrCreateStats(oderId);

  const newCategories = { ...stats.categoriesLandedOn };
  newCategories[category] = (newCategories[category] || 0) + 1;

  await db.globalPlayerStats.update(stats.id!, {
    categoriesLandedOn: newCategories,
    lastActive: Date.now(),
  });
}

export async function recordBoardCategories(oderId: string, categories: string[]): Promise<void> {
  if (!categories?.length) return;

  const stats = await getOrCreateStats(oderId);

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

export async function recordIntensities(oderId: string, intensities: string[]): Promise<void> {
  if (!intensities?.length) return;

  const stats = await getOrCreateStats(oderId);

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

export async function fetchPlayerStats(oderId: string): Promise<GlobalPlayerStats> {
  return getOrCreateStats(oderId);
}
