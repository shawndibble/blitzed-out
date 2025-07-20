/**
 * Parses various timestamp formats into a Date object
 * @param timestamp - The timestamp to parse (Firebase Timestamp, string, number, object, or Date)
 * @returns Date object if parsing succeeds, null if it fails
 */
export function parseMessageTimestamp(timestamp: any): Date | null {
  if (!timestamp) {
    return null;
  }

  try {
    if (typeof timestamp.toDate === 'function') {
      // Firebase Timestamp format
      return timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      // Serialized timestamp format
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid serialized timestamp format');
      }
      return date;
    } else if (typeof timestamp === 'number') {
      // Unix timestamp (milliseconds or seconds)
      // If timestamp is less than year 3000 in seconds, convert to milliseconds
      const timestampMs = timestamp < 32503680000 ? timestamp * 1000 : timestamp;
      const date = new Date(timestampMs);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid numeric timestamp format');
      }
      return date;
    } else if (typeof timestamp === 'object' && timestamp.seconds !== undefined) {
      // Firestore Timestamp serialized object format {seconds: number, nanoseconds: number}
      const timestampObj = timestamp as { seconds: number; nanoseconds?: number };
      const date = new Date(
        timestampObj.seconds * 1000 + (timestampObj.nanoseconds || 0) / 1000000
      );
      if (isNaN(date.getTime())) {
        throw new Error('Invalid Firestore timestamp object format');
      }
      return date;
    } else if (timestamp instanceof Date) {
      // Already a Date object
      return timestamp;
    } else {
      // Log the actual timestamp value for debugging
      console.warn('Unsupported timestamp format:', typeof timestamp, timestamp);
      throw new Error(`Unsupported timestamp format: ${typeof timestamp}`);
    }
  } catch (error) {
    console.warn('Failed to parse timestamp:', error);
    return null;
  }
}
