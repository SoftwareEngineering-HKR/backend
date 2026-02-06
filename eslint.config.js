import js from "@eslint/js";
import globals from "globals";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

const recommendedRules = js.configs.recommended.rules;

export default [
	{
		ignores: ["node_modules/**"],
	},
	{
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: { ...globals.node },
		},
		rules: {
			...recommendedRules,
			indent: ["error", "tab"],
			"max-len": ["error", { code: 120, ignoreComments: true, ignoreTrailingComments: true }],
			"function-paren-newline": ["error", "multiline"],
			quotes: ["error", "double"],
			"prettier/prettier": ["error"],
		},
	},
	eslintPluginPrettierRecommended,
];
