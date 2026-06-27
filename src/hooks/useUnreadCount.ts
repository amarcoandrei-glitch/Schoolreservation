import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Returns the real-time count of unread notifications for the given user.
 * Uses only a single `where` clause to avoid requiring a composite Firestore index.
 * Filters `read === false` client-side.
 */
export function useUnreadCount(userId: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) { setCount(0); return; }

    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const unread = snap.docs.filter((d) => d.data().read === false).length;
        setCount(unread);
      },
      () => setCount(0),
    );
    return unsub;
  }, [userId]);

  return count;
}
