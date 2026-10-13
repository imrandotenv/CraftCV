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
   * Debounced Auto-Save
   */
  function onFormChanged() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      saveCurrentState();
    }, 400);
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
  }

  // Export public interface
  return {
    init,
    go,
    setTheme,
    setAccent,
    onFormChanged,
    loadSampleData
  };
})();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  CVForgeApp.init();
});
