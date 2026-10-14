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
   * Convert multiline text into bullet list items
   * @param {string} text 
   * @returns {string}
   */
  function renderBullets(text) {
    if (!text) return '';
    const items = String(text)
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    if (!items.length) return '';
    return `<ul>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
  }

  /**
   * Build a single resume entry (Job, Project, Education)
   * @param {Object} item 
   * @param {string} subtitle 
   * @returns {string}
   */
  function renderItem(item, subtitle) {
    if (!item.a && !item.b) return '';
    const bulletsHtml = item.d ? renderBullets(item.d) : '';
    const subHtml = subtitle ? `<span>${esc(subtitle)}</span>` : '';
    return `<div class="it"><b>${esc(item.a || item.b)}</b>${subHtml}${bulletsHtml}</div>`;
  }

  /**
   * Build a semantic resume section if content is non-empty
   * @param {string} title 
   * @param {string} contentHtml 
   * @returns {string}
   */
  function renderSection(title, contentHtml) {
    if (!contentHtml || !contentHtml.trim()) return '';
    return `<section><h3>${esc(title)}</h3>${contentHtml}</section>`;
  }

  /**
   * Build the complete CV HTML representation
   * @param {Object} data 
   * @returns {string}
   */
  function buildResumeHtml(data) {
    const name = esc(data.name || 'Your Name');
    const title = esc(data.title || '');
    
    // Contact information
    const contactItems = [
      data.email ? `<li>✉ ${esc(data.email)}</li>` : '',
      data.phone ? `<li>☎ ${esc(data.phone)}</li>` : '',
      data.loc ? `<li>📍 ${esc(data.loc)}</li>` : '',
      data.link ? `<li>🔗 ${esc(data.link)}</li>` : ''
    ].filter(Boolean).join('');
    
    const contactHtml = contactItems ? `<ul class="p">${contactItems}</ul>` : '';

    // Skills & Languages tags
    const skills = Array.isArray(data.skills) ? data.skills : [];
    const skillsHtml = skills.length ? `<ul class="tags">${skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : '';

    const langs = Array.isArray(data.langs) ? data.langs : [];
    const langsHtml = langs.length ? `<ul class="p">${langs.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : '';

    // Certifications
    const certs = Array.isArray(data.certs) ? data.certs : [];
    const certsHtml = certs.length ? `<ul>${certs.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : '';

    // Repeatable groups
    const edu = Array.isArray(data.edu) ? data.edu : [];
    const exp = Array.isArray(data.exp) ? data.exp : [];
    const proj = Array.isArray(data.proj) ? data.proj : [];

    const eduHtml = edu
      .map(o => renderItem(o, [o.b, o.c, o.e].filter(Boolean).join(' · ')))
      .join('');

    const expHtml = exp
      .map(o => renderItem(o, [o.b, o.c].filter(Boolean).join(' · ')))
      .join('');

    const projHtml = proj
      .map(o => renderItem(o, [o.b, o.c].filter(Boolean).join(' · ')))
      .join('');

    const sumHtml = data.sum ? `<p>${esc(data.sum)}</p>` : '';

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

    // Dynamic Section Ordering (Education, Experience, Projects)
    const sectionsMap = {
      edu: renderSection('Education', eduHtml),
      exp: renderSection('Experience', expHtml),
      proj: renderSection('Projects', projHtml)
    };
    const order = Array.isArray(data.sectionOrder) && data.sectionOrder.length ? data.sectionOrder : ['edu', 'exp', 'proj'];
    const dynamicSectionsHtml = order.map(k => sectionsMap[k] || '').join('');

    return `
      <header>
        <h1>${name}</h1>
        ${title ? `<p class="role">${title}</p>` : ''}
      </header>
      <aside>
        ${avatarHtml}
        ${renderSection('Contact', contactHtml)}
        ${renderSection('Skills', skillsHtml)}
        ${renderSection('Languages', langsHtml)}
      </aside>
      <main>
        ${renderSection('Summary', sumHtml)}
        ${dynamicSectionsHtml}
        ${renderSection('Certifications', certsHtml)}
      </main>
    `;
  }

  /**
   * Render resume to DOM target container
   * @param {HTMLElement} container 
   * @param {Object} data 
   */
  function renderToElement(container, data) {
    if (!container) return;
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
  }

  return {
    esc,
    buildResumeHtml,
    renderToElement
  };
})();
