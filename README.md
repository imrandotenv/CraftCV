# CraftCV — 3-Step Resume Builder & ATS Scorer

> **College Competition Submission**  
> **Mode:** `STANDARD` (Vanilla JavaScript — Zero frameworks, zero build tools, zero dependencies)  
> **License:** MIT  

---

## 🚀 Overview

**CraftCV** is a fast, responsive, and privacy-first web application designed to build, audit, and print competition-grade, ATS-optimized resumes in 3 intuitive steps:

1. **Details:** Fill personal info, upload photo, reorder sections, add education, experience, and projects with live action-verb auditing and real-time 100-point ATS score feedback.
2. **Theme:** Select from 7 handcrafted templates displayed in live scaled thumbnails with real user data, and customize the accent color via preset palettes or a 24-bit custom color picker.
3. **Download & Export:** Print directly to A4 paper / PDF with exact margin isolation, download as a standalone HTML file via `Blob`, copy plain text for job boards, or export/import JSON backups.

---

## 🌟 Key Features

### 🎨 Visual & UI Design
- **Strict Light Mode & Clean White Canvas:** Global body background set to pure `#ffffff` with high-contrast slate typography (`#0f172a`, `#334155`).
- **Abstract Pastel Gradient Glow Blobs:** Absolute-positioned background elements with faint peach, light orange, and pink radial gradients diffused with `filter: blur(100px)`.
- **Glassmorphic Floating Pill Navigation:** Translucent white background (`background: rgba(255, 255, 255, 0.7)`), heavy blur (`backdrop-filter: blur(12px)`), thin white border (`border: 1px solid rgba(255, 255, 255, 0.4)`), and fully rounded pill shape (`border-radius: 9999px`) with CSS-only staggered hover character roll.
- **Glassmorphic Floating CV Formatting Toolbar:** Sticky pill toolbar in Step 3 styled with the same glassmorphism tokens for font size adjustments and fit-to-one-page toggling.
- **Fixed Bottom Gradient Overlay:** Sticky bottom container (`bottom: 0, z-index: 50, pointer-events: none`) with `linear-gradient(to top, #ffffff, rgba(255, 255, 255, 0.8), transparent)` that smoothly fades out scrolling long input forms.
- **Full-Screen Hero & 3D Parallax Gallery:** Massive `CRAFT YOUR / CAREER` uppercase display headings with interactive 3D template cards that tilt dynamically with window mouse coordinates.
- **Smooth Transition CTA ('Generate my CV'):** Bold primary button with hover scale-up; on click, animates hero opacity to 0 and `translateY(-20px)` over 500ms, then reveals the 3-step builder with a subtle fade-in animation.
- **Responsive & Accessible:** Strict semantic HTML5 (`header`, `nav`, `main`, `section`, `fieldset`, `legend`), full keyboard navigation, and WCAG AA contrast.

### 📄 7 Handcrafted Resume Templates
1. **Classic:** Elegant serif (`Playfair Display`), centered header, double underline accents, and timeless academic hierarchy.
2. **Modern:** Two-column split (34% sidebar, 66% main) with a solid accent banner and tinted metadata sidebar.
3. **Minimal:** Clean, airy single-column layout with left accent bars on headings and high whitespace efficiency.
4. **Bold:** High-impact dark gradient header with badge-style category headings.
5. **Creative:** Full-height vibrant accent sidebar driven by `--accent`, circular photo/avatar crop, and modern split typography.
6. **Executive:** Dark navy sidebar (`#1e293b`), regal gold accents (`#d4af37`), and distinguished serif headings.
7. **Compact:** Specially engineered to fit dense, extensive resumes onto a single A4 page with 9mm margins and tight line-height.

### 🎯 ATS Optimization & Smart Tools (Pure Functions)
- **100-Point ATS Scoring Engine:** Evaluates contact completeness (15 pts), summary length 25-80 words (10 pts), skills count $\ge 6$ (15 pts), entries with bullets (20 pts), quantified achievements (15 pts), strong action verbs (10 pts), education presence (5 pts), and word sanity 250-700 words (10 pts).
- **Animated SVG Score Ring:** Color-coded circular gauge (Green $\ge 80$, Amber $50\text{--}79$, Red $<50$) with actionable advice for failed checks.
- **Job Description Keyword Matcher:** Paste target job postings to automatically extract keywords (filtering English stopwords), compare matched vs. missing keywords with tag chips, and calculate match percentage.
- **Action-Verb Auditor:** Flags passive/weak phrasing (*"responsible for"*, *"worked on"*, *"helped with"*, *"handled"*) and provides 1-click power verb replacement chips (*"Spearheaded"*, *"Architected"*, *"Delivered"*).

### 🛠️ Advanced Customization & Export
- **Photo Upload:** Client-side image upload via `FileReader` with a 2 MB size validation guard and automatic canvas downscaling to prevent `localStorage` exhaustion. Circle and rounded crop toggles.
- **Section Reordering:** Intuitive `↑` and `↓` buttons to reorder Education, Experience, and Projects cards.
- **Formatting Toolbar:** Live font-size slider ($9.0\text{--}12.0\text{ pt}$) and "📄 Fit to one page" compaction toggle.
- **Print Perfection:** Strict `@page { size: A4 portrait; margin: 0 }`, `@media print` isolation, `print-color-adjust: exact`, and `break-inside: avoid`.
- **4 Export Formats:**
  1. Print / Save as PDF
  2. Standalone HTML file with inlined CSS (`Blob` + `URL.createObjectURL`)
  3. Formatted plain text copy to clipboard
  4. JSON Export & Import for data restoration

---

## 🏃 How to Run

No build tools, bundlers, or servers are required.

### Method 1: Direct File Opening
Double-click `index.html` in your file explorer to open it directly in Chrome, Edge, Firefox, or Safari.

### Method 2: Local HTTP Server (Python)
```bash
cd D:\Downloads\ProColl\p1
python -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

---

## 💡 Tech Explained (Quick Notes for Judges)

1. **CSS Variables (`--accent`, `--sheet-font-size`, `--i`):** Dynamic runtime theming without style recalculations or re-renders.
2. **CSS-Only Staggered Character Roll:** Pure CSS staggered animation using `transition-delay: calc(var(--i) * 26ms)` and duplicate text in `overflow: hidden`.
3. **CSS `:has()` & `:focus-visible`:** State-aware parent styling and accessible focus rings for keyboard users.
4. **CSS Grid & Flexbox:** Robust 2-column sidebar and single-column responsive layouts that preserve exact millimeters.
5. **Print CSS (`@page A4`):** Isolates `#cv`, enforces zero margins, prevents awkward item splits (`break-inside: avoid`), and forces exact background colors (`print-color-adjust: exact`).
6. **`localStorage` with Safe Fallbacks:** Auto-save wrapped in `try/catch` with an in-memory fallback for sandboxed environments.
7. **`FileReader` & Canvas Downscaling:** Client-side asynchronous photo handling with canvas compression (max 400px) to prevent storage quota exceptions.
8. **Pure Function ATS Engine (`ats.js`):** Modular, deterministic scoring with zero DOM coupling, easily testable and explainable.
9. **`Blob` & `URL.createObjectURL`:** Pure client-side file generation for standalone HTML and JSON exports with zero server roundtrips.
10. **XSS Sanitization:** Comprehensive character escaping (`&`, `<`, `>`, `"`, `'`) across all rendered user text.

---

## 🌐 Browser Support

- **Google Chrome / Chromium:** 105+ (Full support)
- **Microsoft Edge:** 105+ (Full support)
- **Mozilla Firefox:** 103+ (Full support)
- **Apple Safari:** 15.4+ (Full support)

---

## ⚠️ Known Limitations

- Browser print dialogs default to saving margins from user preferences; users should select **"Margins: None"** and enable **"Background graphics"** for exact A4 alignment.
- Local browser `localStorage` is scoped to the origin; exporting JSON provides cross-device and cross-browser portability.
