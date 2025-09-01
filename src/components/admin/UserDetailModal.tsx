import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useUserDetails } from "@/hooks/useUserDetails";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, MapPin, MessageSquare, Star, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserDetailModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const UserDetailModal = ({ userId, isOpen, onClose }: UserDetailModalProps) => {
  const { fetchUserDetails, updateProfile, loading, error } = useUserDetails();
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });

  const loadUserDetails = async () => {
    if (!userId) return;
    
    const details = await fetchUserDetails(userId);
    if (details) {
      setUserDetails(details);
      setEditForm({
        first_name: details.profile?.first_name || '',
        last_name: details.profile?.last_name || '',
        email: details.user_info?.email || ''
      });
    }
  };

  const handleSave = async () => {
    const success = await updateProfile(userId, editForm);
    if (success) {
      toast({
        title: "Profil mis à jour",
        description: "Les informations utilisateur ont été modifiées",
      });
      setEditing(false);
      loadUserDetails();
    }
  };

  // Load details when modal opens
  React.useEffect(() => {
    if (isOpen && userId) {
      loadUserDetails();
    }
  }, [isOpen, userId]);

  if (loading && !userDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !userDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erreur</DialogTitle>
          </DialogHeader>
          <p className="text-red-600">{error || "Impossible de charger les détails utilisateur"}</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Détails utilisateur
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="groups">Groupes</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Informations personnelles</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editing ? setEditing(false) : setEditing(true)}
                  >
                    {editing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Prénom</label>
                      <Input
                        value={editForm.first_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nom</label>
                      <Input
                        value={editForm.last_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button onClick={handleSave} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nom complet</p>
                      <p className="font-medium">
                        {userDetails.profile?.first_name || userDetails.profile?.last_name
                          ? `${userDetails.profile.first_name || ''} ${userDetails.profile.last_name || ''}`.trim()
                          : 'Non renseigné'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{userDetails.user_info?.email || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ID utilisateur</p>
                      <p className="font-mono text-xs">{userDetails.user_info?.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rôles</p>
                      <div className="flex gap-1 mt-1">
                        {userDetails.roles?.length > 0 ? (
                          userDetails.roles.map((role: string) => (
                            <Badge key={role} variant="secondary">{role}</Badge>
                          ))
                        ) : (
                          <Badge variant="outline">user</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Inscription</p>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(userDetails.user_info?.created_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dernière connexion</p>
                    <p className="text-sm">
                      {userDetails.user_info?.last_sign_in_at ? (
                        formatDistanceToNow(new Date(userDetails.user_info.last_sign_in_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })
                      ) : (
                        'Jamais'
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Groupes actifs</CardTitle>
              </CardHeader>
              <CardContent>
                {userDetails.active_groups?.length > 0 ? (
                  <div className="space-y-3">
                    {userDetails.active_groups.map((group: any) => (
                      <div key={group.group_id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">Groupe {group.group_id.slice(0, 8)}...</p>
                          <p className="text-sm text-muted-foreground">
                            {group.location_name || 'Lieu non spécifié'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge>{group.status}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(group.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun groupe actif</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des sorties</CardTitle>
              </CardHeader>
              <CardContent>
                {userDetails.outings_history?.length > 0 ? (
                  <div className="space-y-3">
                    {userDetails.outings_history.map((outing: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{outing.bar_name}</p>
                          <p className="text-sm text-muted-foreground">{outing.bar_address}</p>
                          <p className="text-xs text-muted-foreground">
                            {outing.participants_count} participants
                          </p>
                        </div>
                        <div className="text-right">
                          {outing.user_rating && (
                            <div className="flex items-center gap-1 mb-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{outing.user_rating}/5</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(outing.completed_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune sortie dans l'historique</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Messages récents</CardTitle>
              </CardHeader>
              <CardContent>
                {userDetails.recent_messages?.length > 0 ? (
                  <div className="space-y-3">
                    {userDetails.recent_messages.map((message: any, index: number) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant={message.is_system ? "secondary" : "default"}>
                            {message.is_system ? 'Système' : 'Utilisateur'}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </p>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Groupe: {message.group_id.slice(0, 8)}...
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun message récent</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};