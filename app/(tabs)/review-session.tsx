import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
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
  Star,
  Award,
  CheckCircle,
  MessageSquare,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface SessionDetails {
  id: string;
  expert: {
    full_name: string;
    expertise_areas: string[];
  };
  topic: string;
  requested_start_time: string;
  duration_minutes: number;
  founder_rating: number | null;
  founder_review: string | null;
}

export default function ReviewSessionScreen() {
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviewFocused, setReviewFocused] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('mentorship_requests')
        .select(`
          id,
          topic,
          requested_start_time,
          duration_minutes,
          founder_rating,
          founder_review,
          expert:profiles!mentorship_requests_expert_id_fkey(
            full_name,
            expertise_areas
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Session not found');

      // Check if already reviewed
      if (data.founder_rating && data.founder_review) {
        Alert.alert(
          'Already Reviewed',
          'You have already reviewed this session.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      setSession(data);
    } catch (err: any) {
      console.error('Error fetching session:', err);
      Alert.alert('Error', 'Failed to load session details', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    if (!review.trim()) {
      Alert.alert('Review Required', 'Please write a review');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('mentorship_requests')
        .update({
          founder_rating: rating,
          founder_review: review.trim(),
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      console.log('✅ Review submitted successfully!');

      // Show success notification
      if (Platform.OS === 'web') {
        // Create a custom toast notification for web
        const toast = document.createElement('div');
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 500;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideDown 0.3s ease-out;
        `;
        toast.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Review submitted successfully!</span>
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
          toast.style.animation = 'slideDown 0.3s ease-out reverse';
          setTimeout(() => {
            toast.remove();
            style.remove();
          }, 300);
        }, 3000);
      } else {
        // For mobile, use Alert
        Alert.alert(
          'Review Submitted!',
          'Thank you for your feedback. Your review helps other founders find great mentors.',
          [{ text: 'OK' }]
        );
      }

      // Redirect to mentorship page with reviews tab active
      router.replace({
        pathname: '/(tabs)/mentorship',
        params: { tab: 'reviews' }
      });
    } catch (err: any) {
      console.error('Error submitting review:', err);
      Alert.alert('Error', err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LinearGradient colors={GRADIENTS.accent || ['#F78405', '#FF9E2C']} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <Star size={28} color={COLORS.background} strokeWidth={2} fill={COLORS.background} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Rate Your Session</Text>
              <Text style={styles.heroSubtitle}>
                Help others by sharing your experience
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View style={styles.expertIcon}>
              <Award size={24} color={COLORS.primary} strokeWidth={2} />
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.expertName}>{session.expert.full_name}</Text>
              <Text style={styles.expertise}>
                {session.expert.expertise_areas?.join(', ') || 'Expert'}
              </Text>
            </View>
            <View style={styles.completedBadge}>
              <CheckCircle size={16} color={COLORS.success} strokeWidth={2} />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          </View>
          
          <View style={styles.sessionDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Topic:</Text>
              <Text style={styles.detailValue}>{session.topic}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>
                {new Date(session.requested_start_time).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{session.duration_minutes} minutes</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rating</Text>
          <Text style={styles.sectionSubtitle}>
            How would you rate your experience with this mentor?
          </Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starButton}>
                <Star
                  size={48}
                  color={star <= rating ? COLORS.warning : COLORS.border}
                  fill={star <= rating ? COLORS.warning : 'none'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Review</Text>
          <Text style={styles.sectionSubtitle}>
            Share your experience to help other founders
          </Text>
          <View
            style={[
              styles.reviewInputContainer,
              reviewFocused && styles.reviewInputContainerFocused,
            ]}>
            <TextInput
              style={styles.reviewInput}
              value={review}
              onChangeText={setReview}
              placeholder="What did you like about this session? What could be improved?"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              onFocus={() => setReviewFocused(true)}
              onBlur={() => setReviewFocused(false)}
              maxLength={500}
            />
          </View>
          <Text style={styles.characterCount}>{review.length}/500</Text>
        </View>

        <View style={styles.infoCard}>
          <MessageSquare size={20} color={COLORS.primary} strokeWidth={2} />
          <Text style={styles.infoText}>
            Your review will be visible to other founders and will help them choose the right mentor.
            Reviews are anonymous and cannot be edited after submission.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Button
            title="Submit Review"
            onPress={handleSubmitReview}
            loading={submitting}
            disabled={submitting || rating === 0 || !review.trim()}
            style={styles.submitButton}
          />
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
  sessionCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  expertIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  expertName: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  expertise: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success + '20',
  },
  completedText: {
    ...TYPOGRAPHY.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  sessionDetails: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.textSecondary,
    width: 90,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  starButton: {
    padding: SPACING.xs,
  },
  ratingText: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.warning,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  reviewInputContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    minHeight: 150,
    padding: SPACING.md,
    ...SHADOWS.sm,
    marginTop: SPACING.sm,
  },
  reviewInputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    ...SHADOWS.md,
  },
  reviewInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 22,
    minHeight: 130,
    textAlignVertical: 'top',
    padding: 0,
  },
  characterCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.primaryLight + '20',
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
    fontSize: FONT_SIZES.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  submitButton: {
    flex: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});

