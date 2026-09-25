// Web Audio API Synthesizer - 100% self-contained, no external mp3 files required
let actx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!actx) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) actx = new AudioCtx();
    } catch (e) {
      actx = null;
    }
  }
  if (actx && actx.state === 'suspended') {
    actx.resume().catch(() => {});
  }
  return actx;
}

export function playTone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gainVal: number = 0.22, muted: boolean = false) {
  if (muted) return;
  const a = getAudioContext();
  if (!a) return;
  try {
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = 0;
    osc.connect(g);
    g.connect(a.destination);
    const t0 = a.currentTime + (start || 0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gainVal != null ? gainVal : 0.22, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch (e) {
    // audio context might be blocked before interaction
  }
}

export function sndBuzz(muted: boolean = false) {
  playTone(180, 0, 0.18, 'sawtooth', 0.28, muted);
  playTone(220, 0.08, 0.12, 'sawtooth', 0.24, muted);
}

export function sndWrong(muted: boolean = false) {
  playTone(260, 0, 0.14, 'square', 0.22, muted);
  playTone(160, 0.13, 0.22, 'square', 0.22, muted);
}

export function sndCorrect(muted: boolean = false) {
  playTone(523.25, 0, 0.14, 'triangle', 0.22, muted);
  playTone(659.25, 0.12, 0.14, 'triangle', 0.22, muted);
  playTone(783.99, 0.24, 0.22, 'triangle', 0.24, muted);
}

export function sndTick(muted: boolean = false) {
  playTone(880, 0, 0.05, 'sine', 0.14, muted);
}

export function sndTimeUp(muted: boolean = false) {
  playTone(220, 0, 0.3, 'sawtooth', 0.25, muted);
  playTone(160, 0.28, 0.4, 'sawtooth', 0.25, muted);
}

export function sndRingTest(muted: boolean = false) {
  playTone(987.77, 0, 0.1, 'sine', 0.3, muted);
  playTone(1318.51, 0.12, 0.25, 'triangle', 0.3, muted);
}

export function sndFanfare(muted: boolean = false) {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => playTone(f, i * 0.16, 0.28, 'triangle', 0.24, muted));
  setTimeout(() => {
    notes.forEach((f, i) => playTone(f * 1.02, i * 0.1, 0.5, 'sawtooth', 0.12, muted));
  }, 640);
}
