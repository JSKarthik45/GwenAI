import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Backdrop } from '../common/Backdrop';
import { PrimaryButton } from '../common/PrimaryButton';
import theme from '../../theme/theme';

export function ProjectsDrawer({
  visible,
  onClose,
  translateX,
  overlayOpacity,
  projects,
  onNewTask,
  onSelectProject,
}) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideScreen = isWeb && width > 1024;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.overlayTouch} onPress={onClose}>
          <Backdrop opacity={overlayOpacity} />
        </Pressable>

        <Animated.View style={[styles.drawer, isWideScreen && styles.drawerWide, { transform: [{ translateX }] }]}>
          <View style={styles.drawerTopRow}>
            <Text style={[styles.drawerTitle, isWideScreen && styles.drawerTitleWide]}>Projects</Text>
            <Pressable onPress={onClose} style={[styles.closeButton, isWideScreen && styles.closeButtonWide]} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.projectList}
            contentContainerStyle={styles.projectListContent}
            showsVerticalScrollIndicator={false}
          >
            {projects.length ? (
              projects.map((project) => (
                <Pressable
                  key={project.id}
                  style={[styles.projectItem, isWideScreen && styles.projectItemWide]}
                  onPress={() => onSelectProject?.(project)}
                >
                  <Text style={[styles.projectName, isWideScreen && styles.projectNameWide]}>{project.name}</Text>
                  <Text style={[styles.projectMeta, isWideScreen && styles.projectMetaWide]}>Tap to open QR</Text>
                </Pressable>
              ))
            ) : (
              <View style={[styles.emptyCard, isWideScreen && styles.emptyCardWide]}>
                <Text style={[styles.emptyTitle, isWideScreen && styles.emptyTitleWide]}>No projects yet</Text>
                <Text style={[styles.emptyText, isWideScreen && styles.emptyTextWide]}>Create your first MVP to see it here.</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footerRow}>
            <PrimaryButton
              title="+ New MVP"
              onPress={onNewTask}
              style={[styles.newTaskBtn, isWideScreen && styles.newTaskBtnWide]}
              textStyle={[styles.newTaskBtnText, isWideScreen && styles.newTaskBtnTextWide]}
            />
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    width: 320,
    backgroundColor: theme.colors.panelAlt,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingTop: 35,
    paddingBottom: 14,
  },
  drawerWide: Platform.select({
    web: {
      width: 430,
      paddingHorizontal: 20,
      paddingTop: 44,
      paddingBottom: 20,
    },
    default: {},
  }),
  drawerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  drawerTitle: {
    color: theme.colors.text,
    ...theme.typography.section,
  },
  drawerTitleWide: Platform.select({
    web: {
      fontSize: 26,
      lineHeight: 34,
    },
    default: {},
  }),
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.panel,
  },
  closeButtonWide: Platform.select({
    web: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },
    default: {},
  }),
  closeText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: -1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 10,
  },
  newTaskBtn: {
    borderRadius: theme.radius.sm,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
    alignSelf: 'stretch',
    width: '100%',
  },
  newTaskBtnWide: Platform.select({
    web: {
      minHeight: 48,
      borderRadius: theme.radius.md,
      paddingVertical: 12,
    },
    default: {},
  }),
  newTaskBtnText: {
    ...theme.typography.bodyStrong,
  },
  newTaskBtnTextWide: Platform.select({
    web: {
      fontSize: 16,
      lineHeight: 22,
    },
    default: {},
  }),
  projectList: {
    flex: 1,
  },
  projectListContent: {
    gap: 10,
    paddingTop: 6,
    paddingBottom: 12,
  },
  projectItem: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  projectItemWide: Platform.select({
    web: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 14,
    },
    default: {},
  }),
  projectName: {
    color: theme.colors.text,
    ...theme.typography.bodyStrong,
  },
  projectNameWide: Platform.select({
    web: {
      fontSize: 16,
      lineHeight: 22,
    },
    default: {},
  }),
  projectMeta: {
    color: theme.colors.muted,
    marginTop: 4,
    ...theme.typography.caption,
  },
  projectMetaWide: Platform.select({
    web: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 18,
    },
    default: {},
  }),
  emptyCard: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  emptyCardWide: Platform.select({
    web: {
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 16,
    },
    default: {},
  }),
  emptyTitle: {
    color: theme.colors.text,
    ...theme.typography.bodyStrong,
  },
  emptyTitleWide: Platform.select({
    web: {
      fontSize: 16,
      lineHeight: 22,
    },
    default: {},
  }),
  emptyText: {
    color: theme.colors.muted,
    marginTop: 6,
    ...theme.typography.caption,
  },
  emptyTextWide: Platform.select({
    web: {
      fontSize: 13,
      lineHeight: 18,
    },
    default: {},
  }),
});
