--- src/contexts/NotificationContext.tsx (原始)
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
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

export function NotificationProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isDemoMode) {
      // Mode démo : charger depuis localStorage
      const saved = localStorage.getItem(`arena_notifications_${userId}`);
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } else {
      // Mode Firebase : écouter en temps réel
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Notification[];
        setNotifications(notifs);

        // Sauvegarder en localStorage pour le mode démo
        if (isDemoMode) {
          localStorage.setItem(`arena_notifications_${userId}`, JSON.stringify(notifs));
        }
      });

      return () => unsubscribe();
    }
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  async function markAsRead(id: string) {
    if (isDemoMode) {
      const updated = notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updated);
      localStorage.setItem(`arena_notifications_${userId}`, JSON.stringify(updated));
    } else {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    }
  }

  async function markAllAsRead() {
    if (isDemoMode) {
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      localStorage.setItem(`arena_notifications_${userId}`, JSON.stringify(updated));
    } else {
      const promises = notifications
        .filter(n => !n.read)
        .map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
      await Promise.all(promises);
    }
  }

  async function addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const newNotif: Omit<Notification, 'id'> = {
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    };

    if (isDemoMode) {
      const notifWithId = { ...newNotif, id: `notif_${Date.now()}` };
      const updated = [notifWithId, ...notifications];
      setNotifications(updated);
      localStorage.setItem(`arena_notifications_${userId}`, JSON.stringify(updated));
    } else {
      await addDoc(collection(db, 'notifications'), newNotif);
    }
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}


+++ src/contexts/NotificationContext.tsx (修改后)
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function NotificationProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;

    if (isDemoMode) {
      // Mode démo : charger depuis localStorage
      const saved = localStorage.getItem(`arena_notifications_${userId}`);
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing notifications from localStorage:', e);
        }
      }
    } else {
      // Mode Firebase : écouter en temps réel (sans orderBy pour éviter les problèmes d'index)
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const notifs = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          })) as Notification[];
          // Trier côté client par date décroissante
          notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotifications(notifs);
        }, (error) => {
          console.error('Error listening to notifications:', error);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up notifications listener:', error);
      }
    }
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  async function markAsRead(id: string) {
    if (isDemoMode) {
      const updated = notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updated);
      localStorage.setItem(`arena_notifications_${userId}`, JSON.stringify(updated));
    } else {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  }

  async function markAllAsRead() {
    if (isDemoMode) {
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      localStorage.setItem(`arena_notifications_${userId}`, JSON.stringify(updated));
    } else {
      try {
        const promises = notifications
          .filter(n => !n.read)
          .map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
        await Promise.all(promises);
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  }

  async function addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const newNotif: Omit<Notification, 'id'> = {
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    };

    if (isDemoMode) {
      const notifWithId = { ...newNotif, id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
      const updated = [notifWithId, ...notifications];
      setNotifications(updated);
      localStorage.setItem(`arena_notifications_${userId}`, JSON.stringify(updated));
    } else {
      try {
        await addDoc(collection(db, 'notifications'), newNotif);
      } catch (error) {
        console.error('Error adding notification:', error);
      }
    }
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
