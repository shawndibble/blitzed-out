import { ArrowDropUp } from '@mui/icons-material';
import { Button, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper } from '@mui/material';
import { t } from 'i18next';
import { useRef, useState } from 'react';

interface RollOptionsMenuProps {
  selectedRoll: string;
  handleMenuItemClick: (value: string) => void;
}

const RollOptionsMenu = ({
  selectedRoll,
  handleMenuItemClick,
}: RollOptionsMenuProps): JSX.Element => {
  const [open, setOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (): void => {
    setAnchorEl(anchorRef.current);
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | React.SyntheticEvent): void => {
    if (event.target instanceof Node && anchorRef.current?.contains(event.target)) {
      return;
    }
    setOpen(false);
    setAnchorEl(null);
  };

  const options = new Map<string, string>();
  options
    .set('restart', t('restart'))
    .set('manual', t('manual'))
    .set('30', t('auto30'))
    .set('60', t('auto60'))
    .set('90', t('auto90'))
    .set('custom', t('setTimer'));

  return (
    <>
      <Button
        size="small"
        aria-controls={open ? 'split-button-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-label="select roll options"
        aria-haspopup="menu"
        onClick={handleToggle}
        ref={anchorRef}
      >
        <ArrowDropUp />
      </Button>
      <Popper
        sx={{ zIndex: 1 }}
        open={open}
        anchorEl={anchorEl}
        transition
        disablePortal
        placement="top-end"
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'right bottom' }}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {Array.from(options).map(([key, option]) => (
                    <MenuItem
                      key={key}
                      selected={key === selectedRoll}
                      onClick={() => handleMenuItemClick(key)}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default RollOptionsMenu;
