import { useEffect, useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput } from 'react-native';
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
  const [showSplash, setShowSplash] = useState(true);
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

  const shouldShowSplash = useMemo(() => !fontsLoaded || showSplash, [fontsLoaded, showSplash]);

  if (shouldShowSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(auth)/check-email" />
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
