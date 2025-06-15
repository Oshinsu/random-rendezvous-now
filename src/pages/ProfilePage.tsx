import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Calendar, Settings, Star, Trophy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import OutingsHistory from '@/components/OutingsHistory';
import { useOutingsHistory } from '@/hooks/useOutingsHistory';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { data: outings } = useOutingsHistory();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSaveProfile = async () => {
    // TODO: Implement profile update logic with Supabase
    toast({
      title: 'Profil mis à jour',
      description: 'Vos informations ont été sauvegardées avec succès.',
    });
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Calculate user stats from real data
  const totalAdventures = outings?.length || 0;
  const totalParticipants = outings?.reduce((sum, outing) => sum + outing.participants_count, 0) || 0;
  const averageGroupSize = totalAdventures > 0 ? Math.round(totalParticipants / totalAdventures) : 0;

  return (
    <AppLayout>
      <div className="container mx-auto px-2 py-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
            Mon Profil
          </h1>
          <p className="text-gray-600 text-sm">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <Avatar className="h-16 w-16 ring-2 ring-amber-200">
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white text-xl">
                      {getInitials(`${firstName} ${lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-base text-gray-800 font-semibold">
                  {firstName} {lastName}
                </CardTitle>
                <CardDescription className="flex items-center justify-center space-x-2 text-xs">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{user?.email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between bg-amber-50 rounded-lg p-2.5">
                  <div className="flex items-center space-x-1.5">
                    <Star className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-800">Aventures</span>
                  </div>
                  <span className="text-amber-700 font-bold text-sm">{totalAdventures}</span>
                </div>
                <div className="flex items-center justify-between bg-green-50 rounded-lg p-2.5">
                  <div className="flex items-center space-x-1.5">
                    <Trophy className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-800">Groupe moyen</span>
                  </div>
                  <span className="text-green-700 font-bold text-sm">{averageGroupSize || '-'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Personal Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-1 text-base">
                      <User className="h-4 w-4" />
                      <span>Informations Personnelles</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Mettez à jour vos informations personnelles
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 py-1 px-3 min-h-0 h-8 text-xs"
                  >
                    {isEditing ? 'Sauvegarder' : 'Modifier'}
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
                      disabled={!isEditing}
                      className="bg-white/50 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-xs">Nom de famille</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing}
                      className="bg-white/50 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-1 text-base">
                  <Settings className="h-4 w-4" />
                  <span>Paramètres du Compte</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Gérez vos préférences et votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                  <div>
                    <h4 className="font-medium text-red-800 text-xs">Se déconnecter</h4>
                    <p className="text-xs text-red-600">
                      Déconnectez-vous de votre compte Random
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

            {/* Outings History */}
            <OutingsHistory />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
