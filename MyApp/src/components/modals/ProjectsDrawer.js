import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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
            <PrimaryButton
              title="+ New Task"
              onPress={onNewTask}
              style={styles.newTaskBtn}
              textStyle={styles.newTaskBtnText}
            />
          </View>

          <View style={styles.projectList}>
            {projects.map((project) => (
              <Pressable key={project.id} style={styles.projectItem}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectMeta}>Updated {project.updated}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.profileCompact}>
            <Text style={styles.profileName}>Karthik J</Text>
            <Text style={styles.profileMail}>karthik@example.com</Text>
            <Text style={styles.profilePlan}>Pro Builder</Text>
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
    paddingTop: 18,
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
  newTaskBtn: {
    borderRadius: theme.radius.sm,
    minHeight: 36,
    minWidth: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  newTaskBtnText: {
    fontSize: 12,
  },
  projectList: {
    flex: 1,
    gap: 10,
    paddingTop: 6,
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
    fontWeight: '700',
    fontSize: 14,
  },
  projectMeta: {
    color: theme.colors.muted,
    marginTop: 4,
    fontSize: 12,
  },
  profileCompact: {
    marginTop: 12,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 2,
  },
  profileName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  profileMail: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  profilePlan: {
    color: theme.colors.accentText,
    fontSize: 12,
    fontWeight: '700',
  },
});
