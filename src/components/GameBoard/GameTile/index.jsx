import { AvatarGroup, Divider } from '@mui/material';
import './styles.css';
import { useEffect, useRef } from 'react';

import TextAvatar from 'components/TextAvatar';

export default function GameTile({
  title, description, players, current, background,
}) {
  const playerIndicators = players.map((p) => (
    <TextAvatar key={p.uid} displayName={p.displayName} uid={p.uid} />
  ));
  const tileRef = useRef(null);
  const scrollToTile = () => tileRef.current.scrollIntoView();

  useEffect(() => {
    if (tileRef.current && current) {
      scrollToTile({ behavior: 'smooth' });
    }
  }, [tileRef, current]);

  const gray = background !== 'color';

  const liClass = [current && 'pulse-animation', gray && 'gray-tiles'].join(' ').trim();

  return (
    <li className={liClass} ref={tileRef}>
      <div className="tile-title-row">
        <div className={`tile-title ${gray && 'pop-text'}`}>{title}</div>
        <div className="player-indicator">
          <AvatarGroup max={4}>
            {playerIndicators}
          </AvatarGroup>
        </div>
      </div>
      <Divider sx={{ margin: '0.5rem 0' }} />
      <div className={`tile-description ${gray && 'pop-text'}`}>{description}</div>
    </li>
  );
}
