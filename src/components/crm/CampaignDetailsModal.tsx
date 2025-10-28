import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Copy, Send, Trash2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Campaign {
  id: string;
  campaign_name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  send_at?: string | null;
  total_sends?: number;
  total_opens?: number;
  total_clicks?: number;
  total_conversions?: number;
  subject?: string;
  created_at: string;
}

interface CampaignDetailsModalProps {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
  onReschedule?: (campaignId: string, newDate: string) => void;
  onDuplicate?: (campaign: Campaign) => void;
  onSend?: (campaignId: string) => void;
  onDelete?: (campaignId: string) => void;
}

export const CampaignDetailsModal = ({
  campaign,
  open,
  onClose,
  onReschedule,
  onDuplicate,
  onSend,
  onDelete
}: CampaignDetailsModalProps) => {
  if (!campaign) return null;

  const openRate = campaign.total_sends && campaign.total_opens 
    ? ((campaign.total_opens / campaign.total_sends) * 100).toFixed(1)
    : '0';

  const clickRate = campaign.total_sends && campaign.total_clicks
    ? ((campaign.total_clicks / campaign.total_sends) * 100).toFixed(1)
    : '0';

  const conversionRate = campaign.total_sends && campaign.total_conversions
    ? ((campaign.total_conversions / campaign.total_sends) * 100).toFixed(1)
    : '0';

  const statusColors = {
    draft: 'bg-muted text-muted-foreground',
    active: 'bg-green-500 text-white',
    paused: 'bg-yellow-500 text-white',
    completed: 'bg-slate-500 text-white'
  };

  const statusLabels = {
    draft: 'Brouillon',
    active: 'Active',
    paused: 'En pause',
    completed: 'Terminée'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle>{campaign.campaign_name}</DialogTitle>
              <DialogDescription>{campaign.subject}</DialogDescription>
            </div>
            <Badge className={statusColors[campaign.status]}>
              {statusLabels[campaign.status]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold">{campaign.total_sends || 0}</div>
                <div className="text-xs text-muted-foreground">Envois</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-blue-500">{openRate}%</div>
                <div className="text-xs text-muted-foreground">Ouvertures</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-purple-500">{clickRate}%</div>
                <div className="text-xs text-muted-foreground">Clics</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-green-500">{conversionRate}%</div>
                <div className="text-xs text-muted-foreground">Conversions</div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule info */}
          {campaign.send_at && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Programmé pour le</span>
                  <span className="font-semibold">
                    {format(new Date(campaign.send_at), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {campaign.status === 'draft' && (
              <>
                <Button onClick={() => onSend?.(campaign.id)} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer maintenant
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const newDate = prompt('Nouvelle date (YYYY-MM-DD HH:mm)');
                    if (newDate) {
                      onReschedule?.(campaign.id, new Date(newDate).toISOString());
                      onClose();
                    }
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Reprogrammer
                </Button>
              </>
            )}
            
            {campaign.status === 'completed' && (
              <Button onClick={() => onDuplicate?.(campaign)} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer cette campagne
              </Button>
            )}

            {campaign.total_sends && campaign.total_sends > 0 && (
              <Button variant="outline" asChild>
                <a href={`/admin/crm?campaign=${campaign.id}`}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Voir détails
                </a>
              </Button>
            )}

            {campaign.status === 'draft' && onDelete && (
              <Button 
                variant="destructive" 
                size="icon"
                onClick={() => {
                  if (confirm('Supprimer cette campagne ?')) {
                    onDelete(campaign.id);
                    onClose();
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
