import { Animated, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Backdrop } from '../common/Backdrop';
import theme from '../../theme/theme';
import { GITHUB_APP_INSTALL_URL, GITHUB_STATE } from '../../services/githubDeviceAuth';

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
  [GITHUB_STATE.IDLE]: '#9EA4B5',
  [GITHUB_STATE.WAITING_FOR_GITHUB_USER_CODE]: '#F5C65B',
  [GITHUB_STATE.GITHUB_AUTH_PENDING]: '#F5C65B',
  [GITHUB_STATE.GITHUB_AUTH_SUCCESS]: '#22C55E',
  [GITHUB_STATE.CREATING_REPO]: '#8CB3FF',
  [GITHUB_STATE.REPO_CREATED]: '#8CB3FF',
  [GITHUB_STATE.PUSH_IN_PROGRESS]: '#8CB3FF',
  [GITHUB_STATE.PUSH_COMPLETE]: '#22C55E',
  [GITHUB_STATE.ERROR]: '#EF4444',
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
  githubAccessToken,
  onDisconnectGitHub,
}) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideScreen = isWeb && width > 1024;

  const hasToken = !!githubAccessToken;

  const statusKey = hasToken 
    ? (githubStatus === GITHUB_STATE.IDLE ? GITHUB_STATE.GITHUB_AUTH_SUCCESS : githubStatus)
    : (githubStatus || GITHUB_STATE.IDLE);

  const statusLabel = hasToken ? 'connected' : (GH_STATUS_LABELS[statusKey] || 'not connected');
  const statusColor = hasToken ? '#22C55E' : (GH_STATUS_COLORS[statusKey] || '#9EA4B5');

  const isConnected = hasToken || [GITHUB_STATE.GITHUB_AUTH_SUCCESS, GITHUB_STATE.CREATING_REPO, GITHUB_STATE.REPO_CREATED, GITHUB_STATE.PUSH_IN_PROGRESS, GITHUB_STATE.PUSH_COMPLETE].includes(statusKey);
  const isPending = !hasToken && [GITHUB_STATE.WAITING_FOR_GITHUB_USER_CODE, GITHUB_STATE.GITHUB_AUTH_PENDING].includes(statusKey);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalRootBottom}>
        <Pressable style={styles.overlayTouch} onPress={onClose}>
          <Backdrop opacity={overlayOpacity} />
        </Pressable>

        <Animated.View style={[styles.sheet, isWideScreen && styles.sheetWide, { transform: [{ translateY }] }]}>
          <View style={[styles.sheetHandle, isWideScreen && styles.sheetHandleWide]} />
          
          <View style={[styles.titleRow, isWideScreen && styles.titleRowWide]}>
            <Text style={[styles.sheetTitle, isWideScreen && styles.sheetTitleWide]}>GitHub Integration</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}14`, borderColor: `${statusColor}33` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            
            <View style={styles.mainSection}>
              {!isConnected && !isPending && (
                <View style={styles.connectionGroup}>
                  <Text style={styles.descriptionText}>
                    Link your GitHub account to enable automatic repository creation and code pushing for every generated MVP.
                  </Text>
                  
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={async () => {
                      try {
                        await Linking.openURL(GITHUB_APP_INSTALL_URL);
                      } catch (error) {
                        console.warn('GitHub app install open failed', error);
                      }
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>1. Install Gwen AI GitHub App</Text>
                  </Pressable>

                  <Pressable style={[styles.primaryButton, styles.primaryButtonSpacer]} onPress={onConnectGitHub}>
                    <Text style={styles.primaryButtonText}>2. Authorize Account</Text>
                  </Pressable>
                </View>
              )}

              {isPending && githubAuth && (
                <View style={styles.verificationCard}>
                  <Text style={styles.stepLabel}>1. Open Verification URL</Text>
                  <Pressable style={styles.linkButton} onPress={onOpenGitHubVerification}>
                    <Text style={styles.linkButtonText}>{githubAuth.verification_uri}</Text>
                  </Pressable>

                  <Text style={styles.stepLabel}>2. Enter Code on GitHub</Text>
                  <Text style={styles.userCode}>{githubAuth.user_code}</Text>

                  <Text style={styles.helperText}>Open the link, sign in to your GitHub account, and enter the code displayed above.</Text>
                </View>
              )}

              {isConnected && (
                <View style={styles.successCard}>
                  <Text style={styles.successTitle}>GitHub Connected</Text>
                  <Text style={styles.successBody}>
                    Your account is successfully authorized. When you submit a prompt, Gwen AI will create a new private repository and push the code directly to your GitHub.
                  </Text>
                  
                  {githubRepo && githubRepo.html_url ? (
                    <View style={styles.repoContainer}>
                      <Text style={[styles.successBody, { fontWeight: '700', marginTop: 12 }]}>Active Repository:</Text>
                      <Text style={styles.repoUrl}>{githubRepo.html_url}</Text>
                      <View style={styles.actionRow}>
                        <Pressable style={styles.secondaryButtonCompact} onPress={onCopyRepoUrl}>
                          <Text style={styles.secondaryButtonTextCompact}>Copy Repository URL</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  <View style={[styles.actionRow, { marginTop: 20 }]}>
                    <Pressable style={styles.disconnectButton} onPress={onDisconnectGitHub}>
                      <Text style={styles.disconnectButtonText}>Disconnect</Text>
                    </Pressable>
                    <Pressable style={styles.doneButton} onPress={onClose}>
                      <Text style={styles.doneButtonText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {!isConnected && statusKey === GITHUB_STATE.ERROR && githubError ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>Connection Failed</Text>
                  <Text style={styles.errorBody}>{githubError}</Text>
                  <Pressable style={styles.primaryButton} onPress={onConnectGitHub}>
                    <Text style={styles.primaryButtonText}>Retry Authorization</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <View style={styles.divider} />

            <View style={styles.flowSection}>
              <Text style={styles.flowTitle}>How It Works</Text>
              <View style={styles.flowSteps}>
                <Text style={styles.flowStep}><Text style={styles.flowNumber}>1</Text>  Install the Gwen AI GitHub App</Text>
                <Text style={styles.flowStep}><Text style={styles.flowNumber}>2</Text>  Authorize your account using the device code</Text>
                <Text style={styles.flowStep}><Text style={styles.flowNumber}>3</Text>  Submit prompts to generate your Expo application</Text>
                <Text style={styles.flowStep}><Text style={styles.flowNumber}>4</Text>  Gwen AI automatically pushes the codebase to your repo</Text>
              </View>
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
    minHeight: 460,
    maxHeight: '80%',
    backgroundColor: theme.colors.panelAlt,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sheetWide: Platform.select({
    web: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 580,
      minHeight: 480,
      paddingHorizontal: 26,
      paddingTop: 16,
      paddingBottom: 28,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderLeftColor: theme.colors.border,
      borderRightColor: theme.colors.border,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
    },
    default: {},
  }),
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    opacity: 0.8,
  },
  sheetHandleWide: Platform.select({
    web: {
      width: 58,
      height: 6,
      borderRadius: 4,
    },
    default: {},
  }),
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 22,
  },
  titleRowWide: Platform.select({
    web: {
      marginTop: 20,
      marginBottom: 24,
    },
    default: {},
  }),
  sheetTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.section.fontSize,
    fontWeight: theme.typography.section.fontWeight,
  },
  sheetTitleWide: Platform.select({
    web: {
      fontSize: 24,
    },
    default: {},
  }),
  statusBadge: {
    borderWidth: 1,
    borderRadius: theme.radius.round,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  mainSection: {
    marginBottom: 22,
  },
  connectionGroup: {
    width: '100%',
  },
  descriptionText: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  primaryButtonSpacer: {
    marginTop: 12,
  },
  primaryButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButtonCompact: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryButtonTextCompact: {
    color: theme.colors.accentText,
    fontSize: 13,
    fontWeight: '600',
  },
  verificationCard: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    borderRadius: theme.radius.md,
  },
  stepLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  linkButton: {
    backgroundColor: theme.colors.panelAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: 12,
    marginBottom: 16,
  },
  linkButtonText: {
    color: theme.colors.accentText,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  userCode: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
    marginVertical: 12,
  },
  helperText: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  successCard: {
    backgroundColor: '#07160E',
    borderWidth: 1,
    borderColor: '#15803D',
    padding: 20,
    borderRadius: theme.radius.md,
  },
  successTitle: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  successBody: {
    color: '#E4FBEF',
    fontSize: 14,
    lineHeight: 20,
  },
  repoContainer: {
    width: '100%',
  },
  repoUrl: {
    color: theme.colors.accentText,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    textDecorationLine: 'underline',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  disconnectButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 46,
  },
  disconnectButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  doneButton: {
    flex: 1.2,
    backgroundColor: '#15803D',
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 46,
  },
  doneButtonText: {
    color: '#E4FBEF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: '#1C0A0A',
    borderWidth: 1,
    borderColor: '#991B1B',
    padding: 20,
    borderRadius: theme.radius.md,
  },
  errorTitle: {
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorBody: {
    color: '#FEE2E2',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 18,
    opacity: 0.6,
  },
  flowSection: {
    marginBottom: 20,
  },
  flowTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  flowSteps: {
    gap: 12,
  },
  flowStep: {
    color: theme.colors.muted,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  flowNumber: {
    color: theme.colors.accentText,
    fontWeight: '700',
  },
});
