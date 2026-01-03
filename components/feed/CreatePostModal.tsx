import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
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
import { FeedPostType } from '@/hooks/useFeed';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onCreatePost: (data: { type: FeedPostType; content: string; company_name?: string }) => Promise<void>;
}

const POST_TYPES: Array<{ value: FeedPostType; label: string; icon: any; color: string }> = [
  { value: 'funding', label: 'Funding', icon: TrendingUp, color: COLORS.success },
  { value: 'event', label: 'Event', icon: Calendar, color: COLORS.primary },
  { value: 'achievement', label: 'Achievement', icon: Award, color: COLORS.warning },
  { value: 'milestone', label: 'Milestone', icon: Target, color: COLORS.accent },
  { value: 'announcement', label: 'Announcement', icon: Megaphone, color: COLORS.primary },
  { value: 'onboarding', label: 'Welcome', icon: Users, color: COLORS.accent },
];

export function CreatePostModal({ visible, onClose, onCreatePost }: CreatePostModalProps) {
  const [selectedType, setSelectedType] = useState<FeedPostType>('announcement');
  const [content, setContent] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

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
      await onCreatePost({
        type: selectedType,
        content: content.trim(),
        company_name: companyName.trim() || undefined,
      });
      // Reset form
      setContent('');
      setCompanyName('');
      setSelectedType('announcement');
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setContent('');
      setCompanyName('');
      setSelectedType('announcement');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Post</Text>
            <TouchableOpacity onPress={handleClose} disabled={loading} style={styles.closeButton}>
              <X size={24} color={COLORS.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Post Type Selection */}
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
                      disabled={loading}>
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

            {/* Company Name (Optional) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Company Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter company name"
                placeholderTextColor={COLORS.textSecondary}
                value={companyName}
                onChangeText={setCompanyName}
                editable={!loading}
                maxLength={100}
              />
            </View>

            {/* Post Content */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's on your mind?</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Share your thoughts, achievements, or updates..."
                placeholderTextColor={COLORS.textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!loading}
                maxLength={1000}
              />
              <Text style={styles.charCount}>{content.length}/1000</Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, loading && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={loading || !content.trim()}>
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={styles.createButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    padding: SPACING.lg,
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
  input: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  textArea: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: 120,
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
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
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

