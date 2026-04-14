import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Backdrop } from '../common/Backdrop';
import theme from '../../theme/theme';

export function ConfigSheet({ visible, onClose, translateY, overlayOpacity }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideScreen = isWeb && width > 1024;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalRootBottom}>
        <Pressable style={styles.overlayTouch} onPress={onClose}>
          <Backdrop opacity={overlayOpacity} />
        </Pressable>

        <Animated.View style={[styles.sheet, isWideScreen && styles.sheetWide, { transform: [{ translateY }] }]}>
          <View style={[styles.sheetHandle, isWideScreen && styles.sheetHandleWide]} />
          <Text style={[styles.sheetTitle, isWideScreen && styles.sheetTitleWide]}>Configuration</Text>

          <View style={[styles.configRow, isWideScreen && styles.configRowWide]}>
            <Text style={[styles.configLabel, isWideScreen && styles.configLabelWide]}>Selected model</Text>
            <Text style={[styles.configValue, isWideScreen && styles.configValueWide]}>qwen-2.5-coder-32b</Text>
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
  sheetWide: Platform.select({
    web: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 1200,
      minHeight: 360,
      paddingHorizontal: 28,
      paddingTop: 16,
      paddingBottom: 28,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
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
    marginBottom: 20,
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
  configRow: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 14,
  },
  configRowWide: Platform.select({
    web: {
      borderRadius: theme.radius.lg,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    default: {},
  }),
  configLabel: {
    color: theme.colors.muted,
    ...theme.typography.caption,
    marginBottom: 5,
  },
  configLabelWide: Platform.select({
    web: {
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 6,
    },
    default: {},
  }),
  configValue: {
    color: theme.colors.text,
    ...theme.typography.bodyStrong,
  },
  configValueWide: Platform.select({
    web: {
      fontSize: 16,
      lineHeight: 23,
    },
    default: {},
  }),
});
