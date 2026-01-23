import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  Platform,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  type?: 'text' | 'email' | 'password';
}

const InputComponent = React.memo(function Input({
  label,
  error,
  type = 'text',
  value,
  onChangeText,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef<TextInput>(null);

  const isPassword = type === 'password';
  const secureEntry = isPassword && !showPassword;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const inputStyle = useMemo(() => [
    styles.input,
    isFocused && styles.inputFocused,
    error && styles.inputError,
  ], [isFocused, error]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={inputStyle}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureEntry}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          keyboardType={type === 'email' ? 'email-address' : 'default'}
          placeholderTextColor={COLORS.textSecondary}
          {...(Platform.OS === 'web' && { outlineStyle: 'none' })}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={togglePassword}>
            {showPassword ? (
              <EyeOff size={20} color={COLORS.textSecondary} />
            ) : (
              <Eye size={20} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

export const Input = InputComponent;

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: 0.6,
  },
  inputWrapper: {
    position: 'relative',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  input: {
    height: 54,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    shadowOpacity: 0.18,
    backgroundColor: COLORS.background,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  eyeIcon: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  error: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
