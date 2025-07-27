import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Refresh, Visibility } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Settings } from '@/types/Settings';

interface TilePreviewProps {
  formData: Settings;
  actionsList: Record<string, any>;
}

interface SampleTile {
  action: string;
  group: string;
  intensity: string;
}

export default function TilePreview({ formData, actionsList }: TilePreviewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sampleTiles, setSampleTiles] = useState<SampleTile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate realistic sample tiles based on current selections from actual Dexie data
  const generateSampleTiles = useMemo(() => {
    return () => {
      if (!formData.selectedActions || Object.keys(formData.selectedActions).length === 0) {
        setSampleTiles([]);
        return;
      }

      const tiles: SampleTile[] = [];
      const selectedGroups = Object.keys(formData.selectedActions);

      // Generate 4 sample tiles from selected actions using actual Dexie data
      for (let i = 0; i < 4 && selectedGroups.length > 0; i++) {
        const randomGroup = selectedGroups[Math.floor(Math.random() * selectedGroups.length)];
        const groupData = actionsList[randomGroup];

        if (!groupData?.actions) continue;

        // Get the selected intensity level for this group
        const selectedAction = formData.selectedActions[randomGroup];
        const intensityLevel = selectedAction?.level || 1;

        // Get the intensity name
        const intensityName = groupData?.intensities?.[intensityLevel] || 'Beginner';

        // Get all actions for this intensity level
        const intensityActions = groupData.actions[intensityName] || [];

        if (intensityActions.length === 0) {
          // Fallback to any available intensity if selected one is empty
          const availableIntensities = Object.keys(groupData.actions).filter(
            (key) => key !== 'None' && groupData.actions[key].length > 0
          );
          if (availableIntensities.length > 0) {
            const fallbackIntensity =
              availableIntensities[Math.floor(Math.random() * availableIntensities.length)];
            const fallbackActions = groupData.actions[fallbackIntensity];
            if (fallbackActions.length > 0) {
              const randomAction =
                fallbackActions[Math.floor(Math.random() * fallbackActions.length)];
              tiles.push({
                action: randomAction,
                group: groupData?.label || randomGroup,
                intensity: fallbackIntensity,
              });
            }
          }
        } else {
          // Use action from selected intensity
          const randomAction =
            intensityActions[Math.floor(Math.random() * intensityActions.length)];
          tiles.push({
            action: randomAction,
            group: groupData?.label || randomGroup,
            intensity: intensityName,
          });
        }
      }

      setSampleTiles(tiles);
    };
  }, [formData.selectedActions, actionsList]);

  // Generate initial tiles when selections change
  useEffect(() => {
    generateSampleTiles();
  }, [generateSampleTiles]);

  const handleRefresh = async () => {
    setIsGenerating(true);
    // Add small delay for better UX
    setTimeout(() => {
      generateSampleTiles();
      setIsGenerating(false);
    }, 500);
  };

  if (!formData.selectedActions || Object.keys(formData.selectedActions).length === 0) {
    return (
      <Card sx={{ mt: 3, opacity: 0.6 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Visibility color="disabled" />
            <Typography variant="h6" color="text.secondary">
              Tile Preview
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Select some actions above to see sample tiles from your game.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 3, border: 1, borderColor: 'primary.main' }}>
      <CardContent>
        <Stack
          direction={isMobile ? 'column' : 'row'}
          alignItems={isMobile ? 'stretch' : 'center'}
          justifyContent="space-between"
          spacing={isMobile ? 2 : 0}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Visibility color="primary" />
            <Typography variant="h6">{t('sampleTilesFromSelection')}</Typography>
          </Stack>
          <Button
            size={isMobile ? 'medium' : 'small'}
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isGenerating}
            variant="outlined"
            fullWidth={isMobile}
          >
            {t('generateMoreExamples')}
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Here are some example tiles based on your current selections:
        </Typography>

        <Stack spacing={2}>
          {sampleTiles.map((tile, index) => (
            <Box key={index}>
              <Card
                variant="outlined"
                sx={{ backgroundColor: 'background.paper', border: 1, borderColor: 'divider' }}
              >
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="body1" sx={{ mb: 1, color: 'text.primary' }}>
                    {tile.action}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={tile.group} size="small" color="primary" variant="outlined" />
                    <Chip
                      label={tile.intensity}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          * These are sample tiles. Your actual game will have many more variations based on your
          settings.
        </Typography>
      </CardContent>
    </Card>
  );
}
