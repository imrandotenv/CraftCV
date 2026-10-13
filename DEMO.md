# CVForge — 3-Minute Demo Script for Judges

> **Goal:** Showcase front-end engineering excellence, design polish, client-side resilience, and the ATS intelligence engine in exactly 3 minutes.

---

## ⏱️ Minute 1: The Landing Experience & First Impressions (0:00 - 1:00)

### What to Click:
1. Open `index.html` on the landing page.
2. Hover over the navigation links (**Home**, **Templates**, **Build**) in the fixed top navigation bar.
3. Click the **"✨ Try with Sample Data"** CTA button in the hero section.

### What to Say:
> *"Resumes today are screened by automated ATS algorithms before a human ever sees them. Most online resume builders require logins, track user data, or break when printed.*
>
> *We built **CVForge** — a privacy-first, zero-dependency, 100% client-side resume builder and ATS auditor.*
>
> *Notice our custom dark luxury interface. Check out the fixed navigation bar: when I hover over these links, notice the smooth mechanical character roll. That's built using pure CSS custom properties with ascending transition delays — zero JavaScript overhead.*
>
> *Let's click 'Try with Sample Data' to jump directly into the builder."*

---

## ⏱️ Minute 2: ATS Intelligence, Job Matcher & Verb Auditor (1:00 - 2:00)

### What to Click:
1. Scroll down to the **"🎯 ATS Score & Job Matcher"** card in Step 1. Point out the animated circular score ring displaying **90/100**.
2. Briefly remove a skill or phone number to show the score drop and the dynamic recommendation appear in the tips box; then add it back.
3. In the Job Description Matcher, paste a sample job description (e.g., *"Looking for a Full Stack Engineer with JavaScript, Python, Docker, Kubernetes, and AWS experience"*), and click **"⚡ Analyze Keyword Match"**.
4. Show the **Matched Keywords** (green) vs **Missing Keywords** (red) tag chips.
5. In the Weak Action Verbs panel, click one of the suggestion chips (*"Spearheaded"* or *"Architected"*) to show 1-click replacement in the bullet textareas.
6. Click the `↑` and `↓` arrows on the **Education** and **Experience** cards to demonstrate section reordering.
7. Click **"Next: Choose Theme →"**.

### What to Say:
> *"In Step 1, our real-time 100-point ATS scoring engine evaluates the candidate against eight industry criteria. As I edit the fields, the SVG score ring updates dynamically without page reloads.*
>
> *Here is the 'wow' factor: our Job Description Keyword Matcher. If an applicant has a target job posting, they can paste it right here. We extract unique keywords, filter English stopwords, and show matched versus missing keywords with an instant percentage score.*
>
> *Furthermore, our Action-Verb Auditor flags passive phrases like 'responsible for' or 'worked on' and offers 1-click power verbs like 'Spearheaded' or 'Architected' that replace text directly inside the inputs.*
>
> *We can also reorder sections with these arrow buttons and upload a cropped profile photo. Let's proceed to Step 2."*

---

## ⏱️ Minute 3: Live Scaled Previews, Custom Theming & Flawless A4 Export (2:00 - 3:00)

### What to Click:
1. In Step 2, showcase the 7 template cards. Point out that the thumbnails are **not generic static icons** — they are actual scaled-down DOM previews of the candidate's real data (`transform: scale(0.2)`).
2. Click **"Executive"**, **"Creative"**, or **"Compact"**.
3. Click the custom color picker gradient circle and choose a custom accent color (e.g., electric teal or gold) to show instant palette adaptation.
4. Click **"Generate my CV →"** to enter Step 3.
5. In Step 3, adjust the **Font Size** slider ($9\text{--}12\text{ pt}$) and toggle **"📄 Fit to one page"**.
6. Click **"💾 Download as HTML"** to demonstrate instant client-side standalone file export via `Blob`.
7. Click **"🖨️ Print / Save as PDF"** to open Chrome's print dialog, showing exact A4 alignment.

### What to Say:
> *"Step 2 reveals our live scaled thumbnail system. Using CSS transforms, each thumbnail renders the user's real data and chosen colors inside miniature A4 sheets.*
>
> *We provide 7 distinct templates: from timeless serif Classic, to full-height colored Creative, regal Executive, and our single-page Compact template.*
>
> *In Step 3, our formatting toolbar lets users adjust base font sizes from 9 to 12 pt, or activate 'Fit to one page' to guarantee clean single-page density.*
>
> *Finally, for exports: we provide print-ready A4 PDF output with `@page` zero-margin isolation, plain text copying for job portals, JSON backup, and this single-click 'Download as HTML' button, which packages the entire resume with inlined CSS into an offline file via client-side Blobs.*
>
> *No frameworks, no backend, no tracking — just pure, fast, accessible web engineering. Thank you!"*

---

## 🏆 Key Questions to Anticipate from Judges

1. **"How does the navigation text roll work without JavaScript?"**
   *Answer:* "Each link splits letters into `<span>` tags with CSS variable `--i`. On hover, both the visible text and an absolute duplicate underneath translate by `-100%` with a transition delay calculated as `calc(var(--i) * 26ms)`."

2. **"How do you ensure the resume doesn't break when printed?"**
   *Answer:* "We use `@page { size: A4 portrait; margin: 0 }`, `@media print` isolation to hide all UI, `-webkit-print-color-adjust: exact` so backgrounds print, and `break-inside: avoid` on every section and entry."

3. **"How is the ATS scoring calculated?"**
   *Answer:* "It is a deterministic pure function evaluating 8 checks: contact completeness, 25-80 word summary, 6+ skills, 2+ entries with 2+ bullets, quantified achievements with numbers/%, strong action verbs, education presence, and 250-700 total word count."
