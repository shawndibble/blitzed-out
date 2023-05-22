function GameTile({ title, description }) {
    return (
        <li>
            <p class="event-date">{title}</p>
            <p class="event-description">{description}</p>
        </li>
    )
}

export { GameTile };