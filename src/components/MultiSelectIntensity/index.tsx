import {
  Checkbox,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { Clear } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

interface MultiSelectIntensityProps {
  actionName: string;
  actionLabel: string;
  selectedLevels: number[];
  availableLevels: number[];
  intensityNames?: Record<number, string>; // Map level numbers to their display names
  onChange: (levels: number[]) => void;
  disabled?: boolean;
  showValueGlow?: boolean; // Whether to show glow effect when values are selected
}

export default function MultiSelectIntensity({
  actionName,
  actionLabel,
  selectedLevels,
  availableLevels,
  intensityNames = {},
  onChange,
  disabled = false,
  showValueGlow = false,
}: MultiSelectIntensityProps): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();

  const labelId = `${actionName}-intensity-label`;

  // Create glow styling when showValueGlow is true and there are selected levels
  const shouldShowGlow = showValueGlow && selectedLevels.length > 0;
  const glowSx = shouldShowGlow
    ? {
        boxShadow: `0 0 8px ${theme.palette.primary.main}`,
      }
    : {};

  // Add background to label when glowing for better readability
  const labelSx = shouldShowGlow
    ? {
        backgroundColor: 'var(--color-surface)',
        borderRadius: '8px',
        padding: '0 8px',
      }
    : {};

  const handleChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    // value should always be an array when multiple={true}
    const levels = (value as number[]).filter((n) => !isNaN(n)).sort((a, b) => a - b);

    onChange(levels);
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the select dropdown
    onChange([]);
  };

  // Custom render function to display selected intensity level names
  const renderValue = (selected: number[]) => {
    if (selected.length === 0) {
      return t('none');
    }
    return selected.map((level) => intensityNames[level] || `${t('level')} ${level}`).join(', ');
  };

  if (availableLevels.length === 0) {
    return <></>;
  }

  return (
    <FormControl margin="normal" fullWidth disabled={disabled}>
      <InputLabel id={labelId} sx={labelSx}>
        {actionLabel}
      </InputLabel>
      <Select
        labelId={labelId}
        id={actionName}
        label={actionLabel}
        multiple
        value={selectedLevels}
        onChange={handleChange}
        renderValue={renderValue}
        sx={glowSx}
        endAdornment={
          selectedLevels.length > 0 && (
            <IconButton
              size="small"
              onClick={handleClear}
              sx={{
                position: 'absolute',
                right: 24, // Position to the left of the dropdown arrow
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <Clear fontSize="small" />
            </IconButton>
          )
        }
      >
        {availableLevels.map((level) => (
          <MenuItem key={level} value={level}>
            <Checkbox checked={selectedLevels.includes(level)} />
            <ListItemText primary={intensityNames[level] || `${t('level')} ${level}`} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
