
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-8 bg-secondary border-t border-border">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4">
          <p className="text-xl font-heading font-bold text-primary">Random</p>
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Random App. Tous droits réservés. Osez l'imprévu.
          </p>
          <p className="text-xs text-muted-foreground/75">
            Conçu avec audace à Paris pour les aventuriers du quotidien.
          </p>
          
          {/* Legal Links */}
          <div className="flex justify-center space-x-6 pt-4">
            <Link 
              to="/terms" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Conditions d'utilisation
            </Link>
            <Link 
              to="/privacy" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Politique de confidentialité
            </Link>
            <a 
              href="mailto:contact@random-app.fr" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
