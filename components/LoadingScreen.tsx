import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_FAMILY, GRADIENTS } from '@/constants/theme';
import { Logo } from './Logo';

export function LoadingScreen() {
  return (
    <LinearGradient colors={GRADIENTS.navy} style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo size={80} variant="icon" />
      </View>
      <Text style={styles.label}>NextIgnition</Text>
      <ActivityIndicator size="large" color={COLORS.background} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 10,
  },
  label: {
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.background,
    fontSize: 20,
    marginBottom: 16,
  },
});
