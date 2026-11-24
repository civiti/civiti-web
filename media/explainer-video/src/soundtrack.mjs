#!/usr/bin/env node
// The soundtrack of the /ghid/asistent-ai explainer.
//
// An original composition, generated sample by sample by this script from the beat
// grid and the HITS in timeline.mjs. It uses no samples, loops, presets or
// third-party code (the reverb follows the public-domain Freeverb design and is
// written here from scratch), so the film's soundtrack carries no third-party
// licence. Every random choice comes from a seeded generator: a render is
// reproducible to the bit.
//
//   node src/soundtrack.mjs [out.wav] [--stems]
//
// Default output is out/soundtrack.wav. --stems also writes each bus, after its
// gain and before the master, to out/stems/ so the balance can be measured.
//
// D major at 120 BPM, one chord a bar: Dmaj9 | A(add9)/C# | Bm7 | Gmaj9, repeated,
// landing on D6/9 at the end card. Seconds follow SCENES and HITS:
//
//   0-4    street     pad opening out of a low-pass, sparse mallets; a pop at HITS.stop
//   4-8    issue      + bass in halves, soft kick on 1 and 3, mallet eighths;
//                     rising ticks while the votes count
//   8-18   connect,   full light groove: kick on every beat, clap on 2 and 4, hats in
//          skill      eighths, bass, ducked pad. A click on Approve, a two-bell chime
//                     when connected, a thunk as the skill drops, three ticks for the chips
//   18-20  ask        pad and hats only; keyboard ticks while typing, a send blip
//   20-28  petitions, the groove again with octave mallets and sixteenth hats; one bell
//          send       per petition; a click on "Da, trimite", half a beat with no drums,
//                     then a whoosh as the email leaves
//   28-32  registered lighter groove; the stamp is a low thud and a two-note chime
//   32-36  end        drums stop; D6/9 on pad, mallets and bass rings out to silence
//
// Every cut from 8 s on is approached by a quiet reverse swell that ends on the cut.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BAR, BEAT, BPM, DURATION, HITS, SCENES } from './timeline.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, '..');

if (Math.abs(BEAT - 60 / BPM) > 1e-9 || Math.abs(BAR - 4 * BEAT) > 1e-9) {
  throw new Error('soundtrack.mjs assumes four beats of 60/BPM seconds to the bar');
}

// --- the mix ------------------------------------------------------------------

/** Level of each bus into the master, in dB. The master then normalises the sum. */
export const GAIN_DB = {
  pad: -20,
  arp: -11,
  bell: -12,
  bass: -12,
  kick: -9,
  clap: -15,
  hat: -21,
  ui: -9,
  ticks: -17,
  swell: -27,
  reverb: 2,
};

/** Share of each bus sent to the reverb. Bass and kick stay dry. */
const SEND = { pad: 0.2, arp: 0.4, bell: 0.5, clap: 0.25, hat: 0.05, ui: 0.12, ticks: 0.2, swell: 0.25 };

/** Pad and bass dip by this much on every kick. */
const DUCK_DB = -4;

/** Peak of the final file, measured on a 4x oversampled estimate. */
const TARGET_TRUE_PEAK_DB = -1;

// --- harmony ------------------------------------------------------------------

const CHORDS = {
  D: { pad: [50, 57, 61, 64, 66], arp: [62, 66, 69, 73, 76], bass: 38, root: 2 }, // Dmaj9
  A: { pad: [52, 57, 59, 61, 64], arp: [61, 64, 69, 71, 76], bass: 37, root: 9 }, // A(add9)/C#
  Bm: { pad: [54, 57, 59, 62, 66], arp: [62, 66, 69, 71, 74], bass: 35, root: 11 }, // Bm7
  G: { pad: [55, 59, 62, 66, 69], arp: [62, 66, 67, 71, 74], bass: 31, root: 7 }, // Gmaj9
  D69: { pad: [50, 57, 59, 64, 66, 69], arp: [62, 69, 74, 76, 78, 81], bass: 38, root: 2 }, // D6/9
};

/** I-V-vi-IV, one chord a bar, then D from the end card to the last sample. */
const PROGRESSION = [CHORDS.D, CHORDS.A, CHORDS.Bm, CHORDS.G];
const EPS = 1e-6;
const chordAt = (t) => (t >= HITS.end - EPS ? CHORDS.D69 : PROGRESSION[Math.floor(t / BAR + EPS) % 4]);

// --- arrangement, by scene id -------------------------------------------------

const PATTERN_A = [0, 2, 4, 2, 3, 1, 4, 2];
const PATTERN_B = [0, 3, 2, 4, 1, 3, 2, 4];
/** Velocity of each eighth in the bar: the downbeat leads, the offbeats lean back. */
const ACCENT = [1, 0.62, 0.8, 0.62, 0.9, 0.62, 0.8, 0.66];

const ARP = {
  issue: { vel: 0.5, pattern: PATTERN_A },
  connect: { vel: 0.75, pattern: PATTERN_A },
  skill: { vel: 0.75, pattern: PATTERN_B },
  petitions: { vel: 0.8, pattern: PATTERN_B, octave: [0, 3, 6] },
  send: { vel: 0.8, pattern: PATTERN_A, octave: [0, 3, 6] },
  registered: { vel: 0.6, pattern: PATTERN_A, skip: [1, 5] },
};

const GROOVE = { kick: [0, 1, 2, 3], kickVel: 0.85, clap: [1, 3], clapVel: 0.75, hats: 'eighths', hatVel: 0.8 };
const LIFTED = { kick: [0, 1, 2, 3], kickVel: 0.9, clap: [1, 3], clapVel: 0.85, hats: 'sixteenths', hatVel: 0.9 };
const DRUMS = {
  issue: { kick: [0, 2], kickVel: 0.7, clap: [], hats: null },
  connect: GROOVE,
  skill: GROOVE,
  ask: { kick: [], clap: [], hats: 'eighths', hatVel: 0.5 },
  petitions: LIFTED,
  send: LIFTED,
  registered: { kick: [0, 2], kickVel: 0.75, clap: [1, 3], clapVel: 0.55, hats: 'offbeats', hatVel: 0.65 },
};

/** Bass rhythms as [beat, length in beats, octave shift]. */
const BASS_PATTERNS = {
  half: [
    [0, 1.8, 0],
    [2, 1.8, 0],
  ],
  groove: [
    [0, 1.4, 0],
    [1.5, 0.42, 0],
    [2, 1.4, 0],
    [3.5, 0.42, 12],
  ],
};
const BASS = { issue: 'half', connect: 'groove', skill: 'groove', petitions: 'groove', send: 'groove', registered: 'half' };

/** Pitches in the first bar, as [beat, midi, velocity]: a few notes over the opening pad. */
const INTRO_MALLETS = [
  [1, 78, 0.5],
  [2, 81, 0.45],
  [3, 76, 0.5],
  [4, 73, 0.5],
  [6, 76, 0.45],
  [7, 71, 0.5],
];

/** The vote counter's target and easing, as stage.js draws them. */
const VOTES = 42;
const VOTE_STEP = 4;
const VOTE_PITCHES = [69, 71, 74, 76, 78, 81, 83, 86, 88, 90];

// --- small helpers ------------------------------------------------------------

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const dbToGain = (db) => 10 ** (db / 20);
const gainToDb = (g) => 20 * Math.log10(Math.max(g, 1e-12));
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const near = (t, list) => list.some((x) => Math.abs(t - x) < 1e-3);
const sceneById = (id) => {
  const scene = SCENES.find((s) => s.id === id);
  if (!scene) throw new Error(`soundtrack.mjs needs scene "${id}" in timeline.mjs`);
  return scene;
};
const sceneAt = (t) => (SCENES.find((s) => t >= s.start - EPS && t < s.end - EPS) ?? SCENES[SCENES.length - 1]).id;

/** mulberry32: a small, fast, seeded PRNG. Returns floats in [0, 1). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One independent stream per instrument, so retuning one never reshuffles another. */
function stream(name) {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x01000193);
  return mulberry32(h);
}

/** Equal-power pan, -1 left to +1 right. The centre is -3 dB on each side. */
function panGains(pan) {
  const th = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
  return [Math.cos(th), Math.sin(th)];
}

/** Topology-preserving state-variable filter (Zavalishin/Simper). Stable under modulation. */
class Svf {
  constructor() {
    this.ic1 = 0;
    this.ic2 = 0;
    this.band = 0;
    this.high = 0;
  }
  set(fc, q, sr) {
    const g = Math.tan((Math.PI * Math.min(fc, sr * 0.45)) / sr);
    this.k = 1 / q;
    this.a1 = 1 / (1 + g * (g + this.k));
    this.a2 = g * this.a1;
    this.a3 = g * this.a2;
    return this;
  }
  /** Returns the low-pass output; band and high are left on the instance. */
  tick(v0) {
    const v3 = v0 - this.ic2;
    const v1 = this.a1 * this.ic1 + this.a2 * v3;
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.band = v1;
    this.high = v0 - this.k * v1 - v2;
    return v2;
  }
}

class Bus {
  constructor(name, n, sr, stereo = true) {
    this.name = name;
    this.n = n;
    this.sr = sr;
    this.stereo = stereo;
    this.l = new Float32Array(n);
    this.r = stereo ? new Float32Array(n) : null;
  }
}

/**
 * Adds a sound to a bus. `fn(t)` gives the raw signal at t seconds after `t0`;
 * every sound gets a raised-cosine attack and release, so nothing starts or stops
 * on a hard edge.
 */
function play(bus, t0, len, { pan = 0, attack = 0.003, release = 0.01, gain = 1 }, fn) {
  const { sr, n } = bus;
  const start = Math.round(t0 * sr);
  const count = Math.round(len * sr);
  const [gl, gr] = panGains(pan);
  const aN = Math.max(1, Math.round(attack * sr));
  const rN = Math.max(1, Math.round(release * sr));
  for (let j = 0; j < count; j++) {
    const i = start + j;
    if (i >= n) break;
    let e = gain;
    if (j < aN) e *= 0.5 - 0.5 * Math.cos((Math.PI * j) / aN);
    const left = count - 1 - j;
    if (left < rN) e *= 0.5 - 0.5 * Math.cos((Math.PI * left) / rN);
    const v = fn(j / sr) * e;
    if (i < 0) continue;
    if (bus.stereo) {
      bus.l[i] += v * gl;
      bus.r[i] += v * gr;
    } else {
      bus.l[i] += v;
    }
  }
}

// --- instruments --------------------------------------------------------------

const TABLE_SIZE = 4096;

/** One cycle of a soft, band-limited saw: 16 harmonics, so no partial nears Nyquist. */
function padTable() {
  const table = new Float32Array(TABLE_SIZE + 1);
  for (let k = 1; k <= 16; k++) {
    const amp = (k % 2 ? 1 : 0.8) / k ** 1.15;
    for (let i = 0; i < TABLE_SIZE; i++) table[i] += amp * Math.sin((TAU * k * i) / TABLE_SIZE);
  }
  let peak = 0;
  for (let i = 0; i < TABLE_SIZE; i++) peak = Math.max(peak, Math.abs(table[i]));
  for (let i = 0; i < TABLE_SIZE; i++) table[i] /= peak;
  table[TABLE_SIZE] = table[0];
  return table;
}

/** A chord on the pad: two voices a note, detuned by 12 cents and spread left and right. */
function padChord(bus, table, rand, t0, t1, notes, { attack = 0.35, release = 0.7, gain = 1 } = {}) {
  const g = gain / Math.sqrt(notes.length);
  for (const midi of notes) {
    for (const [cents, pan] of [
      [-6, -0.55],
      [6, 0.55],
    ]) {
      const inc = (mtof(midi) * 2 ** (cents / 1200) * TABLE_SIZE) / bus.sr;
      let ph = rand() * TABLE_SIZE;
      play(bus, t0, t1 - t0 + release, { attack, release, gain: g, pan }, () => {
        const i = ph | 0;
        const v = table[i] + (ph - i) * (table[i + 1] - table[i]);
        ph += inc;
        if (ph >= TABLE_SIZE) ph -= TABLE_SIZE;
        return v;
      });
    }
  }
}

/** Soft mallet, kalimba-like: a sine with a quick FM knock and a short fourth partial. */
function mallet(bus, t0, midi, vel, { decay = 1, bright = 1, pan } = {}) {
  const sr = bus.sr;
  const f = mtof(midi);
  const tau = clamp(0.42 * Math.sqrt(440 / f), 0.12, 0.7) * decay;
  const len = Math.min(tau * Math.log(1000), 6);
  const w = TAU * f;
  const p4 = 4 * f < 5000 ? 0.16 * bright : 0;
  const d1 = Math.exp(-1 / (tau * sr));
  const dKnock = Math.exp(-1 / (0.012 * sr));
  const d4 = Math.exp(-1 / (0.045 * sr));
  let e1 = 1;
  let eK = 1.1 * bright;
  let e4 = p4;
  play(bus, t0, len, { pan: pan ?? clamp((midi - 69) / 20, -0.45, 0.45), attack: 0.003, release: 0.02, gain: vel }, (t) => {
    const ph = w * t;
    const v = e1 * Math.sin(ph + eK * Math.sin(ph)) + e4 * Math.sin(4 * ph);
    e1 *= d1;
    eK *= dKnock;
    e4 *= d4;
    return v;
  });
}

/** Soft bell: near-harmonic partials that die away from the top down. */
function bell(bus, t0, midi, vel, { decay = 1, pan = 0 } = {}) {
  const sr = bus.sr;
  const f = mtof(midi);
  const tau = clamp(1.1 * Math.sqrt(660 / f), 0.4, 1.6) * decay;
  const len = Math.min(tau * Math.log(1000), 6);
  const parts = [
    [1, 1, 1],
    [2, 0.32, 0.45],
    [3, 0.1, 0.22],
    [4.2, 0.05, 0.12],
  ].filter(([ratio]) => ratio * f < 7000);
  const w = parts.map(([ratio]) => TAU * f * ratio);
  const e = parts.map(([, amp]) => amp);
  const d = parts.map(([, , ts]) => Math.exp(-1 / (tau * ts * sr)));
  play(bus, t0, len, { pan, attack: 0.004, release: 0.02, gain: vel }, (t) => {
    let v = 0;
    for (let p = 0; p < w.length; p++) {
      v += e[p] * Math.sin(w[p] * t);
      e[p] *= d[p];
    }
    return v;
  });
}

/** Warm bass: a sine with a little second and third harmonic, gently saturated. */
function bassNote(bus, t0, dur, midi, vel, { sustainTau = 0, release = 0.06 } = {}) {
  const w = TAU * mtof(midi);
  const drive = 1.6;
  const norm = Math.tanh(drive);
  play(bus, t0, dur + release, { attack: 0.006, release, gain: vel }, (t) => {
    const env = sustainTau ? Math.exp(-t / sustainTau) : 0.68 + 0.32 * Math.exp(-t / 0.22);
    const ph = w * t;
    const s = Math.sin(ph) + 0.2 * Math.sin(2 * ph) + 0.05 * Math.sin(3 * ph);
    return Math.tanh(drive * 0.8 * s * env) / norm;
  });
}

/** Soft kick: a sine that falls from 135 to 47 Hz. */
function kick(bus, t0, vel) {
  const sr = bus.sr;
  const norm = Math.tanh(1.5);
  let ph = 0;
  play(bus, t0, 0.42, { attack: 0.002, release: 0.03, gain: vel }, (t) => {
    ph += (TAU * (47 + 88 * Math.exp(-t / 0.028))) / sr;
    return Math.tanh(1.5 * Math.sin(ph) * Math.exp(-t / 0.18)) / norm;
  });
}

/** Clap: three quick bursts of band-passed noise, a short tail and a little body. */
function clap(bus, t0, vel, rand) {
  const sr = bus.sr;
  const bp = new Svf().set(1300, 0.9, sr);
  const lp = new Svf().set(4200, 0.707, sr);
  const bursts = [0, 0.009, 0.018];
  play(bus, t0, 0.3, { attack: 0.002, release: 0.03, gain: vel }, (t) => {
    let e = 0;
    for (const b of bursts) {
      const x = t - b;
      if (x >= 0) e += Math.min(1, x / 0.002) * Math.exp(-x / 0.0045);
    }
    const x = t - 0.02;
    if (x >= 0) e += 0.55 * Math.min(1, x / 0.003) * Math.exp(-x / 0.085);
    bp.tick((rand() * 2 - 1) * e);
    const noise = lp.tick(bp.band * bp.k);
    return 1.8 * noise + 0.35 * Math.sin(TAU * 190 * t) * Math.exp(-t / 0.04);
  });
}

/** Closed hat: noise above 7 kHz (24 dB/oct), rounded off at 12.5 kHz. */
function hat(bus, t0, vel, rand, pan = 0.18) {
  const sr = bus.sr;
  const hp1 = new Svf().set(7000, 0.707, sr);
  const hp2 = new Svf().set(7000, 0.707, sr);
  const lp = new Svf().set(12500, 0.707, sr);
  play(bus, t0, 0.13, { attack: 0.002, release: 0.02, gain: vel, pan }, (t) => {
    hp1.tick(rand() * 2 - 1);
    hp2.tick(hp1.high);
    return lp.tick(hp2.high) * Math.exp(-t / 0.024);
  });
}

/** A short pitched tick, for the vote counter. */
function tick(bus, t0, midi, vel, pan = 0) {
  const w = TAU * mtof(midi);
  play(bus, t0, 0.2, { attack: 0.002, release: 0.02, gain: vel, pan }, (t) => Math.exp(-t / 0.035) * (Math.sin(w * t) + 0.25 * Math.sin(2 * w * t)));
}

/** A keyboard key: a band-passed noise tick over a small woody thock. */
function keyTick(bus, t0, vel, rand, pan) {
  const sr = bus.sr;
  const bp = new Svf().set(2200 + rand() * 900, 1.4, sr);
  const thock = 330 + rand() * 80;
  play(bus, t0, 0.06, { attack: 0.002, release: 0.01, gain: vel, pan }, (t) => {
    bp.tick(rand() * 2 - 1);
    return 1.4 * bp.band * bp.k * Math.exp(-t / 0.006) + 0.5 * Math.sin(TAU * thock * t) * Math.exp(-t / 0.012);
  });
}

/** Sine with an exponential pitch glide from f0 to f1 over `glide` seconds. */
function glideTone(bus, t0, { f0, f1, glide, tau, len, vel, harm2 = 0, pan = 0, attack = 0.003 }) {
  const sr = bus.sr;
  let ph = 0;
  play(bus, t0, len, { attack, release: 0.03, gain: vel, pan }, (t) => {
    ph += (TAU * f0 * (f1 / f0) ** Math.min(1, t / glide)) / sr;
    return Math.exp(-t / tau) * (Math.sin(ph) + harm2 * Math.sin(2 * ph));
  });
}

/** The warning bubble popping up: a quick upward blip. */
function pop(bus, t0, vel) {
  glideTone(bus, t0, { f0: 380, f1: 830, glide: 0.035, tau: 0.07, len: 0.35, vel, harm2: 0.15 });
}

/** The send button: a soft blip up a fifth, A5 to E6. */
function sendBlip(bus, t0, vel) {
  glideTone(bus, t0, { f0: 880, f1: 1320, glide: 0.05, tau: 0.08, len: 0.4, vel, harm2: 0.2 });
}

/** A UI button: three short sines and a breath of noise. Crisp, not sharp. */
function uiClick(bus, t0, vel, rand) {
  const hp = new Svf().set(2500, 0.7, bus.sr);
  play(bus, t0, 0.12, { attack: 0.002, release: 0.02, gain: vel }, (t) => {
    hp.tick(rand() * 2 - 1);
    return (
      0.45 * Math.sin(TAU * 2100 * t) * Math.exp(-t / 0.006) +
      0.55 * Math.sin(TAU * 1050 * t) * Math.exp(-t / 0.014) +
      0.5 * Math.sin(TAU * 520 * t) * Math.exp(-t / 0.028) +
      0.12 * hp.high * Math.exp(-t / 0.003)
    );
  });
}

/** A low, soft impact: a falling sine and a puff of low-passed noise. */
function thud(bus, t0, vel, rand, { from = 190, to = 65, tau = 0.12, noiseCut = 700, len = 0.5 } = {}) {
  const sr = bus.sr;
  const lp = new Svf().set(noiseCut, 0.7, sr);
  let ph = 0;
  play(bus, t0, len, { attack: 0.003, release: 0.04, gain: vel }, (t) => {
    ph += (TAU * (to + (from - to) * Math.exp(-t / 0.035))) / sr;
    return Math.sin(ph) * Math.exp(-t / tau) + 0.6 * lp.tick(rand() * 2 - 1) * Math.exp(-t / 0.02);
  });
}

/**
 * The email leaving: band-passed noise sweeping up from 350 Hz to about 5 kHz, in
 * two layers so it moves from the centre to the right, as the email does.
 */
function whoosh(bus, t0, vel, randA, randB, len = 0.6) {
  const sr = bus.sr;
  for (const [pan, shape, gain, rand] of [
    [0, 0.8, 1, randA],
    [0.6, 1.4, 0.7, randB],
  ]) {
    const bp = new Svf();
    play(bus, t0, len, { attack: 0.01, release: 0.03, gain: vel * gain, pan }, (t) => {
      const x = t / len;
      bp.set(350 * 14 ** (x ** 1.6), 1.3, sr);
      bp.tick(rand() * 2 - 1);
      return bp.band * bp.k * Math.sin(Math.PI * x ** shape) ** 1.5;
    });
  }
}

/**
 * A reverse swell into a cut: a tone whose envelope grows like a struck note played
 * backwards, and a breath of noise opening upwards. Both end exactly on `cut`.
 */
function swell(bus, cut, midi, level, randL, randR, len = 0.8) {
  const sr = bus.sr;
  const t0 = cut - len;
  const w = TAU * mtof(midi);
  play(bus, t0, len, { attack: 0.08, release: 0.006, gain: level * 0.6 }, (t) => {
    const ph = w * t;
    return Math.exp(-(len - t) / 0.28) * (Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph));
  });
  for (const [pan, rand] of [
    [-0.5, randL],
    [0.5, randR],
  ]) {
    const bp = new Svf();
    play(bus, t0, len, { attack: 0.05, release: 0.006, gain: level * 0.9, pan }, (t) => {
      const x = t / len;
      bp.set(500 * 7 ** x, 0.7, sr);
      bp.tick(rand() * 2 - 1);
      return bp.band * bp.k * x ** 2.5;
    });
  }
}

// --- effects and master -------------------------------------------------------

/**
 * Reverb after the public-domain Freeverb design: eight damped combs into four
 * allpasses per side, the right side offset for width. A 20 ms pre-delay and a
 * 200 Hz-6 kHz band on the input keep it out of the low end and the top.
 */
function reverb(inL, inR, sr, { room = 0.8, damp = 0.45, predelay = 0.02 } = {}) {
  const n = inL.length;
  const scale = sr / 44100;
  const COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const ALLPASSES = [556, 441, 341, 225];
  const SPREAD = 23;
  const line = (samples) => ({ buf: new Float32Array(Math.round(samples * scale)), i: 0, store: 0 });
  const combs = [COMBS.map(line), COMBS.map((s) => line(s + SPREAD))];
  const aps = [ALLPASSES.map(line), ALLPASSES.map((s) => line(s + SPREAD))];
  const hp = new Svf().set(200, 0.707, sr);
  const lp = new Svf().set(6000, 0.707, sr);
  const pd = Math.round(predelay * sr);
  const out = [new Float32Array(n), new Float32Array(n)];
  for (let i = 0; i < n; i++) {
    const x0 = i >= pd ? (inL[i - pd] + inR[i - pd]) * 0.5 : 0;
    hp.tick(x0);
    const x = lp.tick(hp.high) * 0.03;
    for (let side = 0; side < 2; side++) {
      let acc = 0;
      for (const c of combs[side]) {
        const y = c.buf[c.i];
        c.store = y * (1 - damp) + c.store * damp;
        c.buf[c.i] = x + c.store * room;
        if (++c.i >= c.buf.length) c.i = 0;
        acc += y;
      }
      for (const a of aps[side]) {
        const b = a.buf[a.i];
        a.buf[a.i] = acc + b * 0.5;
        if (++a.i >= a.buf.length) a.i = 0;
        acc = b - acc;
      }
      out[side][i] = acc;
    }
  }
  return out;
}

/** Second-order high-pass, in place: removes DC and sub-sonic rumble. */
function highpass(x, sr, fc) {
  const f = new Svf().set(fc, Math.SQRT1_2, sr);
  for (let i = 0; i < x.length; i++) {
    f.tick(x[i]);
    x[i] = f.high;
  }
}

/** Gentle stereo-linked RMS compressor with a soft knee, in place. Returns the deepest reduction in dB. */
function compress(L, R, sr, { threshold, ratio = 2, knee = 6, attack = 0.012, release = 0.18, window = 0.025 }) {
  const aW = Math.exp(-1 / (window * sr));
  const aA = Math.exp(-1 / (attack * sr));
  const aR = Math.exp(-1 / (release * sr));
  const slope = 1 / ratio - 1;
  let ms = 0;
  let gr = 0;
  let deepest = 0;
  for (let i = 0; i < L.length; i++) {
    ms = aW * ms + (1 - aW) * 0.5 * (L[i] * L[i] + R[i] * R[i]);
    const over = 10 * Math.log10(ms + 1e-12) - threshold;
    let target = 0;
    if (2 * over >= knee) target = slope * over;
    else if (2 * over > -knee) target = (slope * (over + knee / 2) ** 2) / (2 * knee);
    gr = target < gr ? aA * gr + (1 - aA) * target : aR * gr + (1 - aR) * target;
    deepest = Math.min(deepest, gr);
    const g = 10 ** (gr / 20);
    L[i] *= g;
    R[i] *= g;
  }
  return deepest;
}

/** Peak estimate with 4x oversampling (32-tap windowed sinc), checked around the loudest samples. */
function truePeak(L, R) {
  const HALF = 16;
  const taps = [0.25, 0.5, 0.75].map((frac) => {
    const k = [];
    for (let j = -HALF + 1; j <= HALF; j++) {
      const x = j - frac;
      const sinc = Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
      const win = 0.5 + 0.5 * Math.cos((Math.PI * x) / HALF);
      k.push(sinc * win);
    }
    return k;
  });
  let peak = 0;
  for (const x of [L, R]) for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  let tp = peak;
  for (const x of [L, R]) {
    for (let i = HALF; i < x.length - HALF; i++) {
      if (Math.abs(x[i]) < peak * 0.5 && Math.abs(x[i + 1]) < peak * 0.5) continue;
      for (const k of taps) {
        let v = 0;
        for (let j = 0; j < k.length; j++) v += k[j] * x[i - HALF + 1 + j];
        tp = Math.max(tp, Math.abs(v));
      }
    }
  }
  return tp;
}

// --- the score ----------------------------------------------------------------

const BUSES = [
  ['pad', true],
  ['arp', true],
  ['bell', true],
  ['bass', false],
  ['kick', false],
  ['clap', false],
  ['hat', true],
  ['ui', true],
  ['ticks', true],
  ['swell', true],
];

/** Writes every note and sound into the buses. Returns the kicks, which drive the ducking. */
function compose(bus, sr) {
  const rand = Object.fromEntries(
    ['pad', 'arp', 'hat', 'clap', 'keys', 'ui', 'whooshA', 'whooshB', 'swellL', 'swellR', 'ticks'].map((k) => [k, stream(k)]),
  );
  const gapFrom = HITS.sent - BEAT / 2;
  const inGap = (t) => t >= gapFrom - EPS && t < HITS.sent - EPS;
  const replaced = { kick: [HITS.skillDrop, HITS.stamp], clap: [HITS.approveSend, HITS.stamp] };
  const bars = Math.round(DURATION / BAR);
  const eighthsToEnd = Math.round(HITS.end / (BEAT / 2));

  // Pad: one chord a bar, crossfading; the first fades in slowly, the last rings out.
  const table = padTable();
  for (let b = 0; b < bars; b++) {
    const t0 = b * BAR;
    if (t0 >= HITS.end - EPS) break;
    padChord(bus.pad, table, rand.pad, t0, t0 + BAR, chordAt(t0).pad, { attack: b === 0 ? 1.4 : 0.35 });
  }
  // The last chord holds; the master fade alone shapes its ring-out, so there is one smooth curve.
  padChord(bus.pad, table, rand.pad, HITS.end, DURATION - 0.3, CHORDS.D69.pad, { attack: 0.12, release: 0.25, gain: 1.1 });

  // Mallets: a few notes in the opening, then eighths over each chord.
  for (const [beat, midi, vel] of INTRO_MALLETS) mallet(bus.arp, beat * BEAT, midi, vel, { decay: 1.4 });
  for (let e = 0; e < eighthsToEnd; e++) {
    const t = (e * BEAT) / 2;
    const style = ARP[sceneAt(t)];
    if (!style || inGap(t)) continue;
    const pos = e % 8;
    if (style.skip?.includes(pos)) continue;
    const chord = chordAt(t);
    const midi = chord.arp[style.pattern[pos] % chord.arp.length];
    const vel = ACCENT[pos] * style.vel * (0.94 + rand.arp() * 0.12);
    const at = t + (rand.arp() - 0.5) * 0.006;
    mallet(bus.arp, at, midi, vel);
    if (style.octave?.includes(pos)) mallet(bus.arp, at, midi + 12, vel * 0.38, { bright: 0.6 });
  }
  // The end card: D6/9 rolled upwards, and a soft bell as the mark appears.
  CHORDS.D69.arp.forEach((midi, i) => mallet(bus.arp, HITS.end + i * 0.035, midi, 0.4, { decay: 2, bright: 0.7 }));
  bell(bus.bell, HITS.end + 0.1, 86, 0.3, { decay: 1.4, pan: 0.2 });

  // Drums, beat by beat.
  const kicks = [];
  for (let beat = 0; beat < Math.round(HITS.end / BEAT); beat++) {
    const t = beat * BEAT;
    const style = DRUMS[sceneAt(t)];
    if (!style) continue;
    const inBar = beat % 4;
    if (style.kick.includes(inBar) && !inGap(t) && !near(t, replaced.kick)) {
      const vel = style.kickVel * (inBar === 0 ? 1 : 0.88);
      kick(bus.kick, t, vel);
      kicks.push({ t, vel });
    }
    if (style.clap.includes(inBar) && !inGap(t) && !near(t, replaced.clap)) {
      clap(bus.clap, t + 0.004, style.clapVel * (0.95 + rand.clap() * 0.1), rand.clap);
    }
    if (style.hats) {
      const steps =
        style.hats === 'sixteenths'
          ? [
              [0, 0.55],
              [0.5, 0.8],
              [0.75, 0.3],
            ]
          : style.hats === 'offbeats'
            ? [[0.5, 0.8]]
            : [
                [0, 0.55],
                [0.5, 0.8],
              ];
      for (const [offset, vel] of steps) {
        const at = t + offset * BEAT;
        if (inGap(at)) continue;
        hat(bus.hat, at + (rand.hat() - 0.5) * 0.004, style.hatVel * vel * (0.9 + rand.hat() * 0.2), rand.hat);
      }
    }
  }

  // Bass, from the bar's pattern, cut short before the gap.
  for (let b = 0; b < bars; b++) {
    const t0 = b * BAR;
    if (t0 >= HITS.end - EPS) break;
    const pattern = BASS_PATTERNS[BASS[sceneAt(t0)]];
    if (!pattern) continue;
    for (const [beat, length, octave] of pattern) {
      const t = t0 + beat * BEAT;
      if (inGap(t)) continue;
      let dur = length * BEAT;
      if (t < gapFrom && t + dur > gapFrom - 0.06) dur = gapFrom - 0.06 - t;
      if (dur > 0.05) bassNote(bus.bass, t, dur, chordAt(t).bass + octave, octave ? 0.7 : 0.9);
    }
  }
  bassNote(bus.bass, HITS.end, DURATION - HITS.end - 0.6, CHORDS.D69.bass, 0.9, { sustainTau: 1.3, release: 0.5 });

  // Street: the walker stops, a warning pops up.
  pop(bus.ui, HITS.stop, 0.8);

  // Issue: a tick each time the counter passes another four votes, climbing the scale.
  const inverseInOut = (y) => (y < 0.5 ? Math.cbrt(y / 4) : 1 - Math.cbrt(2 * (1 - y)) / 2);
  VOTE_PITCHES.forEach((midi, i) => {
    const votes = (i + 1) * VOTE_STEP;
    if (votes > VOTES) return;
    const t = HITS.votesFrom + inverseInOut(votes / VOTES) * (HITS.votesTo - HITS.votesFrom);
    tick(bus.ticks, t, midi, 0.45 + 0.03 * i, clamp((i - 4.5) / 10, -0.4, 0.4));
  });
  bell(bus.bell, HITS.votesTo, 86, 0.25, { decay: 0.6 });

  // Connect: the Approve click, then a two-bell chime when the cable closes.
  uiClick(bus.ui, HITS.approveConnect, 0.8, rand.ui);
  bell(bus.bell, HITS.connected, 78, 0.6, { pan: -0.15 });
  bell(bus.bell, HITS.connected + BEAT / 4, 83, 0.55, { pan: 0.15 });

  // Skill: the file drops in, then three chips tick in.
  thud(bus.ui, HITS.skillDrop, 0.9, rand.ui);
  HITS.chips.forEach((t, i) => mallet(bus.ticks, t, [86, 88, 90][i], 0.45, { decay: 0.35, bright: 0.5, pan: -0.2 + 0.2 * i }));

  // Ask: a dozen key presses at uneven times, then the send blip.
  const keys = 12;
  const typing = HITS.typeTo - HITS.typeFrom;
  for (let k = 0; k < keys; k++) {
    const t = HITS.typeFrom + ((k + 0.5 + (rand.keys() - 0.5) * 0.6) / keys) * typing;
    keyTick(bus.ticks, t, 0.55 + 0.45 * rand.keys(), rand.keys, (rand.keys() - 0.5) * 0.3);
  }
  sendBlip(bus.bell, HITS.askSend, 0.6);

  // Petitions: one bright note per sheet, up the chord.
  HITS.sheets.forEach((t, i) => {
    const midi = [83, 86, 90][i];
    bell(bus.bell, t, midi, 0.55, { decay: 0.8, pan: -0.25 + 0.25 * i });
    mallet(bus.bell, t, midi, 0.35, { bright: 1.2, decay: 0.6, pan: -0.25 + 0.25 * i });
  });

  // Send: the click on "Da, trimite", then the email flies off.
  uiClick(bus.ui, HITS.approveSend, 0.9, rand.ui);
  whoosh(bus.ui, HITS.sent, 1.4, rand.whooshA, rand.whooshB);

  // Registered: the stamp lands, a chime a major third up.
  thud(bus.ui, HITS.stamp, 1, rand.ui, { from: 130, to: 52, tau: 0.15, noiseCut: 500 });
  bell(bus.bell, HITS.stamp + 0.02, 86, 0.5, { decay: 0.5 });
  bell(bus.bell, HITS.stamp + 0.1, 90, 0.45, { decay: 0.6 });

  // A swell into every cut from 8 s on, on a pitch both chords share; louder where the picture wipes.
  const wipes = [sceneById('connect').start, sceneById('skill').start, sceneById('send').start, HITS.end];
  for (const scene of SCENES) {
    const cut = scene.start;
    if (cut < sceneById('connect').start - EPS) continue;
    const before = new Set(chordAt(cut - BEAT).pad.map((m) => m % 12));
    const after = chordAt(cut);
    const pcs = [after.root, ...after.pad.map((m) => m % 12)];
    const pc = pcs.find((p) => before.has(p)) ?? after.root;
    swell(bus.swell, cut, 74 + ((pc - 2 + 12) % 12), near(cut, wipes) ? 1 : 0.6, rand.swellL, rand.swellR);
  }

  return kicks;
}

/** Pad cutoff over time: opens through the street, closes a little for typing, darkens at the end. */
function padCutoff() {
  const street = sceneById('street');
  const ask = sceneById('ask');
  const registered = sceneById('registered');
  const points = [
    [0, 320],
    [street.end, 2600],
    [ask.start, 2600],
    [ask.start + BEAT / 2, 1400],
    [ask.end - BEAT, 1400],
    [ask.end, 3000],
    [registered.start, 3000],
    [registered.start + BEAT, 2500],
    [HITS.end, 2500],
    [DURATION, 650],
  ];
  return (t) => {
    for (let p = 1; p < points.length; p++) {
      const [t1, f1] = points[p];
      if (t <= t1) {
        const [t0, f0] = points[p - 1];
        const x = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
        return f0 * (f1 / f0) ** clamp(x, 0, 1);
      }
    }
    return points[points.length - 1][1];
  };
}

function filterPad(bus) {
  const { sr, n } = bus;
  const cutoff = padCutoff();
  const fl = new Svf();
  const fr = new Svf();
  for (let i = 0; i < n; i += 32) {
    const fc = cutoff(i / sr);
    fl.set(fc, 0.62, sr);
    fr.set(fc, 0.62, sr);
    for (let j = i; j < Math.min(i + 32, n); j++) {
      bus.l[j] = fl.tick(bus.l[j]);
      bus.r[j] = fr.tick(bus.r[j]);
    }
  }
}

/**
 * Gain curve that dips by DUCK_DB on each kick, whatever its velocity: down in 4 ms,
 * back over about a quarter second.
 */
function duckCurve(n, sr, kicks) {
  const env = new Float32Array(n);
  const attack = Math.round(0.004 * sr);
  const len = Math.round(0.4 * sr);
  for (const { t } of kicks) {
    const s = Math.round(t * sr);
    for (let j = 0; j < len && s + j < n; j++) {
      const e = j < attack ? 0.5 - 0.5 * Math.cos((Math.PI * j) / attack) : Math.exp(-(j - attack) / (0.09 * sr));
      if (e > env[s + j]) env[s + j] = e;
    }
  }
  const depth = 1 - dbToGain(DUCK_DB);
  for (let i = 0; i < n; i++) env[i] = 1 - depth * Math.min(1, env[i]);
  return env;
}

/** Silences a bus between t0 and t1 with short raised-cosine edges. */
function gate(bus, t0, t1, fadeIn = 0.015, fadeOut = 0.003) {
  const { sr, n } = bus;
  const a = Math.round((t0 - fadeIn) * sr);
  const b = Math.round(t0 * sr);
  const c = Math.round((t1 - fadeOut) * sr);
  const d = Math.round(t1 * sr);
  for (let i = Math.max(0, a); i < Math.min(n, d); i++) {
    let g = 0;
    if (i < b) g = 0.5 + 0.5 * Math.cos((Math.PI * (i - a)) / (b - a));
    else if (i >= c) g = 0.5 - 0.5 * Math.cos((Math.PI * (i - c)) / (d - c));
    bus.l[i] *= g;
    if (bus.r) bus.r[i] *= g;
  }
}

function assertSound(name, ...channels) {
  let peak = 0;
  for (const x of channels) {
    for (let i = 0; i < x.length; i++) {
      if (!Number.isFinite(x[i])) throw new Error(`soundtrack: ${name} has a non-finite sample at ${i}`);
      peak = Math.max(peak, Math.abs(x[i]));
    }
  }
  if (peak < 1e-6) throw new Error(`soundtrack: ${name} is silent`);
  return peak;
}

/** Renders the buses and the master. With `stems`, also returns each bus at the master's scale. */
function renderAll({ sampleRate = 48000, stems = false } = {}) {
  const sr = sampleRate;
  const n = Math.round(DURATION * sr);
  const bus = Object.fromEntries(BUSES.map(([name, stereo]) => [name, new Bus(name, n, sr, stereo)]));

  const kicks = compose(bus, sr);
  filterPad(bus.pad);
  const duck = duckCurve(n, sr, kicks);
  for (const name of ['pad', 'bass']) {
    for (let i = 0; i < n; i++) {
      bus[name].l[i] *= duck[i];
      if (bus[name].r) bus[name].r[i] *= duck[i];
    }
  }
  for (const name of ['kick', 'clap', 'hat']) gate(bus[name], HITS.sent - BEAT / 2, HITS.sent);

  // Each bus at its gain into the mix and, by its send, into the reverb.
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const sendL = new Float32Array(n);
  const sendR = new Float32Array(n);
  for (const [name] of BUSES) {
    const b = bus[name];
    assertSound(name, b.l, ...(b.r ? [b.r] : []));
    const g = dbToGain(GAIN_DB[name]);
    const s = SEND[name] ?? 0;
    if (!b.stereo) {
      // A mono bus sits in the centre at -3 dB a side, like a stereo one panned there.
      const r = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const v = b.l[i] * g * Math.SQRT1_2;
        b.l[i] = v;
        r[i] = v;
      }
      b.r = r;
      b.stereo = true;
    } else {
      for (let i = 0; i < n; i++) {
        b.l[i] *= g;
        b.r[i] *= g;
      }
    }
    for (let i = 0; i < n; i++) {
      L[i] += b.l[i];
      R[i] += b.r[i];
      if (s) {
        sendL[i] += b.l[i] * s;
        sendR[i] += b.r[i] * s;
      }
    }
  }
  const [wetL, wetR] = reverb(sendL, sendR, sr);
  const gWet = dbToGain(GAIN_DB.reverb);
  for (let i = 0; i < n; i++) {
    wetL[i] *= gWet;
    wetR[i] *= gWet;
    L[i] += wetL[i];
    R[i] += wetR[i];
  }
  assertSound('reverb', wetL, wetR);

  // Master: high-pass, a known level into a gentle compressor, the fade, the peak.
  highpass(L, sr, 20);
  highpass(R, sr, 20);
  let sum = 0;
  const from = Math.round(sceneById('connect').start * sr);
  const to = Math.round(HITS.end * sr);
  for (let i = from; i < to; i++) sum += 0.5 * (L[i] * L[i] + R[i] * R[i]);
  const pre = dbToGain(-20 - 10 * Math.log10(sum / (to - from)));
  for (let i = 0; i < n; i++) {
    L[i] *= pre;
    R[i] *= pre;
  }
  const reduction = compress(L, R, sr, { threshold: -21, ratio: 2, knee: 6 });

  const fadeFrom = Math.round((HITS.end + 3 * BEAT) * sr);
  const silentFrom = Math.round((DURATION - 0.05) * sr);
  for (let i = fadeFrom; i < n; i++) {
    const x = i >= silentFrom ? 1 : (i - fadeFrom) / (silentFrom - fadeFrom);
    const g = Math.cos((Math.PI * x) / 2) ** 2;
    L[i] = i >= silentFrom ? 0 : L[i] * g;
    R[i] = i >= silentFrom ? 0 : R[i] * g;
  }

  const tp = truePeak(L, R);
  const norm = dbToGain(TARGET_TRUE_PEAK_DB) / tp;
  for (let i = 0; i < n; i++) {
    L[i] *= norm;
    R[i] *= norm;
  }
  assertSound('master', L, R);
  for (let i = silentFrom; i < n; i++) {
    if (L[i] !== 0 || R[i] !== 0) throw new Error('soundtrack: the last 50 ms must be silent');
  }

  const result = {
    sampleRate: sr,
    left: L,
    right: R,
    info: { compressionDb: reduction, masterGainDb: gainToDb(pre * norm), truePeakDb: gainToDb(tp * norm) },
  };
  if (stems) {
    const scale = pre * norm;
    result.stems = [...BUSES.map(([name]) => [name, bus[name].l, bus[name].r]), ['reverb', wetL, wetR]].map(
      ([name, l, r]) => {
        for (let i = 0; i < n; i++) {
          l[i] *= scale;
          r[i] *= scale;
        }
        return { name, left: l, right: r };
      },
    );
  }
  return result;
}

/**
 * The soundtrack as two channels of exactly DURATION * sampleRate samples, peaking
 * at about -1 dBTP and silent for its last 50 ms.
 */
export function renderSoundtrack({ sampleRate = 48000 } = {}) {
  const { left, right } = renderAll({ sampleRate });
  return { sampleRate, left, right };
}

/** Writes a stereo PCM WAV, 24-bit by default (no dither needed, so silence stays exactly 0). */
export function writeWav(path, { sampleRate, left, right }, { bitDepth = 24 } = {}) {
  if (bitDepth !== 16 && bitDepth !== 24) throw new Error('writeWav: bitDepth must be 16 or 24');
  const bytes = bitDepth / 8;
  const block = 2 * bytes;
  const n = left.length;
  const dataSize = n * block;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * block, 28);
  buf.writeUInt16LE(block, 32);
  buf.writeUInt16LE(bitDepth, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataSize, 40);
  const max = 2 ** (bitDepth - 1) - 1;
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (const x of [left[i], right[i]]) {
      const v = Math.round(clamp(x, -1, 1) * max);
      if (bytes === 3) buf.writeIntLE(v, o, 3);
      else buf.writeInt16LE(v, o);
      o += bytes;
    }
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buf);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const positional = args.filter((a) => !a.startsWith('--'));
  const out = positional[0] ? resolve(process.cwd(), positional[0]) : join(PROJECT, 'out', 'soundtrack.wav');
  const started = performance.now();
  const { sampleRate, left, right, stems, info } = renderAll({ stems: args.includes('--stems') });
  const rendered = performance.now();
  writeWav(out, { sampleRate, left, right });
  let peak = 0;
  let clipped = 0;
  for (const x of [left, right]) {
    for (let i = 0; i < x.length; i++) {
      peak = Math.max(peak, Math.abs(x[i]));
      if (Math.abs(x[i]) >= 1) clipped++;
    }
  }
  console.log(out);
  console.log(
    `peak ${gainToDb(peak).toFixed(2)} dBFS, true peak ~${info.truePeakDb.toFixed(2)} dBTP, ` +
      `${clipped} clipped, compressor ${info.compressionDb.toFixed(1)} dB at most, ` +
      `${left.length} samples, rendered in ${((rendered - started) / 1000).toFixed(1)} s`,
  );
  if (stems) {
    for (const stem of stems) {
      const file = join(dirname(out), 'stems', `${stem.name}.wav`);
      writeWav(file, { sampleRate, left: stem.left, right: stem.right });
      console.log(`stem ${file}`);
    }
  }
}
