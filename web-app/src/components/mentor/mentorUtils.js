/** Maps a learning-progress percentage to a progress-bar tone. */
export function progressTone(progress) {
  if (progress >= 75) return 'green';
  if (progress >= 50) return 'purple';
  return 'amber';
}
