import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CategoryInfo } from '@/lib/types';

interface Props {
  category: CategoryInfo;
  size?: number;
}

export function CategoryIcon({ category, size = 40 }: Props) {
  const iconSize = size * 0.5;
  const renderIcon = () => {
    const props = { name: category.icon as any, size: iconSize, color: category.color };
    switch (category.iconFamily) {
      case 'Ionicons': return <Ionicons {...props} />;
      case 'Feather': return <Feather {...props} />;
      case 'MaterialIcons': return <MaterialIcons {...props} />;
      case 'MaterialCommunityIcons': return <MaterialCommunityIcons {...props} />;
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: category.bgColor }]}>
      {renderIcon()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
