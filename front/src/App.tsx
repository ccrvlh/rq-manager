import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AppLayout } from "./layout/AppLayout";
import { shadcnCssVariableResolver, theme } from "./styles/theme";
import { queryClient } from "./utils/cache";

export default function App() {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="dark"
      cssVariablesResolver={shadcnCssVariableResolver}
    >
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <AppLayout />
          </SettingsProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </MantineProvider>
  );
}
