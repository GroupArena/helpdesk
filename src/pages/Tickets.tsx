import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService, Ticket, Comment } from '../config/dataService';
import { useNotifications } from '../contexts/NotificationContext';
import { useTicketModal } from '../contexts/TicketModalContext';
import { isDemoMode, db } from '../config/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Plus, Search, Ticket as TicketIcon, X, MessageSquare, ChevronRight, Clock, AlertCircle, CheckCircle2, Download } from 'lucide-react';

const CATEGORIES = ['Mobilier', 'Informatique', 'Électrique et Électronique', 'Réseau', 'Autre'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

// Fonction d'export CSV
function exportToCSV(tickets: Ticket[]) {
  const headers = [
    'ID',
    'Titre',
    'Description',
    'Catégorie',
    'Priorité',
    'Statut',
    'Créé par',
    'Assigné à',
    'Date de création',
    'Date de mise à jour',
    'Nombre de commentaires'
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      case 'closed': return 'Fermé';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return priority;
    }
  };

  const rows = tickets.map(ticket => [
    ticket.id,
    ticket.title,
    ticket.description.replace(/"/g, '""'),
    ticket.category,
    getPriorityLabel(ticket.priority),
    getStatusLabel(ticket.status),
    ticket.createdByName,
    ticket.assignedToName || 'Non assigné',
    new Date(ticket.createdAt).toLocaleDateString('fr-FR'),
    new Date(ticket.updatedAt).toLocaleDateString('fr-FR'),
    (ticket.comments || []).length.toString()
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `tickets_arena_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Fonction pour récupérer tous les admins
async function getAllAdmins(): Promise<{ uid: string; displayName: string }[]> {
  try {
    if (isDemoMode) {
      const users = dataService.demoGetUsers();
      return users.filter(u => u.role === 'admin' || u.role === 'super_admin').map(u => ({ uid: u.uid, displayName: u.displayName }));
    } else {
      const q = query(collection(db, 'users'), where('role', 'in', ['admin', 'super_admin']));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ uid: d.id, displayName: d.data().displayName || 'Admin' }));
    }
  } catch (error) {
    console.error('Error fetching admins:', error);
    return []; // Retourner une liste vide en cas d'erreur
  }
}

export default function Tickets() {
  const { userProfile, isAdmin } = useAuth();
  const { addNotification } = useNotifications();
  const { selectedTicketId, openTicket, closeTicket } = useTicketModal();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Informatique', priority: 'medium' });

  // Listener temps réel pour les tickets
  useEffect(() => {
    if (!userProfile) return;
    setLoading(true);

    if (isDemoMode) {
      // Mode démo : charger une fois
      fetchTickets();
    } else {
      // Mode Firebase : écouter en temps réel
      let q;
      if (isAdmin) {
        q = query(collection(db, 'tickets'));
      } else {
        q = query(collection(db, 'tickets'), where('createdBy', '==', userProfile.uid));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Ticket[];
        setTickets(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setLoading(false);
      }, (error) => {
        console.error('Error listening to tickets:', error);
        toast.error('Erreur de synchronisation');
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [userProfile, isAdmin]);

  // Ouvrir la popup quand selectedTicketId change (depuis une notification)
  useEffect(() => {
    if (selectedTicketId && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === selectedTicketId);
      if (ticket) {
        setSelectedTicket(ticket);
        setShowDetailModal(true);
        closeTicket(); // Réinitialiser pour éviter les ouvertures multiples
      }
    }
  }, [selectedTicketId, tickets]);

  async function fetchTickets() {
    if (!userProfile) return;
    setLoading(true);
    try {
      const data = await dataService.getTickets(userProfile.uid, isAdmin);
      setTickets(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    try {
      const newTicket = await dataService.addTicket({
        title: formData.title, description: formData.description, category: formData.category, priority: formData.priority,
        status: 'open', createdBy: userProfile?.uid || '', createdByName: userProfile?.displayName || '',
        comments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });
      toast.success('Ticket créé avec succès');

      // Notifier tous les admins de la création du ticket
      try {
        const admins = await getAllAdmins();
        for (const admin of admins) {
          if (admin.uid !== userProfile?.uid) {
            const ticketResult = newTicket as Record<string, unknown> | null | undefined;
            const ticketId = ticketResult && typeof ticketResult === 'object' && 'id' in ticketResult
              ? String(ticketResult.id ?? '')
              : '';
            await addNotification({
              userId: admin.uid,
              type: 'status_change',
              message: `${userProfile?.displayName} a créé un nouveau ticket`,
              ticketId,
              ticketTitle: formData.title
            });
          }
        }
      } catch (notifError) {
        console.error('Error sending notifications:', notifError);
        // Continuer même si les notifications échouent
      }

      setShowCreateModal(false);
      setFormData({ title: '', description: '', category: 'Informatique', priority: 'medium' });
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Erreur lors de la création du ticket');
    }
  }

  async function handleStatusChange(ticketId: string, newStatus: string) {
    try {
      const oldTicket = tickets.find(t => t.id === ticketId);
      await dataService.updateTicket(ticketId, { status: newStatus, updatedAt: new Date().toISOString() });
      toast.success('Statut mis à jour');

      const statusLabels: Record<string, string> = {
        'open': 'Ouvert',
        'in_progress': 'En cours',
        'resolved': 'Résolu',
        'closed': 'Fermé'
      };

      // Envoyer les notifications (ne pas bloquer si ça échoue)
      try {
        // Notifier le créateur du ticket
        if (oldTicket && oldTicket.createdBy !== userProfile?.uid) {
          await addNotification({
            userId: oldTicket.createdBy,
            type: 'status_change',
            message: `Votre ticket a été modifié en "${statusLabels[newStatus]}"`,
            ticketId: ticketId,
            ticketTitle: oldTicket.title
          });
        }

        // Notifier tous les admins
        const admins = await getAllAdmins();
        for (const admin of admins) {
          if (admin.uid !== userProfile?.uid && (!oldTicket || admin.uid !== oldTicket.createdBy)) {
            await addNotification({
              userId: admin.uid,
              type: 'status_change',
              message: `Le ticket "${oldTicket?.title}" a été modifié en "${statusLabels[newStatus]}"`,
              ticketId: ticketId,
              ticketTitle: oldTicket?.title || ''
            });
          }
        }
      } catch (notifError) {
        console.error('Error sending status notifications:', notifError);
        // Continuer même si les notifications échouent
      }

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  async function handleAssign(ticketId: string, assignee: string) {
    try {
      await dataService.updateTicket(ticketId, { assignedTo: assignee, assignedToName: assignee, status: 'in_progress', updatedAt: new Date().toISOString() });
      toast.success('Ticket assigné');
      fetchTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  }

  async function handleDeleteTicket(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) return;
    try {
      await dataService.deleteTicket(id);
      toast.success('Ticket supprimé');
      fetchTickets();
      if (selectedTicket?.id === id) { setShowDetailModal(false); setSelectedTicket(null); }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || ticket.status === filterStatus;
    const matchesCategory = !filterCategory || ticket.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusLabel = (status: string) => {
    switch (status) { case 'open': return 'Ouvert'; case 'in_progress': return 'En cours'; case 'resolved': return 'Résolu'; case 'closed': return 'Fermé'; default: return status; }
  };
  const getStatusColor = (status: string) => {
    switch (status) { case 'open': return 'bg-red-100 text-red-700'; case 'in_progress': return 'bg-yellow-100 text-yellow-700'; case 'resolved': return 'bg-green-100 text-green-700'; case 'closed': return 'bg-gray-100 text-gray-700'; default: return 'bg-gray-100 text-gray-700'; }
  };
  const getStatusIcon = (status: string) => {
    switch (status) { case 'open': return <AlertCircle size={14} />; case 'in_progress': return <Clock size={14} />; case 'resolved': return <CheckCircle2 size={14} />; case 'closed': return <CheckCircle2 size={14} />; default: return null; }
  };
  const getPriorityLabel = (priority: string) => {
    switch (priority) { case 'high': return 'Haute'; case 'medium': return 'Moyenne'; case 'low': return 'Basse'; default: return priority; }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) { case 'high': return 'border-l-red-500'; case 'medium': return 'border-l-yellow-500'; case 'low': return 'border-l-green-500'; default: return 'border-l-gray-500'; }
  };

  if (loading) {
    return (<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#C9A125] border-t-transparent rounded-full animate-spin"></div></div>);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#19283E]">Tickets d'intervention</h1>
          <p className="text-gray-500 mt-1">{isAdmin ? `${tickets.length} tickets au total` : `Mes ${tickets.length} ticket(s)`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(filteredTickets)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#19283E] font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            Exporter CSV
          </button>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C9A125] text-[#19283E] font-medium rounded-lg hover:bg-[#b8921f] transition-colors">
            <Plus size={18} />Nouveau ticket
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Rechercher un ticket..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none">
            <option value="">Tous les statuts</option>
            {STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none">
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Tickets list */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <TicketIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">Aucun ticket trouvé</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} onClick={() => { setSelectedTicket(ticket); setShowDetailModal(true); }}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-all border-l-4 ${getPriorityColor(ticket.priority)}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-[#19283E]">{ticket.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}{getStatusLabel(ticket.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 truncate">{ticket.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>{ticket.category}</span><span>•</span>
                    <span>Priorité: {getPriorityLabel(ticket.priority)}</span><span>•</span>
                    <span>{ticket.createdByName}</span>
                    {ticket.comments && ticket.comments.length > 0 && (<><span>•</span><span className="flex items-center gap-1"><MessageSquare size={12} />{ticket.comments.length}</span></>)}
                    <span>•</span><span>{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300 mt-1 flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#19283E]">Nouveau ticket</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Remplacement de souris" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Décrivez votre demande en détail..." rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none resize-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none">
                    {PRIORITIES.map(p => <option key={p} value={p}>{getPriorityLabel(p)}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-[#19283E] text-white font-medium rounded-lg hover:bg-[#243552]">Créer le ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showDetailModal && selectedTicket && (
        <TicketDetailModal ticket={selectedTicket} isAdmin={isAdmin} userProfile={userProfile}
          onClose={() => { setShowDetailModal(false); setSelectedTicket(null); }}
          onStatusChange={handleStatusChange} onAssign={handleAssign} onDelete={handleDeleteTicket} onCommentAdded={fetchTickets}
          onTicketUpdate={(updatedTicket) => setSelectedTicket(updatedTicket)} />
      )}
    </div>
  );
}

// Ticket Detail Modal Component
function TicketDetailModal({ ticket, isAdmin, userProfile, onClose, onStatusChange, onAssign, onDelete, onCommentAdded, onTicketUpdate }: {
  ticket: Ticket; isAdmin: boolean; userProfile: { uid: string; displayName: string } | null;
  onClose: () => void; onStatusChange: (id: string, status: string) => void;
  onAssign: (id: string, assignee: string) => void; onDelete: (id: string) => void; onCommentAdded: () => void;
  onTicketUpdate: (ticket: Ticket) => void;
}) {
  const { addNotification } = useNotifications();
  const [newComment, setNewComment] = useState('');
  const [assignee, setAssignee] = useState('');

  const getStatusLabel = (status: string) => {
    switch (status) { case 'open': return 'Ouvert'; case 'in_progress': return 'En cours'; case 'resolved': return 'Résolu'; case 'closed': return 'Fermé'; default: return status; }
  };
  const getStatusColor = (status: string) => {
    switch (status) { case 'open': return 'bg-red-100 text-red-700'; case 'in_progress': return 'bg-yellow-100 text-yellow-700'; case 'resolved': return 'bg-green-100 text-green-700'; case 'closed': return 'bg-gray-100 text-gray-700'; default: return 'bg-gray-100 text-gray-700'; }
  };

  async function handleAddComment() {
    if (!newComment.trim() || !userProfile) return;
    try {
      const comment: Comment = { id: Date.now().toString(), text: newComment, author: userProfile.uid, authorName: userProfile.displayName, createdAt: new Date().toISOString() };
      const updatedComments = [...(ticket.comments || []), comment];
      await dataService.updateTicket(ticket.id, { comments: updatedComments, updatedAt: new Date().toISOString() });

      // Mettre à jour le ticket localement pour affichage immédiat
      const updatedTicket = { ...ticket, comments: updatedComments, updatedAt: new Date().toISOString() };
      onTicketUpdate(updatedTicket);

      // Envoyer les notifications (ne pas bloquer si ça échoue)
      try {
        // Notifier le créateur du ticket (si ce n'est pas lui-même)
        if (ticket.createdBy !== userProfile.uid) {
          await addNotification({
            userId: ticket.createdBy,
            type: 'comment',
            message: `${userProfile.displayName} a ajouté un commentaire au ticket`,
            ticketId: ticket.id,
            ticketTitle: ticket.title
          });
        }

        // Notifier tous les admins
        const admins = await getAllAdmins();
        for (const admin of admins) {
          if (admin.uid !== userProfile.uid && admin.uid !== ticket.createdBy) {
            await addNotification({
              userId: admin.uid,
              type: 'comment',
              message: `${userProfile.displayName} a ajouté un commentaire au ticket`,
              ticketId: ticket.id,
              ticketTitle: ticket.title
            });
          }
        }
      } catch (notifError) {
        console.error('Error sending comment notifications:', notifError);
        // Continuer même si les notifications échouent
      }

      setNewComment('');
      toast.success('Commentaire ajouté');
      onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-[#19283E]">{ticket.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>{getStatusLabel(ticket.status)}</span>
              <span className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Catégorie</p><p className="font-medium text-sm text-[#19283E]">{ticket.category}</p></div>
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Priorité</p><p className="font-medium text-sm text-[#19283E]">{ticket.priority === 'high' ? '🔴 Haute' : ticket.priority === 'medium' ? '🟡 Moyenne' : '🟢 Basse'}</p></div>
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Créé par</p><p className="font-medium text-sm text-[#19283E]">{ticket.createdByName}</p></div>
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Assigné à</p><p className="font-medium text-sm text-[#19283E]">{ticket.assignedToName || 'Non assigné'}</p></div>
          </div>

          <div>
            <h3 className="font-medium text-[#19283E] mb-2">Description</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{ticket.description}</p>
          </div>

          {isAdmin && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h3 className="font-medium text-[#19283E]">Actions administrateur</h3>
              <div className="flex flex-wrap gap-2">
                <select value={ticket.status} onChange={(e) => onStatusChange(ticket.id, e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A125] outline-none">
                  <option value="open">Ouvert</option><option value="in_progress">En cours</option><option value="resolved">Résolu</option><option value="closed">Fermé</option>
                </select>
                <div className="flex gap-1">
                  <input type="text" placeholder="Assigner à..." value={assignee} onChange={(e) => setAssignee(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A125] outline-none" />
                  <button onClick={() => { onAssign(ticket.id, assignee); setAssignee(''); }}
                    className="px-3 py-1.5 bg-[#19283E] text-white text-sm rounded-lg hover:bg-[#243552]">Assigner</button>
                </div>
                <button onClick={() => onDelete(ticket.id)} className="px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50">Supprimer</button>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-medium text-[#19283E] mb-3 flex items-center gap-2"><MessageSquare size={16} />Commentaires ({ticket.comments?.length || 0})</h3>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {(!ticket.comments || ticket.comments.length === 0) ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucun commentaire</p>
              ) : (
                ticket.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#19283E]">{comment.authorName}</span>
                      <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm text-gray-600">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Ajouter un commentaire..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A125] focus:border-transparent outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
              <button onClick={handleAddComment} disabled={!newComment.trim()}
                className="px-4 py-2 bg-[#19283E] text-white text-sm rounded-lg hover:bg-[#243552] disabled:opacity-50 disabled:cursor-not-allowed">Envoyer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}