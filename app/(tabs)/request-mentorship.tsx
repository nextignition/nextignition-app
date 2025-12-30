import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Picker } from '@/components/Picker';
import { DateTimePicker } from '@/components/DateTimePicker';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  GRADIENTS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import {
  Award,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  UserRound,
  AlertCircle,
} from 'lucide-react-native';
import { useExperts } from '@/hooks/useExperts';
import { useMentorshipAvailability } from '@/hooks/useMentorshipAvailability';
import { useMentorshipRequests } from '@/hooks/useMentorshipRequests';

const DURATION_OPTIONS = [
  { label: '30 minutes', value: '30' },
  { label: '1 hour', value: '60' },
  { label: '1.5 hours', value: '90' },
  { label: '2 hours', value: '120' },
];

const TOPIC_OPTIONS = [
  { label: 'Product Strategy', value: 'Product Strategy' },
  { label: 'Go-to-Market', value: 'Go-to-Market' },
  { label: 'Fundraising', value: 'Fundraising' },
  { label: 'Financial Planning', value: 'Financial Planning' },
  { label: 'Marketing & Growth', value: 'Marketing & Growth' },
  { label: 'Technical Architecture', value: 'Technical Architecture' },
  { label: 'Operations', value: 'Operations' },
  { label: 'Team Building', value: 'Team Building' },
  { label: 'Other', value: 'Other' },
];

export default function RequestMentorshipScreen() {
  const params = useLocalSearchParams();
  const { experts, loading: expertsLoading } = useExperts();
  const expertId = params.expertId as string;
  
  const [selectedExpert, setSelectedExpert] = useState(expertId || '');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [duration, setDuration] = useState('60');
  const [message, setMessage] = useState('');
  const [messageFocused, setMessageFocused] = useState(false);

  // Update selectedExpert when expertId from params changes
  useEffect(() => {
    if (expertId) {
      setSelectedExpert(expertId);
    }
  }, [expertId]);

  const selectedExpertData = experts.find((e) => e.id === selectedExpert);
  
  // Fetch availability slots for selected expert
  const {
    availableSlots,
    loading: slotsLoading,
    error: slotsError,
    getAvailableDates,
    getAvailableTimesForDate,
  } = useMentorshipAvailability(selectedExpert);

  const { createRequest, loading: requestLoading } = useMentorshipRequests();

  // Get available dates
  const availableDates = useMemo(() => getAvailableDates(), [getAvailableDates]);

  // Get available times for selected date
  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];
    
    const slots = getAvailableTimesForDate(selectedDate);
    return slots.map(slot => ({
      label: new Date(slot.start_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      value: slot.id,
      slot: slot,
    }));
  }, [selectedDate, getAvailableTimesForDate]);

  // Reset time selection when date changes
  useEffect(() => {
    setSelectedSlotId('');
  }, [selectedDate]);

  // Show error if expert ID is provided but expert not found
  useEffect(() => {
    if (expertId && !expertsLoading && experts.length > 0 && !selectedExpertData) {
      Alert.alert('Expert Not Found', 'The selected expert could not be found. Please go back and try again.');
    }
  }, [expertId, expertsLoading, experts, selectedExpertData]);

  const handleSendRequest = async () => {
    if (!selectedExpert || !topic || !selectedSlotId) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }

    try {
      // Find the selected slot
      const selectedSlot = availableSlots.find(s => s.id === selectedSlotId);
      if (!selectedSlot) {
        Alert.alert('Error', 'Selected time slot not found');
        return;
      }

      console.log('🚀 Creating mentorship request...', {
        expert_id: selectedExpert,
        topic,
        duration: parseInt(duration),
        slot: selectedSlotId,
      });

      // Create the request
      const result = await createRequest({
        expert_id: selectedExpert,
        topic: topic,
        custom_topic: topic === 'Other' ? customTopic : undefined,
        message: message || undefined,
        duration_minutes: parseInt(duration),
        availability_slot_id: selectedSlotId,
        requested_start_time: selectedSlot.start_time,
        requested_end_time: selectedSlot.end_time,
      });

      console.log('✅ Request created successfully!', result);

      // Show success feedback
      if (Platform.OS === 'web') {
        // For web, show a brief alert that auto-closes
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
          font-weight: 500;
        `;
        alertDiv.textContent = '✓ Request sent successfully!';
        document.body.appendChild(alertDiv);
        setTimeout(() => {
          alertDiv.remove();
        }, 2000);
      }

      // Small delay to show success message before navigating
      setTimeout(() => {
        router.replace({
          pathname: '/(tabs)/mentorship',
          params: { tab: 'sessions' }
        });
      }, Platform.OS === 'web' ? 500 : 0);
    } catch (err: any) {
      console.error('❌ Error sending request:', err);
      Alert.alert('Error', err.message || 'Failed to send request. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LinearGradient colors={GRADIENTS.accent} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Request Mentorship</Text>
              <Text style={styles.heroSubtitle}>
                Connect with an expert for guidance
              </Text>
            </View>
          </View>
        </LinearGradient>

        {selectedExpertData && (
          <View style={styles.selectedExpertCard}>
            <View style={styles.selectedExpertHeader}>
              <View style={styles.selectedExpertIcon}>
                <Award size={24} color={COLORS.primary} strokeWidth={2} />
              </View>
              <View style={styles.selectedExpertInfo}>
                <Text style={styles.selectedExpertName}>{selectedExpertData.name}</Text>
                <Text style={styles.selectedExpertExpertise}>{selectedExpertData.expertise}</Text>
              </View>
            </View>
          </View>
        )}

        {!expertId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Expert</Text>
            {expertsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading experts...</Text>
              </View>
            ) : experts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Award size={48} color={COLORS.textSecondary} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No experts available</Text>
                <Text style={styles.emptySubtitle}>
                  Check back later for available mentors
                </Text>
              </View>
            ) : (
              <View style={styles.expertsList}>
                {experts.map((expert) => (
                  <TouchableOpacity
                    key={expert.id}
                    style={[
                      styles.expertCard,
                      selectedExpert === expert.id && styles.expertCardActive,
                    ]}
                    onPress={() => setSelectedExpert(expert.id)}
                    activeOpacity={0.7}>
                    <View style={styles.expertIcon}>
                      <UserRound size={20} color={selectedExpert === expert.id ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
                    </View>
                    <View style={styles.expertInfo}>
                      <Text
                        style={[
                          styles.expertName,
                          selectedExpert === expert.id && styles.expertNameActive,
                        ]}>
                        {expert.name}
                      </Text>
                      <Text style={styles.expertExpertise}>{expert.expertise}</Text>
                    </View>
                    {selectedExpert === expert.id && (
                      <CheckCircle size={20} color={COLORS.primary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Topic / Area of Help</Text>
            <Picker
              label="Topic / Area of Help"
              value={topic}
              onValueChange={setTopic}
              items={TOPIC_OPTIONS}
              placeholder="Select topic"
            />
          </View>
          {topic === 'Other' && (
            <Input
              label="Custom Topic"
              value={customTopic}
              onChangeText={setCustomTopic}
              placeholder="Describe what you need help with"
            />
          )}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Duration</Text>
            <Picker
              label="Duration"
              value={duration}
              onValueChange={setDuration}
              items={DURATION_OPTIONS}
              placeholder="Select duration"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          
          {slotsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading available slots...</Text>
            </View>
          ) : slotsError ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color={COLORS.error} strokeWidth={2} />
              <Text style={styles.errorText}>{slotsError}</Text>
            </View>
          ) : availableSlots.length === 0 ? (
            <View style={styles.infoCard}>
              <AlertCircle size={20} color={COLORS.warning} strokeWidth={2} />
              <Text style={styles.infoText}>
                This expert has no available time slots at the moment. Please check back later or try another expert.
              </Text>
            </View>
          ) : (
            <>
              <DateTimePicker
                label="Preferred Date"
                value={selectedDate}
                onValueChange={setSelectedDate}
                mode="date"
                placeholder="Select a date"
                minDate={new Date()}
                availableDates={availableDates}
              />
              
              {selectedDate && availableTimes.length > 0 && (
                <DateTimePicker
                  label="Preferred Time"
                  value={selectedSlotId}
                  onValueChange={setSelectedSlotId}
                  mode="time"
                  placeholder={availableTimes.length === 0 ? 'No slots available' : 'Select a time'}
                  availableTimes={availableTimes}
                />
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message (Optional)</Text>
          <View style={[
            styles.messageInputContainer,
            messageFocused && styles.messageInputContainerFocused
          ]}>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Brief description of what you'd like to discuss..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => setMessageFocused(true)}
              onBlur={() => setMessageFocused(false)}
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <CheckCircle size={20} color={COLORS.primary} strokeWidth={2} />
          <Text style={styles.infoText}>
            The expert will review your request and respond within 24-48 hours. You&apos;ll
            receive a notification when they respond.
          </Text>
        </View>

        <Button
          title="Send Request"
          onPress={handleSendRequest}
          loading={requestLoading}
          disabled={
            requestLoading ||
            !selectedExpert ||
            !topic ||
            !selectedSlotId ||
            availableSlots.length === 0
          }
          style={styles.sendButton}
        />
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
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.background,
    marginBottom: SPACING.xs / 2,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.85)',
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  expertsList: {
    gap: SPACING.md,
  },
  expertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  expertCardActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  expertIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  expertNameActive: {
    color: COLORS.primary,
  },
  expertExpertise: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  pickerContainer: {
    gap: SPACING.sm,
  },
  pickerLabel: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZES.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.primaryLight + '30',
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  sendButton: {
    marginTop: SPACING.sm,
  },
  loadingContainer: {
    padding: SPACING.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.error + '10',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    flex: 1,
    lineHeight: 20,
  },
  emptyContainer: {
    padding: SPACING.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  selectedExpertCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primaryLight + '30',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    marginBottom: SPACING.lg,
    marginHorizontal: SPACING.lg,
  },
  selectedExpertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  selectedExpertIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedExpertInfo: {
    flex: 1,
  },
  selectedExpertName: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  selectedExpertExpertise: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  messageInputContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    minHeight: 120,
    padding: SPACING.md,
    ...SHADOWS.md,
    marginTop: SPACING.sm,
  },
  messageInputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2.5,
    backgroundColor: COLORS.background,
    ...SHADOWS.lg,
  },
  messageInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
    padding: 0,
  },
});

