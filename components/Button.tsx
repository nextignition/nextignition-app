import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  GRADIENTS,
  SHADOWS,
  SPACING,
} from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isGradientVariant = variant === 'primary' || variant === 'secondary';
  const gradientColors = variant === 'secondary' ? GRADIENTS.accent : GRADIENTS.primary;

  // Merge styles ensuring web constraints override width properties
  const getButtonStyle = (pressed: boolean) => {
    const baseStyles = [
      styles.base,
      styles[variant],
      isGradientVariant && styles.gradientBase,
      pressed && styles.pressed,
      isDisabled && styles.disabled,
    ];
    
    if (Platform.OS === 'web') {
      // On web, apply custom style first, then override with web constraints
      return [
        ...baseStyles,
        style,
        styles.buttonWeb, // Web constraints applied last to override width
      ];
    }
    
    return [...baseStyles, style];
  };

  return (
    <View style={Platform.OS === 'web' ? styles.buttonWrapper : undefined}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => getButtonStyle(pressed)}>
      <>
        {isGradientVariant && (
          <LinearGradient
            style={styles.gradient}
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <View style={styles.content}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? COLORS.primary : COLORS.background}
        />
      ) : (
            <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{title}</Text>
      )}
        </View>
      </>
    </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
  },
  gradientBase: {
    ...SHADOWS.sm,
  },
  buttonWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  buttonWeb: {
    cursor: 'pointer',
    maxWidth: 400,
    minWidth: 120,
    width: 'auto',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.accent,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY.bodyBold,
    letterSpacing: 0.2,
  },
  primaryText: {
    color: COLORS.background,
  },
  secondaryText: {
    color: COLORS.background,
  },
  outlineText: {
    color: COLORS.primary,
  },
});
