import { useState } from 'react';
import { useAdminBarOwners } from '@/hooks/useAdminBarOwners';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Building, 
  Euro, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play, 
  MoreVertical, 
  Search,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import type { BarOwnerWithSubscription } from '@/hooks/useAdminBarOwners';

export default function AdminBarOwners() {
  const { barOwners, stats, isLoading, updateApplicationStatus, toggleSuspension, deleteBarOwner } = useAdminBarOwners();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarOwner, setSelectedBarOwner] = useState<BarOwnerWithSubscription | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: 'approve' | 'reject' | 'suspend' | 'delete' | null;
    barOwner: BarOwnerWithSubscription | null;
  }>({ type: null, barOwner: null });

  const filteredBarOwners = barOwners?.filter(owner =>
    owner.bar_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'En attente' },
      approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approuvé' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejeté' },
      suspended: { variant: 'outline' as const, icon: Pause, label: 'Suspendu' },
    };

    const config = variants[status as keyof typeof variants];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getSubscriptionBadge = (status: string) => {
    const variants = {
      trial: { variant: 'secondary' as const, label: 'Essai' },
      active: { variant: 'default' as const, label: 'Actif' },
      past_due: { variant: 'destructive' as const, label: 'Impayé' },
      canceled: { variant: 'outline' as const, label: 'Annulé' },
      unpaid: { variant: 'destructive' as const, label: 'Impayé' },
    };

    const config = variants[status as keyof typeof variants];
    if (!config) return null;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const handleAction = (type: string, barOwner: BarOwnerWithSubscription) => {
    setActionDialog({ 
      type: type as 'approve' | 'reject' | 'suspend' | 'delete', 
      barOwner 
    });
  };

  const confirmAction = () => {
    if (!actionDialog.barOwner || !actionDialog.type) return;

    switch (actionDialog.type) {
      case 'approve':
        updateApplicationStatus.mutate({
          barOwnerId: actionDialog.barOwner.id,
          status: 'approved',
        });
        break;
      case 'reject':
        updateApplicationStatus.mutate({
          barOwnerId: actionDialog.barOwner.id,
          status: 'rejected',
        });
        break;
      case 'suspend':
        toggleSuspension.mutate({
          barOwnerId: actionDialog.barOwner.id,
          suspend: actionDialog.barOwner.status !== 'suspended',
        });
        break;
      case 'delete':
        deleteBarOwner.mutate(actionDialog.barOwner.id);
        break;
    }

    setActionDialog({ type: null, barOwner: null });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Gérants de Bar</h1>
        <p className="text-muted-foreground">
          Gérez les demandes et abonnements des gérants de bar partenaires
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total gérants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approuvés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Euro className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                  <p className="text-sm text-muted-foreground">Abonnés actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un bar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Bar Owners Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bar</TableHead>
              <TableHead>Gérant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Abonnement</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBarOwners.map((owner) => (
              <TableRow key={owner.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{owner.bar_name}</p>
                    <p className="text-sm text-muted-foreground">{owner.bar_address}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{owner.business_name}</p>
                </TableCell>
                <TableCell>
                  <div>
                    <p>{owner.contact_email}</p>
                    {owner.contact_phone && (
                      <p className="text-sm text-muted-foreground">{owner.contact_phone}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(owner.status)}
                </TableCell>
                <TableCell>
                  {owner.subscription ? (
                    getSubscriptionBadge(owner.subscription.status)
                  ) : (
                    <span className="text-muted-foreground">Aucun</span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(owner.created_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {owner.status === 'pending' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleAction('approve', owner)}
                            className="text-green-600"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approuver
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAction('reject', owner)}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Rejeter
                          </DropdownMenuItem>
                        </>
                      )}
                      {owner.status === 'approved' && (
                        <DropdownMenuItem 
                          onClick={() => handleAction('suspend', owner)}
                          className="text-orange-600"
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Suspendre
                        </DropdownMenuItem>
                      )}
                      {owner.status === 'suspended' && (
                        <DropdownMenuItem 
                          onClick={() => handleAction('suspend', owner)}
                          className="text-green-600"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Réactiver
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => setSelectedBarOwner(owner)}
                      >
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleAction('delete', owner)}
                        className="text-red-600"
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog 
        open={!!actionDialog.type} 
        onOpenChange={() => setActionDialog({ type: null, barOwner: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' && 'Approuver la demande'}
              {actionDialog.type === 'reject' && 'Rejeter la demande'}
              {actionDialog.type === 'suspend' && 'Modifier le statut'}
              {actionDialog.type === 'delete' && 'Supprimer le gérant'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'approve' && 
                `Approuver la demande de ${actionDialog.barOwner?.business_name} ? Un essai gratuit de 30 jours sera automatiquement activé.`
              }
              {actionDialog.type === 'reject' && 
                `Rejeter définitivement la demande de ${actionDialog.barOwner?.business_name} ?`
              }
              {actionDialog.type === 'suspend' && actionDialog.barOwner?.status !== 'suspended' &&
                `Suspendre l'accès de ${actionDialog.barOwner?.business_name} ?`
              }
              {actionDialog.type === 'suspend' && actionDialog.barOwner?.status === 'suspended' &&
                `Réactiver l'accès de ${actionDialog.barOwner?.business_name} ?`
              }
              {actionDialog.type === 'delete' && 
                `Supprimer définitivement ${actionDialog.barOwner?.business_name} ? Cette action est irréversible.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActionDialog({ type: null, barOwner: null })}
            >
              Annuler
            </Button>
            <Button 
              onClick={confirmAction}
              variant={actionDialog.type === 'delete' || actionDialog.type === 'reject' ? 'destructive' : 'default'}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bar Owner Details Dialog */}
      <Dialog open={!!selectedBarOwner} onOpenChange={() => setSelectedBarOwner(null)}>
        <DialogContent className="max-w-2xl">
          {selectedBarOwner && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedBarOwner.business_name}</DialogTitle>
                <DialogDescription>
                  Détails du gérant de bar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Informations générales</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Nom du bar :</strong> {selectedBarOwner.bar_name}</p>
                      <p><strong>Adresse :</strong> {selectedBarOwner.bar_address}</p>
                      <p><strong>Email :</strong> {selectedBarOwner.contact_email}</p>
                      {selectedBarOwner.contact_phone && (
                        <p><strong>Téléphone :</strong> {selectedBarOwner.contact_phone}</p>
                      )}
                      <p><strong>Statut :</strong> {getStatusBadge(selectedBarOwner.status)}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Abonnement</h4>
                    <div className="space-y-2 text-sm">
                      {selectedBarOwner.subscription ? (
                        <>
                          <p><strong>Statut :</strong> {getSubscriptionBadge(selectedBarOwner.subscription.status)}</p>
                          <p><strong>Type :</strong> {selectedBarOwner.subscription.plan_type}</p>
                          <p><strong>Prix :</strong> {selectedBarOwner.subscription.monthly_price_eur / 100}€/mois</p>
                          {selectedBarOwner.subscription.trial_end_date && (
                            <p><strong>Fin essai :</strong> {new Date(selectedBarOwner.subscription.trial_end_date).toLocaleDateString('fr-FR')}</p>
                          )}
                        </>
                      ) : (
                        <p>Aucun abonnement</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold">Dates importantes</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Candidature :</strong> {new Date(selectedBarOwner.created_at).toLocaleDateString('fr-FR')}</p>
                    {selectedBarOwner.approved_at && (
                      <p><strong>Approuvé le :</strong> {new Date(selectedBarOwner.approved_at).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}