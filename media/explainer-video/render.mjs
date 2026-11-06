#!/usr/bin/env node
// One-command render of the /ghid/asistent-ai explainer.
//
//   npm run render          full 1080p30 MP4, poster, WebVTT, page transcript
//   npm run render:fast     540p at 15 fps, to check timing quickly
//   npm run still -- 39.5,48   frames as out/still-<t>.png, to check a scene
//
// The film is a plain web page (src/stage.*) whose whole state is a function of
// time. Each frame seeks that function, takes a screenshot and pipes it into
// ffmpeg. Nothing depends on wall-clock time, so a render is reproducible.

import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { chromium } from 'playwright';
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

async function renderFilm() {
  const fps = draft ? 15 : FPS;
  const size = draft ? '960:540' : `${WIDTH}:${HEIGHT}`;
  const target = draft ? join(outDir, 'draft.mp4') : join(publicDir, 'explainer.mp4');
  mkdirSync(publicDir, { recursive: true });

  const ffmpeg = spawn(
    ffmpegPath,
    [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', 'pipe:0',
      '-vf', `scale=${size}:flags=lanczos,format=yuv420p`,
      '-c:v', 'libx264', '-profile:v', 'high', '-preset', draft ? 'veryfast' : 'slow',
      '-crf', draft ? '30' : '25', '-g', String(fps * 2),
      '-movflags', '+faststart', '-an',
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
  await renderFilm();
}
