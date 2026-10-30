// Easter egg: lo-fi smyčka generovaná přes Web Audio (žádný soubor, žádná licence).
// Akordy Rhodes-like, kick/snare/hi-hat se swingem, praskání vinylu a lowpass přes vše.

type Ctx = AudioContext;

const BPM = 72;
const BEAT = 60 / BPM;
// Dmaj7 – Bm7 – Em7 – A7 (MIDI)
const CHORDS = [[50, 54, 57, 61, 66], [47, 54, 57, 62, 66], [52, 55, 59, 62, 66], [45, 52, 55, 61, 64]];
const MELODY = [74, 0, 73, 71, 0, 69, 0, 71, 66, 0, 69, 0, 71, 0, 0, 0];

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let timer = 0;
let nextTime = 0;
let step = 0;
let crackle: AudioBufferSourceNode | null = null;
let playing = false;

function noiseBuffer(c: Ctx, seconds: number, crackly = false) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = crackly ? (Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.015) : Math.random() * 2 - 1;
  }
  return buf;
}

function keys(c: Ctx, out: AudioNode, midi: number, t: number, dur: number, vol: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out);
  [["triangle", 1, 1], ["sine", 2, 0.25]].forEach(([type, mul, lvl]) => {
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = type as OscillatorType;
    o.frequency.value = hz(midi) * (mul as number);
    o.detune.value = (Math.random() - 0.5) * 8;
    og.gain.value = lvl as number;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  });
}

function kick(c: Ctx, out: AudioNode, t: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.4);
}

function hit(c: Ctx, out: AudioNode, t: number, freq: number, q: number, vol: number, len: number) {
  const s = c.createBufferSource();
  s.buffer = noiseBuffer(c, len);
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  s.connect(f).connect(g).connect(out);
  s.start(t);
}

function schedule() {
  if (!ctx || !master) return;
  const c = ctx;
  const out = master;
  while (nextTime < c.currentTime + 0.25) {
    const s16 = step % 16;
    const bar = Math.floor(step / 16) % CHORDS.length;
    const swing = s16 % 2 ? BEAT * 0.09 : 0;
    const t = nextTime + swing;
    if (s16 === 0) CHORDS[bar].forEach((m, i) => keys(c, out, m, t + i * 0.012, BEAT * 4, 0.07));
    if (s16 === 0 || s16 === 10) kick(c, out, t);
    if (s16 === 4 || s16 === 12) hit(c, out, t, 1800, 0.8, 0.22, 0.18);
    if (s16 % 2 === 0) hit(c, out, t, 8000, 1.5, s16 % 4 ? 0.04 : 0.07, 0.05);
    const mel = MELODY[(step + bar * 3) % MELODY.length];
    if (mel && bar % 2 === 1) keys(c, out, mel, t, BEAT * 1.2, 0.05);
    nextTime += BEAT / 4;
    step++;
  }
}

export function lofiPlaying() {
  return playing;
}

export function startLofi() {
  if (playing) return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx ??= new AC();
  const c = ctx;
  void c.resume();
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2400;
  master = c.createGain();
  master.gain.setValueAtTime(0, c.currentTime);
  master.gain.linearRampToValueAtTime(0.8, c.currentTime + 1.2);
  master.connect(lp).connect(c.destination);
  crackle = c.createBufferSource();
  crackle.buffer = noiseBuffer(c, 4, true);
  crackle.loop = true;
  crackle.connect(master);
  crackle.start();
  step = 0;
  nextTime = c.currentTime + 0.1;
  playing = true;
  schedule();
  timer = window.setInterval(schedule, 60);
}

export function stopLofi() {
  if (!playing || !ctx || !master) return;
  playing = false;
  window.clearInterval(timer);
  const m = master;
  const cr = crackle;
  m.gain.cancelScheduledValues(ctx.currentTime);
  m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
  m.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  window.setTimeout(() => { cr?.stop(); m.disconnect(); }, 700);
  master = null;
  crackle = null;
}
