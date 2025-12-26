import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface GroupReminderEmailProps {
  firstName: string;
  barName: string;
  barAddress: string;
  timeUntilMeeting: string; // "dans 2 heures"
  groupUrl: string;
  mapUrl?: string;
}

export const GroupReminderEmail = ({
  firstName = 'Voyageur',
  barName = 'Le Bar',
  barAddress = '123 Rue de Paris',
  timeUntilMeeting = 'dans 2 heures',
  groupUrl = 'https://random.app/groups',
  mapUrl,
}: GroupReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>⏰ Rappel : RDV {timeUntilMeeting} au {barName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://random.app/logo.png"
          width="64"
          height="64"
          alt="Random"
          style={logo}
        />
        <div style={badgeContainer}>
          <span style={badge}>⏰ C'est bientôt !</span>
        </div>
        <Heading style={h1}>RDV {timeUntilMeeting}, {firstName} !</Heading>
        <Text style={text}>
          Ton groupe t'attend au **{barName}** ! N'oublie pas :
        </Text>
        
        <Section style={infoBox}>
          <Text style={infoTitle}>📍 Lieu du rendez-vous</Text>
          <Text style={infoBarName}>{barName}</Text>
          <Text style={infoAddress}>{barAddress}</Text>
          {mapUrl && (
            <Button style={mapButton} href={mapUrl}>
              🗺️ Ouvrir dans Maps
            </Button>
          )}
        </Section>

        <Section style={tipsBox}>
          <Text style={tipsTitle}>💡 Derniers conseils</Text>
          <Text style={tipsList}>
            ✅ Vérifie que tu as bien l'adresse<br />
            ✅ Prévois 10 min d'avance (juste au cas où)<br />
            ✅ Rejoins le chat si besoin<br />
            ✅ Profite de la soirée ! 🎉
          </Text>
        </Section>

        <Section style={buttonContainer}>
          <Button
            style={button}
            href={groupUrl}
          >
            💬 Voir le groupe
          </Button>
        </Section>

        <Text style={footer}>
          On se voit tout à l'heure !<br />
          L'équipe Random
        </Text>

        <Text style={footerSmall}>
          Tu ne peux plus venir ? Préviens le groupe dans le chat 🙏
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#fffbe8',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '12px',
  maxWidth: '600px',
};

const logo = {
  margin: '0 auto 24px',
  display: 'block',
};

const badgeContainer = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const badge = {
  display: 'inline-block',
  background: 'linear-gradient(90deg, #f97316, #ea580c)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 16px',
  borderRadius: '20px',
  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
};

const h1 = {
  color: '#825c16',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const infoBox = {
  backgroundColor: '#ffffff',
  border: '2px solid rgba(241, 194, 50, 0.3)',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const infoTitle = {
  fontSize: '14px',
  color: '#a3a3a3',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const infoBarName = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#825c16',
  margin: '0 0 8px',
};

const infoAddress = {
  fontSize: '16px',
  color: '#737373',
  margin: '0 0 16px',
};

const mapButton = {
  background: '#ffffff',
  border: '2px solid rgba(241, 194, 50, 0.5)',
  borderRadius: '6px',
  color: '#f1c232',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  display: 'inline-block',
  padding: '10px 20px',
  marginTop: '8px',
};

const tipsBox = {
  backgroundColor: '#fff8e1',
  border: '1px solid rgba(241, 194, 50, 0.2)',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
};

const tipsTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#825c16',
  margin: '0 0 12px',
  textAlign: 'center' as const,
};

const tipsList = {
  fontSize: '14px',
  color: '#737373',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'left' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  background: 'linear-gradient(90deg, #f1c232, #c08a15)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  boxShadow: '0 4px 12px rgba(241, 194, 50, 0.3)',
};

const footer = {
  color: '#737373',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
  paddingTop: '24px',
  borderTop: '1px solid rgba(130, 92, 22, 0.1)',
  textAlign: 'center' as const,
};

const footerSmall = {
  color: '#a3a3a3',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '16px',
  textAlign: 'center' as const,
};

export default GroupReminderEmail;

