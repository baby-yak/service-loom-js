import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export function createEslintConfig(tsconfigRootDir) {
  return tseslint.config(
    { ignores: ['eslint.config.mjs', 'tsdown.config.ts', 'vitest.config.ts', 'dist/**'] },
    tseslint.configs.strictTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          project: './tsconfig.json',
          tsconfigRootDir,
        },
      },
    },
    {
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
        '@typescript-eslint/no-unused-vars': ['warn'],
        '@typescript-eslint/no-confusing-void-expression': ['off'],
      },
    },
    prettierConfig,
  );
}
