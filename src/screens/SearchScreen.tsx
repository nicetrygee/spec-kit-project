import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { placeLabel } from '../core/coarsen';
import type { Place } from '../core/types';
import { validateSearch } from '../core/validateSearch';
import { PLACE_ATTRIBUTION } from '../provider';
import { announce } from '../ui/announce';
import { minTouchSize, spacing, useTheme } from '../ui/theme';

// Contract: specs/001-place-search-weather/contracts/screens.md → Search screen

const OFFLINE_MESSAGE = 'Search needs an internet connection. Check your connection and try again.';

type Props = {
  search: (query: string) => Promise<Place[]>;
  onSelectPlace: (place: Place) => void;
  /** Shown as a shortcut when a place was viewed before (FR-016). */
  lastViewedPlace?: Place | null;
};

export function SearchScreen({ search, onSelectPlace, lastViewedPlace = null }: Props) {
  const colors = useTheme();
  const [text, setText] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  // Only the newest search may update the screen, if an older one answers late.
  const latestSearch = useRef(0);

  function showMessage(text: string) {
    setMessage(text);
    announce(text);
  }

  async function submit() {
    const validation = validateSearch(text);
    if (!validation.ok) {
      setResults([]);
      showMessage(validation.message);
      return; // invalid input never leaves the phone (FR-002)
    }

    const searchId = ++latestSearch.current;
    setMessage(null);
    setSearching(true);
    try {
      const places = await search(validation.query);
      if (searchId !== latestSearch.current) return;
      setResults(places);
      if (places.length === 0) {
        showMessage(
          `No Australian places matched "${validation.query}". Check the spelling or try a nearby town.`,
        );
      }
    } catch {
      if (searchId !== latestSearch.current) return;
      setResults([]);
      showMessage(
        lastViewedPlace
          ? `${OFFLINE_MESSAGE} You can still see saved weather for ${placeLabel(lastViewedPlace)} above.`
          : OFFLINE_MESSAGE,
      );
    } finally {
      if (searchId === latestSearch.current) setSearching(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
        Find a place
      </Text>

      {lastViewedPlace && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Last viewed: ${placeLabel(lastViewedPlace)}. Opens its weather.`}
          onPress={() => onSelectPlace(lastViewedPlace)}
          style={[styles.result, { borderColor: colors.border }]}
        >
          <Text style={[styles.body, { color: colors.accent }]}>
            {`Last viewed: ${placeLabel(lastViewedPlace)}`}
          </Text>
        </Pressable>
      )}

      <TextInput
        accessibilityLabel="Place name"
        accessibilityHint="Type an Australian suburb or town"
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        returnKeyType="search"
        autoCorrect={false}
        placeholder="e.g. Richmond"
        placeholderTextColor={colors.mutedText}
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      />

      <Pressable
        accessibilityRole="button"
        onPress={submit}
        style={[styles.button, { backgroundColor: colors.buttonBackground }]}
      >
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>Search</Text>
      </Pressable>

      {searching && <Text style={[styles.body, { color: colors.mutedText }]}>Searching…</Text>}

      {message && <Text style={[styles.body, { color: colors.text }]}>{message}</Text>}

      {results.length > 0 && (
        <View>
          {results.map((place) => (
            <Pressable
              key={`${placeLabel(place)} ${place.latitude},${place.longitude}`}
              accessibilityRole="button"
              accessibilityLabel={placeLabel(place)}
              onPress={() => onSelectPlace(place)}
              style={[styles.result, { borderColor: colors.border }]}
            >
              <Text style={[styles.body, { color: colors.accent }]}>{placeLabel(place)}</Text>
            </Pressable>
          ))}
          <Text style={[styles.small, { color: colors.mutedText }]}>{PLACE_ATTRIBUTION}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// No fixed heights: text grows with the phone's text-size setting (FR-021).
const styles = StyleSheet.create({
  content: { padding: spacing.medium, gap: spacing.medium },
  heading: { fontSize: 28, fontWeight: '700' },
  input: {
    minHeight: minTouchSize,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.medium,
    fontSize: 18,
  },
  button: {
    minHeight: minTouchSize,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.medium,
  },
  buttonText: { fontSize: 18, fontWeight: '600' },
  result: {
    minHeight: minTouchSize,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.small,
  },
  body: { fontSize: 18 },
  small: { fontSize: 14, marginTop: spacing.small },
});
