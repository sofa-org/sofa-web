module.exports = {
  extends: ['stylelint-prettier/recommended', 'stylelint-config-standard-scss'],
  rules: {
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
    'rule-empty-line-before': [
      'always',
      { except: ['after-single-line-comment', 'first-nested'] },
    ],
    'max-empty-lines': 1,
  },
};
