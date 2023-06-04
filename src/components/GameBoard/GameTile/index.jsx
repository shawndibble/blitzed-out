import { AvatarGroup, Divider } from "@mui/material";
import './styles.css';
import TextAvatar from "../../TextAvatar";

export default function GameTile({ title, description, players }) {
    const playerIndicators = players.map(p => <TextAvatar key={p.uid} displayName={p.displayName} uid={p.uid} />);

    return (
        <li>
            <div className="tile-title-row">
                <div className="tile-title">{title}</div>
                <div className="player-indicator">
                    <AvatarGroup max={4}>
                        {playerIndicators}
                    </AvatarGroup>
                </div>
            </div>
            <Divider sx={{margin: "0.5rem 0" }} />
            <div className="tile-description">{description}</div>
        </li>
    )
}
