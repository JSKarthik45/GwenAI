import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Backdrop } from '../common/Backdrop';
import { PrimaryButton } from '../common/PrimaryButton';
import theme from '../../theme/theme';

export function ConfigSheet({ visible, onClose, translateY, overlayOpacity }) {
  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalRootBottom}>
        <Pressable style={styles.overlayTouch} onPress={onClose}>
          <Backdrop opacity={overlayOpacity} />
        </Pressable>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Configuration</Text>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Selected model</Text>
            <Text style={styles.configValue}>qwen-2.5-coder-32b</Text>
          </View>

          <PrimaryButton onPress={() => {}} style={styles.githubBtn}>
            <View style={styles.githubBtnContent}>
              <FontAwesome name="github" size={18} color={theme.colors.text} />
              <Text style={styles.githubBtnText}>Connect to GitHub</Text>
            </View>
          </PrimaryButton>

          <Text style={styles.sheetHint}>
            GitHub and model controls are UI placeholders for now.
          </Text>
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
    minHeight: 340,
    backgroundColor: '#0A0D14',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22,
  },
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2B344A',
    alignSelf: 'center',
  },
  sheetTitle: {
    color: theme.colors.text,
    ...theme.typography.section,
    marginTop: 14,
    marginBottom: 20,
  },
  configRow: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 14,
  },
  configLabel: {
    color: theme.colors.muted,
    ...theme.typography.caption,
    marginBottom: 5,
  },
  configValue: {
    color: theme.colors.text,
    ...theme.typography.bodyStrong,
  },
  githubBtn: {
    height: 50,
  },
  githubBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  githubBtnText: {
    color: theme.colors.text,
    ...theme.typography.bodyStrong,
  },
  sheetHint: {
    color: theme.colors.muted,
    marginTop: 14,
    ...theme.typography.caption,
    lineHeight: 18,
  },
});
