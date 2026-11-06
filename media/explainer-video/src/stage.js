// Every visual value in the film is computed here from one number, the time.
// `window.seek(t)` is pure: seeking to the same t twice draws the same frame, in
// any order, which is what makes the render deterministic.

import { SCENES } from './timeline.mjs';

const $ = (id) => document.getElementById(id);
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const outCubic = (p) => 1 - (1 - p) ** 3;
const inOut = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);

/** Progress of `t` through [a, b], eased. */
const prog = (t, a, b, ease = outCubic) => ease(clamp((t - a) / (b - a)));
const mix = (a, b, p) => a + (b - a) * p;

/** Calm entrance: a short fade and a small rise, no overshoot. */
function appear(el, t, at, rise = 22, dur = 0.5) {
  const p = prog(t, at, at + dur);
  el.style.opacity = p;
  el.style.transform = `translateY(${mix(rise, 0, p)}px)`;
}

const FADE = 0.45;

function drawScenes(t) {
  for (const scene of SCENES) {
    const el = $(scene.id);
    const visible = t >= scene.start - 0.001 && t < scene.end + FADE;
    el.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) continue;
    const fadeIn = scene.start === 0 ? 1 : prog(t, scene.start, scene.start + FADE, (p) => p);
    const fadeOut = 1 - prog(t, scene.end, scene.end + FADE, (p) => p);
    el.style.opacity = fadeIn * fadeOut;
    el.style.zIndex = t < scene.end ? 1 : 2;
    DRAW[scene.id]?.(t - scene.start, t);
  }
}

// --- street ---------------------------------------------------------------

function street(t) {
  const title = $('street-title');
  appear(title, t, 0.2);
  // Walks in from the left and stops short of the car.
  const walk = prog(t, 0.2, 4.2, (p) => p * (2 - p));
  const x = mix(-190, 800, walk);
  const step = walk < 1 ? Math.sin(t * 7.5) * 4 : 0;
  $('street-walker').setAttribute('transform', `translate(${x} ${776 + Math.abs(step)})`);
  const stop = prog(t, 4.3, 4.75);
  const stopEl = $('street-stop');
  stopEl.setAttribute('transform', `translate(${x + 100} ${418 + (1 - stop) * 12}) scale(${mix(0.92, 1, stop)})`);
  stopEl.setAttribute('opacity', stop);
}

// --- issue ----------------------------------------------------------------

function issue(t) {
  appear($('issue-card'), t, 0.1, 18, 0.6);
  $('issue-votes').textContent = Math.round(mix(0, 42, prog(t, 1, 3, inOut)));
  const photo = $('issue-photo');
  photo.style.opacity = prog(t, 0.1, 0.6);
}

// --- connect --------------------------------------------------------------

const cable = $('connect-cable');
let cableLength = 0;

function connect(t) {
  if (!cableLength) {
    cableLength = cable.getTotalLength();
    cable.style.strokeDasharray = cableLength;
  }
  // The consent card interrupts the cable until the person says yes.
  const drawn = prog(t, 0.5, 2.6, inOut) * 0.5 + prog(t, 6.6, 7.8, inOut) * 0.5;
  cable.style.strokeDashoffset = cableLength * (1 - drawn);

  const consent = $('consent');
  const shown = prog(t, 2.5, 3.1) * (1 - prog(t, 6.3, 6.8));
  consent.style.opacity = shown;
  consent.style.transform = `translateY(${mix(18, 0, prog(t, 2.5, 3.1))}px)`;

  // The approve button takes the press: a hairline darker, no bounce.
  $('consent-approve').style.filter = t > 5.7 ? 'brightness(0.92)' : 'none';
  appear($('connected'), t, 7.8);
  $('connected').style.transform += ' translateX(-50%)';
}

// --- ask ------------------------------------------------------------------

const REQUEST = 'Trimite petiții pentru problemele mele active';

function ask(t) {
  const typed = Math.round(mix(0, REQUEST.length, clamp((t - 0.5) / 2.6)));
  const sent = t > 3.5;
  $('ask-typed').textContent = sent ? '' : REQUEST.slice(0, typed);
  $('ask-caret').style.opacity = sent || Math.floor(t * 2.4) % 2 ? 0 : 1;
  appear($('ask-bubble'), t, 3.5, 14, 0.35);
  appear($('ask-reply'), t, 4.3, 14, 0.4);
  appear($('ask-tool-1'), t, 5, 10, 0.3);
  appear($('ask-tool-2'), t, 5.7, 10, 0.3);
  appear($('ask-tool-3'), t, 6.4, 10, 0.3);
}

// --- petitions ------------------------------------------------------------

const fans = [...document.querySelectorAll('.fan')];

function petitions(t) {
  const sheets = [$('sheet-1'), $('sheet-2'), $('sheet-3')];
  const tops = [220, 440, 660];
  sheets.forEach((sheet, i) => {
    const at = 1.1 + i * 0.9;
    const p = prog(t, at, at + 0.55);
    sheet.style.top = `${tops[i]}px`;
    sheet.style.opacity = p;
    sheet.style.transform = `translateX(${mix(-46, 0, p)}px)`;
    const fan = fans[i];
    const length = fan.getTotalLength();
    fan.style.strokeDasharray = length;
    fan.style.strokeDashoffset = length * (1 - prog(t, at - 0.5, at + 0.1, inOut));
  });
}

// --- email ----------------------------------------------------------------

function email(t) {
  for (let i = 1; i <= 5; i++) {
    appear($(`check-${i}`), t, 0.5 + i * 0.55, 8, 0.28);
  }
  appear($('approve'), t, 4.3);
  $('approve-btn').style.filter = t > 6.4 ? 'brightness(0.92)' : 'none';
  appear($('sent'), t, 6.9, 10, 0.4);
}

// --- registered -----------------------------------------------------------

function registered(t) {
  appear($('ack'), t, 0.3);
  appear($('clock'), t, 3.8);
  // The clock runs: the first days of the 30 fall away, so it reads as a term.
  const left = Math.round(mix(30, 27, prog(t, 5, 7.8, (p) => p)));
  $('clock-value').textContent = left;
  $('clock-meter').style.transform = `scaleX(${left / 30})`;
}

// --- followup -------------------------------------------------------------

function followup(t) {
  for (let i = 1; i <= 6; i++) {
    const week = $(`week-${i}`);
    week.classList.toggle('week--filled', t > 0.3 + i * 0.55);
  }
  appear($('revenire'), t, 4);
}

const DRAW = { street, issue, connect, ask, petitions, email, registered, followup };

// The issue photo is the street scene itself, cropped and frozen: the same
// drawing, so the cut from scene one to the card reads as one continuous object.
function buildIssuePhoto() {
  const photo = $('issue-photo');
  photo.setAttribute('viewBox', '760 340 900 600');
  photo.style.cssText = 'position:absolute;left:230px;top:190px;width:720px;height:480px;border-radius:18px;';
  street(4.2);
  const art = $('street-art').cloneNode(true);
  for (const node of art.querySelectorAll('[id]')) node.removeAttribute('id');
  photo.replaceChildren(...art.children);
}

window.seek = (t) => {
  drawScenes(t);
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
