import { ArrowDropUp, Casino } from '@mui/icons-material';
import {
  Button, ButtonGroup, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './styles.css';
import useCountdown from 'hooks/useCountdown';

export default function RollButton({ setRollValue, playerTile, dice }) {
  const { t } = useTranslation();
  const [isDisabled, setDisabled] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const [selectedRoll, setSelectedRoll] = useState('manual');
  const [autoTime, setAutoTime] = useState(0);
  const [rollText, setRollText] = useState(t('roll'));
  const {
    timeLeft, setTimeLeft, togglePause, isPaused,
  } = useCountdown(autoTime);

  const options = new Map();
  options
    .set('restart', t('restart'))
    .set('manual', t('manual'))
    .set(30, t('auto30'))
    .set(60, t('auto60'))
    .set(90, t('auto90'));

  function isNumeric(value) {
    return /^-?\d+$/.test(value);
  }

  const [rollCount, diceSide] = dice.split('d');

  const rollDice = () => {
    let total = 0;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < Number(rollCount); i++) {
      total += Number([Math.floor(Math.random() * Number(diceSide)) + 1]);
    }
    setRollValue(total);
  };

  const handleClick = () => {
    if (selectedRoll === 'manual') {
      rollDice();
      setDisabled(true);
      setTimeout(() => setDisabled(false), 4000);
      return null;
    }

    if (isPaused && timeLeft === autoTime) {
      rollDice();
    }
    togglePause();
    return null;
  };

  const handleMenuItemClick = (key) => {
    setOpen(false);
    if (key === 'restart') {
      return setRollValue(-1);
    }

    setSelectedRoll(key);

    if (isNumeric(key)) {
      if (!isPaused) togglePause();
      setAutoTime(key);
      setTimeLeft(key);
    }
    return null;
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
    if (playerTile?.description === t('finish')) {
      togglePause();
    }
  }, [playerTile]);

  useEffect(() => {
    if (isDisabled) return setRollText(t('wait'));
    if (selectedRoll === 'manual') {
      return setRollText(t('roll'));
    }

    if (isPaused) return setRollText(`${t('play')} (${timeLeft})`);

    if (timeLeft > 0) {
      return setRollText(`${t('pause')} (${timeLeft})`);
    }

    rollDice();
    return setTimeLeft(autoTime);
  }, [isDisabled, selectedRoll, timeLeft, autoTime, isPaused]);

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
}
