/**
 * Community suggestions: a custom action a user wrote is offered back to the
 * project, kept for four days.
 */
import { addDoc, collection } from 'firebase/firestore';
import { db } from './app';

export async function submitCustomAction(grouping: string, customAction: string): Promise<void> {
  try {
    await addDoc(collection(db, 'custom-actions'), {
      grouping,
      customAction,
      ttl: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
    });
  } catch (error) {
    console.error('Firebase operation failed', error);
  }
}
