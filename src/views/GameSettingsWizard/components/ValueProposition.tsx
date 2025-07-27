import { Card, CardContent, Stack, Typography, Box } from '@mui/material';
import { Public, Lock } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';

interface ValuePropositionProps {
  isPublic: boolean;
  onClick: () => void;
  isSelected: boolean;
}

export default function ValueProposition({
  isPublic,
  onClick,
  isSelected,
}: ValuePropositionProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Card
      sx={{
        cursor: 'pointer',
        border: isSelected ? '3px solid' : '1px solid',
        borderColor: isSelected ? 'primary.main' : 'grey.300',
        backgroundColor: isSelected ? 'primary.50' : 'background.paper',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: isSelected ? 4 : 2,
          transform: 'scale(1.02)',
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: isSelected ? 'primary.main' : 'primary.50',
              color: isSelected ? 'primary.contrastText' : 'primary.main',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {isPublic ? <Public sx={{ fontSize: 28 }} /> : <Lock sx={{ fontSize: 28 }} />}
          </Box>

          <Stack spacing={0.5} flex={1}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              <Trans i18nKey={isPublic ? 'public' : 'private'} />
              {isSelected && (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.25,
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  {t('selected')}
                </Typography>
              )}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
              <Trans i18nKey={isPublic ? 'publicRoomBenefit' : 'privateRoomBenefit'} />
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
