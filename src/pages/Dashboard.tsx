import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedGroups } from '@/hooks/useUnifiedGroups';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EnhancedSearchButton } from '@/components/EnhancedSearchButton';
import RandomLogo from '@/components/RandomLogo';
import AppLayout from '@/components/AppLayout';

const Dashboard = () => {
  const { user, session, refreshSession } = useAuth();
  const { joinRandomGroup, loading, userGroups } = useUnifiedGroups();
  const { t } = useTranslation();
  const [isSearching, setIsSearching] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const navigate = useNavigate();
  const hasInitialized = useRef(false);

  const handleButtonClick = async () => {
    if (isSearching) {
      setIsSearching(false);
      setRedirectCountdown(0);
      console.log('🛑 Recherche annulée');
      return;
    }

    setIsSearching(true);
    console.log('🎲 Recherche démarrée - animation devrait commencer');
    try {
      const success = await joinRandomGroup();
      if (success) {
        console.log('✅ Groupe rejoint - démarrage du countdown de redirection');
        setRedirectCountdown(15);
      } else {
        console.log('❌ Échec de la recherche/création de groupe');
        setIsSearching(false);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      setIsSearching(false);
    }
  };

  // Effect pour gérer le countdown et la redirection automatique
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (redirectCountdown > 0) {
      interval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            console.log('🔄 Redirection automatique vers /groups');
            navigate('/groups');
            setIsSearching(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [redirectCountdown, navigate]);

  // Effect pour surveiller les groupes et déclencher le countdown
  useEffect(() => {
    // Groups status check

    if (userGroups.length > 0 && isSearching && redirectCountdown === 0) {
      console.log('🎯 Groupe détecté, démarrage du countdown');
      setRedirectCountdown(15);
    }
  }, [userGroups, isSearching, redirectCountdown]);
  return <AppLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-brand-50 dark:from-neutral-900 dark:to-neutral-800 p-4">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-8">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100">
              {redirectCountdown > 0 
                ? t('dashboard.group_found_title')
                : isSearching 
                ? t('dashboard.searching_title')
                : t('dashboard.ready_title')
              }
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              {redirectCountdown > 0 
                ? t('dashboard.redirect_desc', { count: redirectCountdown })
                : isSearching 
                ? t('dashboard.searching_desc')
                : t('dashboard.ready_desc')
              }
            </p>
          </div>

          <EnhancedSearchButton
            onSearch={handleButtonClick}
            isDisabled={loading}
            isSearching={isSearching}
          />

          {redirectCountdown > 0 && (
            <button 
              onClick={() => {
                console.log('🔄 Redirection manuelle vers /groups');
                navigate('/groups');
                setIsSearching(false);
                setRedirectCountdown(0);
              }}
              className="px-6 py-3 bg-gradient-to-br from-brand-400 to-brand-600 dark:from-brand-600 dark:to-brand-700 text-white rounded-xl 
                shadow-medium hover:shadow-glow transition-all duration-300 transform hover:scale-102 hover:-translate-y-0.5 
                focus:outline-none focus:ring-4 focus:ring-brand-500/30"
              aria-label={t('dashboard.view_group_now')}
            >
              {t('dashboard.view_group_now')}
            </button>
          )}
        </div>
      </div>
    </AppLayout>;
};
export default Dashboard;