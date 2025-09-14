/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.spec.ts'],
    testTimeout: 30000,
    reporters: [
      'default',
      ['jest-html-reporters', {
        publicPath: './reports/html',
        filename: 'index.html',
        inlineSource: true,
        hideIcon: true,
        expand: true
      }],
      ['jest-junit', { outputDirectory: '.', outputName: 'junit.xml' }]
    ],
    transform: {
      '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
    }
  };
  