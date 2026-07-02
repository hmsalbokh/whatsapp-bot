export default [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        process: "readonly",
        console: "readonly",
        fetch: "readonly",
        Response: "readonly",
        Request: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "warn",
    },
  },
];
