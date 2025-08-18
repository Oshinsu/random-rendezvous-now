import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  return <footer className="py-6 sm:py-8 bg-secondary border-t border-border">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4">
          <p className="text-lg sm:text-xl font-heading font-bold text-primary">{t('common.appName')}</p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            &copy; {currentYear} Random App. {t('common.allRightsReserved')}
          </p>
          <p className="text-xs text-muted-foreground/75 leading-relaxed">{t('common.madeWith')}</p>
          
          {/* Legal Links */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 pt-3 sm:pt-4">
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t('common.termsOfService')}
            </Link>
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t('common.privacyPolicy')}
            </Link>
            <Link to="/contact" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t('common.contact')}
            </Link>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;