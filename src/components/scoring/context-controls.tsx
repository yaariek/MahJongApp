import type { ReactNode } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Segmented, type SegmentedOption } from './segmented';
import { Stepper } from './stepper';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { ContextDraft } from '@/lib/scoring-draft';
import type { Wind } from '@/core/game-state';

const WIND_OPTIONS: readonly SegmentedOption<Wind>[] = [
  { value: 'E', label: '東' },
  { value: 'S', label: '南' },
  { value: 'W', label: '西' },
  { value: 'N', label: '北' },
];

export type ContextControlsProps = {
  value: ContextDraft;
  onChange: (patch: Partial<ContextDraft>) => void;
};

export function ContextControls({ value, onChange }: ContextControlsProps) {
  return (
    <View style={styles.group}>
      <ThemedText type="smallBold">Context</ThemedText>

      <Row label="自摸 (self-draw)">
        <Switch value={value.selfDraw} onValueChange={(selfDraw) => onChange({ selfDraw })} />
      </Row>
      <Row label="莊家 (dealer)">
        <Switch value={value.isDealer} onValueChange={(isDealer) => onChange({ isDealer })} />
      </Row>
      <Row label="連莊 (streak)">
        <Stepper value={value.linZong} onChange={(linZong) => onChange({ linZong })} />
      </Row>
      <Row label="門風 (seat wind)">
        <Segmented
          options={WIND_OPTIONS}
          value={value.seatWind}
          onChange={(seatWind) => onChange({ seatWind })}
        />
      </Row>
      <Row label="圈風 (round wind)">
        <Segmented
          options={WIND_OPTIONS}
          value={value.roundWind}
          onChange={(roundWind) => onChange({ roundWind })}
        />
      </Row>

      <ThemedText type="small" themeColor="textSecondary">
        Only 連莊 changes the 番 today (adds a 連N拉N line). 莊家 / 門風 / 圈風 are recorded but not
        yet scored.
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
});
