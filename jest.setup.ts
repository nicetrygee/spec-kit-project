// Official in-memory AsyncStorage stand-in (package 2.x path; Expo SDK 57 pins 2.2.0).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
