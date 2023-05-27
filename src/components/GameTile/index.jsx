import { Avatar, Stack, Tooltip } from "@mui/material";
import './styles.css';

export default function GameTile({ title, description, players }) {
    const playerIndicators = players.map(p => <Tooltip key={p.name} title={p.name}><Avatar {...stringAvatar(p.name)} /></Tooltip>);

    return (
        <li>
            <div className="tile-title">
                <div className="tile-number">{title}</div>
                <div className="player-indicator">
                    <Stack direction="row" spacing={2}>
                        {playerIndicators}
                    </Stack>
                </div>
            </div>
            <div className="tile-description">{description}</div>
        </li>
    )
}


// COMPONENT HELPERS

function stringToColor(string) {
    let hash = 0;
    let i;

    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }

    return color;
    }
  
function stringAvatar(name) {
    return {
        sx: {
            bgcolor: stringToColor(name),
            width: 24,
            height: 24
        },
        children: name.split(' ')[0][0] + `${name.split(' ')?.[1]?.[0] ?? ''}`,
    };
}