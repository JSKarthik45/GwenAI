import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { PromptComposer } from './PromptComposer';
import theme from '../../theme/theme';

export function HomeScreen({ prompt, onChangePrompt, onSend, onOpenProjects, onOpenConfig }) {
  const handleOpenProjects = () => {
    Keyboard.dismiss();
    onOpenProjects?.();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.homeWrap}>
        <Pressable style={styles.menuButton} onPress={handleOpenProjects}>
          <Text style={styles.menuButtonText}>≡</Text>
        </Pressable>

        <View style={styles.heroWrap}>
          <Text style={styles.heroTitle}>Have an idea?</Text>
          <Text style={styles.heroTitleAccent}>View it as an app right now.</Text>
          <Text style={styles.heroSub}>
            Turn prompts into MVPs in minutes. Describe your app and start building.
          </Text>
        </View>

        <KeyboardAvoidingView
          style={styles.composerWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <PromptComposer
            prompt={prompt}
            onChangePrompt={onChangePrompt}
            onSend={onSend}
            onOpenConfig={() => {
              Keyboard.dismiss();
              onOpenConfig?.();
            }}
          />
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  homeWrap: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  menuButton: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 6,
    left: 18,
    zIndex: 3,
  },
  menuButtonText: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: -1,
  },
  heroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: 40,
  },
  heroTitle: {
    ...theme.typography.display,
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  heroTitleAccent: {
    color: theme.colors.accentText,
    fontSize: 29,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },
  heroSub: {
    color: theme.colors.muted,
    ...theme.typography.body,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 360,
  },
  composerWrap: {
    width: '100%',
  },
});
