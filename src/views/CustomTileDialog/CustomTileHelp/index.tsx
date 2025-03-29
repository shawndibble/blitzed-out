import Typography from '@mui/material/Typography';
import Accordion from '@/components/Accordion';
import AccordionDetails from '@/components/Accordion/Details';
import AccordionSummary from '@/components/Accordion/Summary';
import { Trans } from 'react-i18next';
import { CustomTileHelpProps } from '@/types/customTiles';

export default function CustomTileHelp({ expanded, handleChange }: CustomTileHelpProps) {
  return (
    <>
      <Accordion expanded={expanded === 'help1'} onChange={handleChange('help1')}>
        <AccordionSummary aria-controls="help1-content" id="help1-header">
          <Typography>
            <Trans i18nKey="ctExplained" />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Trans i18nKey="ctExplainedDescription">
            <Typography sx={{ mb: 2 }}>
              Custom tiles let you add your own variations to the game board. Utilize this dialog to
              add and remove tiles as you see fit.
            </Typography>
            <Typography sx={{ mb: 2 }}>
              Custom tiles are added based on the kink and intensity you pick from the drop down. As
              such, you need to have that kink and intensity (or a higher intensity) selected for
              your custom tiles to show on the board.
            </Typography>
            <Typography>
              Miscellaneous tiles are the only exception to the above. Regardless of what other
              options you pick, Miscellaneous tiles will show as their own group. If you use this
              option, ensure that you add multiple tiles to minimize repeats.
            </Typography>
          </Trans>
        </AccordionDetails>
      </Accordion>
      <Accordion expanded={expanded === 'help2'} onChange={handleChange('help2')}>
        <AccordionSummary aria-controls="help2-content" id="help2-header">
          <Typography>
            <Trans i18nKey="ctIdeas" />
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Trans i18nKey="ctIdeasDescription">
            <Typography variant="h6">Add new Activities</Typography>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Come up with new activities that are not part of the existing list
            </Typography>

            <Typography variant="h6">Add harder tiles to easier intensities</Typography>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              When you pick higher intensity levels, the game will use the earlier intensity level
              and gradual move to whatyou picked. If you want harder tiles early on, add several to
              lower intensities.
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Example: You play Poppers - Advanced. Add advanced tiles to Poppers - Beginner
            </Typography>

            <Typography variant="h6">Combine activities into a single tile</Typography>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Combine multiple activites together in a single tile that normally would not go
              together.
            </Typography>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Example: Spit roast. Use a toy in your throat and ass at the same time.
            </Typography>

            <Typography variant="h6">Miscellaneous custom tiles</Typography>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Miscellaneous tiles allow you to add your own tiles without including other groups. Be
              aware, you will want to add several options to this group to minimize repeats.
            </Typography>
          </Trans>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
