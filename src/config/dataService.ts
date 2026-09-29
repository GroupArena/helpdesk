import { isDemoMode } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from './firebase';

// ============================================================
// SERVICE DE DONNÉES - Mode Démo (localStorage) ou Firebase
// ============================================================

// Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'user';
  createdAt: string;
}

export interface Asset {
  id: string;
  articleNumber: string;
  name: string;
  category: string;
  quantity: number;
  emplacement: string;
  lieu: string;
  serialNumber: string;
  fournisseur: string;
  proprietaire: string;
  price: string;
  status: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorName: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// MODE DÉMO - Données localStorage
// ============================================================

const DEMO_KEYS = {
  users: 'arena_demo_users',
  assets: 'arena_demo_assets',
  tickets: 'arena_demo_tickets',
  currentUser: 'arena_demo_current_user',
};

// Données de démo initiales avec les nouveaux champs
const DEFAULT_ASSETS: Asset[] = [
  {
    id: '1', articleNumber: 'INF_CH01_ABK_ABC_0001', name: 'DELL LATITUDE 5540', category: 'Informatique',
    quantity: 1, emplacement: 'Client Hub 01', lieu: 'Ambatonakanga', serialNumber: 'R9-00186',
    fournisseur: 'Super 034 50 677 48', proprietaire: 'Arena Business Center', price: '620 000',
    status: 'Disponible', description: 'Laptop professionnel 15 pouces'
  },
  {
    id: '2', articleNumber: 'INF_CH01_ABK_ABC_0002', name: 'DELL LATITUDE 5540', category: 'Informatique',
    quantity: 1, emplacement: 'Client Hub 01', lieu: 'Ambatonakanga', serialNumber: 'R9-00784',
    fournisseur: 'Super 034 50 677 48', proprietaire: 'Arena Business Center', price: '650 000',
    status: 'Disponible', description: 'Laptop professionnel 15 pouces'
  },
  {
    id: '3', articleNumber: 'INF_WS05_ABR_AGP_0001', name: 'Écran Dell 27" U2723QE', category: 'Informatique',
    quantity: 1, emplacement: 'Working Space 05', lieu: 'Ambatoroka', serialNumber: 'CN-04V7V2',
    fournisseur: 'OrdiTech 034 35 123 45', proprietaire: 'Arena Group', price: '1 800 000',
    status: 'En utilisation', description: 'Écran 4K USB-C'
  },
  {
    id: '4', articleNumber: 'INF_WS05_ABR_AGP_0002', name: 'Souris Logitech MX Master 3', category: 'Informatique',
    quantity: 1, emplacement: 'Working Space 05', lieu: 'Ambatoroka', serialNumber: 'LOG-MX3-2024-001',
    fournisseur: 'Logitech Pro 034 22 334 56', proprietaire: 'Arena Group', price: '350 000',
    status: 'Disponible', description: 'Souris ergonomique sans fil'
  },
  {
    id: '5', articleNumber: 'MOB_MR01_TSI_IMC_0001', name: 'Chaise ergonomique Herman Miller', category: 'Mobilier',
    quantity: 1, emplacement: 'Meeting Room 01', lieu: 'Tsimbazaza', serialNumber: 'HM-AER-2023-445',
    fournisseur: 'Mobilier Pro 034 11 223 34', proprietaire: 'Improveo', price: '4 500 000',
    status: 'Disponible', description: 'Chaise de bureau premium'
  },
  {
    id: '6', articleNumber: 'RES_WK01_ABR_AGP_0001', name: 'Câble réseau Cat6 3m', category: 'Réseau',
    quantity: 50, emplacement: 'Workshop 01', lieu: 'Ambatoroka', serialNumber: 'n/a',
    fournisseur: 'Câble Express 034 44 556 67', proprietaire: 'Arena Group', price: '15 000',
    status: 'Disponible', description: 'Câble Ethernet blindé (lot de 50)'
  },
  {
    id: '7', articleNumber: 'RES_WK01_ABR_AGP_0002', name: 'Switch Cisco 24 ports', category: 'Réseau',
    quantity: 1, emplacement: 'Workshop 01', lieu: 'Ambatoroka', serialNumber: 'CSC-SW24-2023-089',
    fournisseur: 'Cisco Partner 034 55 667 78', proprietaire: 'Arena Group', price: '2 800 000',
    status: 'En utilisation', description: 'Switch manageable Gigabit'
  },
  {
    id: '8', articleNumber: 'MOB_WS10_ASZ_MEA_0001', name: 'Bureau assis-debout', category: 'Mobilier',
    quantity: 1, emplacement: 'Working Space 10', lieu: 'Anosizato', serialNumber: 'n/a',
    fournisseur: 'n/a', proprietaire: 'Maison & Artisanat', price: '3 200 000',
    status: 'En maintenance', description: 'Bureau électrique réglable'
  },
];

const DEFAULT_TICKETS: Ticket[] = [
  {
    id: '1', title: 'Remplacement souris défectueuse', description: 'Ma souris ne fonctionne plus correctement, le clic droit ne répond pas. Je suis au bureau 205.',
    category: 'Informatique', priority: 'medium', status: 'open',
    createdBy: 'user1', createdByName: 'Marie Dupont',
    comments: [{ id: 'c1', text: 'Bonjour, je confirme le problème.', author: 'user1', authorName: 'Marie Dupont', createdAt: '2024-01-15T10:00:00Z' }],
    createdAt: '2024-01-15T09:00:00Z', updatedAt: '2024-01-15T09:00:00Z'
  },
  {
    id: '2', title: 'Demande de câble réseau', description: 'Besoin d\'un câble réseau pour mon nouveau poste de travail au 3ème étage.',
    category: 'Réseau', priority: 'low', status: 'in_progress',
    createdBy: 'user2', createdByName: 'Jean Martin',
    assignedTo: 'admin1', assignedToName: 'IT Support',
    comments: [],
    createdAt: '2024-01-14T14:00:00Z', updatedAt: '2024-01-15T08:00:00Z'
  },
  {
    id: '3', title: 'Chaise de bureau cassée', description: 'Le vérin de ma chaise ne maintient plus la hauteur. Bureau 310.',
    category: 'Mobilier', priority: 'high', status: 'resolved',
    createdBy: 'user3', createdByName: 'Sophie Bernard',
    assignedTo: 'admin2', assignedToName: 'Moyens Généraux',
    comments: [
      { id: 'c2', text: 'Nouvelle chaise livrée et installée.', author: 'admin2', authorName: 'Moyens Généraux', createdAt: '2024-01-13T16:00:00Z' }
    ],
    createdAt: '2024-01-12T11:00:00Z', updatedAt: '2024-01-13T16:00:00Z'
  },
];

const DEFAULT_USERS: UserProfile[] = [
  { uid: 'admin-super', email: 'admin@arena.com', displayName: 'Admin Super', role: 'super_admin', createdAt: '2024-01-01T00:00:00Z' },
  { uid: 'admin-it', email: 'it@arena.com', displayName: 'IT Support', role: 'admin', createdAt: '2024-01-01T00:00:00Z' },
  { uid: 'user1', email: 'marie@arena.com', displayName: 'Marie Dupont', role: 'user', createdAt: '2024-01-01T00:00:00Z' },
  { uid: 'user2', email: 'jean@arena.com', displayName: 'Jean Martin', role: 'user', createdAt: '2024-01-01T00:00:00Z' },
  { uid: 'user3', email: 'sophie@arena.com', displayName: 'Sophie Bernard', role: 'user', createdAt: '2024-01-01T00:00:00Z' },
];

// Comptes de démo (password = "password123" pour tous)
const DEMO_ACCOUNTS = [
  { email: 'admin@arena.com', password: 'password123', uid: 'admin-super' },
  { email: 'it@arena.com', password: 'password123', uid: 'admin-it' },
  { email: 'marie@arena.com', password: 'password123', uid: 'user1' },
  { email: 'jean@arena.com', password: 'password123', uid: 'user2' },
  { email: 'sophie@arena.com', password: 'password123', uid: 'user3' },
];

// Fonctions d'initialisation
function initDemoData() {
  if (!localStorage.getItem(DEMO_KEYS.assets)) {
    localStorage.setItem(DEMO_KEYS.assets, JSON.stringify(DEFAULT_ASSETS));
  }
  if (!localStorage.getItem(DEMO_KEYS.tickets)) {
    localStorage.setItem(DEMO_KEYS.tickets, JSON.stringify(DEFAULT_TICKETS));
  }
  if (!localStorage.getItem(DEMO_KEYS.users)) {
    localStorage.setItem(DEMO_KEYS.users, JSON.stringify(DEFAULT_USERS));
  }
}

// ============================================================
// API UNIFIÉE - Mode Démo ou Firebase
// ============================================================

export const dataService = {
  isDemoMode,

  // Initialisation
  init() {
    if (isDemoMode) {
      initDemoData();
    }
  },

  // ---- AUTHENTIFICATION (mode démo) ----
  demoLogin: (email: string, password: string): UserProfile | null => {
    const account = DEMO_ACCOUNTS.find(a => a.email === email && a.password === password);
    if (!account) return null;
    const users: UserProfile[] = JSON.parse(localStorage.getItem(DEMO_KEYS.users) || '[]');
    const user = users.find(u => u.uid === account.uid);
    if (user) {
      localStorage.setItem(DEMO_KEYS.currentUser, JSON.stringify(user));
    }
    return user || null;
  },

  demoGetCurrentUser: (): UserProfile | null => {
    const data = localStorage.getItem(DEMO_KEYS.currentUser);
    return data ? JSON.parse(data) : null;
  },

  demoLogout: () => {
    localStorage.removeItem(DEMO_KEYS.currentUser);
  },

  demoRegister: (email: string, displayName: string, role: 'super_admin' | 'admin' | 'user'): UserProfile => {
    const users: UserProfile[] = JSON.parse(localStorage.getItem(DEMO_KEYS.users) || '[]');
    const newUser: UserProfile = {
      uid: 'user-' + Date.now(),
      email,
      displayName,
      role,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(DEMO_KEYS.users, JSON.stringify(users));
    return newUser;
  },

  demoGetUsers: (): UserProfile[] => {
    return JSON.parse(localStorage.getItem(DEMO_KEYS.users) || '[]');
  },

  demoUpdateUserRole: (uid: string, role: 'super_admin' | 'admin' | 'user') => {
    const users: UserProfile[] = JSON.parse(localStorage.getItem(DEMO_KEYS.users) || '[]');
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      users[idx].role = role;
      localStorage.setItem(DEMO_KEYS.users, JSON.stringify(users));
    }
  },

  demoDeleteUser: (uid: string) => {
    const users: UserProfile[] = JSON.parse(localStorage.getItem(DEMO_KEYS.users) || '[]');
    const filtered = users.filter(u => u.uid !== uid);
    localStorage.setItem(DEMO_KEYS.users, JSON.stringify(filtered));
  },

  // ---- ASSETS ----
  getAssets: async (): Promise<Asset[]> => {
    if (isDemoMode) {
      return JSON.parse(localStorage.getItem(DEMO_KEYS.assets) || '[]');
    }
    const snap = await getDocs(collection(db, 'assets'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Asset[];
  },

  addAsset: async (asset: Omit<Asset, 'id'>): Promise<void> => {
    if (isDemoMode) {
      const assets: Asset[] = JSON.parse(localStorage.getItem(DEMO_KEYS.assets) || '[]');
      const newAsset = { ...asset, id: 'asset-' + Date.now() };
      assets.push(newAsset);
      localStorage.setItem(DEMO_KEYS.assets, JSON.stringify(assets));
      return;
    }
    await addDoc(collection(db, 'assets'), asset);
  },

  updateAsset: async (id: string, data: Partial<Asset>): Promise<void> => {
    if (isDemoMode) {
      const assets: Asset[] = JSON.parse(localStorage.getItem(DEMO_KEYS.assets) || '[]');
      const idx = assets.findIndex(a => a.id === id);
      if (idx !== -1) {
        assets[idx] = { ...assets[idx], ...data };
        localStorage.setItem(DEMO_KEYS.assets, JSON.stringify(assets));
      }
      return;
    }
    await updateDoc(doc(db, 'assets', id), data);
  },

  deleteAsset: async (id: string): Promise<void> => {
    if (isDemoMode) {
      const assets: Asset[] = JSON.parse(localStorage.getItem(DEMO_KEYS.assets) || '[]');
      const filtered = assets.filter(a => a.id !== id);
      localStorage.setItem(DEMO_KEYS.assets, JSON.stringify(filtered));
      return;
    }
    await deleteDoc(doc(db, 'assets', id));
  },

  // ---- TICKETS ----
  getTickets: async (userId?: string, isAdmin?: boolean): Promise<Ticket[]> => {
    if (isDemoMode) {
      const tickets: Ticket[] = JSON.parse(localStorage.getItem(DEMO_KEYS.tickets) || '[]');
      if (isAdmin || !userId) return tickets;
      return tickets.filter(t => t.createdBy === userId);
    }
    let q;
    if (isAdmin) {
      q = query(collection(db, 'tickets'));
    } else {
      q = query(collection(db, 'tickets'), where('createdBy', '==', userId));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Ticket[];
  },

  addTicket: async (ticket: Omit<Ticket, 'id'>): Promise<void> => {
    if (isDemoMode) {
      const tickets: Ticket[] = JSON.parse(localStorage.getItem(DEMO_KEYS.tickets) || '[]');
      const newTicket = { ...ticket, id: 'ticket-' + Date.now() };
      tickets.push(newTicket);
      localStorage.setItem(DEMO_KEYS.tickets, JSON.stringify(tickets));
      return;
    }
    await addDoc(collection(db, 'tickets'), ticket);
  },

  updateTicket: async (id: string, data: Partial<Ticket>): Promise<void> => {
    if (isDemoMode) {
      const tickets: Ticket[] = JSON.parse(localStorage.getItem(DEMO_KEYS.tickets) || '[]');
      const idx = tickets.findIndex(t => t.id === id);
      if (idx !== -1) {
        tickets[idx] = { ...tickets[idx], ...data };
        localStorage.setItem(DEMO_KEYS.tickets, JSON.stringify(tickets));
      }
      return;
    }
    await updateDoc(doc(db, 'tickets', id), data);
  },

  deleteTicket: async (id: string): Promise<void> => {
    if (isDemoMode) {
      const tickets: Ticket[] = JSON.parse(localStorage.getItem(DEMO_KEYS.tickets) || '[]');
      const filtered = tickets.filter(t => t.id !== id);
      localStorage.setItem(DEMO_KEYS.tickets, JSON.stringify(filtered));
      return;
    }
    await deleteDoc(doc(db, 'tickets', id));
  },
};
