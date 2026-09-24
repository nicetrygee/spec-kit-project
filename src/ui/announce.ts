import { AccessibilityInfo } from 'react-native';

/**
 * Reads a status message aloud with VoiceOver/TalkBack (FR-020).
 * This is the only announcement mechanism: don't also mark message views
 * as live regions, or TalkBack reads each message twice.
 */
export function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}
