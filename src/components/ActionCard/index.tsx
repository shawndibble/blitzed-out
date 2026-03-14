import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Button, Divider, LinearProgress, Paper, Portal, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { extractAction, extractTime } from '@/helpers/strings';
import CloseIcon from '@/components/CloseIcon';
import CountDownButtonModal from '@/components/CountDownButtonModal';
import GameOverDialog from '@/components/GameOverDialog';
import { Player } from '@/types/player';
import useBreakpoint from '@/hooks/useBreakpoint';
import useCountdown from '@/hooks/useCountdown';
import { useCardSound } from '@/hooks/useCardSound';
import { getCardVariants } from './animations';

interface ActionCardProps {
  open: boolean;
  text?: string;
  displayName?: string;
  handleClose: () => void;
  stopAutoClose?: () => void;
  nextPlayer: Player | null;
  isMyMessage?: boolean;
}

const AUTO_CLOSE_SECONDS = 20;

export default function ActionCard({
  open,
  text = '',
  displayName = '',
  handleClose,
  stopAutoClose = () => null,
  nextPlayer = null,
  isMyMessage = false,
}: ActionCardProps): JSX.Element {
  const { t } = useTranslation();
  const isMobile = useBreakpoint();
  const [isGameOverOpen, setIsGameOverOpen] = useState<boolean>(false);
  const [showAutoCloseText, setShowAutoCloseText] = useState<boolean>(true);
  const playCardSound = useCardSound();

  const title = text?.match(/#\d*:.*(?=\n)/gs);
  const description = extractAction(text) || '';
  const numbers = extractTime(text, t('seconds'));
  const { timeLeft, togglePause } = useCountdown(AUTO_CLOSE_SECONDS, false);
  const player = nextPlayer?.displayName;

  useEffect(() => {
    if (open) {
      playCardSound();
    }
  }, [open, playCardSound]);

  const preventClose = useCallback(() => {
    togglePause();
    stopAutoClose();
    setShowAutoCloseText(false);
  }, [togglePause, stopAutoClose]);

  const openGameOver = useCallback(() => {
    preventClose();
    setIsGameOverOpen(true);
  }, [preventClose]);

  const closeGameOver = useCallback(() => {
    setIsGameOverOpen(false);
  }, []);

  const cardVariants = getCardVariants();

  return (
    <>
      <Portal>
        <AnimatePresence>
          {open && (
            <motion.div
              key="action-card-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1300,
              }}
            >
              {/* Backdrop */}
              <Box
                onClick={handleClose}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                }}
              />

              {/* Card */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: isMobile ? 16 : 24,
                  pointerEvents: 'none',
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="action-card-title"
                aria-describedby="action-card-description"
              >
                <Paper
                  elevation={8}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    width: '100%',
                    maxWidth: isMobile ? '100%' : 500,
                    maxHeight: isMobile ? '100%' : '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    pointerEvents: 'auto',
                  }}
                >
                  {/* Desktop: Left accent bar, Mobile: Top accent bar */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      flex: 1,
                    }}
                  >
                    {/* Accent bar */}
                    <Box
                      sx={{
                        width: isMobile ? '100%' : 8,
                        height: isMobile ? 8 : 'auto',
                        bgcolor: 'primary.main',
                        flexShrink: 0,
                      }}
                    />

                    {/* Main content */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Title */}
                      <Box sx={{ px: 3, pt: 2, pr: 6, position: 'relative' }}>
                        <Typography
                          id="action-card-title"
                          variant="subtitle1"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          {`${title} ${t('for')} ${displayName}`}
                        </Typography>
                        <CloseIcon close={handleClose} />
                      </Box>

                      {/* Action description */}
                      <Box sx={{ px: 3, py: 2, flex: 1 }}>
                        <Typography id="action-card-description" variant="h4" sx={{ mb: 1 }}>
                          {description}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {showAutoCloseText ? (
                            <Trans i18nKey="autoCloseModal" values={{ timeLeft }} />
                          ) : (
                            <Trans i18nKey="autoCloseStopped" />
                          )}
                        </Typography>
                      </Box>

                      {/* Timer buttons */}
                      {numbers?.length && (
                        <Box
                          sx={{
                            px: 3,
                            pb: 2,
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            flexWrap: 'wrap',
                            gap: 1,
                            alignItems: isMobile ? 'stretch' : 'center',
                          }}
                        >
                          {!isMobile && <Trans i18nKey="timers" />}
                          {numbers.map((textString) => (
                            <CountDownButtonModal
                              key={textString}
                              textString={textString}
                              preventParentClose={preventClose}
                            />
                          ))}
                        </Box>
                      )}

                      {/* Next player info */}
                      {!!nextPlayer && (
                        <Box sx={{ px: 3, pb: 2 }}>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="body1"
                            sx={{
                              textAlign: isMobile ? 'center' : 'right',
                            }}
                          >
                            {nextPlayer.isSelf ? (
                              <Trans i18nKey="yourTurn" />
                            ) : (
                              <Trans i18nKey="nextPlayersTurn" values={{ player }} />
                            )}
                          </Typography>
                        </Box>
                      )}

                      {/* Play Again button */}
                      {!!isMyMessage && text.includes(t('finish')) && (
                        <Box sx={{ px: 3, pb: 2 }}>
                          <Divider sx={{ mb: 2 }} />
                          <Box textAlign="center">
                            <Button onClick={openGameOver} variant="contained" color="primary">
                              <Typography>{t('playAgain')}</Typography>
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {/* Progress bar at bottom */}
                      <Box sx={{ px: 3, pb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(0, Math.min(100, (timeLeft / AUTO_CLOSE_SECONDS) * 100))}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            '& .MuiLinearProgress-bar': {
                              transition: 'transform 1000ms linear',
                            },
                          }}
                          aria-label={t('autoCloseProgress')}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
      <GameOverDialog isOpen={isGameOverOpen} close={closeGameOver} />
    </>
  );
}
