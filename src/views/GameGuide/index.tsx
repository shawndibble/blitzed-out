import './styles.css';

import { Box, Dialog, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

const steps = [
  {
    titleKey: 'howItWorksStep1Title',
    descKey: 'howItWorksStep1Desc',
    altKey: 'howItWorksStep1Alt',
    image: '/screenshots/setup-wizard.webp',
  },
  {
    titleKey: 'howItWorksStep2Title',
    descKey: 'howItWorksStep2Desc',
    altKey: 'howItWorksStep2Alt',
    image: '/screenshots/action-card.webp',
  },
  {
    titleKey: 'howItWorksStep3Title',
    descKey: 'howItWorksStep3Desc',
    altKey: 'howItWorksStep3Alt',
    image: '/screenshots/custom-tiles.webp',
  },
];

export default function GameGuide() {
  const { t } = useTranslation();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const closeLightbox = useCallback(() => setLightboxImage(null), []);

  return (
    <Box className="how-it-works">
      <Typography component="h2" variant="h5" className="how-it-works-title">
        {t('howItWorksTitle')}
      </Typography>

      <Box className="how-it-works-steps">
        {steps.map((step, index) => (
          <Box key={step.titleKey} className="how-it-works-step">
            <Box className="step-image-container">
              <img
                src={step.image}
                alt={t(step.altKey)}
                className="step-image"
                loading="lazy"
                width={600}
                height={400}
                onClick={() => setLightboxImage(step.image)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setLightboxImage(step.image);
                }}
              />
            </Box>
            <Box className="step-content">
              <Box className="step-header">
                <Box className="step-number-badge">{index + 1}</Box>
                <Typography component="h3" variant="h6" className="step-title">
                  {t(step.titleKey)}
                </Typography>
              </Box>
              <Typography variant="body1" className="step-description">
                {t(step.descKey)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Dialog
        open={!!lightboxImage}
        onClose={closeLightbox}
        maxWidth={false}
        slotProps={{
          paper: {
            sx: {
              background: 'transparent',
              boxShadow: 'none',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'visible',
            },
          },
          backdrop: {
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.85)' },
          },
        }}
      >
        {lightboxImage && (
          <img
            src={lightboxImage}
            alt=""
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 8,
              display: 'block',
            }}
          />
        )}
      </Dialog>
    </Box>
  );
}
