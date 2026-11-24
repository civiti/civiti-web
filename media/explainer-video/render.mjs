#!/usr/bin/env node
// One-command render of the /ghid/asistent-ai explainer.
//
//   npm run render          full 1080p30 MP4 with sound, poster, WebVTT, page transcript
//   npm run render:fast     540p at 15 fps, with sound, to check timing quickly
//   npm run still -- 23,31  frames as out/still-<t>.png, to check a scene
//   npm run audio           the soundtrack alone, as out/soundtrack.wav
//
//   --audio <file.wav>      use another soundtrack instead of the generated one
//   --mute                  render without sound
//
// The film is a plain web page (src/stage.*) whose whole state is a function of
// time. Each frame seeks that function, takes a screenshot and pipes it into
// ffmpeg. The soundtrack is synthesized by src/soundtrack.mjs on the same clock.
// Nothing depends on wall-clock time, so a render is reproducible.

import { spawn, spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { chromium } from 'playwright';
import { renderSoundtrack, writeWav } from './src/soundtrack.mjs';
import { DURATION, FPS, HEIGHT, POSTER_AT, WIDTH, cues, toVtt } from './src/timeline.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const publicDir = join(repoRoot, 'public', 'media', 'asistent-ai');
const outDir = join(here, 'out');
const transcriptFile = join(
  repoRoot,
  'src/app/components/guides/assistant-guide/explainer-transcript.generated.ts',
);

const args = process.argv.slice(2);
const draft = args.includes('--draft');
const stillArg = args.includes('--still') ? (args[args.indexOf('--still') + 1] ?? String(POSTER_AT)) : null;
const stills = stillArg === null ? null : stillArg.split(',').map(Number);
const mute = args.includes('--mute');
const audioArg = args.includes('--audio') ? args[args.indexOf('--audio') + 1] : null;

/** Web loudness: -16 LUFS integrated, peaks below -1.5 dB. */
const TARGET_LUFS = -16;
const TARGET_PEAK_DB = -1.5;
const LOUDNESS = `I=${TARGET_LUFS}:TP=${TARGET_PEAK_DB}:LRA=11`;

mkdirSync(outDir, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
};

/**
 * Module scripts and fonts are blocked on file:// URLs, so the stage is served
 * from the repository root. That also lets it use the site's own font files.
 */
function serveRepo() {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const file = join(repoRoot, path);
    if (!file.startsWith(repoRoot) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

async function openStage() {
  const server = await serveRepo();
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  page.on('pageerror', (err) => {
    throw err;
  });
  const { port } = server.address();
  await page.goto(`http://127.0.0.1:${port}/media/explainer-video/src/stage.html`);
  await page.evaluate(() => window.stageReady);
  return {
    page,
    close: async () => {
      await browser.close();
      server.close();
    },
  };
}

async function grab(page, t, type, quality) {
  await page.evaluate((time) => window.seek(time), t);
  return page.screenshot({ type, quality, animations: 'disabled' });
}

async function renderStills(times) {
  const { page, close } = await openStage();
  for (const t of times) {
    const file = join(outDir, `still-${String(t).padStart(5, '0')}.png`);
    writeFileSync(file, await grab(page, t, 'png'));
    console.log(`still ${t}s -> ${file}`);
  }
  await close();
}

async function renderPoster() {
  const { page, close } = await openStage();
  mkdirSync(publicDir, { recursive: true });
  writeFileSync(join(publicDir, 'explainer-poster.jpg'), await grab(page, POSTER_AT, 'jpeg', 82));
  await close();
}

function ffmpegSync(argv) {
  const run = spawnSync(ffmpegPath, ['-hide_banner', '-nostats', ...argv], { encoding: 'utf8' });
  if (run.status !== 0) {
    throw new Error(`ffmpeg failed: ${run.stderr}`);
  }
  return run.stderr;
}

/**
 * The soundtrack, normalised in two passes: the first measures it, the second
 * applies one fixed gain, so the music keeps its shape instead of pumping. The
 * limiter is a safety net for a louder track swapped in with --audio; the
 * generated one never reaches it.
 */
function prepareAudio() {
  if (mute) {
    return null;
  }
  let source = audioArg && resolve(audioArg);
  if (!source) {
    source = join(outDir, 'soundtrack.wav');
    writeWav(source, renderSoundtrack());
  }
  // Measure exactly what ships: the first DURATION seconds.
  const measured = ffmpegSync(['-t', String(DURATION), '-i', source, '-af', `loudnorm=${LOUDNESS}:print_format=json`, '-f', 'null', '-']);
  const stats = JSON.parse(measured.slice(measured.lastIndexOf('{'), measured.lastIndexOf('}') + 1));
  const gain = TARGET_LUFS - Number(stats.input_i);
  const target = join(outDir, 'soundtrack.normalised.wav');
  ffmpegSync([
    '-y', '-t', String(DURATION), '-i', source,
    '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=${10 ** (TARGET_PEAK_DB / 20)}:level=disabled`,
    '-ar', '48000', '-c:a', 'pcm_s24le', target,
  ]);
  const peak = Number(stats.input_tp) + gain;
  console.log(`soundtrack ${source}: ${stats.input_i} LUFS, gain ${gain.toFixed(2)} dB, true peak about ${peak.toFixed(1)} dBTP`);
  return target;
}

async function renderFilm(audio) {
  const fps = draft ? 15 : FPS;
  const size = draft ? '960:540' : `${WIDTH}:${HEIGHT}`;
  const target = draft ? join(outDir, 'draft.mp4') : join(publicDir, 'explainer.mp4');
  mkdirSync(publicDir, { recursive: true });

  const ffmpeg = spawn(
    ffmpegPath,
    [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', 'pipe:0',
      ...(audio ? ['-i', audio, '-map', '0:v', '-map', '1:a'] : []),
      '-vf', `scale=${size}:flags=lanczos,format=yuv420p`,
      '-c:v', 'libx264', '-profile:v', 'high', '-preset', draft ? 'veryfast' : 'slow',
      '-crf', draft ? '30' : '25', '-g', String(fps * 2),
      ...(audio ? ['-c:a', 'aac', '-b:a', draft ? '96k' : '160k', '-ar', '48000'] : ['-an']),
      '-t', String(DURATION),
      '-movflags', '+faststart',
      target,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );
  const finished = new Promise((ok, fail) => {
    ffmpeg.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exited with ${code}`))));
  });

  const { page, close } = await openStage();
  const total = Math.round(DURATION * fps);
  const startedAt = Date.now();
  for (let frame = 0; frame < total; frame++) {
    const jpeg = await grab(page, frame / fps, 'jpeg', 96);
    if (!ffmpeg.stdin.write(jpeg)) {
      await new Promise((ok) => ffmpeg.stdin.once('drain', ok));
    }
    if (frame % (fps * 5) === 0) {
      const done = ((frame / total) * 100).toFixed(0);
      process.stdout.write(`frame ${frame}/${total} (${done}%) ${((Date.now() - startedAt) / 1000).toFixed(0)}s\n`);
    }
  }
  ffmpeg.stdin.end();
  await finished;
  await close();
  const megabytes = statSync(target).size / 1024 / 1024;
  console.log(`${target} (${megabytes.toFixed(2)} MB)`);
}

function writeTextTracks() {
  mkdirSync(publicDir, { recursive: true });
  mkdirSync(dirname(transcriptFile), { recursive: true });
  writeFileSync(join(publicDir, 'explainer.ro.vtt'), toVtt());
  const lines = cues().map((cue) => `  ${JSON.stringify(cue.text)},`).join('\n');
  writeFileSync(
    transcriptFile,
    `// AUTO-GENERATED by media/explainer-video/render.mjs from src/timeline.mjs. DO NOT EDIT.\n` +
      `// Mirrors the WebVTT track, so the page transcript always matches the film.\n\n` +
      `export const EXPLAINER_TRANSCRIPT: readonly string[] = [\n${lines}\n];\n`,
  );
}

if (stills) {
  await renderStills(stills);
} else {
  if (!draft) {
    writeTextTracks();
    await renderPoster();
  }
  await renderFilm(prepareAudio());
}
