import { Box, Typography, Divider } from '@mui/material';
import './styles.css';
import { Trans } from 'react-i18next';
import { useState, SyntheticEvent } from 'react';
import Accordion from '@/components/Accordion';
import AccordionSummary from '@/components/Accordion/Summary';
import AccordionDetails from '@/components/Accordion/Details';

export default function GameGuide(): JSX.Element {
  const [expanded, setExpanded] = useState<string | false>(false);
  const handleChange =
    (panel: string) => (_event: SyntheticEvent<Element, Event>, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  return (
    <Box className="game-guide">
      {/* Hero Section */}
      <Box className="hero-section">
        <Trans i18nKey="gameDesc">
          <Typography variant="h5" className="hero-title gradient-text-flame">
            Transform Your Intimate Adventures
          </Typography>
          <Typography variant="body1" className="hero-description">
            Blitzed Out is the ultimate customizable adult experience platform. Whether you&apos;re
            exploring solo, spicing things up as a couple, or hosting an unforgettable party — this
            is your playground.
          </Typography>
          <Typography variant="body2" className="hero-subtitle">
            Create personalized experiences with endless customization, join private rooms, or
            discover new adventures with a vibrant community.
          </Typography>
        </Trans>
      </Box>

      <Divider className="section-divider" />

      {/* Features Section */}
      <Box className="features-section">
        <Typography variant="h6" className="section-title">
          <Trans i18nKey="whySpecialTitle" />
        </Typography>

        <Box className="features-grid">
          <Box className="feature-item">
            <Trans i18nKey="customizationFeature">
              <Box className="feature-icon">🎲</Box>
              <Typography variant="subtitle1" className="feature-title">
                Unlimited Customization
              </Typography>
              <Typography variant="body2" className="feature-description">
                Create your perfect experience with custom boards, actions, and intensity levels
                tailored to your desires.
              </Typography>
            </Trans>
          </Box>

          <Box className="feature-item">
            <Trans i18nKey="privacyFeature">
              <Box className="feature-icon">🔒</Box>
              <Typography variant="subtitle1" className="feature-title">
                Complete Privacy Control
              </Typography>
              <Typography variant="body2" className="feature-description">
                Private rooms, local play options, and anonymous sessions. Your privacy and comfort
                come first.
              </Typography>
            </Trans>
          </Box>

          <Box className="feature-item">
            <Trans i18nKey="varietyFeature">
              <Box className="feature-icon">🌟</Box>
              <Typography variant="subtitle1" className="feature-title">
                Endless Variety
              </Typography>
              <Typography variant="body2" className="feature-description">
                From gentle exploration to intense adventures — with community-created content and
                regular updates.
              </Typography>
            </Trans>
          </Box>
        </Box>
      </Box>

      {/* Getting Started */}
      <Accordion
        expanded={expanded === 'panel1'}
        onChange={handleChange('panel1')}
        className="about-accordion"
      >
        <AccordionSummary aria-controls="panel1-content" id="panel1-header">
          <Typography className="accordion-title">
            <Trans i18nKey="gettingStartedTitle" />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Trans i18nKey="gettingStartedDescription">
            <Box className="steps-container">
              <Box className="step-item">
                <Box className="step-number">1</Box>
                <Typography variant="body1">Enter your name above to start your session</Typography>
              </Box>
              <Box className="step-item">
                <Box className="step-number">2</Box>
                <Typography variant="body1">
                  Customize your experience in the setup wizard
                </Typography>
              </Box>
              <Box className="step-item">
                <Box className="step-number">3</Box>
                <Typography variant="body1">Roll the dice and let the adventure begin</Typography>
              </Box>
            </Box>
            <Typography variant="body2" className="helpful-tip">
              New to this? Start with lighter intensity levels and explore at your own pace. You can
              always adjust settings anytime.
            </Typography>
          </Trans>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
