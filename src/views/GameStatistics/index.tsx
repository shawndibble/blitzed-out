import { Box, CircularProgress, Divider, Grid, Paper, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import DialogWrapper from '@/components/DialogWrapper';
import usePlayerStats from '@/hooks/usePlayerStats';
import useUnifiedActionList from '@/hooks/useUnifiedActionList';
import StatCard from '@/views/GameStatistics/StatCard';
import DistributionChart from '@/views/GameStatistics/DistributionChart';
import {
  formatDuration,
  getMaxDistributionValue,
  getSortedCategories,
  calculateAverageRoll,
  calculateAverageGameTime,
} from '@/helpers/statsFormatting';
import { useSettings } from '@/stores/settingsStore';
import { ActionEntry } from '@/types';
import { GroupedActions } from '@/types/customTiles';

interface GameStatisticsProps {
  open: boolean;
  close: () => void;
  isMobile?: boolean;
}

interface SectionCardProps {
  titleKey: string;
  borderColor: string;
  children: React.ReactNode;
}

function SectionCard({ titleKey, borderColor, children }: SectionCardProps): JSX.Element {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderLeft: `4px solid ${borderColor}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: borderColor, fontWeight: 600 }}>
        <Trans i18nKey={titleKey as never} />
      </Typography>
      <Grid container spacing={1} sx={{ flex: 1, alignContent: 'flex-start' }}>
        {children}
      </Grid>
    </Paper>
  );
}

function mergeCurrentBoardData(
  historicalCategories: Record<string, number>,
  historicalIntensities: Record<string, number>,
  selectedActions: Record<string, ActionEntry> | undefined,
  actionsList: GroupedActions
): {
  mergedCategories: Record<string, number>;
  mergedIntensities: Record<string, number>;
} {
  const mergedCategories = { ...historicalCategories };
  const mergedIntensities = { ...historicalIntensities };

  if (!selectedActions) {
    return { mergedCategories, mergedIntensities };
  }

  Object.entries(selectedActions).forEach(([groupKey, entry]) => {
    if (entry.levels && entry.levels.length > 0) {
      const label = actionsList[groupKey]?.label || groupKey;
      mergedCategories[label] = (mergedCategories[label] || 0) + 1;
      entry.levels.forEach((level) => {
        const levelKey = `Level ${level}`;
        mergedIntensities[levelKey] = (mergedIntensities[levelKey] || 0) + 1;
      });
    }
  });

  return { mergedCategories, mergedIntensities };
}

export default function GameStatistics({
  open,
  close,
  isMobile = false,
}: GameStatisticsProps): JSX.Element {
  const { stats, isLoading } = usePlayerStats();
  const [settings] = useSettings();
  const { actionsList } = useUnifiedActionList(settings.gameMode);

  if (isLoading || !stats) {
    return (
      <DialogWrapper
        open={open}
        close={close}
        title={<Trans i18nKey="statistics" />}
        isMobile={isMobile}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      </DialogWrapper>
    );
  }

  const { mergedCategories, mergedIntensities } = mergeCurrentBoardData(
    stats.boardCategoriesPlayed || {},
    stats.intensitiesPlayed || {},
    settings.selectedActions,
    actionsList
  );

  const averageRoll = calculateAverageRoll(stats.diceRollSum, stats.diceRollCount);
  const averageGameTime = calculateAverageGameTime(
    stats.totalPlayTimeMs,
    stats.totalGamesCompleted
  );

  const sortedDiceValues = Object.keys(stats.diceDistribution)
    .map(Number)
    .sort((a, b) => a - b)
    .map((value) => [value, stats.diceDistribution[value]] as [number, number]);

  const sortedCategoriesLanded = getSortedCategories(stats.categoriesLandedOn || {});
  const sortedBoardCategories = getSortedCategories(mergedCategories);
  const sortedIntensities = getSortedCategories(mergedIntensities);

  const hasPlayedData = stats.diceRollCount > 0;
  const hasDistributionData =
    hasPlayedData &&
    (sortedDiceValues.length > 0 ||
      sortedCategoriesLanded.length > 0 ||
      sortedBoardCategories.length > 0 ||
      sortedIntensities.length > 0);

  return (
    <DialogWrapper
      open={open}
      close={close}
      title={<Trans i18nKey="statistics" />}
      isMobile={isMobile}
      maxWidth="md"
      fullWidth
    >
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <SectionCard titleKey="statsGames" borderColor="#22d3ee">
              <Grid size={6}>
                <StatCard value={stats.totalGamesStarted} labelKey="statsGamesStarted" />
              </Grid>
              <Grid size={6}>
                <StatCard value={stats.totalGamesCompleted} labelKey="statsGamesCompleted" />
              </Grid>
            </SectionCard>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <SectionCard titleKey="statsTime" borderColor="#fbbf24">
              <Grid size={6}>
                <StatCard
                  value={formatDuration(stats.totalPlayTimeMs)}
                  labelKey="statsTotalPlayTime"
                />
              </Grid>
              <Grid size={6}>
                <StatCard value={averageGameTime} labelKey="statsAverageGame" />
              </Grid>
            </SectionCard>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <SectionCard titleKey="statsDice" borderColor="#a78bfa">
              <Grid size={6}>
                <StatCard value={stats.diceRollCount} labelKey="statsTotalRolls" />
              </Grid>
              <Grid size={6}>
                <StatCard value={averageRoll} labelKey="statsAverageRoll" />
              </Grid>
            </SectionCard>
          </Grid>
        </Grid>

        {hasDistributionData && <Divider sx={{ my: 3 }} />}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            {sortedDiceValues.length > 0 && (
              <Box sx={{ mb: sortedIntensities.length > 0 ? 2 : 0 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#22d3ee' }}>
                  <Trans i18nKey="statsDiceDistribution" />
                </Typography>
                <DistributionChart
                  data={sortedDiceValues}
                  maxValue={getMaxDistributionValue(stats.diceDistribution)}
                  barColor="#22d3ee"
                />
              </Box>
            )}

            {sortedIntensities.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#f472b6' }}>
                  <Trans i18nKey="statsIntensitiesPlayed" />
                </Typography>
                <DistributionChart
                  data={sortedIntensities}
                  maxValue={getMaxDistributionValue(mergedIntensities)}
                  barColor="#f472b6"
                  labelWidth={80}
                />
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {sortedCategoriesLanded.length > 0 && (
              <Box sx={{ mb: sortedBoardCategories.length > 0 ? 2 : 0 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fbbf24' }}>
                  <Trans i18nKey="statsCategoriesLanded" />
                </Typography>
                <DistributionChart
                  data={sortedCategoriesLanded.slice(0, 10)}
                  maxValue={getMaxDistributionValue(stats.categoriesLandedOn || {})}
                  barColor="#fbbf24"
                  labelWidth={120}
                />
              </Box>
            )}

            {sortedBoardCategories.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#4ade80' }}>
                  <Trans i18nKey="statsBoardCategories" />
                </Typography>
                <DistributionChart
                  data={sortedBoardCategories.slice(0, 10)}
                  maxValue={getMaxDistributionValue(mergedCategories)}
                  barColor="#4ade80"
                  labelWidth={120}
                />
              </Box>
            )}
          </Grid>
        </Grid>

        {!hasPlayedData && (
          <Paper sx={{ p: 3, textAlign: 'center' }} elevation={2}>
            <Typography color="text.secondary">
              <Trans i18nKey="statsNoData" />
            </Typography>
          </Paper>
        )}
      </Box>
    </DialogWrapper>
  );
}
