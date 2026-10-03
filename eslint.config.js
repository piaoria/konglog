import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
export default tseslint.config({ ignores: ['dist', 'supabase/functions', 'node_modules'] }, js.configs.recommended, ...tseslint.configs.recommended, { files: ['scripts/**/*.mjs', 'scripts/**/*.js'], languageOptions: { globals: { ...globals.node, ...globals.browser } } }, { files: ['src/**/*.{ts,tsx}'], languageOptions: { globals: { ...globals.browser, ...globals.node } }, plugins: { 'react-hooks': hooks }, rules: hooks.configs.recommended.rules });

