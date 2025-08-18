import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  fr: {
    common: {
      // Navigation
      dashboard: "Tableau de bord",
      groups: "Groupes",
      scheduledGroups: "Groupes programmés",
      profile: "Profil",
      homepage: "Accueil",
      logout: "Déconnexion",
      
      // Actions
      signIn: "Se connecter",
      signUp: "S'inscrire",
      signOut: "Se déconnecter",
      goToDashboard: "Aller au tableau de bord",
      
      // Common words
      loading: "Chargement...",
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      back: "Retour",
      
      // Random app specific
      appName: "Random",
      tagline: "Osez l'imprévu",
      
      // Footer
      allRightsReserved: "Tous droits réservés. Osez l'imprévu.",
      madeWith: "Conçu avec audace à Coruscant pour les aventuriers du quotidien.",
      termsOfService: "Conditions d'utilisation",
      privacyPolicy: "Politique de confidentialité",
      contact: "Contact"
    },
    hero: {
      title: "Découvrez l'inattendu",
      subtitle: "Rejoignez des groupes spontanés et créez des souvenirs inoubliables",
      cta: "Commencer l'aventure",
      trustedBy: "Adopté par plus de 1000+ aventuriers urbains"
    },
    howItWorks: {
      title: "Comment ça marche ?",
      step1Title: "Créez votre profil",
      step1Description: "Configurez vos préférences et définissez vos centres d'intérêt",
      step2Title: "Rejoignez un groupe",
      step2Description: "Découvrez des groupes près de chez vous et connectez-vous",
      step3Title: "Vivez l'aventure",
      step3Description: "Participez à des activités spontanées et rencontrez de nouvelles personnes"
    },
    whyRandom: {
      title: "Pourquoi choisir Random ?",
      spontaneousTitle: "Spontané",
      spontaneousDescription: "Brisez la routine avec des rencontres impromptues",
      authenticTitle: "Authentique", 
      authenticDescription: "Rencontrez de vraies personnes dans la vraie vie",
      secureTitle: "Sécurisé",
      secureDescription: "Vos données sont protégées et votre sécurité est notre priorité",
      localTitle: "Local",
      localDescription: "Découvrez votre ville sous un nouveau jour"
    },
    noMore: {
      title: "Fini les soirées ennuyeuses",
      subtitle: "Transformez votre quotidien en aventure avec Random",
      feature1: "Rencontres spontanées",
      feature2: "Activités variées", 
      feature3: "Communauté bienveillante",
      feature4: "Découvertes locales"
    },
    faq: {
      title: "Questions fréquentes",
      q1: "Comment fonctionne Random ?",
      a1: "Random vous connecte avec des personnes près de chez vous pour des activités spontanées. Créez simplement votre profil et rejoignez des groupes qui vous intéressent.",
      q2: "L'application est-elle gratuite ?",
      a2: "Oui, Random est entièrement gratuite à utiliser. Vous pouvez créer votre profil, rejoindre des groupes et participer aux activités sans aucun coût.",
      q3: "Comment ma sécurité est-elle assurée ?",
      a3: "Nous prenons la sécurité très au sérieux. Tous les profils sont vérifiés et nous avons mis en place des systèmes de signalement et de modération.",
      q4: "Puis-je choisir mes activités ?",
      a4: "Absolument ! Vous pouvez filtrer les groupes selon vos centres d'intérêt et choisir les activités qui vous attirent le plus."
    },
    cta: {
      title: "Prêt pour l'aventure ?",
      subtitle: "Rejoignez Random dès aujourd'hui et transformez votre quotidien",
      button: "Commencer maintenant"
    }
  },
  en: {
    common: {
      // Navigation
      dashboard: "Dashboard",
      groups: "Groups", 
      scheduledGroups: "Scheduled Groups",
      profile: "Profile",
      homepage: "Homepage",
      logout: "Logout",
      
      // Actions
      signIn: "Sign in",
      signUp: "Sign up", 
      signOut: "Sign out",
      goToDashboard: "Go to Dashboard",
      
      // Common words
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel", 
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      
      // Random app specific
      appName: "Random",
      tagline: "Dare the unexpected",
      
      // Footer
      allRightsReserved: "All rights reserved. Dare the unexpected.",
      madeWith: "Boldly crafted on Coruscant for everyday adventurers.",
      termsOfService: "Terms of Service",
      privacyPolicy: "Privacy Policy", 
      contact: "Contact"
    },
    hero: {
      title: "Discover the unexpected",
      subtitle: "Join spontaneous groups and create unforgettable memories",
      cta: "Start the adventure",
      trustedBy: "Trusted by 1000+ urban adventurers"
    },
    howItWorks: {
      title: "How it works?",
      step1Title: "Create your profile",
      step1Description: "Set up your preferences and define your interests",
      step2Title: "Join a group", 
      step2Description: "Discover groups near you and connect",
      step3Title: "Live the adventure",
      step3Description: "Participate in spontaneous activities and meet new people"
    },
    whyRandom: {
      title: "Why choose Random?",
      spontaneousTitle: "Spontaneous",
      spontaneousDescription: "Break the routine with impromptu encounters",
      authenticTitle: "Authentic",
      authenticDescription: "Meet real people in real life", 
      secureTitle: "Secure",
      secureDescription: "Your data is protected and your safety is our priority",
      localTitle: "Local",
      localDescription: "Discover your city in a new light"
    },
    noMore: {
      title: "No more boring evenings",
      subtitle: "Transform your daily life into an adventure with Random",
      feature1: "Spontaneous encounters",
      feature2: "Varied activities",
      feature3: "Caring community", 
      feature4: "Local discoveries"
    },
    faq: {
      title: "Frequently asked questions",
      q1: "How does Random work?",
      a1: "Random connects you with people near you for spontaneous activities. Simply create your profile and join groups that interest you.",
      q2: "Is the app free?",
      a2: "Yes, Random is completely free to use. You can create your profile, join groups and participate in activities at no cost.",
      q3: "How is my safety ensured?",
      a3: "We take safety very seriously. All profiles are verified and we have reporting and moderation systems in place.",
      q4: "Can I choose my activities?",
      a4: "Absolutely! You can filter groups by your interests and choose the activities that appeal to you most."
    },
    cta: {
      title: "Ready for adventure?",
      subtitle: "Join Random today and transform your daily life",
      button: "Start now"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    lng: 'fr', // Default language
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;