import {
  Box,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Category,
  ExpandLess,
  ExpandMore,
  Extension,
  Lightbulb,
  Psychology,
  Settings,
  Share,
  Shuffle,
  TrendingUp,
} from '@mui/icons-material';

import Accordion from '@/components/Accordion';
import AccordionDetails from '@/components/Accordion/Details';
import AccordionSummary from '@/components/Accordion/Summary';
import { CustomTileHelpProps } from '@/types/customTiles';
import { Trans } from 'react-i18next';
import Typography from '@mui/material/Typography';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useState } from 'react';

export default function CustomTileHelp({ expanded, handleChange }: CustomTileHelpProps) {
  const isMobile = useBreakpoint();
  const [expandedIdeas, setExpandedIdeas] = useState<{ [key: string]: boolean }>({});
  const [expandedBasics, setExpandedBasics] = useState<{ [key: string]: boolean }>({});

  const toggleIdea = (id: string) => {
    setExpandedIdeas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBasic = (id: string) => {
    setExpandedBasics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const basicConcepts = [
    {
      id: 'custom-actions',
      icon: <Extension />,
      title: 'Custom Actions',
      description: 'Add your own personalized activities to the game',
      tip: 'Think of custom tiles as your personal touch - add activities that match your style and preferences perfectly.',
      color: 'primary',
    },
    {
      id: 'category-intensity',
      icon: <Settings />,
      title: 'Category & Intensity Rules',
      description: 'Tiles appear based on your game settings',
      tip: 'Your tiles only show up when you select their category and intensity level (or higher) in game settings.',
      color: 'secondary',
    },
  ];

  const creativeIdeas = [
    {
      id: 'new-activities',
      icon: <Lightbulb />,
      title: 'New Activities',
      description: 'Create unique actions not in the default list',
      tips: [
        'Think outside the box - what creative activities would make your game more exciting?',
        'Add themed tiles like "Movie Night Actions" or "Kitchen Adventures"',
        'Create seasonal tiles for holidays or special occasions',
        'Design role-play scenarios with specific character actions',
      ],
      color: 'primary',
    },
    {
      id: 'intensity-boost',
      icon: <TrendingUp />,
      title: 'Early Intensity Boost',
      description: 'Add advanced tiles to beginner levels',
      tips: [
        'Pro tip: Add exciting advanced tiles to lower intensities to start games with more energy.',
        'Copy your favorite advanced tiles and add them to beginner categories',
        'Create "gateway" tiles that introduce advanced concepts gradually',
        'Mix easy and challenging elements in the same tile for variety',
      ],
      color: 'secondary',
    },
    {
      id: 'mix-match',
      icon: <Shuffle />,
      title: 'Mix & Match',
      description: 'Combine different activities into one tile',
      tips: [
        "Mix activities that don't usually go together for unexpected combinations.",
        'Combine physical actions with mental challenges or games',
        'Create multi-step tiles that build on each other',
        'Blend different intensity levels within a single creative tile',
      ],
      color: 'success',
    },
    {
      id: 'custom-groups',
      icon: <Category />,
      title: 'Custom Groups',
      description: 'Create your own tile categories with unique intensities',
      tips: [
        'Design completely custom groups like "Couples Yoga" or "Adventure Challenges"',
        'Set your own intensity progression from gentle to wild',
        'Create themed collections that tell a story or follow a theme',
        'Build niche categories that perfectly match your interests',
      ],
      color: 'warning',
    },
    {
      id: 'share-creations',
      icon: <Share />,
      title: 'Share & Discover',
      description: 'Import/export tiles to share with others',
      tips: [
        'Export your best tile collections to share with friends or partners',
        'Import creative tiles from others to expand your game options',
        'Create themed tile packs and share them in communities',
        'Backup your custom tiles by exporting them regularly',
      ],
      color: 'info',
    },
  ];

  return (
    <>
      <Accordion
        expanded={expanded === 'help1'}
        onChange={handleChange('help1')}
        className="about-accordion"
      >
        <AccordionSummary aria-controls="help1-content" id="help1-header">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Extension color="primary" />
            <Typography className="accordion-title">
              <Trans i18nKey="ctExplained" />
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense>
            {basicConcepts.map((concept, index) => (
              <Box key={concept.id}>
                <ListItem
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateX(4px)',
                      transition: 'all 0.2s ease-in-out',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onClick={() => toggleBasic(concept.id)}
                >
                  <ListItemIcon sx={{ minWidth: isMobile ? 36 : 40 }}>
                    <Box
                      sx={{
                        color: `${concept.color}.main`,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {concept.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 500,
                          fontSize: isMobile ? '0.9rem' : '1rem',
                        }}
                      >
                        {concept.title}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: 'text.secondary',
                        }}
                      >
                        {concept.description}
                      </Typography>
                    }
                  />
                  <IconButton size="small" sx={{ ml: 1 }}>
                    {expandedBasics[concept.id] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </ListItem>

                <Collapse in={expandedBasics[concept.id]} timeout="auto" unmountOnExit>
                  <Box
                    sx={{
                      ml: isMobile ? 4 : 6,
                      mr: 2,
                      mb: 1,
                      p: 1.5,
                      bgcolor: 'action.selected',
                      borderRadius: 1,
                      borderLeft: 3,
                      borderLeftColor: `${concept.color}.main`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        fontStyle: 'italic',
                        color: 'text.secondary',
                      }}
                    >
                      💡 {concept.tip}
                    </Typography>
                  </Box>
                </Collapse>

                {index < basicConcepts.length - 1 && (
                  <Divider variant="inset" sx={{ ml: isMobile ? 4 : 6 }} />
                )}
              </Box>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'help2'}
        onChange={handleChange('help2')}
        className="about-accordion"
      >
        <AccordionSummary aria-controls="help2-content" id="help2-header">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Psychology color="primary" />
            <Typography className="accordion-title">
              <Trans i18nKey="ctIdeas" />
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense>
            {creativeIdeas.map((idea, index) => (
              <Box key={idea.id}>
                <ListItem
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateX(4px)',
                      transition: 'all 0.2s ease-in-out',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onClick={() => toggleIdea(idea.id)}
                >
                  <ListItemIcon sx={{ minWidth: isMobile ? 36 : 40 }}>
                    <Box
                      sx={{
                        color: `${idea.color}.main`,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {idea.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 500,
                          fontSize: isMobile ? '0.9rem' : '1rem',
                        }}
                      >
                        {idea.title}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: 'text.secondary',
                        }}
                      >
                        {idea.description}
                      </Typography>
                    }
                  />
                  <IconButton size="small" sx={{ ml: 1 }}>
                    {expandedIdeas[idea.id] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </ListItem>

                <Collapse in={expandedIdeas[idea.id]} timeout="auto" unmountOnExit>
                  <Box
                    sx={{
                      ml: isMobile ? 4 : 6,
                      mr: 2,
                      mb: 1,
                      p: 1.5,
                      bgcolor: 'action.selected',
                      borderRadius: 1,
                      borderLeft: 3,
                      borderLeftColor: `${idea.color}.main`,
                    }}
                  >
                    {idea.tips.map((tip, tipIndex) => (
                      <Typography
                        key={tipIndex}
                        variant="body2"
                        sx={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          fontStyle: tipIndex === 0 ? 'italic' : 'normal',
                          color: 'text.secondary',
                          mb: tipIndex < idea.tips.length - 1 ? 1 : 0,
                          '&:before': tipIndex === 0 ? { content: '"💡 "' } : { content: '"• "' },
                        }}
                      >
                        {tip}
                      </Typography>
                    ))}
                  </Box>
                </Collapse>

                {index < creativeIdeas.length - 1 && (
                  <Divider variant="inset" sx={{ ml: isMobile ? 4 : 6 }} />
                )}
              </Box>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
