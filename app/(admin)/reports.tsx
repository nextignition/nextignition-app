import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { Flag, Search, X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react-native';

// Dummy data
const MOCK_REPORTS = [
  {
    id: '1',
    type: 'spam',
    reportedUser: 'John Doe',
    reportedBy: 'Jane Smith',
    reason: 'Inappropriate content',
    description: 'User posted spam messages in multiple channels',
    status: 'pending',
    createdAt: '2024-01-20',
    priority: 'high',
  },
  {
    id: '2',
    type: 'harassment',
    reportedUser: 'Mike Johnson',
    reportedBy: 'Sarah Lee',
    reason: 'Harassment',
    description: 'Repeated unwanted messages and inappropriate behavior',
    status: 'resolved',
    createdAt: '2024-01-18',
    priority: 'high',
  },
  {
    id: '3',
    type: 'fake',
    reportedUser: 'Alex Brown',
    reportedBy: 'Chris Wilson',
    reason: 'Fake profile',
    description: 'Suspected fake profile with misleading information',
    status: 'pending',
    createdAt: '2024-01-22',
    priority: 'medium',
  },
];

type ReportStatus = 'all' | 'pending' | 'resolved' | 'dismissed';
type ReportPriority = 'all' | 'high' | 'medium' | 'low';

export default function AdminReportsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<ReportPriority>('all');
  const [reports, setReports] = useState(MOCK_REPORTS);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.reportedUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reportedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [reports, searchQuery, statusFilter, priorityFilter]);

  const handleResolve = (reportId: string) => {
    Alert.alert('Resolve Report', 'Mark this report as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        onPress: () => {
          setReports(reports.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r)));
        },
      },
    ]);
  };

  const handleDismiss = (reportId: string) => {
    Alert.alert('Dismiss Report', 'Dismiss this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dismiss',
        style: 'destructive',
        onPress: () => {
          setReports(reports.map((r) => (r.id === reportId ? { ...r, status: 'dismissed' } : r)));
        },
      },
    ]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return COLORS.error;
      case 'medium':
        return COLORS.warning;
      case 'low':
        return COLORS.success;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={18} color={COLORS.success} strokeWidth={2} />;
      case 'dismissed':
        return <XCircle size={18} color={COLORS.textSecondary} strokeWidth={2} />;
      default:
        return <AlertTriangle size={18} color={COLORS.warning} strokeWidth={2} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reports & Flags</Text>
          <Text style={styles.headerSubtitle}>Review and manage user reports</Text>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color={COLORS.textSecondary} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reports..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search reports"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                accessibilityLabel="Clear search">
                <X size={18} color={COLORS.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filtersSection}>
          <Text style={styles.filtersLabel}>Status:</Text>
          <View style={styles.filters}>
            {(['all', 'pending', 'resolved', 'dismissed'] as ReportStatus[]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(status)}
                activeOpacity={0.7}
                accessibilityRole="button">
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === status && styles.filterChipTextActive,
                  ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filtersSection}>
          <Text style={styles.filtersLabel}>Priority:</Text>
          <View style={styles.filters}>
            {(['all', 'high', 'medium', 'low'] as ReportPriority[]).map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.filterChip,
                  priorityFilter === priority && styles.filterChipActive,
                ]}
                onPress={() => setPriorityFilter(priority)}
                activeOpacity={0.7}
                accessibilityRole="button">
                <Text
                  style={[
                    styles.filterChipText,
                    priorityFilter === priority && styles.filterChipTextActive,
                  ]}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.reportsList}>
          {filteredReports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportHeaderLeft}>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(report.priority) + '20' },
                    ]}>
                    <Flag
                      size={16}
                      color={getPriorityColor(report.priority)}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: getPriorityColor(report.priority) },
                      ]}>
                      {report.priority.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    {getStatusIcon(report.status)}
                    <Text style={styles.statusText}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.reportBody}>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Type:</Text>
                  <Text style={styles.reportValue}>
                    {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                  </Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Reported User:</Text>
                  <Text style={styles.reportValue}>{report.reportedUser}</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Reported By:</Text>
                  <Text style={styles.reportValue}>{report.reportedBy}</Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Reason:</Text>
                  <Text style={styles.reportValue}>{report.reason}</Text>
                </View>
                <View style={styles.reportDescription}>
                  <Text style={styles.reportLabel}>Description:</Text>
                  <Text style={styles.reportDescriptionText}>{report.description}</Text>
                </View>
              </View>

              {report.status === 'pending' && (
                <View style={styles.reportActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dismissButton]}
                    onPress={() => handleDismiss(report.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button">
                    <XCircle size={18} color={COLORS.error} strokeWidth={2} />
                    <Text style={styles.dismissButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => handleResolve(report.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button">
                    <CheckCircle size={18} color={COLORS.success} strokeWidth={2} />
                    <Text style={styles.resolveButtonText}>Resolve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {filteredReports.length === 0 && (
          <View style={styles.emptyState}>
            <Flag size={48} color={COLORS.textSecondary} strokeWidth={2} />
            <Text style={styles.emptyStateText}>No reports found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filter criteria
            </Text>
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
    gap: SPACING.sm,
  },
  filtersLabel: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  reportsList: {
    gap: SPACING.md,
  },
  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportHeaderLeft: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
  },
  priorityText: {
    ...TYPOGRAPHY.label,
    fontFamily: FONT_FAMILY.bodyBold,
    fontSize: FONT_SIZES.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
  },
  statusText: {
    ...TYPOGRAPHY.label,
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
  },
  reportBody: {
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportLabel: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  reportValue: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  reportDescription: {
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reportDescriptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 20,
  },
  reportActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  dismissButton: {
    backgroundColor: COLORS.error + '15',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dismissButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.error,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  resolveButton: {
    backgroundColor: COLORS.success,
  },
  resolveButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyStateText: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  emptyStateSubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

