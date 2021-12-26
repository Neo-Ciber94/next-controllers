/* eslint-disable no-undef */
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.ts'],
  moduleDirectories: ['node_modules', '.'],
  testPathIgnorePatterns: [".d.ts", "test/utils.ts"],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
