import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAdminMessages } from "@/hooks/useAdminMessages";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare, User, Bot, Search, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const AdminMessages = () => {
  const { messages, loading, error, fetchMessages, deleteMessage, updateMessage } = useAdminMessages();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSystem, setFilterSystem] = useState<boolean | undefined>(undefined);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleSearch = () => {
    fetchMessages({ 
      search: searchTerm || undefined,
      isSystem: filterSystem
    });
  };

  const handleDelete = async (messageId: string) => {
    const success = await deleteMessage(messageId);
    if (success) {
      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du message",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (messageId: string) => {
    if (!editText.trim()) return;
    
    const success = await updateMessage(messageId, editText);
    if (success) {
      toast({
        title: "Message modifié",
        description: "Le message a été modifié avec succès",
      });
      setEditingMessage(null);
      setEditText('');
    } else {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du message",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800">Erreur: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-800">Modération des messages</h1>
          <p className="text-red-600 mt-2">{messages.length} messages récents</p>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                placeholder="Rechercher dans les messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterSystem === false ? "default" : "outline"}
                onClick={() => setFilterSystem(filterSystem === false ? undefined : false)}
                size="sm"
              >
                <User className="h-4 w-4 mr-1" />
                Utilisateur
              </Button>
              <Button
                variant={filterSystem === true ? "default" : "outline"}
                onClick={() => setFilterSystem(filterSystem === true ? undefined : true)}
                size="sm"
              >
                <Bot className="h-4 w-4 mr-1" />
                Système
              </Button>
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4 mr-1" />
                Rechercher
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            Vue d'ensemble des messages du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Badge variant={message.is_system ? "secondary" : "default"}>
                      {message.is_system ? (
                        <>
                          <Bot className="h-3 w-3 mr-1" />
                          Système
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          Utilisateur
                        </>
                      )}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMessage(message.id);
                        setEditText(message.message);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le message</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(message.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    <strong>Utilisateur:</strong> {
                      message.user_profile?.first_name || message.user_profile?.last_name
                        ? `${message.user_profile.first_name || ''} ${message.user_profile.last_name || ''}`.trim()
                        : message.user_profile?.email || message.user_id.slice(0, 8)
                    }
                  </p>
                  <p><strong>Groupe:</strong> {message.group_id.slice(0, 8)}... ({message.group_info?.status})</p>
                  <p><strong>Lieu:</strong> {message.group_info?.location_name || 'Non spécifié'}</p>
                </div>

                {editingMessage === message.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="Modifier le message..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(message.id)}>
                        Sauvegarder
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingMessage(null);
                          setEditText('');
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="text-sm">{message.message}</p>
                  </div>
                )}
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun message trouvé</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};