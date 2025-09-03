
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { User, Mail, Calendar, Settings, Star, Trophy } from 'lucide-react';
import OutingsHistory from '@/components/OutingsHistory';
import { useOutingsHistory } from '@/hooks/useOutingsHistory';
import { useProfileUpdate } from '@/hooks/useProfileUpdate';
import { useProfile } from '@/hooks/useProfile';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { EmailPreferencesSection } from '@/components/profile/EmailPreferencesSection';
import { DangerZoneSection } from '@/components/profile/DangerZoneSection';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, refreshProfile } = useProfile();
  const { data: outings } = useOutingsHistory();
  const { updateProfile, isUpdating } = useProfileUpdate();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { t, i18n } = useTranslation();

  // Update form fields when profile data loads
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

  // Calculate user stats from real data
  const totalAdventures = outings?.length || 0;
  const totalParticipants = outings?.reduce((sum, outing) => sum + outing.participants_count, 0) || 0;
  const averageGroupSize = totalAdventures > 0 ? Math.round(totalParticipants / totalAdventures) : 0;

  // Show loading state
  if (profileLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-2 py-6 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  const displayFirstName = firstName || profile?.first_name || '';
  const displayLastName = lastName || profile?.last_name || '';

  return (
    <AppLayout>
      <Helmet>
        <title>Profil • Random — Historique et paramètres</title>
        <meta name="description" content="Profil Random: modifiez vos informations et consultez l’historique de vos sorties." />
        <link rel="canonical" href={`${window.location.origin}/profile`} />
        <meta property="og:title" content="Profil • Random" />
        <meta property="og:description" content="Gérez votre profil et votre historique de sorties." />
        <meta property="og:type" content="profile" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          "name": `${displayFirstName} ${displayLastName}`.trim() || 'Utilisateur Random'
        })}</script>
      </Helmet>
      <div className="container mx-auto px-2 py-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
            {t('profile.title')}
          </h1>
          <p className="text-gray-600 text-sm">
            {t('profile.subtitle')}
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
                      {getInitials(`${displayFirstName} ${displayLastName}`)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-base text-gray-800 font-semibold">
                  {displayFirstName || displayLastName ? `${displayFirstName} ${displayLastName}` : 'Utilisateur Random'}
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
                    <span className="text-xs font-medium text-amber-800">{t('profile.adventures')}</span>
                  </div>
                  <span className="text-amber-700 font-bold text-sm">{totalAdventures}</span>
                </div>
                <div className="flex items-center justify-between bg-green-50 rounded-lg p-2.5">
                  <div className="flex items-center space-x-1.5">
                    <Trophy className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-800">{t('profile.average_group')}</span>
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
                      <span>{t('profile.personal_info')}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t('profile.personal_info_desc')}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    disabled={isUpdating}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 py-1 px-3 min-h-0 h-8 text-xs"
                  >
                    {isUpdating ? t('profile.saving') : isEditing ? t('profile.save') : t('profile.edit')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="text-xs">{t('profile.first_name')}</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditing || isUpdating}
                      className="bg-white/50 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-xs">{t('profile.last_name')}</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing || isUpdating}
                      className="bg-white/50 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">{t('profile.email')}</Label>
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
                  <span>{t('profile.account_settings')}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('profile.account_settings_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                  <div>
                    <h4 className="font-medium text-red-800 text-xs">{t('profile.logout')}</h4>
                    <p className="text-xs text-red-600">
                      {t('profile.logout_desc')}
                    </p>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="destructive"
                    size="sm"
                    className="py-1 px-3 h-8 text-xs"
                  >
                    {t('profile.logout')}
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
    </AppLayout>
  );
};

export default ProfilePage;
