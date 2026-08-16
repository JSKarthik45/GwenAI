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
const SHEET_HEIGHT = 440;
const API_BASE_URL = 'https://jskarthik45-gwenaibackend.hf.space';
const STORED_USER_ID_KEY = 'stored_user_id';
const GWEN_USER_KEY = 'gwen_user';
const GWEN_GITHUB_AUTH_KEY = 'gwen_github_auth';
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
  const [githubAccessToken, setGithubAccessToken] = useState(null);

  const pageAnim = useRef(new Animated.Value(0)).current;
  const githubPollTimerRef = useRef(null);
  const qrPollTimerRef = useRef(null);
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

    return () => {
      clearGithubPolling();
      if (qrPollTimerRef.current) {
        clearTimeout(qrPollTimerRef.current);
        qrPollTimerRef.current = null;
      }
    };
  }, []);

  const bootstrapUserAndProjects = async () => {
    setIsBootstrappingUser(true);

    try {
      const [
        contractUserId,
        legacyUserId,
        storedProjects,
        contractGithubToken,
        legacyGithubAuth,
      ] = await Promise.all([
        AsyncStorage.getItem('gwen_user_id'),
        AsyncStorage.getItem(STORED_USER_ID_KEY),
        AsyncStorage.getItem(MY_PROJECTS_KEY),
        AsyncStorage.getItem('github_access_token'),
        AsyncStorage.getItem(GWEN_GITHUB_AUTH_KEY),
      ]);

      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        if (Array.isArray(parsedProjects)) {
          setMyProjects(parsedProjects);
        }
      }

      // 1. Restore or Initialize User ID
      let finalUserId = null;
      if (contractUserId && isValidUserId(contractUserId)) {
        finalUserId = contractUserId;
      } else if (legacyUserId && isValidUserId(legacyUserId)) {
        finalUserId = legacyUserId;
        await AsyncStorage.setItem('gwen_user_id', String(finalUserId));
      }

      if (!finalUserId) {
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

        finalUserId = String(freshUserId);
        await AsyncStorage.setItem('gwen_user_id', finalUserId);
        await AsyncStorage.setItem(STORED_USER_ID_KEY, finalUserId);
        await AsyncStorage.setItem(GWEN_USER_KEY, JSON.stringify({ userId: finalUserId }));
      }

      setUserId(finalUserId);

      // 2. Restore GitHub Session
      let finalGithubToken = null;
      if (contractGithubToken) {
        finalGithubToken = contractGithubToken;
      } else if (legacyGithubAuth) {
        try {
          const parsedAuth = JSON.parse(legacyGithubAuth);
          if (parsedAuth?.accessToken) {
            finalGithubToken = parsedAuth.accessToken;
            await AsyncStorage.setItem('github_access_token', String(finalGithubToken));
          }
        } catch (e) {
          console.warn('Failed to parse legacy GitHub auth', e);
        }
      }

      if (finalGithubToken) {
        setGithubAccessToken(finalGithubToken);
        setGithubStatus(GITHUB_STATE.GITHUB_AUTH_SUCCESS);
        setGithubAuthData({ access_token: finalGithubToken });
      }
    } catch (error) {
      console.warn('User bootstrap failed', error);
      Alert.alert('Connection issue', 'Unable to initialize your profile. Please try again.');
    } finally {
      setIsBootstrappingUser(false);
    }
  };

  const persistProjects = async (projectsToStore) => {
    setMyProjects(projectsToStore);
    await AsyncStorage.setItem(MY_PROJECTS_KEY, JSON.stringify(projectsToStore));
  };

  const persistProjectResult = async (projectPayload) => {
    const projectId = resolveProjectId(projectPayload);
    if (!projectId) return;

    const projectRecord = {
      projectId: String(projectId),
      status: projectPayload?.status || 'completed',
      qrCode: projectPayload?.data?.qr_code || {},
      githubRepo: projectPayload?.data?.github_repo || null,
      githubRepoUrl: projectPayload?.data?.github_repo_url || null,
    };

    await AsyncStorage.setItem(`gwen_project_${projectId}`, JSON.stringify(projectRecord));
  };

  const deleteProject = async (projectId) => {
    try {
      const updated = myProjects.filter((p) => String(p.id) !== String(projectId));
      await persistProjects(updated);
      await Promise.all([
        AsyncStorage.removeItem(`qr_content_${projectId}`),
        AsyncStorage.removeItem(`qr_result_${projectId}`),
        AsyncStorage.removeItem(`gwen_project_${projectId}`),
      ]);
    } catch (e) {
      console.warn('Failed to delete project', e);
    }
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

  const startQrPolling = (projectId) => {
    if (qrPollTimerRef.current) {
      clearTimeout(qrPollTimerRef.current);
      qrPollTimerRef.current = null;
    }

    setIsFetchingQR(true);
    setQrMessage('Preparing your MVP application...');

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/get-qr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ project_id: projectId }),
        });

        if (!response.ok) {
          throw new Error(`QR fetch failed with status ${response.status}`);
        }

        const qrData = await response.json();

        if (qrData?.status === 'completed') {
          setIsFetchingQR(false);
          setQrMessage('');
          setPromptResult(qrData);

          const returnedQrContent = resolveQrContent(qrData);
          if (returnedQrContent) {
            setQrContent(String(returnedQrContent));
            await AsyncStorage.setItem(`qr_content_${projectId}`, String(returnedQrContent));
          } else {
            setQrContent(null);
          }

          await AsyncStorage.setItem(`qr_result_${projectId}`, JSON.stringify(qrData));
          qrPollTimerRef.current = null;
          return;
        }

        if (qrData?.status === 'processing' || qrData?.status === 'queued') {
          setPromptResult(qrData);
          setQrContent(null);
          setQrMessage(qrData?.message || 'Your MVP is being generated. Please check back in a few minutes.');
          qrPollTimerRef.current = setTimeout(poll, 30000);
          return;
        }

        if (qrData?.status === 'error' || qrData?.error) {
          setIsFetchingQR(false);
          setQrContent(null);
          setQrMessage('');
          qrPollTimerRef.current = null;

          await deleteProject(projectId);
          onBackHome();

          Alert.alert(
            'Generation Failed',
            'We are sorry for the inconvenience. Our agents encountered an error while building your application.'
          );
          return;
        }

        setPromptResult(qrData);
        qrPollTimerRef.current = setTimeout(poll, 30000);
      } catch (error) {
        console.warn('QR polling error', error);
        qrPollTimerRef.current = setTimeout(poll, 30000);
      }
    };

    poll();
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
          if (cachedQrResult?.status === 'completed') {
            const cachedQrContent = resolveQrContent(cachedQrResult) || cachedQr;
            setPromptResult(cachedQrResult);
            setQrContent(cachedQrContent ? String(cachedQrContent) : null);
            setIsFetchingQR(false);
            return;
          }
          await AsyncStorage.removeItem(localQrResultKey);
        } catch (parseError) {
          await AsyncStorage.removeItem(localQrResultKey);
        }
      }

      if (cachedQr) {
        const completedCachedResult = {
          status: 'completed',
          data: { qr_content: String(cachedQr) },
          error: null,
        };

        setQrContent(cachedQr);
        setPromptResult(completedCachedResult);
        await AsyncStorage.setItem(localQrResultKey, JSON.stringify(completedCachedResult));
        setIsFetchingQR(false);
        return;
      }

      startQrPolling(projectId);
    } catch (error) {
      console.warn('View QR failed', error);
      setQrMessage('Unable to fetch QR right now. Please try again shortly.');
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
    setGithubStatus(GITHUB_STATE.GITHUB_AUTH_SUCCESS);
    setGithubError('');

    const token = githubAuthData?.access_token || null;

    if (userId && token) {
      const githubAuthRecord = {
        userId: String(userId),
        githubConnected: true,
        accessToken: String(token),
        login: githubAuthData?.login || null,
        avatarUrl: githubAuthData?.avatar_url || githubAuthData?.avatarUrl || null,
        connectedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(GWEN_GITHUB_AUTH_KEY, JSON.stringify(githubAuthRecord));
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
          setGithubError('');

          if (result.access_token) {
            setGithubAccessToken(result.access_token);
            await AsyncStorage.setItem('github_access_token', result.access_token);

            const githubAuthRecord = {
              userId: String(userId),
              githubConnected: true,
              accessToken: String(result.access_token),
              connectedAt: new Date().toISOString(),
            };
            await AsyncStorage.setItem(GWEN_GITHUB_AUTH_KEY, JSON.stringify(githubAuthRecord));

            setGithubAuthData({
              access_token: result.access_token,
              message: result.message || 'GitHub authorization succeeded.',
            });
          }
          return;
        }

        if (result.status === 'pending') {
          setGithubStatus(GITHUB_STATE.GITHUB_AUTH_PENDING);
          setGithubError('');
          githubPollTimerRef.current = setTimeout(step, sleepSeconds * 1000);
        } else if (result.status === 'expired') {
          setGithubStatus(GITHUB_STATE.ERROR);
          setGithubError('Session expired. Please try connecting again.');
        } else if (result.status === 'error') {
          setGithubStatus(GITHUB_STATE.ERROR);
          setGithubError(result.message || 'GitHub authorization failed.');
        } else {
          setGithubStatus(GITHUB_STATE.GITHUB_AUTH_PENDING);
          githubPollTimerRef.current = setTimeout(step, sleepSeconds * 1000);
        }
      } catch (error) {
        console.warn('GitHub auth polling failed', error);
        setGithubStatus(GITHUB_STATE.ERROR);
        setGithubError('Network error while checking GitHub authorization.');
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
        userId,
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
          github_access_token: githubAccessToken || null,
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
      const projectId = resolveProjectId(data);
      if (!projectId) {
        throw new Error('No project ID returned from prompt submission');
      }

      const savedProject = await upsertProject(data, trimmedPrompt);
      await persistProjectResult(data);

      setLastSentPrompt(trimmedPrompt);
      setPrompt('');
      setPromptResult(data);

      if (savedProject) {
        setSelectedProject(savedProject);
      }

      setScreen('qr');
      animatePageIn();

      startQrPolling(projectId);
    } catch (error) {
      Alert.alert('Prompt failed', 'Unable to send prompt. Please try again.');
      console.warn('Prompt send error', error);
    } finally {
      setIsSending(false);
    }
  };

  const onBackHome = () => {
    if (qrPollTimerRef.current) {
      clearTimeout(qrPollTimerRef.current);
      qrPollTimerRef.current = null;
    }
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
              hasGithubToken={!!githubAccessToken}
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
          githubAccessToken={githubAccessToken}
          onDisconnectGitHub={async () => {
            setGithubAccessToken(null);
            setGithubStatus(GITHUB_STATE.IDLE);
            setGithubAuthData(null);
            setGithubRepoData(null);
            setGithubError('');
            await AsyncStorage.removeItem('github_access_token');
            await AsyncStorage.removeItem(GWEN_GITHUB_AUTH_KEY);
            Alert.alert('Disconnected', 'Disconnected from GitHub account.');
          }}
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
