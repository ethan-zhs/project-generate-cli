module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2020: true
    },
    extends: ['airbnb-base', 'prettier'],
    plugins: ['prettier'],
    parserOptions: {
        ecmaVersion: 12
    },
    rules: {
        'prettier/prettier': ['error'],
        'no-unused-vars': [1, { vars: 'all', args: 'after-used' }],
        'no-console': 'off',
        'global-require': 'off',
        'no-param-reassign': 'off',
        'consistent-return': 'off',
        'no-use-before-define': 'off',
        'class-methods-use-this': 'off',
        'no-restricted-syntax': 'off',
        'guard-for-in': 'off'
    }
}
