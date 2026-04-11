import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.overlayTouch} onPress={onClose}>
          <Backdrop opacity={overlayOpacity} />
        </Pressable>

        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          <View style={styles.drawerTopRow}>
            <Text style={styles.drawerTitle}>Projects</Text>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
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
                  style={styles.projectItem}
                  onPress={() => onSelectProject?.(project)}
                >
                  <Text style={styles.projectName}>{project.name}</Text>
                  <Text style={styles.projectMeta}>Tap to open QR</Text>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No projects yet</Text>
                <Text style={styles.emptyText}>Create your first MVP to see it here.</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footerRow}>
            <PrimaryButton
              title="+ New MVP"
              onPress={onNewTask}
              style={styles.newTaskBtn}
              textStyle={styles.newTaskBtnText}
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
  newTaskBtnText: {
    ...theme.typography.bodyStrong,
  },
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
  projectName: {
    color: theme.colors.text,
    ...theme.typography.bodyStrong,
  },
  projectMeta: {
    color: theme.colors.muted,
    marginTop: 4,
    ...theme.typography.caption,
  },
  emptyCard: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  emptyTitle: {
    color: theme.colors.text,
    ...theme.typography.bodyStrong,
  },
  emptyText: {
    color: theme.colors.muted,
    marginTop: 6,
    ...theme.typography.caption,
  },
});
