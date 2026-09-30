import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, isDemoMode } from '../config/firebase';

export interface Notification {
  id: string;
  userId: string; // Destinataire
  type: 'comment' | 'status_change';
  message: string;
  ticketId: string;
  ticketTitle: string;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
}

export function NotificationProvider({
  children,
  userId
}: {
  children: ReactNode;
  userId: string;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    if (isDemoMode) {
      const saved = localStorage.getItem(`arena_notifications_${userId}`);

      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Notification[];
          setNotifications(parsed);
        } catch (error) {
          console.error('Error parsing notifications from localStorage:', error);
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }

      return;
    }

    const q = query(collection(db, 'notifications'), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        })) as Notification[];

        notifs.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setNotifications(notifs);
      },
      (error) => {
        console.error('Error listening to notifications:', error);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAsRead(id: string) {
    if (isDemoMode) {
      const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      setNotifications(updated);
      localStorage.setItem(`arena_notifications_${userId}`, JSON.stringify(updated));
      return;
    }

    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    if (isDemoMode) {
      const updated = notifications.map((n) => ({ ...n, read: true }));
      setNotifications(updated);
      localStorage.setItem(`arena_notifications_${userId}`, JSON.stringify(updated));
      return;
    }

    try {
      const promises = notifications
        .filter((n) => !n.read)
        .map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }));

      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  async function addNotification(
    notification: Omit<Notification, 'id' | 'read' | 'createdAt'>
  ) {
    const newNotif: Omit<Notification, 'id'> = {
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    };

    if (isDemoMode) {
      const notifWithId = {
        ...newNotif,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      };

      const updated = [notifWithId, ...notifications];
      setNotifications(updated);
      localStorage.setItem(`arena_notifications_${userId}`, JSON.stringify(updated));
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), newNotif);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}