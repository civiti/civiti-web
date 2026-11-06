# Explainer video

The 76-second film on `/ghid/asistent-ai`. It is code, not a screen recording: a web page whose
whole state is a function of time, captured frame by frame.

```bash
cd media/explainer-video
npm install
npm run render
```

That writes everything the site needs:

| Output | Used for |
|---|---|
| `public/media/asistent-ai/explainer.mp4` | H.264, 1080p30, no audio, faststart |
| `public/media/asistent-ai/explainer-poster.jpg` | The player's poster, taken at `POSTER_AT` |
| `public/media/asistent-ai/explainer.ro.vtt` | Romanian captions |
| `src/app/components/guides/assistant-guide/explainer-transcript.generated.ts` | The transcript on the page |

The render takes about five minutes. Two shortcuts while editing:

```bash
npm run render:fast          # 540p at 15 fps in out/draft.mp4, to check timing
npm run still -- 12,39.5     # single frames in out/still-*.png, to check layout
```

## How it is put together

| File | What it holds |
|---|---|
| `src/timeline.mjs` | Scene timing and every caption. The WebVTT track and the page transcript are generated from it, so the three cannot drift apart |
| `src/stage.html` | The scenes |
| `src/stage.css` | Layout, with tokens copied from `src/styles.scss` |
| `src/stage.js` | `window.seek(t)`, which computes every moving value from the time. Nothing animates on its own, so a render is reproducible |
| `render.mjs` | Seeks, screenshots and pipes frames into ffmpeg |

## Rules

- This folder has its own `package.json` on purpose. The app neither installs nor builds it, and
  `playwright` and `ffmpeg-static` stay out of the site's dependencies.
- Fonts come from `public/fonts`, the same files the site self-hosts.
- Keep everything that matters above y=860. The bottom of the frame belongs to the captions.
- Every person, address, street and registration number in the film is invented. Keep it that way.
- No audio. If a soundtrack is ever added, its licence has to be clear.
- The MCP server address never appears in a frame, so moving it to a custom domain needs no re-render.
