import { AvatarGroup, Divider } from "@mui/material";
import './styles.css';
import TextAvatar from "../../TextAvatar";
import { useEffect } from "react";
import { useRef } from "react";

export default function GameTile({ title, description, players, current }) {
    const playerIndicators = players.map(p => <TextAvatar key={p.uid} displayName={p.displayName} uid={p.uid} />);
    const tileRef = useRef(null);
    const scrollToTile = () => tileRef.current.scrollIntoView();

    useEffect(() => {
        if (tileRef.current && current) {
            scrollToTile({ behavior: "smooth" });
        }
    }, [tileRef, current]);

    return (
        <li className={!!current ? "pulse-animation" : ""} ref={tileRef}>
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
