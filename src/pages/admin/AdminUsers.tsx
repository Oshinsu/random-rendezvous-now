import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
  };
  active_groups?: number;
  total_outings?: number;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with user data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, created_at');

      if (profilesError) throw profilesError;

      // Fetch active groups count for each user
      const { data: activeGroups, error: groupsError } = await supabase
        .from('group_participants')
        .select('user_id, groups!inner(status)')
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed']);

      if (groupsError) throw groupsError;

      // Fetch outings history count
      const { data: outings, error: outingsError } = await supabase
        .from('user_outings_history')
        .select('user_id');

      if (outingsError) throw outingsError;

      // Process data
      const processedUsers = profiles.map(profile => {
        const userActiveGroups = activeGroups.filter(ag => ag.user_id === profile.id).length;
        const userOutings = outings.filter(o => o.user_id === profile.id).length;

        return {
          id: profile.id,
          email: profile.email || 'N/A',
          created_at: profile.created_at,
          profile: {
            first_name: profile.first_name,
            last_name: profile.last_name
          },
          active_groups: userActiveGroups,
          total_outings: userOutings
        };
      });

      setUsers(processedUsers);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-red-800">Gestion des utilisateurs</h1>
          <p className="text-red-600 mt-2">{users.length} utilisateurs enregistrés</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            Vue d'ensemble des utilisateurs de Random
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead>Groupes actifs</TableHead>
                  <TableHead>Sorties totales</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.profile?.first_name || user.profile?.last_name 
                            ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim()
                            : 'Utilisateur'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(user.created_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </TableCell>
                    <TableCell>
                      {user.active_groups > 0 ? (
                        <Badge variant="default">{user.active_groups}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.total_outings > 0 ? (
                        <Badge variant="secondary">{user.total_outings}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.active_groups > 0 ? "default" : "outline"}
                        className={user.active_groups > 0 ? "bg-green-100 text-green-800" : ""}
                      >
                        {user.active_groups > 0 ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};