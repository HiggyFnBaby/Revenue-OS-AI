import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// Flat config: ESLint 9 (required by eslint-config-next 16) no longer reads
// .eslintrc.json. Next 16 also removed the `next lint` command, so
// `npm run lint` invokes eslint directly against src/.
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/lib/agentDefinitions.generated.ts",
    ],
  },
  ...nextCoreWebVitals,
];
