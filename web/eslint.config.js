import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Clean architecture: domain + application không được phụ thuộc vào React/hạ tầng.
  {
    files: ['src/features/*/domain/**', 'src/features/*/application/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-*', '@tanstack/*'], message: 'Domain/Application phải độc lập với framework.' },
            { group: ['**/infrastructure/**', '**/presentation/**', '@/app/**'], message: 'Sai chiều phụ thuộc (chỉ được trỏ vào trong).' },
          ],
        },
      ],
    },
  },
);
