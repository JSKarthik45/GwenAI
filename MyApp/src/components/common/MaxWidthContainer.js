import { Platform, StyleSheet, View } from 'react-native';
import { useWindowDimensions } from 'react-native';

/**
 * MaxWidthContainer - A responsive wrapper for web/desktop displays
 * Constrains content to 1200px max-width on screens > 1024px
 * Mobile rendering unaffected
 */
export function MaxWidthContainer({ children, style }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideScreen = isWeb && width > 1024;

  const containerStyle = [
    styles.container,
    isWideScreen && {
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%',
    },
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
