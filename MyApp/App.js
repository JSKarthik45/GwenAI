import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreen } from './src/components/home/HomeScreen';
import { ConfigSheet } from './src/components/modals/ConfigSheet';
import { ProjectsDrawer } from './src/components/modals/ProjectsDrawer';
import { QRScreen } from './src/components/qr/QRScreen';
import {
  GITHUB_STATE,
  getGithubFriendlyErrorMessage,
  pollGitHubAuthStatus,
  startGitHubDeviceAuth,
  triggerGitHubRepoSetup,
} from './src/services/githubDeviceAuth';
import theme from './src/theme/theme';

const DRAWER_WIDTH = 320;
const SHEET_HEIGHT = 340;
const API_BASE_URL = 'https://jskarthik45-gwenaibackend.hf.space';
const STORED_USER_ID_KEY = 'stored_user_id';
const MY_PROJECTS_KEY = 'my_projects';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const resolveProjectId = (payload) =>
  payload?.project_id ||
  payload?.projectId ||
  payload?.id ||
  payload?.data?.project_id ||
  payload?.data?.projectId ||
  payload?.data?.id ||
  payload?.data?.qr_code?.project_id ||
  payload?.data?.qr_code?.projectId ||
  null;

const resolveProjectName = (payload, fallbackPrompt) =>
  payload?.project_name ||
  payload?.projectName ||
  payload?.data?.project_name ||
  payload?.data?.projectName ||
  fallbackPrompt ||
  'Untitled MVP';

const resolveQrContent = (payload) =>
  payload?.data?.qr_code?.qr_image_url ||
  payload?.data?.qr_code?.qrImageUrl ||
  payload?.data?.qr_code?.qr_code ||
  payload?.data?.qr_image_url ||
  payload?.data?.qrImageUrl ||
  payload?.data?.snack_url ||
  payload?.data?.snackUrl ||
  payload?.qr_image_url ||
  payload?.qrImageUrl ||
  payload?.snack_url ||
  payload?.snackUrl ||
  payload?.qr_content ||
  payload?.qrContent ||
  payload?.qr_data ||
  payload?.qrData ||
  payload?.data?.qr_content ||
  payload?.data?.qrContent ||
  payload?.data?.qr_data ||
  payload?.data?.qrData ||
  payload?.data?.qr_code?.snack_url ||
  payload?.data?.qr_code?.snackUrl ||
  null;

const isValidUserId = (value) => UUID_REGEX.test(String(value || ''));

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [lastSentPrompt, setLastSentPrompt] = useState('');
  const [promptResult, setPromptResult] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isBootstrappingUser, setIsBootstrappingUser] = useState(true);
  const [myProjects, setMyProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [qrContent, setQrContent] = useState(null);
  const [qrMessage, setQrMessage] = useState('');
  const [isFetchingQR, setIsFetchingQR] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [screen, setScreen] = useState('home');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [githubStatus, setGithubStatus] = useState(GITHUB_STATE.IDLE);
  const [githubAuthData, setGithubAuthData] = useState(null);
  const [githubRepoData, setGithubRepoData] = useState(null);
  const [githubError, setGithubError] = useState('');

  const pageAnim = useRef(new Animated.Value(0)).current;
  const githubPollTimerRef = useRef(null);
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
    bootstrapUserAndProjects();
  }, []);

  const bootstrapUserAndProjects = async () => {
    setIsBootstrappingUser(true);

    try {
      const [storedUserId, storedProjects] = await Promise.all([
        AsyncStorage.getItem(STORED_USER_ID_KEY),
        AsyncStorage.getItem(MY_PROJECTS_KEY),
      ]);

      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        if (Array.isArray(parsedProjects)) {
          setMyProjects(parsedProjects);
        }
      }

      if (storedUserId && isValidUserId(storedUserId)) {
        setUserId(storedUserId);
        return;
      }

      if (storedUserId && !isValidUserId(storedUserId)) {
        await AsyncStorage.removeItem(STORED_USER_ID_KEY);
      }

      const initResponse = await fetch(`${API_BASE_URL}/api/init-user`);
      if (!initResponse.ok) {
        throw new Error('Init user request failed');
      }

      const initData = await initResponse.json();
      const freshUserId =
        initData?.user_id || initData?.userId || initData?.id || initData?.stored_user_id;

      if (!freshUserId) {
        throw new Error('Init user response missing user id');
      }

      await AsyncStorage.setItem(STORED_USER_ID_KEY, String(freshUserId));
      setUserId(String(freshUserId));
    } catch (error) {
      console.warn('User bootstrap failed', error);
      Alert.alert('Connection issue', 'Unable to initialize your user profile. Please try again.');
    } finally {
      setIsBootstrappingUser(false);
    }
  };

  const persistProjects = async (projectsToStore) => {
    setMyProjects(projectsToStore);
    await AsyncStorage.setItem(MY_PROJECTS_KEY, JSON.stringify(projectsToStore));
  };

  const upsertProject = async (projectPayload, sourcePrompt) => {
    const projectId = resolveProjectId(projectPayload);
    if (!projectId) return null;

    const projectName = resolveProjectName(projectPayload, sourcePrompt);
    const updatedAt = new Date().toISOString();

    const incomingProject = {
      id: String(projectId),
      name: String(projectName),
      updatedAt,
    };

    const existingIdx = myProjects.findIndex((p) => p.id === incomingProject.id);
    const nextProjects = [...myProjects];

    if (existingIdx >= 0) {
      nextProjects[existingIdx] = { ...nextProjects[existingIdx], ...incomingProject };
    } else {
      nextProjects.unshift(incomingProject);
    }

    await persistProjects(nextProjects);
    return incomingProject;
  };

  const handleViewQR = async (project) => {
    if (!project?.id) return;

    setSelectedProject(project);
    setScreen('qr');
    animatePageIn();

    const projectId = String(project.id);
    const localQrKey = `qr_content_${projectId}`;
    const localQrResultKey = `qr_result_${projectId}`;

    try {
      setIsFetchingQR(true);
      setQrMessage('');

      const [cachedQrResultRaw, cachedQr] = await Promise.all([
        AsyncStorage.getItem(localQrResultKey),
        AsyncStorage.getItem(localQrKey),
      ]);

      if (cachedQrResultRaw) {
        try {
          const cachedQrResult = JSON.parse(cachedQrResultRaw);
          // Only accept persisted results that are completed
          if (cachedQrResult?.status === 'completed') {
            const cachedQrContent = resolveQrContent(cachedQrResult) || cachedQr;
            setPromptResult(cachedQrResult);
            setQrContent(cachedQrContent ? String(cachedQrContent) : null);
            return;
          }

          // Remove non-completed persisted results (we don't persist processing/error states)
          await AsyncStorage.removeItem(localQrResultKey);
        } catch (parseError) {
          await AsyncStorage.removeItem(localQrResultKey);
        }
      }

      if (cachedQr) {
        // Legacy QR-only cache exists; promote to a completed-shaped result for compatibility
        const completedCachedResult = {
          status: 'completed',
          data: { qr_content: String(cachedQr) },
          error: null,
        };

        setQrContent(cachedQr);
        setPromptResult(completedCachedResult);
        await AsyncStorage.setItem(localQrResultKey, JSON.stringify(completedCachedResult));
        return;
      }

      if (!userId) {
        throw new Error('Missing user id for QR fetch');
      }

      const qrResponse = await fetch(`${API_BASE_URL}/api/get-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_id: projectId, user_id: userId }),
      });

      if (!qrResponse.ok) {
        throw new Error('QR fetch request failed');
      }

      const qrData = await qrResponse.json();

      if (qrData?.status === 'completed') {
        // Persist only completed responses
        await AsyncStorage.setItem(localQrResultKey, JSON.stringify(qrData));

        const returnedQrContent = resolveQrContent(qrData);
        if (returnedQrContent) {
          await AsyncStorage.setItem(localQrKey, String(returnedQrContent));
          setQrContent(String(returnedQrContent));
        } else {
          setQrContent(null);
        }

        setPromptResult(qrData);
        return;
      }

      if (qrData?.status === 'processing') {
        setQrContent(null);
        setPromptResult(qrData);
        setQrMessage(qrData?.message || 'Your MVP is being generated. Please check back in a few minutes.');
        return;
      }

      // Handle error or unexpected status: surface message, do not persist
      if (qrData?.status === 'error' || qrData?.error) {
        setQrContent(null);
        setPromptResult(qrData);
        setQrMessage(qrData?.error || 'Unable to fetch QR right now.');
        return;
      }
    } catch (error) {
      console.warn('View QR failed', error);
      setQrMessage('Unable to fetch QR right now. Please try again shortly.');
    } finally {
      setIsFetchingQR(false);
    }
  };

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

  const clearGithubPolling = () => {
    if (githubPollTimerRef.current) {
      clearTimeout(githubPollTimerRef.current);
      githubPollTimerRef.current = null;
    }
  };

  const handleGitHubConnectSuccess = async () => {
    clearGithubPolling();
    setGithubStatus(GITHUB_STATE.CREATING_REPO);
    setGithubError('');

    try {
      const repoData = await triggerGitHubRepoSetup({
        baseUrl: API_BASE_URL,
        accessToken: githubAuthData?.access_token || null,
      });

      setGithubRepoData(repoData);
      setGithubStatus(repoData?.html_url ? GITHUB_STATE.PUSH_COMPLETE : GITHUB_STATE.REPO_CREATED);
    } catch (error) {
      const statusCode = Number(error?.status || 0);
      if (statusCode === 404 || statusCode === 405) {
        setGithubStatus(GITHUB_STATE.GITHUB_AUTH_SUCCESS);
        setGithubError('');
        return;
      }

      console.warn('GitHub repo setup failed', error);
      setGithubStatus(GITHUB_STATE.ERROR);
      setGithubError(getGithubFriendlyErrorMessage('repo_creation_failed', 'Repository creation failed. Please try again.'));
    }
  };

  const pollGithubAuthUntilSuccess = async (deviceCode, intervalSeconds = 5) => {
    clearGithubPolling();

    if (!userId) {
      setGithubStatus(GITHUB_STATE.ERROR);
      setGithubError('Your user profile is still initializing. Please try again in a moment.');
      return;
    }

    let sleepSeconds = Math.max(intervalSeconds || 5, 5);

    const step = async () => {
      try {
        const result = await pollGitHubAuthStatus({
          baseUrl: API_BASE_URL,
          deviceCode,
          userId,
        });

        if (result.status === 'success') {
          setGithubStatus(GITHUB_STATE.GITHUB_AUTH_SUCCESS);
          await handleGitHubConnectSuccess();
          return;
        }

        if (result.status === 'slow_down') {
          sleepSeconds += 5;
          setGithubStatus(GITHUB_STATE.GITHUB_AUTH_PENDING);
          setGithubError(getGithubFriendlyErrorMessage('slow_down', 'GitHub is asking for a slower polling cadence.'));
        } else if (result.status === 'authorization_pending') {
          setGithubStatus(GITHUB_STATE.GITHUB_AUTH_PENDING);
          setGithubError('');
        } else if (result.status === 'expired_token') {
          setGithubStatus(GITHUB_STATE.ERROR);
          setGithubError(getGithubFriendlyErrorMessage('expired_token', 'GitHub authorization expired. Please reconnect.'));
          return;
        } else if (result.status === 'access_denied') {
          setGithubStatus(GITHUB_STATE.ERROR);
          setGithubError(getGithubFriendlyErrorMessage('access_denied', 'GitHub authorization was denied.'));
          return;
        } else {
          setGithubStatus(GITHUB_STATE.GITHUB_AUTH_PENDING);
        }

        githubPollTimerRef.current = setTimeout(() => {
          step();
        }, sleepSeconds * 1000);
      } catch (error) {
        console.warn('GitHub auth polling failed', error);
        setGithubStatus(GITHUB_STATE.ERROR);
        setGithubError(getGithubFriendlyErrorMessage('network_error', 'Network error while checking GitHub authorization.'));
      }
    };

    await step();
  };

  const startGitHubDeviceAuthFlow = async () => {
    clearGithubPolling();
    setGithubError('');
    setGithubRepoData(null);

    if (!userId) {
      setGithubStatus(GITHUB_STATE.ERROR);
      setGithubError('Your user profile is not ready yet. Please wait a moment and try again.');
      return;
    }

    try {
      const authData = await startGitHubDeviceAuth({
        baseUrl: API_BASE_URL,
      });

      setGithubAuthData(authData);
      setGithubStatus(GITHUB_STATE.WAITING_FOR_GITHUB_USER_CODE);

      if (authData?.verification_uri) {
        setGithubStatus(GITHUB_STATE.GITHUB_AUTH_PENDING);
      }

      await pollGithubAuthUntilSuccess(authData.device_code, authData.interval || 5);
    } catch (error) {
      console.warn('GitHub device auth request failed', error);
      setGithubStatus(GITHUB_STATE.ERROR);
      setGithubError(getGithubFriendlyErrorMessage('network_error', 'Unable to start GitHub connection. Please retry.'));
    }
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

    if (!trimmedPrompt || isSending || isBootstrappingUser) return;

    if (!userId) {
      Alert.alert('Please wait', 'Still initializing your profile. Try again in a moment.');
      return;
    }

    setIsSending(true);
    setPromptResult(null);
    setQrContent(null);
    setQrMessage('');

    try {
      const projectName = trimmedPrompt.split('\n')[0].slice(0, 80).trim() || 'Untitled MVP';
      const response = await fetch(`${API_BASE_URL}/api/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          project_name: projectName,
          user_id: userId,
        }),
      });

      if (response.status === 429) {
        Alert.alert(
          'Daily limit reached',
          'You can create up to 2 apps every 24 hours. Please try again later.'
        );
        return;
      }

      if (!response.ok) {
        let details = '';

        try {
          const errorPayload = await response.json();
          details =
            errorPayload?.detail?.[0]?.msg ||
            errorPayload?.message ||
            errorPayload?.error ||
            '';
        } catch (parseError) {
          details = '';
        }

        const errorMessage = details
          ? `Prompt request failed (${response.status}): ${details}`
          : `Prompt request failed (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const savedProject = await upsertProject(data, trimmedPrompt);

      setLastSentPrompt(trimmedPrompt);
      setPrompt('');
      setPromptResult(data);

      if (savedProject) {
        await handleViewQR(savedProject);
      } else {
        setScreen('qr');
        animatePageIn();
      }
    } catch (error) {
      Alert.alert('Prompt failed', 'Unable to send prompt. Please try again.');
      console.warn('Prompt send error', error);
    } finally {
      setIsSending(false);
    }
  };

  const onBackHome = () => {
    setPromptResult(null);
    setQrMessage('');
    setQrContent(null);
    setSelectedProject(null);
    setScreen('home');
    animatePageIn();
  };

  const onCreateNewMvp = () => {
    closeDrawer();
    setScreen('home');
    animatePageIn();
  };

  const onSelectProject = async (project) => {
    closeDrawer();
    await handleViewQR(project);
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
            <QRScreen
              prompt={lastSentPrompt}
              result={promptResult}
              onBack={onBackHome}
              project={selectedProject}
              qrContent={qrContent}
              qrMessage={qrMessage}
              isFetchingQR={isFetchingQR}
              onConnectGitHub={openSheet}
            />
          )}
        </Animated.View>

        <ProjectsDrawer
          visible={drawerVisible}
          onClose={closeDrawer}
          translateX={drawerX}
          overlayOpacity={drawerOpacity}
          projects={myProjects}
          onNewTask={onCreateNewMvp}
          onSelectProject={onSelectProject}
        />

        <ConfigSheet
          visible={sheetVisible}
          onClose={closeSheet}
          translateY={sheetY}
          overlayOpacity={sheetOpacity}
          githubStatus={githubStatus}
          githubAuth={githubAuthData}
          githubError={githubError}
          githubRepo={githubRepoData}
          onConnectGitHub={startGitHubDeviceAuthFlow}
          onOpenGitHubVerification={() => {
            if (githubAuthData?.verification_uri) {
              const url = githubAuthData.verification_uri;
              if (url) {
                try {
                  require('react-native/Libraries/Linking/Linking').default.openURL(url);
                } catch (error) {
                  console.warn('Unable to open GitHub verification URL', error);
                }
              }
            }
          }}
          onCopyRepoUrl={() => {
            if (githubRepoData?.html_url) {
              try {
                const Clipboard = require('react-native').Clipboard;
                Clipboard.setString(githubRepoData.html_url);
                Alert.alert('Copied', 'Repository URL copied to clipboard.');
              } catch (error) {
                console.warn('Clipboard copy failed', error);
                Alert.alert('Copy failed', 'Unable to copy the repository URL automatically.');
              }
            }
          }}
          onDoneGitHubSuccess={() => {
            setGithubStatus(GITHUB_STATE.IDLE);
            setGithubError('');
            setGithubAuthData(null);
            setGithubRepoData(null);
            closeSheet();
          }}
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
