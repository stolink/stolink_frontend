import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "**/dist/**",
      "**/*.mjs",
      "*.cjs",
      "*.config.js",
      "*.config.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Unused Variables: Error, but allow underscore prefix for intentionally ignored vars
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // --------------------------------------------------------
      // Design System Governance
      // --------------------------------------------------------
      // 1. Enforce Design System Button over generic shadcn Button
      "no-restricted-imports": [
        "warn", // Staged rollout: Start with warn, move to error later
        {
          paths: [
            {
              name: "@/components/ui/button",
              message:
                "Please use the Design System Button: @/design-system/components/Button",
            },
          ],
        },
      ],
      // 2. Warn against hardcoded "stone" colors (Encourage Mocha/Cloud)
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/bg-stone-|text-stone-|border-stone-/]",
          message:
            "Use Design System tokens (cloud/mocha/espresso) instead of hardcoded stone colors.",
        },
      ],
    },
  }
);
