export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function cycleArray(array) {
  if (array.length > 1) array.push(array.shift());
}

export function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((element, index) => element === arr2[index]);
}
