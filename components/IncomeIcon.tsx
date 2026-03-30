import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { IncomeCategoryInfo } from '@/lib/types';

interface Props {
  category: IncomeCategoryInfo;
  size?: number;
}

export function IncomeIcon({ category, size = 40 }: Props) {
  const iconSize = size * 0.5;
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: category.bgColor }]}>
      <Feather name={category.icon as any} size={iconSize} color={category.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
