
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

const ProfilePage = () => {
  const { user, signOut } = useAuth();
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

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
            Mon Profil
          </h1>
          <p className="text-gray-600">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-lg">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24 ring-4 ring-amber-200">
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white text-2xl">
                      {getInitials(`${firstName} ${lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl text-gray-800">
                  {firstName} {lastName}
                </CardTitle>
                <CardDescription className="flex items-center justify-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between bg-amber-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Aventures</span>
                  </div>
                  <span className="text-amber-700 font-bold">0</span>
                </div>
                <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Score</span>
                  </div>
                  <span className="text-green-700 font-bold">0</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Informations Personnelles</span>
                    </CardTitle>
                    <CardDescription>
                      Mettez à jour vos informations personnelles
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    {isEditing ? 'Sauvegarder' : 'Modifier'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditing}
                      className="bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom de famille</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing}
                      className="bg-white/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Paramètres du Compte</span>
                </CardTitle>
                <CardDescription>
                  Gérez vos préférences et votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between bg-red-50 rounded-lg p-4">
                  <div>
                    <h4 className="font-medium text-red-800">Se déconnecter</h4>
                    <p className="text-sm text-red-600">
                      Déconnectez-vous de votre compte Random
                    </p>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="destructive"
                    size="sm"
                  >
                    Se déconnecter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
