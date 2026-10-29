import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativeMobile } from './mobileStorage';

/**
 * Tactile feedback service for native mobile interactions.
 * Safely no-ops when running in standard desktop/web browser.
 */
export const triggerHaptic = {
  /** Light vibration on question option selection or item tap */
  async selection() {
    if (!isNativeMobile()) return;
    try {
      await Haptics.selectionChanged();
    } catch {}
  },

  /** Medium impact on submitting an answer or primary action */
  async submit() {
    if (!isNativeMobile()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
  },

  /** Heavy impact on milestone completion or level unlock */
  async milestone() {
    if (!isNativeMobile()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {}
  },

  /** Success notification on passing assessment */
  async success() {
    if (!isNativeMobile()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {}
  },

  /** Error notification on failed action */
  async error() {
    if (!isNativeMobile()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {}
  }
};

