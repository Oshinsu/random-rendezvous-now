import { useState } from 'react';
import { usePushNotificationsAdmin } from '@/hooks/usePushNotificationsAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NOTIFICATION_TYPES = [
  { value: 'welcome', label: '👋 Welcome' },
  { value: 'first_win', label: '🎉 First Win' },
  { value: 'fomo_peak', label: '🔥 FOMO Peak Hours' },
  { value: 'bar_assigned', label: '🍹 Bar Assigned' },
  { value: 'group_forming', label: '👥 Group Forming' },
  { value: 'test', label: '🧪 Test' },
];

export const PushNotificationsTable = () => {
  const { notifications, isLoading, sendTestNotification, isSending } = usePushNotificationsAdmin();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    type: 'test',
    title: '',
    body: '',
    imageUrl: '/notification-icon.png',
    actionUrl: '/dashboard',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendTestNotification(formData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          userId: '',
          type: 'test',
          title: '',
          body: '',
          imageUrl: '/notification-icon.png',
          actionUrl: '/dashboard',
        });
      },
    });
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 40) return 'bg-green-500/10 text-green-700 border-green-500/20';
    if (rate >= 25) return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
    return 'bg-red-500/10 text-red-700 border-red-500/20';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historique des Notifications</CardTitle>
            <CardDescription>Les 50 dernières notifications envoyées</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Envoyer Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>📤 Envoyer une notification test</DialogTitle>
                <DialogDescription>
                  Testez vos notifications push en temps réel
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID *</Label>
                  <Input
                    id="userId"
                    placeholder="UUID de l'utilisateur"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: 🎉 Ton premier groupe est formé !"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message *</Label>
                  <Textarea
                    id="body"
                    placeholder="Ex: C'est parti ! Rejoins tes nouveaux potes au bar dans 2h"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionUrl">URL d'action</Label>
                  <Input
                    id="actionUrl"
                    placeholder="/groups"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSending}>
                  {isSending ? 'Envoi...' : 'Envoyer maintenant'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Click Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {notifications && notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <TableRow key={notif.id}>
                      <TableCell className="font-medium">
                        {format(new Date(notif.created_at), 'PPp', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{notif.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{notif.title}</TableCell>
                      <TableCell>
                        {notif.read_at ? (
                          <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Ouverte</Badge>
                        ) : (
                          <Badge variant="outline">Envoyée</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={getStatusColor(notif.open_rate)}>
                          {notif.open_rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{notif.click_rate.toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune notification envoyée pour le moment
                  </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📚 Ressources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-between" asChild>
            <a
              href={`https://supabase.com/dashboard/project/xhrievvdnajvylyrowwu/functions/send-push-notification/logs`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir les logs Edge Function
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-between" asChild>
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Firebase Console
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
