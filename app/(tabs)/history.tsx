import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Platform, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useExpenses } from '@/lib/expense-context';
import { CATEGORIES } from '@/lib/categories';
import { ExpenseItem } from '@/components/ExpenseItem';
import { IncomeItem } from '@/components/IncomeItem';
import { ExpenseCategory, Expense, Income } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/format';

type FilterMode = 'all' | 'expenses' | 'income';

interface GroupedEntry {
  date: string;
  expenseTotal: number;
  incomeTotal: number;
  items: (Expense | Income)[];
}

function isExpense(item: Expense | Income): item is Expense {
  return 'paymentMedium' in item;
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { expenses, incomes, removeExpense, removeIncome } = useExpenses();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  const allItems = useMemo(() => {
    let items: (Expense | Income)[] = [];
    if (filterMode === 'all' || filterMode === 'expenses') {
      let exps = [...expenses];
      if (selectedCategory) {
        exps = exps.filter(e => e.category === selectedCategory);
      }
      items.push(...exps);
    }
    if (filterMode === 'all' || filterMode === 'income') {
      items.push(...incomes);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(item =>
        item.note.toLowerCase().includes(q) ||
        item.category.includes(q) ||
        item.amount.toString().includes(q)
      );
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [expenses, incomes, filterMode, selectedCategory, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, (Expense | Income)[]> = {};
    allItems.forEach(item => {
      const dateKey = new Date(item.date).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return Object.entries(groups).map(([date, items]) => ({
      date,
      expenseTotal: items.filter(isExpense).reduce((s, e) => s + e.amount, 0),
      incomeTotal: items.filter(i => !isExpense(i)).reduce((s, i) => s + i.amount, 0),
      items,
    })) as GroupedEntry[];
  }, [allItems]);

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert('Delete Expense', `Remove ${formatCurrency(expense.amount)} expense?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { removeExpense(expense.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
      },
    ]);
  };

  const handleDeleteIncome = (income: Income) => {
    Alert.alert('Delete Income', `Remove ${formatCurrency(income.amount)} income?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { removeIncome(income.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
      },
    ]);
  };

  const topInset = Platform.OS === 'web' ? 67 : 0;

  const renderItem = ({ item }: { item: GroupedEntry }) => (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupDate}>{formatDate(item.date)}</Text>
        <View style={styles.groupTotals}>
          {item.incomeTotal > 0 && (
            <Text style={styles.groupIncome}>+{formatCurrency(item.incomeTotal)}</Text>
          )}
          {item.expenseTotal > 0 && (
            <Text style={styles.groupExpense}>-{formatCurrency(item.expenseTotal)}</Text>
          )}
        </View>
      </View>
      <View style={styles.groupCard}>
        {item.items.map((entry, idx) => (
          <React.Fragment key={entry.id}>
            {isExpense(entry) ? (
              <ExpenseItem expense={entry} onPress={() => handleDeleteExpense(entry)} />
            ) : (
              <IncomeItem income={entry} onPress={() => handleDeleteIncome(entry)} />
            )}
            {idx < item.items.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + topInset }]}>
      <Text style={styles.title}>History</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={Colors.light.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={Colors.light.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.light.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.modeRow}>
        {(['all', 'expenses', 'income'] as FilterMode[]).map(m => {
          const isActive = filterMode === m;
          return (
            <Pressable
              key={m}
              style={[styles.modeChip, isActive && styles.modeChipActive]}
              onPress={() => { setFilterMode(m); if (m === 'income') setSelectedCategory(null); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.modeText, isActive && styles.modeTextActive]}>
                {m === 'all' ? 'All' : m === 'expenses' ? 'Expenses' : 'Income'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {(filterMode === 'all' || filterMode === 'expenses') && (
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={c => c.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          style={styles.filterContainer}
          renderItem={({ item: cat }) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <Pressable
                style={[styles.filterChip, isSelected && { backgroundColor: cat.bgColor, borderColor: cat.color }]}
                onPress={() => { setSelectedCategory(isSelected ? null : cat.key); Haptics.selectionAsync(); }}
              >
                <Text style={[styles.filterText, isSelected && { color: cat.color, fontFamily: 'DMSans_600SemiBold' }]}>
                  {cat.label.split(' ')[0]}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <FlatList
        data={grouped}
        keyExtractor={item => item.date}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 + 84 : 100, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!grouped.length}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={40} color={Colors.light.gray300} />
            <Text style={styles.emptyTitle}>No entries found</Text>
            <Text style={styles.emptyText}>
              {search || selectedCategory ? 'Try a different filter' : 'Start by adding your first entry'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 26,
    fontFamily: 'DMSans_700Bold',
    color: Colors.light.text,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  searchRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.text,
    paddingVertical: 0,
  },
  modeRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    gap: 3,
  },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeChipActive: {
    backgroundColor: Colors.light.tint,
  },
  modeText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.textSecondary,
  },
  modeTextActive: {
    color: '#fff',
    fontFamily: 'DMSans_600SemiBold',
  },
  filterContainer: {
    maxHeight: 44,
    marginBottom: 4,
  },
  filterList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.light.gray200,
    backgroundColor: Colors.light.card,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.textSecondary,
  },
  group: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  groupDate: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.textSecondary,
  },
  groupTotals: {
    flexDirection: 'row',
    gap: 8,
  },
  groupIncome: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.tint,
  },
  groupExpense: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.danger,
  },
  groupCard: {
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
    paddingVertical: 60,
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
