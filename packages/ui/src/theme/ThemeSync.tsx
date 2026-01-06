import { hexToHsl } from "@stolink/tokens";
import { defaultTheme } from "./defaultTheme";

type ThemeVariables = Record<string, string>;

function cssVarsToString(variables: ThemeVariables): string {
  return Object.entries(variables)
    .map(([key, value]) => {
      // If scalar value (like radius), keep as is.
      // If color (starts with #), convert to HSL.
      let finalValue = value;
      if (value.startsWith("#")) {
        finalValue = hexToHsl(value);
      }
      return `--${key}: ${finalValue};`;
    })
    .join("\n");
}

export const ThemeSync = () => {
  const lightVars = cssVarsToString(defaultTheme.light);
  const darkVars = cssVarsToString(defaultTheme.dark);

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        :root {
          ${lightVars}
        }
        .dark {
          ${darkVars}
        }
      `,
      }}
    />
  );
};
