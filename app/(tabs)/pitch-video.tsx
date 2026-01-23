import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Video as ExpoVideo, AVPlaybackStatus } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { Video, Play, Pause, Upload, CheckCircle, Clock } from 'lucide-react-native';
import { usePitchMaterials } from '@/hooks/usePitchMaterials';
import { useAuth } from '@/contexts/AuthContext';
import { showAlert } from '@/utils/platformAlert';
import { useMicrophonePermissions } from 'expo-camera';
import { useNotification } from '@/hooks/useNotification';
import { NotificationContainer } from '@/components/NotificationContainer';

export default function PitchVideoScreen() {
  const { profile, user } = useAuth();
  const params = useLocalSearchParams();
  const { uploadPitchMaterial, refresh } = usePitchMaterials();
  const { notifications, showSuccess, showError, dismissNotification } = useNotification();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [recording, setRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<ExpoVideo>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef(false);
  const [playbackStatus, setPlaybackStatus] = useState<AVPlaybackStatus | null>(null);

  const MAX_DURATION = 120; // 2 minutes

  useEffect(() => {
    // Request permissions on mount
    const requestPermissions = async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      if (!microphonePermission?.granted) {
        await requestMicrophonePermission();
      }
    };
    requestPermissions();
  }, []);

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset video to start when preview is shown
    if (showPreview && videoRef.current && recordedVideo) {
      videoRef.current.setPositionAsync(0);
    }
  }, [showPreview, recordedVideo]);

  const startRecording = async () => {
    if (!cameraRef.current) {
      showAlert('Error', 'Camera not ready');
      return;
    }

    if (recordingRef.current) {
      console.log('Already recording, ignoring start');
      return;
    }

    try {
      console.log('Starting recording...');
      recordingRef.current = true;
      setRecording(true);
      setTimeElapsed(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const newTime = prev + 1;
          if (newTime >= MAX_DURATION) {
            console.log('Max duration reached, stopping...');
            stopRecording();
            return MAX_DURATION;
          }
          return newTime;
        });
      }, 1000);

      // Start recording - this is non-blocking, it returns a promise that resolves when stopped
      console.log('Calling recordAsync...');
      cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION,
      }).then((video) => {
        console.log('Recording completed, video:', video);

        // This runs after recording stops
        recordingRef.current = false;
        setRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        if (video?.uri) {
          console.log('Video URI received:', video.uri);
          setRecordedVideo(video.uri);
          setShowPreview(false); // Don't show preview automatically, wait for button click
        } else {
          console.log('No video URI received');
        }
      }).catch((error: any) => {
        console.error('Recording error:', error);
        recordingRef.current = false;
        setRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Only show error if it's not a cancellation
        if (error.message && !error.message.includes('cancelled') && !error.message.includes('recording')) {
          showAlert('Error', 'Failed to record video: ' + error.message);
        }
      });

      console.log('Recording started successfully');
    } catch (error: any) {
      console.error('Start recording error:', error);
      recordingRef.current = false;
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      showAlert('Error', 'Failed to start recording: ' + error.message);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) {
      console.log('Not recording, ignoring stop');
      return;
    }

    if (cameraRef.current) {
      try {
        console.log('Stopping recording...');
        // This triggers the recordAsync promise to resolve
        cameraRef.current.stopRecording();
      } catch (error) {
        console.error('Stop recording error:', error);
        // Ensure state is cleaned up even on error
        recordingRef.current = false;
        setRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  };

  const handleStart = async () => {
    if (!cameraPermission?.granted) {
      showAlert('Permission Required', 'Please grant camera permission to record videos');
      await requestCameraPermission();
      return;
    }

    if (!microphonePermission?.granted) {
      showAlert('Permission Required', 'Please grant microphone permission to record videos with audio');
      await requestMicrophonePermission();
      return;
    }
    
    if (!cameraReady) {
      showAlert('Camera Not Ready', 'Please wait for camera to initialize');
      return;
    }

    startRecording();
  };

  const handleUpload = async () => {
    if (!recordedVideo) {
      showAlert('Error', 'Please record a video first');
      return;
    }

    if (!user?.id) {
      showAlert('Error', 'User not authenticated');
      return;
    }

    try {
      setUploading(true);

      console.log('Uploading video from URI:', recordedVideo);

      const fileName = `pitch-video-${Date.now()}.mp4`;

      // Upload video using usePitchMaterials hook - pass URI directly
      const result = await uploadPitchMaterial(
        'video',
        recordedVideo,
        fileName,
        visibility
      );

      if (result.success) {
        console.log('Upload successful');
        showSuccess('Pitch video uploaded successfully!');
        refresh();
        // Navigate back after a short delay to show notification
        setTimeout(() => {
          if (params.returnTo === 'funding-request') {
            // Return to funding page and reopen modal if needed
            router.push({
              pathname: '/(tabs)/funding',
              params: { 
                openCreateModal: params.preserveForm === 'true' ? 'true' : undefined,
                requestId: params.requestId,
              },
            });
          } else {
            router.back();
          }
        }, 1000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showError(error.message || 'Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRetake = () => {
    setRecordedVideo(null);
    setShowPreview(false);
    setTimeElapsed(0);
  };

  const handleShowPreview = () => {
    setShowPreview(true);
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setPlaybackStatus(status);
    
    // If video just finished, reset position to start when user plays again
    if (status.isLoaded && status.didJustFinish) {
      // Reset video position to start
      if (videoRef.current) {
        videoRef.current.setPositionAsync(0);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show permission request if not granted
  if (!cameraPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Checking permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted || !microphonePermission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Video size={64} color={COLORS.primary} strokeWidth={2} />
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionDescription}>
            We need access to your camera and microphone to record your pitch video
          </Text>
          <Button
            title="Grant Permissions"
            onPress={async () => {
              await requestCameraPermission();
              await requestMicrophonePermission();
            }}
            style={styles.permissionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Record Pitch Video</Text>
          <Text style={styles.headerSubtitle}>
            Create a 2-minute pitch video to showcase your startup
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Recording</Text>
          <View style={styles.cameraContainer}>
            {!recordedVideo ? (
              <>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                  mode="video"
                  onCameraReady={() => setCameraReady(true)}
                />
                {recording && (
                  <View style={styles.recordingOverlay}>
                    <View style={styles.recordingIndicator}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingTime}>{formatTime(timeElapsed)}</Text>
                    </View>
                  </View>
                )}
              </>
            ) : showPreview ? (
              <ExpoVideo
                ref={videoRef}
                source={{ uri: recordedVideo }}
                style={styles.camera}
                useNativeControls
                resizeMode="contain"
                isLooping={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              />
            ) : (
              <View style={styles.videoPreviewPlaceholder}>
                <Video size={64} color={COLORS.primary} strokeWidth={2} />
                <Text style={styles.videoPreviewPlaceholderText}>Video Recorded</Text>
                <Text style={styles.videoPreviewPlaceholderHint}>
                  Tap "Preview Video" to watch your recording
                </Text>
              </View>
            )}
          </View>

          {!recordedVideo && (
            <View style={styles.controls}>
              {!recording ? (
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={handleStart}
                  activeOpacity={0.7}>
                  <View style={styles.recordButtonInner} />
                  <Text style={styles.recordButtonText}>Start Recording</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={stopRecording}
                  activeOpacity={0.7}>
                  <Pause size={24} color={COLORS.background} strokeWidth={2} />
                  <Text style={styles.stopButtonText}>Stop Recording</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {recordedVideo && (
            <>
              {!showPreview && (
                <View style={styles.videoActions}>
                  <TouchableOpacity
                    style={styles.previewButton}
                    onPress={handleShowPreview}
                    activeOpacity={0.7}>
                    <Play size={20} color={COLORS.background} strokeWidth={2} />
                    <Text style={styles.previewButtonText}>Preview Video</Text>
                  </TouchableOpacity>
                </View>
              )}
              {showPreview && (
                <>
                  <Text style={styles.previewLabel}>Preview your video above</Text>
                  <View style={styles.videoActions}>
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={handleRetake}
                      activeOpacity={0.7}>
                      <Text style={styles.retakeButtonText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}

          {recordedVideo && showPreview && (
            <View style={styles.visibilityCard}>
              <Text style={styles.visibilityTitle}>Who can see this video?</Text>
              <View style={styles.visibilityOptions}>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === 'public' && styles.visibilityOptionActive,
                  ]}
                  onPress={() => setVisibility('public')}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.visibilityOptionText,
                      visibility === 'public' && styles.visibilityOptionTextActive,
                    ]}>
                    Public
                  </Text>
                  <Text style={styles.visibilityOptionHint}>
                    Visible to all investors
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.visibilityOption,
                    visibility === 'private' && styles.visibilityOptionActive,
                  ]}
                  onPress={() => setVisibility('private')}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.visibilityOptionText,
                      visibility === 'private' && styles.visibilityOptionTextActive,
                    ]}>
                    Private
                  </Text>
                  <Text style={styles.visibilityOptionHint}>Only you can see</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips for a great pitch:</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <CheckCircle size={16} color={COLORS.success} strokeWidth={2} />
              <Text style={styles.tipText}>Keep it under 2 minutes</Text>
            </View>
            <View style={styles.tipItem}>
              <CheckCircle size={16} color={COLORS.success} strokeWidth={2} />
              <Text style={styles.tipText}>Clearly explain your problem and solution</Text>
            </View>
            <View style={styles.tipItem}>
              <CheckCircle size={16} color={COLORS.success} strokeWidth={2} />
              <Text style={styles.tipText}>Show enthusiasm and passion</Text>
            </View>
            <View style={styles.tipItem}>
              <CheckCircle size={16} color={COLORS.success} strokeWidth={2} />
              <Text style={styles.tipText}>Practice before recording</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Clock size={20} color={COLORS.primary} strokeWidth={2} />
          <Text style={styles.infoText}>
            Maximum duration: 2 minutes. Your video will be reviewed before being made available
            to investors.
          </Text>
        </View>

        {recordedVideo && showPreview && (
          <Button
            title={uploading ? 'Uploading...' : 'Upload Video'}
            onPress={handleUpload}
            loading={uploading}
            disabled={uploading}
            style={styles.uploadButton}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.xl,
  },
  header: {
    gap: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.display,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.text,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  permissionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  permissionTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.text,
    textAlign: 'center',
  },
  permissionDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  permissionButton: {
    minWidth: 200,
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.navy,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.md,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cameraPlaceholderText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  cameraHint: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  videoPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    gap: SPACING.sm,
  },
  videoPreviewText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  videoPreviewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    gap: SPACING.md,
  },
  videoPreviewPlaceholderText: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.background,
  },
  videoPreviewPlaceholderHint: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  recordingOverlay: {
    position: 'absolute',
    top: SPACING.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
  },
  recordingTime: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  controls: {
    alignItems: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.md,
  },
  recordButtonInner: {
    width: 16,
    height: 16,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
  },
  recordButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.md,
  },
  stopButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  previewLabel: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  videoActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  retakeButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  playButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.md,
  },
  previewButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  visibilityCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  visibilityTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  visibilityOption: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
  },
  visibilityOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  visibilityOptionText: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  visibilityOptionTextActive: {
    color: COLORS.primary,
  },
  visibilityOptionHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  tipsCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  tipsTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  tipsList: {
    gap: SPACING.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  uploadButton: {
    marginTop: SPACING.md,
  },
});

