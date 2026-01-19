import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { SPACING } from '@/constants/theme';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  padding?: number;
}

/**
 * Container component that constrains width on web/desktop
 * but allows full width on mobile
 */
export function WebContainer({ 
  children, 
  maxWidth = 1200,
  padding = SPACING.lg 
}: WebContainerProps) {
  const { isDesktop, isTablet } = useResponsive();
  const isWeb = Platform.OS === 'web';

  // Only apply constraints on web
  if (!isWeb) {
    return <>{children}</>;
  }

  return (
    <View style={styles.wrapper}>
      <View 
        style={[
          styles.container,
          {
            maxWidth: isDesktop ? maxWidth : isTablet ? maxWidth * 0.9 : '100%',
            paddingHorizontal: padding,
          }
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    width: '100%',
  },
});
