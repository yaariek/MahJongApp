import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ScoreResult, Transfer } from '@/core/scoring';

export type ScoreBreakdownProps = {
  score: ScoreResult;
  transfers: Transfer[];
  perLoser: number;
  net: Map<number, number>;
  netSumsZero: boolean;
};

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : fmt(n));

export function ScoreBreakdown({
  score,
  transfers,
  perLoser,
  net,
  netSumsZero,
}: ScoreBreakdownProps) {
  const netStr = [0, 1, 2, 3].map((s) => `${s}:${signed(net.get(s) ?? 0)}`).join('   ');

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">番 breakdown</ThemedText>

      {score.lines.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No scoring patterns matched (番總 0).
        </ThemedText>
      ) : (
        score.lines.map((line, i) => (
          <View key={`${line.name}-${i}`} style={styles.lineRow}>
            <ThemedText type="small">{line.name}</ThemedText>
            <ThemedText type="small">{line.fan}</ThemedText>
          </View>
        ))
      )}

      <View style={styles.lineRow}>
        <ThemedText type="smallBold">番總</ThemedText>
        <ThemedText type="smallBold">{score.fanTotal}</ThemedText>
      </View>
      <View style={styles.lineRow}>
        <ThemedText type="small">每家付 (per loser)</ThemedText>
        <ThemedText type="small">{fmt(perLoser)}</ThemedText>
      </View>

      <ThemedText type="smallBold" style={styles.section}>
        Transfers
      </ThemedText>
      {transfers.map((t, i) => (
        <ThemedText key={i} type="small">
          seat {t.from} → seat {t.to} {fmt(t.amount)} ({t.reason})
        </ThemedText>
      ))}

      <ThemedText type="small" themeColor="textSecondary" style={styles.section}>
        net by seat {netStr} — {netSumsZero ? 'nets to 0 ✓' : 'does NOT net to 0 ✗'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    marginTop: Spacing.two,
  },
});
