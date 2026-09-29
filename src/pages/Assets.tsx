import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService, Asset } from '../config/dataService';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, X, Package, Info, Download } from 'lucide-react';

// ============================================================
// CONSTANTES
// ============================================================

const CATEGORIES = [
  'Informatique',
  'Mobilier',
  'Réseau',
  'Électrique et Électronique',
  'Machine',
  'Outils',
  'Accessoires',
  'Décoration',
  'Photographie et Vidéo',
  'Autre'
];

const LIEUX = ['Ambatoroka', 'Ambatonakanga', 'Tsimbazaza', 'Anosizato'];

const PROPRIETAIRES = [
  'Arena Group',
  'Arena Business Center',
  'Improveo',
  'Arena Studio Comm',
  'Maison & Artisanat'
];

const ETATS = ['Disponible', 'En utilisation', 'En maintenance', 'Hors service'];

// Types d'emplacements autorisés
const EMPLACEMENT_TYPES = [
  { prefix: 'Working Space', code: 'WS' },
  { prefix: 'Meeting Room', code: 'MR' },
  { prefix: 'Training Room', code: 'TR' },
  { prefix: 'Client Hub', code: 'CH' },
  { prefix: 'Workshop', code: 'WK' }
];

// Correspondances pour la génération du No. Article
const CAT_CODES: Record<string, string> = {
  'Informatique': 'INF',
  'Mobilier': 'MOB',
  'Réseau': 'RES',
  'Électrique et Électronique': 'ELC',
  'Machine': 'MAC',
  'Outils': 'OUT',
  'Accessoires': 'ACC',
  'Décoration': 'DEC',
  'Photographie et Vidéo': 'PVD',
  'Autre': 'AUT'
};

const LIEU_CODES: Record<string, string> = {
  'Ambatoroka': 'ABR',
  'Ambatonakanga': 'ABK',
  'Tsimbazaza': 'TSI',
  'Anosizato': 'ASZ'
};

const PRO_CODES: Record<string, string> = {
  'Arena Group': 'AGP',
  'Arena Business Center': 'ABC',
  'Improveo': 'IMC',
  'Arena Studio Comm': 'ASC',
  'Maison & Artisanat': 'MEA'
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

// Génère le code EMPL à partir de l'emplacement
function getEmplCode(emplacement: string): string {
  const trimmed = emplacement.trim();
  for (const type of EMPLACEMENT_TYPES) {
    if (trimmed.startsWith(type.prefix + ' ')) {
      const num = trimmed.replace(type.prefix + ' ', '').trim();
      return type.code + num.padStart(2, '0');
    }
  }
  return '';
}

// Valide le format de l'emplacement
function validateEmplacement(emplacement: string): boolean {
  const trimmed = emplacement.trim();
  for (const type of EMPLACEMENT_TYPES) {
    const regex = new RegExp(`^${type.prefix} (0[1-9]|[1-9][0-9])$`);
    if (regex.test(trimmed)) return true;
  }
  return false;
}

// Génère le No. Article automatiquement
function generateArticleNumber(
  category: string,
  emplacement: string,
  lieu: string,
  proprietaire: string,
  existingAssets: Asset[]
): string {
  const cat = CAT_CODES[category] || 'AUT';
  const empl = getEmplCode(emplacement);
  const lie = LIEU_CODES[lieu] || 'XXX';
  const pro = PRO_CODES[proprietaire] || 'XXX';

  if (!empl) return '';

  const prefix = `${cat}_${empl}_${lie}_${pro}`;

  // Trouver le prochain numéro séquentiel
  let maxNum = 0;
  existingAssets.forEach(asset => {
    if (asset.articleNumber && asset.articleNumber.startsWith(prefix + '_')) {
      const numStr = asset.articleNumber.split('_').pop();
      if (numStr) {
        const num = parseInt(numStr, 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${prefix}_${String(nextNum).padStart(4, '0')}`;
}

// Génère les options d'emplacement (Working Space 01 à XX, etc.)
function generateEmplacementOptions(): string[] {
  const options: string[] = [];
  for (const type of EMPLACEMENT_TYPES) {
    for (let i = 1; i <= 20; i++) {
      options.push(`${type.prefix} ${String(i).padStart(2, '0')}`);
    }
  }
  return options;
}

// Export CSV
function exportToCSV(assets: Asset[]) {
  const headers = [
    'No. Article',
    'Nom',
    'Catégorie',
    'Quantité',
    'Emplacement',
    'Lieu',
    'No. Série',
    'Fournisseur',
    'Propriétaire',
    'Prix (MGA)',
    'État',
    'Description'
  ];

  const rows = assets.map(asset => [
    asset.articleNumber || '',
    asset.name || '',
    asset.category || '',
    asset.quantity?.toString() || '',
    asset.emplacement || '',
    asset.lieu || '',
    asset.serialNumber || '',
    asset.fournisseur || '',
    asset.proprietaire || '',
    asset.price || '',
    asset.status || '',
    (asset.description || '').replace(/"/g, '""')
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `inventaire_arena_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function Assets() {
  const { isAdmin } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    articleNumber: '',
    name: '',
    category: 'Informatique',
    quantity: 1,
    emplacement: '',
    lieu: 'Ambatoroka',
    serialNumber: '',
    fournisseur: '',
    proprietaire: 'Arena Group',
    price: '',
    status: 'Disponible',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const emplacementOptions = useMemo(() => generateEmplacementOptions(), []);

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
    setFormData({
      articleNumber: '',
      name: '',
      category: 'Informatique',
      quantity: 1,
      emplacement: '',
      lieu: 'Ambatoroka',
      serialNumber: '',
      fournisseur: '',
      proprietaire: 'Arena Group',
      price: '',
      status: 'Disponible',
      description: ''
    });
    setFormErrors({});
    setShowModal(true);
  }

  function openEditModal(asset: Asset) {
    setEditingAsset(asset);
    setFormData({
      articleNumber: asset.articleNumber || '',
      name: asset.name,
      category: asset.category,
      quantity: asset.quantity,
      emplacement: asset.emplacement || '',
      lieu: asset.lieu || 'Ambatoroka',
      serialNumber: asset.serialNumber || '',
      fournisseur: asset.fournisseur || '',
      proprietaire: asset.proprietaire || 'Arena Group',
      price: asset.price || '',
      status: asset.status,
      description: asset.description || ''
    });
    setFormErrors({});
    setShowModal(true);
  }

  // Génère le No. Article en temps réel quand les champs dépendants changent
  useEffect(() => {
    if (!editingAsset && formData.category && formData.emplacement && formData.lieu && formData.proprietaire) {
      if (validateEmplacement(formData.emplacement)) {
        const generated = generateArticleNumber(
          formData.category,
          formData.emplacement,
          formData.lieu,
          formData.proprietaire,
          assets
        );
        setFormData(prev => ({ ...prev, articleNumber: generated }));
      }
    }
  }, [formData.category, formData.emplacement, formData.lieu, formData.proprietaire, editingAsset]);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Le nom est obligatoire';
    }
    if (!formData.category) {
      errors.category = 'La catégorie est obligatoire';
    }
    if (!formData.quantity || formData.quantity < 1) {
      errors.quantity = 'La quantité doit être au moins 1';
    }
    if (!formData.emplacement || formData.emplacement.trim() === '') {
      errors.emplacement = "L'emplacement est obligatoire";
    } else if (!validateEmplacement(formData.emplacement)) {
      errors.emplacement = "Format invalide. Ex: 'Working Space 01', 'Meeting Room 03', 'Client Hub 01', etc.";
    }
    if (!formData.lieu) {
      errors.lieu = 'Le lieu est obligatoire';
    }
    if (!formData.serialNumber || formData.serialNumber.trim() === '') {
      errors.serialNumber = 'Le numéro de série est obligatoire (utilisez "n/a" si inconnu)';
    }
    if (!formData.fournisseur || formData.fournisseur.trim() === '') {
      errors.fournisseur = 'Le fournisseur est obligatoire (utilisez "n/a" si inconnu)';
    }
    if (!formData.proprietaire) {
      errors.proprietaire = 'Le propriétaire est obligatoire';
    }
    if (!formData.price || formData.price.trim() === '') {
      errors.price = 'Le prix est obligatoire (utilisez "n/a" si inconnu)';
    }
    if (!formData.status) {
      errors.status = "L'état est obligatoire";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      const assetData = {
        articleNumber: formData.articleNumber,
        name: formData.name.trim(),
        category: formData.category,
        quantity: Number(formData.quantity),
        emplacement: formData.emplacement.trim(),
        lieu: formData.lieu,
        serialNumber: formData.serialNumber.trim(),
        fournisseur: formData.fournisseur.trim(),
        proprietaire: formData.proprietaire,
        price: formData.price.trim(),
        status: formData.status,
        description: formData.description?.trim() || '',
        updatedAt: new Date().toISOString()
      };

      if (editingAsset) {
        await dataService.updateAsset(editingAsset.id, assetData);
        toast.success('Actif modifié avec succès');
      } else {
        await dataService.addAsset({ ...assetData, createdAt: new Date().toISOString() });
        toast.success(`Actif ajouté : ${formData.articleNumber}`);
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
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.emplacement || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.articleNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(filteredAssets)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#19283E] font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            Exporter CSV
          </button>
          {isAdmin && (
            <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C9A125] text-[#19283E] font-medium rounded-lg hover:bg-[#b8921f] transition-colors">
              <Plus size={18} />
              Ajouter un actif
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom, No. Article, No. série, emplacement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none"
          >
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
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">No. Article</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Nom</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Catégorie</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Qté</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Emplacement</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Lieu</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Propriétaire</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Prix</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">État</th>
                  {isAdmin && <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-[#19283E]">
                        {asset.articleNumber || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-[#19283E] text-xs">{asset.name}</p>
                      {asset.serialNumber && (
                        <p className="text-[10px] text-gray-400 mt-0.5">S/N: {asset.serialNumber}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{asset.category}</td>
                    <td className="px-3 py-2 text-xs font-medium text-[#19283E]">{asset.quantity}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{asset.emplacement || '-'}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{asset.lieu || '-'}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{asset.proprietaire || '-'}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{asset.price ? `${asset.price} MGA` : '-'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusBadge(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(asset)} className="p-1.5 text-gray-400 hover:text-[#C9A125] hover:bg-yellow-50 rounded-lg transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
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

      {/* Modal Ajout/Modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-[#19283E]">
                {editingAsset ? "Modifier l'actif" : 'Ajouter un actif'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* No. Article (auto-généré, grisé) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Article <span className="text-xs text-gray-400">(auto-généré)</span>
                </label>
                <input
                  type="text"
                  value={formData.articleNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 font-mono text-sm cursor-not-allowed"
                  placeholder="Se remplit automatiquement"
                />
                {editingAsset && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Info size={12} /> Le No. Article ne peut pas être modifié
                  </p>
                )}
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='Ex: DELL LATITUDE 5540 (ou "n/a" si inconnu)'
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none ${formErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              {/* Catégorie + Quantité */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none ${formErrors.category ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {formErrors.category && <p className="text-xs text-red-500 mt-1">{formErrors.category}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none ${formErrors.quantity ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {formErrors.quantity && <p className="text-xs text-red-500 mt-1">{formErrors.quantity}</p>}
                </div>
              </div>

              {/* Emplacement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emplacement <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="emplacement-list"
                  value={formData.emplacement}
                  onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
                  placeholder="Ex: Working Space 01, Meeting Room 03, Client Hub 01..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none ${formErrors.emplacement ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                <datalist id="emplacement-list">
                  {emplacementOptions.map(opt => <option key={opt} value={opt} />)}
                </datalist>
                {formErrors.emplacement ? (
                  <p className="text-xs text-red-500 mt-1">{formErrors.emplacement}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    Format : Working Space XX, Meeting Room XX, Training Room XX, Client Hub XX, Workshop XX
                  </p>
                )}
              </div>

              {/* Lieu + Propriétaire */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.lieu}
                    onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none ${formErrors.lieu ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  >
                    {LIEUX.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  {formErrors.lieu && <p className="text-xs text-red-500 mt-1">{formErrors.lieu}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propriétaire <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.proprietaire}
                    onChange={(e) => setFormData({ ...formData, proprietaire: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none ${formErrors.proprietaire ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  >
                    {PROPRIETAIRES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {formErrors.proprietaire && <p className="text-xs text-red-500 mt-1">{formErrors.proprietaire}</p>}
                </div>
              </div>

              {/* No. de série + Fournisseur */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. de série <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder='Ex: R9-00186 (ou "n/a" si inconnu)'
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none ${formErrors.serialNumber ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {formErrors.serialNumber && <p className="text-xs text-red-500 mt-1">{formErrors.serialNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fournisseur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fournisseur}
                    onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                    placeholder='Ex: Super 034 50 677 48 (ou "n/a" si inconnu)'
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none ${formErrors.fournisseur ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {formErrors.fournisseur && <p className="text-xs text-red-500 mt-1">{formErrors.fournisseur}</p>}
                </div>
              </div>

              {/* Prix + État */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (MGA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder='Ex: 620 000 (ou "n/a" si inconnu)'
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none ${formErrors.price ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    État <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none ${formErrors.status ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  >
                    {ETATS.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                  {formErrors.status && <p className="text-xs text-red-500 mt-1">{formErrors.status}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description optionnelle..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#19283E] text-white font-medium rounded-lg hover:bg-[#243552]"
                >
                  {editingAsset ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
