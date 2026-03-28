import { Animated, StyleSheet } from 'react-native';
import theme from '../../theme/theme';

export function Backdrop({ opacity }) {
  return <Animated.View style={[styles.overlay, { opacity }]} />;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
});
