export function shuffleArrayBy(array, key) {
    const groupedTiles = array.reduce((obj, entry) => {
        if (!obj[entry[key]]) obj[entry[key]] = []
        obj[entry[key]].push(entry)
        return obj;
    }, []);

    return groupedTiles
        .map(unshuffled => unshuffled
            .map(entry => ({ entry, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ entry }) => entry)
        )
        .flat();
}