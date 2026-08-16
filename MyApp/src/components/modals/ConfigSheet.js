import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Backdrop } from '../common/Backdrop';
import theme from '../../theme/theme';
import { GITHUB_STATE } from '../../services/githubDeviceAuth';

const GH_STATUS_LABELS = {
  [GITHUB_STATE.IDLE]: 'not connected',
  [GITHUB_STATE.WAITING_FOR_GITHUB_USER_CODE]: 'auth pending',
  [GITHUB_STATE.GITHUB_AUTH_PENDING]: 'auth pending',
  [GITHUB_STATE.GITHUB_AUTH_SUCCESS]: 'connected',
  [GITHUB_STATE.CREATING_REPO]: 'creating repo',
  [GITHUB_STATE.REPO_CREATED]: 'repo created',
  [GITHUB_STATE.PUSH_IN_PROGRESS]: 'pushing',
  [GITHUB_STATE.PUSH_COMPLETE]: 'connected',
  [GITHUB_STATE.ERROR]: 'error',
};

const GH_STATUS_COLORS = {
  [GITHUB_STATE.IDLE]: '#7E8AA5',
  [GITHUB_STATE.WAITING_FOR_GITHUB_USER_CODE]: '#F5C65B',
  [GITHUB_STATE.GITHUB_AUTH_PENDING]: '#F5C65B',
  [GITHUB_STATE.GITHUB_AUTH_SUCCESS]: '#22C55E',
  [GITHUB_STATE.CREATING_REPO]: '#7CC6FF',
  [GITHUB_STATE.REPO_CREATED]: '#7CC6FF',
  [GITHUB_STATE.PUSH_IN_PROGRESS]: '#7CC6FF',
  [GITHUB_STATE.PUSH_COMPLETE]: '#22C55E',
  [GITHUB_STATE.ERROR]: '#F87171',
};

export function ConfigSheet({
  visible,
  onClose,
  translateY,
  overlayOpacity,
  githubStatus,
  githubAuth,
  githubError,
  githubRepo,
  onConnectGitHub,
  onOpenGitHubVerification,
  onCopyRepoUrl,
  onDoneGitHubSuccess,
}) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideScreen = isWeb && width > 1024;

  const statusKey = githubStatus || GITHUB_STATE.IDLE;
  const statusLabel = GH_STATUS_LABELS[statusKey] || 'not connected';
  const statusColor = GH_STATUS_COLORS[statusKey] || '#7E8AA5';

  const isConnected = [GITHUB_STATE.GITHUB_AUTH_SUCCESS, GITHUB_STATE.CREATING_REPO, GITHUB_STATE.REPO_CREATED, GITHUB_STATE.PUSH_IN_PROGRESS, GITHUB_STATE.PUSH_COMPLETE].includes(statusKey);
  const isPending = [GITHUB_STATE.WAITING_FOR_GITHUB_USER_CODE, GITHUB_STATE.GITHUB_AUTH_PENDING].includes(statusKey);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalRootBottom}>
        <Pressable style={styles.overlayTouch} onPress={onClose}>
          <Backdrop opacity={overlayOpacity} />
        </Pressable>

        <Animated.View style={[styles.sheet, isWideScreen && styles.sheetWide, { transform: [{ translateY }] }]}>
          <View style={[styles.sheetHandle, isWideScreen && styles.sheetHandleWide]} />
          <Text style={[styles.sheetTitle, isWideScreen && styles.sheetTitleWide]}>GitHub Repository</Text>

          <View style={[styles.headerRow, isWideScreen && styles.headerRowWide]}>
            <Text style={styles.sectionLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Connect GitHub</Text>

              {!isConnected && !isPending && (
                <Pressable style={styles.primaryButton} onPress={onConnectGitHub}>
                  <Text style={styles.primaryButtonText}>Connect GitHub</Text>
                </Pressable>
              )}

              {isPending && githubAuth && (
                <View style={styles.verificationCard}>
                  <Text style={styles.stepLabel}>1. Open GitHub</Text>
                  <Pressable style={styles.linkButton} onPress={onOpenGitHubVerification}>
                    <Text style={styles.linkButtonText}>{githubAuth.verification_uri}</Text>
                  </Pressable>

                  <Text style={styles.stepLabel}>2. Enter this code</Text>
                  <Text style={styles.userCode}>{githubAuth.user_code}</Text>

                  <Text style={styles.helperText}>Open GitHub, sign in, and enter the code.</Text>
                </View>
              )}

              {statusKey === GITHUB_STATE.GITHUB_AUTH_SUCCESS && (
                <View style={styles.successCard}>
                  <Text style={styles.successTitle}>GitHub connected successfully</Text>
                  <Text style={styles.successBody}>Repository is being created…</Text>
                </View>
              )}

              {statusKey === GITHUB_STATE.CREATING_REPO && (
                <View style={styles.successCard}>
                  <Text style={styles.successTitle}>Creating repository…</Text>
                  <Text style={styles.successBody}>The private repo and initial branch are being set up.</Text>
                </View>
              )}

              {statusKey === GITHUB_STATE.REPO_CREATED && (
                <View style={styles.successCard}>
                  <Text style={styles.successTitle}>Repository ready</Text>
                  <Text style={styles.successBody}>The generated app is being pushed to GitHub.</Text>
                </View>
              )}

              {statusKey === GITHUB_STATE.PUSH_COMPLETE && githubRepo && (
                <View style={styles.successCard}>
                  <Text style={styles.successTitle}>Repository published</Text>
                  <Text style={styles.successBody}>{githubRepo.name}</Text>
                  <Text style={styles.repoUrl}>{githubRepo.html_url}</Text>

                  <View style={styles.actionRow}>
                    <Pressable style={styles.secondaryButton} onPress={onCopyRepoUrl}>
                      <Text style={styles.secondaryButtonText}>Copy repo URL</Text>
                    </Pressable>
                    <Pressable style={styles.primaryButton} onPress={onDoneGitHubSuccess}>
                      <Text style={styles.primaryButtonText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {statusKey === GITHUB_STATE.ERROR && githubError ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>GitHub connection failed</Text>
                  <Text style={styles.errorBody}>{githubError}</Text>
                  <Pressable style={styles.primaryButton} onPress={onConnectGitHub}>
                    <Text style={styles.primaryButtonText}>Retry</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Flow</Text>
              <Text style={styles.flowStep}>1. Connect GitHub</Text>
              <Text style={styles.flowStep}>2. Open verification URL</Text>
              <Text style={styles.flowStep}>3. Enter code on GitHub</Text>
              <Text style={styles.flowStep}>4. Authorize Gwen AI</Text>
              <Text style={styles.flowStep}>5. Repo is created automatically</Text>
              <Text style={styles.flowStep}>6. Generated app is pushed to GitHub</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRootBottom: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
    minHeight: 420,
    maxHeight: '78%',
    backgroundColor: '#0A0D14',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  sheetWide: Platform.select({
    web: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 1000,
      minHeight: 440,
      paddingHorizontal: 28,
      paddingTop: 16,
      paddingBottom: 24,
    },
    default: {},
  }),
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2B344A',
    alignSelf: 'center',
  },
  sheetHandleWide: Platform.select({
    web: {
      width: 58,
      height: 6,
      borderRadius: 4,
    },
    default: {},
  }),
  sheetTitle: {
    color: theme.colors.text,
    ...theme.typography.section,
    marginTop: 14,
    marginBottom: 18,
  },
  sheetTitleWide: Platform.select({
    web: {
      fontSize: 26,
      lineHeight: 34,
      marginTop: 16,
      marginBottom: 18,
    },
    default: {},
  }),
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerRowWide: Platform.select({
    web: {
      marginBottom: 18,
    },
    default: {},
  }),
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: theme.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#06150B',
    fontSize: 14,
    fontWeight: '800',
  },
  verificationCard: {
    backgroundColor: '#090F17',
    borderWidth: 1,
    borderColor: '#22314F',
    padding: 12,
    borderRadius: theme.radius.md,
  },
  stepLabel: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  linkButton: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#2E4C7B',
    borderRadius: theme.radius.sm,
    padding: 10,
    marginBottom: 12,
  },
  linkButtonText: {
    color: '#8CB3FF',
    fontSize: 13,
    fontWeight: '600',
  },
  userCode: {
    color: '#EBF8FF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  helperText: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  successCard: {
    backgroundColor: '#09150F',
    borderWidth: 1,
    borderColor: '#1D6B44',
    padding: 12,
    borderRadius: theme.radius.md,
  },
  successTitle: {
    color: '#9AE6B4',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  successBody: {
    color: '#E5FFEF',
    fontSize: 13,
    lineHeight: 18,
  },
  repoUrl: {
    color: '#8CB3FF',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#101827',
    borderWidth: 1,
    borderColor: '#2B344A',
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: '#180A0A',
    borderWidth: 1,
    borderColor: '#A33B3B',
    padding: 12,
    borderRadius: theme.radius.md,
  },
  errorTitle: {
    color: '#FCA5A5',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  errorBody: {
    color: '#FEE2E2',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  flowStep: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 22,
  },
});
