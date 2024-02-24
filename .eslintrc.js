module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
    "jquery": true,
    "webextensions": true
  },
  "extends": "eslint:recommended",
  "overrides": [
    {
      "env": {
          "node": true
      },
      "files": [
          ".eslintrc.{js,cjs}"
      ],
      "parserOptions": {
          "sourceType": "script"
      }
    }
  ],
  "parserOptions": {
      "ecmaVersion": "latest",
      "sourceType": "module"
  },
  "globals": {
    "Coloris": "readonly"
  },
  "rules": {
    "no-case-declarations": "off",
    "no-unused-vars": "off"
  }
}
