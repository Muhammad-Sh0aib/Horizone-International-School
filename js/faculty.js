document.addEventListener('DOMContentLoaded', () => {
  const directory = document.getElementById('faculty-grid');
  const leadership = document.getElementById('leadership-grid');
  if (!directory || !leadership) return;

  const searchInput = document.getElementById('faculty-search');
  const searchClear = document.getElementById('clear-search');
  const departmentFilter = document.getElementById('department-filter');
  const divisionFilter = document.getElementById('division-filter');
  const resultCount = document.getElementById('faculty-result-count');
  const emptyState = document.getElementById('faculty-empty');
  const modal = document.getElementById('faculty-modal');
  const modalDialog = modal.querySelector('.faculty-modal__dialog');
  const modalBody = document.getElementById('faculty-modal-body');
  const modalClose = modal.querySelector('.faculty-modal__close');
  const resetButton = document.getElementById('reset-filters');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mainContent = document.querySelector('main');
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');
  const backToTop = document.querySelector('.back-to-top');

  let facultyMembers = [];
  let leadershipMembers = [];
  let profilesById = new Map();
  let lastFocusedElement = null;
  let previousBodyOverflow = '';
  let closeTimer;

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);

  const readableDivision = (divisions = []) => divisions.includes('All Divisions') ? 'All Divisions' : divisions.join(' & ');

  const observeCards = (container) => {
    const cards = container.querySelectorAll('[data-reveal="fade-up"]');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      cards.forEach((card) => card.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px 35px 0px' });

    cards.forEach((card, index) => {
      card.style.transitionDelay = `${Math.min(index % 4, 3) * 65}ms`;
      observer.observe(card);
    });
  };

  const renderLeadership = () => {
    leadership.innerHTML = leadershipMembers.map((person) => `
      <article class="leader-card" data-reveal="fade-up">
        <div class="leader-card__image"><img src="${escapeHtml(person.image)}" alt="${escapeHtml(person.imageAlt || person.name)}" loading="lazy" /></div>
        <div class="leader-card__content">
          <span class="leader-card__eyebrow">School Leadership</span>
          <h3>${escapeHtml(person.name)}</h3>
          <p class="leader-card__role">${escapeHtml(person.position)}</p>
          <p>${escapeHtml(person.shortBio)}</p>
          <button class="button button--link" type="button" data-profile-id="${escapeHtml(person.id)}" aria-label="View profile of ${escapeHtml(person.name)}">View Profile <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
        </div>
      </article>
    `).join('');
    observeCards(leadership);
  };

  const renderFaculty = () => {
    const searchTerm = searchInput.value.trim().toLocaleLowerCase();
    const selectedDepartment = departmentFilter.value;
    const selectedDivision = divisionFilter.value;

    const visibleFaculty = facultyMembers.filter((person) => {
      const searchableText = [
        person.name,
        person.position,
        person.department,
        ...(person.division || []),
        ...(person.teachingAreas || []),
        person.shortBio,
        person.fullBio
      ].join(' ').toLocaleLowerCase();
      const matchesText = !searchTerm || searchableText.includes(searchTerm);
      const matchesDepartment = selectedDepartment === 'all' || person.department === selectedDepartment;
      const divisions = person.division || [];
      const matchesDivision = selectedDivision === 'all' || divisions.includes('All Divisions') || divisions.includes(selectedDivision);
      return matchesText && matchesDepartment && matchesDivision;
    });

    directory.setAttribute('aria-busy', 'false');
    directory.innerHTML = visibleFaculty.map((person) => `
      <article class="faculty-card" data-reveal="fade-up">
        <div class="faculty-card__image"><img src="${escapeHtml(person.image)}" alt="${escapeHtml(person.imageAlt || person.name)}" loading="lazy" /></div>
        <div class="faculty-card__content">
          <span class="faculty-card__department">${escapeHtml(person.department)}</span>
          <h3>${escapeHtml(person.name)}</h3>
          <p class="faculty-card__position">${escapeHtml(person.position)}</p>
          <p class="faculty-card__division"><i class="fa-solid fa-school" aria-hidden="true"></i> ${escapeHtml(readableDivision(person.division || []))}</p>
          <p class="faculty-card__bio">${escapeHtml(person.shortBio)}</p>
          <button class="button button--link" type="button" data-profile-id="${escapeHtml(person.id)}" aria-label="View profile of ${escapeHtml(person.name)}">View Profile <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
        </div>
      </article>
    `).join('');

    const count = visibleFaculty.length;
    resultCount.textContent = `Showing ${count} of ${facultyMembers.length} ${facultyMembers.length === 1 ? 'faculty member' : 'faculty members'}`;
    emptyState.hidden = count !== 0;
    searchClear.hidden = searchInput.value.length === 0;
    observeCards(directory);
  };

  const profileMarkup = (person) => `
    <div class="faculty-modal__image"><img src="${escapeHtml(person.image)}" alt="${escapeHtml(person.imageAlt || person.name)}" /></div>
    <div class="faculty-modal__content">
      <p class="eyebrow eyebrow--small">${escapeHtml(person.department)}</p>
      <h2 id="faculty-modal-name">${escapeHtml(person.name)}</h2>
      <p class="faculty-modal__role">${escapeHtml(person.position)}</p>
      <dl class="faculty-modal__meta">
        <div><dt>Academic Division</dt><dd>${escapeHtml(readableDivision(person.division || []))}</dd></div>
        <div><dt>Student Age Groups</dt><dd>${(person.studentAgeGroups || []).map(escapeHtml).join(', ') || 'Across the school'}</dd></div>
      </dl>
      <p class="faculty-modal__bio" id="faculty-modal-bio">${escapeHtml(person.fullBio || person.shortBio)}</p>
      <h3>Areas of teaching</h3>
      <ul class="faculty-modal__tags">${(person.teachingAreas || []).map((area) => `<li>${escapeHtml(area)}</li>`).join('')}</ul>
    </div>
  `;

  const setBackgroundInert = (inert) => {
    [mainContent, header, footer, backToTop].filter(Boolean).forEach((element) => {
      element.inert = inert;
    });
  };

  const openProfile = (id, trigger) => {
    const person = profilesById.get(id);
    if (!person) return;
    window.clearTimeout(closeTimer);
    lastFocusedElement = trigger || document.activeElement;
    modalBody.innerHTML = profileMarkup(person);
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');
    document.body.classList.add('faculty-modal-open');
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setBackgroundInert(true);
    modalClose.focus();
  };

  const closeProfile = () => {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('faculty-modal-open');
    document.body.style.overflow = previousBodyOverflow;
    setBackgroundInert(false);
    closeTimer = window.setTimeout(() => {
      modalBody.innerHTML = '';
      lastFocusedElement?.focus();
    }, reduceMotion.matches ? 0 : 230);
  };

  const clearFilters = () => {
    searchInput.value = '';
    departmentFilter.value = 'all';
    divisionFilter.value = 'all';
    renderFaculty();
    searchInput.focus();
  };

  const setLoadError = () => {
    directory.setAttribute('aria-busy', 'false');
    directory.innerHTML = '';
    leadership.innerHTML = '';
    resultCount.textContent = 'The faculty directory could not be loaded.';
    emptyState.hidden = false;
    emptyState.querySelector('h3').textContent = 'Faculty information is temporarily unavailable.';
    emptyState.querySelector('p').textContent = 'Please try again later or contact the school for assistance.';
    emptyState.querySelector('[data-reset-faculty]').hidden = true;
  };

  searchInput.addEventListener('input', renderFaculty);
  departmentFilter.addEventListener('change', renderFaculty);
  divisionFilter.addEventListener('change', renderFaculty);
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    renderFaculty();
    searchInput.focus();
  });
  resetButton.addEventListener('click', clearFilters);
  emptyState.querySelector('[data-reset-faculty]').addEventListener('click', clearFilters);

  document.addEventListener('click', (event) => {
    const profileButton = event.target.closest('[data-profile-id]');
    if (profileButton) openProfile(profileButton.dataset.profileId, profileButton);
  });

  modalClose.addEventListener('click', closeProfile);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeProfile();
  });

  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeProfile();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [...modalDialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.disabled && element.offsetParent !== null);
    if (focusable.length === 0) {
      event.preventDefault();
      modalDialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  fetch('data/faculty.json')
    .then((response) => {
      if (!response.ok) throw new Error('Faculty data could not be loaded.');
      return response.json();
    })
    .then((data) => {
      facultyMembers = Array.isArray(data.faculty) ? data.faculty : [];
      leadershipMembers = Array.isArray(data.leadership) ? data.leadership : [];
      profilesById = new Map([...leadershipMembers, ...facultyMembers].map((person) => [person.id, person]));
      renderLeadership();
      renderFaculty();
    })
    .catch((error) => {
      console.error(error);
      setLoadError();
    });
});
