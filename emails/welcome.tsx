import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  firstName: string;
  dashboardUrl?: string;
}

export const WelcomeEmail = ({
  firstName = 'Voyageur',
  dashboardUrl = 'https://random.app/dashboard',
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bienvenue sur Random ! Prêt pour ta première sortie ?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://random.app/logo.png"
          width="64"
          height="64"
          alt="Random"
          style={logo}
        />
        <Heading style={h1}>Hey {firstName} ! 👋</Heading>
        <Text style={text}>
          Bienvenue dans la famille Random. Tu es à **un clic** de rencontrer de nouvelles personnes autour d'un verre.
        </Text>
        <Text style={text}>
          Plus de ghosting. Plus de messages sans réponse. Juste un groupe de 5, un bar, et une soirée vraie.
        </Text>
        <Section style={buttonContainer}>
          <Button
            style={button}
            href={dashboardUrl}
          >
            ✨ Trouver mon groupe
          </Button>
        </Section>
        <Text style={text}>
          **Comment ça marche ?**
        </Text>
        <Text style={listText}>
          1. Clique sur "Trouver mon groupe"<br />
          2. On forme ton groupe de 5 personnes<br />
          3. On choisit un bar près de vous<br />
          4. Profite de ta soirée ! 🎉
        </Text>
        <Text style={footer}>
          À très vite,<br />
          L'équipe Random
        </Text>
        <Text style={footerSmall}>
          Questions ? Réponds à cet email, on est là ! 💬
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
  margin: '0 auto 32px',
  display: 'block',
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

const listText = {
  color: '#525252',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 20px',
  paddingLeft: '10px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  background: 'linear-gradient(90deg, #fffbe8 0%, #f1c232 100%)',
  borderRadius: '8px',
  color: '#825c16',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  border: '2px solid rgba(241, 194, 50, 0.3)',
};

const footer = {
  color: '#737373',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
  paddingTop: '24px',
  borderTop: '1px solid rgba(130, 92, 22, 0.1)',
};

const footerSmall = {
  color: '#a3a3a3',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '16px',
  textAlign: 'center' as const,
};

export default WelcomeEmail;

