/**
 * CVForge - Application Wiring & Controller
 * Manages step navigation, user interactions, auto-save, themes, photo upload, and formatting
 */

window.CVForgeApp = (() => {
  const PRESET_COLORS = ['#2563eb', '#059669', '#e11d48', '#d97706', '#7c3aed', '#0f766e'];
  
  // App state
  let currentStep = 1;
  let activeTheme = 'classic';
  let activeAccent = PRESET_COLORS[0];
  let activeFontSize = 10;
  let activeFitOnePage = false;
  let autoSaveTimeout = null;

  /**
   * Safe document query helpers
   */
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  /**
   * Navigate between wizard steps
   * @param {number} stepNumber 
   */
  function go(stepNumber) {
    if (stepNumber < 1 || stepNumber > 3) return;

    // Validate before moving past step 1
    if (stepNumber > 1 && currentStep === 1) {
      const validation = CVForgeForm.validate();
      if (!validation.isValid) {
        return;
      }
    }

    currentStep = stepNumber;

    // Toggle step containers
    $$('.step').forEach((el, index) => {
      const isActive = (index + 1) === stepNumber;
      el.classList.toggle('active', isActive);
      el.setAttribute('aria-hidden', !isActive);
    });

    // Update step dots and connectors
    [1, 2, 3].forEach(num => {
      const dot = $(`#d${num}`);
      if (dot) {
        dot.classList.toggle('on', num <= stepNumber);
        dot.setAttribute('aria-current', num === stepNumber ? 'step' : 'false');
      }
      const conn = $(`#conn${num}`);
      if (conn) {
        conn.classList.toggle('active', num < stepNumber);
      }
    });

    // If step 2, render real-data thumbnails
    if (stepNumber === 2) {
      renderThemePreviews();
    }

    // If step 3, render CV
    if (stepNumber === 3) {
      renderCV();
    }

    // Trigger smooth staggered reveals on active step items
    if (window.CVForgeRevealActiveStep) {
      window.CVForgeRevealActiveStep(stepNumber);
    }

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Focus first heading in active step for accessibility
    const activeHeading = $(`#s${stepNumber} h2, #s${stepNumber} h1`);
    if (activeHeading) {
      activeHeading.setAttribute('tabindex', '-1');
      activeHeading.focus();
    }

    saveCurrentState();
  }

  /**
   * Render real user data in scaled thumbnails in Step 2
   */
  function renderThemePreviews() {
    const data = CVForgeForm.getFormData();
    // Provide clean fallback text for empty fields so miniature previews look realistic
    const previewData = {
      name: data.name || 'Aarav Kumar',
      title: data.title || 'Software Engineering Student',
      email: data.email || 'aarav@email.com',
      phone: data.phone || '+91 98765 43210',
      loc: data.loc || 'Darbhanga, Bihar',
      link: data.link || 'github.com/aarav',
      sum: data.sum || 'Motivated engineering student who enjoys building clean, responsive interfaces and solving problems with code.',
      skills: (data.skills && data.skills.length) ? data.skills : ['HTML5', 'CSS3', 'JavaScript', 'Python', 'Git'],
      langs: (data.langs && data.langs.length) ? data.langs : ['English', 'Hindi'],
      certs: data.certs || [],
      edu: (data.edu && data.edu.length) ? data.edu : [
        { a: 'B.Tech in Computer Science', b: 'Government Engineering College', c: '2023 - 2027', e: 'CGPA 8.4' }
      ],
      exp: (data.exp && data.exp.length) ? data.exp : [
        { a: 'Web Development Intern', b: 'Apex Tech Solutions', c: '2025', d: 'Built responsive components\nCollaborated using Git' }
      ],
      proj: (data.proj && data.proj.length) ? data.proj : [
        { a: 'CVForge Resume Wizard', b: 'HTML, CSS, JS', c: '2025', d: 'Print-ready A4 resume generator' }
      ],
      photo: data.photo || null,
      photoShape: data.photoShape || 'circle',
      sectionOrder: data.sectionOrder || ['edu', 'exp', 'proj'],
      accent: activeAccent,
      fontSize: activeFontSize,
      fitOnePage: activeFitOnePage
    };

    $$('[data-thumb]').forEach(thumbEl => {
      const template = thumbEl.dataset.thumb;
      CVForgeRender.renderToElement(thumbEl, {
        ...previewData,
        theme: template
      });
    });
  }

  /**
   * Render the resume to the stage sheet
   */
  function renderCV() {
    const data = CVForgeForm.getFormData();
    data.theme = activeTheme;
    data.accent = activeAccent;
    data.fontSize = activeFontSize;
    data.fitOnePage = activeFitOnePage;
    
    const cvContainer = $('#cv');
    CVForgeRender.renderToElement(cvContainer, data);
    document.title = (data.name ? `${data.name} - Resume` : 'CVForge Resume');
  }

  /**
   * Set active theme
   * @param {string} themeName 
   */
  function setTheme(themeName) {
    activeTheme = themeName;
    $$('.th').forEach(el => {
      const isSelected = el.dataset.t === themeName;
      el.classList.toggle('sel', isSelected);
      el.setAttribute('aria-checked', isSelected);
    });
    saveCurrentState();
    if (currentStep === 3) renderCV();
  }

  /**
   * Set active accent color
   * @param {string} colorHex 
   */
  function setAccent(colorHex) {
    activeAccent = colorHex;
    document.documentElement.style.setProperty('--accent', colorHex);
    document.documentElement.style.setProperty('--focus-ring', `${colorHex}33`);

    const isPreset = PRESET_COLORS.includes(colorHex);
    $$('.cd').forEach(el => {
      const isSelected = el.dataset.color === colorHex;
      el.classList.toggle('sel', isSelected);
      el.setAttribute('aria-checked', isSelected);
    });

    const customWrap = $('#custom-color-wrap');
    if (customWrap) {
      customWrap.classList.toggle('sel', !isPreset);
      const customInput = $('#custom-color');
      if (customInput && !isPreset) {
        customInput.value = colorHex;
      }
    }

    saveCurrentState();
    if (currentStep === 2) renderThemePreviews();
    if (currentStep === 3) renderCV();
  }

  /**
   * Debounced Auto-Save & ATS Live Update
   */
  function onFormChanged() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      saveCurrentState();
      updateATSAnalysis();
    }, 400);
  }

  /**
   * Update ATS Score Ring, Checklist, Tips, and Weak Verbs Audit
   */
  function updateATSAnalysis() {
    if (!window.CVForgeATS) return;

    const data = CVForgeForm.getFormData();
    const jdText = $('#jd-input-text')?.value || '';
    const analysis = CVForgeATS.scoreResume(data, jdText);

    // Update Circular Ring Score
    const scoreProgress = $('#score-ring-progress');
    const scoreNum = $('#ats-score-num');
    const badgeScore = $('#ats-badge-score');
    const badgePill = $('#ats-badge-pill');

    const total = analysis.total;
    const circumference = 301.6;
    const offset = circumference - (total / 100) * circumference;

    if (scoreProgress) {
      scoreProgress.style.strokeDashoffset = String(offset);
      // Color-code score ring stroke
      let strokeColor = '#ef4444'; // Red for < 50
      if (total >= 80) {
        strokeColor = '#10b981'; // Green for 80+
      } else if (total >= 50) {
        strokeColor = '#f59e0b'; // Amber for 50-79
      }
      scoreProgress.style.stroke = strokeColor;
    }

    if (scoreNum) scoreNum.textContent = String(total);
    if (badgeScore) badgeScore.textContent = String(total);
    if (badgePill) {
      if (total >= 80) {
        badgePill.style.background = '#000000';
        badgePill.style.color = '#10b981';
      } else if (total >= 50) {
        badgePill.style.background = '#000000';
        badgePill.style.color = '#f59e0b';
      } else {
        badgePill.style.background = '#000000';
        badgePill.style.color = '#ef4444';
      }
    }

    // Update Status Indicator in Score Hero Card
    const statusText = $('#ats-status-text');
    const statusDot = $('#ats-status-dot');
    if (statusText) {
      if (total >= 80) {
        statusText.textContent = 'PARSER READY';
        if (statusDot) {
          statusDot.style.background = '#10b981';
          statusDot.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.6)';
        }
      } else if (total >= 50) {
        statusText.textContent = 'COMPATIBLE';
        if (statusDot) {
          statusDot.style.background = '#f59e0b';
          statusDot.style.boxShadow = '0 0 8px rgba(245, 158, 11, 0.6)';
        }
      } else {
        statusText.textContent = 'NEEDS REVISION';
        if (statusDot) {
          statusDot.style.background = '#ef4444';
          statusDot.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.6)';
        }
      }
    }

    // Render 8 Criteria Breakdown list
    const breakdownEl = $('#ats-breakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML = analysis.breakdown.map(item => `
        <li class="ats-item ${item.passed ? 'pass' : 'fail'}">
          <div class="ats-item-info">
            <span class="ats-icon">${item.passed ? '✓' : '✗'}</span>
            <span>${item.name}</span>
          </div>
          <span class="ats-pts">${item.passed ? `+${item.points} pts` : `0/${item.max} pts`}</span>
        </li>
      `).join('');
    }

    // Render Actionable Tips Box
    const tipsBox = $('#ats-tips-container');
    const tipsList = $('#ats-tips-list');
    if (tipsBox && tipsList) {
      if (analysis.tips && analysis.tips.length > 0) {
        tipsBox.style.display = 'block';
        tipsList.innerHTML = analysis.tips.map(tip => `<li>${tip}</li>`).join('');
      } else {
        tipsBox.style.display = 'none';
        tipsList.innerHTML = '';
      }
    }

    // Render Weak Action Verbs Panel
    const weakPanel = $('#weak-verbs-panel');
    const weakList = $('#weak-verbs-list');
    if (weakPanel && weakList) {
      if (analysis.weakVerbs && analysis.weakVerbs.length > 0) {
        weakPanel.style.display = 'block';
        weakList.innerHTML = analysis.weakVerbs.map(item => `
          <div class="weak-verb-item">
            <div>
              <strong style="color:var(--danger);">${item.weakPhrase}</strong> in:
              <em style="color:var(--muted); font-size:0.78rem;">"${item.originalBullet.length > 45 ? item.originalBullet.slice(0, 45) + '...' : item.originalBullet}"</em>
            </div>
            <div class="suggestion-chips">
              <span>Replace with:</span>
              ${item.suggestions.map(s => `<button type="button" class="btn-suggest" data-replace-from="${item.weakPhrase}" data-replace-to="${s}">${s}</button>`).join('')}
            </div>
          </div>
        `).join('');
      } else {
        weakPanel.style.display = 'none';
        weakList.innerHTML = '';
      }
    }

    // Toggle clean state indicator if no weak verbs are present
    const cleanState = $('#weak-verbs-clean');
    if (cleanState) {
      cleanState.style.display = (analysis.weakVerbs && analysis.weakVerbs.length > 0) ? 'none' : 'flex';
    }

    return analysis;
  }

  /**
   * Persist state to storage
   */
  function saveCurrentState() {
    const data = CVForgeForm.getFormData();
    data.theme = activeTheme;
    data.accent = activeAccent;
    data.step = currentStep;
    data.fontSize = activeFontSize;
    data.fitOnePage = activeFitOnePage;
    CVForgeStorage.saveState(data);
  }

  /**
   * Populate sample student data
   */
  function loadSampleData() {
    const sample = {
      name: 'Aarav Kumar',
      title: 'B.Tech Computer Science Student',
      email: 'aarav.kumar@email.com',
      phone: '+91 98765 43210',
      loc: 'Darbhanga, Bihar',
      link: 'github.com/aarav',
      sum: 'Motivated engineering student who enjoys building clean, responsive interfaces and solving problems with code. Seeking a software internship to apply and expand modern web development skills.',
      skills: ['HTML5', 'CSS3', 'JavaScript', 'Python', 'Git', 'Problem Solving'],
      langs: ['English', 'Hindi', 'Maithili'],
      certs: [
        'Responsive Web Design - freeCodeCamp',
        'Python for Everybody - Coursera'
      ],
      edu: [
        { a: 'B.Tech in Computer Science', b: 'Government Engineering College', c: '2023 - 2027', e: 'CGPA 8.4' },
        { a: 'Class XII (Science CBSE)', b: 'Public Senior Secondary School', c: '2022', e: '89.4%' }
      ],
      exp: [
        {
          a: 'Web Development Intern',
          b: 'Apex Tech Solutions',
          c: 'Jun 2025 - Aug 2025',
          d: 'Built 5 responsive landing pages improving mobile usability by 32%\nCollaborated in an agile team of 4 utilizing Git workflows and code reviews'
        }
      ],
      proj: [
        {
          a: 'CVForge Resume Builder',
          b: 'HTML5, CSS3, Vanilla JS',
          c: '2025',
          d: 'Created a 3-step responsive resume wizard supporting 7 templates and A4 print export\nImplemented accessible validation, photo upload, and section reordering'
        }
      ],
      sectionOrder: ['edu', 'exp', 'proj']
    };

    CVForgeForm.populateForm(sample);
    saveCurrentState();
    updateATSAnalysis();
    
    // Clear validation warnings if any
    const nameErrorEl = document.getElementById('err-name');
    if (nameErrorEl) nameErrorEl.classList.remove('visible');
    const nameEl = $('#form').elements['name'];
    if (nameEl) nameEl.classList.remove('is-invalid');
  }

  /**
   * Clear all user data with confirmation
   */
  function handleClearData() {
    const confirmed = window.confirm('Are you sure you want to clear all resume data? This action cannot be undone.');
    if (confirmed) {
      CVForgeStorage.clearState();
      CVForgeForm.resetForm();
      setTheme('classic');
      setAccent(PRESET_COLORS[0]);
      activeFontSize = 10;
      activeFitOnePage = false;
      const slider = $('#font-size-slider');
      if (slider) slider.value = '10';
      const sliderVal = $('#font-size-val');
      if (sliderVal) sliderVal.textContent = '10 pt';
      const fitToggle = $('#fit-one-page-toggle');
      if (fitToggle) fitToggle.checked = false;
      updateATSAnalysis();
      go(1);
    }
  }

  /**
   * Initialize color swatches & custom color picker in Theme Step
   */
  function setupColorSwatches() {
    const container = $('#colors');
    if (!container) return;
    container.innerHTML = '';

    const isPreset = PRESET_COLORS.includes(activeAccent);

    // Preset color buttons
    PRESET_COLORS.forEach(color => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = `cd ${color === activeAccent ? 'sel' : ''}`;
      swatch.style.backgroundColor = color;
      swatch.dataset.color = color;
      swatch.setAttribute('role', 'radio');
      swatch.setAttribute('aria-checked', color === activeAccent);
      swatch.setAttribute('aria-label', `Accent color ${color}`);
      swatch.addEventListener('click', () => setAccent(color));
      container.appendChild(swatch);
    });

    // Custom color picker wrapper
    const customWrap = document.createElement('div');
    customWrap.className = `custom-color-wrap ${!isPreset ? 'sel' : ''}`;
    customWrap.id = 'custom-color-wrap';
    customWrap.title = 'Custom accent color picker';
    customWrap.innerHTML = `<input type="color" id="custom-color" class="custom-color-input" value="${activeAccent}" aria-label="Custom accent color">`;
    
    const customInput = customWrap.querySelector('#custom-color');
    customInput.addEventListener('input', e => {
      setAccent(e.target.value);
    });
    container.appendChild(customWrap);
  }

  /**
   * Initialize theme cards
   */
  function setupThemeCards() {
    const themeCards = $$('.th');
    themeCards.forEach(card => {
      card.setAttribute('role', 'radio');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-checked', card.dataset.t === activeTheme);
      
      const selectCard = () => setTheme(card.dataset.t);
      card.addEventListener('click', selectCard);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectCard();
        }
      });
    });
  }

  /**
   * Setup Photo Upload with FileReader and 2MB Limit
   */
  function setupPhotoUpload() {
    const chooseBtn = $('#photo-choose-btn');
    const input = $('#photo-input');
    const removeBtn = $('#photo-remove-btn');
    const errPhoto = $('#err-photo');

    chooseBtn?.addEventListener('click', () => input?.click());

    input?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;

      // 2 MB Size Validation
      if (file.size > 2 * 1024 * 1024) {
        if (errPhoto) {
          errPhoto.textContent = 'Photo exceeds 2 MB limit. Please choose a smaller image.';
          errPhoto.classList.add('visible');
        }
        input.value = '';
        return;
      }

      if (errPhoto) {
        errPhoto.textContent = '';
        errPhoto.classList.remove('visible');
      }

      const reader = new FileReader();
      reader.onload = ev => {
        const rawDataUrl = ev.target.result;
        // Optimize image to 400x400 to prevent localStorage quota exhaustion
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 400;
            let w = img.width, h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const optimizedUrl = canvas.toDataURL('image/jpeg', 0.88);
            CVForgeForm.setPhoto(optimizedUrl);
          } catch (e) {
            CVForgeForm.setPhoto(rawDataUrl);
          }
          onFormChanged();
          if (currentStep === 2) renderThemePreviews();
          if (currentStep === 3) renderCV();
        };
        img.onerror = () => {
          CVForgeForm.setPhoto(rawDataUrl);
          onFormChanged();
          if (currentStep === 2) renderThemePreviews();
          if (currentStep === 3) renderCV();
        };
        img.src = rawDataUrl;
      };

      reader.onerror = () => {
        if (errPhoto) {
          errPhoto.textContent = 'Failed to load photo. Please try another image.';
          errPhoto.classList.add('visible');
        }
      };

      reader.readAsDataURL(file);
    });

    removeBtn?.addEventListener('click', () => {
      CVForgeForm.setPhoto(null);
      if (input) input.value = '';
      if (errPhoto) errPhoto.classList.remove('visible');
      onFormChanged();
      if (currentStep === 2) renderThemePreviews();
      if (currentStep === 3) renderCV();
    });

    $$('input[name="photoShape"]').forEach(radio => {
      radio.addEventListener('change', e => {
        CVForgeForm.setPhotoShape(e.target.value);
        onFormChanged();
        if (currentStep === 2) renderThemePreviews();
        if (currentStep === 3) renderCV();
      });
    });
  }

  /**
   * Setup Section Reordering (Up/Down arrows)
   */
  function setupSectionReordering() {
    document.getElementById('form')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-reorder]');
      if (!btn) return;
      const section = btn.dataset.section;
      const dir = btn.dataset.reorder;
      CVForgeForm.reorderSection(section, dir);
      if (currentStep === 2) renderThemePreviews();
      if (currentStep === 3) renderCV();
    });
    CVForgeForm.updateReorderButtonsState();
  }

  /**
   * Setup Formatting Toolbar (Font Size Slider & Fit To One Page)
   */
  function setupFormattingControls() {
    const slider = $('#font-size-slider');
    const sliderVal = $('#font-size-val');
    const fitToggle = $('#fit-one-page-toggle');

    if (slider) {
      slider.value = String(activeFontSize);
      if (sliderVal) sliderVal.textContent = `${activeFontSize} pt`;
      slider.addEventListener('input', e => {
        activeFontSize = parseFloat(e.target.value);
        if (sliderVal) sliderVal.textContent = `${activeFontSize} pt`;
        const cv = $('#cv');
        if (cv) cv.style.setProperty('--sheet-font-size', `${activeFontSize}pt`);
        saveCurrentState();
      });
    }

    if (fitToggle) {
      fitToggle.checked = activeFitOnePage;
      fitToggle.addEventListener('change', e => {
        activeFitOnePage = e.target.checked;
        const cv = $('#cv');
        if (cv) cv.classList.toggle('fit-one-page', activeFitOnePage);
        saveCurrentState();
      });
    }
  }

  /**
   * Setup Job Description Matcher and Verb Replacer
   */
  function setupATSFeatures() {
    const jdBtn = $('#jd-analyze-btn');
    const jdInput = $('#jd-input-text');
    const jdResultBox = $('#jd-result-box');
    const jdPctText = $('#jd-pct-text');
    const jdMeterFill = $('#jd-meter-fill');
    const matchedChips = $('#jd-matched-chips');
    const missingChips = $('#jd-missing-chips');

    const runJDMatch = () => {
      const data = CVForgeForm.getFormData();
      const jdText = jdInput?.value || '';
      if (!jdText.trim()) {
        if (jdResultBox) jdResultBox.classList.remove('visible');
        updateATSAnalysis();
        return;
      }

      const match = CVForgeATS.matchJobDescription(CVForgeATS.extractFullText(data), jdText);
      if (jdResultBox) jdResultBox.classList.add('visible');
      if (jdPctText) jdPctText.textContent = `Match: ${match.percentage}% (${match.matched.length}/${match.totalKeywords} keywords)`;
      if (jdMeterFill) {
        jdMeterFill.style.width = `${match.percentage}%`;
        if (match.percentage >= 70) {
          jdMeterFill.style.background = '#10b981';
        } else if (match.percentage >= 40) {
          jdMeterFill.style.background = '#f59e0b';
        } else {
          jdMeterFill.style.background = '#ef4444';
        }
      }

      if (matchedChips) {
        matchedChips.innerHTML = match.matched.length
          ? match.matched.map(kw => `<span class="kw-chip matched">✓ ${kw}</span>`).join('')
          : '<span style="font-size:0.75rem; color:var(--muted);">No matching keywords found</span>';
      }

      if (missingChips) {
        missingChips.innerHTML = match.missing.length
          ? match.missing.map(kw => `<span class="kw-chip missing">✗ ${kw}</span>`).join('')
          : '<span style="font-size:0.75rem; color:var(--success);">All target keywords present!</span>';
      }

      updateATSAnalysis();
    };

    jdBtn?.addEventListener('click', runJDMatch);
    jdInput?.addEventListener('input', () => {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(runJDMatch, 500);
    });

    // 1-Click Replace Weak Verbs in form textareas
    $('#weak-verbs-panel')?.addEventListener('click', e => {
      const btn = e.target.closest('.btn-suggest');
      if (!btn) return;
      const fromPhrase = btn.dataset.replaceFrom;
      const toWord = btn.dataset.replaceTo;
      if (!fromPhrase || !toWord) return;

      // Search and replace across experience and project textareas
      const textareas = document.querySelectorAll('#g-exp textarea, #g-proj textarea');
      let replaced = false;
      textareas.forEach(ta => {
        const regex = new RegExp(fromPhrase, 'i');
        if (regex.test(ta.value)) {
          ta.value = ta.value.replace(regex, toWord);
          replaced = true;
        }
      });

      if (replaced) {
        onFormChanged();
        updateATSAnalysis();
      }
    });
  }

  /**
   * Bind all event handlers and initialize app
   */
  function init() {
    // Setup themes and colors
    setupColorSwatches();
    setupThemeCards();

    // Setup Phase 3 controls
    setupPhotoUpload();
    setupSectionReordering();
    setupFormattingControls();

    // Setup Phase 4 ATS Features
    setupATSFeatures();

    // Hook repeatable row add buttons
    $$('.btn-add, .add').forEach(btn => {
      btn.addEventListener('click', () => {
        CVForgeForm.addRow(btn.dataset.g, {}, true);
        onFormChanged();
      });
    });

    // Step navigation buttons
    $$('[data-go]').forEach(btn => {
      btn.addEventListener('click', () => go(parseInt(btn.dataset.go, 10)));
    });

    // Next buttons
    $('#to2')?.addEventListener('click', () => go(2));
    $('#to3')?.addEventListener('click', () => go(3));

    // Sample data button
    $('#sample')?.addEventListener('click', () => {
      loadSampleData();
    });

    // Clear data button
    $('#clear-data')?.addEventListener('click', handleClearData);

    // Print button
    $('#print-btn')?.addEventListener('click', () => {
      window.print();
    });

    // Auto-save on form inputs
    const form = $('#form');
    if (form) {
      form.addEventListener('input', onFormChanged);
      form.addEventListener('change', onFormChanged);
    }

    // Load saved state or default
    const saved = CVForgeStorage.loadState();
    if (saved) {
      CVForgeForm.populateForm(saved);
      if (saved.theme) setTheme(saved.theme);
      if (saved.accent) setAccent(saved.accent);
      if (saved.fontSize) {
        activeFontSize = saved.fontSize;
        const slider = $('#font-size-slider');
        if (slider) slider.value = String(activeFontSize);
        const sliderVal = $('#font-size-val');
        if (sliderVal) sliderVal.textContent = `${activeFontSize} pt`;
      }
      if (saved.fitOnePage !== undefined) {
        activeFitOnePage = saved.fitOnePage;
        const fitToggle = $('#fit-one-page-toggle');
        if (fitToggle) fitToggle.checked = activeFitOnePage;
      }
      if (saved.step && saved.step > 1 && saved.name) {
        go(saved.step);
      } else {
        go(1);
      }
    } else {
      // Default rows
      ['edu', 'exp', 'proj'].forEach(g => CVForgeForm.addRow(g));
      setTheme('classic');
      setAccent(PRESET_COLORS[0]);
      go(1);
    }

    // Initial ATS analysis calculation and theme previews
    updateATSAnalysis();
    renderThemePreviews();

    // Phase 5: Setup Export features (HTML Blob, Plain Text, JSON Import/Export)
    setupExportFeatures();

    // Interactive 3D Hero Parallax Gallery
    setup3DHeroParallax();

    // Category and Skill Selection Toggles
    if (window.CVForgeForm && window.CVForgeForm.initSkillToggles) {
      window.CVForgeForm.initSkillToggles();
    }

    // Staggered Scroll Fade-In-Up Reveals using IntersectionObserver
    setupScrollReveals();

    // Check if initial load requested builder directly
    if (window.location.hash === '#builder') {
      revealBuilder(saved?.step || 1);
    }

    // Primary Hero CTA: 'Generate my CV'
    $('#hero-generate-btn')?.addEventListener('click', () => {
      revealBuilder(1);
    });

    // Secondary Hero CTA: 'Try Sample Data'
    $('#hero-sample-cta')?.addEventListener('click', () => {
      loadSampleData();
      revealBuilder(1);
    });

    // Top Navigation: 'Build' Link
    $('.nav-roll-cta')?.addEventListener('click', e => {
      e.preventDefault();
      revealBuilder(1);
    });

    // Top Navigation: 'Home' Link
    $('a[href="#home"]')?.addEventListener('click', e => {
      e.preventDefault();
      showHeroLanding();
    });

    // Hook Templates Showcase "Select & Build" buttons
    $$('[data-select-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.selectTheme;
        if (theme) {
          setTheme(theme);
          revealBuilder(2);
          showToast(`✓ Selected ${theme.toUpperCase()} template!`);
        }
      });
    });
  }

  /**
   * Smoothly transitions from the hero landing section to the multi-step form interface.
   * Fades hero opacity to 0 and translates translateY(-20px) over 500ms, then sets
   * display: none and reveals the Details, Theme, and Download steps with a subtle fade-in animation.
   * @param {number} targetStep 
   */
  function revealBuilder(targetStep = 1) {
    const hero = $('#hero');
    const builder = $('#builder');
    if (!hero || !builder) return;

    // If hero is already hidden, immediately ensure builder is active
    if (hero.style.display === 'none' || hero.classList.contains('hero-fade-out')) {
      builder.classList.remove('builder-hidden');
      builder.classList.add('builder-revealed');
      $$('.landing-section').forEach(sec => sec.style.display = 'none');
      go(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Apply CSS class: fades opacity to 0 and translates translateY(-20px) over 500ms
    hero.classList.add('hero-fade-out');

    let transitionEnded = false;
    const handleTransitionEnd = () => {
      if (transitionEnded) return;
      transitionEnded = true;
      hero.removeEventListener('transitionend', handleTransitionEnd);

      // Set hero section to display: none
      hero.style.display = 'none';

      // Hide extra landing sections to keep interface focused on builder
      $$('.landing-section').forEach(sec => sec.style.display = 'none');

      // Reveal the existing CVForge multi-step form interface
      builder.classList.remove('builder-hidden');
      builder.classList.remove('builder-revealed');
      void builder.offsetWidth; // Reflow to cleanly restart subtle fade-in keyframe
      builder.classList.add('builder-revealed');

      go(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Listen for transitionend event
    hero.addEventListener('transitionend', handleTransitionEnd);

    // Fallback timer (520ms) in case transitionend event is skipped
    setTimeout(handleTransitionEnd, 520);
  }

  /**
   * Restores the hero landing presentation if user clicks Home in navigation
   */
  function showHeroLanding() {
    const hero = $('#hero');
    const builder = $('#builder');
    if (!hero) return;

    if (builder) {
      builder.classList.add('builder-hidden');
      builder.classList.remove('builder-revealed');
    }

    $$('.landing-section').forEach(sec => sec.style.display = '');

    hero.style.display = 'flex';
    void hero.offsetWidth;
    hero.classList.remove('hero-fade-out');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Interactive 3D Parallax Gallery for CV Template Previews
   * Attaches to mousemove on window, calculates cursor X/Y relative to screen center,
   * and applies rotateX(), rotateY(), and staggered parallax depth transforms across cards.
   */
  function setup3DHeroParallax() {
    const scene = $('#hero-3d-scene');
    if (!scene) return;

    const cardEls = $$('#hero-3d-scene .gallery-card');
    if (!cardEls.length) return;

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Maximum tilt angles and parallax pixel displacement
    const MAX_TILT_X = 14; // Degrees on X axis
    const MAX_TILT_Y = 18; // Degrees on Y axis
    const MAX_SHIFT_X = 22; // Pixels
    const MAX_SHIFT_Y = 16; // Pixels

    let targetNormX = 0;
    let targetNormY = 0;
    let currentNormX = 0;
    let currentNormY = 0;
    let isMouseOver = false;
    let rafId = null;

    // Cache card configuration objects
    const cards = cardEls.map(card => ({
      el: card,
      factor: parseFloat(card.dataset.factor || '1.0'),
      baseX: parseFloat(card.dataset.baseX || '0'),
      baseY: parseFloat(card.dataset.baseY || '0'),
      baseZ: parseFloat(card.dataset.baseZ || '0'),
      baseRz: parseFloat(card.dataset.baseRz || '0')
    }));

    function applyTransforms() {
      // Lerp towards target normalized coordinates
      const ease = 0.085;
      currentNormX += (targetNormX - currentNormX) * ease;
      currentNormY += (targetNormY - currentNormY) * ease;

      // Invert Y for natural perspective: cursor moving UP tilts top edge backward (rotateX > 0)
      const baseRotX = -currentNormY * MAX_TILT_X;
      // Cursor moving RIGHT tilts right edge backward (rotateY > 0)
      const baseRotY = currentNormX * MAX_TILT_Y;

      cards.forEach(c => {
        // Staggered calculation: each card scales tilt and translation by its depth factor
        const cardRotX = (baseRotX * c.factor).toFixed(2);
        const cardRotY = (baseRotY * c.factor).toFixed(2);
        const shiftX = (currentNormX * MAX_SHIFT_X * c.factor).toFixed(2);
        const shiftY = (currentNormY * MAX_SHIFT_Y * c.factor).toFixed(2);

        c.el.style.transform = `translate3d(calc(${c.baseX}px + ${shiftX}px), calc(${c.baseY}px + ${shiftY}px), ${c.baseZ}px) rotateZ(${c.baseRz}deg) rotateX(${cardRotX}deg) rotateY(${cardRotY}deg)`;
      });

      const dist = Math.abs(targetNormX - currentNormX) + Math.abs(targetNormY - currentNormY);
      if (dist > 0.0005 || isMouseOver) {
        rafId = requestAnimationFrame(applyTransforms);
      } else {
        rafId = null;
      }
    }

    function scheduleFrame() {
      if (!rafId) {
        rafId = requestAnimationFrame(applyTransforms);
      }
    }

    // Window mousemove event listener
    window.addEventListener('mousemove', e => {
      isMouseOver = true;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Coordinates relative to screen center, normalized between -1.0 and 1.0
      targetNormX = Math.max(-1, Math.min(1, (e.clientX - centerX) / centerX));
      targetNormY = Math.max(-1, Math.min(1, (e.clientY - centerY) / centerY));

      scheduleFrame();
    });

    // Window mouseleave - gracefully return to resting position
    document.addEventListener('mouseleave', () => {
      isMouseOver = false;
      targetNormX = 0;
      targetNormY = 0;
      scheduleFrame();
    });

    // Initial render
    applyTransforms();

    // Interactive card selection
    cards.forEach(c => {
      const handleSelect = () => {
        let templateKey = 'classic';
        if (c.el.classList.contains('card-executive')) templateKey = 'executive';
        else if (c.el.classList.contains('card-modern')) templateKey = 'modern';
        else if (c.el.classList.contains('card-creative')) templateKey = 'creative';

        setTheme(templateKey);
        revealBuilder(2);
        showToast(`✓ Switched to ${templateKey.toUpperCase()} template!`);
      };

      c.el.addEventListener('click', handleSelect);
      c.el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      });
    });
  }

  /**
   * Vanilla JS IntersectionObserver for smooth, staggered fade-in-up reveals
   * for form sections and bento grid items as the user scrolls.
   */
  function setupScrollReveals() {
    const targets = $$(
      '#form fieldset.card, .ats-dashboard-section, .bento-card, .showcase-bento-card, .step-box, .step2-bento-wrap, .bento-accent-card'
    );

    targets.forEach((el, index) => {
      el.classList.add('reveal-on-scroll');
      // Assign staggered delays within groups
      const delay = (index % 4) * 80;
      el.style.setProperty('--reveal-delay', `${delay}ms`);
    });

    // Provide a helper to reveal elements inside active step container
    window.CVForgeRevealActiveStep = (stepNumber) => {
      const stepEl = $(`#s${stepNumber}`);
      if (stepEl) {
        stepEl.querySelectorAll('.reveal-on-scroll').forEach((el, idx) => {
          el.style.setProperty('--reveal-delay', `${idx * 60}ms`);
          el.classList.add('is-revealed');
        });
      }
    };

    // Check IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.08
    });

    targets.forEach(el => observer.observe(el));
  }

  /**
   * Display toast notification
   * @param {string} msg 
   */
  function showToast(msg) {
    const toast = $('#toast-msg');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
      toast.classList.remove('visible');
    }, 3200);
  }

  /**
   * Phase 5: Export features (Download HTML Blob, Copy Text, Export JSON, Import JSON)
   */
  function setupExportFeatures() {
    // 1. Download as HTML (Blob + URL.createObjectURL with inlined CSS)
    $('#download-html-btn')?.addEventListener('click', () => {
      const data = CVForgeForm.getFormData();
      data.theme = activeTheme;
      data.accent = activeAccent;
      data.fontSize = activeFontSize;
      data.fitOnePage = activeFitOnePage;

      const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${CVForgeRender.esc(data.name || 'Resume')} - CVForge</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
:root {
  --accent: ${activeAccent};
  --sheet-font-size: ${activeFontSize}pt;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #eef1f6; font-family: 'Inter', sans-serif; display: flex; justify-content: center; padding: 20px 0; }
.stage { display: flex; justify-content: center; width: 100%; }
.sheet { width: 210mm; min-height: 297mm; background: #fff !important; color: #1f2937 !important; box-shadow: 0 4px 25px rgba(0,0,0,0.15); font-size: var(--sheet-font-size, 10.2pt); line-height: 1.5; padding: 16mm; box-sizing: border-box; word-break: break-word; }
.sheet h1 { font-size: 24pt; line-height: 1.15; margin-bottom: 3px; color: #111827; }
.sheet .role { color: var(--accent); font-weight: 600; font-size: 11.5pt; margin-bottom: 4px; }
.sheet h3 { font-size: 9.8pt; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent); border-bottom: 2px solid var(--accent); padding-bottom: 3px; margin: 14px 0 8px; }
.sheet ul { margin: 3px 0 0 16px; }
.sheet ul.p { list-style: none; margin: 0; }
.sheet ul.p li { margin-bottom: 4px; display: flex; align-items: center; gap: 6px; font-size: 9.3pt; }
.sheet .it { margin-bottom: 11px; page-break-inside: avoid; break-inside: avoid; }
.sheet .it b { display: block; font-size: 10.2pt; color: #111827; }
.sheet .it span { color: #4b5563; font-size: 9.1pt; display: block; margin-bottom: 2px; }
.sheet .tags { display: flex; flex-wrap: wrap; gap: 5px; list-style: none; margin: 0; }
.sheet .tags li { background: #f3f4f6; border: 1px solid var(--accent); color: #1f2937; padding: 2px 9px; border-radius: 999px; font-size: 8.8pt; }
.sheet .avatar-slot { display: none; justify-content: center; margin-bottom: 12px; }
.sheet.has-photo .avatar-slot { display: flex !important; }
.sheet .avatar-circle { width: 78px; height: 78px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 2px solid var(--accent); background: #f1f5f9; color: var(--accent); font-weight: 700; font-size: 1.5rem; }
.sheet .avatar-circle.is-rounded { border-radius: 14px !important; }
.sheet .avatar-img { width: 100%; height: 100%; object-fit: cover; }
/* Classic */
.t-classic { font-family: "Playfair Display", Georgia, serif; padding: 16mm; }
.t-classic header { text-align: center; border-bottom: 3px double var(--accent); padding-bottom: 12px; margin-bottom: 14px; }
.t-classic aside ul.p { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
/* Modern */
.t-modern { display: grid; grid-template-columns: 34% 66%; grid-template-areas: "h h" "s m"; }
.t-modern header { grid-area: h; background: var(--accent); color: #fff !important; padding: 14mm 12mm 10mm; }
.t-modern header h1, .t-modern header .role { color: #fff !important; }
.t-modern aside { grid-area: s; background: #f8fafc; padding: 8mm 7mm; border-right: 1px solid #e2e8f0; }
.t-modern main { grid-area: m; padding: 8mm 10mm; }
/* Minimal */
.t-minimal { padding: 16mm; }
.t-minimal h3 { border: 0; border-left: 4px solid var(--accent); padding-left: 8px; }
.t-minimal header { border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 14px; }
/* Bold */
.t-bold { display: grid; grid-template-columns: 34% 66%; grid-template-areas: "h h" "s m"; }
.t-bold header { grid-area: h; background: linear-gradient(125deg, var(--accent) 0%, #111827 100%); color: #fff !important; padding: 16mm 12mm; }
.t-bold header h1, .t-bold header .role { color: #fff !important; }
.t-bold aside { grid-area: s; background: #f3f4f6; padding: 8mm 7mm; }
.t-bold main { grid-area: m; padding: 8mm 10mm; }
.t-bold h3 { border: 0; background: var(--accent); color: #fff !important; padding: 3px 8px; border-radius: 3px; display: inline-block; }
/* Creative */
.t-creative { display: grid; grid-template-columns: 33% 67%; grid-template-areas: "s m"; }
.t-creative aside { grid-area: s; background: var(--accent); color: #fff !important; padding: 12mm 8mm; }
.t-creative aside h3 { color: #fff !important; border-bottom: 2px solid rgba(255,255,255,0.4); }
.t-creative aside .tags li { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.45); color: #fff !important; }
.t-creative main { grid-area: m; padding: 12mm 10mm; }
.t-creative header { border-bottom: 2px solid var(--accent); padding-bottom: 12px; margin-bottom: 14px; }
/* Executive */
.t-executive { display: grid; grid-template-columns: 33% 67%; grid-template-areas: "h h" "s m"; }
.t-executive header { grid-area: h; background: #0f172a; color: #fff !important; padding: 14mm 12mm; border-bottom: 4px solid #d4af37; }
.t-executive header h1 { font-family: "Playfair Display", Georgia, serif; color: #fff !important; }
.t-executive header .role { color: #d4af37 !important; }
.t-executive aside { grid-area: s; background: #1e293b; color: #e2e8f0 !important; padding: 10mm 8mm; }
.t-executive aside h3 { color: #d4af37 !important; border-bottom: 1.5px solid #475569; }
.t-executive main { grid-area: m; padding: 10mm 12mm; }
.t-executive main h3 { font-family: "Playfair Display", Georgia, serif; border-bottom: 2px solid #d4af37; }
/* Compact */
.t-compact { padding: 9mm 12mm; font-size: 9pt; line-height: 1.35; }
.t-compact header { display: flex; justify-content: space-between; border-bottom: 2px solid var(--accent); padding-bottom: 4px; margin-bottom: 8px; }
.t-compact aside { margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 12px; background: #f8fafc; padding: 6px 10px; border-radius: 6px; }
.t-compact aside section { display: flex; gap: 6px; }
.t-compact aside h3 { display: inline; border: 0; margin: 0; }
.t-compact aside ul.p { display: flex; flex-wrap: wrap; gap: 10px; }
.t-compact main h3 { font-size: 9pt; margin: 8px 0 4px; }
/* Fit to One Page */
.sheet.fit-one-page { --sheet-font-size: 8.8pt !important; line-height: 1.28 !important; }
.sheet.fit-one-page h1 { font-size: 20pt !important; }
.sheet.fit-one-page h3 { margin: 7px 0 3px !important; font-size: 8.6pt !important; }
.sheet.fit-one-page .it { margin-bottom: 5px !important; }
/* Print rules */
@page { size: A4 portrait; margin: 0; }
@media print {
  body { background: #fff !important; padding: 0 !important; }
  *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .sheet { box-shadow: none !important; width: 210mm !important; min-height: 297mm !important; }
  .sheet section, .sheet .it { break-inside: avoid !important; }
}
</style>
</head>
<body>
<div class="stage">
  <article class="sheet t-${data.theme}${data.photo ? ' has-photo' : ''}${data.fitOnePage ? ' fit-one-page' : ''}">
    ${CVForgeRender.buildResumeHtml(data)}
  </article>
</div>
</body>
</html>`;

      const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `${(data.name || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_')}_CV.html`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('✓ Downloaded standalone HTML resume!');
    });

    // 2. Copy Plain Text
    $('#copy-text-btn')?.addEventListener('click', () => {
      const data = CVForgeForm.getFormData();
      const lines = [];
      lines.push(data.name || 'Your Name');
      if (data.title) lines.push(data.title);
      lines.push('----------------------------------------');
      const contact = [data.email, data.phone, data.loc, data.link].filter(Boolean).join(' | ');
      if (contact) lines.push(contact);
      lines.push('');

      if (data.sum) {
        lines.push('PROFESSIONAL SUMMARY');
        lines.push(data.sum);
        lines.push('');
      }

      if (data.skills && data.skills.length) {
        lines.push('TECHNICAL & CORE SKILLS');
        lines.push(data.skills.join(', '));
        lines.push('');
      }

      const order = data.sectionOrder || ['edu', 'exp', 'proj'];
      order.forEach(secKey => {
        if (secKey === 'exp' && data.exp && data.exp.length) {
          lines.push('WORK EXPERIENCE');
          data.exp.forEach(e => {
            lines.push(`• ${e.a} - ${e.b} (${e.c})`);
            if (e.d) e.d.split('\n').forEach(b => lines.push(`  - ${b.trim()}`));
          });
          lines.push('');
        }
        if (secKey === 'proj' && data.proj && data.proj.length) {
          lines.push('PROJECTS');
          data.proj.forEach(p => {
            lines.push(`• ${p.a} | ${p.b} (${p.c})`);
            if (p.d) p.d.split('\n').forEach(b => lines.push(`  - ${b.trim()}`));
          });
          lines.push('');
        }
        if (secKey === 'edu' && data.edu && data.edu.length) {
          lines.push('EDUCATION');
          data.edu.forEach(ed => {
            lines.push(`• ${ed.a} - ${ed.b} (${ed.c}) ${ed.e ? `[${ed.e}]` : ''}`);
          });
          lines.push('');
        }
      });

      if (data.certs && data.certs.length) {
        lines.push('CERTIFICATIONS & ACHIEVEMENTS');
        data.certs.forEach(c => lines.push(`• ${c}`));
        lines.push('');
      }

      const text = lines.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('✓ Resume plain text copied to clipboard!');
        }).catch(() => {
          showToast('Failed to copy. Please check browser permissions.');
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('✓ Resume plain text copied to clipboard!');
      }
    });

    // 3. Export JSON
    $('#export-json-btn')?.addEventListener('click', () => {
      const data = CVForgeForm.getFormData();
      data.theme = activeTheme;
      data.accent = activeAccent;
      data.fontSize = activeFontSize;
      data.fitOnePage = activeFitOnePage;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(data.name || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_')}_data.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('✓ Exported resume JSON file!');
    });

    // 4. Import JSON
    $('#import-json-btn')?.addEventListener('click', () => {
      $('#import-json-input')?.click();
    });

    $('#import-json-input')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const json = JSON.parse(ev.target.result);
          CVForgeForm.populateForm(json);
          if (json.theme) setTheme(json.theme);
          if (json.accent) setAccent(json.accent);
          if (json.fontSize) {
            activeFontSize = json.fontSize;
            const slider = $('#font-size-slider');
            if (slider) slider.value = String(activeFontSize);
            const sliderVal = $('#font-size-val');
            if (sliderVal) sliderVal.textContent = `${activeFontSize} pt`;
          }
          if (json.fitOnePage !== undefined) {
            activeFitOnePage = json.fitOnePage;
            const fitToggle = $('#fit-one-page-toggle');
            if (fitToggle) fitToggle.checked = activeFitOnePage;
          }
          saveCurrentState();
          updateATSAnalysis();
          if (currentStep === 2) renderThemePreviews();
          if (currentStep === 3) renderCV();
          showToast('✓ Imported resume JSON successfully!');
        } catch (err) {
          showToast('Error parsing JSON file. Please verify file format.');
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    });
  }

  // Export public interface
  return {
    init,
    go,
    setTheme,
    setAccent,
    onFormChanged,
    loadSampleData,
    updateATSAnalysis,
    revealBuilder,
    showHeroLanding
  };
})();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  CVForgeApp.init();
});
