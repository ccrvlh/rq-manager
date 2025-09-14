import {
  Checkbox,
  createTheme,
  CSSVariablesResolver,
  darken,
  MantineTheme,
  rem,
  Switch,
} from "@mantine/core";

export const theme = createTheme({
  primaryColor: "primary",
  defaultRadius: "md",
  luminanceThreshold: 0.3,
  autoContrast: true,
  focusRing: "never",

  colors: {
    primary: [
      "#fef2f2", // 50
      "#fee2e2", // 100
      "#fecaca", // 200
      "#fca5a5", // 300
      "#f87171", // 400
      "#bd2a1f", // 500
      "#a02318", // 600
      "#831c14", // 700
      "#661611", // 800
      "#4a100d", // 900
    ],
  },

  radius: {
    xs: rem("4px"),
    sm: rem("6px"),
    md: rem("8px"),
    lg: rem("12px"),
    xl: rem("16px"),
  },

  spacing: {
    xs: rem("8px"),
    sm: rem("12px"),
    md: rem("16px"),
    lg: rem("20px"),
    xl: rem("24px"),
  },

  fontSizes: {
    xs: rem("12px"),
    sm: rem("14px"),
    md: rem("16px"),
    lg: rem("18px"),
    xl: rem("20px"),
  },
  components: {
    Menu: {
      styles: (_: MantineTheme) => ({
        dropdown: {
          backgroundColor: "var(--mantine-color-default)",
        },
      }),
    },

    Switch: Switch.extend({
      defaultProps: {
        withThumbIndicator: false,
      },
    }),

    Checkbox: Checkbox.extend({
      defaultProps: {
        radius: "sm",
      },
    }),

    Select: {
      styles: (_: MantineTheme) => ({
        root: {
          backgroundColor: "var(--mantine-color-default)",
        },
      }),
    },

    Paper: {
      styles: (_: MantineTheme) => ({
        root: {
          backgroundColor: "var(--mantine-color-default)",
        },
      }),
    },

    Card: {
      styles: (_: MantineTheme) => ({
        root: {
          backgroundColor: "var(--mantine-color-default)",
        },
      }),
    },

    Modal: {
      defaultProps: {
        centered: true,
        overlayProps: {
          blur: 3,
        },
      },
      styles: (_: MantineTheme) => ({
        header: {
          backgroundColor: "var(--mantine-color-default)",
        },
      }),
    },
  },
});

export const shadcnCssVariableResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-body": "var(--mantine-color-white)", // Background
    "--mantine-color-default": "var(--mantine-color-white)", // Background Card/Paper
  },
  dark: {
    "--mantine-color-body": darken("var(--mantine-color-dark-7)", 0.5), // Background Card/Paper
    "--mantine-color-default": darken("var(--mantine-color-dark-8)", 0.2), // Background Card/Paper
  },
});
