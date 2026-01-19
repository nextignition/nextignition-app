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
      console.warn('Video timeout, proceeding to login...');
      onFinish();
    }, 5000); // 5 second maximum timeout (reduced from 8s)

    return () => clearTimeout(timeout);
  }, [onFinish]);

  const handleLoad = () => {
    try {
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
    } catch (error) {
      console.error('Splash screen load error:', error);
      setHasError(true);
      setTimeout(() => onFinish(), 1500);
    }
  };

  const handleError = (error: any) => {
    try {
      console.error('Video error:', error);
      setHasError(true);
      // Proceed after short delay if video fails
      setTimeout(() => onFinish(), 1500);
    } catch (err) {
      console.error('Error handler error:', err);
      // Last resort - just proceed
      onFinish();
    }
  };

  if (!mounted) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If there's an error or video fails, show loading and proceed quickly
  if (hasError) {
    // Auto-proceed after showing loading briefly
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mounted ? (
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
            try {
              setPlaybackStatus(status);
            } catch (error) {
              console.error('Playback status update error:', error);
            }
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
