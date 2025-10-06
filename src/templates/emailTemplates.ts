export const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Bienvenue sur Random, {{first_name}} ! 🎉',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur Random</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px;">🎲 Random</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">
                                Bienvenue {{first_name}} ! 👋
                            </h2>
                            <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                                Merci d'avoir rejoint <strong>Random</strong>, l'application qui transforme tes soirées en aventures imprévisibles !
                            </p>
                            <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                                Voici comment ça marche :
                            </p>
                            
                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                                <p style="margin: 0 0 10px; color: #333; font-weight: bold;">1️⃣ Créé ou rejoins un groupe</p>
                                <p style="margin: 0; color: #666; font-size: 14px;">Connecte-toi avec 4 autres personnes près de toi</p>
                            </div>
                            
                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                                <p style="margin: 0 0 10px; color: #333; font-weight: bold;">2️⃣ Un bar est automatiquement assigné</p>
                                <p style="margin: 0; color: #666; font-size: 14px;">Notre algorithme choisit le meilleur endroit pour votre groupe</p>
                            </div>
                            
                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
                                <p style="margin: 0 0 10px; color: #333; font-weight: bold;">3️⃣ Profite de ta soirée !</p>
                                <p style="margin: 0; color: #666; font-size: 14px;">Rencontre de nouvelles personnes dans un lieu sympa</p>
                            </div>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                        <a href="https://randomapp.fr/dashboard" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                                            Créer mon premier groupe 🚀
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 10px; color: #999999; font-size: 12px;">
                                Random - Des soirées spontanées, des connexions authentiques
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 12px;">
                                <a href="{{unsubscribe_link}}" style="color: #667eea; text-decoration: none;">Se désabonner</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
  },
  
  firstOutingCongrats: {
    subject: 'Bravo pour ta première sortie Random ! 🎉',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px;">🎉 Félicitations !</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #333; font-size: 18px; font-weight: bold;">
                                Hey {{first_name}},
                            </p>
                            <p style="margin: 0 0 20px; color: #666; font-size: 16px; line-height: 1.6;">
                                Tu viens de terminer ta <strong>première sortie Random</strong> ! 🥳
                            </p>
                            <p style="margin: 0 0 30px; color: #666; font-size: 16px; line-height: 1.6;">
                                Comment s'est passée cette expérience ? On serait ravis d'avoir ton avis pour continuer à améliorer Random.
                            </p>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                                        <a href="https://randomapp.fr/feedback" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold;">
                                            Donner mon avis (2 min)
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0; color: #666; font-size: 14px; text-align: center;">
                                Prêt pour la prochaine aventure ? 🎲
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                <a href="{{unsubscribe_link}}" style="color: #667eea; text-decoration: none;">Se désabonner</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
  },

  inactiveReminder: {
    subject: 'On t\'a manqué {{first_name}} ! 😢',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Tu nous manques ! 💔</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #333; font-size: 18px;">
                                Salut {{first_name}},
                            </p>
                            <p style="margin: 0 0 20px; color: #666; font-size: 16px; line-height: 1.6;">
                                Ça fait un moment qu'on ne t'a pas vu sur Random... Tout va bien ? 🤔
                            </p>
                            <p style="margin: 0 0 30px; color: #666; font-size: 16px; line-height: 1.6;">
                                Tu as fait <strong>{{total_outings}} sorties</strong> avec nous. Pourquoi ne pas en organiser une autre ?
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 6px; margin-bottom: 30px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; text-align: center;">
                                    💡 <strong>Astuce</strong> : Les meilleurs moments pour sortir sont le jeudi soir et le vendredi !
                                </p>
                            </div>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                                        <a href="https://randomapp.fr/dashboard" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold;">
                                            Créer un nouveau groupe
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                <a href="{{unsubscribe_link}}" style="color: #667eea; text-decoration: none;">Se désabonner</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
  },

  churnAlert: {
    subject: 'Une dernière sortie avant de partir ? 🙏',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">On aimerait te revoir... 💔</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #333; font-size: 18px;">
                                {{first_name}},
                            </p>
                            <p style="margin: 0 0 20px; color: #666; font-size: 16px; line-height: 1.6;">
                                On a remarqué que tu n'es pas venu depuis un moment sur Random... 😔
                            </p>
                            <p style="margin: 0 0 20px; color: #666; font-size: 16px; line-height: 1.6;">
                                Est-ce qu'on peut faire quelque chose pour améliorer ton expérience ?
                            </p>
                            
                            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 30px;">
                                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                                    ⚠️ <strong>Dernière chance</strong> : Si tu ne réactives pas ton compte dans les 7 prochains jours, nous considérerons que tu ne souhaites plus utiliser Random.
                                </p>
                            </div>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 20px;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                                        <a href="https://randomapp.fr/dashboard" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold;">
                                            Revenir sur Random
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0; color: #666; font-size: 14px; text-align: center;">
                                Ou <a href="https://randomapp.fr/contact" style="color: #667eea;">partage-nous tes remarques</a>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                <a href="{{unsubscribe_link}}" style="color: #667eea; text-decoration: none;">Se désabonner</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
  },

  npsRequest: {
    subject: 'Ton avis sur Random nous intéresse ! ⭐',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Ton avis compte ! ⭐</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <p style="margin: 0 0 30px; color: #333; font-size: 18px;">
                                Salut {{first_name}},
                            </p>
                            <p style="margin: 0 0 30px; color: #666; font-size: 16px; line-height: 1.6;">
                                Sur une échelle de 0 à 10, recommanderais-tu Random à un ami ?
                            </p>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 30px;">
                                <tr>
                                    <td style="padding: 5px;">
                                        <a href="https://randomapp.fr/nps?score=0" style="display: inline-block; width: 40px; height: 40px; line-height: 40px; background-color: #fef2f2; color: #dc2626; text-decoration: none; font-weight: bold; border-radius: 6px;">0</a>
                                    </td>
                                    <td style="padding: 5px;">
                                        <a href="https://randomapp.fr/nps?score=5" style="display: inline-block; width: 40px; height: 40px; line-height: 40px; background-color: #fef3c7; color: #d97706; text-decoration: none; font-weight: bold; border-radius: 6px;">5</a>
                                    </td>
                                    <td style="padding: 5px;">
                                        <a href="https://randomapp.fr/nps?score=10" style="display: inline-block; width: 40px; height: 40px; line-height: 40px; background-color: #d1fae5; color: #059669; text-decoration: none; font-weight: bold; border-radius: 6px;">10</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                Ça ne prend que 30 secondes ⏱️
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                <a href="{{unsubscribe_link}}" style="color: #667eea; text-decoration: none;">Se désabonner</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
  },

  referralReward: {
    subject: '🎁 Ton filleul vient de faire sa première sortie !',
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px;">🎁 Récompense Débloquée !</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <p style="margin: 0 0 20px; color: #333; font-size: 18px; font-weight: bold;">
                                Bravo {{first_name}} !
                            </p>
                            <p style="margin: 0 0 30px; color: #666; font-size: 16px; line-height: 1.6;">
                                Ton filleul vient de terminer sa première sortie Random grâce à toi ! 🎉
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px;">
                                <p style="margin: 0 0 10px; color: #059669; font-size: 24px; font-weight: bold;">
                                    +1 Sortie Gratuite
                                </p>
                                <p style="margin: 0; color: #047857; font-size: 14px;">
                                    Valable pendant 30 jours
                                </p>
                            </div>
                            
                            <p style="margin: 0 0 30px; color: #666; font-size: 14px;">
                                Continue à partager ton code <strong>{{referral_code}}</strong> et gagne plus de récompenses !
                            </p>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                                        <a href="https://randomapp.fr/referral" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold;">
                                            Partager mon code
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                <a href="{{unsubscribe_link}}" style="color: #667eea; text-decoration: none;">Se désabonner</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
  }
};

export const replaceVariables = (template: string, variables: Record<string, string>) => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return result;
};
