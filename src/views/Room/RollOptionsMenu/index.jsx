import PropTypes from 'prop-types';
import { ArrowDropUp } from '@mui/icons-material';
import { Button, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper } from '@mui/material';
import { useRef, useState } from 'react';

const RollOptionsMenu = ({ options, selectedRoll, handleMenuItemClick }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
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

RollOptionsMenu.propTypes = {
  options: PropTypes.instanceOf(Map).isRequired,
  selectedRoll: PropTypes.string.isRequired,
  handleMenuItemClick: PropTypes.func.isRequired,
};

export default RollOptionsMenu;
