import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail, Settings, Crown, Users, Database, BarChart3, Activity } from 'lucide-react';
import { useComprehensiveAdminStats } from '@/hooks/useComprehensiveAdminStats';
import { useProfileUpdate } from '@/hooks/useProfileUpdate';
import { useProfile } from '@/hooks/useProfile';
import { EmailPreferencesSection } from '@/components/profile/EmailPreferencesSection';
import { DangerZoneSection } from '@/components/profile/DangerZoneSection';
import { Link } from 'react-router-dom';

export const AdminProfile = () => {
  const { user, signOut } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const { stats: adminStats } = useComprehensiveAdminStats();
  const { updateProfile, isUpdating } = useProfileUpdate();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSaveProfile = async () => {
    const success = await updateProfile(firstName, lastName, () => {
      refreshProfile();
    });
    if (success) {
      setIsEditing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const displayFirstName = firstName || profile?.first_name || '';
  const displayLastName = lastName || profile?.last_name || '';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-white/80 backdrop-blur-sm border-red-200/50 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <Avatar className="h-16 w-16 ring-2 ring-red-200">
                  <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-700 text-white text-xl">
                    {getInitials(`${displayFirstName} ${displayLastName}`)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-base text-foreground font-semibold">
                {displayFirstName || displayLastName ? `${displayFirstName} ${displayLastName}` : 'Administrateur'}
              </CardTitle>
              <CardDescription className="flex items-center justify-center space-x-2 text-xs">
                <Mail className="h-3.5 w-3.5" />
                <span>{user?.email}</span>
              </CardDescription>
              <div className="flex flex-col items-center space-y-2 mt-2">
                <div className="flex items-center space-x-1 text-xs text-red-700 bg-red-50 rounded-full px-3 py-1">
                  <Crown className="h-3 w-3" />
                  <span>Administrateur</span>
                </div>
                <Badge className="bg-red-100 text-red-800 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Accès Complet
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {adminStats && (
                <>
                  <div className="bg-blue-50 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-800">Utilisateurs</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <p className="text-blue-900 font-semibold">{adminStats.total_users} total</p>
                      <p className="text-blue-700">+{adminStats.signups_today} aujourd'hui</p>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <Database className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-800">Groupes</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <p className="text-green-900 font-semibold">{adminStats.waiting_groups} en attente</p>
                      <p className="text-green-700">{adminStats.confirmed_groups} confirmés</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-800">Activité</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <p className="text-purple-900 font-semibold">{adminStats.total_outings} sorties</p>
                      <p className="text-purple-700">{adminStats.active_participants} actifs</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <Button 
                      asChild
                      variant="outline" 
                      className="w-full text-xs bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white border-0"
                    >
                      <Link to="/admin">
                        <BarChart3 className="h-3 w-3 mr-1.5" />
                        Panel d'Administration
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Admin Tools */}
          <Card className="bg-white/80 backdrop-blur-sm border-red-200/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-1 text-base">
                <Shield className="h-4 w-4" />
                <span>Outils d'administration</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Accès rapide aux fonctionnalités d'administration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link to="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Gestion des utilisateurs
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link to="/admin/groups">
                    <Database className="h-4 w-4 mr-2" />
                    Gestion des groupes
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link to="/admin/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics système
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link to="/admin/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuration système
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Overview */}
          {adminStats && (
            <Card className="bg-white/80 backdrop-blur-sm border-red-200/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-1 text-base">
                  <Activity className="h-4 w-4" />
                  <span>Vue d'ensemble du système</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Statistiques en temps réel de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{adminStats.total_users}</p>
                    <p className="text-xs text-blue-800">Utilisateurs</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{adminStats.completed_groups}</p>
                    <p className="text-xs text-green-800">Groupes complétés</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">{adminStats.total_messages}</p>
                    <p className="text-xs text-purple-800">Messages</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-lg font-bold text-amber-600">{adminStats.avg_group_size || 0}</p>
                    <p className="text-xs text-amber-800">Taille moy.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-red-200/50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-1 text-base">
                    <Mail className="h-4 w-4" />
                    <span>Informations personnelles</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Modifiez vos informations de profil
                  </CardDescription>
                </div>
                <Button
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  disabled={isUpdating}
                  className="border-red-300 text-red-700 hover:bg-red-50 py-1 px-3 min-h-0 h-8 text-xs"
                >
                  {isUpdating ? 'Sauvegarde...' : isEditing ? 'Sauvegarder' : 'Modifier'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-xs">Prénom</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!isEditing || isUpdating}
                    className="bg-background/50 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-xs">Nom de famille</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!isEditing || isUpdating}
                    className="bg-background/50 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="bg-white/80 backdrop-blur-sm border-red-200/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-1 text-base">
                <Settings className="h-4 w-4" />
                <span>Paramètres du compte</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Gérez votre compte administrateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between bg-destructive/10 rounded-lg p-3">
                <div>
                  <h4 className="font-medium text-destructive-foreground text-xs">Déconnexion</h4>
                  <p className="text-xs text-muted-foreground">
                    Se déconnecter de votre session administrateur
                  </p>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  size="sm"
                  className="py-1 px-3 h-8 text-xs"
                >
                  Se déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Preferences */}
          <EmailPreferencesSection />
        </div>
      </div>
    </div>
  );
};