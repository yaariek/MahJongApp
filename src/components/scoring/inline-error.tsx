import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const DANGER = '#d4361f';

export function InlineError({ message }: { message: string }) {
  return (
    <View style={styles.box}>
      <ThemedText type="smallBold" style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(212, 54, 31, 0.12)',
    borderColor: DANGER,
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  text: { color: DANGER },
});
