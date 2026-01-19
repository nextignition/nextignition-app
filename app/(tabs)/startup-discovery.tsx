import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
  Search,
  Filter,
  Building2,
  MapPin,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  Eye,
  MessageSquare,
  FileText,
  Video,
} from 'lucide-react-native';

const STARTUPS = [
  {
    id: '1',
    name: 'TechStart Inc',
    founder: 'John Smith',
    stage: 'Seed',
    industry: 'Technology',
    location: 'San Francisco, CA',
    fundingRequired: '$500K',
    description: 'AI-powered SaaS platform for enterprise automation',
    hasPitchDeck: true,
    hasPitchVideo: true,
    views: 45,
    bookmarked: false,
  },
  {
    id: '2',
    name: 'HealthTech Solutions',
    founder: 'Sarah Johnson',
    stage: 'Series A',
    industry: 'Healthcare',
    location: 'New York, NY',
    fundingRequired: '$2M',
    description: 'Telemedicine platform connecting patients with specialists',
    hasPitchDeck: true,
    hasPitchVideo: false,
    views: 32,
    bookmarked: true,
  },
  {
    id: '3',
    name: 'FinTech Innovations',
    founder: 'Michael Chen',
    stage: 'Seed',
    industry: 'Finance',
    location: 'Austin, TX',
    fundingRequired: '$750K',
    description: 'Blockchain-based payment solution for SMEs',
    hasPitchDeck: false,
    hasPitchVideo: true,
    views: 28,
    bookmarked: false,
  },
];

const STAGES = ['All', 'Idea', 'MVP', 'Seed', 'Series A', 'Series B', 'Growth'];
const INDUSTRIES = ['All', 'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce'];

export default function StartupDiscoveryScreen() {
  const [startups, setStartups] = useState(STARTUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const filteredStartups = useMemo(() => {
    return startups.filter((startup) => {
      const matchesSearch =
        startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.founder.toLowerCase().includes(searchQuery.toLowerCase()) ||
        startup.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStage = selectedStage === 'All' || startup.stage === selectedStage;
      const matchesIndustry = selectedIndustry === 'All' || startup.industry === selectedIndustry;
      return matchesSearch && matchesStage && matchesIndustry;
    });
  }, [startups, searchQuery, selectedStage, selectedIndustry]);

  const toggleBookmark = (id: string) => {
    setStartups(
      startups.map((startup) =>
        startup.id === id ? { ...startup, bookmarked: !startup.bookmarked } : startup
      )
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }>
        <LinearGradient colors={GRADIENTS.navy} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <Building2 size={28} color={COLORS.accent} strokeWidth={2} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Startup Discovery</Text>
              <Text style={styles.heroSubtitle}>
                Find and connect with promising startups
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color={COLORS.textSecondary} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search startups, founders, or keywords..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filtersSection}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Stage:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {STAGES.map((stage) => (
                <TouchableOpacity
                  key={stage}
                  style={[
                    styles.filterChip,
                    selectedStage === stage && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedStage(stage)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedStage === stage && styles.filterChipTextActive,
                    ]}>
                    {stage}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Industry:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {INDUSTRIES.map((industry) => (
                <TouchableOpacity
                  key={industry}
                  style={[
                    styles.filterChip,
                    selectedIndustry === industry && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedIndustry(industry)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedIndustry === industry && styles.filterChipTextActive,
                    ]}>
                    {industry}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>
            {filteredStartups.length} Startup{filteredStartups.length !== 1 ? 's' : ''} Found
          </Text>
          <View style={styles.startupsList}>
            {filteredStartups.map((startup) => (
              <TouchableOpacity
                key={startup.id}
                style={styles.startupCard}
                onPress={() => router.push(`/(tabs)/startup-detail?id=${startup.id}`)}
                activeOpacity={0.7}>
                <View style={styles.startupHeader}>
                  <View style={styles.startupIcon}>
                    <Building2 size={24} color={COLORS.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.startupInfo}>
                    <Text style={styles.startupName}>{startup.name}</Text>
                    <Text style={styles.startupFounder}>by {startup.founder}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.bookmarkButton}
                    onPress={() => toggleBookmark(startup.id)}
                    activeOpacity={0.7}>
                    {startup.bookmarked ? (
                      <BookmarkCheck size={20} color={COLORS.primary} fill={COLORS.primary} strokeWidth={2} />
                    ) : (
                      <Bookmark size={20} color={COLORS.textSecondary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.startupDescription}>{startup.description}</Text>

                <View style={styles.startupTags}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{startup.stage}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{startup.industry}</Text>
                  </View>
                  <View style={[styles.tag, styles.tagFunding]}>
                    <TrendingUp size={12} color={COLORS.success} strokeWidth={2} />
                    <Text style={[styles.tagText, styles.tagTextFunding]}>
                      {startup.fundingRequired}
                    </Text>
                  </View>
                </View>

                <View style={styles.startupFooter}>
                  <View style={styles.startupMeta}>
                    <MapPin size={14} color={COLORS.textSecondary} strokeWidth={2} />
                    <Text style={styles.startupMetaText}>{startup.location}</Text>
                    <View style={styles.metaDivider} />
                    <Eye size={14} color={COLORS.textSecondary} strokeWidth={2} />
                    <Text style={styles.startupMetaText}>{startup.views} views</Text>
                  </View>
                  <View style={styles.startupActions}>
                    {startup.hasPitchDeck && (
                      <View style={styles.actionBadge}>
                        <FileText size={14} color={COLORS.primary} strokeWidth={2} />
                      </View>
                    )}
                    {startup.hasPitchVideo && (
                      <View style={styles.actionBadge}>
                        <Video size={14} color={COLORS.primary} strokeWidth={2} />
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.connectButton}
                      onPress={() => router.push(`/(tabs)/chat?founder=${startup.founder}`)}
                      activeOpacity={0.7}>
                      <MessageSquare size={14} color={COLORS.primary} strokeWidth={2} />
                      <Text style={styles.connectButtonText}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
    backgroundColor: 'rgba(255,255,255,0.12)',
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
  searchSection: {
    gap: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOWS.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  filtersSection: {
    gap: SPACING.md,
  },
  filterRow: {
    gap: SPACING.sm,
  },
  filterLabel: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  resultsSection: {
    gap: SPACING.md,
  },
  resultsTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  startupsList: {
    gap: SPACING.md,
  },
  startupCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  startupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  startupIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startupInfo: {
    flex: 1,
  },
  startupName: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  startupFounder: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  bookmarkButton: {
    padding: SPACING.xs,
  },
  startupDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  startupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
  },
  tagFunding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    backgroundColor: COLORS.success + '15',
  },
  tagText: {
    ...TYPOGRAPHY.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  tagTextFunding: {
    color: COLORS.success,
  },
  startupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  startupMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  startupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionBadge: {
    padding: SPACING.xs / 2,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
  },
  connectButton: {
    ...(Platform.OS === 'web' && {
      maxWidth: 300,
      alignSelf: 'center',
    }),
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
  },
  connectButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
});

