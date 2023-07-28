import { ArrowDropUp, Casino } from '@mui/icons-material';
import {
  Button, ButtonGroup, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './styles.css';
import useCountdown from 'hooks/useCountdown';

export default function RollButton({ setRollValue }) {
  const { t } = useTranslation();
  const [isDisabled, setDisabled] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autoTime, setAutoTime] = useState(0);
  const [rollText, setRollText] = useState(t('roll'));
  const {
    timeLeft, setTimeLeft, togglePause, isPaused,
  } = useCountdown(autoTime);

  const options = [t('manual'), t('auto30'), t('auto60'), t('auto90')];

  const handleClick = () => {
    if (selectedIndex === 0) {
      setRollValue([Math.floor(Math.random() * 4) + 1]);
      setDisabled(true);
      setTimeout(() => setDisabled(false), 4000);
      return null;
    }

    togglePause();
    return null;
  };

  const handleMenuItemClick = (event, index) => {
    setSelectedIndex(index);
    setOpen(false);
    const autoArray = options[index].split(' ');
    const time = Number(autoArray[1].slice(0, -1));
    setAutoTime(time);
    setTimeLeft(time);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  useEffect(() => {
    if (isDisabled) return setRollText(t('wait'));
    if (selectedIndex === 0) {
      return setRollText(t('roll'));
    }

    if (isPaused) return setRollText(`${t('play')} (${timeLeft})`);

    if (timeLeft > 0) {
      return setRollText(`${t('pause')} (${timeLeft})`);
    }

    setRollValue([Math.floor(Math.random() * 4) + 1]);
    return setTimeLeft(autoTime);
  }, [isDisabled, selectedIndex, timeLeft, autoTime, isPaused]);

  return (
    <>
      <ButtonGroup
        variant="contained"
        ref={anchorRef}
        className="dice-roller"
      >
        <Button
          aria-label={t('roll')}
          onClick={handleClick}
          disabled={isDisabled}
          size="large"
        >
          <Casino sx={{ mr: 1 }} />
          {rollText}
        </Button>
        <Button
          size="small"
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label="select roll options"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropUp />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        placement="top-end"
      >
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: 'right bottom' }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
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
}
