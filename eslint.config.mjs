import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// Linted so far: LeviMC Mods (src/mods/) and its scripts (scripts/mods/). The rest of the site is type-checked and
// tested only.
const eslintConfig = defineConfig([
  globalIgnores(["**/*", "!src/", "!src/mods/", "!src/mods/**", "!scripts/", "!scripts/mods/", "!scripts/mods/**"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Let components drop props they do not forward, as in the
      // `({ node, ...props })` react-markdown components use.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ["**/*.mjs", "**/vite.config.ts"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Browser tests: callbacks passed to page.evaluate() run in the page.
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
]);

export default eslintConfig;
