import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Mail } from "lucide-react";
import { useDynamicContent } from "@/hooks/useDynamicContent";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t, i18n } = useTranslation();
  const { getContent } = useDynamicContent();
  
  return (
    <footer className="py-6 sm:py-8 bg-secondary border-t border-border">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4">
          <p className="text-lg sm:text-xl font-heading font-bold text-primary">Random</p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {getContent('footer_description', 'Random - L\'application qui révolutionne vos sorties')}
          </p>
          <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <a 
              href={`mailto:${getContent('contact_email', 'contact@random-app.fr')}`}
              className="hover:text-primary transition-colors"
            >
              {getContent('contact_email', 'contact@random-app.fr')}
            </a>
          </div>
          <p className="text-xs text-muted-foreground/75 leading-relaxed">
            &copy; {currentYear} Random App. Tous droits réservés.
          </p>
          
          {/* Legal Links */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 pt-3 sm:pt-4">
            <Link to="/bar-application" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {i18n.language === 'en' ? 'Bar Owners' : 'Espace Gérants'}
            </Link>
            <Link to="/blog" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Blog
            </Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {i18n.language === 'en' ? t('footer.terms') : 'Conditions d\'utilisation'}
            </Link>
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {i18n.language === 'en' ? t('footer.privacy') : 'Politique de confidentialité'}
            </Link>
            <Link to="/contact" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {i18n.language === 'en' ? t('footer.contact') : 'Contact'}
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-2">
            <span>Fait avec</span>
            <Heart className="h-3 w-3 text-red-500 fill-current" />
            <span>à Paris</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;