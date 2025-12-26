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

interface GroupConfirmedEmailProps {
  firstName: string;
  barName: string;
  barAddress: string;
  meetingTime: string;
  groupUrl: string;
}

export const GroupConfirmedEmail = ({
  firstName = 'Voyageur',
  barName = 'Le Bar',
  barAddress = '123 Rue de Paris',
  meetingTime = 'Ce soir à 19h30',
  groupUrl = 'https://random.app/groups',
}: GroupConfirmedEmailProps) => (
  <Html>
    <Head />
    <Preview>Ton groupe est complet ! RDV {meetingTime} au {barName}</Preview>
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
          <span style={badge}>🎉 Groupe complet !</span>
        </div>
        <Heading style={h1}>Let's go {firstName} !</Heading>
        <Text style={text}>
          Ton groupe de 5 est formé et prêt pour une soirée incroyable ! 🎊
        </Text>
        
        <Section style={infoBox}>
          <Text style={infoTitle}>📍 Rendez-vous</Text>
          <Text style={infoBarName}>{barName}</Text>
          <Text style={infoAddress}>{barAddress}</Text>
          <Text style={infoTime}>⏰ {meetingTime}</Text>
        </Section>

        <Text style={text}>
          **Prochaines étapes :**
        </Text>
        <Text style={listText}>
          1. Rejoins le chat de groupe pour faire connaissance<br />
          2. Regarde la carte pour repérer le bar<br />
          3. RDV à l'heure indiquée !
        </Text>

        <Section style={buttonContainer}>
          <Button
            style={button}
            href={groupUrl}
          >
            💬 Accéder au groupe
          </Button>
        </Section>

        <Text style={tip}>
          **Conseil :** Arrive à l'heure pour profiter au max de la soirée ! Les meilleurs moments sont souvent au début 😉
        </Text>

        <Text style={footer}>
          Belle soirée,<br />
          L'équipe Random
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
  background: 'linear-gradient(90deg, #f1c232, #c08a15)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 16px',
  borderRadius: '20px',
  boxShadow: '0 4px 12px rgba(241, 194, 50, 0.3)',
};

const h1 = {
  color: '#825c16',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 20px',
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
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#825c16',
  margin: '0 0 8px',
};

const infoAddress = {
  fontSize: '16px',
  color: '#737373',
  margin: '0 0 16px',
};

const infoTime = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#f1c232',
  margin: '0',
};

const listText = {
  color: '#525252',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 24px',
  paddingLeft: '10px',
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

const tip = {
  backgroundColor: '#fff8e1',
  border: '1px solid rgba(241, 194, 50, 0.2)',
  borderRadius: '8px',
  padding: '16px',
  fontSize: '14px',
  color: '#737373',
  lineHeight: '22px',
  margin: '24px 0',
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

export default GroupConfirmedEmail;

