import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  Button,
  ButtonGroup,
  ListItemText,
  Menu,
  MenuItem,
  Portal,
  Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import CloseIcon from '@/components/CloseIcon';
import useGameBoard from '@/hooks/useGameBoard';
import useReturnToStart from '@/hooks/useReturnToStart';
import { useSettings } from '@/stores/settingsStore';
import { vibrate } from '@/utils/haptics';
import type { FinishOutcome } from '@/helpers/finishOutcome';

interface GameOverScreenProps {
  open: boolean;
  outcome: FinishOutcome | null;
  close: () => void;
}

interface OutcomeStyle {
  color: string;
  hoverColor: string;
  glow: string;
  gradient: string;
}

const OUTCOME_STYLES: Record<FinishOutcome, OutcomeStyle> = {
  cum: {
    color: '#FFD54F',
    hoverColor: '#FFE082',
    glow: 'rgba(255, 213, 79, 0.55)',
    gradient: 'radial-gradient(circle at 50% 35%, rgba(255,213,79,0.22), transparent 65%)',
  },
  ruined: {
    color: '#FF8A65',
    hoverColor: '#FFAB91',
    glow: 'rgba(255, 138, 101, 0.5)',
    gradient: 'radial-gradient(circle at 50% 35%, rgba(255,138,101,0.18), transparent 65%)',
  },
  noCum: {
    color: '#CFD8DC',
    hoverColor: '#ECEFF1',
    glow: 'rgba(144, 164, 174, 0.75)',
    gradient: 'radial-gradient(circle at 50% 35%, rgba(144,164,174,0.16), transparent 65%)',
  },
};

// Unrecognized finish text (e.g. imported boards): neutral purple treatment.
const FALLBACK_STYLE: OutcomeStyle = {
  color: '#B39DDB',
  hoverColor: '#D1C4E9',
  glow: 'rgba(179, 157, 219, 0.45)',
  gradient: 'radial-gradient(circle at 50% 35%, rgba(179,157,219,0.16), transparent 65%)',
};

const SUBLINE_KEYS: Record<FinishOutcome, string> = {
  cum: 'finishSublineCum',
  ruined: 'finishSublineRuined',
  noCum: 'finishSublineNoCum',
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);

export default function GameOverScreen({ open, outcome, close }: GameOverScreenProps): JSX.Element {
  const { t } = useTranslation();
  const { id: room } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sendUserToStart = useReturnToStart();
  const updateGameBoardTiles = useGameBoard();
  const [settings] = useSettings();

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const style = outcome ? OUTCOME_STYLES[outcome] : FALLBACK_STYLE;
  const heroText = outcome ? t(outcome) : t('finish');
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (open && settings?.hapticFeedback) {
      vibrate('medium');
    }
  }, [open, settings?.hapticFeedback]);

  const returnToStart = useCallback(async () => {
    if (settings?.hapticFeedback) {
      vibrate('short');
    }
    await sendUserToStart();
    close();
  }, [sendUserToStart, close, settings?.hapticFeedback]);

  const rebuild = useCallback(async () => {
    if (settings?.hapticFeedback) {
      vibrate('short');
    }
    await updateGameBoardTiles({ ...settings, boardUpdated: true });
    await sendUserToStart();
    close();
  }, [updateGameBoardTiles, settings, sendUserToStart, close]);

  const openSettings = useCallback(() => {
    if (settings?.hapticFeedback) {
      vibrate('short');
    }
    close();
    navigate(`/${(room || 'PUBLIC').toUpperCase()}/settings`);
  }, [close, navigate, room, settings?.hapticFeedback]);

  const openMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const pickRebuild = useCallback(() => {
    closeMenu();
    rebuild();
  }, [closeMenu, rebuild]);

  const pickSameBoard = useCallback(() => {
    closeMenu();
    returnToStart();
  }, [closeMenu, returnToStart]);

  const pickSettings = useCallback(() => {
    closeMenu();
    openSettings();
  }, [closeMenu, openSettings]);

  const heroAnimation = reducedMotion
    ? { opacity: 1 }
    : {
        opacity: 1,
        scale: [0.6, 1.08, 1],
        textShadow: [`0 0 0px ${style.glow}`, `0 0 42px ${style.glow}`, `0 0 18px ${style.glow}`],
      };

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            key="game-over-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.5 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-outcome"
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(13, 17, 28, 0.94)',
                backgroundImage: style.gradient,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                px: 3,
              }}
            >
              <CloseIcon close={close} />

              <motion.div
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reducedMotion ? 0 : 0.2 }}
              >
                <Typography
                  variant="overline"
                  sx={{ color: 'text.secondary', letterSpacing: '0.35em', fontSize: '0.9rem' }}
                >
                  {t('finish')}
                </Typography>
              </motion.div>

              <Box>
                <motion.div
                  initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.6 }}
                  animate={heroAnimation}
                  transition={{ duration: reducedMotion ? 0.15 : 0.9, ease: 'easeOut' }}
                  style={{ textAlign: 'center' }}
                >
                  <Typography
                    id="game-over-outcome"
                    component="div"
                    sx={{
                      fontSize: 'clamp(2.6rem, 9vw, 4.2rem)',
                      fontWeight: 800,
                      lineHeight: 1.05,
                      color: style.color,
                      textShadow: `0 0 18px ${style.glow}`,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {heroText}
                  </Typography>
                </motion.div>
                {outcome && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reducedMotion ? 0 : 0.8, duration: 0.4 }}
                  >
                    <Typography
                      sx={{
                        textAlign: 'center',
                        color: 'text.secondary',
                        mt: 2,
                        fontSize: '1.1rem',
                      }}
                    >
                      {t(SUBLINE_KEYS[outcome])}
                    </Typography>
                  </motion.div>
                )}
              </Box>

              <motion.div
                initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reducedMotion ? 0 : 1.0, duration: 0.4 }}
                style={{ width: '100%', maxWidth: 360, marginTop: 16 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <ButtonGroup
                    variant="contained"
                    size="large"
                    disableElevation
                    sx={{
                      width: '100%',
                      borderRadius: 3,
                      overflow: 'hidden',
                      '& .MuiButton-root': {
                        bgcolor: style.color,
                        color: '#0d111c',
                        fontWeight: 700,
                        '&:hover': { bgcolor: style.hoverColor, transform: 'none' },
                      },
                      '& .MuiButtonGroup-grouped:not(:last-of-type)': {
                        borderColor: 'rgba(13, 17, 28, 0.35)',
                      },
                    }}
                  >
                    <Button onClick={rebuild} sx={{ flex: 1, px: 5, py: 1.2, fontSize: '1.1rem' }}>
                      {t('rebuildBoard')}
                    </Button>
                    <Button
                      onClick={openMenu}
                      aria-label={t('moreOptions')}
                      aria-haspopup="menu"
                      sx={{ px: 1.5 }}
                    >
                      <ArrowDropDownIcon />
                    </Button>
                  </ButtonGroup>
                  <Menu
                    anchorEl={menuAnchor}
                    open={!!menuAnchor}
                    onClose={closeMenu}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  >
                    <MenuItem onClick={pickRebuild} sx={{ whiteSpace: 'normal', maxWidth: 320 }}>
                      <ListItemText
                        primary={t('rebuildBoard')}
                        secondary={t('rebuildBoardDescription')}
                      />
                    </MenuItem>
                    <MenuItem onClick={pickSameBoard} sx={{ whiteSpace: 'normal', maxWidth: 320 }}>
                      <ListItemText
                        primary={t('sameBoard')}
                        secondary={t('sameBoardDescription')}
                      />
                    </MenuItem>
                    <MenuItem onClick={pickSettings} sx={{ whiteSpace: 'normal', maxWidth: 320 }}>
                      <ListItemText
                        primary={t('changeSettings')}
                        secondary={t('changeSettingsDescription')}
                      />
                    </MenuItem>
                  </Menu>
                </Box>
              </motion.div>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
