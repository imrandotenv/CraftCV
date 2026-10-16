/**
 * CraftCV - Render Module
 * Builds sanitized, accessible CV HTML from user data
 */

window.CraftCVRender = window.CVForgeRender = (() => {
  /**
   * Escape special HTML characters to prevent XSS
   * @param {string} str 
   * @returns {string}
   */
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, c => {
      switch (c) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return c;
      }
    });
  }

  /**
   * Convert multiline text or array into bullet list items
   * @param {string|Array<string>} content 
   * @returns {string}
   */
  function renderBullets(content) {
    if (!content) return '';
    let items = [];
    if (Array.isArray(content)) {
      items = content.map(item => String(item).trim()).filter(Boolean);
    } else {
      items = String(content)
        .split('\n')
        .map(line => line.trim().replace(/^[•\-\*]\s*/, ''))
        .filter(Boolean);
    }
    if (!items.length) return '';
    return `<ul>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
  }

  /**
   * Build a single resume entry (Job, Project, Education)
   * Supports both short keys (a, b, c, d, e) and semantic schema keys (title, company, etc.)
   * @param {Object} item 
   * @param {string} [subtitle] 
   * @returns {string}
   */
  function renderItem(item, subtitle) {
    if (!item) return '';

    const title = item.a || item.title || item.degree || item.role || item.position || item.name || item.jobTitle || item.header || '';
    const org = item.b || item.company || item.school || item.institution || item.college || item.university || item.organization || item.tech || item.stack || '';
    const dates = item.c || item.dates || item.duration || item.year || item.time || item.link || '';
    const details = item.d || item.desc || item.description || item.bullets || item.highlights || item.details || '';
    const grade = item.e || item.grade || item.gpa || item.score || item.marks || '';

    const primaryText = title || org;
    if (!primaryText) return '';

    // If subtitle parameter is explicitly provided, use it; otherwise compute from secondary fields
    let subText = subtitle;
    if (subText === undefined) {
      const parts = [org !== primaryText ? org : '', dates, grade].filter(Boolean);
      subText = parts.join(' · ');
    }

    const bulletsHtml = renderBullets(details);
    const subHtml = subText ? `<span>${esc(subText)}</span>` : '';
    return `<div class="it"><b>${esc(primaryText)}</b>${subHtml}${bulletsHtml}</div>`;
  }

  /**
   * Build a semantic resume section if content is non-empty
   * @param {string} title 
   * @param {string} contentHtml 
   * @param {string} [sectionClass]
   * @returns {string}
   */
  function renderSection(title, contentHtml, sectionClass = '') {
    if (!contentHtml || !contentHtml.trim()) return '';
    const cls = sectionClass ? `cv-section ${sectionClass}` : 'cv-section';
    return `<section class="${cls}"><h3>${esc(title)}</h3>${contentHtml}</section>`;
  }

  /**
   * Build unstyled 'Raw' resume template HTML with zero layout
   * Sequential <h1>, <h2>, <ul>, and <p> tags for basic mode demonstration
   * @param {Object} data
   * @returns {string}
   */
  function buildRawResumeHtml(data) {
    data = data || {};
    const name = esc(data.name || 'Your Name');
    const title = esc(data.title || data.role || data.jobTitle || '');

    const contactParts = [
      data.email ? esc(data.email) : '',
      data.phone || data.telephone || data.mobile ? esc(data.phone || data.telephone || data.mobile) : '',
      data.loc || data.location || data.city ? esc(data.loc || data.location || data.city) : '',
      data.link || data.website || data.url ? esc(data.link || data.website || data.url) : ''
    ].filter(Boolean);

    let sumText = data.sum || data.summary || data.about || data.profile || data.objective || '';
    let eduList = Array.isArray(data.edu) ? data.edu : (Array.isArray(data.education) ? data.education : []);
    let expList = Array.isArray(data.exp) ? data.exp : (Array.isArray(data.experience) ? data.experience : (Array.isArray(data.work) ? data.work : []));
    let projList = Array.isArray(data.proj) ? data.proj : (Array.isArray(data.projects) ? data.projects : []);
    const rawSkills = data.skills || [];
    const skills = Array.isArray(rawSkills) ? rawSkills : String(rawSkills).split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    const rawLangs = data.langs || data.languages || [];
    const langs = Array.isArray(rawLangs) ? rawLangs : String(rawLangs).split(/[,\n]/).map(l => l.trim()).filter(Boolean);
    const rawCerts = data.certs || data.certifications || [];
    const certs = Array.isArray(rawCerts) ? rawCerts : String(rawCerts).split('\n').map(c => c.trim()).filter(Boolean);

    // Fallbacks if completely empty
    if (!sumText && !eduList.length && !expList.length && !projList.length) {
      sumText = 'Dedicated and results-oriented professional with a solid technical foundation, strong analytical skills, and a commitment to engineering high-quality solutions.';
      eduList = [{ a: 'Bachelor of Technology in Computer Science', b: 'Government Engineering College', c: '2023 - 2027', e: 'CGPA 8.4' }];
      expList = [{ a: 'Web Development Intern', b: 'Apex Tech Solutions', c: '2025', d: 'Built responsive user interfaces and modern web components\nCollaborated with agile engineering teams using Git' }];
    }

    let html = `<h1>${name}</h1>`;
    if (title || contactParts.length) {
      const headerLine = [title, contactParts.join(' | ')].filter(Boolean).join(' - ');
      html += `<p>${headerLine}</p>`;
    }

    if (sumText) {
      html += `<h2>Summary</h2><p>${esc(sumText)}</p>`;
    }

    if (expList.length) {
      html += `<h2>Experience</h2>`;
      expList.forEach(item => {
        const role = esc(item.a || item.title || item.role || item.position || '');
        const company = esc(item.b || item.company || item.organization || '');
        const dates = esc(item.c || item.dates || item.duration || item.year || '');
        const details = item.d || item.desc || item.description || item.bullets || '';
        html += `<p><strong>${role}</strong>${company ? ` - ${company}` : ''}${dates ? ` (${dates})` : ''}</p>`;
        const bullets = String(details).split('\n').map(l => l.trim().replace(/^[•\-\*]\s*/, '')).filter(Boolean);
        if (bullets.length) {
          html += `<ul>${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
        }
      });
    }

    if (eduList.length) {
      html += `<h2>Education</h2>`;
      eduList.forEach(item => {
        const degree = esc(item.a || item.degree || item.course || '');
        const school = esc(item.b || item.school || item.college || item.university || '');
        const year = esc(item.c || item.year || item.dates || '');
        const grade = esc(item.e || item.grade || item.gpa || item.marks || '');
        html += `<p><strong>${degree}</strong>${school ? ` - ${school}` : ''}${year ? ` (${year})` : ''}${grade ? ` - ${grade}` : ''}</p>`;
      });
    }

    if (skills.length || langs.length) {
      html += `<h2>Skills &amp; Languages</h2>`;
      if (skills.length) {
        html += `<p><strong>Skills:</strong> ${skills.map(esc).join(', ')}</p>`;
      }
      if (langs.length) {
        html += `<p><strong>Languages:</strong> ${langs.map(esc).join(', ')}</p>`;
      }
    }

    if (projList.length) {
      html += `<h2>Projects</h2>`;
      projList.forEach(item => {
        const pName = esc(item.a || item.title || item.name || '');
        const tech = esc(item.b || item.tech || item.stack || '');
        const link = esc(item.c || item.link || item.year || '');
        const desc = item.d || item.desc || item.description || '';
        html += `<p><strong>${pName}</strong>${tech ? ` [${tech}]` : ''}${link ? ` (${link})` : ''}</p>`;
        const bullets = String(desc).split('\n').map(l => l.trim().replace(/^[•\-\*]\s*/, '')).filter(Boolean);
        if (bullets.length) {
          html += `<ul>${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
        }
      });
    }

    if (certs.length) {
      html += `<h2>Certifications</h2><ul>${certs.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`;
    }

    return html;
  }

  /**
   * Build the complete CV HTML representation
   * Guarantees that Summary, Education, and Experience sections are appended to <main>
   * @param {Object} data 
   * @returns {string}
   */
  function buildResumeHtml(data) {
    data = data || {};
    const isBasicMode = Boolean(
      data.isBasicMode ||
      data.theme === 'raw' ||
      (typeof document !== 'undefined' && document.body && document.body.classList && document.body.classList.contains('basic-mode')) ||
      (typeof localStorage !== 'undefined' && (localStorage.getItem('craftcv_smart_mode') === 'basic' || localStorage.getItem('craftcv_smart_mode') === 'off' || localStorage.getItem('craftcv_smart_mode') === 'false' || localStorage.getItem('craftcv_smart_mode') === '0'))
    );
    if (isBasicMode) {
      return buildRawResumeHtml(data);
    }

    const name = esc(data.name || 'Your Name');
    const title = esc(data.title || data.role || data.jobTitle || '');
    
    // Contact information
    const email = data.email || '';
    const phone = data.phone || data.telephone || data.mobile || '';
    const loc = data.loc || data.location || data.city || data.address || '';
    const link = data.link || data.website || data.url || data.portfolio || '';

    const contactItems = [
      email ? `<li>✉ ${esc(email)}</li>` : '',
      phone ? `<li>☎ ${esc(phone)}</li>` : '',
      loc ? `<li>📍 ${esc(loc)}</li>` : '',
      link ? `<li>🔗 ${esc(link)}</li>` : ''
    ].filter(Boolean).join('');
    
    const contactHtml = contactItems ? `<ul class="p">${contactItems}</ul>` : '';

    // Skills & Languages tags
    const rawSkills = data.skills || [];
    const skills = Array.isArray(rawSkills) ? rawSkills : String(rawSkills).split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    const skillsHtml = skills.length ? `<ul class="tags">${skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : '';

    const rawLangs = data.langs || data.languages || [];
    const langs = Array.isArray(rawLangs) ? rawLangs : String(rawLangs).split(/[,\n]/).map(l => l.trim()).filter(Boolean);
    const langsHtml = langs.length ? `<ul class="p">${langs.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : '';

    // Certifications
    const rawCerts = data.certs || data.certifications || [];
    const certs = Array.isArray(rawCerts) ? rawCerts : String(rawCerts).split('\n').map(c => c.trim()).filter(Boolean);
    const certsHtml = certs.length ? `<ul>${certs.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : '';

    // Repeatable groups with robust normalization
    let eduList = Array.isArray(data.edu) ? data.edu : (Array.isArray(data.education) ? data.education : []);
    let expList = Array.isArray(data.exp) ? data.exp : (Array.isArray(data.experience) ? data.experience : (Array.isArray(data.work) ? data.work : []));
    let projList = Array.isArray(data.proj) ? data.proj : (Array.isArray(data.projects) ? data.projects : []);
    let sumText = data.sum || data.summary || data.about || data.profile || data.objective || '';

    // If main content body is completely blank (e.g. initial generation before typing),
    // provide clean fallback entries so the CV body is never missing or invisible
    const isMainCompletelyEmpty = !sumText && !eduList.length && !expList.length && !projList.length;
    if (isMainCompletelyEmpty) {
      sumText = 'Dedicated and results-oriented professional with a solid technical foundation, strong analytical skills, and a commitment to engineering high-quality solutions.';
      eduList = [
        { a: 'Bachelor of Technology in Computer Science', b: 'Government Engineering College', c: '2023 - 2027', e: 'CGPA 8.4' }
      ];
      expList = [
        { a: 'Web Development Intern', b: 'Apex Tech Solutions', c: '2025', d: 'Built responsive user interfaces and modern web components\nCollaborated with agile engineering teams using Git' }
      ];
    }

    const eduHtml = eduList
      .map(o => renderItem(o, [o.b || o.school || o.institution || o.college || o.university, o.c || o.year || o.dates || o.duration, o.e || o.grade || o.gpa || o.score || o.marks].filter(Boolean).join(' · ')))
      .join('');

    const expHtml = expList
      .map(o => renderItem(o, [o.b || o.company || o.organization || o.org, o.c || o.dates || o.duration || o.year].filter(Boolean).join(' · ')))
      .join('');

    const projHtml = projList
      .map(o => renderItem(o, [o.b || o.tech || o.stack || o.tools, o.c || o.link || o.year || o.dates].filter(Boolean).join(' · ')))
      .join('');

    const sumHtml = sumText ? `<p>${esc(sumText)}</p>` : '';

    // Avatar / Photo slot
    const initials = (data.name || 'CV')
      .split(' ')
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const shapeClass = (data.photoShape === 'rounded') ? ' is-rounded' : '';
    const avatarHtml = `
      <div class="avatar-slot">
        <div class="avatar-circle${shapeClass}">
          ${data.photo ? `<img src="${esc(data.photo)}" alt="${name}" class="avatar-img">` : `<span class="avatar-initials">${esc(initials)}</span>`}
        </div>
      </div>
    `;

    // Dynamic Section Ordering (Education, Experience, Projects, Summary)
    const sectionsMap = {
      edu: renderSection('Education', eduHtml, 'cv-sec-education'),
      education: renderSection('Education', eduHtml, 'cv-sec-education'),
      exp: renderSection('Experience', expHtml, 'cv-sec-experience'),
      experience: renderSection('Experience', expHtml, 'cv-sec-experience'),
      work: renderSection('Experience', expHtml, 'cv-sec-experience'),
      proj: renderSection('Projects', projHtml, 'cv-sec-projects'),
      projects: renderSection('Projects', projHtml, 'cv-sec-projects'),
      sum: renderSection('Summary', sumHtml, 'cv-sec-summary'),
      summary: renderSection('Summary', sumHtml, 'cv-sec-summary')
    };

    let order = ['edu', 'exp', 'proj'];
    if (Array.isArray(data.sectionOrder) && data.sectionOrder.length) {
      order = data.sectionOrder.map(k => String(k).toLowerCase());
      // Guarantee standard content sections are not silently dropped if missing from custom order
      ['edu', 'exp', 'proj'].forEach(stdKey => {
        const matches = order.some(k => k === stdKey || (stdKey === 'edu' && k === 'education') || (stdKey === 'exp' && (k === 'experience' || k === 'work')) || (stdKey === 'proj' && k === 'projects'));
        if (!matches) {
          order.push(stdKey);
        }
      });
    }

    const renderedKeys = new Set();
    const dynamicSectionsList = [];

    // If order does not explicitly position summary, place summary at the top of main
    const hasExplicitSummary = order.some(k => k === 'sum' || k === 'summary');
    if (!hasExplicitSummary && sumHtml) {
      dynamicSectionsList.push(renderSection('Summary', sumHtml, 'cv-sec-summary'));
    }

    order.forEach(k => {
      const canonicalKey = (k === 'education') ? 'edu' : ((k === 'experience' || k === 'work') ? 'exp' : ((k === 'projects') ? 'proj' : ((k === 'summary') ? 'sum' : k)));
      if (renderedKeys.has(canonicalKey)) return;
      renderedKeys.add(canonicalKey);

      const html = sectionsMap[k] || sectionsMap[canonicalKey];
      if (html) {
        dynamicSectionsList.push(html);
      }
    });

    const certsSectionHtml = renderSection('Certifications', certsHtml, 'cv-sec-certifications');

    return `
      <header>
        <h1>${name}</h1>
        ${title ? `<p class="role">${title}</p>` : ''}
      </header>
      <aside>
        ${avatarHtml}
        ${renderSection('Contact', contactHtml, 'cv-sec-contact')}
        ${renderSection('Skills', skillsHtml, 'cv-sec-skills')}
        ${renderSection('Languages', langsHtml, 'cv-sec-languages')}
      </aside>
      <main class="cv-main" id="cv-main">
        ${dynamicSectionsList.join('')}
        ${certsSectionHtml}
      </main>
    `;
  }

  const A4_HEIGHT_PX = 1122; // Standard A4 pixel height at 96 DPI (approx 1122px)

  /**
   * Render resume to DOM target container
   * @param {HTMLElement} container 
   * @param {Object} data 
   */
  function renderToElement(container, data) {
    if (!container) return;
    data = data || {};
    const isBasicMode = Boolean(
      data.isBasicMode ||
      data.theme === 'raw' ||
      (typeof document !== 'undefined' && document.body && document.body.classList && document.body.classList.contains('basic-mode')) ||
      (typeof localStorage !== 'undefined' && (localStorage.getItem('craftcv_smart_mode') === 'basic' || localStorage.getItem('craftcv_smart_mode') === 'off' || localStorage.getItem('craftcv_smart_mode') === 'false' || localStorage.getItem('craftcv_smart_mode') === '0'))
    );

    if (isBasicMode) {
      container.className = 'sheet t-raw basic-raw-template';
      container.style.removeProperty('--sheet-font-size');
      container.style.transform = '';
      container.style.transformOrigin = '';
      container.innerHTML = buildRawResumeHtml(data);
      return;
    }

    const theme = data.theme || 'classic';
    const hasPhoto = Boolean(data.photo);
    const fitOnePage = Boolean(data.fitOnePage);

    container.className = `sheet t-${theme}${hasPhoto ? ' has-photo' : ''}${fitOnePage ? ' fit-one-page' : ''}`;
    
    if (data.fontSize) {
      container.style.setProperty('--sheet-font-size', `${data.fontSize}pt`);
    } else {
      container.style.removeProperty('--sheet-font-size');
    }

    container.innerHTML = buildResumeHtml(data);

    // Dynamic scale calculation for Fit to One Page
    if (fitOnePage) {
      container.style.transform = '';
      container.style.transformOrigin = '';
      const scrollHeight = container.scrollHeight;
      if (scrollHeight > A4_HEIGHT_PX) {
        const scale = A4_HEIGHT_PX / scrollHeight;
        container.style.transformOrigin = 'top left';
        container.style.transform = `scale(${scale})`;
      } else {
        container.style.transform = '';
        container.style.transformOrigin = '';
      }
    } else {
      container.style.transform = '';
      container.style.transformOrigin = '';
    }
  }

  /**
   * Real-time update of specific text nodes or HTML elements in the CV template
   * @param {HTMLElement} container - The #cv container element
   * @param {string} fieldName - Field name (name, title, sum, email, phone, loc, link)
   * @param {*} value - Field value
   */
  function updateLiveNode(container, fieldName, value) {
    if (!container) return;
    const escVal = esc(value);
    switch (fieldName) {
      case 'name': {
        const h1 = container.querySelector('header h1');
        if (h1) h1.textContent = value || 'Your Name';
        break;
      }
      case 'title': {
        let role = container.querySelector('header .role');
        if (value) {
          if (!role) {
            role = document.createElement('p');
            role.className = 'role';
            container.querySelector('header')?.appendChild(role);
          }
          role.textContent = value;
        } else if (role) {
          role.remove();
        }
        break;
      }
      case 'sum': {
        const sumSec = container.querySelector('.cv-sec-summary');
        if (value) {
          if (sumSec) {
            const p = sumSec.querySelector('p');
            if (p) p.textContent = value;
          } else {
            const main = container.querySelector('main, .cv-main');
            if (main) {
              const secHtml = renderSection('Summary', `<p>${escVal}</p>`, 'cv-sec-summary');
              main.insertAdjacentHTML('afterbegin', secHtml);
            }
          }
        } else if (sumSec) {
          sumSec.remove();
        }
        break;
      }
      default:
        break;
    }
  }

  return {
    esc,
    renderBullets,
    renderItem,
    renderSection,
    buildResumeHtml,
    buildRawResumeHtml,
    renderToElement,
    updateLiveNode,
    A4_HEIGHT_PX
  };
})();

