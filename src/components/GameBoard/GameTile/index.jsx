import { Avatar, Divider, Stack, Tooltip } from "@mui/material";
import './styles.css';

export default function GameTile({ title, description, players }) {
    const playerIndicators = players.map(p => <Tooltip key={p.uid} title={p.displayName}><Avatar {...stringAvatar(p.displayName, p.uid)} /></Tooltip>);

    return (
        <li>
            <div className="tile-title-row">
                <div className="tile-title">{title}</div>
                <div className="player-indicator">
                    <Stack direction="row" spacing={2}>
                        {playerIndicators}
                    </Stack>
                </div>
            </div>
            <Divider sx={{margin: "0.5rem 0" }} />
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

function contrastBgColor(bgColor, lightColor, darkColor) {
    var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    var r = parseInt(color.substring(0, 2), 16); // hexToR
    var g = parseInt(color.substring(2, 4), 16); // hexToG
    var b = parseInt(color.substring(4, 6), 16); // hexToB
    return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186) ?
      darkColor : lightColor;
  }
  
function stringAvatar(name, uid) {
    const bgcolor = stringToColor(uid);
    return {
        sx: {
            bgcolor,
            width: 24,
            height: 24,
            fontSize: 12,
            color: contrastBgColor(bgcolor, '#FFFFFF', '#000000')
        },
        children: name?.split(' ')[0][0] + `${name?.split(' ')?.[1]?.[0] ?? ''}`,
    };
}

