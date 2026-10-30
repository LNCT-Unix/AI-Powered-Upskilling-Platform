/** Maps a learning-progress percentage to a progress-bar tone. */
export function progressTone(progress) {
  if (progress >= 75) return 'green';
  if (progress >= 50) return 'purple';
  return 'amber';
}

/** Categorizes progress into standard cohort tiers. */
export function getProgressTier(progress) {
  if (progress >= 75) return 'Advanced';
  if (progress >= 50) return 'On Track';
  return 'Needs Attention';
}
