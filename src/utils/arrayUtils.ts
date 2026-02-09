/**
 * Moves an item from one position to another in an array
 * Returns a new array without mutating the original
 */
export const arrayMove = <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
  const newArray = [...array];
  const [removed] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, removed);
  return newArray;
};
