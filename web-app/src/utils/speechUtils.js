/**
 * Speech synthesis utility for playing AI learning companion feedback.
 * Uses browser-native window.speechSynthesis prioritizing natural English female voices.
 */

let activeUtterance = null;

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const v = window.speechSynthesis.getVoices();
  if (v && v.length > 0) {
    return v;
  }
  return [];
}

// Ensure voices are initialized when the browser loads them asynchronously
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

/**
 * Finds the best female English voice available on the user's browser/OS.
 * Prioritizes high quality, natural female voices across Chrome, Edge, Safari, Windows, macOS, Android.
 */
export function getFemaleEnglishVoice() {
  const voices = loadVoices();
  if (!voices || voices.length === 0) return null;

  const enVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  const candidatePool = enVoices.length > 0 ? enVoices : voices;

  // 1. Natural female voice name identifiers across operating systems
  const femaleRegex = /female|woman|zira|samantha|karen|victoria|jenny|natasha|ava|allison|fiona|moira|serena|stephanie|aria|libby|sonia|claire|susan/i;
  const preferredFemale = candidatePool.find((v) => femaleRegex.test(v.name));
  if (preferredFemale) return preferredFemale;

  // 2. Google US English female (standard in Chromium)
  const googleVoice = candidatePool.find((v) => v.name.includes('Google US English'));
  if (googleVoice) return googleVoice;

  // 3. Fallback to any English voice
  return candidatePool[0] || null;
}

/**
 * Speaks feedback text aloud with a warm, energetic female voice.
 * Cancels any ongoing speech automatically.
 *
 * @param {string} text - Spoken feedback script
 */
export function speakFeedback(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;

  try {
    // Cancel any previous utterance
    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getFemaleEnglishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.pitch = 1.15; // Slightly elevated warm, friendly pitch
    utterance.rate = 1.05;  // Natural conversational tempo

    activeUtterance = utterance;
    utterance.onend = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
    };
    utterance.onerror = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Stops any current voice speech immediately.
 */
export function stopSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  if (activeUtterance) {
    activeUtterance = null;
  }
}
