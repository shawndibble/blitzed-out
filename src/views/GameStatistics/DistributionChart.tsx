import { Box, LinearProgress, Paper, Typography } from '@mui/material';

interface DistributionChartProps {
  data: [string | number, number][];
  maxValue: number;
  barColor?: string;
  labelWidth?: number;
}

export default function DistributionChart({
  data,
  maxValue,
  barColor = '#22d3ee',
  labelWidth = 24,
}: DistributionChartProps): JSX.Element | null {
  if (data.length === 0) return null;

  return (
    <Paper sx={{ p: 2 }} elevation={2}>
      <Box>
        {data.map(([label, count]) => {
          const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
          return (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography
                variant="body2"
                sx={{
                  width: labelWidth,
                  textAlign: 'right',
                  mr: 1,
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={String(label)}
              >
                {label}
              </Typography>
              <Box sx={{ flexGrow: 1, mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 16,
                    borderRadius: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: barColor,
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ width: 40, textAlign: 'right' }}>
                {count}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
