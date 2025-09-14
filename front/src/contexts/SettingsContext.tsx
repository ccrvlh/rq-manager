import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AppSettings {
  // Refresh intervals (in milliseconds)
  dashboardRefreshInterval: number;
  jobsRefreshInterval: number;
  queuesRefreshInterval: number;
  workersRefreshInterval: number;
  analyticsRefreshInterval: number;
  
  // Other settings
  autoRefresh: boolean;
  maxJobsPerPage: number;
  dataRetentionDays: number;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  dashboardRefreshInterval: 30000, // 30 seconds
  jobsRefreshInterval: 10000,      // 10 seconds
  queuesRefreshInterval: 10000,    // 10 seconds
  workersRefreshInterval: 10000,   // 10 seconds
  analyticsRefreshInterval: 30000, // 30 seconds
  autoRefresh: true,
  maxJobsPerPage: 50,
  dataRetentionDays: 30,
};

const STORAGE_KEY = "rq-manager-settings";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}