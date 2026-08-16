export const GITHUB_CLIENT_ID = 'Iv23lioxhi4h5AOWArq8';

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
const DEVICE_AUTH_ENDPOINTS = [
  '/api/github/device-auth',
  '/api/github/device',
  '/api/github/device-flow',
  '/api/auth/github/device',
  '/api/auth/github/device-flow',
];
const POLL_AUTH_ENDPOINTS = [
  '/api/github/device-auth/status',
  '/api/github/device-status',
  '/api/github/device-flow/status',
  '/api/auth/github/device/status',
];

const withBaseUrl = (baseUrl, path) => {
  const normalizedBase = `${String(baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '')}`;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const readJson = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

const parseErrorFromPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return (
    payload?.error_description ||
    payload?.message ||
    payload?.error ||
    payload?.detail ||
    payload?.errors?.[0]?.message ||
    null
  );
};

const requestJson = async ({
  fetchImpl = fetch,
  url,
  method = 'GET',
  headers = {},
  body,
}) => {
  const response = await fetchImpl(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  });

  const payload = await readJson(response);

  if (!response.ok) {
    const errMessage = parseErrorFromPayload(payload) || `Request failed with status ${response.status}`;
    const error = new Error(errMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

const tryCandidateEndpoints = async ({
  fetchImpl,
  baseUrl,
  candidates,
  method,
  body,
  headers,
}) => {
  let lastError = null;

  for (const candidate of candidates) {
    try {
      return await requestJson({
        fetchImpl,
        url: withBaseUrl(baseUrl, candidate),
        method,
        body,
        headers,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No GitHub backend endpoint responded successfully.');
};

export const normalizeGithubDeviceAuthResponse = (payload) => {
  const deviceCode = payload?.device_code || payload?.deviceCode || payload?.data?.device_code || null;
  const userCode = payload?.user_code || payload?.userCode || payload?.data?.user_code || null;
  const verificationUri =
    payload?.verification_uri ||
    payload?.verificationUri ||
    payload?.data?.verification_uri ||
    payload?.verification_url ||
    payload?.verificationUrl ||
    null;
  const interval = Number(payload?.interval ?? payload?.data?.interval ?? 5);

  if (!deviceCode || !userCode || !verificationUri) {
    throw new Error('GitHub device auth response is missing device_code, user_code, or verification_uri.');
  }

  return {
    device_code: String(deviceCode),
    user_code: String(userCode),
    verification_uri: String(verificationUri),
    interval: Number.isFinite(interval) && interval > 0 ? interval : 5,
    raw: payload,
  };
};

export const normalizeGithubPollResponse = (payload) => {
  const directStatus = payload?.status || payload?.auth_status || payload?.state || null;
  const error = payload?.error || payload?.auth_error || null;
  const accessToken = payload?.access_token || payload?.accessToken || payload?.token || payload?.data?.access_token || null;

  if (accessToken) {
    return {
      status: 'success',
      access_token: accessToken,
      raw: payload,
    };
  }

  if (directStatus === 'success' || directStatus === 'authorized' || payload?.authorized === true) {
    return { status: 'success', access_token: accessToken, raw: payload };
  }

  if (directStatus === 'pending' || directStatus === 'authorization_pending' || error === 'authorization_pending') {
    return { status: 'authorization_pending', raw: payload };
  }

  if (directStatus === 'slow_down' || error === 'slow_down') {
    return { status: 'slow_down', raw: payload };
  }

  if (directStatus === 'expired' || directStatus === 'expired_token' || error === 'expired_token') {
    return { status: 'expired_token', raw: payload };
  }

  if (directStatus === 'access_denied' || error === 'access_denied') {
    return { status: 'access_denied', raw: payload };
  }

  if (directStatus === 'error') {
    return { status: 'error', raw: payload };
  }

  return { status: 'authorization_pending', raw: payload };
};

export async function startGitHubDeviceAuth({
  baseUrl = DEFAULT_BASE_URL,
  clientId = GITHUB_CLIENT_ID,
  fetchImpl = fetch,
}) {
  const payload = await tryCandidateEndpoints({
    fetchImpl,
    baseUrl,
    method: 'POST',
    body: { client_id: clientId },
    headers: { 'Content-Type': 'application/json' },
    candidates: DEVICE_AUTH_ENDPOINTS,
  });

  return normalizeGithubDeviceAuthResponse(payload);
}

export async function pollGitHubAuthStatus({
  baseUrl = DEFAULT_BASE_URL,
  deviceCode,
  userId,
  fetchImpl = fetch,
}) {
  const body = {
    device_code: deviceCode,
    ...(userId ? { user_id: String(userId) } : {}),
  };

  const payload = await tryCandidateEndpoints({
    fetchImpl,
    baseUrl,
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    candidates: POLL_AUTH_ENDPOINTS,
  });

  return normalizeGithubPollResponse(payload);
}

export async function triggerGitHubRepoSetup({
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = fetch,
  repoName = 'gwen-ai-generated-mvp',
  description = 'React Native MVP generated by Gwen AI',
  accessToken,
}) {
  const endpoints = [
    '/api/github/create-repo',
    '/api/github/repo/create',
    '/api/github/repository/create',
    '/api/github/setup-repo',
    '/api/github/push',
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const payload = await requestJson({
        fetchImpl,
        url: `${baseUrl}${endpoint}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: {
          name: repoName,
          private: true,
          description,
          auto_init: true,
        },
      });

      return {
        name: payload?.name || repoName,
        html_url: payload?.html_url || payload?.clone_url || payload?.repository_url || '',
        private: payload?.private ?? true,
        owner: payload?.owner?.login || payload?.owner_login || null,
        raw: payload,
      };
    } catch (error) {
      lastError = error;
      const statusCode = Number(error?.status || 0);
      if (statusCode === 404 || statusCode === 405) {
        continue;
      }
      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return {
    name: repoName,
    html_url: '',
    private: true,
    owner: null,
    raw: null,
  };
}

export function buildGitTreePayload(fileMap, baseTreeSha = null) {
  const treeEntries = [];
  const iterator = fileMap instanceof Map ? fileMap.entries() : Object.entries(fileMap || {});

  for (const [filePath, fileContent] of iterator) {
    const rawContent = fileContent == null ? '' : String(fileContent);
    treeEntries.push({
      path: String(filePath),
      mode: '100644',
      type: 'blob',
      content: rawContent,
    });
  }

  const payload = { tree: treeEntries };
  if (baseTreeSha) {
    payload.base_tree = baseTreeSha;
  }

  return payload;
}

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
