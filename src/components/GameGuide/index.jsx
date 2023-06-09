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
      <Typography variant="body1" mt={2}>
        <ol>
          <li>Pick a display name</li>
          <li>Select your options. (append will add that option to other tiles).</li>
          <li>Save changes/Access game.</li>
          <li>When it is your turn, click the roll button and follow the prompts.</li>
        </ol>
      </Typography>
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
