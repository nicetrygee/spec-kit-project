import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { getConditions } from './src/core/getConditions';
import type { Place } from './src/core/types';
import { fetchCurrentConditions, searchPlaces } from './src/provider';
import { ConditionsScreen } from './src/screens/ConditionsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { useTheme } from './src/ui/theme';

// Real network and clock, passed into the screens (tests pass stand-ins instead).
const loadConditions = (place: Place) =>
  getConditions(place, { fetchCurrentConditions, now: Date.now });

/**
 * Shows the search screen, or the conditions screen once a place is chosen.
 * Two screens don't need a navigation library (plan.md D5).
 */
export default function App() {
  const colors = useTheme();
  const scheme = useColorScheme();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const backToSearch = useCallback(() => setSelectedPlace(null), []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {selectedPlace === null ? (
          <SearchScreen search={searchPlaces} onSelectPlace={setSelectedPlace} />
        ) : (
          <ConditionsScreen
            place={selectedPlace}
            getConditions={loadConditions}
            now={Date.now}
            onBack={backToSearch}
          />
        )}
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
