import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { placeLabel } from '../core/coarsen';
import { ageText } from '../core/freshness';
import type { ConditionsResult } from '../core/getConditions';
import type { CurrentConditions, Place } from '../core/types';
import { compassToWords } from '../provider';
import { announce } from '../ui/announce';
import { minTouchSize, spacing, useTheme, type Colors } from '../ui/theme';
import { useAndroidBack } from './useAndroidBack';

// Contract: specs/001-place-search-weather/contracts/screens.md → Conditions screen

const NOT_AVAILABLE = 'Not available';
const OUT_OF_DATE = 'This weather may be out of date.';

type Props = {
  place: Place;
  getConditions: (place: Place) => Promise<ConditionsResult>;
  now: () => number;
  onBack: () => void;
};

type ScreenState = { status: 'loading' } | ConditionsResult;

export function ConditionsScreen({ place, getConditions, now, onBack }: Props) {
  const colors = useTheme();
  const [state, setState] = useState<ScreenState>({ status: 'loading' });
  // Bumped by "Try again" to load again.
  const [attempt, setAttempt] = useState(0);
  const label = placeLabel(place);

  useAndroidBack(onBack);

  useEffect(() => {
    let active = true; // ignore a late answer after leaving the screen
    setState({ status: 'loading' });
    getConditions(place).then((result) => {
      if (active) setState(result);
    });
    return () => {
      active = false;
    };
  }, [place, getConditions, attempt]);

  const errorMessage = `We couldn't get the weather for ${label}. Check your internet connection and try again.`;
  const shown = state.status === 'fresh' || state.status === 'fallback' ? state : null;
  // Old data (FR-014) or a far-off answer both mean it may not describe this place now.
  const showWarning = shown !== null && (shown.stale || shown.conditions.farFromRequest);
  // The time comes from observedAt, the same timestamp as "Updated … ago", so they agree.
  const fallbackNote =
    state.status === 'fallback'
      ? `Couldn't get newer weather. Showing saved weather from ${clockTime(state.conditions.observedAt)}.`
      : null;

  // Read status changes aloud (FR-020); a single mechanism, see src/ui/announce.ts.
  // One combined announcement, so the second doesn't cut off the first.
  useEffect(() => {
    if (state.status === 'error') announce(errorMessage);
    else {
      const spoken = [fallbackNote, showWarning ? OUT_OF_DATE : null].filter(Boolean).join(' ');
      if (spoken) announce(spoken);
    }
  }, [state, showWarning, errorMessage, fallbackNote]);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to search"
        onPress={onBack}
        style={[styles.backButton, { borderColor: colors.border }]}
      >
        <Text style={[styles.body, { color: colors.accent }]}>Back to search</Text>
      </Pressable>

      <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
        {label}
      </Text>

      {/* Static text rather than a spinner: nothing moves on screen (Principle III). */}
      {state.status === 'loading' && (
        <Text style={[styles.body, { color: colors.mutedText }]}>Loading weather…</Text>
      )}

      {state.status === 'error' && (
        <>
          <Text style={[styles.body, { color: colors.text }]}>{errorMessage}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try again"
            onPress={() => setAttempt((n) => n + 1)}
            style={[styles.button, { backgroundColor: colors.buttonBackground }]}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>Try again</Text>
          </Pressable>
        </>
      )}

      {fallbackNote && <Text style={[styles.body, { color: colors.text }]}>{fallbackNote}</Text>}

      {shown && (
        <Conditions conditions={shown.conditions} now={now()} colors={colors} warning={showWarning} />
      )}
    </ScrollView>
  );
}

function Conditions({
  conditions: c,
  now,
  colors,
  warning,
}: {
  conditions: CurrentConditions;
  now: number;
  colors: Colors;
  warning: boolean;
}) {
  const temperature = roundOrNull(c.temperatureC);
  const feelsLike = roundOrNull(c.feelsLikeC);
  const rain = roundOrNull(c.rainChancePercent);
  const windSpeed = roundOrNull(c.windSpeedKmh);

  return (
    <View style={styles.conditions}>
      {warning && <Warning colors={colors} />}

      <Text style={[styles.description, { color: colors.text }]}>
        {c.description ?? NOT_AVAILABLE}
      </Text>

      {/* Labels use the same rounded numbers as the text, so screen-reader
          users hear what sighted users see (FR-020). */}
      <Text
        accessibilityLabel={temperature === null ? 'Temperature not available' : `Temperature ${temperature} degrees`}
        style={[styles.temperature, { color: colors.text }]}
      >
        {temperature === null ? `Temperature: ${NOT_AVAILABLE}` : `${temperature}°`}
      </Text>

      <Text
        accessibilityLabel={feelsLike === null ? 'Feels like not available' : `Feels like ${feelsLike} degrees`}
        style={[styles.body, { color: colors.text }]}
      >
        {feelsLike === null ? `Feels like: ${NOT_AVAILABLE}` : `Feels like ${feelsLike}°`}
      </Text>

      {/* A number, never colour alone (FR-022). */}
      <Text
        accessibilityLabel={rain === null ? 'Chance of rain not available' : `Chance of rain ${rain} percent`}
        style={[styles.body, { color: colors.text }]}
      >
        {rain === null ? `Rain: ${NOT_AVAILABLE}` : `Rain: ${rain}%`}
      </Text>

      <Text
        accessibilityLabel={windLabel(windSpeed, c.windDirection)}
        style={[styles.body, { color: colors.text }]}
      >
        {windSpeed === null
          ? `Wind: ${NOT_AVAILABLE}`
          : `Wind: ${windSpeed} km/h${c.windDirection ? ` ${c.windDirection}` : ''}`}
      </Text>

      <Text style={[styles.small, { color: colors.mutedText }]}>{ageText(c.observedAt, now)}</Text>
      <Text style={[styles.small, { color: colors.mutedText }]}>
        {`Source: ${c.source} · ${c.attribution}`}
      </Text>
    </View>
  );
}

function Warning({ colors }: { colors: Colors }) {
  return (
    <View style={[styles.warning, { backgroundColor: colors.warningBackground }]}>
      <Text accessibilityLabel="Warning" style={[styles.body, { color: colors.warningText }]}>
        ⚠
      </Text>
      <Text style={[styles.body, styles.warningText, { color: colors.warningText }]}>
        {OUT_OF_DATE}
      </Text>
    </View>
  );
}

/** "2:15 pm" in the phone's local time, with lower-case am/pm. */
function clockTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'am' : 'pm'}`;
}

function roundOrNull(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

/** e.g. "Wind 19 kilometres per hour from the north". */
function windLabel(speed: number | null, direction: string | null): string {
  if (speed === null) return 'Wind not available';
  const unit = speed === 1 ? 'kilometre' : 'kilometres';
  const words = compassToWords(direction);
  return `Wind ${speed} ${unit} per hour${words ? ` from the ${words}` : ''}`;
}

// No fixed heights: text grows with the phone's text-size setting (FR-021).
const styles = StyleSheet.create({
  content: { padding: spacing.medium, gap: spacing.medium },
  backButton: { minHeight: minTouchSize, justifyContent: 'center', alignSelf: 'flex-start' },
  heading: { fontSize: 28, fontWeight: '700' },
  conditions: { gap: spacing.small },
  description: { fontSize: 22, fontWeight: '600' },
  temperature: { fontSize: 64, fontWeight: '300' },
  body: { fontSize: 18 },
  small: { fontSize: 14 },
  button: {
    minHeight: minTouchSize,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.medium,
  },
  buttonText: { fontSize: 18, fontWeight: '600' },
  warning: {
    flexDirection: 'row',
    gap: spacing.small,
    padding: spacing.medium,
    borderRadius: 8,
  },
  warningText: { flexShrink: 1 },
});
