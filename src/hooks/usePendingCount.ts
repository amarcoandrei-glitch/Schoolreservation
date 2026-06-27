import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Returns the real-time count of pending reservations (status === 'pending').
 * Fetches all reservations and filters client-side to avoid composite indexes.
 * Intended for the Admin Approvals badge.
 */
export function usePendingCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'reservations'),
      (snap) => {
        const pending = snap.docs.filter((d) => d.data().status === 'pending').length;
        setCount(pending);
      },
      () => setCount(0),
    );
    return unsub;
  }, []);

  return count;
}
