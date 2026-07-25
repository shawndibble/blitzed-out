import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingGroup, SettingRow } from '../components/SettingRow';
import {
  DeviceSharing,
  SessionCompany,
  deriveSetupAnswers,
  resolveSetupAnswers,
} from '../setupQuestions';
import { Settings } from '@/types/Settings';

interface SetupSectionProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  /** Supplies the room to join when one is needed: the user's private room
   * this visit if they have one, else a fresh code. */
  getPrivateRoom: () => string;
  /** Fired when the participation answer changes, so the owner of the action
   * catalog can re-point the selection once the new catalog loads. */
  onParticipationChange: (soloPlay: boolean) => void;
}

/**
 * The two questions that decide everything else on the page, plus the one
 * sub-question that belongs to a single answer.
 *
 * Topology is **derived**, never chosen (CONTEXT.md "Setup Questions"): the
 * old single Players & Devices control claimed to be about devices, but its
 * Solo/With Others split was really about who else is in the room — only
 * Shared Device is a device distinction. Splitting the two makes each answer
 * mean one thing, and makes the invalid pairings unreachable rather than
 * merely discouraged.
 *
 * Participation renders as a nested sub-row of "friends by code" because that
 * is the only answer where it is a real choice; every other answer forces its
 * content set. It used to live three sections down in Actions, which is why it
 * appeared to come out of nowhere.
 */
export default function SetupSection({
  formData,
  setFormData,
  getPrivateRoom,
  onParticipationChange,
}: SetupSectionProps): JSX.Element {
  const { t } = useTranslation();

  const answers = deriveSetupAnswers(formData.gameMode, formData.room);
  const soloPlay = formData.soloPlay !== false;

  const apply = (next: Partial<typeof answers>): void => {
    const merged = { ...answers, ...next };
    const { gameMode, room } = resolveSetupAnswers(merged, formData.room, getPrivateRoom);
    if (gameMode === formData.gameMode && room === formData.room) return;
    setFormData({ ...formData, gameMode, room, boardUpdated: true });
  };

  const helpLine = (label: string, body: string): JSX.Element => (
    <Typography variant="body2" key={label}>
      <Box component="span" sx={{ fontWeight: 600 }}>
        {label}
      </Box>
      {` — ${body}`}
    </Typography>
  );

  return (
    <SettingGroup>
      <SettingRow
        label={t('setupDeviceQuestion')}
        description={
          answers.device === 'several' ? t('setupDeviceDescSeveral') : t('setupDeviceDescJustMe')
        }
        help={[
          helpLine(t('setupDeviceJustMe'), t('setupDeviceHelpJustMe')),
          helpLine(t('setupDeviceSeveral'), t('setupDeviceHelpSeveral')),
        ]}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={answers.device}
          onChange={(_, value: DeviceSharing | null) => value && apply({ device: value })}
          aria-label={t('setupDeviceQuestion')}
        >
          <ToggleButton value="justMe">{t('setupDeviceJustMe')}</ToggleButton>
          <ToggleButton value="several">{t('setupDeviceSeveral')}</ToggleButton>
        </ToggleButtonGroup>
      </SettingRow>

      {/* Hidden rather than disabled for several-of-us: passing one device
          around forces a private room with no outsiders, so the question has
          no answer to give. Room & players states the resulting room as fact. */}
      {answers.device === 'justMe' && (
        <SettingRow
          label={t('setupCompanyQuestion')}
          description={t(
            answers.company === 'strangers'
              ? 'setupCompanyDescStrangers'
              : answers.company === 'friends'
                ? 'setupCompanyDescFriends'
                : 'setupCompanyDescNoOne'
          )}
          help={[
            helpLine(t('setupCompanyNoOne'), t('setupCompanyHelpNoOne')),
            helpLine(t('setupCompanyStrangers'), t('setupCompanyHelpStrangers')),
            helpLine(t('setupCompanyFriends'), t('setupCompanyHelpFriends')),
          ]}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={answers.company}
            onChange={(_, value: SessionCompany | null) => value && apply({ company: value })}
            aria-label={t('setupCompanyQuestion')}
          >
            <ToggleButton value="noOne">{t('setupCompanyNoOne')}</ToggleButton>
            <ToggleButton value="strangers">{t('setupCompanyStrangers')}</ToggleButton>
            <ToggleButton value="friends">{t('setupCompanyFriends')}</ToggleButton>
          </ToggleButtonGroup>
        </SettingRow>
      )}

      {answers.device === 'justMe' && answers.company === 'friends' && (
        <SettingRow
          nested
          label={t('setupParticipationQuestion')}
          description={t('setupParticipationDesc')}
          help={[
            helpLine(t('setupParticipationJustMe'), t('setupParticipationHelpJustMe')),
            helpLine(t('setupParticipationPartner'), t('setupParticipationHelpPartner')),
          ]}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={soloPlay ? 'justMe' : 'partner'}
            onChange={(_, value: string | null) =>
              value && onParticipationChange(value === 'justMe')
            }
            aria-label={t('setupParticipationQuestion')}
          >
            <ToggleButton value="justMe">{t('setupParticipationJustMe')}</ToggleButton>
            <ToggleButton value="partner">{t('setupParticipationPartner')}</ToggleButton>
          </ToggleButtonGroup>
        </SettingRow>
      )}
    </SettingGroup>
  );
}
