/**
 * CVForge - ATS Scoring Module
 * Pure functions for ATS analysis, Job Description keyword matching, and Action-Verb auditing
 * SPEC SECTION 7 COMPLIANT
 */

window.CVForgeATS = (() => {
  // Common English stopwords to filter out during JD keyword extraction
  const STOPWORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    'arent', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
    'by', 'can', 'cant', 'cannot', 'could', 'couldn', 'couldnt', 'did', 'didn', 'didnt', 'do', 'does',
    'doesn', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
    'hadn', 'has', 'hasn', 'have', 'haven', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
    'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn', 'it', 'its', 'itself', 'just', 'me',
    'more', 'most', 'must', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
    'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some',
    'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
    'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn', 'we',
    'were', 'weren', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with',
    'would', 'you', 'your', 'yours', 'yourself', 'yourselves', 'also', 'must', 'shall', 'candidate',
    'role', 'responsibilities', 'requirements', 'qualifications', 'years', 'experience', 'work', 'working',
    'looking', 'ability', 'skills', 'plus', 'preferred', 'opportunity', 'team', 'ideal', 'apply'
  ]);

  // Verified strong action verbs favored by Fortune 500 ATS systems
  const STRONG_VERBS = [
    'built', 'led', 'designed', 'optimized', 'optimised', 'engineered', 'developed',
    'spearheaded', 'implemented', 'architected', 'created', 'achieved', 'formulated',
    'orchestrated', 'streamlined', 'automated', 'delivered', 'initiated', 'pioneered',
    'researched', 'reduced', 'increased', 'enhanced', 'expanded', 'accelerated', 'authored',
    'deployed', 'executed', 'established', 'generated', 'modernized', 'modernised', 'resolved',
    'transformed', 'trained', 'mentored', 'directed', 'championed', 'negotiated', 'programmed'
  ];

  // Weak/passive phrases to detect and suggest replacements for
  const WEAK_PHRASES = [
    { phrase: 'responsible for', suggestions: ['Spearheaded', 'Engineered', 'Orchestrated', 'Delivered'] },
    { phrase: 'worked on', suggestions: ['Architected', 'Constructed', 'Built', 'Implemented'] },
    { phrase: 'helped with', suggestions: ['Collaborated on', 'Accelerated', 'Facilitated'] },
    { phrase: 'assisted in', suggestions: ['Supported', 'Contributed to', 'Co-developed'] },
    { phrase: 'assisted with', suggestions: ['Facilitated', 'Streamlined', 'Enhanced'] },
    { phrase: 'handled', suggestions: ['Administered', 'Managed', 'Resolved', 'Executed'] },
    { phrase: 'tasks included', suggestions: ['Accomplished', 'Pioneered', 'Delivered'] },
    { phrase: 'duties included', suggestions: ['Championed', 'Executed', 'Oversaw'] },
    { phrase: 'participated in', suggestions: ['Contributed to', 'Partnered in', 'Engaged in'] },
    { phrase: 'involved in', suggestions: ['Key driver of', 'Co-created', 'Spearheaded'] }
  ];

  /**
   * Flatten all resume content into a single searchable text string
   * @param {Object} data 
   * @returns {string}
   */
  function extractFullText(data) {
    const parts = [
      data.name,
      data.title,
      data.email,
      data.phone,
      data.loc,
      data.link,
      data.sum,
      Array.isArray(data.skills) ? data.skills.join(' ') : data.skills,
      Array.isArray(data.langs) ? data.langs.join(' ') : data.langs,
      Array.isArray(data.certs) ? data.certs.join(' ') : data.certs
    ];

    ['edu', 'exp', 'proj'].forEach(g => {
      const items = Array.isArray(data[g]) ? data[g] : [];
      items.forEach(it => {
        parts.push(it.a, it.b, it.c, it.d, it.e);
      });
    });

    return parts.filter(Boolean).join(' ');
  }

  /**
   * Extract all bullet lines from experience and projects
   * @param {Object} data 
   * @returns {Array<string>}
   */
  function extractAllBullets(data) {
    const bullets = [];
    ['exp', 'proj'].forEach(g => {
      const items = Array.isArray(data[g]) ? data[g] : [];
      items.forEach(it => {
        if (it.d) {
          it.d.split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .forEach(b => bullets.push(b));
        }
      });
    });
    return bullets;
  }

  /**
   * Audit bullet points for passive/weak phrasing
   * @param {Array<string>} bullets 
   * @returns {Array<Object>}
   */
  function auditActionVerbs(bullets) {
    const findings = [];

    bullets.forEach(bullet => {
      const lower = bullet.toLowerCase();
      WEAK_PHRASES.forEach(({ phrase, suggestions }) => {
        if (lower.includes(phrase)) {
          findings.push({
            originalBullet: bullet,
            weakPhrase: phrase,
            suggestions
          });
        }
      });
    });

    return findings;
  }

  /**
   * Match resume text against a pasted Job Description
   * @param {string} resumeText 
   * @param {string} jobDescription 
   * @returns {Object}
   */
  function matchJobDescription(resumeText, jobDescription) {
    if (!jobDescription || !jobDescription.trim()) {
      return { percentage: 0, matched: [], missing: [], totalKeywords: 0 };
    }

    const resumeLower = resumeText.toLowerCase();

    // Extract raw alphanumeric tokens from JD (length >= 3)
    const tokens = jobDescription
      .toLowerCase()
      .replace(/[^a-z0-9+#\s]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length >= 3 && !STOPWORDS.has(t) && !/^\d+$/.test(t));

    // Unique keywords list
    const uniqueKeywords = [...new Set(tokens)];
    if (!uniqueKeywords.length) {
      return { percentage: 0, matched: [], missing: [], totalKeywords: 0 };
    }

    const matched = [];
    const missing = [];

    uniqueKeywords.forEach(kw => {
      // Regex boundary check or direct inclusion for tech tags like c++, c#
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(resumeLower) || resumeLower.includes(kw)) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    });

    const percentage = Math.round((matched.length / uniqueKeywords.length) * 100);

    return {
      percentage,
      matched: matched.slice(0, 30),
      missing: missing.slice(0, 30),
      totalKeywords: uniqueKeywords.length
    };
  }

  /**
   * Comprehensive ATS Resume Scoring Function (Pure Function)
   * Evaluates resume data against the 8 competition criteria (Total: 100 points)
   * @param {Object} data - Structured resume data
   * @param {string} [jobDescription] - Optional JD text
   * @returns {{ total: number, breakdown: Array<Object>, tips: Array<string>, match: Object, weakVerbs: Array<Object> }}
   */
  function scoreResume(data, jobDescription = '') {
    const breakdown = [];
    const tips = [];
    let total = 0;

    const fullText = extractFullText(data);
    const bullets = extractAllBullets(data);
    const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;

    // 1. Contact info complete (15 points)
    const hasEmail = Boolean(data.email && data.email.trim());
    const hasPhone = Boolean(data.phone && data.phone.trim());
    const hasLoc = Boolean(data.loc && data.loc.trim());
    const contactPass = hasEmail && hasPhone && hasLoc;

    if (contactPass) {
      total += 15;
      breakdown.push({ name: 'Contact info complete', points: 15, max: 15, passed: true });
    } else {
      breakdown.push({ name: 'Contact info complete', points: 0, max: 15, passed: false });
      tips.push('Add your email, phone number, and location so recruiters and ATS filters can reach you.');
    }

    // 2. Summary present (10 points): 25 to 80 words
    const sumWords = (data.sum || '').trim().split(/\s+/).filter(Boolean).length;
    const summaryPass = sumWords >= 25 && sumWords <= 80;

    if (summaryPass) {
      total += 10;
      breakdown.push({ name: 'Professional summary (25-80 words)', points: 10, max: 10, passed: true });
    } else {
      breakdown.push({ name: 'Professional summary (25-80 words)', points: 0, max: 10, passed: false });
      if (sumWords === 0) {
        tips.push('Write a professional summary between 25 and 80 words highlighting your strengths.');
      } else if (sumWords < 25) {
        tips.push(`Expand your summary to at least 25 words (currently ${sumWords} words).`);
      } else {
        tips.push(`Condense your summary to under 80 words for optimal single-page readability (currently ${sumWords} words).`);
      }
    }

    // 3. Skills listed (15 points): at least 6 skills
    const skillsCount = Array.isArray(data.skills) ? data.skills.length : 0;
    const skillsPass = skillsCount >= 6;

    if (skillsPass) {
      total += 15;
      breakdown.push({ name: 'Skills listed (6+ skills)', points: 15, max: 15, passed: true });
    } else {
      breakdown.push({ name: 'Skills listed (6+ skills)', points: 0, max: 15, passed: false });
      tips.push(`List at least 6 key skills (currently ${skillsCount}); include relevant tools, frameworks, and programming languages.`);
    }

    // 4. Experience or projects (20 points): at least 2 entries with 2+ bullets
    let entriesWithBullets = 0;
    ['exp', 'proj'].forEach(g => {
      const items = Array.isArray(data[g]) ? data[g] : [];
      items.forEach(it => {
        if (it.d) {
          const itemBullets = it.d.split('\n').map(l => l.trim()).filter(Boolean);
          if (itemBullets.length >= 2) {
            entriesWithBullets++;
          }
        }
      });
    });
    const expProjPass = entriesWithBullets >= 2;

    if (expProjPass) {
      total += 20;
      breakdown.push({ name: 'Experience / Projects (2+ entries with 2+ bullets)', points: 20, max: 20, passed: true });
    } else {
      breakdown.push({ name: 'Experience / Projects (2+ entries with 2+ bullets)', points: 0, max: 20, passed: false });
      tips.push('Include at least 2 experience or project entries, each detailing at least 2 bullet points.');
    }

    // 5. Quantified achievements (15 points): bullets containing numbers or %
    const quantifiedBullets = bullets.filter(b => /\d+|%/.test(b));
    const quantifiedPass = quantifiedBullets.length >= 2;

    if (quantifiedPass) {
      total += 15;
      breakdown.push({ name: 'Quantified achievements (metrics & %)', points: 15, max: 15, passed: true });
    } else {
      breakdown.push({ name: 'Quantified achievements (metrics & %)', points: 0, max: 15, passed: false });
      tips.push("Add numbers or percentages to at least 2 bullets (e.g., 'reduced page load time by 30%', 'collaborated with a team of 4').");
    }

    // 6. Strong action verbs (10 points): bullets starting with strong action verbs
    const verbMatches = bullets.filter(b => {
      const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
      return STRONG_VERBS.includes(firstWord);
    });
    const actionVerbsPass = verbMatches.length >= 2;

    if (actionVerbsPass) {
      total += 10;
      breakdown.push({ name: 'Strong action verbs', points: 10, max: 10, passed: true });
    } else {
      breakdown.push({ name: 'Strong action verbs', points: 0, max: 10, passed: false });
      tips.push("Start achievement bullets with power action verbs (e.g., 'Built', 'Led', 'Designed', 'Optimized', 'Engineered').");
    }

    // 7. Education present (5 points): at least 1 entry
    const eduCount = Array.isArray(data.edu) ? data.edu.filter(e => e.a || e.b).length : 0;
    const eduPass = eduCount >= 1;

    if (eduPass) {
      total += 5;
      breakdown.push({ name: 'Education present', points: 5, max: 5, passed: true });
    } else {
      breakdown.push({ name: 'Education present', points: 0, max: 5, passed: false });
      tips.push('Add at least 1 education entry with your degree, college, or school.');
    }

    // 8. Length sanity (10 points): total words between 250 and 700
    const lengthPass = wordCount >= 250 && wordCount <= 700;

    if (lengthPass) {
      total += 10;
      breakdown.push({ name: 'Word count sanity (250-700 words)', points: 10, max: 10, passed: true });
    } else {
      breakdown.push({ name: 'Word count sanity (250-700 words)', points: 0, max: 10, passed: false });
      if (wordCount < 250) {
        tips.push(`Add more depth: total word count is ${wordCount} words (recommended minimum: 250 words).`);
      } else {
        tips.push(`Tighten your content: total word count is ${wordCount} words (recommended maximum: 700 words to ensure 1-page fit).`);
      }
    }

    // Match against Job Description if provided
    const match = matchJobDescription(fullText, jobDescription);
    if (jobDescription && jobDescription.trim()) {
      if (match.percentage < 50) {
        tips.push(`Job description match is currently ${match.percentage}%. Incorporate missing keywords like ${match.missing.slice(0, 3).map(k => `'${k}'`).join(', ')}.`);
      }
    }

    // Audit for passive phrases
    const weakVerbs = auditActionVerbs(bullets);
    if (weakVerbs.length > 0) {
      tips.push(`Found ${weakVerbs.length} passive phrase(s) such as '${weakVerbs[0].weakPhrase}'. Replace with '${weakVerbs[0].suggestions[0]}'.`);
    }

    return {
      total,
      breakdown,
      tips,
      match,
      weakVerbs,
      wordCount
    };
  }

  return {
    scoreResume,
    matchJobDescription,
    auditActionVerbs,
    extractFullText,
    STRONG_VERBS,
    WEAK_PHRASES
  };
})();
