import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Settings, Crown, Calendar, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';
import { useBarOwner } from '@/hooks/useBarOwner';
import { useProfileUpdate } from '@/hooks/useProfileUpdate';
import { useProfile } from '@/hooks/useProfile';
import { EmailPreferencesSection } from '@/components/profile/EmailPreferencesSection';
import { DangerZoneSection } from '@/components/profile/DangerZoneSection';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const BarOwnerProfile = () => {
  const { user, signOut } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const { barOwner, subscription, analytics, isApproved, isTrialActive, isSubscriptionActive } = useBarOwner();
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
    if (!name) return 'B';
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

  const getStatusBadge = () => {
    if (!barOwner) return null;
    
    switch (barOwner.status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 text-xs">Approuvé</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs">En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs">Rejeté</Badge>;
      case 'suspended':
        return <Badge variant="destructive" className="text-xs">Suspendu</Badge>;
      default:
        return null;
    }
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return 'Aucun abonnement';
    
    if (isTrialActive) {
      const trialEnd = subscription.trial_end_date ? new Date(subscription.trial_end_date) : null;
      return `Période d'essai${trialEnd ? ` (expire le ${format(trialEnd, 'dd/MM/yyyy', { locale: fr })})` : ''}`;
    }
    
    if (isSubscriptionActive) {
      return 'Abonnement actif';
    }
    
    return subscription.status === 'past_due' ? 'Paiement en retard' : 'Abonnement inactif';
  };

  const displayFirstName = firstName || profile?.first_name || '';
  const displayLastName = lastName || profile?.last_name || '';

  // Latest analytics data
  const latestAnalytics = analytics?.[0];

  return (
    <div className="space-y-5">
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
              <CardTitle className="text-base text-foreground font-semibold">
                {displayFirstName || displayLastName ? `${displayFirstName} ${displayLastName}` : 'Propriétaire de Bar'}
              </CardTitle>
              <CardDescription className="flex items-center justify-center space-x-2 text-xs">
                <Mail className="h-3.5 w-3.5" />
                <span>{user?.email}</span>
              </CardDescription>
              <div className="flex flex-col items-center space-y-2 mt-2">
                <div className="flex items-center space-x-1 text-xs text-amber-700 bg-amber-50 rounded-full px-3 py-1">
                  <Crown className="h-3 w-3" />
                  <span>Propriétaire de Bar</span>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {barOwner && (
                <>
                  <div className="bg-amber-50 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <Building2 className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-800">Établissement</span>
                    </div>
                    <p className="text-sm font-semibold text-amber-900">{barOwner.bar_name}</p>
                    <p className="text-xs text-amber-700">{barOwner.bar_address}</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-2.5">
                    <div className="flex items-center space-x-1.5 mb-1">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-800">Abonnement</span>
                    </div>
                    <p className="text-xs text-green-700">{getSubscriptionStatus()}</p>
                  </div>

                  {latestAnalytics && (
                    <div className="bg-blue-50 rounded-lg p-2.5">
                      <div className="flex items-center space-x-1.5 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800">Ce mois-ci</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-blue-600" />
                          <span className="text-blue-700">{latestAnalytics.total_customers} clients</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3 text-blue-600" />
                          <span className="text-blue-700">{(latestAnalytics.estimated_revenue_eur / 100).toFixed(0)}€</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/50">
                    <Button 
                      asChild
                      variant="outline" 
                      className="w-full text-xs bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0"
                    >
                      <Link to="/bar-dashboard">
                        <BarChart3 className="h-3 w-3 mr-1.5" />
                        Tableau de Bord Bar
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
          {/* Bar Information */}
          {barOwner && (
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-1 text-base">
                  <Building2 className="h-4 w-4" />
                  <span>Informations de l'établissement</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Détails de votre établissement partenaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nom de l'entreprise</Label>
                    <div className="p-2 bg-muted rounded text-sm">{barOwner.business_name}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nom du bar</Label>
                    <div className="p-2 bg-muted rounded text-sm">{barOwner.bar_name}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Adresse</Label>
                  <div className="p-2 bg-muted rounded text-sm">{barOwner.bar_address}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Email de contact</Label>
                    <div className="p-2 bg-muted rounded text-sm">{barOwner.contact_email}</div>
                  </div>
                  {barOwner.contact_phone && (
                    <div className="space-y-1">
                      <Label className="text-xs">Téléphone</Label>
                      <div className="p-2 bg-muted rounded text-sm">{barOwner.contact_phone}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-lg">
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
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 py-1 px-3 min-h-0 h-8 text-xs"
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
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200/50 shadow-lg">
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
        </div>
      </div>
    </div>
  );
};