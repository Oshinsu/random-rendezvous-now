import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Settings, Star, Trophy, CreditCard } from 'lucide-react';
import OutingsHistory from '@/components/OutingsHistory';
import { useOutingsHistory } from '@/hooks/useOutingsHistory';
import { useProfileUpdate } from '@/hooks/useProfileUpdate';
import { useProfile } from '@/hooks/useProfile';
import { EmailPreferencesSection } from '@/components/profile/EmailPreferencesSection';
import { DangerZoneSection } from '@/components/profile/DangerZoneSection';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const UserProfile = () => {
  const { user, signOut } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const { data: outings } = useOutingsHistory();
  const { updateProfile, isUpdating } = useProfileUpdate();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
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

  const totalAdventures = outings?.length || 0;
  const totalParticipants = outings?.reduce((sum, outing) => sum + outing.participants_count, 0) || 0;
  const averageGroupSize = totalAdventures > 0 ? Math.round(totalParticipants / totalAdventures) : 0;

  const displayFirstName = firstName || profile?.first_name || '';
  const displayLastName = lastName || profile?.last_name || '';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-white/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <Avatar className="h-16 w-16 ring-2 ring-primary/30">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground text-xl">
                    {getInitials(`${displayFirstName} ${displayLastName}`)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-base text-foreground font-semibold">
                {displayFirstName || displayLastName ? `${displayFirstName} ${displayLastName}` : 'Utilisateur Random'}
              </CardTitle>
              <CardDescription className="flex items-center justify-center space-x-2 text-xs">
                <Mail className="h-3.5 w-3.5" />
                <span>{user?.email}</span>
              </CardDescription>
              <div className="text-xs text-muted-foreground bg-secondary/50 rounded-full px-3 py-1 mt-2 inline-block">
                Utilisateur Standard
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center justify-between bg-primary/10 rounded-lg p-2.5">
                <div className="flex items-center space-x-1.5">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Aventures</span>
                </div>
                <span className="text-primary font-bold text-sm">{totalAdventures}</span>
              </div>
              <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-2.5">
                <div className="flex items-center space-x-1.5">
                  <Trophy className="h-4 w-4 text-secondary-foreground" />
                  <span className="text-xs font-medium text-secondary-foreground">Taille moyenne</span>
                </div>
                <span className="text-secondary-foreground font-bold text-sm">{averageGroupSize || '-'}</span>
              </div>
              
              {/* Upgrade to Bar Owner */}
              <div className="pt-2 border-t border-border/50">
                <Button 
                  asChild
                  variant="outline" 
                  className="w-full text-xs bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0"
                >
                  <Link to="/bar-application">
                    <CreditCard className="h-3 w-3 mr-1.5" />
                    Devenir Bar Partenaire
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-1 text-base">
                    <User className="h-4 w-4" />
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
                  className="border-primary/30 text-primary hover:bg-primary/10 py-1 px-3 min-h-0 h-8 text-xs"
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
          <Card className="bg-white/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-1 text-base">
                <Settings className="h-4 w-4" />
                <span>Paramètres du compte</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Gérez votre compte et vos préférences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between bg-destructive/10 rounded-lg p-3">
                <div>
                  <h4 className="font-medium text-destructive-foreground text-xs">Déconnexion</h4>
                  <p className="text-xs text-muted-foreground">
                    Se déconnecter de votre session
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

          {/* Danger Zone */}
          <DangerZoneSection />

          {/* Outings History */}
          <OutingsHistory />
        </div>
      </div>
    </div>
  );
};