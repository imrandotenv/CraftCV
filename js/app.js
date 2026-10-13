/**
 * CVForge - Application Wiring & Controller
 * Manages step navigation, user interactions, auto-save, and themes
 */

window.CVForgeApp = (() => {
  const PRESET_COLORS = ['#2563eb', '#059669', '#e11d48', '#d97706', '#7c3aed', '#0f766e'];
  
  // App state
  let currentStep = 1;
  let activeTheme = 'classic';
  let activeAccent = PRESET_COLORS[0];
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
   * Render the resume to the stage sheet
   */
  function renderCV() {
    const data = CVForgeForm.getFormData();
    data.theme = activeTheme;
    data.accent = activeAccent;
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
    $$('.cd').forEach(el => {
      const isSelected = el.dataset.color === colorHex;
      el.classList.toggle('sel', isSelected);
      el.setAttribute('aria-checked', isSelected);
    });
    saveCurrentState();
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
          d: 'Created a 3-step responsive resume wizard supporting 4 templates and A4 print export\nImplemented accessible validation and client-side data persistence'
        }
      ]
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
      go(1);
    }
  }

  /**
   * Initialize color swatches in Theme Step
   */
  function setupColorSwatches() {
    const container = $('#colors');
    if (!container) return;
    container.innerHTML = '';

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
   * Bind all event handlers and initialize app
   */
  function init() {
    // Setup themes and colors
    setupColorSwatches();
    setupThemeCards();

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
