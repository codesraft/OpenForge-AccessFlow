import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api';

// Revoking someone else's session answers with an explicit 403 instead of relying on a generic failure.
export const sessionOwnershipGuard = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== '/revoke-session' || !ctx.body?.token) return;

  const currentSession = await getSessionFromCtx(ctx);
  const targetSession = await ctx.context.internalAdapter.findSession(ctx.body.token);

  if (currentSession && targetSession && targetSession.session.userId !== currentSession.user.id) {
    throw new APIError('FORBIDDEN', {
      code: 'SESSION_NOT_OWNED',
      message: 'You can only revoke your own sessions.',
    });
  }
});