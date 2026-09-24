// PLATFORM-SPECIFIC (Android): hardware back button — constitution Principle IV.
// iPhones have no back button, so this does nothing there.

import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

/** Calls `onBack` when the Android back button is pressed. */
export function useAndroidBack(onBack: () => void): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true; // handled: don't close the app
    });
    return () => subscription.remove();
  }, [onBack]);
}
