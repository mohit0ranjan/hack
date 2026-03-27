import { StyleSheet, Text, View } from 'react-native';

import { colors, ecoScoreColors } from '../theme/colors';
import type { EcoScore } from '../types';

interface EcoScoreBadgeProps {
  score: EcoScore;
}

export const EcoScoreBadge = ({ score }: EcoScoreBadgeProps) => {
  return (
    <View style={[styles.badge, { backgroundColor: ecoScoreColors[score] ?? colors.primary }]}>
      <Text style={styles.label}>Eco Score</Text>
      <Text style={styles.score}>{score}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 110,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  score: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
  },
});
