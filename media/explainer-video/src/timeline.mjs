// The single source of truth for the film: scene timing, Romanian captions and
// the description read out in the page transcript. `render.mjs` turns this into
// frames, the WebVTT track and the transcript the page imports, so the three
// cannot drift apart. Times are seconds.
//
// Every name, address, street and registration number below is invented. The
// film never shows a real petitioner, and no real Civiti issue.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Frame used for the poster, chosen because it reads as a promise, not a UI. */
export const POSTER_AT = 39.5;

export const SCENES = [
  {
    id: 'street',
    start: 0,
    end: 8,
    captions: [
      { from: 0.4, to: 4, text: 'Trotuarul din fața blocului e blocat de luni de zile.' },
      { from: 4.1, to: 7.8, text: 'Cu un cărucior nu mai ai pe unde să treci.' },
    ],
  },
  {
    id: 'issue',
    start: 8,
    end: 15,
    captions: [
      { from: 8.2, to: 11.4, text: 'Ai pus problema pe Civiti. Vecinii o susțin.' },
      { from: 11.5, to: 14.8, text: 'Ca să se miște ceva, autoritățile au nevoie de o petiție formală.' },
    ],
  },
  {
    id: 'connect',
    start: 15,
    end: 25,
    captions: [
      { from: 15.2, to: 19, text: 'Conectezi Civiti la asistentul tău AI, o singură dată.' },
      { from: 19.1, to: 24.8, text: 'Te autentifici cu contul tău și aprobi ce are voie să facă. Nu există chei API.' },
    ],
  },
  {
    id: 'ask',
    start: 25,
    end: 33,
    captions: [
      { from: 25.2, to: 28.6, text: 'Apoi îi ceri, în cuvintele tale.' },
      { from: 28.7, to: 32.8, text: 'Citește problema și verifică autoritățile legate de ea.' },
    ],
  },
  {
    id: 'petitions',
    start: 33,
    end: 43,
    captions: [
      { from: 33.2, to: 37.2, text: 'Scrie câte o petiție pentru fiecare autoritate.' },
      { from: 37.3, to: 42.8, text: 'Fiecare are forma potrivită: sesizare, propunere sau cerere, conform OG 27/2002.' },
    ],
  },
  {
    id: 'email',
    start: 43,
    end: 53,
    captions: [
      { from: 43.2, to: 47.2, text: 'Verifică fiecare petiție: destinatar, date, fapte, temei legal.' },
      { from: 47.3, to: 52.8, text: 'Nimic nu pleacă fără aprobarea ta. Emailul iese din căsuța ta.' },
    ],
  },
  {
    id: 'registered',
    start: 53,
    end: 61,
    captions: [
      { from: 53.2, to: 57, text: 'Autoritatea răspunde cu un număr de înregistrare.' },
      { from: 57.1, to: 60.8, text: 'Din acel moment are 30 de zile să îți dea un răspuns.' },
    ],
  },
  {
    id: 'followup',
    start: 61,
    end: 70,
    captions: [
      { from: 61.2, to: 65, text: 'Dacă problema rămâne activă, revii după cel puțin 5 săptămâni.' },
      { from: 65.1, to: 69.8, text: 'Revenirea citează numărul primit și cere ceva nou.' },
    ],
  },
  {
    id: 'end',
    start: 70,
    end: 76,
    captions: [
      { from: 70.2, to: 75.7, text: 'Ghidul complet și prompturile sunt pe civiti.ro/ghid/asistent-ai.' },
    ],
  },
];

export const DURATION = SCENES[SCENES.length - 1].end;

/** Every cue in order, flattened. */
export function cues() {
  return SCENES.flatMap((scene) => scene.captions);
}

function vttTime(seconds) {
  const whole = Math.floor(seconds);
  const ms = Math.round((seconds - whole) * 1000);
  const pad = (n, width = 2) => String(n).padStart(width, '0');
  return `${pad(Math.floor(whole / 3600))}:${pad(Math.floor(whole / 60) % 60)}:${pad(whole % 60)}.${pad(ms, 3)}`;
}

export function toVtt() {
  const body = cues()
    .map((cue, i) => `${i + 1}\n${vttTime(cue.from)} --> ${vttTime(cue.to)}\n${cue.text}`)
    .join('\n\n');
  return `WEBVTT\n\n${body}\n`;
}
