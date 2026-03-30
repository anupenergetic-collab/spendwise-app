import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { Income } from '@/lib/types';
import { getIncomeCategoryInfo } from '@/lib/categories';
import { IncomeIcon } from './IncomeIcon';
import { formatCurrency, formatTime } from '@/lib/format';

interface Props {
  income: Income;
  onPress?: () => void;
}

export function IncomeItem({ income, onPress }: Props) {
  const category = getIncomeCategoryInfo(income.category);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <IncomeIcon category={category} size={44} />
      <View style={styles.info}>
        <Text style={styles.note} numberOfLines={1}>
          {income.note || category.label}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{category.label}</Text>
          {income.source ? (
            <>
              <View style={styles.dot} />
              <Text style={styles.metaText}>{income.source}</Text>
            </>
          ) : null}
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>+{formatCurrency(income.amount)}</Text>
        <Text style={styles.time}>{formatTime(income.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.light.card,
    gap: 12,
  },
  pressed: {
    backgroundColor: Colors.light.gray100,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  note: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.light.gray300,
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amount: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.tint,
  },
  time: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textMuted,
  },
});
