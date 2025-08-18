import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type Language = 'fr' | 'en';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => void;
  languages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
    { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  ];

  const changeLanguage = (language: Language) => {
    i18n.changeLanguage(language);
  };

  const currentLanguage = i18n.language as Language;

  useEffect(() => {
    // Ensure the HTML lang attribute is updated
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      languages,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};