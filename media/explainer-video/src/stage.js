// Every visual value in the film is computed here from one number, the time.
// `window.seek(t)` is pure: seeking to the same t twice draws the same frame, in
// any order, which is what makes the render deterministic. Moments the
// soundtrack also marks come from HITS in timeline.mjs, so picture and sound
// share one clock.

import { HITS, SCENES } from './timeline.mjs';

const $ = (id) => document.getElementById(id);
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const linear = (p) => p;
const outCubic = (p) => 1 - (1 - p) ** 3;
const outExpo = (p) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p));
const inCubic = (p) => p ** 3;
const inOut = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);

/** Progress of `t` through [a, b], eased. */
const prog = (t, a, b, ease = outCubic) => ease(clamp((t - a) / (b - a)));
const mix = (a, b, p) => a + (b - a) * p;

/** Entrance: a fade and a rise, quick out of the blocks and settling softly. */
function appear(el, t, at, rise = 26, dur = 0.45) {
  const p = prog(t, at, at + dur, outExpo);
  el.style.opacity = clamp((t - at) / (dur * 0.6));
  el.style.transform = `translateY(${mix(rise, 0, p)}px)`;
}

/** Entrance by scale, for marks and badges. */
function pop(el, t, at, from = 0.6, dur = 0.3) {
  const p = prog(t, at, at + dur, outExpo);
  el.style.opacity = clamp((t - at) / (dur * 0.5));
  el.style.transform = `scale(${mix(from, 1, p)})`;
}

/** A press: the element dips for a moment, then stays a shade darker. */
function press(el, t, at) {
  const dip = t >= at && t < at + 0.16 ? 0.94 : 1;
  el.style.transform = `scale(${dip})`;
  el.style.filter = t >= at ? 'brightness(0.9)' : 'none';
}

const FADE = 0.3;

function drawScenes(t) {
  for (const scene of SCENES) {
    const el = $(scene.id);
    const visible = t >= scene.start - 0.001 && t < scene.end + FADE;
    el.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) continue;
    const first = scene.start === 0;
    const fadeIn = first ? 1 : prog(t, scene.start, scene.start + FADE, linear);
    const fadeOut = 1 - prog(t, scene.end, scene.end + FADE, linear);
    el.style.opacity = fadeIn * fadeOut;
    // The navy end card fills the frame, so sliding it would uncover a strip of paper.
    const slides = !first && scene.id !== 'end';
    el.style.transform = slides ? `translateX(${mix(56, 0, prog(t, scene.start, scene.start + 0.5, outExpo))}px)` : 'none';
    el.style.zIndex = t < scene.end ? 1 : 2;
    DRAW[scene.id]?.(t);
  }
}

// --- the three steps, and the wipe that opens each -----------------------

const startOf = (id) => SCENES.find((scene) => scene.id === id).start;

/** Step 1 runs from the connect scene, 2 from the skill, 3 from sending. */
const STEP_STARTS = [startOf('connect'), startOf('skill'), startOf('send')];
const STEP_DONE = [startOf('skill'), startOf('ask'), HITS.sent + 0.4];
/** The cuts the wipe opens: each step, then the end card. */
const WIPES = [...STEP_STARTS, startOf('end')];

function rail(t) {
  const el = $('rail');
  const from = STEP_STARTS[0];
  const until = startOf('registered');
  el.style.opacity = prog(t, from, from + 0.35, linear) * (1 - prog(t, until, until + 0.35, linear));
  STEP_STARTS.forEach((start, i) => {
    const item = $(`rail-${i + 1}`);
    item.classList.toggle('is-active', t >= start && t < STEP_DONE[i]);
    item.classList.toggle('is-done', t >= STEP_DONE[i]);
  });
}

function wipe(t) {
  const el = $('wipe');
  const cut = WIPES.find((c) => t >= c - 0.3 && t < c + 0.3);
  const p = cut === undefined ? 0 : prog(t, cut - 0.3, cut + 0.3, inOut);
  const x = cut === undefined ? -1400 : mix(-1400, 2300, p);
  el.style.transform = `translateX(${x}px) skewX(-12deg)`;
}

// --- street ---------------------------------------------------------------

const words = [...document.querySelectorAll('#street-title .word')];

function street(t) {
  words.forEach((word, i) => appear(word, t, 0.2 + i * 0.14, 40, 0.5));
  $('street-art').style.transform = `scale(${mix(1, 1.035, clamp(t / 4))})`;
  // Walks in from the left and stops short of the car.
  const walk = prog(t, 0.2, 2.4, (p) => p * (2 - p));
  const x = mix(-190, 800, walk);
  const step = walk < 1 ? Math.sin(t * 9) * 4 : 0;
  $('street-walker').setAttribute('transform', `translate(${x} ${776 + Math.abs(step)})`);
  const stop = prog(t, HITS.stop, HITS.stop + 0.25, outExpo);
  const stopEl = $('street-stop');
  stopEl.setAttribute('transform', `translate(${x + 100} ${418 + (1 - stop) * 12}) scale(${mix(0.6, 1, stop)})`);
  stopEl.setAttribute('opacity', clamp((t - HITS.stop) / 0.12));
}

// --- issue ----------------------------------------------------------------

function issue(t) {
  appear($('issue-card'), t, 4, 30, 0.5);
  const photo = $('issue-photo');
  const p = prog(t, 4, 4.6, outExpo);
  photo.style.opacity = clamp((t - 4) / 0.3);
  photo.style.transform = `scale(${mix(1.15, 1, p)})`;
  $('issue-votes').textContent = Math.round(mix(0, 42, prog(t, HITS.votesFrom, HITS.votesTo, inOut)));
  appear($('issue-next'), t, 6.75, 18, 0.4);
}

// --- connect --------------------------------------------------------------

const cable = $('connect-cable');
let cableLength = 0;

function connect(t) {
  pop($('connect-step'), t, 8.1);
  if (!cableLength) {
    cableLength = cable.getTotalLength();
    cable.style.strokeDasharray = cableLength;
  }
  // The consent card interrupts the cable until the person says yes.
  const drawn = prog(t, 8.5, 9.5, inOut) * 0.5 + prog(t, 11.5, HITS.connected, inOut) * 0.5;
  cable.style.strokeDashoffset = cableLength * (1 - drawn);

  const consent = $('consent');
  const shown = prog(t, HITS.consent, HITS.consent + 0.35) * (1 - prog(t, HITS.approveConnect + 0.25, HITS.approveConnect + 0.55));
  consent.style.opacity = shown;
  consent.style.transform = `translateY(${mix(28, 0, prog(t, HITS.consent, HITS.consent + 0.45, outExpo))}px)`;
  press($('consent-approve'), t, HITS.approveConnect);

  // The Civiti tile flashes a ring when the cable closes.
  const ring = t >= HITS.connected ? 1 - prog(t, HITS.connected, HITS.connected + 0.7, linear) : 0;
  $('civiti-tile').style.boxShadow = `0 0 0 ${mix(0, 26, 1 - ring)}px rgba(252, 163, 17, ${0.55 * ring})`;
  appear($('connected'), t, HITS.connected, 20, 0.4);
  $('connected').style.transform += ' translateX(-50%)';
}

// --- skill ----------------------------------------------------------------

function skill(t) {
  pop($('skill-step'), t, 14.1);
  // The file travels from the right into the assistant and disappears into it.
  const file = $('skill-file');
  const travel = prog(t, 14.45, HITS.skillDrop, inOut);
  file.style.opacity = clamp((t - 14.2) / 0.2) * (1 - prog(t, HITS.skillDrop - 0.15, HITS.skillDrop, linear));
  file.style.transform = `translate(${mix(0, -1110, travel)}px, ${mix(0, -4, travel)}px) scale(${mix(1, 0.3, travel)})`;

  const tile = $('skill-tile');
  const ring = t >= HITS.skillDrop ? 1 - prog(t, HITS.skillDrop, HITS.skillDrop + 0.7, linear) : 0;
  tile.style.boxShadow = `0 0 0 ${mix(0, 26, 1 - ring)}px rgba(252, 163, 17, ${0.55 * ring})`;
  pop($('skill-badge'), t, HITS.skillDrop + 0.05, 0.4);
  HITS.chips.forEach((at, i) => appear($(`chip-${i + 1}`), t, at, 22, 0.4));
}

// --- ask ------------------------------------------------------------------

const REQUEST = 'Scrie petiții pentru problema mea';

function ask(t) {
  const typed = Math.round(mix(0, REQUEST.length, clamp((t - HITS.typeFrom) / (HITS.typeTo - HITS.typeFrom))));
  const sent = t >= HITS.askSend;
  $('ask-typed').textContent = sent ? '' : REQUEST.slice(0, typed);
  $('ask-caret').style.opacity = sent || Math.floor(t * 3) % 2 ? 0 : 1;
  appear($('ask-bubble'), t, HITS.askSend, 18, 0.35);
}

// --- petitions ------------------------------------------------------------

const fans = [...document.querySelectorAll('.fan')];
const sheetTops = [330, 500, 670];

function petitions(t) {
  appear($('petitions').querySelector('.headline'), t, 20.05, 22, 0.4);
  appear($('petitions').querySelector('.source'), t, 20.15, 22, 0.4);
  HITS.sheets.forEach((at, i) => {
    const sheet = $(`sheet-${i + 1}`);
    const p = prog(t, at, at + 0.4, outExpo);
    sheet.style.top = `${sheetTops[i]}px`;
    sheet.style.opacity = clamp((t - at) / 0.2);
    sheet.style.transform = `translateX(${mix(-60, 0, p)}px)`;
    const fan = fans[i];
    const length = fan.getTotalLength();
    fan.style.strokeDasharray = length;
    fan.style.strokeDashoffset = length * (1 - prog(t, at - 0.4, at + 0.05, inOut));
  });
}

// --- send -----------------------------------------------------------------

function send(t) {
  pop($('send-step'), t, 24.1);
  const mail = $('mail');
  appear(mail, t, 24.15, 26, 0.45);
  // After the approval the email leaves: up and away to the right.
  const fly = prog(t, HITS.sent, HITS.sent + 0.55, inCubic);
  if (t >= HITS.sent) {
    mail.style.transform = `translate(${mix(0, 1100, fly)}px, ${mix(0, -300, fly)}px) rotate(${mix(0, 8, fly)}deg) scale(${mix(1, 0.55, fly)})`;
    mail.style.opacity = 1 - prog(t, HITS.sent + 0.25, HITS.sent + 0.55, linear);
  }
  const approve = $('approve');
  appear(approve, t, 24.5, 22, 0.4);
  approve.style.opacity = Number(approve.style.opacity) * (1 - prog(t, HITS.sent, HITS.sent + 0.25, linear));
  press($('approve-btn'), t, HITS.approveSend);
  appear($('sent'), t, HITS.sent + 0.4, 20, 0.4);
}

// --- registered -----------------------------------------------------------

function registered(t) {
  const ack = $('ack');
  appear(ack, t, 28.1, 26, 0.4);
  // The stamp lands hard and the card takes the knock.
  const stamp = $('stamp');
  const s = prog(t, HITS.stamp, HITS.stamp + 0.16, outExpo);
  stamp.style.opacity = clamp((t - HITS.stamp) / 0.06);
  stamp.style.transform = `rotate(-8deg) scale(${mix(1.7, 1, s)})`;
  if (t >= HITS.stamp && t < HITS.stamp + 0.2) {
    const knock = Math.sin((t - HITS.stamp) * 70) * 5 * (1 - (t - HITS.stamp) / 0.2);
    ack.style.transform = `translate(${knock}px, ${Math.abs(knock) * 0.6}px)`;
  }
  appear($('clock'), t, 29.4, 26, 0.45);
  // The term stays 30 on screen, as the caption says; only the meter runs, so it reads as a clock.
  $('clock-meter').style.transform = `scaleX(${mix(1, 0.9, prog(t, 29.9, 31.6, linear))})`;
}

// --- end ------------------------------------------------------------------

function end(t) {
  pop($('end-mark'), t, HITS.end + 0.1, 0.7, 0.4);
  appear($('end-title'), t, HITS.end + 0.35, 30, 0.5);
  appear($('end-url'), t, HITS.end + 0.8, 24, 0.45);
}

const DRAW = { street, issue, connect, skill, ask, petitions, send, registered, end };

// The issue photo is the street scene itself, cropped and frozen: the same
// drawing, so the cut from scene one to the card reads as one continuous object.
function buildIssuePhoto() {
  const photo = $('issue-photo');
  photo.setAttribute('viewBox', '760 340 900 600');
  photo.style.cssText = 'position:absolute;left:230px;top:190px;width:720px;height:480px;border-radius:18px;transform-origin:50% 50%;';
  street(3.4);
  const art = $('street-art').cloneNode(true);
  for (const node of art.querySelectorAll('[id]')) node.removeAttribute('id');
  photo.replaceChildren(...art.children);
}

window.seek = (t) => {
  drawScenes(t);
  rail(t);
  wipe(t);
  return t;
};

window.stageReady = Promise.all([
  document.fonts.load('700 40px "Bricolage Grotesque"', 'ășț'),
  document.fonts.load('500 30px "Public Sans"', 'ășț'),
])
  .then(() => document.fonts.ready)
  .then(() => {
    buildIssuePhoto();
    window.seek(0);
  });
