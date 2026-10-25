import { useState, useCallback, useMemo } from 'react';
import { LanguageContext } from './languageContextInstance';

const STORAGE_KEY = 'skillpath_language_preference';

const LANGUAGES = [
  { id: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { id: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { id: 'hinglish', label: 'Hinglish', nativeLabel: 'Hinglish', flag: '🇮🇳 / 💬' },
];

const TRANSLATIONS = {
  en: {
    nav_dashboard: 'Dashboard',
    nav_assessment: 'Diagnostic Assessment',
    nav_roadmap: 'Roadmap',
    nav_graph: 'Skill Graph',
    nav_analytics: 'Analytics',
    nav_projects: 'Capstone Projects',
    nav_career: 'Career Hub',
    welcome_back: 'Welcome back',
    learning_space: 'YOUR LEARNING SPACE',
    start_diagnostic: 'Start Diagnostic',
    take_diagnostic: 'Take Diagnostic',
    view_roadmap: 'View Roadmap',
    select_language: 'Select Language',
    select_persona: 'Select Learner Persona',
    select_track: 'Select Technology Track',
    study_budget: 'Daily Study Budget',
    save_continue: 'Save & Continue',
    ai_assistant_hint: 'Ask any doubt in English, Hindi, or Hinglish',
  },
  hi: {
    nav_dashboard: 'डैशबोर्ड',
    nav_assessment: 'डायग्नोस्टिक मूल्यांकन',
    nav_roadmap: 'रोडमैप',
    nav_graph: 'कौशल ग्राफ',
    nav_analytics: 'एनालिटिक्स',
    nav_projects: 'कैपस्टोन प्रोजेक्ट्स',
    nav_career: 'करियर हब',
    welcome_back: 'वापसी पर स्वागत है',
    learning_space: 'आपका लर्निंग स्पेस',
    start_diagnostic: 'डायग्नोस्टिक शुरू करें',
    take_diagnostic: 'टेस्ट दें',
    view_roadmap: 'रोडमैप देखें',
    select_language: 'भाषा चुनें',
    select_persona: 'अपनी भूमिका चुनें',
    select_track: 'टेक्नोलॉजी ट्रैक चुनें',
    study_budget: 'दैनिक अध्ययन समय',
    save_continue: 'सहेजें और आगे बढ़ें',
    ai_assistant_hint: 'हिंदी, इंग्लिश या हिंग्लिश में कोई भी सवाल पूछें',
  },
  hinglish: {
    nav_dashboard: 'Dashboard',
    nav_assessment: 'Diagnostic Test',
    nav_roadmap: 'Roadmap',
    nav_graph: 'Skill Graph',
    nav_analytics: 'Analytics',
    nav_projects: 'Capstone Projects',
    nav_career: 'Career Hub',
    welcome_back: 'Welcome back',
    learning_space: 'AAPKA LEARNING SPACE',
    start_diagnostic: 'Diagnostic Start Karein',
    take_diagnostic: 'Test Dein',
    view_roadmap: 'Roadmap Dekhein',
    select_language: 'Language Chunein',
    select_persona: 'Apna Learner Persona Select Karein',
    select_track: 'Technology Track Chunein',
    study_budget: 'Daily Study Budget',
    save_continue: 'Save & Aage Badhein',
    ai_assistant_hint: 'Kisi bhi concept ya doubt ko Hinglish mein poochiye',
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['en', 'hi', 'hinglish'].includes(saved)) {
        return saved;
      }
    } catch {
      // localStorage inaccessible
    }
    return 'en';
  });

  const setLanguage = useCallback((lang) => {
    if (['en', 'hi', 'hinglish'].includes(lang)) {
      setLanguageState(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const t = useCallback(
    (key, fallback = '') => {
      const activeDict = TRANSLATIONS[language] || TRANSLATIONS.en;
      return activeDict[key] || TRANSLATIONS.en[key] || fallback || key;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languages: LANGUAGES,
      t,
    }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
