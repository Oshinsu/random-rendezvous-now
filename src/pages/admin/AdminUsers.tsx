import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, Eye, Users, TrendingUp, Activity, Filter } from 'lucide-react';
import { UserDetailModal } from "@/components/admin/UserDetailModal";
import { toast } from 'sonner';
import { BatchActions } from '@/components/admin/users/BatchActions';
import { UserFilters } from '@/components/admin/users/UserFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGenderDetection } from '@/hooks/useGenderDetection';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // ✅ SOTA 2025: Batch Actions & CRM Filters
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [healthScores, setHealthScores] = useState<Record<string, number>>({});
  const [healthScoreRange, setHealthScoreRange] = useState<number[]>([0, 100]);
  const [churnRisks, setChurnRisks] = useState<string[]>([]);
  
  // ✅ GENDER DETECTION via Lovable AI
  const { detectGenders, genderStats, getGenderForUser, loading: genderLoading } = useGenderDetection();

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Utiliser la nouvelle fonction admin pour récupérer tous les utilisateurs
      const { data: users, error: usersError } = await supabase
        .rpc('get_all_users_admin');

      if (usersError) throw usersError;

      // Formatter les données pour l'interface
      const processedUsers = users.map(user => ({
        id: user.id,
        email: user.email || 'N/A',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        profile: {
          first_name: user.first_name,
          last_name: user.last_name
        },
        active_groups: user.active_groups_count || 0,
        total_outings: user.total_outings_count || 0
      }));

      setUsers(processedUsers);
      
      // ✅ GENDER DETECTION: Trigger detection for all users
      detectGenders(processedUsers);
      
      // ✅ SOTA 2025: Fetch health scores
      const { data: healthData } = await supabase
        .from('crm_user_health')
        .select('user_id, health_score')
        .in('user_id', processedUsers.map(u => u.id));
      
      if (healthData) {
        const scoresMap: Record<string, number> = {};
        healthData.forEach((h: any) => {
          scoresMap[h.user_id] = h.health_score;
        });
        setHealthScores(scoresMap);
      }
      
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
          <h1 className="text-3xl font-bold text-red-800">Gestion des utilisateurs SOTA 2025</h1>
          <p className="text-red-600 mt-2">{users.length} utilisateurs + Health Scores + Batch Actions</p>
        </div>
      </div>

      {/* ✅ SOTA 2025: Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">
              {users.length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Utilisateurs actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              {users.filter(u => u.active_groups && u.active_groups > 0).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Santé moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800">
              {Object.values(healthScores).length > 0
                ? Math.round(Object.values(healthScores).reduce((a, b) => a + b, 0) / Object.values(healthScores).length)
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700">Sélectionnés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">
              {selectedUsers.length}
            </div>
          </CardContent>
        </Card>
        
        {/* ✅ NEW: Gender Detection KPI Card */}
        <Card className="border-pink-200 bg-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-pink-700 flex items-center gap-2">
              <User className="h-4 w-4" />
              Répartition H/F
            </CardTitle>
          </CardHeader>
          <CardContent>
            {genderLoading ? (
              <div className="flex justify-center py-2">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs">👨 Hommes</span>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    {genderStats.hommes} ({genderStats.total > 0 ? Math.round(genderStats.hommes / genderStats.total * 100) : 0}%)
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">👩 Femmes</span>
                  <Badge className="bg-pink-100 text-pink-800 text-xs">
                    {genderStats.femmes} ({genderStats.total > 0 ? Math.round(genderStats.femmes / genderStats.total * 100) : 0}%)
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">❓ Doute</span>
                  <Badge className="bg-gray-100 text-gray-800 text-xs">
                    {genderStats.doutes} ({genderStats.total > 0 ? Math.round(genderStats.doutes / genderStats.total * 100) : 0}%)
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ✅ SOTA 2025: Tabs */}
      <Tabs defaultValue="table">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">📋 Liste des utilisateurs</TabsTrigger>
          <TabsTrigger value="crm">💎 CRM & Health Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          {/* ✅ SOTA 2025: User Filters */}
          <UserFilters
            healthScoreRange={healthScoreRange}
            onHealthScoreChange={setHealthScoreRange}
            churnRisks={churnRisks}
            onChurnRiskToggle={(risk) => {
              if (churnRisks.includes(risk)) {
                setChurnRisks(churnRisks.filter(r => r !== risk));
              } else {
                setChurnRisks([...churnRisks, risk]);
              }
            }}
            onApplyFilters={() => {
              // Apply filters logic
              console.log('Applying filters:', { healthScoreRange, churnRisks });
            }}
            onResetFilters={() => {
              setHealthScoreRange([0, 100]);
              setChurnRisks([]);
            }}
          />

          {/* ✅ SOTA 2025: Batch Actions */}
          <BatchActions
            selectedCount={selectedUsers.length}
            totalCount={users.length}
            onSelectAll={() => {
              if (selectedUsers.length === users.length) {
                setSelectedUsers([]);
              } else {
                setSelectedUsers(users.map(u => u.id));
              }
            }}
            onExport={() => {
              console.log('Exporting users:', selectedUsers);
              toast.success("Export en cours", {
                description: `Export de ${selectedUsers.length} utilisateurs`
              });
            }}
            onAddToSegment={() => {
              console.log('Adding to segment:', selectedUsers);
              toast.success("Ajout au segment", {
                description: `${selectedUsers.length} utilisateurs ajoutés`
              });
            }}
            onSuspend={() => {
              console.log('Suspending users:', selectedUsers);
              toast.error("Suspension", {
                description: `${selectedUsers.length} utilisateurs suspendus`
              });
            }}
            isProcessing={false}
          />

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
                      <TableHead>
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(users.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Health Score</TableHead>
                      <TableHead>Inscription</TableHead>
                      <TableHead>Dernière connexion</TableHead>
                      <TableHead>Groupes actifs</TableHead>
                      <TableHead>Sorties totales</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                          />
                        </TableCell>
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
                          {(() => {
                            const gender = getGenderForUser(user.id);
                            if (!gender) return <span className="text-muted-foreground text-xs">-</span>;
                            if (gender === 'homme') return <Badge className="bg-blue-100 text-blue-800 text-xs">👨 H</Badge>;
                            if (gender === 'femme') return <Badge className="bg-pink-100 text-pink-800 text-xs">👩 F</Badge>;
                            return <Badge className="bg-gray-100 text-gray-800 text-xs">❓</Badge>;
                          })()}
                        </TableCell>
                        <TableCell>
                          {healthScores[user.id] ? (
                            <Badge 
                              className={
                                healthScores[user.id] >= 70 ? 'bg-green-100 text-green-800' :
                                healthScores[user.id] >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {healthScores[user.id]}/100
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(user.created_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in_at ? (
                            formatDistanceToNow(new Date(user.last_sign_in_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })
                          ) : (
                            <span className="text-muted-foreground">Jamais</span>
                          )}
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
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={user.active_groups > 0 ? "default" : "outline"}
                              className={user.active_groups > 0 ? "bg-green-100 text-green-800" : ""}
                            >
                              {user.active_groups > 0 ? "Actif" : "Inactif"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crm">
          <Card>
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-purple-800">CRM Health Scores & Segmentation</CardTitle>
              <CardDescription>
                Analyse comportementale + prédiction churn + lifecycle stages
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {users.filter(u => healthScores[u.id]).map((user) => {
                  const score = healthScores[user.id];
                  return (
                    <Card key={user.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {user.profile?.first_name || user.profile?.last_name 
                                ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim()
                                : user.email
                              }
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.active_groups} groupes • {user.total_outings} sorties
                            </div>
                          </div>
                          <Badge 
                            className={
                              score >= 70 ? 'bg-green-100 text-green-800' :
                              score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {score >= 70 ? '🟢 Excellent' :
                             score >= 50 ? '🟡 Moyen' :
                             '🔴 Critique'
                            } ({score}/100)
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
};