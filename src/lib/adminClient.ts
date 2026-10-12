/**
 * Browser-only. Call when an admin API response isn't ok. A 401 means the session has expired,
 * so send the user back to sign in. Returns true when it redirected.
 */
export function redirectIfUnauthorized(res: Response): boolean {
  if (res.status !== 401) return false;
  location.href = "/admin/login";
  return true;
}
