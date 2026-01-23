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
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { useMentorshipAvailability } from '@/hooks/useMentorshipAvailability';
import { DateTimePicker } from '@/components/DateTimePicker';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function AvailabilityScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [creating, setCreating] = useState(false);

  const {
    slots,
    loading,
    error,
    fetchSlots,
    createSlot,
    deleteSlot,
    availableSlots,
  } = useMentorshipAvailability(userId || undefined);

  // Fetch all slots (including booked) for expert's own availability management
  useEffect(() => {
    if (userId) {
      fetchSlots(false); // Fetch all slots, not just available
    }
  }, [userId]);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserRole(profile?.role || null);
      }
    };
    fetchUser();
  }, []);

  // Redirect non-experts
  useEffect(() => {
    if (userRole && userRole !== 'expert') {
      Alert.alert('Access Denied', 'Only experts can manage availability', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [userRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSlots();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Generate all time options (9 AM to 9 PM in 30-minute intervals)
  const generateAllTimeOptions = () => {
    const times: { label: string; value: string }[] = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const timeLabel = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
        times.push({ label: timeLabel, value: time24 });
      }
    }
    return times;
  };

  // Generate start time options - filter out past times if date is today
  const startTimeOptions = useMemo(() => {
    const allTimes = generateAllTimeOptions();
    
    // If no date selected, return all times
    if (!selectedDate) {
      return allTimes;
    }

    // Check if selected date is today
    const today = new Date();
    const selectedDateObj = new Date(selectedDate);
    const isToday = 
      selectedDateObj.getFullYear() === today.getFullYear() &&
      selectedDateObj.getMonth() === today.getMonth() &&
      selectedDateObj.getDate() === today.getDate();

    if (!isToday) {
      // If not today, return all times
      return allTimes;
    }

    // If today, filter out past times
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    return allTimes.filter(time => {
      const [hour, minute] = time.value.split(':').map(Number);
      const timeMinutes = hour * 60 + minute;
      // Include times that are at least 30 minutes in the future
      return timeMinutes >= currentTimeMinutes + 30;
    });
  }, [selectedDate]);

  // Generate end time options - only show times after selected start time
  const endTimeOptions = useMemo(() => {
    const allTimes = generateAllTimeOptions();
    
    // If no start time selected, return all times
    if (!startTime) {
      return allTimes;
    }

    // Filter to only show times after the selected start time
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTimeMinutes = startHour * 60 + startMinute;

    return allTimes.filter(time => {
      const [hour, minute] = time.value.split(':').map(Number);
      const timeMinutes = hour * 60 + minute;
      // End time must be at least 30 minutes after start time
      return timeMinutes > startTimeMinutes;
    });
  }, [startTime]);

  // Reset end time if it's no longer valid after start time changes
  useEffect(() => {
    if (startTime && endTime) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;

      // If end time is before or equal to start time, clear it
      if (endTimeMinutes <= startTimeMinutes) {
        setEndTime('');
      }
    }
  }, [startTime, endTime]);

  const handleCreateSlot = async () => {
    if (!selectedDate || !startTime || !endTime) {
      Alert.alert('Required Fields', 'Please select date, start time, and end time');
      return;
    }

    try {
      setCreating(true);

      // Combine date and time
      const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
      const endDateTime = new Date(`${selectedDate}T${endTime}:00`);

      if (endDateTime <= startDateTime) {
        Alert.alert('Invalid Time', 'End time must be after start time');
        return;
      }

      await createSlot({
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      });

      Alert.alert('Success', 'Availability slot created successfully');
      
      // Reset form
      setSelectedDate('');
      setStartTime('');
      setEndTime('');
      setShowAddForm(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create slot');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    Alert.alert(
      'Delete Slot',
      'Are you sure you want to delete this availability slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSlot(slotId);
              Alert.alert('Deleted', 'Slot removed successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete slot');
            }
          },
        },
      ]
    );
  };

  if (userRole !== 'expert') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }>
        <LinearGradient colors={GRADIENTS.primary as any} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <Calendar size={28} color={COLORS.background} strokeWidth={2} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Manage Availability</Text>
              <Text style={styles.heroSubtitle}>
                Set your available time slots for mentorship sessions
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{slots.length}</Text>
            <Text style={styles.statLabel}>Total Slots</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{availableSlots.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{slots.length - availableSlots.length}</Text>
            <Text style={styles.statLabel}>Booked</Text>
          </View>
        </View>

        {!showAddForm ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
            activeOpacity={0.7}>
            <Plus size={20} color={COLORS.background} strokeWidth={2} />
            <Text style={styles.addButtonText}>Add Availability Slot</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addForm}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>New Availability Slot</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  setSelectedDate('');
                  setStartTime('');
                  setEndTime('');
                }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              label="Date"
              value={selectedDate}
              onValueChange={setSelectedDate}
              mode="date"
              placeholder="Select date"
              minDate={new Date()}
            />

            <DateTimePicker
              label="Start Time"
              value={startTime}
              onValueChange={setStartTime}
              mode="time"
              placeholder="Select start time"
              availableTimes={startTimeOptions}
            />

            <DateTimePicker
              label="End Time"
              value={endTime}
              onValueChange={setEndTime}
              mode="time"
              placeholder="Select end time"
              availableTimes={endTimeOptions}
            />

            <Button
              title="Create Slot"
              onPress={handleCreateSlot}
              loading={creating}
              disabled={creating || !selectedDate || !startTime || !endTime}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Availability Slots</Text>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading slots...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={24} color={COLORS.error} strokeWidth={2} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => fetchSlots()} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : slots.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={48} color={COLORS.textSecondary} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No availability slots</Text>
              <Text style={styles.emptySubtitle}>
                Add your first availability slot to start accepting mentorship requests
              </Text>
            </View>
          ) : (
            <View style={styles.slotsList}>
              {slots.map((slot) => (
                <View
                  key={slot.id}
                  style={[styles.slotCard, slot.is_booked && styles.slotCardBooked]}>
                  <View style={styles.slotHeader}>
                    <View style={styles.slotIcon}>
                      {slot.is_booked ? (
                        <CheckCircle size={20} color={COLORS.success} strokeWidth={2} />
                      ) : (
                        <Clock size={20} color={COLORS.primary} strokeWidth={2} />
                      )}
                    </View>
                    <View style={styles.slotInfo}>
                      <Text style={styles.slotDate}>
                        {new Date(slot.start_time).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.slotTime}>
                        {new Date(slot.start_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}{' '}
                        -{' '}
                        {new Date(slot.end_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </Text>
                    </View>
                    {slot.is_booked ? (
                      <View style={styles.bookedBadge}>
                        <Text style={styles.bookedText}>Booked</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleDeleteSlot(slot.id)}
                        style={styles.deleteButton}
                        activeOpacity={0.7}>
                        <Trash2 size={18} color={COLORS.error} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.primary,
    marginBottom: SPACING.xs / 2,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  addButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  addForm: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  formTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  cancelText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
  },
  pickerContainer: {
    gap: SPACING.sm,
  },
  pickerLabel: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    fontSize: FONT_SIZES.md,
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  slotsList: {
    gap: SPACING.md,
  },
  slotCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  slotCardBooked: {
    backgroundColor: COLORS.surfaceMuted,
    opacity: 0.7,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  slotIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotInfo: {
    flex: 1,
  },
  slotDate: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  slotTime: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  bookedBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success + '20',
  },
  bookedText: {
    ...TYPOGRAPHY.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  deleteButton: {
    padding: SPACING.xs,
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
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.error + '10',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  emptyContainer: {
    // Mobile-friendly empty state spacing/alignment (keep consistent across app)
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      maxWidth: 520,
    }),
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
});

