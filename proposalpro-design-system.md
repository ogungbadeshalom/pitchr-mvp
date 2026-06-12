# ProposalPro — Landing Page Design System

## Design Brief

**Subject**: ProposalPro is a proposal-writing tool. Its entire value proposition is built around one mechanic: Upwork and Fiverr only show a client the first ~250 characters of a proposal before they have to click "Read more." Everything that happens after that click is a gamble most freelancers lose, because they spend it on things like "I am a passionate developer" instead of the thing that gets the click in the first place.

**The single job of this page**: convince a skeptical Nigerian freelancer that this tool understands that mechanic better than they do, and get them to spend ₦500 to test it.

**Why this matters for the design**: most AI-tool landing pages look identical — soft gradient hero, three feature cards with icons, pricing table, testimonial carousel. A freelancer who has seen forty "AI proposal generator" ads already has pattern-blindness for that layout. The design has to look like it was made by someone who has actually read a hundred Upwork proposals, not by someone who read a hundred SaaS landing pages.

---

## The signature element: The Cut Line

Everything on this page is built around one visual device — **a perforated divider with a small tab label**, representing the exact point where a client's attention runs out.

```
Hi Sarah, I read through your brief for the inventory
dashboard and noticed you're tracking stock across
three warehouses with a single spreadsheet right now.
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ [ 250 / 250 ]  ↓ read more
That's the part most people miss, the dashboard isn't
the hard problem, the data reconciliation is...
```

This isn't decorative. It is the literal mechanic the product is built to optimize for. The cut line appears:

- **In the hero**, live, as the demo proposal types itself and the counter ticks toward 250
- **As section dividers**, each with a different label, replacing the generic `<hr>`
- **In pricing**, dividing the "session copy" from the "monthly copy" like a carbon-copy form
- **In the FAQ**, as the rule between entries, labeled with a running count

One element, reused with intent, instead of five different decorative motifs competing for attention.

---

## Token system

### Color

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#1C1F26` | Primary text, footer background, dark UI |
| `--paper` | `#EDEAE2` | Page background — warm grey, not cream |
| `--card` | `#FFFFFF` | Card surfaces, the "index card" layer |
| `--stamp` | `#C2491F` | The one accent — CTAs, cut-line tabs, badges |
| `--verified` | `#2F6F50` | Success / "sent" states only |
| `--muted` | `#8C8675` | Secondary text, rules, perforation dashes |

Five colors total. `--stamp` is used sparingly enough that when it appears, it reads as a deliberate mark — like a rubber stamp hitting paper — not as a brand wash.

**Why not the obvious choices**: a cream background with a terracotta accent and serif display is the single most common "distinctive" AI-generated look right now. `--paper` is deliberately greyer and cooler than cream. `--stamp` is more saturated and red-leaning than terracotta — closer to sealing wax or stamp-pad ink than to a Mediterranean clay tone.

### Typography

| Role | Typeface | Source | Notes |
|---|---|---|---|
| Display | **Newsreader** | Google Fonts | Headlines, pull-quotes. Use italic for emphasis within headlines, not bold. |
| Body | **IBM Plex Sans** | Google Fonts | All paragraph text, nav, buttons |
| Utility / data | **IBM Plex Mono** | Google Fonts | Every number that matters: character counts, word limits, prices, timers, badges |

**Why mono is functional, not decorative**: this product's entire pitch is about hitting precise numeric targets — 250 characters, 150/250/350 words, a 30-minute session clock. Every place a number appears on this page, it appears in mono, so the typography itself reinforces "this tool is precise about numbers" before a single word of copy says so.

```css
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,72,400;0,72,500;1,72,400;1,72,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  --ink: #1C1F26;
  --paper: #EDEAE2;
  --card: #FFFFFF;
  --stamp: #C2491F;
  --verified: #2F6F50;
  --muted: #8C8675;

  --font-display: 'Newsreader', serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
```

### Spacing & shape

- Container: `max-width: 1080px`, side padding `24px` (mobile), `48px` (desktop)
- Card radius: `2px` — index cards have square-ish corners, not rounded SaaS-card corners. This is part of the "paper, not app" feel.
- Section rhythm: `96px` vertical padding on desktop, `56px` on mobile
- The cut line's dash: `border-top: 1.5px dashed var(--muted)`, dash gaps wide enough to read as perforation (`background-image` with `repeating-linear-gradient` works better than `dashed` for control — see component spec below)

---

## Component specs

### 1. The Cut Line (signature component)

```css
.cut-line {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 4rem 0;
}
.cut-line::before,
.cut-line::after {
  content: '';
  flex: 1;
  height: 1px;
  background-image: repeating-linear-gradient(
    to right,
    var(--muted) 0 6px,
    transparent 6px 12px
  );
}
.cut-line__tab {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--stamp);
  border: 1px solid var(--stamp);
  padding: 4px 10px;
  white-space: nowrap;
}
```

Used as: `<div class="cut-line"><span class="cut-line__tab">— pricing —</span></div>`

### 2. Live proposal card (hero)

A white index-card (`--card` bg, `2px` radius, `1px solid var(--muted)` border at 30% opacity) containing:
- A mono counter, top-right: `247 / 250`
- The proposal text in body font, typing in via JS
- The cut line appears INSIDE the card once the counter hits 250
- Below the cut line, greyed-out continuation text (the part the client doesn't see yet)
- After a pause, the tab flips from `↓ read more` to `sent ✓` in `--verified`

This is the hero's entire job: in five seconds, a visitor understands the mechanic without reading a word of explanation.

### 3. Anatomy cards (the four-part structure)

Four cards laid out in a row (stacks on mobile), each styled like a library index card with a small mono tab in the top-left corner — not numbered 1-4, but labeled with what they are, because order here is structural, not sequential:

| Tab | Title | Allotment |
|---|---|---|
| `HOOK` | The first thing they read | `2-3 sentences` |
| `FIT` | Why you, specifically | `3-4 sentences` |
| `APPROACH` | What you'll actually do | `2-3 sentences` |
| `CLOSE` | What happens next | `1-2 sentences, no questions` |

```css
.anatomy-card {
  background: var(--card);
  border: 1px solid color-mix(in srgb, var(--muted) 35%, transparent);
  border-radius: 2px;
  padding: 1.5rem;
  position: relative;
}
.anatomy-card__tab {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--stamp);
  margin-bottom: 0.75rem;
  display: block;
}
.anatomy-card__allotment {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  margin-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--muted) 25%, transparent);
  padding-top: 0.5rem;
}
```

### 4. Stamps (how it works — genuinely sequential, so numbered)

Three circular marks, slightly rotated (±2deg, alternating), like a rubber stamp landing imperfectly:

```css
.stamp {
  width: 56px; height: 56px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono);
  font-size: 18px;
  transform: rotate(-2deg);
}
.stamp:nth-child(2) { transform: rotate(1.5deg); }
.stamp:nth-child(3) { transform: rotate(-1deg); }
```

### 5. Pricing — the duplicate form

Two columns side by side (stack on mobile), styled like the white and yellow copies of a carbon-copy form:

- **Session copy**: `--card` white background, labeled `COPY 1 — SESSION`
- **Monthly copy**: `--paper` background at slightly darker tint, labeled `COPY 2 — MONTHLY`

A vertical cut line runs between them on desktop (horizontal on mobile), reinforcing "tear here."

### 6. Filed cards (testimonials)

Each testimonial is a card with a small tab cut into its top edge, like a manila folder tab, containing the person's initials in mono. Cards overlap slightly (`margin-left: -12px` on all but the first) like a fanned stack of files, un-fanning on hover.

---

## Page structure

```
┌──────────────────────────────────────────────────┐
│ NAV   ProposalPro          how it works  pricing  │
│                                    [try it — ₦500] │
├──────────────────────────────────────────────────┤
│ HERO                                              │
│  Your proposal has 250 characters                 │
│  to earn a click.                  ┌────────────┐ │
│                                     │ [live demo │ │
│  Upwork and Fiverr only show...    │  card with │ │
│                                     │  cut line] │ │
│  [write your first proposal ₦500]  └────────────┘ │
│  see how the cut works ↓                          │
├──────────────────────────────────────────────────┤
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ [ — THE CUT — ] ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ THE CUT (explainer)                               │
│  Everything after character 250 is a gamble.      │
│  [ruler graphic, 0 to 250, with marker]           │
├──────────────────────────────────────────────────┤
│ ┄┄┄┄┄┄┄┄┄┄┄ [ — ANATOMY OF A PROPOSAL — ] ┄┄┄┄┄┄┄ │
│ ANATOMY (4 cards: HOOK / FIT / APPROACH / CLOSE)  │
├──────────────────────────────────────────────────┤
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ [ — HOW IT WORKS — ] ┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ HOW IT WORKS (3 stamps)                           │
│  ① paste the listing                              │
│  ② ProposalPro builds hook/fit/approach/close     │
│  ③ copy, send, or re-spin                         │
├──────────────────────────────────────────────────┤
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ [ — PRICING — ] ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ PRICING (duplicate form: session | monthly)       │
├──────────────────────────────────────────────────┤
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ [ — PROOF — ] ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ PROOF (filed testimonial cards)                   │
├──────────────────────────────────────────────────┤
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ [ — F.A.Q — ] ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ FAQ (numbered log entries)                        │
├──────────────────────────────────────────────────┤
│ FINAL CTA                                         │
│  Write the next 250 characters.                   │
│  [write your first proposal — ₦500]               │
├──────────────────────────────────────────────────┤
│ FOOTER (ink bg, mono links)                       │
└──────────────────────────────────────────────────┘
```

---

## Full copy

### Nav
- Logo: `ProposalPro` (Plex Sans, 600)
- Links: `how it works` · `pricing` · `faq`
- CTA: `try it — ₦500`

### Hero

**Eyebrow** (mono, `--stamp`): `built for upwork & fiverr`

**Headline** (Newsreader, large):
> Your proposal has 250 characters to earn a click.

**Subhead**:
> Upwork and Fiverr show clients a short preview before they hit "read more." Most proposals waste it on "I am a passionate developer." ProposalPro writes the hook that earns the click, the proof that backs it up, and a close that tells them what happens next. No questions. No fluff.

**CTA primary**: `Write your first proposal — ₦500`
**CTA secondary**: `see how the cut works ↓`

**Live demo card** (typing animation):
```
Hi Sarah, I read through your brief for the inventory
dashboard and noticed you're tracking stock across
three warehouses with a single spreadsheet right now.
```
Counter: `0/250 → 250/250`, then cut line appears, label `↓ read more` → after 2s → `sent ✓`

### Section: The Cut

**Cut line label**: `— the cut —`

**Headline**:
> Everything after character 250 is a gamble.

**Body**:
> Before a client clicks "read more," they're reading a preview, not a proposal. If those characters don't prove you read the brief, the rest of your proposal never gets opened. ProposalPro writes every proposal hook-first: a specific, true sentence about their job, built to fit inside the cut.

**Ruler graphic**: a horizontal scale from `0` to `350`, with a marked band at `0-250` labeled `what they see` and `250-350` labeled `what they click for`, in mono.

### Section: Anatomy of a proposal

**Cut line label**: `— anatomy of a proposal —`

**Headline**:
> Four parts. No filler.

**Body** (short, above the cards):
> Every proposal ProposalPro writes follows the same structure, built from what actually gets read on Upwork and Fiverr.

**Card 1 — HOOK** (`2-3 sentences`)
> The first thing they read. Built from a specific detail in their job post, not a rewording of the title.

**Card 2 — FIT** (`3-4 sentences`)
> Why you, specifically. Pulled from your real profile and work history, not invented years of experience.

**Card 3 — APPROACH** (`2-3 sentences`)
> What you'll actually do first. Mentions their stack or tools when the listing names them.

**Card 4 — CLOSE** (`1-2 sentences, no questions`)
> A confident next step. Never a question. Clients hire people who sound like they've already started.

### Section: How it works

**Cut line label**: `— how it works —`

**Headline**:
> Paste. Generate. Send.

**Stamp 1**
> Paste the job listing from Upwork, Fiverr, or anywhere else. Tell us the platform.

**Stamp 2**
> ProposalPro writes the hook, the fit, the approach, and the close, using your real profile.

**Stamp 3**
> Copy it, edit if you want, and send. Don't like the angle? Re-spin for a different one.

### Section: Pricing

**Cut line label**: `— pricing —`

**Headline**:
> Two copies. Tear along the line.

**Copy 1 — Session** (white card)
- Eyebrow: `copy 1 — session, no account`
- **Flash** — `₦500` / `30 min` / `5 proposals`
- **Power** — `₦1,200` / `4 hours` / `20 proposals` — marked `best per hour`

**Copy 2 — Monthly** (tinted card)
- Eyebrow: `copy 2 — monthly, account required`
- **Starter** — `₦2,000/mo` / `50 proposals`
- **Pro** — `₦3,500/mo` / `unlimited` — marked `most freelancers pick this`
- **Ultra** — `₦5,000/mo` / `unlimited + 3 seats`

**Footnote** (mono, small): `flutterwave · card · ussd · bank transfer · naira only`

### Section: Proof

**Cut line label**: `— proof —`

**Headline**:
> Filed under: results.

**Card 1** — tab `A.O.`
> "My reply rate went from one in twenty to one in eight. Same jobs, same rate, different hook."
> — Adaeze O., backend developer, Lagos

**Card 2** — tab `C.U.`
> "The close used to be my problem. I always ended with a question and clients went quiet. Now I tell them what's next and they reply."
> — Chidi U., product designer, Abuja

**Card 3** — tab `F.N.`
> "I tried writing my own '250 characters' after seeing how this tool does it. Got an interview the same day."
> — Fatima N., content writer, Kano

### Section: FAQ

**Cut line label**: `— f.a.q —`

Format each entry as a log line: `001`, `002`, etc. in mono, then question in Plex Sans medium, answer below in regular.

**001 — Will clients know this is AI-written?**
> ProposalPro writes from your real profile, in your voice, following the structure of proposals that actually get replies. It won't sound like a template because it isn't building from one. Always read it before sending. If a line doesn't sound like you, change it. It's your proposal.

**002 — What if my proposal needs more than 250 characters to make the hook work?**
> The hook itself stays under 250. Everything else, the fit, the approach, the close, comes after. The cut line just marks where the preview ends, not where your proposal ends.

**003 — How is this different from typing into ChatGPT?**
> ChatGPT doesn't know what Upwork's preview cuts off at, doesn't know the difference between a Fiverr gig pitch and an Upwork cover letter, and doesn't know your actual work history unless you paste it in every time. ProposalPro starts from your profile and the platform's rules, every time.

**004 — Can I cancel a monthly plan?**
> Yes, anytime, from your dashboard. You keep access until the end of the period you already paid for.

**005 — What payment methods work?**
> Flutterwave, card, bank transfer, or USSD. Everything in naira. No dollar card required.

### Final CTA

**Headline**:
> Write the next 250 characters.

**CTA**: `Write your first proposal — ₦500`
**Sub-line**: `no account needed for a session`

### Footer

```
ProposalPro                    how it works   pricing   faq
                                privacy   terms   support
© 2026 ProposalPro                              built in lagos
```

---

## Motion

One orchestrated moment, in the hero, on page load:

1. Proposal text types in at ~30ms/character (use `prefers-reduced-motion` to skip straight to end state)
2. Mono counter ticks in sync with the typing
3. At character 250, the cut line draws in from both edges toward the tab (200ms)
4. Tab reads `↓ read more` for 1.5s
5. Tab cross-fades to `sent ✓` in `--verified`, counter resets to `0/250` and the cycle repeats after a 3s pause

Everywhere else: cards fade up 8px on scroll into view, once, no repeat. Buttons get a 1px upward shift on hover, no shadow growth. That's the entire motion budget — restraint is part of the "paper, not app" feel.

---

## Implementation notes

- All five colors are CSS custom properties — changing `--stamp` alone should be enough to re-skin for a different market without breaking the system
- The cut line is one component, reused six times; do not create variant dividers
- Mono is reserved for numbers, labels, and tabs — never use it for body paragraphs, or it stops signaling "precision" and starts just looking like a code font
- Card corners stay near-square (`2px`); if anything on the page has a large border-radius, it has drifted from the system
