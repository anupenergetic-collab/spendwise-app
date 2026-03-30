import React from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useExpenses } from '@/lib/expense-context';
import { getCategoryInfo } from '@/lib/categories';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ExpenseItem } from '@/components/ExpenseItem';
import { formatCurrency, getMonthName } from '@/lib/format';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useSubscription } from '@/lib/subscription-context';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { trialDaysLeft, isSubscribed, isTrialActive } = useSubscription();
  const insets = useSafeAreaInsets();
  const {
    expenses,
    incomes,
    getTodayExpenseTotal,
    getWeekExpenseTotal,
    getMonthExpenseTotal,
    getMonthIncomeTotal,
    getMonthBalance,
    getCategoryTotals,
    refreshAll,
  } = useExpenses();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const todayTotal = getTodayExpenseTotal();
  const weekTotal = getWeekExpenseTotal();
  const monthExpense = getMonthExpenseTotal();
  const monthIncome = getMonthIncomeTotal();
  const balance = getMonthBalance();
  const categoryTotals = getCategoryTotals();
  const recentExpenses = expenses.slice(0, 5);

  const topInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + topInset + 16, paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.tint} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>SpendWise</Text>
          <Text style={styles.monthLabel}>{getMonthName()}</Text>
        </View>
        <Pressable style={styles.avatarButton} onPress={() => router.push('/subscription')}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
          </View>
          {isTrialActive && !isSubscribed && (
            <View style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>{trialDaysLeft}d</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Monthly Balance</Text>
        <Text style={[styles.balanceAmount, balance < 0 && { color: Colors.light.danger }]}>
          {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <View style={[styles.balanceIconWrap, { backgroundColor: '#E8F5F1' }]}>
              <Feather name="arrow-down-left" size={14} color={Colors.light.tint} />
            </View>
            <View>
              <Text style={styles.balanceItemLabel}>Income</Text>
              <Text style={[styles.balanceItemValue, { color: Colors.light.tint }]}>+{formatCurrency(monthIncome)}</Text>
            </View>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <View style={[styles.balanceIconWrap, { backgroundColor: Colors.light.dangerLight }]}>
              <Feather name="arrow-up-right" size={14} color={Colors.light.danger} />
            </View>
            <View>
              <Text style={styles.balanceItemLabel}>Expenses</Text>
              <Text style={[styles.balanceItemValue, { color: Colors.light.danger }]}>-{formatCurrency(monthExpense)}</Text>
            </View>
          </View>
        </View>
      </View>

      <LinearGradient
        colors={['#0D9373', '#087A60']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroLabel}>Spending This Month</Text>
        <Text style={styles.heroAmount}>{formatCurrency(monthExpense)}</Text>
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <View style={styles.heroStatIcon}>
              <Ionicons name="today-outline" size={14} color="rgba(255,255,255,0.7)" />
            </View>
            <View>
              <Text style={styles.heroStatLabel}>Today</Text>
              <Text style={styles.heroStatValue}>{formatCurrency(todayTotal)}</Text>
            </View>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <View style={styles.heroStatIcon}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
            </View>
            <View>
              <Text style={styles.heroStatLabel}>This Week</Text>
              <Text style={styles.heroStatValue}>{formatCurrency(weekTotal)}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {categoryTotals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <View style={styles.categoryList}>
            {categoryTotals.slice(0, 5).map(({ category, total }) => {
              const info = getCategoryInfo(category);
              const percentage = monthExpense > 0 ? (total / monthExpense) * 100 : 0;
              return (
                <View key={category} style={styles.categoryRow}>
                  <CategoryIcon category={info} size={36} />
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryName}>{info.label}</Text>
                      <Text style={styles.categoryAmount}>{formatCurrency(total)}</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: info.color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {expenses.length > 5 && (
            <Pressable onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          )}
        </View>
        {recentExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={40} color={Colors.light.gray300} />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyText}>Tap the Add tab to record your first expense</Text>
          </View>
        ) : (
          <View style={styles.expenseCard}>
            {recentExpenses.map((expense, idx) => (
              <React.Fragment key={expense.id}>
                <ExpenseItem expense={expense} />
                {idx < recentExpenses.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 26,
    fontFamily: 'DMSans_700Bold',
    color: Colors.light.text,
  },
  monthLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  trialBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.light.danger,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  trialBadgeText: {
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'DMSans_700Bold',
    color: Colors.light.tint,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceItemLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
  },
  balanceItemValue: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
  },
  balanceDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.light.gray200,
    marginHorizontal: 12,
  },
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 36,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
    marginBottom: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  heroStatValue: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    color: '#fff',
  },
  heroDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.tint,
  },
  categoryList: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  categoryInfo: {
    flex: 1,
    gap: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.text,
  },
  categoryAmount: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.text,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.gray200,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  expenseCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.gray200,
    marginLeft: 76,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.text,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
