import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, TrendingUp, Calendar, Users, Award, Target, Megaphone } from 'lucide-react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { FeedPostType, useFeed } from '@/hooks/useFeed';

const POST_TYPES: Array<{ value: FeedPostType; label: string; icon: any; color: string }> = [
  { value: 'funding', label: 'Funding', icon: TrendingUp, color: COLORS.success },
  { value: 'event', label: 'Event', icon: Calendar, color: COLORS.primary },
  { value: 'achievement', label: 'Achievement', icon: Award, color: COLORS.warning },
  { value: 'milestone', label: 'Milestone', icon: Target, color: COLORS.accent },
  { value: 'announcement', label: 'Announcement', icon: Megaphone, color: COLORS.primary },
  { value: 'onboarding', label: 'Welcome', icon: Users, color: COLORS.accent },
];

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const { createPost } = useFeed();

  const [selectedType, setSelectedType] = useState<FeedPostType>('announcement');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const canPost = useMemo(() => content.trim().length > 0 && content.trim().length <= 1000, [content]);

  const handleClose = () => {
    if (loading) return;
    router.back();
  };

  const handleCreate = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }
    if (content.length > 1000) {
      Alert.alert('Error', 'Post content cannot exceed 1000 characters');
      return;
    }

    try {
      setLoading(true);
      await createPost({
        type: selectedType,
        content: content.trim(),
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Post</Text>
          <TouchableOpacity onPress={handleClose} disabled={loading} style={styles.closeButton} activeOpacity={0.7}>
            <X size={24} color={COLORS.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Post Type</Text>
            <View style={styles.typeGrid}>
              {POST_TYPES.map((type) => {
                const IconComponent = type.icon;
                const isSelected = selectedType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      isSelected && { backgroundColor: `${type.color}15`, borderColor: type.color },
                    ]}
                    onPress={() => setSelectedType(type.value)}
                    disabled={loading}
                    activeOpacity={0.8}>
                    <View style={[styles.typeIcon, { backgroundColor: `${type.color}20` }]}>
                      <IconComponent size={20} color={type.color} strokeWidth={2} />
                    </View>
                    <Text style={[styles.typeLabel, isSelected && { color: type.color }]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's on your mind?</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Share your thoughts, achievements, or updates..."
              placeholderTextColor={COLORS.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              editable={!loading}
              maxLength={1000}
            />
            <Text style={styles.charCount}>{content.length}/1000</Text>
          </View>
        </ScrollView>

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
          <TouchableOpacity
            style={[styles.cancelButton, loading && styles.buttonDisabled]}
            onPress={handleClose}
            disabled={loading}
            activeOpacity={0.8}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, (!canPost || loading) && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={!canPost || loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Text style={styles.createButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  typeOption: {
    width: '30%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    ...SHADOWS.xs,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    ...TYPOGRAPHY.caption,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text,
    textAlign: 'center',
  },
  textArea: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: 180,
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  createButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  createButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.background,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});


