// Permanent AWS Lambda Function URL (Phase 17) — the backend no longer runs
// on the Mac at all, so this works from anywhere (cellular, any WiFi), not
// just the home network.
export const API_BASE_URL =
  'https://wd6twig5tb4zvkt3wnimvizaf40huxcr.lambda-url.us-east-1.on.aws';

// Fixed infrastructure — Twilio assigns this once, it never changes via the app.
export const TWILIO_NUMBER = '+1 443-300-0069';

// Set in mobile/.env as EXPO_PUBLIC_API_KEY=... (gitignored, add it yourself
// — never through chat). Must match backend/.env's API_SECRET exactly.
// EXPO_PUBLIC_* vars are bundled into the client JS and are NOT a real
// secret — see docs/PHASE_14.md for what this does and doesn't protect
// against. Undefined until both sides are configured, matching the
// backend's graceful degrade.
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

// Every backend call goes through this so the auth header is never
// forgotten on a new call site. Headers on `options` still work as before —
// this only adds X-API-Key on top.
export function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
    },
  });
}
