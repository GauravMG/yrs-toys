/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "import"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
  ignorePatterns: ["dist", "build", "node_modules", "coverage", "*.config.*", "playwright-report", "test-results"],
  overrides: [
    {
      // apps/web and apps/admin: React SPAs
      files: ["apps/web/src/**/*.{ts,tsx}", "apps/admin/src/**/*.{ts,tsx}"],
      env: { browser: true, es2022: true },
      plugins: ["react", "react-hooks", "react-refresh"],
      extends: ["plugin:react/recommended", "plugin:react-hooks/recommended"],
      settings: { react: { version: "detect" } },
      rules: {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        // Flags literal apostrophes/quotes in JSX text (e.g. "don't") and
        // insists on HTML entities — renders identically either way, and
        // entity-escaping copy hurts source readability for no real benefit.
        "react/no-unescaped-entities": "off",
        "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      },
    },
    {
      // Test files: relax a couple of rules that fight common test patterns
      files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**", "e2e/tests/**"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "no-console": "off",
      },
    },
  ],
};
