import { Pressable, StyleSheet, Text } from 'react-native';
import theme from '../../theme/theme';

export function PrimaryButton({ title, onPress, style, textStyle, children, disabled }) {
  const handlePress = disabled ? undefined : onPress;
  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={handlePress}
      disabled={disabled}
    >
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
  disabled: {
    opacity: 0.45,
  },
  text: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
