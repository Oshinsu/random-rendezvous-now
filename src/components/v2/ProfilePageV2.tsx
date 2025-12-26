import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Trophy, Flame, Star, Crown, Zap, Sparkles, User, Mail, Settings } from 'lucide-react';
import OutingsHistory from '@/components/OutingsHistory';
import { useOutingsHistory } from '@/hooks/useOutingsHistory';
import { useProfileUpdate } from '@/hooks/useProfileUpdate';
import { useProfile } from '@/hooks/useProfile';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { EmailPreferencesSection } from '@/components/profile/EmailPreferencesSection';
import { DangerZoneSection } from '@/components/profile/DangerZoneSection';
import { CreditsBalance } from '@/components/CreditsBalance';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { cn } from '@/lib/utils';

// 🏆 Système de niveaux
const LEVELS = [
  { id: 1, name: 'Débutant', minOutings: 0, icon: Star, color: '#94a3b8', gradient: 'from-slate-400 to-slate-500' },
  { id: 2, name: 'Explorateur', minOutings: 3, icon: Sparkles, color: '#f1c232', gradient: 'from-[#f1c232] to-[#e6a91a]' },
  { id: 3, name: 'Aventurier', minOutings: 10, icon: Flame, color: '#f97316', gradient: 'from-orange-400 to-orange-600' },
  { id: 4, name: 'Légende', minOutings: 25, icon: Crown, color: '#c08a15', gradient: 'from-[#c08a15] to-[#825c16]' },
  { id: 5, name: 'Maître Random', minOutings: 50, icon: Zap, color: '#7c3aed', gradient: 'from-purple-500 to-purple-700' },
];

// 🎖️ Badges débloquables
const BADGES = [
  { id: 'first_outing', label: '🎉 Première sortie', description: 'Ta première aventure', minOutings: 1 },
  { id: 'social_butterfly', label: '🦋 Papillon Social', description: '5 sorties complétées', minOutings: 5 },
  { id: 'bar_connoisseur', label: '🍷 Connaisseur', description: '10 bars découverts', minOutings: 10 },
  { id: 'night_owl', label: '🦉 Noctambule', description: '15 soirées inoubliables', minOutings: 15 },
  { id: 'legend', label: '👑 Légende', description: '25 sorties Random', minOutings: 25 },
  { id: 'master', label: '⚡ Maître Random', description: 'Le niveau ultime (50+)', minOutings: 50 },
  { id: 'early_adopter', label: '🚀 Early Adopter', description: 'Parmi les premiers', alwaysUnlocked: true },
  { id: 'verified', label: '✅ Vérifié', description: 'Email confirmé', alwaysUnlocked: true },
];

const ProfilePageV2 = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, refreshProfile } = useProfile();
  const { data: outings } = useOutingsHistory();
  const { updateProfile, isUpdating } = useProfileUpdate();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(false);

  // Update form fields when profile data loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const totalOutings = outings?.length || 0;
  const totalParticipants = outings?.reduce((sum, outing) => sum + outing.participants_count, 0) || 0;
  const averageGroupSize = totalOutings > 0 ? Math.round(totalParticipants / totalOutings) : 0;

  // Calculate current level
  const currentLevel = LEVELS.reduce((acc, level) => 
    totalOutings >= level.minOutings ? level : acc
  , LEVELS[0]);
  
  const nextLevel = LEVELS.find(l => l.minOutings > totalOutings) || currentLevel;
  const progressToNextLevel = nextLevel !== currentLevel 
    ? ((totalOutings - currentLevel.minOutings) / (nextLevel.minOutings - currentLevel.minOutings)) * 100
    : 100;

  // Check for unlocked badges
  const unlockedBadges = BADGES.filter(badge => 
    badge.alwaysUnlocked || totalOutings >= (badge.minOutings || 0)
  );

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSaveProfile = async () => {
    const success = await updateProfile(firstName, lastName, undefined, undefined, () => {
      refreshProfile();
    });
    if (success) {
      setIsEditing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

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
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={300}
          colors={['#ffffff', '#fffbe8', '#f1c232', '#c08a15']}
        />
      )}
      
      <Helmet>
        <title>Profil • Random — Ton aventure continue</title>
        <meta name="description" content="Profil Random: track ton niveau, badges et historique de sorties." />
      </Helmet>
      
      <div className="container mx-auto px-2 py-6 space-y-6">
        {/* Level Card - Hero avec gamification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8 border-2 shadow-[0_0_40px_rgba(241,194,50,0.2)] overflow-hidden">
            <div className={cn(
              "h-2 bg-gradient-to-r",
              currentLevel.gradient
            )} />
            <CardContent className="p-6 md:p-8 bg-gradient-to-br from-white via-[#fffbe8]/30 to-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br",
                      currentLevel.gradient,
                      "shadow-[0_0_30px_rgba(241,194,50,0.4)]"
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <currentLevel.icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                  </motion.div>
                  
                  <div>
                    <h2 className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                      {currentLevel.name}
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Niveau {currentLevel.id} • {totalOutings} sortie{totalOutings > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                {nextLevel !== currentLevel && (
                  <Badge className="bg-gradient-to-r from-[#f1c232] to-[#c08a15] text-white px-4 py-2 text-sm font-bold border-0">
                    {nextLevel.minOutings - totalOutings} sortie{(nextLevel.minOutings - totalOutings) > 1 ? 's' : ''} pour {nextLevel.name}
                  </Badge>
                )}
              </div>
              
              {/* Progress bar */}
              {nextLevel !== currentLevel && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    <span>{currentLevel.name}</span>
                    <span>{nextLevel.name}</span>
                  </div>
                  <div className="relative h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#f1c232] to-[#c08a15] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToNextLevel}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1 text-center">
                    {Math.round(progressToNextLevel)}% complété
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Badges Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
            🏆 Badges débloqués ({unlockedBadges.length}/{BADGES.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {BADGES.map((badge, index) => {
              const unlocked = unlockedBadges.find(b => b.id === badge.id);
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={cn(
                      "p-4 text-center transition-all hover:scale-105 cursor-pointer",
                      unlocked 
                        ? "bg-gradient-to-br from-white to-[#fffbe8] border-[#f1c232]/30 shadow-medium" 
                        : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 opacity-40 grayscale"
                    )}
                  >
                    <div className="text-4xl mb-2">{badge.label.split(' ')[0]}</div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 mb-1">
                      {badge.label.split(' ').slice(1).join(' ')}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {badge.description}
                    </p>
                    {unlocked && (
                      <Badge variant="outline" className="mt-2 text-xs bg-[#f1c232]/10 border-[#f1c232]/30">
                        Débloqué ✅
                      </Badge>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-[#f1c232]/20 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <Avatar className="h-16 w-16 ring-2 ring-[#f1c232]/30">
                    <AvatarFallback className="bg-gradient-to-br from-[#f1c232] to-[#c08a15] text-white text-xl font-bold">
                      {getInitials(`${displayFirstName} ${displayLastName}`)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-base text-gray-800 dark:text-gray-200 font-semibold">
                  {displayFirstName || displayLastName ? `${displayFirstName} ${displayLastName}` : 'Utilisateur Random'}
                </CardTitle>
                <CardDescription className="flex items-center justify-center space-x-2 text-xs">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{user?.email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3 border border-brand-200 dark:border-brand-700 transition-all hover:scale-102 hover:shadow-soft">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-brand-600 dark:text-brand-400 animate-pulse" />
                    <span className="text-sm font-heading font-semibold text-brand-800 dark:text-brand-300">{t('profile.adventures')}</span>
                  </div>
                  <span className="text-brand-700 dark:text-brand-400 font-bold text-lg">{totalOutings}</span>
                </div>
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-700 transition-all hover:scale-102 hover:shadow-soft">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-heading font-semibold text-green-800 dark:text-green-300">{t('profile.average_group')}</span>
                  </div>
                  <span className="text-green-700 dark:text-green-400 font-bold text-lg">{averageGroupSize || '-'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Credits Balance */}
            <CreditsBalance />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Personal Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-[#f1c232]/20 shadow-lg">
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
                    className="border-[#f1c232]/30 text-[#825c16] hover:bg-[#fffbe8]/50 py-1 px-3 min-h-0 h-8 text-xs"
                  >
                    {isUpdating ? t('profile.saving') : isEditing ? t('profile.save') : t('profile.edit')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="text-xs font-heading font-semibold">{t('profile.first_name')}</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditing || isUpdating}
                      className={cn(
                        "text-sm transition-all",
                        isEditing ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-600 ring-2 ring-brand-200 dark:ring-brand-700' : 'bg-white/50 dark:bg-neutral-800/50'
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-xs font-heading font-semibold">{t('profile.last_name')}</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing || isUpdating}
                      className={cn(
                        "text-sm transition-all",
                        isEditing ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-600 ring-2 ring-brand-200 dark:ring-brand-700' : 'bg-white/50 dark:bg-neutral-800/50'
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="bg-white/80 backdrop-blur-sm border-[#f1c232]/20 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-1 text-base">
                  <Settings className="h-4 w-4" />
                  <span>{t('profile.account_settings')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-700">
                  <div className="flex-1">
                    <h4 className="font-heading font-semibold text-red-800 dark:text-red-300 text-sm">{t('profile.logout')}</h4>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {t('profile.logout_desc')}
                    </p>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="py-1 px-3 h-8 text-xs border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400 dark:hover:border-red-500 ml-3"
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

export default ProfilePageV2;

