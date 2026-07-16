# AI petition-body generation — cross-repo contract

> **Status:** implemented. The Angular side lives in this repo (`civiti-web`) on branch
> `feat/ai-petition-body`; the backend endpoint, the shared generation service, and the
> `generate_petition_body` MCP tool live in `civiti-server` on a branch of the same name.
> This document records the contract and the exact prompts/scaffold both sides share.
> The Angular modal degrades gracefully to a deterministic template if the endpoint is
> unavailable, so there is no hard ordering dependency between the two deploys.

## Why

Today the petition email body is a deterministic mail-merge assembled client-side
(`email-modal.component.ts::generateEmailTemplate`). The citizen's `description`,
`communityImpact`, and `desiredOutcome` are dropped in verbatim — no synthesis, no
argument framing — which reads bland. This endpoint replaces **only the argument
core** with an AI-composed, concise, coherent version. The legally load-bearing
scaffold (identity block, O.G. 27/2002 reply clause, `[BRACKETED]` PII placeholders,
sign-off) stays deterministic and is concatenated **in code**, so the model can never
drop a required element.

Returning the **full assembled body** from one endpoint means the web modal and the
MCP both get a single, compliant, improved artifact — which is what fixes the MCP's
"sticks to the initial body" behavior (the MCP just calls this endpoint by issue id).

## Endpoint

```
POST /api/issues/{id}/petition-body        (auth required — same auth as enhance-text)
Request body (JSON):
  { "regenerate": false }                  // optional; true → produce a fresh variation
Response 200 (JSON):
  { "body": "<full, ready-to-copy Romanian petition>" }
```

- **Auth:** identical to `POST /api/issues/enhance-text` (JWT; the web AuthInterceptor
  attaches it automatically). Anonymous callers must get 401 — the frontend handles
  that by falling back to its local template.
- **Load the issue by `{id}` server-side.** Do not trust client-submitted text — read
  `title`, `category`, `address`/`district`, `description`, `communityImpact`,
  `desiredOutcome`, `photos.length`, `createdAt` from the stored issue.
- **Idempotent-ish:** with `regenerate` omitted/false you may cache the result per
  issue id (cheap). `regenerate: true` must bypass any cache and return a new variation.
- **Status codes:** 200 on success; 401 unauth; 404 unknown issue; 5xx on LLM failure
  (the frontend treats any non-200 as "fall back to the template", so a plain 502 is fine).

## What the AI writes vs. what code writes

The LLM composes **only the core** (problem → impact → concrete demand). The backend
then concatenates the deterministic scaffold around it. Assembled body:

```
Către: [NUMELE AUTORITĂȚII]

Subsemnatul/a [NUMELE TĂU COMPLET], CNP [CNP-UL TĂU], cu domiciliul în [ADRESA TA DE DOMICILIU] (email [ADRESA TA DE EMAIL], telefon [NUMĂRUL TĂU DE TELEFON]), vă adresez următoarea petiție:

Problemă: {title}
Locație: {locationString}
Data sesizării: {createdDate}

{AI_CORE}

{photosLine}Documentație completă: https://civiti.ro/issues/{id}

Conform O.G. 27/2002, vă rog să îmi comunicați numărul de înregistrare al petiției și răspunsul în termenul legal de 30 de zile, prin email la [ADRESA TA DE EMAIL] sau la adresa de domiciliu.

Cu stimă,
[NUMELE TĂU COMPLET]
{currentDate}
```

Deterministic pieces (compute in code, exactly as the frontend does today):
- `locationString` = `address` (+ `", " + district` if present), else `"Locație nespecificată"`.
- `createdDate` = `createdAt` as `DD.MM.YYYY`; `currentDate` = today as `DD.MM.YYYY`.
- `photosLine` = `"La prezenta petiție anexez {N} {fotografie|fotografii} care documentează problema semnalată.\n"` when `photos.length > 0`, else `""` (singular when N == 1).

> This scaffold is a **tightened** version of the current template (identity line
> condensed, the two O.G. 27/2002 paragraphs merged into one) to honour the
> "trim the officialese" goal — while keeping every legally-required element:
> the citizen's identifying data placeholders and the 30-day reply-deadline clause.

The subject line stays client-side and is unchanged: `Petiție - [NUMELE TĂU COMPLET] - {title}`.

## LLM call

Mirror however `enhance-text` already calls Claude (same SDK/HTTP path, same
`CLAUDE_API_KEY`). Only the prompt and post-processing differ.

**System prompt (Romanian):**

```
Ești asistentul de redactare al platformei civice Civiti. Sarcina ta: compui DOAR corpul argumentativ al unei petiții adresate unei autorități publice locale din România.

Reguli:
- Scrii în limba română, într-un registru formal, dar concis și la obiect.
- Compui 1–3 paragrafe scurte, legate logic: (1) problema, concret; (2) impactul asupra comunității; (3) ce anume soliciți autorității, clar și ferm.
- NU incluzi: formula de adresare (ex. „Către”), datele de identificare ale petentului, temeiuri legale (ex. O.G. 27/2002), formule de încheiere sau semnătură — acestea se adaugă automat.
- NU inventezi fapte, cifre, nume, date sau locații care nu apar în informațiile primite.
- NU incluzi linkuri, titluri de secțiune, marcaje Markdown sau text în paranteze pătrate.
- Eviți limbajul birocratic redundant, repetițiile și clișeele. Textul trebuie să curgă natural de la problemă la solicitare.

Răspunzi cu textul corpului, în text simplu, fără alte comentarii.
```

**User prompt (per request)** — omit any line whose field is empty:

```
Compune corpul petiției pe baza următoarelor informații:

Titlu: {title}
Categorie: {category}
Locație: {location}
Descrierea problemei: {description}
Impact asupra comunității: {communityImpact}
Rezultatul dorit: {desiredOutcome}
```

When `regenerate == true`, append one line:
`Oferă o formulare distinctă față de variantele uzuale, păstrând aceleași fapte.`

**Suggested parameters:**
- **Model:** reuse whatever `enhance-text` already uses (keeps one model/credential
  path). If choosing fresh, `claude-opus-4-8` is the highest-quality default; for this
  short Romanian composition, `claude-haiku-4-5` (cheapest/fastest) or `claude-sonnet-5`
  are reasonable lower-cost options — a cost call that's yours to make.
- **`max_tokens`:** ~1024 (the core is short; non-streaming is fine, well under any timeout).
- **`effort`:** `low` on Opus/Sonnet (short, scoped task → low latency/cost). **Note:**
  `claude-haiku-4-5` does **not** support `effort` — omit it there.
- **Thinking:** omit (not needed for a short composition; keeps latency down).
- **Variety on regenerate:** on `claude-opus-4-8` / `claude-sonnet-5`, `temperature` is
  rejected (400) — drive variety via the regenerate prompt line above. Only on
  `claude-haiku-4-5` may you instead bump `temperature` (~0.8) for variation.

## Post-processing guardrails (before returning)

1. **Trim** the model output; collapse leading/trailing blank lines.
2. **Reject leakage:** if the core contains `http`/`https`, `[`…`]` bracketed
   placeholders, or Markdown headings, strip those artifacts (or re-request once). The
   scaffold — not the model — owns links, placeholders, and legal text.
3. **Empty guard:** if the core is empty/whitespace after trimming, return 502 (the
   frontend then falls back to its deterministic template) rather than an empty body.
4. Concatenate scaffold + core deterministically and return `{ "body": ... }`.

Because the scaffold is code, the required identity placeholders and the O.G. 27/2002
clause are always present regardless of model output — compliance is guaranteed by
construction, not by trusting the model.

## Frontend contract (already implemented)

- `ApiService.generatePetitionBody(issueId, { regenerate })` → `POST /api/issues/{id}/petition-body`.
- The modal shows the deterministic template instantly, then (for authenticated users)
  swaps in `response.body`, editable in a textarea, with a "Regenerează" button that
  re-calls with `regenerate: true`. A ~15s client timeout and any error keep the
  template — the user is never left without a valid body.
