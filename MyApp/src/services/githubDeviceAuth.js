export const GITHUB_CLIENT_ID = 'Iv23lioxhi4h5AOWArq8';
export const GITHUB_APP_INSTALL_URL = 'https://github.com/apps/gwenai/installations/new';

export const GITHUB_STATE = Object.freeze({
  IDLE: 'idle',
  WAITING_FOR_GITHUB_USER_CODE: 'waiting_for_github_user_code',
  GITHUB_AUTH_PENDING: 'github_auth_pending',
  GITHUB_AUTH_SUCCESS: 'github_auth_success',
  CREATING_REPO: 'creating_repo',
  REPO_CREATED: 'repo_created',
  PUSH_IN_PROGRESS: 'push_in_progress',
  PUSH_COMPLETE: 'push_complete',
  ERROR: 'error',
});

export const GITHUB_ERROR_MESSAGES = Object.freeze({
  authorization_pending: 'GitHub authorization is still pending. Please finish the sign-in flow in GitHub.',
  slow_down: 'GitHub is asking for a slower polling cadence. Please wait a moment and try again.',
  expired_token: 'The GitHub authorization request expired. Please reconnect GitHub and try again.',
  access_denied: 'GitHub authorization was denied. Please allow the app to access your account.',
  repo_creation_failed: 'The repository could not be created. Please try again.',
  repo_push_failed: 'The generated app could not be pushed to GitHub. Please retry the push.',
  network_error: 'Network error while connecting GitHub. Please check your connection and retry.',
});

const DEFAULT_BASE_URL = 'https://jskarthik45-gwenaibackend.hf.space';

export function getGithubFriendlyErrorMessage(code, fallback) {
  if (!code) {
    return fallback || 'Something went wrong while connecting GitHub.';
  }

  if (GITHUB_ERROR_MESSAGES[code]) {
    return GITHUB_ERROR_MESSAGES[code];
  }

  if (typeof code === 'string') {
    return code.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return fallback || 'Something went wrong while connecting GitHub.';
}

export async function startGitHubDeviceAuth({
  baseUrl = DEFAULT_BASE_URL,
  clientId = GITHUB_CLIENT_ID,
  userId,
}) {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/github/device-auth`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      user_id: String(userId),
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Device auth request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.device_code || !payload?.user_code || !payload?.verification_uri) {
    throw new Error('Device auth response missing required parameters');
  }

  return {
    device_code: String(payload.device_code),
    user_code: String(payload.user_code),
    verification_uri: String(payload.verification_uri),
    interval: Number(payload.interval || 5),
    message: payload.message || '',
    raw: payload,
  };
}

export async function pollGitHubAuthStatus({
  baseUrl = DEFAULT_BASE_URL,
  deviceCode,
  userId,
}) {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/github/device-auth/status`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      user_id: String(userId),
      device_code: String(deviceCode),
    }),
  });

  if (!response.ok) {
    throw new Error(`Device auth status request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const status = payload?.status || 'error';

  return {
    status: String(status),
    access_token: payload?.access_token || null,
    message: payload?.message || '',
    raw: payload,
  };
}

// Deprecated on frontend since repo setup and push are handled directly by the backend prompt generation.
// Kept for signature compatibility in App.js imports.
export async function triggerGitHubRepoSetup() {
  return {
    name: '',
    html_url: '',
    private: true,
    owner: null,
    raw: null,
  };
}
