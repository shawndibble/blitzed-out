import { ArrowDropUp } from '@mui/icons-material';
import { Button, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper } from '@mui/material';
import { useRef, useState } from 'react';

import { RollOptionsMenuProps } from './types';

const RollOptionsMenu = ({ 
  options, 
  selectedRoll, 
  handleMenuItemClick 
}: RollOptionsMenuProps): JSX.Element => {
  const [open, setOpen] = useState<boolean>(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (): void => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | React.SyntheticEvent): void => {
    if (anchorRef.current?.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

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
        anchorEl={anchorRef.current}
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
