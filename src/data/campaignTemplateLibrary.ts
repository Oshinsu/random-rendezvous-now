export interface CampaignTemplate {
  id: string;
  name: string;
  segment_key: string;
  subject: string;
  html_content: string;
  trigger_type: 'manual' | 'lifecycle' | 'segment' | 'behavior';
  delay_hours?: number;
  is_recurring?: boolean;
  recurrence_pattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    day?: number;
    date?: number;
    hour?: number;
  };
  tags: string[];
}

export const campaignTemplates: CampaignTemplate[] = [
  // NEW USERS
  {
    id: 'new_welcome',
    name: '🎉 Bienvenue sur Random',
    segment_key: 'new_users',
    subject: 'Bienvenue chez Random ! Votre première sortie vous attend 🍻',
    html_content: `
      <h2>Bienvenue {{first_name}} !</h2>
      <p>Tu viens de rejoindre Random, l'app qui transforme tes soirées en aventures ! 🎉</p>
      <p><strong>Voici comment ça marche :</strong></p>
      <ul>
        <li>Crée ou rejoins un groupe</li>
        <li>On te trouve le bar parfait</li>
        <li>Rencontre de nouvelles personnes</li>
      </ul>
      <a href="https://random.app/groups" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Créer mon premier groupe</a>
      <p>À très vite ! 🍺</p>
    `,
    trigger_type: 'lifecycle',
    delay_hours: 1,
    tags: ['welcome', 'onboarding']
  },
  {
    id: 'new_tips',
    name: '💡 Tips pour ta première sortie',
    segment_key: 'new_users',
    subject: '5 astuces pour réussir ta première sortie Random',
    html_content: `
      <h2>Prêt pour l'aventure {{first_name}} ? 🚀</h2>
      <p><strong>5 tips pour une première sortie réussie :</strong></p>
      <ol>
        <li>Active tes notifications pour ne rien manquer</li>
        <li>Complète ton profil pour matcher avec des personnes intéressantes</li>
        <li>Choisis un créneau en soirée (18h-20h = plus de monde)</li>
        <li>Rejoins un groupe existant pour ton premier essai</li>
        <li>Sois ouvert et curieux, c'est l'esprit Random !</li>
      </ol>
      <a href="https://random.app/profile">Compléter mon profil</a>
    `,
    trigger_type: 'lifecycle',
    delay_hours: 48,
    tags: ['onboarding', 'tips']
  },
  {
    id: 'new_incentive',
    name: '🎁 Offre spéciale nouveau membre',
    segment_key: 'new_users',
    subject: '🎁 Cadeau : Ta première sortie à -50% !',
    html_content: `
      <h2>On t'offre ta première sortie {{first_name}} ! 🎁</h2>
      <p>Parce que tu viens de nous rejoindre, profite de <strong>50% de réduction</strong> sur ta première sortie Random.</p>
      <p>Code : <strong>BIENVENUE50</strong></p>
      <p>Valable 7 jours, ne rate pas cette occasion de découvrir Random !</p>
      <a href="https://random.app/groups/new" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Créer mon groupe</a>
    `,
    trigger_type: 'lifecycle',
    delay_hours: 72,
    tags: ['incentive', 'promotion']
  },

  // CHURN RISK
  {
    id: 'churn_comeback',
    name: '💔 On te manque ?',
    segment_key: 'churn_risk',
    subject: 'Ça fait longtemps {{first_name}}... On a gardé ta place 🍺',
    html_content: `
      <h2>Tu nous manques {{first_name}} ! 😢</h2>
      <p>Ça fait <strong>{{days_since_last_activity}} jours</strong> qu'on ne s'est pas vus...</p>
      <p>Tes amis Random se demandent ce que tu deviens. Pourquoi ne pas organiser une sortie cette semaine ?</p>
      <p><strong>Nouveau :</strong> On a ajouté {{new_bars_count}} bars près de chez toi !</p>
      <a href="https://random.app/groups">Voir les groupes disponibles</a>
    `,
    trigger_type: 'segment',
    tags: ['retention', 'win-back']
  },
  {
    id: 'churn_incentive',
    name: '🔥 Offre retour exclusive',
    segment_key: 'churn_risk',
    subject: 'On t\'offre ton retour : -30% sur ta prochaine sortie',
    html_content: `
      <h2>Reviens {{first_name}}, on a une surprise ! 🎁</h2>
      <p>Pour ton retour, profite de <strong>30% de réduction</strong> sur ta prochaine sortie.</p>
      <p>Code : <strong>RETOUR30</strong></p>
      <p>Valable jusqu'à dimanche. L'occasion parfaite pour retrouver l'esprit Random !</p>
      <a href="https://random.app/groups" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Je reviens !</a>
    `,
    trigger_type: 'segment',
    delay_hours: 168, // 7 days after churn detection
    tags: ['retention', 'incentive']
  },
  {
    id: 'churn_survey',
    name: '📊 Aide-nous à t\'améliorer',
    segment_key: 'churn_risk',
    subject: '2 min pour nous aider ? On t\'écoute {{first_name}}',
    html_content: `
      <h2>Ton avis compte {{first_name}} 💭</h2>
      <p>On a remarqué que tu n'utilises plus Random. Peux-tu nous dire pourquoi en 2 minutes ?</p>
      <p>Tes retours nous aident à améliorer l'expérience pour tout le monde.</p>
      <a href="https://random.app/feedback?utm_source=churn">Donner mon avis (2 min)</a>
      <p><em>En cadeau : 100 crédits offerts pour ton prochain groupe</em></p>
    `,
    trigger_type: 'segment',
    tags: ['feedback', 'retention']
  },

  // ACTIVE USERS
  {
    id: 'active_streak',
    name: '🔥 Série de sorties',
    segment_key: 'active',
    subject: '🔥 {{outing_count}} sorties ! Tu es un Random addict',
    html_content: `
      <h2>Incroyable {{first_name}} ! 🎉</h2>
      <p>Tu as fait <strong>{{outing_count}} sorties</strong> sur Random. Tu es dans le top 10% des utilisateurs les plus actifs !</p>
      <p><strong>Ton statut :</strong> Random Insider 🌟</p>
      <p>Continue comme ça et débloque des avantages exclusifs :</p>
      <ul>
        <li>✅ Priorité dans les groupes</li>
        <li>✅ Accès early aux nouveaux bars</li>
        <li>⏳ -20% permanent (3 sorties de plus)</li>
      </ul>
      <a href="https://random.app/groups">Organiser ma prochaine sortie</a>
    `,
    trigger_type: 'behavior',
    is_recurring: true,
    recurrence_pattern: {
      frequency: 'weekly',
      day: 5, // Friday
      hour: 16
    },
    tags: ['engagement', 'gamification']
  },
  {
    id: 'active_referral',
    name: '👥 Programme de parrainage',
    segment_key: 'active',
    subject: 'Invite tes amis et gagne 50€ de crédit Random',
    html_content: `
      <h2>Partage l'expérience Random {{first_name}} ! 👥</h2>
      <p>Tu adores Random ? Invite tes amis !</p>
      <p><strong>Comment ça marche :</strong></p>
      <ul>
        <li>Ton ami s'inscrit avec ton code : <strong>{{referral_code}}</strong></li>
        <li>Il fait sa première sortie</li>
        <li>Vous gagnez chacun <strong>25€ de crédit</strong> !</li>
      </ul>
      <p>Pas de limite, invite autant d'amis que tu veux.</p>
      <a href="https://random.app/referral" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Partager mon code</a>
    `,
    trigger_type: 'segment',
    tags: ['referral', 'growth']
  },
  {
    id: 'active_new_feature',
    name: '✨ Nouvelle fonctionnalité',
    segment_key: 'active',
    subject: '✨ Nouveau : Groupes programmés à l\'avance !',
    html_content: `
      <h2>Nouvelle fonctionnalité {{first_name}} ! 🚀</h2>
      <p>Tu peux maintenant <strong>programmer tes sorties à l'avance</strong> !</p>
      <p><strong>Pourquoi c'est génial :</strong></p>
      <ul>
        <li>Organise ta semaine facilement</li>
        <li>Réserve les meilleurs créneaux</li>
        <li>Reçois des rappels automatiques</li>
      </ul>
      <a href="https://random.app/scheduled-groups">Essayer maintenant</a>
    `,
    trigger_type: 'manual',
    tags: ['feature', 'product']
  },

  // DORMANT USERS
  {
    id: 'dormant_reactivation',
    name: '😴 Réveille-toi !',
    segment_key: 'dormant',
    subject: 'Random a changé {{first_name}}... Redécouvre l\'app',
    html_content: `
      <h2>Ça bouge sur Random ! 🎉</h2>
      <p>Depuis ta dernière sortie il y a <strong>{{weeks_inactive}} semaines</strong>, beaucoup de choses ont changé :</p>
      <ul>
        <li>🆕 {{new_bars_count}} nouveaux bars</li>
        <li>⚡ Groupes instantanés (trouve un bar en 2 min)</li>
        <li>📅 Programmation de sorties</li>
        <li>💬 Chat de groupe amélioré</li>
      </ul>
      <p><strong>Offre spéciale :</strong> -20% sur ton retour avec le code <strong>COMEBACK20</strong></p>
      <a href="https://random.app/groups">Découvrir les nouveautés</a>
    `,
    trigger_type: 'segment',
    tags: ['reactivation', 'product']
  },
  {
    id: 'dormant_event',
    name: '🎊 Événement spécial',
    segment_key: 'dormant',
    subject: '🎊 Soirée Random exclusive ce weekend !',
    html_content: `
      <h2>Événement spécial {{first_name}} ! 🎊</h2>
      <p>On organise une <strong>soirée Random géante</strong> ce samedi soir !</p>
      <p><strong>Au programme :</strong></p>
      <ul>
        <li>20+ groupes simultanés dans toute la ville</li>
        <li>After-party pour tous les participants</li>
        <li>Concours et cadeaux</li>
      </ul>
      <p>C'est l'occasion parfaite pour revenir et rencontrer la communauté !</p>
      <a href="https://random.app/events/saturday-special" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Je m'inscris</a>
    `,
    trigger_type: 'manual',
    tags: ['event', 'reactivation']
  },

  // ZOMBIE USERS
  {
    id: 'zombie_last_chance',
    name: '💀 Dernière chance',
    segment_key: 'zombie_users',
    subject: 'Dernière chance {{first_name}}... On supprime ton compte ?',
    html_content: `
      <h2>C'est notre dernier email {{first_name}} 💔</h2>
      <p>Ça fait <strong>plus de 6 mois</strong> qu'on ne s'est pas vus.</p>
      <p>Si tu ne reviens pas d'ici <strong>30 jours</strong>, on supprimera ton compte pour respecter ta vie privée.</p>
      <p><strong>Mais il est encore temps !</strong></p>
      <p>Si Random ne t'intéresse plus, pas de problème. Mais si tu veux nous redonner une chance, on te fait un <strong>cadeau de 50€ de crédit</strong> pour ton retour.</p>
      <a href="https://random.app/reactivate?code=LASTCHANCE50" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Réactiver mon compte</a>
      <p><small>Pour te désinscrire définitivement : <a href="https://random.app/unsubscribe">Cliquer ici</a></small></p>
    `,
    trigger_type: 'segment',
    tags: ['reactivation', 'last-chance']
  },

  // RECURRING CAMPAIGNS
  {
    id: 'weekly_digest',
    name: '📬 Digest hebdomadaire',
    segment_key: 'active',
    subject: '📬 Cette semaine sur Random : {{new_groups_count}} nouveaux groupes',
    html_content: `
      <h2>Ta semaine Random {{first_name}} 📊</h2>
      <p><strong>En bref :</strong></p>
      <ul>
        <li>{{new_groups_count}} nouveaux groupes près de chez toi</li>
        <li>{{new_bars_count}} bars ajoutés cette semaine</li>
        <li>Pic d'activité : {{peak_day}} soir</li>
      </ul>
      <p><strong>Recommandations pour toi :</strong></p>
      <ul>
        <li>🔥 Groupe jeudi 19h - Quartier Latin (4 places)</li>
        <li>🍸 Nouveau bar à tester : Le Perchoir Marais</li>
      </ul>
      <a href="https://random.app/groups">Voir tous les groupes</a>
    `,
    trigger_type: 'manual',
    is_recurring: true,
    recurrence_pattern: {
      frequency: 'weekly',
      day: 1, // Monday
      hour: 10
    },
    tags: ['newsletter', 'recurring']
  },
  {
    id: 'monthly_stats',
    name: '📊 Récap mensuel',
    segment_key: 'active',
    subject: '📊 Ton mois Random : {{outings_count}} sorties, {{bars_visited}} bars',
    html_content: `
      <h2>Ton mois de {{month}} sur Random 🎉</h2>
      <p>Voici ton recap {{first_name}} :</p>
      <ul>
        <li>🍺 <strong>{{outings_count}} sorties</strong></li>
        <li>🏪 <strong>{{bars_visited}} bars différents</strong></li>
        <li>👥 <strong>{{people_met}} nouvelles personnes</strong></li>
        <li>⭐ Note moyenne des bars : <strong>{{avg_rating}}/5</strong></li>
      </ul>
      <p>Tu es dans le <strong>top {{percentile}}%</strong> des utilisateurs les plus actifs !</p>
      <p>Objectif pour {{next_month}} : Découvrir {{goal_bars}} nouveaux bars ?</p>
      <a href="https://random.app/stats">Voir mes statistiques détaillées</a>
    `,
    trigger_type: 'manual',
    is_recurring: true,
    recurrence_pattern: {
      frequency: 'monthly',
      date: 1,
      hour: 12
    },
    tags: ['stats', 'recurring', 'engagement']
  }
];

export const getTemplatesBySegment = (segmentKey: string): CampaignTemplate[] => {
  return campaignTemplates.filter(t => t.segment_key === segmentKey);
};

export const getTemplateById = (id: string): CampaignTemplate | undefined => {
  return campaignTemplates.find(t => t.id === id);
};