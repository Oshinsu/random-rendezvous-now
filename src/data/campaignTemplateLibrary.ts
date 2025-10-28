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
    subject: 'Bienvenue sur Random - On est encore en phase de lancement',
    html_content: `
      <h2>Salut {{first_name}} ! 👋</h2>
      <p>Merci d'avoir rejoint Random. On est ravis de t'accueillir parmi nous.</p>
      
      <p><strong>Petit point important :</strong> On est encore en période de lancement, donc l'expérience n'est pas encore parfaite.</p>
      
      <p><strong>Pour maximiser tes chances de rencontrer du monde :</strong></p>
      <ul>
        <li>📍 On est actuellement disponible sur Paris uniquement</li>
        <li>🕐 Connecte-toi aux horaires de forte affluence : 18h-22h</li>
        <li>📅 Les meilleurs jours : Jeudi, Vendredi, Samedi</li>
      </ul>
      
      <p>On bosse dur pour améliorer l'expérience et élargir à d'autres villes bientôt !</p>
      
      <a href="https://random.app/groups" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Créer mon groupe</a>
      
      <p>À très vite ! 🍺</p>
    `,
    trigger_type: 'lifecycle',
    delay_hours: 1,
    tags: ['welcome', 'onboarding']
  },
  {
    id: 'new_tips',
    name: '💡 Conseils pour profiter de Random',
    segment_key: 'new_users',
    subject: 'Quelques astuces pour profiter au max de Random',
    html_content: `
      <h2>Hey {{first_name}} ! 💡</h2>
      <p>Tu as créé ton compte mais tu n'as peut-être pas encore trouvé de groupe ?</p>
      
      <p><strong>C'est normal, on est encore en phase de lancement.</strong></p>
      
      <p><strong>Nos meilleurs conseils :</strong></p>
      <ol>
        <li>🕐 Connecte-toi entre 18h et 22h (c'est là qu'il y a le plus de monde)</li>
        <li>📅 Privilégie le jeudi, vendredi ou samedi soir</li>
        <li>📍 Pour l'instant, Random marche uniquement sur Paris</li>
        <li>👥 Rejoins un groupe existant plutôt que d'en créer un nouveau</li>
        <li>🔔 Active les notifications pour être prévenu quand un groupe se forme</li>
      </ol>
      
      <p>On travaille activement pour élargir notre couverture et améliorer l'expérience !</p>
      
      <a href="https://random.app/groups">Voir les groupes actifs</a>
    `,
    trigger_type: 'lifecycle',
    delay_hours: 48,
    tags: ['onboarding', 'tips']
  },
  {
    id: 'new_reminder',
    name: '🔔 Rappel - Random est là pour toi',
    segment_key: 'new_users',
    subject: 'On est toujours là {{first_name}} !',
    html_content: `
      <h2>Salut {{first_name}},</h2>
      <p>On a remarqué que tu ne t'étais pas encore lancé sur Random.</p>
      
      <p>Désolé si l'expérience n'a pas été au rendez-vous jusqu'ici. On est encore en phase de lancement et on fait tout pour améliorer les choses.</p>
      
      <p><strong>Notre conseil :</strong></p>
      <ul>
        <li>Essaie de te connecter en soirée (18h-22h) jeudi, vendredi ou samedi</li>
        <li>C'est à ces moments qu'il y a le plus d'activité</li>
        <li>Random fonctionne actuellement uniquement sur Paris</li>
      </ul>
      
      <p>On espère te voir bientôt sur l'app ! 🍻</p>
      
      <a href="https://random.app/groups">Voir les groupes disponibles</a>
    `,
    trigger_type: 'lifecycle',
    delay_hours: 72,
    tags: ['reminder', 'engagement']
  },

  // CHURN RISK
  {
    id: 'churn_comeback',
    name: '💔 Désolé si l\'expérience n\'était pas top',
    segment_key: 'churn_risk',
    subject: 'Hey {{first_name}}, désolé si Random ne t\'a pas convaincu',
    html_content: `
      <h2>Salut {{first_name}},</h2>
      <p>On a remarqué que tu ne t'es pas reconnecté depuis un moment sur Random.</p>
      
      <p><strong>Désolé si ton expérience n'a pas été à la hauteur.</strong> On est encore en période de lancement et on sait que tout n'est pas parfait.</p>
      
      <p>On aimerait te redonner une chance ! Voici ce qu'on te propose :</p>
      <ul>
        <li>🕐 Essaie de te connecter aux horaires de forte affluence : 18h-22h</li>
        <li>📅 Privilégie le jeudi, vendredi ou samedi soir</li>
        <li>📍 Random marche actuellement sur Paris uniquement</li>
      </ul>
      
      <p>On bosse dur pour améliorer l'expérience chaque jour. Si tu veux retenter, on sera ravis de te revoir !</p>
      
      <a href="https://random.app/groups">Voir les groupes disponibles</a>
      
      <p>L'équipe Random 🍺</p>
    `,
    trigger_type: 'segment',
    tags: ['retention', 'win-back']
  },
  {
    id: 'churn_feedback',
    name: '💬 On t\'écoute',
    segment_key: 'churn_risk',
    subject: 'Aide-nous à améliorer Random',
    html_content: `
      <h2>{{first_name}}, ton avis compte 💭</h2>
      <p>On a vu que tu ne t'es pas reconnecté depuis un moment. On aimerait comprendre pourquoi.</p>
      
      <p><strong>Qu'est-ce qui n'a pas marché pour toi ?</strong></p>
      <ul>
        <li>Pas assez de monde aux heures où tu te connectes ?</li>
        <li>L'expérience n'était pas assez fluide ?</li>
        <li>Tu aurais aimé d'autres fonctionnalités ?</li>
      </ul>
      
      <p>Ton feedback nous aide vraiment à améliorer Random pour tout le monde.</p>
      
      <p><strong>PS :</strong> On est encore en période de lancement. Si tu veux retenter, connecte-toi en soirée (18h-22h) le jeudi, vendredi ou samedi. C'est là qu'il y a le plus de monde !</p>
      
      <a href="https://random.app/feedback">Partager mon avis (2 min)</a>
    `,
    trigger_type: 'segment',
    delay_hours: 168,
    tags: ['retention', 'feedback']
  },

  // ACTIVE USERS
  {
    id: 'active_thanks',
    name: '🙏 Merci pour ta fidélité',
    segment_key: 'active',
    subject: 'Merci {{first_name}}, tu es génial ! 🙏',
    html_content: `
      <h2>Un grand merci {{first_name}} ! 🎉</h2>
      <p>Tu fais partie des utilisateurs les plus actifs de Random et ça nous fait vraiment plaisir.</p>
      
      <p><strong>Grâce à toi et aux early adopters comme toi, Random grandit chaque jour !</strong></p>
      
      <p>On continue de bosser dur pour améliorer l'expérience :</p>
      <ul>
        <li>🌍 Extension à d'autres villes bientôt</li>
        <li>✨ Nouvelles fonctionnalités en préparation</li>
        <li>🎯 Amélioration du matching de bars</li>
      </ul>
      
      <p>Continue de profiter de Random et n'hésite pas à nous faire des retours pour qu'on s'améliore !</p>
      
      <a href="https://random.app/groups">Organiser ma prochaine sortie</a>
      
      <p>Merci encore 🍺<br>L'équipe Random</p>
    `,
    trigger_type: 'behavior',
    tags: ['engagement', 'thanks']
  },
  {
    id: 'active_new_feature',
    name: '✨ Nouvelles améliorations',
    segment_key: 'active',
    subject: 'On a amélioré Random grâce à tes retours !',
    html_content: `
      <h2>Des nouveautés sur Random {{first_name}} ! 🚀</h2>
      <p>Grâce aux retours des utilisateurs comme toi, on a pu améliorer pas mal de choses :</p>
      <ul>
        <li>✨ Meilleur matching de bars selon vos préférences</li>
        <li>⚡ Interface plus fluide et rapide</li>
        <li>📅 Possibilité de programmer des sorties à l'avance</li>
        <li>🔔 Notifications plus pertinentes</li>
      </ul>
      
      <p>Continue de nous faire des retours, ça nous aide vraiment à améliorer l'app !</p>
      
      <a href="https://random.app/groups">Essayer les nouveautés</a>
    `,
    trigger_type: 'manual',
    tags: ['feature', 'product']
  },

  // DORMANT USERS
  {
    id: 'dormant_reactivation',
    name: '😴 On a pensé à toi',
    segment_key: 'dormant',
    subject: 'Ça fait longtemps {{first_name}}... On a amélioré Random',
    html_content: `
      <h2>Hey {{first_name}},</h2>
      <p>Ça fait un moment qu'on ne t'a pas vu sur Random...</p>
      
      <p><strong>Désolé si ton expérience n'a pas été top la dernière fois.</strong> On est encore en phase de lancement et on travaille dur pour améliorer l'app chaque jour.</p>
      
      <p><strong>On a fait pas mal de progrès depuis :</strong></p>
      <ul>
        <li>✨ Meilleur matching de bars</li>
        <li>⚡ Interface plus fluide</li>
        <li>📅 Possibilité de programmer ses sorties</li>
        <li>👥 Plus d'utilisateurs actifs aux heures de pointe</li>
      </ul>
      
      <p><strong>Si tu veux retenter, voici nos conseils :</strong></p>
      <ul>
        <li>🕐 Connecte-toi entre 18h et 22h</li>
        <li>📅 Privilégie jeudi, vendredi ou samedi soir</li>
        <li>📍 Random fonctionne actuellement sur Paris</li>
      </ul>
      
      <a href="https://random.app/groups">Redonner une chance à Random</a>
      
      <p>On espère te revoir bientôt ! 🍺</p>
    `,
    trigger_type: 'segment',
    tags: ['reactivation', 'product']
  },

  // ZOMBIE USERS
  {
    id: 'zombie_last_chance',
    name: '💀 Dernière nouvelle',
    segment_key: 'zombie_users',
    subject: 'C\'est notre dernier message {{first_name}}',
    html_content: `
      <h2>Dernier message {{first_name}},</h2>
      <p>Ça fait plus de <strong>6 mois</strong> qu'on ne t'a pas vu sur Random.</p>
      
      <p>On comprend que l'app ne t'ait pas convaincu ou que le timing n'était pas bon.</p>
      
      <p><strong>Si tu veux nous redonner une chance, voici ce qui a changé :</strong></p>
      <ul>
        <li>✨ Random s'est énormément amélioré depuis ton dernier passage</li>
        <li>👥 Beaucoup plus d'utilisateurs actifs aux heures de pointe</li>
        <li>📍 Toujours sur Paris, mais on va bientôt s'étendre</li>
        <li>🕐 Meilleurs créneaux : 18h-22h, jeudi/vendredi/samedi</li>
      </ul>
      
      <p>Si Random ne t'intéresse plus, pas de problème. On supprimera ton compte dans 30 jours pour respecter ta vie privée.</p>
      
      <a href="https://random.app/groups">Redonner une chance à Random</a>
      
      <p><small>Pour te désinscrire : <a href="https://random.app/unsubscribe">Clique ici</a></small></p>
    `,
    trigger_type: 'segment',
    tags: ['reactivation', 'last-chance']
  },

  // OFF PEAK USERS
  {
    id: 'off_peak_advice',
    name: '🕐 Meilleurs horaires pour toi',
    segment_key: 'off_peak_users',
    subject: 'Astuce {{first_name}} : Connecte-toi aux heures de pointe !',
    html_content: `
      <h2>Hey {{first_name}} ! 🕐</h2>
      <p>On a remarqué que tu te connectes souvent sur Random, mais pas forcément aux meilleurs moments.</p>
      
      <p><strong>Le truc, c'est que Random fonctionne mieux aux heures de forte affluence.</strong></p>
      
      <p><strong>Pour trouver plus facilement un groupe :</strong></p>
      <ul>
        <li>🕐 Connecte-toi entre 18h et 22h</li>
        <li>📅 Privilégie le jeudi, vendredi ou samedi soir</li>
        <li>👥 C'est à ces moments qu'il y a le plus de monde</li>
      </ul>
      
      <p>On est encore en phase de lancement, donc on n'a pas encore assez d'utilisateurs pour couvrir tous les horaires. Mais ça va venir !</p>
      
      <p>Merci de ta patience 🙏</p>
      
      <a href="https://random.app/groups">Essayer maintenant</a>
    `,
    trigger_type: 'segment',
    tags: ['engagement', 'timing']
  }
];

export const getTemplatesBySegment = (segmentKey: string): CampaignTemplate[] => {
  return campaignTemplates.filter(t => t.segment_key === segmentKey);
};

export const getTemplateById = (id: string): CampaignTemplate | undefined => {
  return campaignTemplates.find(t => t.id === id);
};
