import { Pressable, StyleSheet, Text } from 'react-native';
import theme from '../../theme/theme';

export function PrimaryButton({ title, onPress, style, textStyle, children }) {
  return (
    <Pressable style={[styles.button, style]} onPress={onPress}>
      {children || <Text style={[styles.text, textStyle]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    minHeight: 44,
    minWidth: 76,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
