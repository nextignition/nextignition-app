import React from 'react';
import { View, StyleSheet, Image, ImageStyle } from 'react-native';

const LOGO_URL = 'https://raw.githubusercontent.com/nextignition/public-logo/refs/heads/main/Brandmark/Primary.png';

interface LogoProps {
  size?: number;
  variant?: 'full' | 'icon';
  color?: string;
}

export function Logo({ size = 64, variant = 'full', color }: LogoProps) {
  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    resizeMode: 'contain',
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: LOGO_URL }}
        style={imageStyle}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
