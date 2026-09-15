import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type StepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function Stepper({ value, min = 0, max = 99, onChange }: StepperProps) {
  return (
    <View style={styles.row}>
      <StepButton label="−" disabled={value <= min} onPress={() => onChange(value - 1)} />
      <ThemedText type="smallBold" style={styles.value}>
        {value}
      </ThemedText>
      <StepButton label="+" disabled={value >= max} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function StepButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [(pressed || disabled) && styles.dim]}
    >
      <ThemedView type="backgroundElement" style={styles.btn}>
        <ThemedText type="smallBold">{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  value: { minWidth: 24, textAlign: 'center' },
  btn: {
    width: 32,
    height: 32,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: { opacity: 0.4 },
});
