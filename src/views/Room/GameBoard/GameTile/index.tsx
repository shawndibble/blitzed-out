import { AvatarGroup, Divider } from '@mui/material';
import './styles.css';
import { useMemo, useRef } from 'react';

import TextAvatar from '@/components/TextAvatar';
import { Tile } from '@/types/gameBoard';
import { Player } from '@/types/player';

export default function GameTile({
  title,
  description,
  players,
  current,
  isTransparent,
  className,
}: Tile) {
  const playerIndicators = useMemo(
    () =>
      players.map((p: Player) => (
        <TextAvatar key={p.uid} displayName={p.displayName || ''} uid={p.uid || ''} />
      )),
    [players]
  );

  const tileRef = useRef<HTMLLIElement | null>(null);

  // Note: Scroll logic has been moved to GameBoard component to provide
  // smooth scrolling that follows token animations

  const liClass = [current && 'pulse-animation', isTransparent && 'gray-tiles', className]
    .join(' ')
    .trim();

  return (
    <li className={liClass} ref={tileRef}>
      <div className="tile-title-row">
        <div className={`tile-title ${isTransparent && 'pop-text'}`}>{title}</div>
        <div className="player-indicator">
          <AvatarGroup max={4}>{playerIndicators}</AvatarGroup>
        </div>
      </div>
      <Divider sx={{ margin: '0.5rem 0' }} />
      <div className={`tile-description ${isTransparent && 'pop-text'}`}>{description}</div>
    </li>
  );
}
