/**
 * NOTIFICATION COPIES - RANDOM TONE OF VOICE
 * 
 * 🎯 Guidelines Random (CRM_STRATEGY.md + EMAIL_COPYWRITING_GUIDE.md):
 * - Tutoiement TOUJOURS (jamais "vous")
 * - Phrases courtes (< 20 mots)
 * - Slang léger Gen Z: "check", "GG", "RN", "genre", "grave"
 * - 2-3 émojis max, stratégiques
 * - Ton fun, encourageant, jamais corporate
 * - Authentique et pas culpabilisant
 */

export const NOTIFICATION_COPIES = {
  // ========== GROUP FORMATION ==========
  GROUP_FORMING: {
    last_spot: {
      title: '🔥 Dernière place disponible !',
      body: 'Ton groupe attend juste toi pour partir — fonce ! ⚡',
    },
    two_spots: {
      title: '🔥 Plus que 2 places !',
      body: 'Ça se remplit grave, rejoins avant qu\'il soit trop tard 👀',
    },
    filling_up: {
      title: '🔥 Ça se remplit !',
      body: 'Plus que {{remaining}} places pour ton groupe 🎲',
    },
  },

  // ========== GROUP CONFIRMED ==========
  GROUP_CONFIRMED: {
    default: {
      title: '🎉 C\'est parti ! Groupe confirmé',
      body: 'RDV au {{bar_name}} {{time}} — On se voit là-bas 🍹✨',
    },
    peak_hour: {
      title: '🔥 Let\'s go ! Ton groupe est prêt',
      body: 'Direction {{bar_name}} {{time}} — Ça va être ouf 🎉',
    },
    first_confirmed: {
      title: '🎊 Ton premier groupe est confirmé !',
      body: '{{bar_name}} t\'attend {{time}} — Let\'s go ! 🍹',
    },
  },

  // ========== WAITING REMINDER ==========
  WAITING_REMINDER: {
    default: {
      title: '⏰ Ton groupe se cherche encore',
      body: '{{count}}/5 — Ça peut aller super vite, check ton app 👀',
    },
    patient: {
      title: '⏰ Encore un peu de patience',
      body: 'On cherche les dernières personnes — RDV bientôt 🎲',
    },
  },

  // ========== TIMEOUT WARNING ==========
  TIMEOUT_WARNING: {
    urgent: {
      title: '⚠️ Plus que {{minutes}} min !',
      body: 'Ton groupe expire bientôt — partage-le pour le sauver 🚀',
    },
    last_chance: {
      title: '⚠️ Dernière chance !',
      body: 'Plus que {{minutes}} minutes avant expiration — fais passer 📣',
    },
  },

  // ========== LIFECYCLE NOTIFICATIONS ==========
  
  // Welcome Fun (J0 après inscription)
  WELCOME_FUN: {
    default: {
      title: 'Bienvenue dans la Random fam ! 🎲✨',
      body: 'Salut {{first_name}}, t\'es prêt·e pour ta première aventure ? Crée ton groupe en 30 secondes 🚀',
    },
  },

  // First Win Celebration (après 1ère sortie)
  FIRST_WIN: {
    celebration: {
      title: '🎊 GG ! T\'as déblocqué : Aventurier·e',
      body: 'Ta première sortie au {{bar_name}} était ouf ? Partage ton expérience pour gagner des crédits ! 🌟',
    },
    simple: {
      title: '🎉 Première sortie validée !',
      body: 'GG {{first_name}} ! Crée un nouveau groupe quand tu veux — c\'est parti 🔥',
    },
  },

  // Streak Builder (après 2-3 sorties)
  STREAK_BUILDER: {
    two_outings: {
      title: '🔥 T\'es lancé·e !',
      body: '{{count}} sorties — Continue comme ça pour débloquer des récompenses 🎁',
    },
    three_outings: {
      title: '🔥 Streak de {{count}} sorties !',
      body: 'T\'es en feu ! Prochaine sortie = badges exclusifs 🏆',
    },
  },

  // Peak Hours FOMO (Jeudi-Samedi 18h-20h)
  PEAK_HOURS_FOMO: {
    active_groups: {
      title: '🔥 {{active_count}} groupes actifs RN !',
      body: 'Yo {{first_name}}, c\'est le moment parfait pour sortir — crée ton groupe 🍹',
    },
    hot_spot: {
      title: '🔥 Ça bouge grave ce soir !',
      body: 'Plein de monde sort RN — rejoins l\'aventure avant qu\'il soit trop tard 🎉',
    },
  },

  // Comeback Cool (J14 inactif)
  COMEBACK_COOL: {
    new_spots: {
      title: 'Yo {{first_name}}, ça fait un bail ! 👋',
      body: 'Des nouveaux spots ont drop pendant ton absence. Viens checker si ça te dit 🍻',
    },
    miss_you: {
      title: 'On t\'a pas vu depuis 2 semaines 👀',
      body: 'T\'es dispo ce weekend ? Crée un groupe, on s\'occupe du reste 🎲',
    },
  },

  // Referral Unlock (5+ sorties)
  REFERRAL_UNLOCK: {
    ambassador: {
      title: '🎁 T\'as déblocqué : Ambassadeur·ice !',
      body: 'Invite 3 potes = 5 crédits gratuits 🔥 Partage Random avec ta squad',
    },
    vip: {
      title: '⭐ Statut VIP débloqué !',
      body: '{{count}} sorties — T\'es un·e vrai·e ! Parraine tes potes pour des récompenses 🎁',
    },
  },

  // Abandoned Group Recovery (utilisateur a quitté un groupe)
  ABANDONED_GROUP: {
    reminder: {
      title: 'T\'as oublié ton groupe ? 🤔',
      body: 'Ton groupe est encore actif — reviens vite avant qu\'il parte sans toi 🏃',
    },
  },

  // Group Full Soon (4/5 participants)
  GROUP_FULL_SOON: {
    almost_there: {
      title: '🎯 Presque complet !',
      body: 'Plus qu\'1 personne pour que ton groupe parte — patience 🙏',
    },
  },

  // Bar Rating Reminder (après sortie)
  BAR_RATING: {
    feedback: {
      title: 'Comment c\'était le {{bar_name}} ? ⭐',
      body: 'Aide la communauté : note le bar en 10 secondes 🙏',
    },
  },

  // Payment Required (si PPU activé)
  PAYMENT_REQUIRED: {
    urgent: {
      title: '💳 Valide ton paiement',
      body: 'Ton groupe est prêt mais ton paiement est en attente — finis en 2 clics 🚀',
    },
  },

  // New Bar Added (si bar sub)
  NEW_BAR_NEARBY: {
    discovery: {
      title: '🆕 Nouveau bar près de toi !',
      body: '{{bar_name}} vient de rejoindre Random — viens le découvrir 🍹',
    },
  },

  // Special Events
  SPECIAL_EVENT: {
    announcement: {
      title: '🎉 {{event_title}}',
      body: '{{event_description}} — Check l\'app pour plus d\'infos 🔥',
    },
  },

  // Reminder Before Meeting (30 min avant)
  MEETING_REMINDER: {
    soon: {
      title: '🕐 Ton groupe c\'est dans 30 min !',
      body: 'RDV au {{bar_name}} — Prépare-toi, ça va être cool 🎉',
    },
    now: {
      title: '🔔 C\'est maintenant !',
      body: 'Ton groupe t\'attend au {{bar_name}} — let\'s go ! 🚀',
    },
  },
};

/**
 * Helper to replace placeholders in notification copies
 */
export const formatNotificationCopy = (
  copy: { title: string; body: string },
  variables: Record<string, string | number>
): { title: string; body: string } => {
  let title = copy.title;
  let body = copy.body;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    title = title.replace(new RegExp(placeholder, 'g'), String(value));
    body = body.replace(new RegExp(placeholder, 'g'), String(value));
  });

  return { title, body };
};
