import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { COLORS } from '@/constants/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const videoRef = useRef<Video>(null);
  const [playbackStatus, setPlaybackStatus] = useState<AVPlaybackStatus | null>(null);
  const [hasError, setHasError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);

  // Ensure component is mounted before rendering Video
  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setMounted(true);
    }, 100);

    return () => clearTimeout(mountTimer);
  }, []);

  useEffect(() => {
    // Check if video finished playing
    if (playbackStatus?.isLoaded) {
      if (playbackStatus.didJustFinish) {
        // Video finished playing, call onFinish after a brief delay
        setTimeout(() => {
          onFinish();
        }, 300);
      } else if (
        playbackStatus.positionMillis > 0 &&
        playbackStatus.durationMillis !== undefined &&
        playbackStatus.durationMillis > 0
      ) {
        // Check if video has reached the end (within 100ms of duration)
        const progress = playbackStatus.positionMillis / playbackStatus.durationMillis;
        if (progress >= 0.99) {
          setTimeout(() => {
            onFinish();
          }, 300);
        }
      }
    }
  }, [playbackStatus, onFinish]);

  // Fallback: if video fails or takes too long, proceed after timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasError) {
        console.warn('Video timeout, proceeding to login...');
        onFinish();
      }
    }, 8000); // 8 second maximum timeout

    return () => clearTimeout(timeout);
  }, [hasError, onFinish]);

  const handleLoad = () => {
    // Video loaded, try to play it
    if (videoRef.current && !videoStarted) {
      setVideoStarted(true);
      videoRef.current.playAsync().catch((error) => {
        console.error('Video play error:', error);
        setHasError(true);
        // If video fails, proceed after a short delay
        setTimeout(() => onFinish(), 1500);
      });
    }
  };

  const handleError = (error: any) => {
    console.error('Video error:', error);
    setHasError(true);
    // Proceed after short delay if video fails
    setTimeout(() => onFinish(), 1500);
  };

  if (!mounted) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!hasError && mounted ? (
        <Video
          ref={videoRef}
          source={require('@/assets/videos/LogoAnimation-NI.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping={false}
          isMuted={false}
          onLoad={handleLoad}
          onError={handleError}
          onPlaybackStatusUpdate={(status) => {
            setPlaybackStatus(status);
          }}
        />
      ) : (
        <ActivityIndicator size="large" color={COLORS.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
