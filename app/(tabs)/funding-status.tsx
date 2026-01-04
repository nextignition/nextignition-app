import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
  TrendingUp,
  Eye,
  Users,
  MessageSquare,
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
} from 'lucide-react-native';
import { useFundingStatus } from '@/hooks/useFundingStatus';
import { getOrCreateDirectConversation } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from 'react-native';

export default function FundingStatusScreen() {
  const [activeTab, setActiveTab] = useState<'status' | 'investors' | 'analytics'>('status');
  const { fundingRequests, interestedInvestors, loading, refresh } = useFundingStatus();
  const { user } = useAuth();
  const [chatLoading, setChatLoading] = useState<Record<string, boolean>>({});

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funded':
      case 'interested':
      case 'confirmed':
        return COLORS.success;
      case 'pending':
      case 'reviewed':
        return COLORS.warning;
      case 'declined':
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'funded':
      case 'interested':
      case 'confirmed':
        return <CheckCircle size={18} color={COLORS.success} strokeWidth={2} />;
      case 'pending':
      case 'reviewed':
        return <Clock size={18} color={COLORS.warning} strokeWidth={2} />;
      case 'declined':
      case 'rejected':
        return <XCircle size={18} color={COLORS.error} strokeWidth={2} />;
      default:
        return <Clock size={18} color={COLORS.textSecondary} strokeWidth={2} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  const handleChat = async (investorId: string, investorName: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to start a chat');
      return;
    }

    setChatLoading(prev => ({ ...prev, [investorId]: true }));

    try {
      console.log('[FundingStatus] Creating/getting conversation with investor:', investorId);
      const { conversationId, error } = await getOrCreateDirectConversation(
        user.id,
        investorId,
        investorName
      );

      if (error || !conversationId) {
        Alert.alert('Error', error || 'Failed to start conversation');
        setChatLoading(prev => ({ ...prev, [investorId]: false }));
        return;
      }

      console.log('[FundingStatus] Navigating to chat with conversationId:', conversationId);
      router.push(`/(tabs)/chat?conversationId=${conversationId}&userName=${encodeURIComponent(investorName)}`);

      setTimeout(() => {
        setChatLoading(prev => ({ ...prev, [investorId]: false }));
      }, 500);
    } catch (err: any) {
      console.error('[FundingStatus] Chat error:', err);
      Alert.alert('Error', err.message || 'Failed to start chat');
      setChatLoading(prev => ({ ...prev, [investorId]: false }));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading funding status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LinearGradient colors={GRADIENTS.primary} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Funding Status</Text>
              <Text style={styles.heroSubtitle}>Track your funding journey</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'status' && styles.tabActive]}
            onPress={() => setActiveTab('status')}
            activeOpacity={0.7}>
            <Clock size={18} color={activeTab === 'status' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'status' && styles.tabTextActive,
              ]}>
              Status
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'investors' && styles.tabActive]}
            onPress={() => setActiveTab('investors')}
            activeOpacity={0.7}>
            <Users size={18} color={activeTab === 'investors' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'investors' && styles.tabTextActive,
              ]}>
              Investors
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
            onPress={() => setActiveTab('analytics')}
            activeOpacity={0.7}>
            <BarChart3 size={18} color={activeTab === 'analytics' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'analytics' && styles.tabTextActive,
              ]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'status' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Funding Requests</Text>
            {fundingRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No funding requests yet</Text>
                <Text style={styles.emptySubtext}>Create a funding request to get started</Text>
              </View>
            ) : (
              <View style={styles.requestsList}>
                {fundingRequests.map((request) => (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestStatus}>
                        {getStatusIcon(request.status)}
                        <Text
                          style={[
                            styles.requestStatusText,
                            { color: getStatusColor(request.status) },
                          ]}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                        </Text>
                      </View>
                      <Text style={styles.requestDate}>Submitted {formatDate(request.created_at)}</Text>
                    </View>
                    {request.title && (
                      <Text style={styles.requestTitle}>{request.title}</Text>
                    )}
                    {request.amount_requested && (
                      <Text style={styles.requestAmount}>
                        {formatCurrency(request.amount_requested)}
                      </Text>
                    )}
                    <View style={styles.requestStats}>
                      <View style={styles.statItem}>
                        <Eye size={16} color={COLORS.textSecondary} strokeWidth={2} />
                        <Text style={styles.statValue}>{request.investorsViewed}</Text>
                        <Text style={styles.statLabel}>Views</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Users size={16} color={COLORS.textSecondary} strokeWidth={2} />
                        <Text style={styles.statValue}>{request.interestedCount}</Text>
                        <Text style={styles.statLabel}>Interested</Text>
                      </View>
                      <View style={styles.statItem}>
                        <DollarSign size={16} color={COLORS.textSecondary} strokeWidth={2} />
                        <Text style={styles.statValue}>{formatCurrency(request.totalInterestAmount)}</Text>
                        <Text style={styles.statLabel}>Total Interest</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'investors' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interested Investors</Text>
            {interestedInvestors.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No interested investors yet</Text>
                <Text style={styles.emptySubtext}>Investors who express interest will appear here</Text>
              </View>
            ) : (
              <View style={styles.investorsList}>
                {interestedInvestors.map((interest) => {
                  const investorName = interest.investor?.full_name || 'Investor';
                  const investorId = interest.investor_profile_id;
                  
                  return (
                  <View
                    key={interest.id}
                    style={styles.investorCard}>
                    <View style={styles.investorHeader}>
                      <View style={styles.investorIcon}>
                        <Users size={20} color={COLORS.primary} strokeWidth={2} />
                      </View>
                      <View style={styles.investorInfo}>
                        <Text style={styles.investorName}>
                          {interest.investor?.full_name || 'Investor'}
                        </Text>
                        <Text style={styles.investorFirm}>
                          Interest: {formatCurrency(interest.interest_amount)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.investorStatusBadge,
                          interest.status === 'confirmed' && styles.investorStatusInterested,
                        ]}>
                        <Text
                          style={[
                            styles.investorStatusText,
                            interest.status === 'confirmed' && styles.investorStatusTextInterested,
                          ]}>
                          {interest.status.charAt(0).toUpperCase() + interest.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    {interest.message && (
                      <Text style={styles.investorMessage}>{interest.message}</Text>
                    )}
                    <View style={styles.investorFooter}>
                      <Text style={styles.investorLastContact}>
                        Expressed {getTimeAgo(interest.created_at)}
                      </Text>
                      <View style={styles.investorActions}>
                        <TouchableOpacity
                          style={[styles.messageButton, chatLoading[investorId] && styles.messageButtonLoading]}
                          onPress={() => handleChat(investorId, investorName)}
                          disabled={chatLoading[investorId]}>
                          <MessageSquare size={16} color={COLORS.primary} strokeWidth={2} />
                          <Text style={styles.messageButtonText}>
                            {chatLoading[investorId] ? 'Opening...' : 'Message'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.scheduleButton}
                          onPress={() => {
                            const investorEmail = interest.investor?.email;
                            if (investorEmail) {
                              const encodedEmail = encodeURIComponent(investorEmail);
                              router.push(`/(tabs)/schedule-meeting?email=${encodedEmail}`);
                            } else {
                              router.push('/(tabs)/schedule-meeting');
                            }
                          }}>
                          <Calendar size={16} color={COLORS.primary} strokeWidth={2} />
                          <Text style={styles.scheduleButtonText}>Schedule</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Funding Analytics</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsCard}>
                <Eye size={24} color={COLORS.primary} strokeWidth={2} />
                <Text style={styles.analyticsValue}>
                  {fundingRequests.reduce((sum, r) => sum + r.investorsViewed, 0)}
                </Text>
                <Text style={styles.analyticsLabel}>Total Views</Text>
              </View>
              <View style={styles.analyticsCard}>
                <Users size={24} color={COLORS.primary} strokeWidth={2} />
                <Text style={styles.analyticsValue}>{interestedInvestors.length}</Text>
                <Text style={styles.analyticsLabel}>Interested Investors</Text>
              </View>
              <View style={styles.analyticsCard}>
                <DollarSign size={24} color={COLORS.primary} strokeWidth={2} />
                <Text style={styles.analyticsValue}>
                  {formatCurrency(fundingRequests.reduce((sum, r) => sum + r.totalInterestAmount, 0))}
                </Text>
                <Text style={styles.analyticsLabel}>Total Interest</Text>
              </View>
              <View style={styles.analyticsCard}>
                <TrendingUp size={24} color={COLORS.primary} strokeWidth={2} />
                <Text style={styles.analyticsValue}>{fundingRequests.length}</Text>
                <Text style={styles.analyticsLabel}>Active Requests</Text>
              </View>
            </View>
          </View>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    gap: SPACING.xs,
    ...SHADOWS.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  requestsList: {
    gap: SPACING.md,
  },
  requestCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  requestStatusText: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  requestDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  requestStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  statValue: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  investorsList: {
    gap: SPACING.md,
  },
  investorCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  investorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  investorIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  investorInfo: {
    flex: 1,
  },
  investorName: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  investorFirm: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  investorStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.border,
  },
  investorStatusInterested: {
    backgroundColor: COLORS.success + '20',
  },
  investorStatusText: {
    ...TYPOGRAPHY.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  investorStatusTextInterested: {
    color: COLORS.success,
  },
  investorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  investorLastContact: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  investorActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
  },
  messageButtonLoading: {
    opacity: 0.6,
  },
  messageButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
  },
  scheduleButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  analyticsCard: {
    width: '48%',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  analyticsValue: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.text,
  },
  analyticsLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  analyticsChange: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl * 2,
    gap: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  requestTitle: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  requestAmount: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.primary,
    fontSize: FONT_SIZES.xl,
    marginBottom: SPACING.sm,
  },
  investorMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
});

