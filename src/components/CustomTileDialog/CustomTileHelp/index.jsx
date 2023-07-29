import Typography from '@mui/material/Typography';
import Accordion from 'components/Accordion';
import AccordionDetails from 'components/Accordion/Details';
import AccordionSummary from 'components/Accordion/Summary';
import { useState } from 'react';
import { Trans } from 'react-i18next';

export default function CustomTileHelp() {
  const [expanded, setExpanded] = useState(false);
  const handleChange = (panel) => (_event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <Trans i18nKey="customTileGuide">
      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
        <AccordionSummary aria-controls="panel1-content" id="panel1-header">
          <Typography>Custom Tiles Explained</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ mb: 2 }}>
            Custom tiles let you add your own variations to the game board.
            Utilize this dialog to add and remove tiles as you see fit.
          </Typography>
          <Typography sx={{ mb: 2 }}>
            Custom tiles are added based on the kink and intensity you pick from
            the drop down. As such, you need to have that kink and intensity
            (or a higher intensity) selected for your custom tiles to show on the board.
          </Typography>
          <Typography>
            Miscellaneous tiles are the only exception to the above. Regardless of what
            other options you pick, Miscellaneous tiles will show as their own group.
            If you use this option, ensure that you add multiple tiles to minimize repeats.
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
        <AccordionSummary aria-controls="panel2-content" id="panel2-header">
          <Typography>Ideas & Suggestions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="h6">Add new Activities</Typography>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Come up with new activities that are not part of
            the existing list
          </Typography>

          <Typography variant="h6">Add harder tiles to easier intensities</Typography>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            When you pick higher
            intensity levels, the game will use the earlier intensity level and gradual move
            to whatyou picked. If you want harder tiles early on, add several to lower
            intensities.
          </Typography>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Example: You play Poppers - Advanced. Add advanced tiles to Poppers - Beginner
          </Typography>

          <Typography variant="h6">Combine activities into a single tile</Typography>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Combine multiple activites together in a single tile that normally would not
            go together.
          </Typography>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Example: Spit roast. Use a toy in your throat and ass at the same time.
          </Typography>

          <Typography variant="h6">Miscellaneous custom tiles</Typography>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Miscellaneous tiles allow you to add your own tiles without including other groups.
            Be aware, you will want to add several options to this group to minimize repeats.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Trans>
  );
}
