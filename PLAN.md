# LearnChinese — Plan

A web app that teaches Mandarin the way children acquire language: **lots of understandable listening first, meaning from context (not translation), speaking when it emerges, reading last — built on words you already know by ear.**

---

## 1. What the research says (and what it means for the app)

| How kids learn | Evidence / source idea | App implication |
|---|---|---|
| **Huge amounts of understandable input** before output | Krashen's Comprehensible Input; ALG (Automatic Language Growth) | Core loop is *listening to things you can understand*, not quizzes |
| **Silent period** — kids listen for months before talking | ALG, child L1/L2 studies | No forced speaking early. Answer by tapping/dragging, not talking |
| **Meaning comes from the here-and-now** (caregiver points at the dog, says "dog") | Caregiver speech / "parentese" | Picture scenes + animations make meaning obvious. No English glosses by default |
| **Respond with the body** ("give me the ball") | TPR (Total Physical Response) | "Show me / Touch / Put X on Y" interactions |
| **Stories with heavy repetition** | TPRS, Story Listening | Short narrated picture stories that recycle the same words many times |
| **~98% known words** makes input comfortable; new words need **10–30 encounters** | Hu & Nation (2000); extensive reading research | A learner model tracks exposures per word; content is chosen/generated to stay ~95–98% known |
| **Chinese kids talk long before reading**; Grade 1 starts with ~12 weeks of pinyin, then characters with pinyin shown above | Chinese primary curriculum research | Reading phase starts only after a solid oral vocabulary. Pinyin as a bridge, then fades |
| **Morphological awareness** (knowing 火 + 车 → 火车) is the strongest predictor of Chinese reading | Li, Anderson, McBride-Chang et al. | Teach characters as building blocks of words you already know; show word families |

**Deliberate differences from Duolingo:** no translation exercises, no grammar rules, no "write the English", no streak pressure on output. Progress = hours of understood input + words acquired.

---

## 2. Learning journey (stages)

**Stage 0 — The Picture World (weeks 1–4, ~0–150 words)**
- Explorable illustrated scenes (kitchen, park, family). Tap anything → hear it in Mandarin (multiple voices, natural speed + slow).
- "Show me" games: audio says 把苹果给妈妈 → learner drags apple to mum. Answer by action only.
- Tone exposure via listening and songs/rhymes, not tone drills.

**Stage 1 — Story Listening (~150–500 words)**
- 1–3 minute narrated picture stories; every new word visible in the image when spoken.
- Same story re-told with variations (TPRS "circling") — who/what/where questions answered by tapping pictures or yes/no.
- Learner model ensures repetition targets are hit across stories.

**Stage 2 — Emerging speech (~500+ words, opt-in, never forced)**
- Echo / shadowing: hear a line, say it, compare against the recording (waveform + pitch contour for tones).
- Simple "describe the picture" prompts. Optional pronunciation scoring later.

**Stage 3 — Reading (after Stage 1 is solid)**
- Pinyin introduced as a sound map for words already known by ear.
- Characters introduced for known words, highest-frequency first, grouped by component (radical) and word family.
- Graded reading: stories re-presented as text with pinyin-on-demand, then pinyin fades.
- Stroke writing (optional) via animated stroke order.

---

## 3. Core system design

```
Content (scenes, stories, words)  ──►  Learner model (per-word exposures/recognition)
            ▲                                       │
            │                                       ▼
   Story generator (LLM,  ◄────  Planner: "what should they hear next?"
   constrained to known vocab +     (keeps input ~95–98% known,
   N target words)                   schedules re-encounters)
```

- **Learner model:** for each word: exposures, last seen, correct "show me" responses → a simple acquisition score. Spaced repetition is *hidden inside new stories*, not flashcards.
- **Story generator:** an LLM writes short stories using only known words + 2–5 target words, then a checker verifies coverage via word segmentation. This is the key unlock — infinite graded input.
- **Audio:** neural TTS for Mandarin (multiple voices). Pre-generate and cache audio per sentence.
- **Images:** the hardest content problem — meaning must come from pictures. Start with a small hand-curated/AI-generated set per scene; reuse characters across stories.

### Suggested stack (open to change)
- **Frontend:** Next.js + React + TypeScript, Tailwind
- **Data:** start local-first (IndexedDB) → add Supabase/Postgres when accounts are needed
- **Chinese data:** CC-CEDICT (dictionary), HSK / SUBTLEX-CH frequency lists, `jieba`-style segmentation, Hanzi Writer (stroke animation), Make Me a Hanzi (character decomposition)
- **Audio:** Azure / Google neural Mandarin TTS (browser Web Speech API as free fallback)
- **AI:** Claude API for story generation + vocabulary-coverage validation

---

## 4. Build roadmap

**Milestone 1 — MVP: Picture World (prove the core loop)**
- 2–3 illustrated scenes, ~60 words, tap-to-hear
- "Show me" listening game
- Per-word exposure tracking (local)
- ✅ Success: you can go from zero to reliably picking the right object for ~50 spoken words without seeing any English.

**Milestone 2 — Stories**
- 10 hand-checked narrated picture stories using MVP vocab + new words
- Comprehension by tapping; replay at slow speed
- ✅ Success: each new word gets ≥10 encounters across stories; a learner understands a new story built from known words on first listen.

**Milestone 3 — Generated input**
- LLM story generator + coverage checker + TTS pipeline
- Planner chooses next story from learner model
- ✅ Success: generated stories pass ≥95% known-word coverage automatically.

**Milestone 4 — Speaking (shadowing + tone contour)**

**Milestone 5 — Reading (pinyin bridge → characters → graded reading)**

**Later:** accounts/sync, mobile PWA, parent/teacher mode, more scenes.

---

## 5. Decisions (2026-10-16)
1. Learner: adult (the author). Simplified characters.
2. **No paid APIs.** Consequences:
   - Audio = browser `speechSynthesis` (best free zh-CN voices are in Microsoft Edge).
   - Pictures = emoji (no image assets).
   - Stories = hand-written content checked into the repo; no runtime LLM. Milestone 3 becomes a
     *template-based* story generator (sentence frames × known vocab) instead of an LLM.
3. Stack: Vite + React + TypeScript, progress in localStorage. Code lives in `app/`.

**Status:**
- Milestone 1 built — Explore (tap-to-hear), Show me (listen & tap), Progress (66 words, 5 scenes).
- Milestone 2 built — 10 narrated picture stories (128 lines, 41 new story words), tap-to-answer questions.
  `npm --prefix app run check:stories` enforces: only known vocab in every line, every story word ≥10 encounters.
  Pinyin is generated from the vocab list (no 一/不 tone sandhi in the display; audio is correct).
- Kid-like learning upgrades:
  - ☀️ Today: guided session (warm-up → Do it → story → Give), no menus.
  - Story re-listening: "next" story alternates new vs. a finished one with not-yet-sticky words (<10 hears);
    every second listen is retold with the cast swapped (小明↔小红, 妈妈↔爸爸).
  - Joint attention: the emoji for the word being spoken lights up (real word boundaries if the voice gives them, else estimated).
  - 👋 Do it (TPR): 8 action verbs shown by animation first, then picked; 摸摸 + body-part commands.
  - 🤲 Give: 把X给Y — drag (or tap-tap) the thing to the person.
  - Voice variety: games/questions use a random zh-CN voice when the device has several.
  - 🎙️ Echo: opt-in record & compare per story line (no scoring, nothing uploaded).
  - Story order step after questions; 🎧 listening time tracked per day.
- Adult-hybrid upgrades (after Gemini/Grok review; decided to keep browser voices, no pre-rendered audio):
  - 听 logo + web app manifest (installable to home screen).
  - 👂 Ears: tone (ˉˊˇˋ) and confusable-sound (q/x, zh/j, c/z…) discrimination, random voices; first step of Today.
  - Circling: yes/no, 还是 either-or and who/what questions inside stories; optional English grammar note after.
  - Pinyin shows spoken tones (3-3, 不, 一 sandhi); Echo draws your pitch over textbook tone shapes.
  - Milestone 3 done as a template generator (5 scenarios, dialogue chunks 我想吃… / 你要喝什么？ / 给你！).
  - 📝 Read: characters unlock after their word is heard 10×; grouped by component (艹 木 口 犭 …) and
    pictographs; word families; read finished stories as text with tap-to-hear.
- Deliberately not done: illustrated scenes (emoji suffice at current vocab), self-report "I know this" buttons.
Run: `npm --prefix app run dev`, open http://localhost:5173 in Edge.

## Sources
- [ALG and other CI approaches (TPR, TPRS, Story Listening)](https://beyondlanguagelearning.com/2017/12/23/how-alg-relates-to-other-comprehensible-input-approaches-like-tpr-tprs-and-story-listening/)
- [Silent period in ALG](https://beyondlanguagelearning.com/tag/aua/page/3)
- [Mandarin Companion on the 98% threshold / Hu & Nation](https://mandarincompanion.com/?p=439)
- [Graded reading and 10–30 encounters](https://www.mandarinblueprint.com/blog/why-mandarin-blueprints-graded-reading-is-your-secret-weapon-for-fluency/)
- [Pinyin in Chinese Grade 1 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7055296)
- [Morphological awareness in learning to read Chinese](https://experts.illinois.edu/en/publications/the-role-of-morphological-awareness-in-learning-to-read-chinese/)
