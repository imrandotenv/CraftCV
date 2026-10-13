/**
 * CVForge - Form Module
 * Dynamic repeatable rows, data extraction, and accessible validation
 */

window.CVForgeForm = (() => {
  const LABELS = {
    edu: ['Degree / Course', 'College / University', 'Year / Duration', 'Grade / CGPA (optional)'],
    exp: ['Job Title / Role', 'Company / Organization', 'Duration / Dates', 'Key Achievements (one per line)'],
    proj: ['Project Name', 'Tech Stack / Tools', 'Live Link / Year', 'Description & Highlights (one per line)']
  };

  /**
   * Helper: Escape HTML
   */
  const esc = CVForgeRender.esc;

  /**
   * Add a dynamic row to a section group
   * @param {'edu'|'exp'|'proj'} group 
   * @param {Object} data 
   * @param {boolean} focusFirst
   */
  function addRow(group, data = {}, focusFirst = false) {
    const labels = LABELS[group];
    const container = document.getElementById(`g-${group}`);
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'row';

    const isEdu = group === 'edu';
    row.innerHTML = `
      <button type="button" class="x" aria-label="Remove item" title="Remove item">×</button>
      <div class="grid">
        <label class="f">
          ${labels[0]}
          <input type="text" data-k="a" value="${esc(data.a || '')}" placeholder="e.g. ${labels[0]}">
        </label>
        <label class="f">
          ${labels[1]}
          <input type="text" data-k="b" value="${esc(data.b || '')}" placeholder="e.g. ${labels[1]}">
        </label>
        <label class="f">
          ${labels[2]}
          <input type="text" data-k="c" value="${esc(data.c || '')}" placeholder="e.g. 2023 - 2027">
        </label>
        <label class="f">
          ${isEdu ? labels[3] : '&nbsp;'}
          <input type="text" data-k="e" value="${esc(data.e || '')}" placeholder="e.g. CGPA 8.5" ${isEdu ? '' : 'style="visibility:hidden"'}>
        </label>
        ${!isEdu ? `
          <label class="f full">
            ${labels[3]}
            <textarea data-k="d" placeholder="Write bullet points here...">${esc(data.d || '')}</textarea>
          </label>
        ` : ''}
      </div>
    `;

    // Hook remove button
    const removeBtn = row.querySelector('.x');
    removeBtn.addEventListener('click', () => {
      row.remove();
      CVForgeApp.onFormChanged();
    });

    container.appendChild(row);

    if (focusFirst) {
      const firstInput = row.querySelector('input');
      if (firstInput) firstInput.focus();
    }
  }

  /**
   * Extract repeatable rows data
   * @param {'edu'|'exp'|'proj'} group 
   * @returns {Array<Object>}
   */
  function getRowsData(group) {
    const container = document.getElementById(`g-${group}`);
    if (!container) return [];

    const rowEls = container.querySelectorAll('.row');
    const items = [];

    rowEls.forEach(row => {
      const item = {};
      row.querySelectorAll('[data-k]').forEach(input => {
        item[input.dataset.k] = input.value.trim();
      });
      // Keep if at least title or organization is provided
      if (item.a || item.b) {
        items.push(item);
      }
    });

    return items;
  }

  /**
   * Extract all form values into structured object
   * @returns {Object}
   */
  function getFormData() {
    const form = document.getElementById('form');
    if (!form) return {};

    const val = name => {
      const el = form.elements[name];
      return el ? el.value.trim() : '';
    };

    const parseList = str => {
      return str
        ? str.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
        : [];
    };

    const parseLines = str => {
      return str
        ? str.split('\n').map(s => s.trim()).filter(Boolean)
        : [];
    };

    return {
      name: val('name'),
      title: val('title'),
      email: val('email'),
      phone: val('phone'),
      loc: val('loc'),
      link: val('link'),
      sum: val('sum'),
      skills: parseList(val('skills')),
      langs: parseList(val('langs')),
      certs: parseLines(val('certs')),
      edu: getRowsData('edu'),
      exp: getRowsData('exp'),
      proj: getRowsData('proj')
    };
  }

  /**
   * Populate form fields and dynamic rows from data object
   * @param {Object} data 
   */
  function populateForm(data) {
    if (!data) return;
    const form = document.getElementById('form');
    if (!form) return;

    const setVal = (name, val) => {
      const el = form.elements[name];
      if (el) el.value = val || '';
    };

    setVal('name', data.name);
    setVal('title', data.title);
    setVal('email', data.email);
    setVal('phone', data.phone);
    setVal('loc', data.loc);
    setVal('link', data.link);
    setVal('sum', data.sum);

    if (Array.isArray(data.skills)) {
      setVal('skills', data.skills.join(', '));
    } else if (typeof data.skills === 'string') {
      setVal('skills', data.skills);
    }

    if (Array.isArray(data.langs)) {
      setVal('langs', data.langs.join(', '));
    } else if (typeof data.langs === 'string') {
      setVal('langs', data.langs);
    }

    if (Array.isArray(data.certs)) {
      setVal('certs', data.certs.join('\n'));
    } else if (typeof data.certs === 'string') {
      setVal('certs', data.certs);
    }

    // Clear dynamic rows
    ['edu', 'exp', 'proj'].forEach(group => {
      const container = document.getElementById(`g-${group}`);
      if (container) container.innerHTML = '';
      const items = Array.isArray(data[group]) ? data[group] : [];
      if (items.length > 0) {
        items.forEach(item => addRow(group, item));
      } else {
        // Add one default empty row
        addRow(group);
      }
    });
  }

  /**
   * Reset form fields completely
   */
  function resetForm() {
    const form = document.getElementById('form');
    if (form) form.reset();
    ['edu', 'exp', 'proj'].forEach(group => {
      const container = document.getElementById(`g-${group}`);
      if (container) container.innerHTML = '';
      addRow(group);
    });
  }

  /**
   * Validate form fields for step transition
   * @returns {{isValid: boolean, errors: Object}}
   */
  function validate() {
    const form = document.getElementById('form');
    const errors = {};
    let isValid = true;

    // Name validation (Required)
    const nameEl = form.elements['name'];
    const nameErrorEl = document.getElementById('err-name');
    if (!nameEl.value.trim()) {
      errors.name = 'Full name is required to create your resume.';
      nameEl.classList.add('is-invalid');
      if (nameErrorEl) {
        nameErrorEl.textContent = errors.name;
        nameErrorEl.classList.add('visible');
      }
      isValid = false;
    } else {
      nameEl.classList.remove('is-invalid');
      if (nameErrorEl) {
        nameErrorEl.textContent = '';
        nameErrorEl.classList.remove('visible');
      }
    }

    // Email validation (optional but format checked if filled)
    const emailEl = form.elements['email'];
    const emailErrorEl = document.getElementById('err-email');
    if (emailEl.value.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailEl.value.trim())) {
        errors.email = 'Please enter a valid email address (e.g. name@domain.com).';
        emailEl.classList.add('is-invalid');
        if (emailErrorEl) {
          emailErrorEl.textContent = errors.email;
          emailErrorEl.classList.add('visible');
        }
        isValid = false;
      } else {
        emailEl.classList.remove('is-invalid');
        if (emailErrorEl) {
          emailErrorEl.textContent = '';
          emailErrorEl.classList.remove('visible');
        }
      }
    } else {
      emailEl.classList.remove('is-invalid');
      if (emailErrorEl) {
        emailErrorEl.textContent = '';
        emailErrorEl.classList.remove('visible');
      }
    }

    // Phone validation (optional but format checked if filled)
    const phoneEl = form.elements['phone'];
    const phoneErrorEl = document.getElementById('err-phone');
    if (phoneEl.value.trim()) {
      const phoneClean = phoneEl.value.replace(/[\s\-\(\)\+]/g, '');
      if (phoneClean.length < 7 || !/^\d+$/.test(phoneClean)) {
        errors.phone = 'Please enter a valid phone number (at least 7 digits).';
        phoneEl.classList.add('is-invalid');
        if (phoneErrorEl) {
          phoneErrorEl.textContent = errors.phone;
          phoneErrorEl.classList.add('visible');
        }
        isValid = false;
      } else {
        phoneEl.classList.remove('is-invalid');
        if (phoneErrorEl) {
          phoneErrorEl.textContent = '';
          phoneErrorEl.classList.remove('visible');
        }
      }
    } else {
      phoneEl.classList.remove('is-invalid');
      if (phoneErrorEl) {
        phoneErrorEl.textContent = '';
        phoneErrorEl.classList.remove('visible');
      }
    }

    // Focus first invalid element
    if (!isValid) {
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
    }

    return { isValid, errors };
  }

  return {
    addRow,
    getFormData,
    populateForm,
    resetForm,
    validate
  };
})();
