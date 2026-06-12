# Former Pitchr Landing Page Design

The original landing page was the **default Next.js Create Next App starter page** (scaffolded boilerplate). It was never customized — only the initial scaffold from `create-next-app`.

## Structure

- **Layout:** centered grid (`grid-rows-[20px_1fr_20px]`), full viewport height, responsive padding
- **Font:** Geist Sans (body), Geist Mono (code) — Next.js defaults
- **Dark mode:** inherited from `dark:` Tailwind variants (class strategy), no custom dark variables
- **Colors:** Tailwind `foreground`/`background` CSS variables, no brand palette

## Sections

1. **Hero** — Next.js logo SVG (180×38), centered
2. **Instruction** — numbered list: "Get started by editing `src/app/page.tsx`" + "Save and see your changes instantly"
3. **CTA buttons** — "Deploy now" (Vercel link) and "Read our docs" (nextjs.org), rounded-full pills
4. **Footer** — three links: Learn, Examples, Go to nextjs.org

## What it lacked

- No Pitchr branding (name, logo, tagline)
- No proposal-generation copy or value proposition
- No pricing, testimonials, or FAQ
- No session-based or authentication flow links
- No custom typography (fonts, sizes, hierarchy)
- No design system tokens — everything was raw Tailwind utility classes
- The page was purely informational about Next.js, not about the product

## Commit history

- `186dc1b` — Initial commit from Create Next App (the sole commit touching this file)
- No subsequent commits modified `page.tsx` before the redesign
