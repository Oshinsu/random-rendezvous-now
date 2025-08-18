import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  
  const currentLanguage = i18n.language;

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="h-8 w-8 p-0 hover:bg-accent"
      title={currentLanguage === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <span className="text-lg">
        {currentLanguage === 'fr' ? '🇬🇧' : '🇫🇷'}
      </span>
    </Button>
  );
};

export default LanguageToggle;