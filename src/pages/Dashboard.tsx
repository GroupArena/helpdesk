import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService, Ticket } from '../config/dataService';
import { 
  Ticket as TicketIcon, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp 
} from 'lucide-react';

interface Stats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  totalAssets: number;
}

export default function Dashboard() {
  const { userProfile, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0, openTickets: 0, inProgressTickets: 0, resolvedTickets: 0, totalAssets: 0
  });
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userProfile]);

  async function fetchStats() {
    if (!userProfile) return;
    setLoading(true);
    try {
      const tickets = await dataService.getTickets(userProfile.uid, isAdmin);
      const assets = await dataService.getAssets();

      const openTickets = tickets.filter(t => t.status === 'open').length;
      const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
      const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

      setStats({
        totalTickets: tickets.length,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        totalAssets: assets.length
      });

      setRecentTickets(
        tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
      );
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      case 'closed': return 'Fermé';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#19283E]">
          Bonjour, {userProfile?.displayName} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {isAdmin ? "Vue d'ensemble de l'activité" : 'Voici le résumé de vos demandes'}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isAdmin ? (
          <>
            <StatCard icon={<TicketIcon size={22} />} label="Tickets ouverts" value={stats.openTickets} color="bg-red-50 text-red-600" />
            <StatCard icon={<Clock size={22} />} label="En cours" value={stats.inProgressTickets} color="bg-yellow-50 text-yellow-600" />
            <StatCard icon={<CheckCircle2 size={22} />} label="Résolus" value={stats.resolvedTickets} color="bg-green-50 text-green-600" />
            <StatCard icon={<Package size={22} />} label="Total actifs" value={stats.totalAssets} color="bg-blue-50 text-blue-600" />
          </>
        ) : (
          <>
            <StatCard icon={<TicketIcon size={22} />} label="Mes tickets" value={stats.totalTickets} color="bg-blue-50 text-blue-600" />
            <StatCard icon={<AlertCircle size={22} />} label="En attente" value={stats.openTickets} color="bg-red-50 text-red-600" />
            <StatCard icon={<Clock size={22} />} label="En cours" value={stats.inProgressTickets} color="bg-yellow-50 text-yellow-600" />
            <StatCard icon={<CheckCircle2 size={22} />} label="Résolus" value={stats.resolvedTickets} color="bg-green-50 text-green-600" />
          </>
        )}
      </div>

      {/* Recent tickets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#C9A125]" />
            <h2 className="font-semibold text-[#19283E]">Tickets récents</h2>
          </div>
        </div>
        {recentTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <TicketIcon size={40} className="mx-auto mb-3 text-gray-300" />
            <p>Aucun ticket pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#19283E] truncate">{ticket.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority === 'high' ? 'Haute' : ticket.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-[#19283E] mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
