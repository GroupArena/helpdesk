import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { dataService, UserProfile } from '../config/dataService';
import { isDemoMode, db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Users as UsersIcon, Shield, ShieldCheck, User, Trash2, X, Plus } from 'lucide-react';

export default function UsersPage() {
  const { isSuperAdmin, register } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', displayName: '', role: 'user' as UserRole });

  useEffect(() => {
    if (isSuperAdmin) fetchUsers();
  }, [isSuperAdmin]);

  async function fetchUsers() {
    setLoading(true);
    try {
      if (isDemoMode) {
        setUsers(dataService.demoGetUsers());
      } else {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(d => ({ uid: d.id, ...d.data() })) as UserProfile[];
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.displayName) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    try {
      await register(formData.email, formData.password, formData.displayName, formData.role);
      toast.success('Utilisateur créé avec succès');
      setShowCreateModal(false);
      setFormData({ email: '', password: '', displayName: '', role: 'user' });
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { code?: string };
      const msg = err.code === 'auth/email-already-in-use' ? 'Cet email est déjà utilisé' : 'Erreur lors de la création du compte';
      toast.error(msg);
    }
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    try {
      if (isDemoMode) {
        dataService.demoUpdateUserRole(userId, newRole);
      } else {
        await updateDoc(doc(db, 'users', userId), { role: newRole });
      }
      toast.success('Rôle mis à jour');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      if (isDemoMode) {
        dataService.demoDeleteUser(userId);
      } else {
        await deleteDoc(doc(db, 'users', userId));
      }
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <ShieldCheck size={16} className="text-purple-600" />;
      case 'admin': return <Shield size={16} className="text-[#C9A125]" />;
      default: return <User size={16} className="text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) { case 'super_admin': return 'Super Admin'; case 'admin': return 'Admin'; default: return 'Utilisateur'; }
  };

  const getRoleBadge = (role: string) => {
    switch (role) { case 'super_admin': return 'bg-purple-100 text-purple-700'; case 'admin': return 'bg-yellow-100 text-yellow-700'; default: return 'bg-gray-100 text-gray-700'; }
  };

  if (loading) {
    return (<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#C9A125] border-t-transparent rounded-full animate-spin"></div></div>);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#19283E]">Gestion des utilisateurs</h1>
          <p className="text-gray-500 mt-1">{users.length} utilisateur(s) enregistré(s)</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C9A125] text-[#19283E] font-medium rounded-lg hover:bg-[#b8921f] transition-colors">
          <Plus size={18} />Créer un compte
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date de création</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#19283E] rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {user.displayName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-[#19283E]">{user.displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}>
                        {getRoleIcon(user.role)}{getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <select value={user.role} onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                          className="px-2 py-1 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-[#C9A125] outline-none">
                          <option value="user">Utilisateur</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                        <button onClick={() => handleDeleteUser(user.uid)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#19283E]">Créer un compte</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input type="text" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  placeholder="Jean Dupont" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="jean.dupont@arena.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Min. 6 caractères" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none" required minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none">
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                  <option value="super_admin">Super Administrateur</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-[#19283E] text-white font-medium rounded-lg hover:bg-[#243552]">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
