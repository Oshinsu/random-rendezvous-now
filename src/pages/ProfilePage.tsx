import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useBarOwner } from '@/hooks/useBarOwner';
import { UserProfile } from '@/components/profile/UserProfile';
import { BarOwnerProfile } from '@/components/profile/BarOwnerProfile';
import { AdminProfile } from '@/components/profile/AdminProfile';

const ProfilePage = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const { barOwner, isLoadingProfile: barLoading } = useBarOwner();
  const { t } = useTranslation();

  // Show loading state
  if (adminLoading || barLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-2 py-6 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  // Determine user type and render appropriate profile
  const renderProfileContent = () => {
    if (isAdmin) {
      return <AdminProfile />;
    }
    
    if (barOwner) {
      return <BarOwnerProfile />;
    }
    
    return <UserProfile />;
  };

  const getProfileTitle = () => {
    if (isAdmin) return "Profil Administrateur • Random";
    if (barOwner) return "Profil Bar Owner • Random";
    return "Profil • Random";
  };

  const getProfileSubtitle = () => {
    if (isAdmin) return "Panel d'administration et gestion du système";
    if (barOwner) return "Gestion de votre établissement partenaire";
    return "Historique et paramètres de votre compte";
  };

  return (
    <AppLayout>
      <Helmet>
        <title>{getProfileTitle()}</title>
        <meta name="description" content={getProfileSubtitle()} />
        <link rel="canonical" href={`${window.location.origin}/profile`} />
        <meta property="og:title" content={getProfileTitle()} />
        <meta property="og:description" content={getProfileSubtitle()} />
        <meta property="og:type" content="profile" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          "name": user?.email || 'Utilisateur Random'
        })}</script>
      </Helmet>
      <div className="container mx-auto px-2 py-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            {isAdmin ? 'Administration' : barOwner ? 'Profil Bar Owner' : t('profile.title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {getProfileSubtitle()}
          </p>
        </div>

        {renderProfileContent()}
      </div>
    </AppLayout>
  );
};

export default ProfilePage;