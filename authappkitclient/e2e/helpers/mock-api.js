const CLIENT_ORIGIN = process.env.E2E_CLIENT_URL ?? 'http://localhost:3000';

export const VALID_PASSWORD = 'a-strong-password-1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': CLIENT_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

const USER = { id: 'user-1', name: 'Sam Tester', email: 'sam@example.com', emailVerified: true };
const CURRENT_SESSION = { id: 'session-1', token: 'token-1' };

function buildSessions() {
  return [
    {
      ...CURRENT_SESSION,
      userAgent: 'Chrome/120 Windows',
      ipAddress: '1.1.1.1',
      createdAt: new Date(),
    },
    {
      id: 'session-2',
      token: 'token-2',
      userAgent: 'Firefox/120 Linux',
      ipAddress: '2.2.2.2',
      createdAt: new Date(),
    },
  ];
}

// Mocks the API for end-to-end tests. It intercepts requests to /api/** and returns canned responses, while also recording the requests for later inspection. The state object returned by this function can be used to inspect what requests were made and to manipulate the mock data.
export async function mockApi(page, { loggedIn = false } = {}) {
  const state = {
    loggedIn,
    sessions: buildSessions(),
    profile: { name: USER.name, email: USER.email, avatarUrl: null, bio: '' },
    requests: [],
  };

  const answers = {
    'GET /api/auth/get-session': () =>
      state.loggedIn ? { body: { user: USER, session: CURRENT_SESSION } } : { body: null },
    'POST /api/auth/sign-up/email': () => ({ body: { user: { ...USER, emailVerified: false } } }),
    'POST /api/auth/sign-in/email': (request) => {
      if (request.body.password !== VALID_PASSWORD) {
        return {
          status: 401,
          body: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' },
        };
      }
      state.loggedIn = true;
      return { body: { redirect: false, token: CURRENT_SESSION.token, user: USER } };
    },
    'POST /api/auth/sign-out': () => {
      state.loggedIn = false;
      return { body: { success: true } };
    },
    'POST /api/auth/request-password-reset': () => ({ body: { status: true } }),
    'POST /api/auth/change-password': () => ({ body: { user: USER } }),
    'GET /api/auth/list-sessions': () => ({ body: state.sessions }),
    'POST /api/auth/revoke-session': (request) => {
      state.sessions = state.sessions.filter((session) => session.token !== request.body.token);
      return { body: { status: true } };
    },
    'POST /api/auth/revoke-other-sessions': () => {
      state.sessions = state.sessions.filter((session) => session.token === CURRENT_SESSION.token);
      return { body: { status: true } };
    },
    'GET /api/profile': () => ({ body: state.profile }),
    'PATCH /api/profile': (request) => {
      state.profile = { ...state.profile, ...request.body };
      return { body: state.profile };
    },
    'DELETE /api/account': () => {
      state.loggedIn = false;
      return { status: 204 };
    },
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();

    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }

    const key = `${request.method()} ${new URL(request.url()).pathname}`;
    const body = request.postData() ? JSON.parse(request.postData()) : undefined;
    state.requests.push({ key, body });

    const answer = answers[key]?.({ body }) ?? {
      status: 404,
      body: { error: { code: 'NOT_FOUND' } },
    };

    await route.fulfill({
      status: answer.status ?? 200,
      headers: CORS_HEADERS,
      contentType: 'application/json',
      body: answer.body === undefined ? undefined : JSON.stringify(answer.body),
    });
  });

  return state;
}

export function requestsTo(state, key) {
  return state.requests.filter((request) => request.key === key);
}