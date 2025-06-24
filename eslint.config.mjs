// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // 'no-console': 'error',
            // 'dot-notation': 'error',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
        },
    },
    {
        ignores: [
            'dist',
            'node_modules',
            'eslint.config.mjs',
            'jest.config.js',
            'generateScripts.mjs',
            'scripts/generateScripts.mjs',
            'scripts/convertPemToJwk.mjs',
            'tests',
            '*.spec.ts',
            'coverage',
        ],
    },
)
