import { useEffect, useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import {
  FunnelDisplay_500Medium,
  FunnelDisplay_700Bold,
} from '@expo-google-fonts/funnel-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingOverlay } from '@/components/OnboardingOverlay';
import { COLORS, FONT_FAMILY } from '@/constants/theme';

export default function RootLayout() {
  useFrameworkReady();
  // Only show splash on mobile, skip on web
  const [showSplash, setShowSplash] = useState(Platform.OS !== 'web');
  const [fontsLoaded] = useFonts({
    FunnelDisplay_500Medium,
    FunnelDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    if (!Text.defaultProps) {
      Text.defaultProps = {};
    }

    Text.defaultProps.style = {
      ...(Text.defaultProps.style || {}),
      fontFamily: FONT_FAMILY.body,
      color: COLORS.text,
    };

    if (!TextInput.defaultProps) {
      TextInput.defaultProps = {};
    }

    TextInput.defaultProps.style = {
      ...(TextInput.defaultProps.style || {}),
      fontFamily: FONT_FAMILY.body,
      color: COLORS.text,
    };
  }, [fontsLoaded]);

  // Skip splash screen on web, but still wait for fonts to load
  const shouldShowSplash = useMemo(() => {
    if (Platform.OS === 'web') {
      return false; // Never show splash on web
    }
    return !fontsLoaded || showSplash;
  }, [fontsLoaded, showSplash]);

  // On web, wait for fonts but don't show splash screen
  if (Platform.OS === 'web' && !fontsLoaded) {
    return null; // Wait for fonts to load silently
  }

  // Show splash screen only on mobile
  if (shouldShowSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(auth)/check-email" />
        <Stack.Screen name="(auth)/check-email-reset" />
        <Stack.Screen name="(auth)/reset-password" />
        <Stack.Screen name="(auth)/email-verified" />
        <Stack.Screen name="(auth)/role-selection" />
        <Stack.Screen name="(auth)/onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <OnboardingOverlay />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
