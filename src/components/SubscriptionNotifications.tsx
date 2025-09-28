import { useEffect } from 'react';
import { useBarSubscription } from '@/hooks/useBarSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Crown, AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';

export const SubscriptionNotifications = () => {
  const { user } = useAuth();
  const { subscriptionStatus, isLoadingSubscription } = useBarSubscription();

  useEffect(() => {
    if (!user || isLoadingSubscription) return;

    // Vérifier si c'est une nouvelle session (éviter les notifications répétées)
    const sessionKey = `subscription_notified_${user.id}`;
    const lastNotified = localStorage.getItem(sessionKey);
    const now = Date.now();
    
    // Ne notifier qu'une fois par heure max
    if (lastNotified && (now - parseInt(lastNotified)) < 3600000) {
      return;
    }

    if (subscriptionStatus) {
      const { subscribed, subscription_end } = subscriptionStatus;

      if (subscribed && subscription_end) {
        const endDate = new Date(subscription_end);
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now) / (1000 * 60 * 60 * 24));

        // Notification d'expiration proche (7 jours avant)
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          toast.warning("Abonnement bientôt expiré", {
            description: `Votre abonnement Bar Manager expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}. Renouvelez-le pour continuer à bénéficier de tous les avantages.`,
            icon: <AlertTriangle className="h-4 w-4" />,
            duration: 10000,
            action: {
              label: "Gérer",
              onClick: () => window.location.href = '/subscription'
            }
          });
        }
        
        // Notification d'expiration (le jour J)
        else if (daysUntilExpiry === 0) {
          toast.error("Abonnement expiré", {
            description: "Votre abonnement Bar Manager a expiré aujourd'hui. Renouvelez-le pour continuer à profiter de tous les avantages.",
            icon: <CreditCard className="h-4 w-4" />,
            duration: 15000,
            action: {
              label: "Renouveler",
              onClick: () => window.location.href = '/subscription'
            }
          });
        }
        
        // Notification d'abonnement actif (pour nouveaux utilisateurs)
        else if (daysUntilExpiry > 7) {
          const isFirstTime = !localStorage.getItem(`welcomed_subscriber_${user.id}`);
          if (isFirstTime) {
            toast.success("Abonnement actif !", {
              description: "Votre abonnement Bar Manager Premium est actif. Profitez de tous les avantages pour développer votre établissement.",
              icon: <Crown className="h-4 w-4" />,
              duration: 8000,
              action: {
                label: "Dashboard",
                onClick: () => window.location.href = '/bar-dashboard'
              }
            });
            localStorage.setItem(`welcomed_subscriber_${user.id}`, 'true');
          }
        }
      } else {
        // Utilisateur non abonné - suggestion occasionnelle (1 fois par semaine)
        const suggestionKey = `subscription_suggested_${user.id}`;
        const lastSuggested = localStorage.getItem(suggestionKey);
        
        if (!lastSuggested || (now - parseInt(lastSuggested)) > 604800000) { // 7 jours
          // Vérifier s'il y a une activité récente (groupes créés/rejoints)
          // Pour l'instant, on suggère juste aux utilisateurs actifs
          toast.info("Découvrez Bar Manager Premium", {
            description: "Propriétaire d'un bar ? Attirez plus de clients avec notre abonnement Bar Manager Premium !",
            icon: <Crown className="h-4 w-4" />,
            duration: 8000,
            action: {
              label: "En savoir plus",
              onClick: () => window.location.href = '/subscription'
            }
          });
          localStorage.setItem(suggestionKey, now.toString());
        }
      }

      // Marquer comme notifié pour cette session
      localStorage.setItem(sessionKey, now.toString());
    }
  }, [user, subscriptionStatus, isLoadingSubscription]);

  return null; // Ce composant ne rend rien visuellement
};

export default SubscriptionNotifications;