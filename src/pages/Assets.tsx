import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService, Asset } from '../config/dataService';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, X, Package } from 'lucide-react';

const CATEGORIES = ['Informatique', 'Mobilier', 'Réseau', 'Électronique', 'Autre'];
const STATUSES = ['Disponible', 'En utilisation', 'En maintenance', 'Hors service'];

export default function Assets() {
  const { isAdmin } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    name: '', category: 'Informatique', quantity: 1, location: '', status: 'Disponible', description: ''
  });

  useEffect(() => { fetchAssets(); }, []);

  async function fetchAssets() {
    setLoading(true);
    try {
      const data = await dataService.getAssets();
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Erreur lors du chargement des actifs');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingAsset(null);
    setFormData({ name: '', category: 'Informatique', quantity: 1, location: '', status: 'Disponible', description: '' });
    setShowModal(true);
  }

  function openEditModal(asset: Asset) {
    setEditingAsset(asset);
    setFormData({
      name: asset.name, category: asset.category, quantity: asset.quantity,
      location: asset.location, status: asset.status, description: asset.description || ''
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      if (editingAsset) {
        await dataService.updateAsset(editingAsset.id, { ...formData, quantity: Number(formData.quantity), updatedAt: new Date().toISOString() });
        toast.success('Actif modifié avec succès');
      } else {
        await dataService.addAsset({ ...formData, quantity: Number(formData.quantity), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        toast.success('Actif ajouté avec succès');
      }
      setShowModal(false);
      fetchAssets();
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet actif ?')) return;
    try {
      await dataService.deleteAsset(id);
      toast.success('Actif supprimé');
      fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || asset.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || asset.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disponible': return 'bg-green-100 text-green-700';
      case 'En utilisation': return 'bg-blue-100 text-blue-700';
      case 'En maintenance': return 'bg-yellow-100 text-yellow-700';
      case 'Hors service': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#C9A125] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#19283E]">Inventaire / Actifs</h1>
          <p className="text-gray-500 mt-1">{assets.length} actifs enregistrés</p>
        </div>
        {isAdmin && (
          <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C9A125] text-[#19283E] font-medium rounded-lg hover:bg-[#b8921f] transition-colors">
            <Plus size={18} />
            Ajouter un actif
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Rechercher par nom ou emplacement..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none">
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Assets table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredAssets.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">Aucun actif trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Catégorie</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Quantité</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Emplacement</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">État</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#19283E]">{asset.name}</p>
                      {asset.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{asset.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{asset.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#19283E]">{asset.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{asset.location}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(asset.status)}`}>{asset.status}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(asset)} className="p-1.5 text-gray-400 hover:text-[#C9A125] hover:bg-yellow-50 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#19283E]">{editingAsset ? "Modifier l'actif" : 'Ajouter un actif'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Souris Logitech MX Master" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                  <input type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emplacement *</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Ex: Bureau 201 - Étage 2" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none">
                  {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Description optionnelle..." rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-[#19283E] text-white font-medium rounded-lg hover:bg-[#243552]">{editingAsset ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
