import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, Linking, useWindowDimensions } from 'react-native';
import { MaxWidthContainer } from '../common/MaxWidthContainer';
import theme from '../../theme/theme';

export function QRScreen({ prompt, result, onBack, project, qrContent, qrMessage, isFetchingQR }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideScreen = isWeb && width > 1024;
  
  const isQueuedState =
    isFetchingQR || result?.status === 'processing' || result?.status === 'queued';
  const processingMessage =
    qrMessage || 'Your project is processing. Please check back later to view the QR.';
  const resultData = result?.data || {};
  const qrMeta = resultData?.qr_code || {};
  const generatorStatus = resultData?.generator_status || resultData?.status || result?.status;
  const completedAt = resultData?.completed_at;
  const formattedCompletedAt = (() => {
    if (!completedAt) return null;
    const d = new Date(completedAt);
    if (Number.isNaN(d.getTime())) return String(completedAt);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const time = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
    return `${day}-${month}-${year} ${time}`;
  })();
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
      <MaxWidthContainer>
        <Pressable style={[styles.backButton, isWideScreen && styles.backButtonWide]} onPress={onBack}>
          <Text style={[styles.backButtonText, isWideScreen && styles.backButtonTextWide]}>← Back</Text>
        </Pressable>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, isWideScreen && styles.scrollContentWide]}
          showsVerticalScrollIndicator={false}
        >
          {isQueuedState ? (
            <View style={[styles.processingCard, isWideScreen && styles.processingCardWide]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.processingTitle, isWideScreen && styles.processingTitleWide]}>Processing your project</Text>
              <Text style={[styles.processingText, isWideScreen && styles.processingTextWide]}>{processingMessage}</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.qrTitle, isWideScreen && styles.qrTitleWide]}>Your MVP Is Ready</Text>
              <Text style={[styles.qrSub, isWideScreen && styles.qrSubWide]}>Open It Or Scan With Expo Go To Preview.</Text>

              <View style={[styles.desktopMainRow, isWideScreen && styles.desktopMainRowWide]}>
                <View style={[styles.leftPane, isWideScreen && styles.leftPaneWide]}>
                  {snackUrl ? (
                    <View style={[styles.ctaWrap, isWideScreen && styles.ctaWrapWide]}>
                      <Pressable style={[styles.ctaButton, isWideScreen && styles.ctaButtonWide]} onPress={() => Linking.openURL(String(snackUrl))}>
                        <Text style={[styles.ctaButtonText, isWideScreen && styles.ctaButtonTextWide]}>Open in Expo Go</Text>
                      </Pressable>
                      <Text style={[styles.orText, isWideScreen && styles.orTextWide]}>or</Text>
                    </View>
                  ) : null}

                  <View style={[styles.qrImageWrap, isWideScreen && styles.qrImageWrapWide]}>
                    {qrImageUri ? (
                      <Image
                        source={{ uri: qrImageUri }}
                        style={[styles.qrImage, isWideScreen && styles.qrImageWide]}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.qrCodePlaceholder, isWideScreen && styles.qrCodePlaceholderWide]}>
                        <Text style={styles.qrPlaceholderText}>QR NOT READY</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={[styles.rightPane, isWideScreen && styles.rightPaneWide]}>
                  <View style={[styles.summaryCard, isWideScreen && styles.summaryCardWide]}>
                    <Text style={[styles.summaryLabel, isWideScreen && styles.summaryLabelWide]}>Prompt</Text>
                    <Text style={[styles.summaryText, isWideScreen && styles.summaryTextWide]} numberOfLines={isWideScreen ? 3 : 2}>
                      {project?.name || 'Latest MVP'}
                    </Text>
                  </View>

                  {completedAt ? (
                    <View style={[styles.summaryCard, isWideScreen && styles.summaryCardWide]}>
                      <Text style={[styles.summaryLabel, isWideScreen && styles.summaryLabelWide]}>Completed at</Text>
                      <Text style={[styles.summaryText, isWideScreen && styles.summaryTextWide]} numberOfLines={2}>{formattedCompletedAt}</Text>
                    </View>
                  ) : null}

                  {snackId ? (
                    <View style={[styles.summaryCard, isWideScreen && styles.summaryCardWide]}>
                      <Text style={[styles.summaryLabel, isWideScreen && styles.summaryLabelWide]}>Snack ID</Text>
                      <Text style={[styles.summaryText, isWideScreen && styles.summaryTextWide]} numberOfLines={2}>{String(snackId)}</Text>
                    </View>
                  ) : null}

                  {projectId ? (
                    <View style={[styles.summaryCard, isWideScreen && styles.summaryCardWide]}>
                      <Text style={[styles.summaryLabel, isWideScreen && styles.summaryLabelWide]}>Project ID</Text>
                      <Text style={[styles.summaryText, isWideScreen && styles.summaryTextWide]} numberOfLines={2}>{String(projectId)}</Text>
                    </View>
                  ) : null}

                  {result?.message ? (
                    <View style={[styles.summaryCard, isWideScreen && styles.summaryCardWide]}>
                      <Text style={[styles.summaryLabel, isWideScreen && styles.summaryLabelWide]}>Backend status</Text>
                      <Text style={[styles.summaryText, isWideScreen && styles.summaryTextWide]} numberOfLines={4}>
                        {`${result.status || 'pending'} — ${result.message}`}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </MaxWidthContainer>
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
  scrollContentWide: Platform.select({ web: { paddingBottom: 48 }, default: {} }),
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.panel,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonWide: Platform.select({ web: { marginLeft: 8 }, default: {} }),
  backButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  backButtonTextWide: Platform.select({ web: { fontSize: 16 }, default: {} }),
  qrTitle: {
    color: theme.colors.text,
    ...theme.typography.title,
    textAlign: 'center',
    marginTop: 8,
  },
  qrTitleWide: Platform.select({ web: { fontSize: 48, lineHeight: 56, marginTop: 16 }, default: {} }),
  qrSub: {
    color: theme.colors.muted,
    ...theme.typography.body,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 360,
  },
  qrSubWide: Platform.select({ web: { fontSize: 17, lineHeight: 26, maxWidth: 700, marginTop: 18 }, default: {} }),
  desktopMainRow: {
    width: '100%',
    alignItems: 'center',
  },
  desktopMainRowWide: Platform.select({
    web: {
      marginTop: 18,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 24,
    },
    default: {},
  }),
  leftPane: {
    width: '100%',
    alignItems: 'center',
  },
  leftPaneWide: Platform.select({ web: { flex: 0.9, maxWidth: 520 }, default: {} }),
  rightPane: {
    width: '100%',
  },
  rightPaneWide: Platform.select({ web: { flex: 1.1, alignSelf: 'stretch' }, default: {} }),
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
    borderRadius: 0,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.qrPanel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodePlaceholderWide: Platform.select({ web: { width: 320, height: 320 }, default: {} }),
  qrImage: {
    width: 208,
    height: 208,
  },
  qrImageWide: Platform.select({ web: { width: 320, height: 320 }, default: {} }),
  qrPlaceholderText: {
    color: '#9DB8FF',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  qrImageWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
  qrImageWrapWide: Platform.select({ web: { marginTop: 10 }, default: {} }),
  orText: {
    color: theme.colors.muted,
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  orTextWide: Platform.select({ web: { fontSize: 15, marginTop: 12 }, default: {} }),
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
  processingCardWide: Platform.select({ web: { maxWidth: 760, paddingHorizontal: 26, paddingVertical: 28 }, default: {} }),
  processingTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  processingTitleWide: Platform.select({ web: { fontSize: 30, lineHeight: 38, marginTop: 16 }, default: {} }),
  processingText: {
    color: theme.colors.muted,
    ...theme.typography.body,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },
  processingTextWide: Platform.select({ web: { fontSize: 17, lineHeight: 26, marginTop: 14, maxWidth: 640 }, default: {} }),
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
  summaryCardWide: Platform.select({ web: { maxWidth: '100%', marginTop: 12, padding: 18, borderRadius: 18 }, default: {} }),
  summaryLabel: {
    color: theme.colors.accentText,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryLabelWide: Platform.select({ web: { fontSize: 15, marginBottom: 8 }, default: {} }),
  summaryText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryTextWide: Platform.select({ web: { fontSize: 16, lineHeight: 24 }, default: {} }),
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  ctaWrap: {
    width: '100%',
    maxWidth: 360,
    marginTop: 14,
    alignItems: 'center',
  },
  ctaWrapWide: Platform.select({ web: { marginTop: 18, maxWidth: 420 }, default: {} }),
  ctaButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  ctaButtonWide: Platform.select({ web: { paddingVertical: 12, paddingHorizontal: 24 }, default: {} }),
  ctaButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  ctaButtonTextWide: Platform.select({ web: { fontSize: 16 }, default: {} }),
  ctaUrl: {
    color: theme.colors.muted,
    marginTop: 8,
    fontSize: 12,
    maxWidth: 360,
  },
});
