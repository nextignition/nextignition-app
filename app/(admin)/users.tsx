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
import { useResponsive } from '@/hooks/useResponsive';
import { UserCard } from '@/components/admin/UserCard';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { Search, UserCheck, X } from 'lucide-react-native';

// Dummy data
const MOCK_USERS = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'Founder',
    location: 'San Francisco, CA',
    company: 'TechStart Inc',
    createdAt: '2024-01-15',
    status: 'pending' as const,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'Investor',
    location: 'New York, NY',
    createdAt: '2024-01-20',
    status: 'pending' as const,
  },
  {
    id: '3',
    name: 'Michael Chen',
    email: 'michael@example.com',
    role: 'Founder',
    location: 'Austin, TX',
    company: 'Innovate Labs',
    createdAt: '2024-01-18',
    status: 'approved' as const,
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@example.com',
    role: 'Advisor',
    location: 'Boston, MA',
    createdAt: '2024-01-22',
    status: 'rejected' as const,
  },
];

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminUsersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [users, setUsers] = useState(MOCK_USERS);
  const { isMobile } = useResponsive();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const handleApprove = (userId: string) => {
    Alert.alert('Approve User', 'Are you sure you want to approve this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          setUsers(users.map((u) => (u.id === userId ? { ...u, status: 'approved' } : u)));
        },
      },
    ]);
  };

  const handleReject = (userId: string) => {
    Alert.alert('Reject User', 'Are you sure you want to reject this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          setUsers(users.map((u) => (u.id === userId ? { ...u, status: 'rejected' } : u)));
        },
      },
    ]);
  };

  const statusCounts = {
    all: users.length,
    pending: users.filter((u) => u.status === 'pending').length,
    approved: users.filter((u) => u.status === 'approved').length,
    rejected: users.filter((u) => u.status === 'rejected').length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={styles.headerSubtitle}>Manage user approvals and access</Text>
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color={COLORS.textSecondary} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users by name or email..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search users"
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
          <Text style={styles.filtersLabel}>Filter by status:</Text>
          <View style={styles.filters}>
            {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(status)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${status}`}>
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === status && styles.filterChipTextActive,
                  ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        <View style={[styles.usersList, !isMobile && styles.usersListGrid]}>
          {filteredUsers.map((user, index) => (
            <UserCard
              key={user.id}
              user={user}
              onApprove={() => handleApprove(user.id)}
              onReject={() => handleReject(user.id)}
              onView={() => {
                // Navigate to user detail
              }}
            />
          ))}
        </View>

        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <UserCheck size={48} color={COLORS.textSecondary} strokeWidth={2} />
            <Text style={styles.emptyStateText}>No users found</Text>
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCount: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  usersList: {
    gap: SPACING.md,
  },
  usersListGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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

