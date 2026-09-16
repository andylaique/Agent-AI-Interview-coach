export function isSpeechSupported() {
  if (typeof window === "undefined") return false;
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

export function isTTSSupported() {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

function waitForVoices() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const existing = window.speechSynthesis.getVoices();
    if (existing && existing.length > 0) {
      resolve(existing);
      return;
    }
    const onChange = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length > 0) {
        window.speechSynthesis.removeEventListener("voiceschanged", onChange);
        resolve(list);
      }
    };
    window.speechSynthesis.addEventListener("voiceschanged", onChange);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onChange);
      resolve(window.speechSynthesis.getVoices() || []);
    }, 1500);
  });
}

export function createRecognizer(onResult, onError, onEnd) {
  if (typeof window === "undefined") return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  const recognition = new SR();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t;
      else interim += t;
    }
    if (final) onResult(final, true);
    else if (interim) onResult(interim, false);
  };

  recognition.onerror = (event) => {
    onError?.(event.error || "Speech recognition error");
  };

  recognition.onend = () => {
    onEnd?.();
  };

  return recognition;
}

export async function speak(text, langOrOnEnd, maybeOnEnd) {
  let lang = "en-US";
  let onEnd = maybeOnEnd;
  if (typeof langOrOnEnd === "function") {
    onEnd = langOrOnEnd;
  } else if (typeof langOrOnEnd === "string") {
    lang = langOrOnEnd;
  }

  if (!text || !String(text).trim()) {
    onEnd?.();
    return;
  }
  if (!isTTSSupported()) {
    console.warn("Text-to-speech not supported in this browser");
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
  } catch {

  }

  const voices = await waitForVoices();
  const utterance = new SpeechSynthesisUtterance(String(text).trim());
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const langPrefix = lang.split("-")[0].toLowerCase();
  const preferred =
    voices.find(
      (v) =>
        v.lang.toLowerCase() === lang.toLowerCase() &&
        /google|microsoft|natural|premium/i.test(v.name)
    ) ||
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
    voices[0];

  if (preferred) {
    utterance.voice = preferred;
    utterance.lang = preferred.lang || lang;
  }

  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    console.warn("TTS error", e?.error || e);
    onEnd?.();
  };

  await new Promise((r) => setTimeout(r, 80));
  window.speechSynthesis.speak(utterance);

  const keepAlive = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      clearInterval(keepAlive);
      return;
    }
    window.speechSynthesis.resume();
  }, 10000);

  utterance.onend = () => {
    clearInterval(keepAlive);
    onEnd?.();
  };
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
    }
  }
}