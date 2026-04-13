import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import theme from '../../theme/theme';

export function QRScreen({ prompt, result, onBack, project, qrContent, qrMessage, isFetchingQR }) {
  const isQueuedState =
    isFetchingQR || result?.status === 'processing' || result?.status === 'queued';
  const processingMessage =
    qrMessage || 'Your project is processing. Please check back later to view the QR.';
  const resultData = result?.data || {};
  const qrMeta = resultData?.qr_code || {};
  const generatorStatus = resultData?.generator_status || resultData?.status || result?.status;
  const completedAt = resultData?.completed_at;
  const outputPath = resultData?.output_path;
  const projectId = resultData?.project_id || qrMeta?.project_id || project?.id;
  const snackUrl = qrMeta?.snack_url || qrMeta?.snackUrl;
  const snackId = qrMeta?.snack_id || qrMeta?.snackId;
  const qrValue = typeof qrContent === 'string' ? qrContent.trim() : '';
  const isDirectQrImage =
    qrValue.startsWith('http://') || qrValue.startsWith('https://');
  const qrImageUri = qrValue
    ? isDirectQrImage
      ? qrValue
      : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrValue)}`
    : null;

  return (
    <View style={styles.qrWrap}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isQueuedState ? (
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.processingTitle}>Processing your project</Text>
            <Text style={styles.processingText}>{processingMessage}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.qrTitle}>Your Preview Is Ready</Text>
            <Text style={styles.qrSub}>Scan this QR in Expo Go to view your generated app.</Text>

            <View style={styles.qrCard}>
              <View style={styles.qrCodePlaceholder}>
                {qrImageUri ? (
                  <Image
                    source={{ uri: qrImageUri }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.qrPlaceholderText}>QR NOT READY</Text>
                )}
              </View>
              <Text style={styles.qrHint}>{qrContent || 'The QR link will appear here once your app is ready.'}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Prompt received</Text>
              <Text style={styles.summaryText} numberOfLines={2}>
                {project?.name || 'Latest MVP'}
              </Text>
            </View>

            {generatorStatus ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Generator status</Text>
                <Text style={styles.summaryText} numberOfLines={2}>{String(generatorStatus)}</Text>
              </View>
            ) : null}

            {completedAt ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Completed at</Text>
                <Text style={styles.summaryText} numberOfLines={2}>{String(completedAt)}</Text>
              </View>
            ) : null}

            {outputPath ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Output path</Text>
                <Text style={styles.summaryText} numberOfLines={3}>{String(outputPath)}</Text>
              </View>
            ) : null}

            {snackUrl ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Snack URL</Text>
                <Text style={styles.summaryText} numberOfLines={3}>{String(snackUrl)}</Text>
              </View>
            ) : null}

            {snackId ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Snack ID</Text>
                <Text style={styles.summaryText} numberOfLines={2}>{String(snackId)}</Text>
              </View>
            ) : null}

            {projectId ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Project ID</Text>
                <Text style={styles.summaryText} numberOfLines={2}>{String(projectId)}</Text>
              </View>
            ) : null}

            {result?.message ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Backend status</Text>
                <Text style={styles.summaryText} numberOfLines={4}>
                  {`${result.status || 'pending'} — ${result.message}`}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
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
  scrollView: {
    width: '100%',
    marginTop: 18,
  },
  scrollContent: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 28,
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
    marginTop: 8,
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
  qrImage: {
    width: 208,
    height: 208,
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
    textAlign: 'center',
  },
  processingCard: {
    width: '100%',
    maxWidth: 360,
    marginTop: 26,
    backgroundColor: theme.colors.panel,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 22,
    alignItems: 'center',
  },
  processingTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  processingText: {
    color: theme.colors.muted,
    ...theme.typography.body,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
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
