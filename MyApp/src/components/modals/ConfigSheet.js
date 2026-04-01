import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Backdrop } from '../common/Backdrop';
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
});
