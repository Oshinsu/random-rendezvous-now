import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { usePushNotificationsAdmin } from '@/hooks/usePushNotificationsAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Eye, Trash2, Sparkles, Bell } from 'lucide-react';

const TEST_SCENARIOS = [
  {
    name: "🎉 Welcome New User",
    type: "welcome",
    title: "Bienvenue sur Random !",
    body: "Rejoins ton premier groupe pour découvrir des lieux incribles",
    imageUrl: "/notif-welcome.png",
    actionUrl: "/dashboard"
  },
  {
    name: "🔥 FOMO Peak Hours",
    type: "fomo_peak",
    title: "C'est le moment parfait !",
    body: "18h-22h : Les groupes se forment en ce moment 🚀",
    imageUrl: "/notif-fomo-peak.png",
    actionUrl: "/groups"
  },
  {
    name: "🏆 First Win",
    type: "first_win",
    title: "Première victoire ! 🎯",
    body: "Tu as complété ta première sortie Random",
    imageUrl: "/notif-first-win.png",
    actionUrl: "/profile"
  },
  {
    name: "🍸 Bar Assigned",
    type: "bar_assigned",
    title: "Ton bar t'attend !",
    body: "Rendez-vous à 20h30 au Wanderlust 📍",
    imageUrl: "/notif-bar-assigned.png",
    actionUrl: "/groups"
  },
  {
    name: "👥 Group Forming",
    type: "group_forming",
    title: "Ton groupe se forme !",
    body: "3/5 personnes ont déjà rejoint",
    imageUrl: "/notif-group-forming.png",
    actionUrl: "/groups"
  }
];

export const PushTestPanel = () => {
  const { sendTestNotification, isSending } = usePushNotificationsAdmin();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [notifType, setNotifType] = useState('welcome');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actionUrl, setActionUrl] = useState('/dashboard');

  // Fetch recent users for selection
  const { data: recentUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['recent-users-for-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch test notifications history
  const { data: testHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['test-notifications-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, type, title, body, created_at, user_id')
        .ilike('type', '%test%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  const applyScenario = (scenario: typeof TEST_SCENARIOS[0]) => {
    setNotifType(scenario.type);
    setTitle(scenario.title);
    setBody(scenario.body);
    setImageUrl(scenario.imageUrl);
    setActionUrl(scenario.actionUrl);
  };

  const handleSendTest = () => {
    if (!selectedUser) {
      toast.error('❌ Sélectionne un utilisateur');
      return;
    }

    if (!title || !body) {
      toast.error('❌ Titre et message requis');
      return;
    }

    sendTestNotification({
      userId: selectedUser,
      type: `test_${notifType}`,
      title,
      body,
      imageUrl: imageUrl || undefined,
      actionUrl: actionUrl || undefined,
    });

    setTimeout(() => refetchHistory(), 1000);
  };

  const clearTestHistory = async () => {
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .ilike('type', '%test%');

    if (error) {
      toast.error('❌ Erreur lors du nettoyage');
    } else {
      toast.success('✅ Historique de test nettoyé');
      refetchHistory();
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Test Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Panneau de Test Interne
          </CardTitle>
          <CardDescription>
            Envoi de notifications test pour validation avant production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="custom" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scenarios">🎯 Scénarios pré-remplis</TabsTrigger>
              <TabsTrigger value="custom">✏️ Personnalisé</TabsTrigger>
            </TabsList>

            <TabsContent value="scenarios" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TEST_SCENARIOS.map((scenario) => (
                  <Card
                    key={scenario.type}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => applyScenario(scenario)}
                  >
                    <CardContent className="p-4">
                      <p className="font-semibold text-sm mb-2">{scenario.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {scenario.body}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de notification</Label>
                <Input
                  id="type"
                  placeholder="welcome, fomo_peak, etc."
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Bienvenue sur Random !"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message *</Label>
                <Textarea
                  id="body"
                  placeholder="Ex: Rejoins ton premier groupe pour découvrir..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    placeholder="/notif-welcome.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actionUrl">Action URL</Label>
                  <Input
                    id="actionUrl"
                    placeholder="/dashboard"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">Destinataire *</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionne un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {loadingUsers ? (
                  <SelectItem value="loading" disabled>
                    Chargement...
                  </SelectItem>
                ) : (
                  recentUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email || user.id.slice(0, 8)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Visual Preview */}
          {title && body && (
            <div className="mt-6">
              <Label className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4" />
                Aperçu de la notification
              </Label>
              <div className="border border-border rounded-lg p-4 bg-card shadow-md max-w-[360px]">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bell className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-1 line-clamp-1">{title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{body}</p>
                    {imageUrl && (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="mt-2 rounded w-full max-h-24 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button
            className="w-full mt-6 gap-2"
            onClick={handleSendTest}
            disabled={isSending || !selectedUser || !title || !body}
          >
            <Send className="h-4 w-4" />
            {isSending ? 'Envoi en cours...' : 'Envoyer notification test'}
          </Button>
        </CardContent>
      </Card>

      {/* Test History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historique des tests</CardTitle>
              <CardDescription>Dernières notifications de test envoyées</CardDescription>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={clearTestHistory}
            >
              <Trash2 className="h-4 w-4" />
              Nettoyer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {testHistory && testHistory.length > 0 ? (
            <div className="space-y-3">
              {testHistory.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start justify-between gap-3 p-3 border border-border rounded-lg bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        [TEST]
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {notif.type}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {notif.body}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(notif.created_at).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun test envoyé pour le moment
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
