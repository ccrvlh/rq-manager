import { useSettings } from "@/contexts/SettingsContext";

export function useRefreshInterval() {
  const { settings } = useSettings();

  return {
    dashboard: settings.autoRefresh ? settings.dashboardRefreshInterval : false,
    jobs: settings.autoRefresh ? settings.jobsRefreshInterval : false,
    queues: settings.autoRefresh ? settings.queuesRefreshInterval : false,
    workers: settings.autoRefresh ? settings.workersRefreshInterval : false,
    analytics: settings.autoRefresh ? settings.analyticsRefreshInterval : false,
  };
}
