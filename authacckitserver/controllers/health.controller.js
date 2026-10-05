// Tiny endpoint that deployments and uptime checks can ping to confirm the server is up.
export function getHealth(req, res) {
  res.json({ status: 'ok' });
}