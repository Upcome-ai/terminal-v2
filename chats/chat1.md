# Upcome website design

_Started 2026-07-28 11:33 UTC_

---

## User

Project name: Upcome
Description: Upcome is a free real-time news and events terminal designed to empower traders who need to know what is happening the moment it happens. Users can choose the topics, companies, industries, and economic events that matter to them, while Upcome continuously monitors trusted sources and delivers relevant updates as soon as they are published. The platform brings together updates from public government sources, leading global and local news agencies, as well as citizen journalism. **Know what moves the world before it moves the market.**

We have built the mvp and it's hosted at mvp.upcome.ai, we need to make a design for the main website upcome.ai.

It should be simple, straight forward. Black and orange/dark orange theme. I have also provided you with our logo

## Assistant

_[tool: read_file]_

The logo file couldn't be decoded as an image directly. Let me render it to see it.

_[tool: write_file]_

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: show_html]_

_[tool: save_screenshot]_

The logo is a "U" monogram — orange with a dark charcoal accent swoosh. Now a few questions before I design.

_[tool: delete_file]_

_[tool: questions_v2]_

## User

Questions answered:
- scope: Just a landing page (single scroll)
- audience: Retail / individual traders, Anyone following markets
- primary_cta: Try the MVP (mvp.upcome.ai)
- features: Real-time alerts the moment news breaks, Personalized topics / companies / industries, Trusted source coverage (gov, agencies, citizen journalism), Speed vs. the market
- pricing: Free now, paid tiers later
- proof: None yet — keep it clean
- tone: Fast & urgent (trader-terminal energy)
- visual_feel: Bloomberg terminal / data-dense
- variations: Yes — a few landing-page directions
- screenshot: Yes — I'll provide a screenshot

## Assistant

Logo is a "U" monogram in orange with a charcoal accent. Building three landing-page directions in the black + orange terminal aesthetic, side by side on a canvas.

_[tool: update_todos]_

Let me verify the logo crop box before embedding it three times.

_[tool: write_file]_

_[tool: show_html]_

_[tool: save_screenshot]_

The nested `<image href>` to an SVG doesn't decode. I'll inline the actual path data with a cropped viewBox instead.

_[tool: read_file]_

_[tool: run_script]_

_[tool: write_file]_

_[tool: show_html]_

_[tool: save_screenshot]_

Logo mark crops cleanly. Cleaning up and building the landing page directions.

_[tool: delete_file]_

_[tool: update_todos]_

Now building all three directions in one canvas DC.

_[tool: dc_write]_

The marker divs are empty — I need to fill them. Injecting the feed, feature, sources, timeline, and footer content now.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

All content filled. Marking sections done and verifying.

_[tool: update_todos]_

_[tool: ready_for_verification]_

Three landing-page directions for **upcome.ai**, side by side on a pan/zoom canvas — all black + dark-orange, your "U" logo cropped from `trace.svg`, with a live "know what moves the world before it moves the market" CTA and the MVP link wired throughout:

- **1a — Live Terminal:** Bloomberg-dense split hero with a scrolling real-time feed + ticker. The most data-forward.
- **1b — Editorial Breaking:** big "BREAKING" headline energy with a just-published timeline strip.
- **1c — Product-first:** clean, spacious, centered around a large product-shot placeholder (`mvp.upcome.ai` browser frame).

Placeholders in there for you to fill: the product screenshot (1c) and the source logos — drop the MVP screenshot whenever ready.

Tell me which direction you want to run with (1a / 1b / 1c) and I'll build it out into the full single-scroll page. I can also mix elements across directions.

## User

Create a design for the news terminal. It should be great for the user experience and rapid news delivery. Visually it should be easy to the eye so the user can perceive the news quickly. it should also include topic subscription and unsubscription

## Assistant

New deliverable — the actual news terminal product UI. Building it as a functional prototype: live feed, topic subscribe/unsubscribe in the sidebar, and a reading panel, all in the black + orange terminal language.

_[tool: update_todos]_

_[tool: dc_write]_

_[tool: update_todos]_

_[tool: ready_for_verification]_

Built the **Upcome Terminal** as a working prototype (`Upcome Terminal.dc.html`):

- **Live feed** (center) — scannable cards: time, source-type tag (GOV / WIRE / LOCAL / CITIZEN / FILING), topic, headline, one-line summary. Breaking items get an orange accent + badge. Click any card to open it in the reading panel.
- **Topic subscription** (left) — *My Topics* with live counts; hover the `×` to unsubscribe. *Discover* lists unsubscribed topics with a `＋ Subscribe` button. Unsubscribing instantly removes that topic's stories from the feed. Click a topic to filter; filter chips above the feed do the same.
- **Reading panel** (right) — full headline, "Why it matters", corroborating sources, and *Open source ↗* to the MVP.
- **Top bar** — global search (filters live) and a ticking clock + LIVE indicator.

Calm dark palette, orange used only for signal (breaking, live, actions) so the eye lands on news fast. Three code-level tweaks are wired: **density** (comfortable/compact), **show summaries**, and **show detail panel**.

Source logos and the "why it matters" are placeholders/generated sample copy — swap in real feeds when ready. Want me to also design the mobile/compact layout or an alerts/notification state next?

