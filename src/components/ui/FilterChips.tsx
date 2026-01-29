import { memo } from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { FONTS } from '@/styles/typography';

interface FilterItem {
  id: string;
  label: string;
}

interface FilterChipsProps {
  filters: FilterItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const FilterChips = memo(function FilterChips({
  filters,
  activeId,
  onSelect,
}: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isActive = activeId === filter.id;
        return (
          <Pressable
            key={filter.id}
            onPress={() => onSelect(filter.id)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 20,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    borderColor: '#FFBC40',
  },
  text: {
    fontFamily: FONTS.title,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  textActive: {
    color: '#FFBC40',
  },
});
