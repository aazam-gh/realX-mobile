module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/components', '<rootDir>/context', '<rootDir>/src'],
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo/ui|@expo/vector-icons|react-navigation|@react-navigation/.*|react-native-svg))',
  ],
};
