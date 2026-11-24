// The single source of truth for the film: the beat grid, scene timing, Romanian
// captions and the moments the picture and the soundtrack share. `render.mjs`
// turns this into frames, the soundtrack, the WebVTT track and the transcript the
// page imports, so none of them can drift apart. Times are seconds.
//
// stage.js derives the rail and the wipes from SCENES and animates to HITS, but
// the entrances inside a scene are absolute seconds there: retiming a scene means
// moving those by hand too.
//
// Every name, address, street and registration number below is invented. The
// film never shows a real petitioner, and no real Civiti issue.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** 120 BPM: a beat is half a second and a bar of four is two, so every cut lands on a bar line. */
export const BPM = 120;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;

/** Frame used for the poster: the petitions fanning out, which reads even at thumbnail size. */
export const POSTER_AT = 23;

export const SCENES = [
  {
    id: 'street',
    start: 0,
    end: 4,
    captions: [{ from: 0.3, to: 3.8, text: 'Trotuarul din fața blocului e blocat de luni de zile.' }],
  },
  {
    id: 'issue',
    start: 4,
    end: 8,
    captions: [{ from: 4.2, to: 7.8, text: 'Ai raportat problema pe Civiti. Acum e nevoie de o petiție formală.' }],
  },
  {
    id: 'connect',
    start: 8,
    end: 14,
    captions: [{ from: 8.2, to: 13.8, text: 'Conectezi Civiti la asistentul tău AI, cu contul tău de pe civiti.ro.' }],
  },
  {
    id: 'skill',
    start: 14,
    end: 18,
    captions: [{ from: 14.2, to: 17.8, text: 'Adaugi skill-ul care îl învață să scrie petiții formale.' }],
  },
  {
    id: 'ask',
    start: 18,
    end: 20,
    // Runs on over the petitions: asking and the result read as one sentence.
    captions: [{ from: 18.2, to: 23.8, text: 'Îi ceri, iar el scrie câte o petiție pentru fiecare autoritate.' }],
  },
  {
    id: 'petitions',
    start: 20,
    end: 24,
    captions: [],
  },
  {
    id: 'send',
    start: 24,
    end: 28,
    captions: [{ from: 24.2, to: 27.8, text: 'Tu aprobi, iar petiția se trimite din contul tău de email.' }],
  },
  {
    id: 'registered',
    start: 28,
    end: 32,
    captions: [{ from: 28.2, to: 31.8, text: 'Primești un număr de înregistrare. Autoritatea are 30 de zile să răspundă.' }],
  },
  {
    id: 'end',
    start: 32,
    end: 36,
    captions: [{ from: 32.2, to: 35.7, text: 'Promptul și pașii sunt pe civiti.ro/ghid/asistent-ai.' }],
  },
];

export const DURATION = SCENES[SCENES.length - 1].end;

/**
 * Moments the picture and the soundtrack share, in absolute seconds, all on the
 * beat grid. stage.js animates to them and soundtrack.mjs puts a sound on them.
 */
export const HITS = {
  /** The walker stops short of the car; a warning bubble pops up. */
  stop: 2.5,
  /** The votes on the issue count up between these two times. */
  votesFrom: 4.5,
  votesTo: 6.5,
  /** The consent card appears, then its Approve button is pressed. */
  consent: 9.5,
  approveConnect: 11,
  /** The cable closes: Civiti and the assistant are connected. */
  connected: 12,
  /** The skill file drops into the assistant, then three chips appear. */
  skillDrop: 15,
  chips: [15.5, 16, 16.5],
  /** The request is typed, then sent. */
  typeFrom: 18.25,
  typeTo: 19.25,
  askSend: 19.5,
  /** One petition per authority. */
  sheets: [20.5, 21, 21.5],
  /** "Da, trimite" is pressed, then the email leaves. */
  approveSend: 25.5,
  sent: 26,
  /** The registration number is stamped. */
  stamp: 28.5,
  /** The end card: the music resolves here and rings out. */
  end: 32,
};

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
