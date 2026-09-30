--- src/components/Layout.tsx (原始)
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isDemoMode } from '../config/firebase';
import { NotificationProvider } from '../contexts/NotificationContext';
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard,
  Package,
  Ticket,
  Users,
  LogOut,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  // The provider currently has an incorrect inferred return type in its module.
  // Keep the layout usable as a JSX consumer until that provider type is fixed.
  const NotificationProviderComponent: any = NotificationProvider;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'admin', 'user'] },
    { to: '/assets', icon: Package, label: 'Actifs / Inventaire', roles: ['super_admin', 'admin'] },
    { to: '/tickets', icon: Ticket, label: 'Tickets', roles: ['super_admin', 'admin', 'user'] },
    { to: '/users', icon: Users, label: 'Utilisateurs', roles: ['super_admin'] },
  ];

  const filteredNavItems = navItems.filter(item =>
    userProfile && item.roles.includes(userProfile.role)
  );

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Administrateur';
      case 'admin': return 'Administrateur';
      default: return 'Utilisateur';
    }
  };

  return (
    <div className="min-h-screen bg-[#E1E4EA]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#19283E] text-white z-50 transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img
              src="./logo-arena.svg"
              alt="Groupe ARENA"
              className="w-8 h-8 rounded-lg"
            />
            <div>
              <h1 className="font-bold text-sm">ARENA Group</h1>
              <p className="text-xs text-gray-400">Helpdesk & Inventaire</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="mx-3 mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-300">Mode Démo - Données locales</p>
          </div>
        )}

        {/* User info */}
        <div className="p-4 border-b border-white/10">
          <p className="font-medium text-sm truncate">{userProfile?.displayName}</p>
          <p className="text-xs text-[#C9A125]">{getRoleLabel(userProfile?.role || '')}</p>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${isActive
                  ? 'bg-[#C9A125]/20 text-[#C9A125] font-medium'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all w-full"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content with NotificationProvider */}
      {userProfile ? (
        <NotificationProviderComponent userId={userProfile.uid}>
          <div className="lg:ml-64">
            {/* Top navbar */}
            <header className="bg-white shadow-sm sticky top-0 z-30">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-[#19283E] hover:text-[#C9A125]"
                >
                  <Menu size={24} />
                </button>
                <div className="flex items-center gap-3 ml-auto">
                  {/* Notification Bell */}
                  <NotificationBell />
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-[#19283E]">{userProfile?.displayName}</p>
                    <p className="text-xs text-gray-500">{userProfile?.email}</p>
                  </div>
                  <div className="w-9 h-9 bg-[#19283E] rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {userProfile?.displayName?.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="p-4 md:p-6">
              <Outlet />
            </main>
          </div>
        </NotificationProviderComponent>
      ) : (
        <div className="lg:ml-64">
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
}


+++ src/components/Layout.tsx (修改后)
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isDemoMode } from '../config/firebase';
import { NotificationProvider } from '../contexts/NotificationContext';
import { TicketModalProvider } from '../contexts/TicketModalContext';
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard,
  Package,
  Ticket,
  Users,
  LogOut,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  // The provider currently has an incorrect inferred return type in its module.
  // Keep the layout usable as a JSX consumer until that provider type is fixed.
  const NotificationProviderComponent: any = NotificationProvider;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'admin', 'user'] },
    { to: '/assets', icon: Package, label: 'Actifs / Inventaire', roles: ['super_admin', 'admin'] },
    { to: '/tickets', icon: Ticket, label: 'Tickets', roles: ['super_admin', 'admin', 'user'] },
    { to: '/users', icon: Users, label: 'Utilisateurs', roles: ['super_admin'] },
  ];

  const filteredNavItems = navItems.filter(item =>
    userProfile && item.roles.includes(userProfile.role)
  );

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Administrateur';
      case 'admin': return 'Administrateur';
      default: return 'Utilisateur';
    }
  };

  return (
    <div className="min-h-screen bg-[#E1E4EA]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#19283E] text-white z-50 transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img
              src="./logo-arena.svg"
              alt="Groupe ARENA"
              className="w-8 h-8 rounded-lg"
            />
            <div>
              <h1 className="font-bold text-sm">ARENA Group</h1>
              <p className="text-xs text-gray-400">Helpdesk & Inventaire</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="mx-3 mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-300">Mode Démo - Données locales</p>
          </div>
        )}

        {/* User info */}
        <div className="p-4 border-b border-white/10">
          <p className="font-medium text-sm truncate">{userProfile?.displayName}</p>
          <p className="text-xs text-[#C9A125]">{getRoleLabel(userProfile?.role || '')}</p>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${isActive
                  ? 'bg-[#C9A125]/20 text-[#C9A125] font-medium'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all w-full"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content with NotificationProvider */}
      {userProfile ? (
        <TicketModalProvider>
        <NotificationProviderComponent userId={userProfile.uid}>
          <div className="lg:ml-64">
            {/* Top navbar */}
            <header className="bg-white shadow-sm sticky top-0 z-30">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-[#19283E] hover:text-[#C9A125]"
                >
                  <Menu size={24} />
                </button>
                <div className="flex items-center gap-3 ml-auto">
                  {/* Notification Bell */}
                  <NotificationBell />
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-[#19283E]">{userProfile?.displayName}</p>
                    <p className="text-xs text-gray-500">{userProfile?.email}</p>
                  </div>
                  <div className="w-9 h-9 bg-[#19283E] rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {userProfile?.displayName?.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="p-4 md:p-6">
              <Outlet />
            </main>
          </div>
        </NotificationProviderComponent>
        </TicketModalProvider>
      ) : (
        <div className="lg:ml-64">
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
}
