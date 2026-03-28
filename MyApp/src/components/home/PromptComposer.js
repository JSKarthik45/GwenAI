import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../common/PrimaryButton';
import theme from '../../theme/theme';

export function PromptComposer({ prompt, onChangePrompt, onSend, onOpenConfig }) {
  return (
    <View style={styles.composerDock}>
      <View style={styles.promptCard}>
        <TextInput
          style={styles.promptInput}
          placeholder="Describe your app idea..."
          placeholderTextColor={theme.colors.muted}
          value={prompt}
          onChangeText={onChangePrompt}
          onBlur={Keyboard.dismiss}
          numberOfLines={2}
          multiline
          scrollEnabled={false}
        />

        <View style={styles.actionRow}>
          <Pressable style={styles.configCircle} onPress={onOpenConfig}>
            <Text style={styles.configCircleText}>⚙</Text>
          </Pressable>

          <PrimaryButton onPress={onSend} style={styles.sendButton}>
            <Text style={styles.sendArrow}>➤</Text>
          </PrimaryButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  composerDock: {
    width: '100%',
  },
  promptCard: {
    width: '100%',
    height: 140,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
    justifyContent: 'space-between',
    paddingLeft: 14,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  promptInput: {
    width: '100%',
    height: 52,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: 'top',
    paddingVertical: 6,
    paddingRight: 4,
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: '#2951BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configCircleText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  sendButton: {
    width: 46,
    height: 46,
    minWidth: 46,
    borderRadius: 23,
    paddingHorizontal: 0,
  },
  sendArrow: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: '800',
    marginLeft: 2,
  },
});
