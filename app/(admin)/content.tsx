import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  GRADIENTS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import {
  FileText,
  Video,
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Flag,
  Trash2,
} from 'lucide-react-native';

type ContentType = 'all' | 'profiles' | 'pitch_decks' | 'pitch_videos';
type ContentStatus = 'all' | 'pending' | 'approved' | 'flagged';

interface ContentItem {
  id: string;
  type: 'profile' | 'pitch_deck' | 'pitch_video';
  title: string;
  owner: string;
  status: 'pending' | 'approved' | 'flagged';
  createdAt: string;
}

const MOCK_CONTENT: ContentItem[] = [
  {
    id: '1',
    type: 'profile',
    title: 'TechStart Inc - Startup Profile',
    owner: 'John Smith',
    status: 'pending',
    createdAt: '2024-01-20',
  },
  {
    id: '2',
    type: 'pitch_deck',
    title: 'Series A Pitch Deck',
    owner: 'Sarah Johnson',
    status: 'approved',
    createdAt: '2024-01-19',
  },
  {
    id: '3',
    type: 'pitch_video',
    title: 'Elevator Pitch Video',
    owner: 'Michael Chen',
    status: 'flagged',
    createdAt: '2024-01-18',
  },
  {
    id: '4',
    type: 'profile',
    title: 'Innovate Labs - Startup Profile',
    owner: 'Emily Davis',
    status: 'approved',
    createdAt: '2024-01-17',
  },
];

export default function AdminContentScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [statusFilter, setStatusFilter] = useState<ContentStatus>('all');
  const [content, setContent] = useState(MOCK_CONTENT);

  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.owner.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = contentType === 'all' || 
                         (contentType === 'profiles' && item.type === 'profile') ||
                         (contentType === 'pitch_decks' && item.type === 'pitch_deck') ||
                         (contentType === 'pitch_videos' && item.type === 'pitch_video');
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [content, searchQuery, contentType, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'flagged': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'profile': return Building2;
      case 'pitch_deck': return FileText;
      case 'pitch_video': return Video;
      default: return FileText;
    }
  };

  const handleApprove = (id: string) => {
    setContent(content.map(item => 
      item.id === id ? { ...item, status: 'approved' as const } : item
    ));
  };

  const handleFlag = (id: string) => {
    setContent(content.map(item => 
      item.id === id ? { ...item, status: 'flagged' as const } : item
    ));
  };

  const handleRemove = (id: string) => {
    setContent(content.filter(item => item.id !== id));
  };

  const stats = {
    total: content.length,
    profiles: content.filter(i => i.type === 'profile').length,
    pitchDecks: content.filter(i => i.type === 'pitch_deck').length,
    pitchVideos: content.filter(i => i.type === 'pitch_video').length,
    pending: content.filter(i => i.status === 'pending').length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#1a1f2e', '#0f1419']} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <FileText size={28} color={COLORS.accent} strokeWidth={2} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Content Management</Text>
              <Text style={styles.heroSubtitle}>
                Manage startup profiles and pitch materials
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.profiles}</Text>
            <Text style={styles.statLabel}>Profiles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.pitchDecks}</Text>
            <Text style={styles.statLabel}>Decks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.pitchVideos}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersCard}>
          <View style={styles.searchBox}>
            <Search size={20} color={COLORS.textSecondary} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search content..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {(['all', 'profiles', 'pitch_decks', 'pitch_videos'] as ContentType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, contentType === type && styles.chipActive]}
                    onPress={() => setContentType(type)}>
                    <Text style={[styles.chipText, contentType === type && styles.chipTextActive]}>
                      {type === 'all' ? 'All' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {(['all', 'pending', 'approved', 'flagged'] as ContentStatus[]).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.chip, statusFilter === status && styles.chipActive]}
                    onPress={() => setStatusFilter(status)}>
                    <Text style={[styles.chipText, statusFilter === status && styles.chipTextActive]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Content List */}
        <View style={styles.contentList}>
          {filteredContent.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color={COLORS.textSecondary} strokeWidth={1.5} />
              <Text style={styles.emptyStateText}>No content found</Text>
            </View>
          ) : (
            filteredContent.map((item) => {
              const Icon = getContentIcon(item.type);
              return (
                <View key={item.id} style={styles.contentCard}>
                  <View style={styles.contentHeader}>
                    <View style={styles.contentIcon}>
                      <Icon size={24} color={COLORS.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.contentInfo}>
                      <Text style={styles.contentTitle}>{item.title}</Text>
                      <Text style={styles.contentMeta}>
                        {item.owner} • {item.createdAt}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.contentActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Eye size={18} color={COLORS.text} strokeWidth={2} />
                      <Text style={styles.actionText}>View</Text>
                    </TouchableOpacity>
                    {item.status !== 'approved' && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleApprove(item.id)}>
                        <CheckCircle size={18} color={COLORS.success} strokeWidth={2} />
                        <Text style={[styles.actionText, { color: COLORS.success }]}>Approve</Text>
                      </TouchableOpacity>
                    )}
                    {item.status !== 'flagged' && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleFlag(item.id)}>
                        <Flag size={18} color={COLORS.warning} strokeWidth={2} />
                        <Text style={[styles.actionText, { color: COLORS.warning }]}>Flag</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleRemove(item.id)}>
                      <Trash2 size={18} color={COLORS.error} strokeWidth={2} />
                      <Text style={[styles.actionText, { color: COLORS.error }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
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
    gap: SPACING.lg,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    gap: SPACING.xs,
  },
  heroTitle: {
    ...TYPOGRAPHY.heading,
    fontFamily: FONT_FAMILY.displayBold,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statCardHighlight: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning + '10',
  },
  statValue: {
    ...TYPOGRAPHY.heading,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.text,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  filtersCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  filterRow: {
    gap: SPACING.sm,
  },
  filterLabel: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text,
  },
  filterChips: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  contentList: {
    gap: SPACING.md,
  },
  contentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  contentIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  contentTitle: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text,
  },
  contentMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    textTransform: 'capitalize',
  },
  contentActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  actionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl * 2,
    gap: SPACING.md,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});
