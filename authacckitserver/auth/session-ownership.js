import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api';

// This middleware checks that the request is trying to revoke a session that belongs to the currently logged-in user. It is used to protect the /revoke-session endpoint, which allows users to log out of other devices. If the current session exists and the target session exists, and the target session's userId is not the same as the current session's user id, it throws a 403 error with a SESSION_NOT_OWNED code.
export const sessionOwnershipGuard = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== '/revoke-session' || !ctx.body?.token) return;

  const currentSession = await getSessionFromCtx(ctx);
  const targetSession = await ctx.context.internalAdapter.findSession(ctx.body.token);

  // If the current session exists and the target session exists, and the target session's userId is not the same as the current session's user id, throw a 403 error.
  if (currentSession && targetSession && targetSession.session.userId !== currentSession.user.id) {
    throw new APIError('FORBIDDEN', {
      code: 'SESSION_NOT_OWNED',
      message: 'You can only revoke your own sessions.',
    });
  }
});