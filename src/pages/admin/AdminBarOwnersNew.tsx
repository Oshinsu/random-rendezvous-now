import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminBarOwners } from '@/hooks/useAdminBarOwners';
import { useStripeMRR } from '@/hooks/useStripeMRR';
import { EmptyBarOwnersState } from '@/components/admin/EmptyBarOwnersState';
import { KanbanBoard } from '@/components/admin/KanbanBoard';
import { FunnelChart } from '@/components/admin/charts/FunnelChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Building, 
  DollarSign,
  Search,
  List,
  Columns,
  TrendingUp
} from 'lucide-react';
import type { BarOwnerWithSubscription } from '@/hooks/useAdminBarOwners';

export default function AdminBarOwnersNew() {
  const { barOwners, stats, isLoading } = useAdminBarOwners();
  const { data: mrrData, isLoading: mrrLoading } = useStripeMRR();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedBarOwner, setSelectedBarOwner] = useState<BarOwnerWithSubscription | null>(null);

  const filteredBarOwners = barOwners?.filter(owner =>
    owner.bar_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.business_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  if (!barOwners || barOwners.length === 0) {
    return (
      <AdminLayout>
        <div className="p-8 space-y-6">
          <h1 className="text-3xl font-bold text-red-800">Gestion des Gérants de Bar</h1>
          <EmptyBarOwnersState />
        </div>
      </AdminLayout>
    );
  }

  // Kanban columns
  const kanbanColumns = [
    {
      id: 'pending',
      title: '📝 Pending',
      color: 'bg-yellow-50 border-yellow-200',
      items: filteredBarOwners
        .filter(o => o.status === 'pending')
        .map(o => ({
          id: o.id,
          title: o.bar_name,
          subtitle: o.business_name,
          badge: o.contact_email,
          ...o
        }))
    },
    {
      id: 'approved',
      title: '✅ Approved',
      color: 'bg-green-50 border-green-200',
      items: filteredBarOwners
        .filter(o => o.status === 'approved')
        .map(o => ({
          id: o.id,
          title: o.bar_name,
          subtitle: o.business_name,
          badge: 'Actif',
          ...o
        }))
    },
    {
      id: 'suspended',
      title: '⏸️ Suspended',
      color: 'bg-orange-50 border-orange-200',
      items: filteredBarOwners
        .filter(o => o.status === 'suspended')
        .map(o => ({
          id: o.id,
          title: o.bar_name,
          subtitle: o.business_name,
          ...o
        }))
    },
    {
      id: 'rejected',
      title: '❌ Rejected',
      color: 'bg-red-50 border-red-200',
      items: filteredBarOwners
        .filter(o => o.status === 'rejected')
        .map(o => ({
          id: o.id,
          title: o.bar_name,
          subtitle: o.business_name,
          ...o
        }))
    }
  ];

  // Conversion funnel
  const funnelData = [
    { label: 'Candidatures', value: stats?.total || 0, color: '#dc2626' },
    { label: 'Approuvés', value: stats?.approved || 0, color: '#22c55e' },
    { label: 'Abonnés actifs', value: mrrData?.active_subscriptions || 0, color: '#3b82f6' },
  ];

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-red-800">Gestion des Gérants de Bar</h1>
            <p className="text-red-600">Pipeline de conversion et abonnements</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className={viewMode === 'kanban' ? 'bg-red-600' : 'border-red-300 text-red-700'}
            >
              <Columns className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-red-600' : 'border-red-300 text-red-700'}
            >
              <List className="h-4 w-4 mr-2" />
              Liste
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Total gérants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800">
                {stats?.total || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-700">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-800">
                {stats?.pending || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700">Approuvés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800">
                {stats?.approved || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">
                {mrrLoading ? '...' : `${mrrData?.mrr.toFixed(0)}€`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tunnel de Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <FunnelChart data={funnelData} />
          </CardContent>
        </Card>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-400" />
            <Input
              placeholder="Rechercher un bar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-red-200 focus:border-red-400"
            />
          </div>
        </div>

        {/* Content: Kanban or List */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            columns={kanbanColumns}
            onItemClick={(item) => setSelectedBarOwner(item as any)}
          />
        ) : (
          <Card className="border-red-200">
            <CardContent className="p-4">
              <p className="text-center text-muted-foreground py-12">
                Vue liste disponible prochainement
              </p>
            </CardContent>
          </Card>
        )}

        {/* Details Dialog */}
        <Dialog open={!!selectedBarOwner} onOpenChange={() => setSelectedBarOwner(null)}>
          <DialogContent className="max-w-2xl">
            {selectedBarOwner && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedBarOwner.business_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p><strong>Bar:</strong> {selectedBarOwner.bar_name}</p>
                    <p><strong>Email:</strong> {selectedBarOwner.contact_email}</p>
                    <p><strong>Statut:</strong> {selectedBarOwner.status}</p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
