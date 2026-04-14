import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { PromptComposer } from './PromptComposer';
import { MaxWidthContainer } from '../common/MaxWidthContainer';
import theme from '../../theme/theme';

export function HomeScreen({ prompt, onChangePrompt, onSend, isSending, onOpenProjects, onOpenConfig }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideScreen = isWeb && width > 1024;
  
  const handleOpenProjects = () => {
    Keyboard.dismiss();
    onOpenProjects?.();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.homeWrap}
        behavior={Platform.select({ ios: 'padding', android: 'padding' })}
        keyboardVerticalOffset={Platform.select({ ios: 10, android: 0 })}
      >
        <MaxWidthContainer>
          <Pressable style={[styles.menuButton, isWideScreen && styles.menuButtonWide]} onPress={handleOpenProjects}>
            <Text style={styles.menuButtonText}>≡</Text>
          </Pressable>

          <View style={[styles.heroWrap, isWideScreen && styles.heroWrapWide]}>
            <Text style={[styles.heroTitle, isWideScreen && styles.heroTitleWide]}>Have an idea?</Text>
            <Text style={[styles.heroTitleAccent, isWideScreen && styles.heroTitleAccentWide]}>View it as an app right now.</Text>
            <Text style={[styles.heroSub, isWideScreen && styles.heroSubWide]}>
              Turn prompts into MVPs in minutes. Describe your app and start building.
            </Text>
          </View>

          <View style={[styles.composerWrap, isWideScreen && styles.composerWrapWide]}>
            <PromptComposer
              prompt={prompt}
              onChangePrompt={onChangePrompt}
              onSend={onSend}
              sending={isSending}
              onOpenConfig={() => {
                Keyboard.dismiss();
                onOpenConfig?.();
              }}
            />
          </View>
        </MaxWidthContainer>
      </KeyboardAvoidingView>
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
    top: 15,
    left: 18,
    zIndex: 3,
  },
  menuButtonWide: Platform.select({
    web: {
      left: 'auto',
      right: 18,
    },
    default: {},
  }),
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
  heroWrapWide: Platform.select({
    web: {
      paddingTop: 60,
      paddingHorizontal: 40,
    },
    default: {},
  }),
  heroTitle: {
    ...theme.typography.display,
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  heroTitleWide: Platform.select({
    web: {
      fontSize: 48,
      lineHeight: 56,
      letterSpacing: 0.3,
    },
    default: {},
  }),
  heroTitleAccent: {
    color: theme.colors.accentText,
    fontSize: 29,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },
  heroTitleAccentWide: Platform.select({
    web: {
      fontSize: 36,
      lineHeight: 44,
      marginTop: 8,
    },
    default: {},
  }),
  heroSub: {
    color: theme.colors.muted,
    ...theme.typography.body,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 360,
  },
  heroSubWide: Platform.select({
    web: {
      fontSize: 17,
      lineHeight: 26,
      marginTop: 24,
      maxWidth: 600,
    },
    default: {},
  }),
  composerWrap: {
    width: '100%',
    paddingBottom: 30,
  },
  composerWrapWide: Platform.select({
    web: {
      maxWidth: 700,
      alignSelf: 'center',
      paddingBottom: 60,
    },
    default: {},
  }),
});
