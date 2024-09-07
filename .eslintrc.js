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
    "cloneInto": "readonly",
    "Coloris": "readonly",
    "marked": "readonly",
    "DOMPurify": "readonly",
    "Prism": "readonly",
    "luxon": "readonly",
    "idb": "readonly"
  },
  "rules": {
    "no-case-declarations": "off",
    "no-unused-vars": "off",
    "no-useless-escape": "off"
  }
}
