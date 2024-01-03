export default function shuffleArrayBy(array, key) {
  const groupedTiles = array.reduce((obj, entry) => ({
    ...obj,
    [entry[key]]: [...(obj[entry[key]] || []), entry],
  }), {});

  return Object.values(groupedTiles).flatMap((unshuffled) => unshuffled
    .map((entry) => ({ entry, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ entry }) => entry));
}
