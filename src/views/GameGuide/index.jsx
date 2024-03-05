import { Divider, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import './styles.css';
import { Trans } from 'react-i18next';
import { useState } from 'react';
import Accordion from 'components/Accordion';
import AccordionSummary from 'components/Accordion/Summary';
import AccordionDetails from 'components/Accordion/Details';

export default function GameGuide() {
  const [expanded, setExpanded] = useState('panel1');
  const handleChange = (panel) => (_event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <>
      <Trans i18nKey="gameDesc">
        <Typography variant="h4" sx={{ textAlign: 'center' }}>Blitzed Out</Typography>
        <Divider />
        <Typography variant="body1" mt={2}>
          An online adult sex board game for kinky people.
          Designed for solo play, couples or parties.
        </Typography>
        <Typography variant="body1" my={2}>
          Customize your own board or import someone else&apos;s,
          find your own room and play with other people online.
        </Typography>
      </Trans>

      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
        <AccordionSummary aria-controls="panel1-content" id="panel1-header">
          <Typography><Trans i18nKey="gettingStartedTitle" /></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Trans i18nKey="gettingStartedDescription">
            <ul>
              <li><Typography variant="body1">Pick a display name</Typography></li>
              <li><Typography variant="body1">Select your options. (append will add that option to other tiles).</Typography></li>
              <li><Typography variant="body1">Save changes/Access game.</Typography></li>
              <li><Typography variant="body1">When it is your turn, click the roll button and follow the prompts.</Typography></li>
            </ul>

            <Typography variant="body1" mt={2}>
              New player suggestion: Limit your selections to less than 4 total options.
            </Typography>

            <Typography variant="body1" mt={2}>
              Don&apos;t like your current board or some aspect of the game?
              Go to Menu, then Settings and change it.
              Utilize custom tiles to make make the game even more your own.
            </Typography>
          </Trans>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <Typography><Trans i18nKey="couplesTitle" /></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Trans i18nKey="couplesDescription">
            <Typography variant="body1" />
            <Typography variant="body1" sx={{ mt: 2 }} />
            <Typography variant="body1" sx={{ mt: 2 }} />
          </Trans>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
        <AccordionSummary aria-controls="panel3-content" id="panel3-header">
          <Typography><Trans i18nKey="coachTitle" /></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Trans i18nKey="coachDescription">
            <Typography variant="body1" />
            <Typography variant="body1" sx={{ mt: 2 }} />
          </Trans>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
        <AccordionSummary aria-controls="panel4-content" id="panel4-header">
          <Typography><Trans i18nKey="bugsTitle" /></Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1">
            <Trans i18nKey="bugsDescription">
              <Link className="discord-link" to="https://discord.gg/5dCH2WVsmX" target="_blank">Discord server</Link>
            </Trans>
          </Typography>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
