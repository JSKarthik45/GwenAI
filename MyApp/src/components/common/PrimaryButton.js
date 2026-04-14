import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import theme from '../../theme/theme';

export function PrimaryButton({ 
  title, 
  onPress, 
  style, 
  textStyle, 
  children, 
  disabled,
  onMouseEnter,
  onMouseLeave,
}) {
  const handlePress = disabled ? undefined : onPress;
  const isWeb = Platform.OS === 'web';
  
  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={handlePress}
      onMouseEnter={isWeb ? onMouseEnter : undefined}
      onMouseLeave={isWeb ? onMouseLeave : undefined}
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
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
      },
      default: {},
    }),
  },
  disabled: {
    opacity: 0.45,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
      default: {},
    }),
  },
  text: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
