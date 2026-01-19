import { Platform, StyleSheet, ViewStyle } from 'react-native';

/**
 * Get web-constrained styles for scroll content
 * Only applies max-width and centering on web platform
 */
export function getWebScrollContentStyle(baseStyle: ViewStyle = {}): ViewStyle {
  if (Platform.OS !== 'web') {
    return baseStyle;
  }

  return {
    ...baseStyle,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  };
}

/**
 * Get web-constrained max width for containers
 */
export function getWebMaxWidth(defaultMaxWidth: number = 1200): number | string {
  if (Platform.OS !== 'web') {
    return '100%';
  }
  return defaultMaxWidth;
}

/**
 * Get web-constrained input max width
 */
export function getWebInputMaxWidth(): number | string {
  if (Platform.OS !== 'web') {
    return '100%';
  }
  return 600;
}
