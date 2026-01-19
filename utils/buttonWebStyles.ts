import { Platform, ViewStyle } from 'react-native';

/**
 * Get web-constrained button styles
 * Prevents buttons from stretching full width on web
 */
export function getWebButtonStyle(baseStyle: ViewStyle = {}, maxWidth: number = 400): ViewStyle {
  if (Platform.OS !== 'web') {
    return baseStyle;
  }

  return {
    ...baseStyle,
    maxWidth,
    alignSelf: 'center',
    minWidth: 120,
  };
}

/**
 * Get web-constrained full-width button container
 * For buttons that should be full width but constrained on web
 */
export function getWebButtonContainerStyle(maxWidth: number = 600): ViewStyle {
  if (Platform.OS !== 'web') {
    return {};
  }

  return {
    maxWidth,
    alignSelf: 'center',
    width: '100%',
  };
}
