/**
 * CraftCV - Form Module
 * Dynamic repeatable rows, data extraction, and accessible validation
 */

window.CraftCVForm = window.CVForgeForm = (() => {
  const LABELS = {
    edu: ['Degree / Course', 'College / University', 'Year / Duration', 'Grade / CGPA (optional)'],
    exp: ['Job Title / Role', 'Company / Organization', 'Duration / Dates', 'Key Achievements (one per line)'],
    proj: ['Project Name', 'Tech Stack / Tools', 'Live Link / Year', 'Description & Highlights (one per line)']
  };

  // Profile Photo State
  let currentPhoto = null;
  let currentPhotoShape = 'circle';

  /**
   * Helper: Escape HTML
   */
  const esc = (window.CraftCVRender || window.CVForgeRender).esc;

  /**
   * Update visual photo preview and remove button visibility
   */
  function updatePhotoUI() {
    const previewBox = document.getElementById('photo-preview-box');
    const placeholder = document.getElementById('photo-placeholder');
    const img = document.getElementById('photo-img');
    const removeBtn = document.getElementById('photo-remove-btn');

    if (previewBox) {
      previewBox.classList.toggle('is-rounded', currentPhotoShape === 'rounded');
    }

    if (currentPhoto) {
      if (placeholder) placeholder.style.display = 'none';
      if (img) {
        img.src = currentPhoto;
        img.style.display = 'block';
      }
      if (removeBtn) removeBtn.style.display = 'inline-flex';
    } else {
      if (placeholder) placeholder.style.display = 'block';
      if (img) {
        img.src = '';
        img.style.display = 'none';
      }
      if (removeBtn) removeBtn.style.display = 'none';
    }
  }

  function setPhoto(dataUrl) {
    currentPhoto = dataUrl;
    updatePhotoUI();
  }

  function getPhoto() {
    return currentPhoto;
  }

  function setPhotoShape(shape) {
    currentPhotoShape = (shape === 'rounded' ? 'rounded' : 'circle');
    const radios = document.querySelectorAll('input[name="photoShape"]');
    radios.forEach(r => {
      r.checked = (r.value === currentPhotoShape);
    });
    updatePhotoUI();
  }

  function getPhotoShape() {
    return currentPhotoShape;
  }

  /**
   * Section Reordering Helpers
   */
  function getSectionOrder() {
    const cards = Array.from(document.querySelectorAll('#form [data-section-card]'));
    return cards.map(c => c.dataset.sectionCard);
  }

  function updateReorderButtonsState() {
    const cards = Array.from(document.querySelectorAll('#form [data-section-card]'));
    cards.forEach((card, index) => {
      const upBtn = card.querySelector('[data-reorder="up"]');
      const downBtn = card.querySelector('[data-reorder="down"]');
      if (upBtn) upBtn.disabled = (index === 0);
      if (downBtn) downBtn.disabled = (index === cards.length - 1);
    });
  }

  function reorderSection(sectionId, direction) {
    const card = document.getElementById(`card-${sectionId}`);
    if (!card) return;

    if (direction === 'up') {
      const prev = card.previousElementSibling;
      if (prev && prev.hasAttribute('data-section-card')) {
        card.parentNode.insertBefore(card, prev);
      }
    } else if (direction === 'down') {
      const next = card.nextElementSibling;
      if (next && next.hasAttribute('data-section-card')) {
        card.parentNode.insertBefore(next, card);
      }
    }

    updateReorderButtonsState();
    const app = window.CraftCVApp || window.CVForgeApp;
    if (app && app.onFormChanged) {
      app.onFormChanged();
    }
  }

  function applySectionOrder(orderArray) {
    if (!Array.isArray(orderArray) || !orderArray.length) return;
    const form = document.getElementById('form');
    if (!form) return;

    // Rearrange existing cards in the specified sequence
    const certCard = document.querySelector('#form fieldset:last-of-type');
    orderArray.forEach(id => {
      const card = document.getElementById(`card-${id}`);
      if (card && certCard) {
        form.insertBefore(card, certCard);
      }
    });

    updateReorderButtonsState();
  }

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
      const app = window.CraftCVApp || window.CVForgeApp;
      if (app && app.onFormChanged) {
        app.onFormChanged();
      }
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
      proj: getRowsData('proj'),
      photo: currentPhoto,
      photoShape: currentPhotoShape,
      sectionOrder: getSectionOrder()
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
    setVal('title', data.title || data.role || data.jobTitle);
    setVal('email', data.email);
    setVal('phone', data.phone || data.telephone || data.mobile);
    setVal('loc', data.loc || data.location || data.city || data.address);
    setVal('link', data.link || data.website || data.url || data.portfolio);
    setVal('sum', data.sum || data.summary || data.about || data.profile || data.objective);

    if (Array.isArray(data.skills)) {
      setVal('skills', data.skills.join(', '));
    } else if (typeof data.skills === 'string') {
      setVal('skills', data.skills);
    }

    const langsData = data.langs || data.languages;
    if (Array.isArray(langsData)) {
      setVal('langs', langsData.join(', '));
    } else if (typeof langsData === 'string') {
      setVal('langs', langsData);
    }

    const certsData = data.certs || data.certifications;
    if (Array.isArray(certsData)) {
      setVal('certs', certsData.join('\n'));
    } else if (typeof certsData === 'string') {
      setVal('certs', certsData);
    }

    // Restore Photo & Shape
    if (data.photo !== undefined) {
      setPhoto(data.photo);
    } else {
      setPhoto(null);
    }

    if (data.photoShape) {
      setPhotoShape(data.photoShape);
    } else {
      setPhotoShape('circle');
    }

    // Restore Section Order
    if (Array.isArray(data.sectionOrder) && data.sectionOrder.length) {
      applySectionOrder(data.sectionOrder);
    } else {
      applySectionOrder(['edu', 'exp', 'proj']);
    }

    // Clear dynamic rows
    ['edu', 'exp', 'proj'].forEach(group => {
      const container = document.getElementById(`g-${group}`);
      if (container) container.innerHTML = '';
      const alias = (group === 'edu') ? 'education' : ((group === 'exp') ? 'experience' : 'projects');
      const rawItems = Array.isArray(data[group]) ? data[group] : (Array.isArray(data[alias]) ? data[alias] : []);
      const items = rawItems.map(item => ({
        a: item.a || item.title || item.degree || item.role || item.position || item.name || '',
        b: item.b || item.company || item.school || item.institution || item.college || item.university || item.organization || item.tech || '',
        c: item.c || item.dates || item.duration || item.year || item.link || '',
        d: Array.isArray(item.d || item.bullets || item.highlights)
          ? (item.d || item.bullets || item.highlights).join('\n')
          : (item.d || item.desc || item.description || ''),
        e: item.e || item.grade || item.gpa || item.score || item.marks || ''
      }));
      if (items.length > 0) {
        items.forEach(item => addRow(group, item));
      } else {
        // Add one default empty row
        addRow(group);
      }
    });

    // Sync visual skill toggle pills
    syncSkillPills();
  }

  /**
   * Reset form fields completely
   */
  function resetForm() {
    const form = document.getElementById('form');
    if (form) form.reset();
    setPhoto(null);
    setPhotoShape('circle');
    applySectionOrder(['edu', 'exp', 'proj']);
    ['edu', 'exp', 'proj'].forEach(group => {
      const container = document.getElementById(`g-${group}`);
      if (container) container.innerHTML = '';
      addRow(group);
    });
    syncSkillPills();
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

  /**
   * Helper to parse comma-separated skills from input
   * @returns {string[]}
   */
  function parseCurrentSkills() {
    const input = document.getElementById('inp-skills');
    if (!input || !input.value) return [];
    return input.value.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  }

  /**
   * Synchronize visual active state of skill toggle pills with the current input value
   */
  function syncSkillPills() {
    const container = document.getElementById('skill-pills-container');
    if (!container) return;

    const activeList = parseCurrentSkills();
    const activeLower = activeList.map(s => s.toLowerCase());

    // Update preset pills
    container.querySelectorAll('.skill-toggle-pill').forEach(pill => {
      const skillName = pill.dataset.skill;
      if (!skillName) return;
      const isActive = activeLower.includes(skillName.toLowerCase());
      pill.classList.toggle('active', isActive);
      pill.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // Add custom pills for skills not in preset buttons
    activeList.forEach(skillName => {
      const exists = Array.from(container.querySelectorAll('.skill-toggle-pill')).some(
        p => p.dataset.skill && p.dataset.skill.toLowerCase() === skillName.toLowerCase()
      );
      if (!exists && skillName) {
        const newPill = document.createElement('button');
        newPill.type = 'button';
        newPill.className = 'skill-toggle-pill active';
        newPill.dataset.skill = skillName;
        newPill.dataset.category = 'custom';
        newPill.setAttribute('aria-pressed', 'true');
        newPill.textContent = skillName;
        container.appendChild(newPill);
      }
    });
  }

  /**
   * Initialize Skill and Category Selection Toggles
   */
  function initSkillToggles() {
    const container = document.getElementById('skill-pills-container');
    const skillsInput = document.getElementById('inp-skills');
    const customInput = document.getElementById('inp-custom-skill');
    const addBtn = document.getElementById('btn-add-custom-skill');
    const catPills = document.querySelectorAll('.category-pill');

    if (!container || !skillsInput) return;

    // Toggle pill active on click
    container.addEventListener('click', e => {
      const pill = e.target.closest('.skill-toggle-pill');
      if (!pill) return;

      const skill = pill.dataset.skill.trim();
      const currentList = parseCurrentSkills();
      const index = currentList.findIndex(s => s.toLowerCase() === skill.toLowerCase());

      if (index >= 0) {
        // Toggle off
        currentList.splice(index, 1);
        pill.classList.remove('active');
        pill.setAttribute('aria-pressed', 'false');
        if (pill.dataset.category === 'custom') {
          pill.remove();
        }
      } else {
        // Toggle on
        currentList.push(skill);
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
      }

      skillsInput.value = currentList.join(', ');
      const app = window.CraftCVApp || window.CVForgeApp;
      if (app && app.onFormChanged) {
        app.onFormChanged();
      }
    });

    // Category Tabs Filtering
    catPills.forEach(catBtn => {
      catBtn.addEventListener('click', () => {
        catPills.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        catBtn.classList.add('active');
        catBtn.setAttribute('aria-selected', 'true');

        const targetCat = catBtn.dataset.cat;
        container.querySelectorAll('.skill-toggle-pill').forEach(pill => {
          if (targetCat === 'all' || pill.dataset.category === targetCat || (targetCat === 'all' && pill.dataset.category === 'custom')) {
            pill.style.display = 'inline-flex';
          } else {
            pill.style.display = 'none';
          }
        });
      });
    });

    // Custom Skill Adder
    const handleAddCustom = () => {
      if (!customInput) return;
      const skillName = customInput.value.trim();
      if (!skillName) return;

      const currentList = parseCurrentSkills();
      if (!currentList.some(s => s.toLowerCase() === skillName.toLowerCase())) {
        currentList.push(skillName);
        skillsInput.value = currentList.join(', ');
        syncSkillPills();
        const app = window.CraftCVApp || window.CVForgeApp;
        if (app && app.onFormChanged) {
          app.onFormChanged();
        }
      }
      customInput.value = '';
    };

    addBtn?.addEventListener('click', handleAddCustom);
    customInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustom();
      }
    });

    // Sync when user types directly in skillsInput
    skillsInput.addEventListener('input', () => {
      syncSkillPills();
    });

    // Initial sync
    syncSkillPills();
  }

  return {
    addRow,
    getFormData,
    populateForm,
    resetForm,
    validate,
    setPhoto,
    getPhoto,
    setPhotoShape,
    getPhotoShape,
    reorderSection,
    getSectionOrder,
    applySectionOrder,
    updateReorderButtonsState,
    initSkillToggles,
    syncSkillPills
  };
})();
