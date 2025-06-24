export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
     
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function cycleArray<T>(array: T[]): void {
  if (array.length > 1) array.push(array.shift() as T);
}

export function arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1?.length !== arr2?.length) return false;
  return arr1.every((element, index) => element === arr2[index]);
}
