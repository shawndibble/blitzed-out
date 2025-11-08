import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  Alert,
  Avatar,
  Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { LocalPlayer } from '@/types';
import type { PlayerRole } from '@/types/Settings';
import type { PlayerGender } from '@/types/localPlayers';
import SoundSelector from '@/components/SoundSelector';
import GenderSelector from '@/components/GenderSelector';
import { getRandomSound } from '@/utils/gameSounds';

interface PlayerFormProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Player to edit (null for new player) */
  player: LocalPlayer | null;
  /** Existing players (for name validation) */
  existingPlayers: LocalPlayer[];
  /** Callback when form is submitted */
  onSubmit: (playerData: Partial<LocalPlayer>) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
}

interface FormData {
  name: string;
  role: PlayerRole;
  gender: PlayerGender;
  sound: string;
}

interface FormErrors {
  name?: string;
  role?: string;
}

/**
 * PlayerForm component for creating/editing player information
 * Provides validation and a clean form interface
 */
export default function PlayerForm({
  open,
  player,
  existingPlayers,
  onSubmit,
  onCancel,
}: PlayerFormProps): JSX.Element {
  const { t } = useTranslation();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    role: 'vers',
    gender: 'prefer-not-say',
    sound: getRandomSound().id,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when player changes
  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name,
        role: player.role,
        gender: player.gender || 'prefer-not-say',
        sound: player.sound || getRandomSound().id,
      });
    } else {
      setFormData({
        name: '',
        role: 'vers',
        gender: 'prefer-not-say',
        sound: getRandomSound().id,
      });
    }
    setErrors({});
  }, [player, open]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = t('localPlayers.form.errors.nameRequired');
    } else if (trimmedName.length < 2) {
      newErrors.name = t('localPlayers.form.errors.nameTooShort');
    } else if (trimmedName.length > 20) {
      newErrors.name = t('localPlayers.form.errors.nameTooLong');
    } else {
      // Check for duplicate names (excluding current player)
      const isDuplicate = existingPlayers.some(
        (p) => p.id !== player?.id && p.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (isDuplicate) {
        newErrors.name = t('localPlayers.form.errors.nameDuplicate');
      }
    }

    // Role validation
    if (!formData.role || !['dom', 'sub', 'vers'].includes(formData.role)) {
      newErrors.role = t('localPlayers.form.errors.roleRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, existingPlayers, player, t]);

  // Handle input changes
  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, name: value }));

      // Clear name error when user starts typing
      if (errors.name) {
        setErrors((prev) => ({ ...prev, name: undefined }));
      }
    },
    [errors.name]
  );

  const handleRoleChange = useCallback(
    (event: any) => {
      const value = event.target.value as PlayerRole;
      setFormData((prev) => ({ ...prev, role: value }));

      // Clear role error when user selects
      if (errors.role) {
        setErrors((prev) => ({ ...prev, role: undefined }));
      }
    },
    [errors.role]
  );

  const handleGenderChange = useCallback((gender: PlayerGender) => {
    setFormData((prev) => ({ ...prev, gender }));
  }, []);

  const handleSoundChange = useCallback((soundId: string) => {
    setFormData((prev) => ({ ...prev, sound: soundId }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const playerData: Partial<LocalPlayer> = {
        name: formData.name.trim(),
        role: formData.role,
        gender: formData.gender,
        sound: formData.sound,
      };

      await onSubmit(playerData);
    } catch (error) {
      console.error('Error submitting player form:', error);
      // Keep form open on error
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setFormData({
      name: '',
      role: 'vers',
      gender: 'prefer-not-say',
      sound: getRandomSound().id,
    });
    setErrors({});
    onCancel();
  }, [onCancel]);

  // Helper functions
  const getPlayerInitials = useCallback((name: string): string => {
    return (
      name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'P'
    );
  }, []);

  const getRoleColor = (role: PlayerRole): 'primary' | 'secondary' | 'default' => {
    switch (role) {
      case 'dom':
        return 'primary';
      case 'sub':
        return 'secondary';
      case 'vers':
        return 'default';
      default:
        return 'default';
    }
  };

  const isEditMode = Boolean(player);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        {isEditMode
          ? t('localPlayers.form.editPlayerTitle')
          : t('localPlayers.form.addPlayerTitle')}
      </DialogTitle>

      <DialogContent>
        {/* Player Preview */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 56,
              height: 56,
              fontSize: '1.5rem',
              fontWeight: 'bold',
            }}
          >
            {getPlayerInitials(formData.name || 'P')}
          </Avatar>
          <Box sx={{ direction: 'row' }}>
            <Typography variant="h6">
              {formData.name || t('localPlayers.form.previewName')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={t(`roles.${formData.role}`)}
                size="small"
                color={getRoleColor(formData.role)}
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        {/* Form Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Name Field */}
          <TextField
            label={t('localPlayers.form.nameLabel')}
            value={formData.name}
            onChange={handleNameChange}
            error={Boolean(errors.name)}
            helperText={errors.name || t('localPlayers.form.nameHelper')}
            placeholder={t('localPlayers.form.namePlaceholder')}
            fullWidth
            autoFocus={!isEditMode}
            inputProps={{
              maxLength: 20,
            }}
          />

          {/* Role Field */}
          <FormControl fullWidth error={Boolean(errors.role)}>
            <InputLabel>{t('localPlayers.form.roleLabel')}</InputLabel>
            <Select
              value={formData.role}
              onChange={handleRoleChange}
              label={t('localPlayers.form.roleLabel')}
            >
              <MenuItem value="dom">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={t('roles.dom')} size="small" color="primary" variant="outlined" />
                  <Typography variant="body2" color="text.secondary">
                    {t('localPlayers.form.roleDescriptions.dom')}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="sub">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={t('roles.sub')} size="small" color="secondary" variant="outlined" />
                  <Typography variant="body2" color="text.secondary">
                    {t('localPlayers.form.roleDescriptions.sub')}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="vers">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={t('roles.vers')} size="small" color="default" variant="outlined" />
                  <Typography variant="body2" color="text.secondary">
                    {t('localPlayers.form.roleDescriptions.vers')}
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
            {errors.role && (
              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.5 }}>
                {errors.role}
              </Typography>
            )}
          </FormControl>

          {/* Gender Selection */}
          <GenderSelector
            selectedGender={formData.gender}
            onGenderChange={handleGenderChange}
          />

          {/* Sound Selection */}
          <SoundSelector
            selectedSoundId={formData.sound}
            onSoundChange={handleSoundChange}
            label={t('localPlayers.form.soundLabel', 'Turn Sound')}
          />

          {/* Help Text */}
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">{t('localPlayers.form.helpText')}</Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleCancel} disabled={isSubmitting}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || !formData.name.trim()}
        >
          {isSubmitting
            ? t('localPlayers.form.saving')
            : isEditMode
              ? t('localPlayers.form.saveChanges')
              : t('localPlayers.form.addPlayer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
