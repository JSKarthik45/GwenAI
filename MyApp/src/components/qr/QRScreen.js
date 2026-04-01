import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '../../theme/theme';

export function QRScreen({ prompt, result, onBack }) {
  return (
    <View style={styles.qrWrap}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <Text style={styles.qrTitle}>Your Preview Is Ready</Text>
      <Text style={styles.qrSub}>
        Scan this placeholder QR in Expo Go to view your generated app.
      </Text>

      <View style={styles.qrCard}>
        <View style={styles.qrCodePlaceholder}>
          <Text style={styles.qrPlaceholderText}>QR PLACEHOLDER</Text>
        </View>
        <Text style={styles.qrHint}>expo.dev/preview/placeholder-link</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Prompt received</Text>
        <Text style={styles.summaryText} numberOfLines={3}>
          {prompt || 'Placeholder app prompt'}
        </Text>
      </View>

      {result?.message ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Backend status</Text>
          <Text style={styles.summaryText} numberOfLines={4}>
            {`${result.status || 'pending'} — ${result.message}`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  qrWrap: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.panel,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  qrTitle: {
    color: theme.colors.text,
    ...theme.typography.title,
    textAlign: 'center',
    marginTop: 34,
  },
  qrSub: {
    color: theme.colors.muted,
    ...theme.typography.body,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 360,
  },
  qrCard: {
    marginTop: 24,
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
  },
  qrCodePlaceholder: {
    width: 220,
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.qrPanel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    color: '#9DB8FF',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  qrHint: {
    color: theme.colors.muted,
    marginTop: 12,
    fontSize: 13,
  },
  summaryCard: {
    width: '100%',
    maxWidth: 360,
    marginTop: 18,
    backgroundColor: theme.colors.panel,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  summaryLabel: {
    color: theme.colors.accentText,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
