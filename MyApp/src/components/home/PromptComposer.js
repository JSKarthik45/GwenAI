import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { PrimaryButton } from '../common/PrimaryButton';
import theme from '../../theme/theme';

export function PromptComposer({ prompt, onChangePrompt, onSend, onOpenConfig, sending }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [configHovered, setConfigHovered] = useState(false);
  const [sendHovered, setSendHovered] = useState(false);
  const { width } = useWindowDimensions();
  const inputRef = useRef(null);
  const blurResetTimerRef = useRef(null);

  const isWeb = Platform.OS === 'web';
  const isWideScreen = isWeb && width > 1024;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
      if (blurResetTimerRef.current) {
        clearTimeout(blurResetTimerRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.composerDock}>
      <Pressable
        style={[styles.promptCard, isWideScreen && styles.promptCardWide]}
        onPress={() => {
          if (isWeb) {
            inputRef.current?.focus?.();
            setKeyboardVisible(true);
          }
        }}
      >
        <TextInput
          ref={inputRef}
          style={[styles.promptInput, isWeb && styles.promptInputWeb, isWideScreen && styles.promptInputWide]}
          placeholder="Describe your app idea..."
          placeholderTextColor={theme.colors.muted}
          value={prompt}
          onChangeText={onChangePrompt}
          onBlur={() => {
            if (isWeb) {
              if (blurResetTimerRef.current) {
                clearTimeout(blurResetTimerRef.current);
              }
              blurResetTimerRef.current = setTimeout(() => {
                setKeyboardVisible(false);
                blurResetTimerRef.current = null;
              }, 80);
              return;
            }
            setKeyboardVisible(false);
            Keyboard.dismiss();
          }}
          onFocus={() => {
            if (blurResetTimerRef.current) {
              clearTimeout(blurResetTimerRef.current);
              blurResetTimerRef.current = null;
            }
            setKeyboardVisible(true);
          }}
          numberOfLines={2}
          multiline
          scrollEnabled={false}
          editable={true}
        />

        <View style={styles.actionRow}>
          {!keyboardVisible && (
            <Pressable 
              style={[styles.configCircle, configHovered && styles.configCircleHovered]}
              onPress={onOpenConfig}
              onMouseEnter={() => isWeb && setConfigHovered(true)}
              onMouseLeave={() => isWeb && setConfigHovered(false)}
            >
              <Text style={styles.configCircleText}>⚙</Text>
            </Pressable>
          )}

          <PrimaryButton
            onPress={onSend}
            style={[styles.sendButton, keyboardVisible && styles.sendButtonWide, sendHovered && isWeb && styles.sendButtonHovered]}
            disabled={!prompt?.trim() || sending}
            onMouseEnter={() => isWeb && setSendHovered(true)}
            onMouseLeave={() => isWeb && setSendHovered(false)}
          >
            <Text style={[styles.sendArrow, keyboardVisible && styles.sendTextWide]}>
              {sending ? '...' : keyboardVisible ? 'Send' : '➤'}
            </Text>
          </PrimaryButton>
        </View>
      </Pressable>
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
    ...Platform.select({
      web: {
        cursor: 'auto',
        pointerEvents: 'auto',
      },
      default: {},
    }),
  },
  promptCardWide: Platform.select({
    web: {
      minHeight: 160,
      height: 'auto',
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    default: {},
  }),
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
  promptInputWeb: Platform.select({
    web: {
      cursor: 'text',
      outline: 'none',
      WebkitAppearance: 'none',
      appearance: 'none',
      boxSizing: 'border-box',
    },
    default: {},
  }),
  promptInputWide: Platform.select({
    web: {
      fontSize: 17,
      lineHeight: 26,
    },
    default: {},
  }),
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
  configCircleHovered: Platform.select({
    web: {
      backgroundColor: '#354a8a',
      cursor: 'pointer',
    },
    default: {},
  }),
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
  sendButtonWide: {
    flex: 1,
    minWidth: 0,
    height: 48,
    borderRadius: theme.radius.md,
  },
  sendButtonHovered: Platform.select({
    web: {
      backgroundColor: '#364f8f',
      cursor: 'pointer',
    },
    default: {},
  }),
  sendArrow: {
    color: theme.colors.text,
    fontSize: 21,
    fontWeight: '800',
    marginLeft: 2,
  },
  sendTextWide: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 0,
  },
});
