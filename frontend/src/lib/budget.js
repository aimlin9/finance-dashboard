/** Budget status from percent used: matches the backend's 80% / 100% thresholds. */
export function statusFor(progress) {
  if (progress === null || progress === undefined) return 'ok';
  if (progress >= 100) return 'exceeded';
  if (progress >= 80) return 'warning';
  return 'ok';
}
