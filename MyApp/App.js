import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreen } from './src/components/home/HomeScreen';
import { ConfigSheet } from './src/components/modals/ConfigSheet';
import { ProjectsDrawer } from './src/components/modals/ProjectsDrawer';
import { QRScreen } from './src/components/qr/QRScreen';
import { projects } from './src/data/projects';
import theme from './src/theme/theme';

const DRAWER_WIDTH = 320;
const SHEET_HEIGHT = 340;
const API_BASE_URL = 'https://jskarthik45-gwenaibackend.hf.space';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [lastSentPrompt, setLastSentPrompt] = useState('');
  const [promptResult, setPromptResult] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [screen, setScreen] = useState('home');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const pageAnim = useRef(new Animated.Value(0)).current;
  const drawerX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  const pageStyle = useMemo(
    () => ({
      opacity: pageAnim,
      transform: [
        {
          translateY: pageAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    }),
    [pageAnim]
  );

  useEffect(() => {
    animatePageIn();
    wakeBackend();
  }, []);

  const wakeBackend = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/wakeBackend`);
    } catch (error) {
      console.warn('Wake backend failed', error);
    }
  };

  const animatePageIn = () => {
    pageAnim.stopAnimation();
    pageAnim.setValue(0);
    Animated.timing(pageAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(drawerX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(drawerOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerX, {
        toValue: -DRAWER_WIDTH,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(drawerOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerVisible(false));
  };

  const openSheet = () => {
    setSheetVisible(true);
    sheetY.stopAnimation();
    sheetOpacity.stopAnimation();
    Animated.parallel([
      Animated.spring(sheetY, {
        toValue: 0,
        stiffness: 220,
        damping: 22,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = () => {
    sheetY.stopAnimation();
    sheetOpacity.stopAnimation();
    Animated.parallel([
      Animated.spring(sheetY, {
        toValue: SHEET_HEIGHT,
        stiffness: 200,
        damping: 24,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => setSheetVisible(false));
  };

  const onSend = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isSending) return;

    setIsSending(true);
    setPromptResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });

      if (!response.ok) {
        throw new Error('Prompt request failed');
      }

      const data = await response.json();
      setLastSentPrompt(trimmedPrompt);
      setPrompt('');
      setPromptResult(data);
      setScreen('qr');
      animatePageIn();
    } catch (error) {
      Alert.alert('Prompt failed', 'Unable to send prompt. Please try again.');
      console.warn('Prompt send error', error);
    } finally {
      setIsSending(false);
    }
  };

  const onBackHome = () => {
    setPrompt('');
    setScreen('home');
    animatePageIn();
  };

  const onCreateNewMvp = () => {
    closeDrawer();
    setScreen('home');
    animatePageIn();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar style="light" />

        <Animated.View style={[styles.page, pageStyle]}>
          {screen === 'home' ? (
            <HomeScreen
              prompt={prompt}
              onChangePrompt={setPrompt}
              onSend={onSend}
              isSending={isSending}
              onOpenProjects={openDrawer}
              onOpenConfig={openSheet}
            />
          ) : (
            <QRScreen prompt={lastSentPrompt} result={promptResult} onBack={onBackHome} />
          )}
        </Animated.View>

        <ProjectsDrawer
          visible={drawerVisible}
          onClose={closeDrawer}
          translateX={drawerX}
          overlayOpacity={drawerOpacity}
          projects={projects}
          onNewTask={onCreateNewMvp}
        />

        <ConfigSheet
          visible={sheetVisible}
          onClose={closeSheet}
          translateY={sheetY}
          overlayOpacity={sheetOpacity}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  page: {
    flex: 1,
  },
});
