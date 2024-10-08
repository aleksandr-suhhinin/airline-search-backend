module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended/all'],
  testTimeout: 70000,
  globals: {
    transform: { "^.+\\.(t|j)sx?$": ['ts-jest', { isolatedModules: true }] } 
  }
};