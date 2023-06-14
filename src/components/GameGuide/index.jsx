import { Divider, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import './styles.css';

export default function GameGuide() {
  return (
    <>
      <Typography variant="h4" sx={{ textAlign: 'center' }}>Blitzed Out</Typography>
      <Divider />
      <Typography variant="body1" mt={2}>
        An online adult board game for kinky individuals.
      </Typography>
      <Typography variant="body1" mt={2}>
        Customize your own board or import someone else&apos;s,
        find your own room and play with other people online.
      </Typography>
      <Typography variant="h5" mt={3}>Getting Started</Typography>
      <ol>
        <li><Typography variant="body1" mt={2}>Pick a display name</Typography></li>
        <li><Typography variant="body1">Select your options. (append will add that option to other tiles).</Typography></li>
        <li><Typography variant="body1">Save changes/Access game.</Typography></li>
        <li><Typography variant="body1">When it is your turn, click the roll button and follow the prompts.</Typography></li>
      </ol>
      <Typography variant="body1" mt={2}>
        Don&apos;t like your current board or some aspect of the game?
        Go to Menu, then Settings and change it.
      </Typography>

      <Typography variant="body1" mt={4}>
        See a Bug or have feedback/suggestions? Share it on our
        {' '}
        <Link className="discord-link" to="https://discord.gg/5dCH2WVsmX" target="_blank">Discord server</Link>
      </Typography>
    </>
  );
}
