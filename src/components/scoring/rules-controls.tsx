import type { ReactNode } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';

import { Segmented, type SegmentedOption } from './segmented';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RulesDraft } from '@/lib/scoring-draft';

const SEATS: readonly SegmentedOption<number>[] = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
];

export type RulesControlsProps = {
  value: RulesDraft;
  selfDraw: boolean;
  onChange: (patch: Partial<RulesDraft>) => void;
};

export function RulesControls({ value, selfDraw, onChange }: RulesControlsProps) {
  const theme = useTheme();
  return (
    <View style={styles.group}>
      <ThemedText type="smallBold">Settlement rules</ThemedText>

      <Row label="底 (base)">
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          keyboardType="number-pad"
          value={value.base}
          onChangeText={(base) => onChange({ base })}
          placeholder="5"
          placeholderTextColor={theme.textSecondary}
        />
      </Row>
      <Row label="番底 (per-番 value)">
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          keyboardType="number-pad"
          value={value.fanValue}
          onChangeText={(fanValue) => onChange({ fanValue })}
          placeholder="1"
          placeholderTextColor={theme.textSecondary}
        />
      </Row>
      <Row label="Winner seat">
        <Segmented
          options={SEATS}
          value={value.winnerSeat}
          onChange={(winnerSeat) => onChange({ winnerSeat })}
        />
      </Row>
      <Row label="Discarder seat">
        {selfDraw ? (
          <ThemedText type="small" themeColor="textSecondary">
            自摸 — no discarder
          </ThemedText>
        ) : (
          <Segmented
            options={SEATS.filter((s) => s.value !== value.winnerSeat)}
            value={value.discarderSeat}
            onChange={(discarderSeat) => onChange({ discarderSeat })}
          />
        )}
      </Row>
      <Row label="放銃三家分 (split discard)">
        <Switch
          value={value.splitDiscardPayment}
          onValueChange={(splitDiscardPayment) => onChange({ splitDiscardPayment })}
        />
      </Row>

      <ThemedText type="small" themeColor="textSecondary">
        Seats 0–3 are chairs for the money split only — unrelated to 門風 / 莊家 above.
      </ThemedText>
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" style={styles.rowLabel}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    minHeight: 36,
  },
  rowLabel: { flexShrink: 1 },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    minWidth: 72,
    textAlign: 'right',
    fontSize: 14,
  },
});
