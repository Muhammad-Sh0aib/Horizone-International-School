document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  const navClose = document.querySelector('.nav-close');
  const backToTop = document.querySelector('.back-to-top');
  const loader = document.querySelector('.loader');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxClose = document.querySelector('.lightbox__close');

  setTimeout(() => {
    loader?.classList.add('hidden');
  }, 450);

  const handleHeaderScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 20);
  };

  handleHeaderScroll();
  window.addEventListener('scroll', handleHeaderScroll);

  const closeMobileNav = () => {
    if (!navToggle || !mainNav) return;
    mainNav.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    backdrop?.classList.remove('open');
    document.body.style.overflow = '';
  };

  // Create backdrop for mobile nav
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', closeMobileNav);

  navClose?.addEventListener('click', closeMobileNav);

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      backdrop?.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1100) {
          closeMobileNav();
        }
      });
    });

    document.addEventListener('click', (event) => {
      const clickedInsideNav = mainNav.contains(event.target);
      const clickedToggle = navToggle.contains(event.target);
      if (!clickedInsideNav && !clickedToggle && mainNav.classList.contains('open')) {
        closeMobileNav();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100) {
        closeMobileNav();
      }
    });
  }

  document.querySelectorAll('.nav-item.has-dropdown').forEach((item) => {
    const button = item.querySelector('.nav-toggle');
    if (!button) return;

    button.addEventListener('click', (e) => {
      const isDesktop = window.innerWidth > 1100;
      if (!isDesktop) {
        e.stopPropagation();
        const isExpanded = item.classList.contains('open');
        // Close all other dropdowns (accordion)
        document.querySelectorAll('.nav-item.has-dropdown.open').forEach((openItem) => {
          if (openItem !== item) {
            openItem.classList.remove('open');
            openItem.querySelector('.nav-toggle')?.setAttribute('aria-expanded', 'false');
          }
        });
        item.classList.toggle('open', !isExpanded);
        button.setAttribute('aria-expanded', String(!isExpanded));
      }
    });
  });

  // Escape key closes the mobile nav
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav?.classList.contains('open')) {
      closeMobileNav();
    }
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('[data-reveal]').forEach((el) => {
    const delay = el.dataset.delay || 0;
    el.style.transitionDelay = `${delay}ms`;
    revealObserver.observe(el);
  });

  const animateCounters = () => {
    const counters = document.querySelectorAll('[data-counter]');
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const counter = entry.target;
          const target = Number(counter.dataset.counter || 0);
          const suffix = counter.dataset.suffix || '';
          const duration = 1400;
          const startTime = performance.now();

          const updateCounter = (time) => {
            const progress = Math.min((time - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.floor(eased * target);
            counter.textContent = `${value}${suffix}`;

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              counter.textContent = `${target}${suffix}`;
            }
          };

          requestAnimationFrame(updateCounter);
          counterObserver.unobserve(counter);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((counter) => counterObserver.observe(counter));
  };

  animateCounters();

  const fallbackPrograms = [
    {
      title: 'Early Years',
      label: 'Ages 3–5',
      description: 'Play-based learning experiences that nurture confidence, curiosity and a love for discovery in a warm and encouraging environment.',
      icon: 'fa-solid fa-seedling'
    },
    {
      title: 'Primary School',
      label: 'Grades 1–5',
      description: 'Strong literacy, numeracy and inquiry-based learning that helps children build a confident foundation for future success.',
      icon: 'fa-solid fa-book-open'
    },
    {
      title: 'Middle School',
      label: 'Grades 6–8',
      description: 'A more advanced academic journey that develops independence, critical thinking and perseverance across core subjects.',
      icon: 'fa-solid fa-brain'
    },
    {
      title: 'Secondary School',
      label: 'Grades 9–10',
      description: 'A rigorous curriculum that balances academic depth, co-curricular participation and personal growth as students prepare for senior studies.',
      icon: 'fa-solid fa-graduation-cap'
    },
    {
      title: 'Higher Secondary',
      label: 'Grades 11–12',
      description: 'Focused pathways that support university readiness, leadership and future career planning through guided academic choices.',
      icon: 'fa-solid fa-rocket'
    }
  ];

  const fallbackEvents = [
    {
      date: '14 Nov 2026',
      category: 'Sports',
      title: 'Annual Sports Day',
      description: 'Students come together for a day of teamwork, competition and school spirit as they celebrate athletic achievement and participation.'
    },
    {
      date: '22 Jan 2027',
      category: 'Innovation',
      title: 'Science & Innovation Exhibition',
      description: 'Students showcase practical projects and innovative ideas developed throughout the academic term with guidance from faculty mentors.'
    },
    {
      date: '09 Mar 2027',
      category: 'Parents',
      title: 'Parent-Teacher Meeting',
      description: 'An opportunity for families and educators to discuss student progress, learning goals and next steps for success.'
    }
  ];

  const fallbackGallery = [
    {
      title: 'Campus',
      category: 'Campus',
      alt: 'Modern school campus exterior and landscaped grounds',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
      className: 'gallery-item--wide'
    },
    {
      title: 'Classroom',
      category: 'Classroom',
      alt: 'Students learning in a bright classroom environment',
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80',
      className: 'gallery-item--tall'
    },
    {
      title: 'Sports',
      category: 'Sports',
      alt: 'Young students engaging in sports and physical activity',
      image: 'https://images.unsplash.com/photo-1541534401786-2077eed87a74?auto=format&fit=crop&w=900&q=80',
      className: 'gallery-item--medium'
    },
    {
      title: 'Activities',
      category: 'Activities',
      alt: 'Students participating in creative school activities',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
      className: 'gallery-item--square'
    },
    {
      title: 'Events',
      category: 'Events',
      alt: 'School community gathering and event celebration',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
      className: 'gallery-item--compact'
    },
    {
      title: 'Learning Spaces',
      category: 'Campus',
      alt: 'Library and collaborative spaces for learning',
      image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80',
      className: 'gallery-item--compact'
    }
  ];

  const loadJsonFile = async (path, fallback) => {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`${path} failed to load`);
      return await response.json();
    } catch (error) {
      console.warn(`${path} unavailable; using local fallback data.`);
      return fallback;
    }
  };

  const renderPrograms = async () => {
    const programsWrap = document.getElementById('programs-grid');
    if (!programsWrap) return;

    const programs = await loadJsonFile('data/programs.json', fallbackPrograms);

    programsWrap.innerHTML = programs
      .map(
        (program) => `
          <article class="program-card" data-reveal="fade-up">
            <div class="program-card__icon"><i class="${program.icon}"></i></div>
            <span class="program-card__label">${program.label}</span>
            <h3>${program.title}</h3>
            <p>${program.description}</p>
            <a href="#">Learn More <i class="fa-solid fa-arrow-right"></i></a>
          </article>
        `
      )
      .join('');

    document.querySelectorAll('#programs-grid [data-reveal]').forEach((el) => revealObserver.observe(el));
  };

  const renderEvents = async () => {
    const eventsWrap = document.getElementById('events-grid');
    if (!eventsWrap) return;

    const rawData = await loadJsonFile('data/events.json', []);
    const events = Array.isArray(rawData) ? rawData : (rawData?.events || []);

    eventsWrap.innerHTML = events
      .slice(0, 3)
      .map(
        (event) => `
          <article class="news-card" data-reveal="fade-up">
            <div class="news-card__date"><i class="fa-regular fa-calendar"></i> ${event.date}</div>
            <div class="news-card__content">
              <span class="news-card__category">${event.categoryLabel || event.category}</span>
              <h3>${event.title}</h3>
              <p>${event.shortDescription || event.description}</p>
              <a href="events.html">Read More <i class="fa-solid fa-arrow-right"></i></a>
            </div>
          </article>
        `
      )
      .join('');

    document.querySelectorAll('#events-grid [data-reveal]').forEach((el) => revealObserver.observe(el));
  };

  const renderGallery = async () => {
    const galleryWrap = document.getElementById('gallery-grid');
    if (!galleryWrap) return;

    const rawGallery = await loadJsonFile('data/gallery.json', fallbackGallery);
    const gallery = Array.isArray(rawGallery) ? rawGallery : (rawGallery?.photos || fallbackGallery || []);

    galleryWrap.innerHTML = gallery
      .slice(0, 6)
      .map(
        (item) => `
          <figure class="gallery-item ${item.className || 'gallery-item--medium'}" data-image="${item.image}" data-title="${item.title}" data-alt="${item.alt}" tabindex="0">
            <img src="${item.image}" alt="${item.alt}" loading="lazy" />
            <figcaption class="gallery-item__meta">
              <span>${item.category}</span>
              <strong>${item.title}</strong>
            </figcaption>
          </figure>
        `
      )
      .join('');

    galleryWrap.querySelectorAll('.gallery-item').forEach((item) => {
      const openLightbox = () => {
        if (!lightbox || !lightboxImage) return;
        lightboxImage.src = item.dataset.image;
        lightboxImage.alt = item.dataset.alt;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
      };

      item.addEventListener('click', openLightbox);
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox();
        }
      });
    });
  };

  const loadSchoolData = async () => {
    const school = await loadJsonFile('data/school.json', {
      brand: {
        name: 'Horizon International School',
        tagline: 'Inspiring Minds. Empowering Futures.'
      }
    });

    if (school.brand?.name && !document.title.trim()) {
      document.title = `${school.brand.name} | ${school.brand.tagline}`;
    }
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
  };

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox?.classList.contains('open')) {
      closeLightbox();
    }
  });

  const handleBackToTop = () => {
    if (!backToTop) return;
    backToTop.classList.toggle('visible', window.scrollY > 420);
  };

  handleBackToTop();
  window.addEventListener('scroll', handleBackToTop);
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const fallbackSubjects = [
    { title: 'English Language', description: 'Communication, reading, writing and literary analysis.', icon: 'fa-solid fa-book-open', category: 'languages' },
    { title: 'Mathematics', description: 'Numerical reasoning, problem solving and analytical thinking.', icon: 'fa-solid fa-calculator', category: 'stem' },
    { title: 'Science', description: 'Investigation, experimentation and understanding the natural world.', icon: 'fa-solid fa-flask', category: 'stem' },
    { title: 'Physics', description: 'Understanding forces, energy, motion and matter.', icon: 'fa-solid fa-atom', category: 'stem' },
    { title: 'Chemistry', description: 'Exploring reactions, elements and molecular structures.', icon: 'fa-solid fa-droplet', category: 'stem' },
    { title: 'Biology', description: 'Studying living organisms and biological systems.', icon: 'fa-solid fa-leaf', category: 'stem' },
    { title: 'Computing & Technology', description: 'Digital literacy, coding and responsible technology use.', icon: 'fa-solid fa-laptop', category: 'stem' },
    { title: 'History', description: 'Understanding past events and their impact on today.', icon: 'fa-solid fa-landmark', category: 'humanities' },
    { title: 'Geography', description: 'Exploring places, cultures and environmental systems.', icon: 'fa-solid fa-globe', category: 'humanities' },
    { title: 'Social Studies', description: 'Understanding society, culture and human relationships.', icon: 'fa-solid fa-people-group', category: 'humanities' },
    { title: 'Visual Arts', description: 'Painting, drawing, sculpture and artistic expression.', icon: 'fa-solid fa-palette', category: 'creative' },
    { title: 'Music', description: 'Musical theory, composition and performance.', icon: 'fa-solid fa-music', category: 'creative' },
    { title: 'Drama & Performance', description: 'Acting, theater and creative expression through performance.', icon: 'fa-solid fa-masks-theater', category: 'creative' },
    { title: 'Design & Technology', description: 'Creative design, engineering and practical making.', icon: 'fa-solid fa-hammer', category: 'creative' },
    { title: 'Physical Education', description: 'Movement, fitness, teamwork and athletic development.', icon: 'fa-solid fa-person-running', category: 'physical' },
    { title: 'Sports Science', description: 'Understanding human movement and athletic performance.', icon: 'fa-solid fa-heartbeat', category: 'physical' },
    { title: 'Personal Development', description: 'Communication, leadership, responsibility and wellbeing.', icon: 'fa-solid fa-user-graduate', category: 'humanities' },
    { title: 'Modern Languages', description: 'Learning international languages and cross-cultural communication.', icon: 'fa-solid fa-language', category: 'languages' }
  ];

  const renderSubjects = async () => {
    const subjectsWrap = document.getElementById('subjects-grid');
    if (!subjectsWrap) return;

    const subjects = await loadJsonFile('data/subjects.json', { subjects: fallbackSubjects });
    const subjectsArray = Array.isArray(subjects) ? subjects : subjects.subjects || fallbackSubjects;

    subjectsWrap.innerHTML = subjectsArray
      .map(
        (subject) => `
          <div class="subject-card" data-category="${subject.category}" data-reveal="fade-up">
            <div class="subject-card__icon"><i class="${subject.icon}"></i></div>
            <h3>${subject.title}</h3>
            <p>${subject.description}</p>
          </div>
        `
      )
      .join('');

    document.querySelectorAll('#subjects-grid [data-reveal]').forEach((el) => revealObserver.observe(el));

    // Subject Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const subjectCards = document.querySelectorAll('.subject-card');

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        subjectCards.forEach((card) => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  };

  const renderProgramsForAdmissions = async () => {
    const container = document.getElementById('programs-list');
    if (!container) return;

    const fallbackPrograms = [
      { title: 'Early Years', label: 'Ages 3–6', description: 'Foundational learning through play and exploration.', icon: 'fa-solid fa-heart', className: 'program-early' },
      { title: 'Primary', label: 'Grades 1–5', description: 'Strong foundations in core academics and social skills.', icon: 'fa-solid fa-book', className: 'program-primary' },
      { title: 'Middle', label: 'Grades 6–8', description: 'Developing independence and subject specialization.', icon: 'fa-solid fa-lightbulb', className: 'program-middle' },
      { title: 'Secondary', label: 'Grades 9–10', description: 'Preparing for higher studies with specialized learning.', icon: 'fa-solid fa-graduation-cap', className: 'program-secondary' },
      { title: 'Higher Secondary', label: 'Grades 11–12', description: 'University preparation and advanced learning.', icon: 'fa-solid fa-rocket', className: 'program-higher' }
    ];

    try {
      const response = await fetch('data/programs.json');
      const data = await response.json();
      const programs = (data.programs || fallbackPrograms).slice(0, 5);

      container.innerHTML = programs.map((program) => {
        const ageRangeMap = {
          'Early Years': 'Age 3–6 years',
          'Primary': 'Grade 1–5, Age 6–11 years',
          'Middle': 'Grade 6–8, Age 11–14 years',
          'Secondary': 'Grade 9–10, Age 14–16 years',
          'Higher Secondary': 'Grade 11–12, Age 16–18 years'
        };

        return `
          <article class="program-option" data-reveal="fade-up">
            <div class="program-option__label">${program.label}</div>
            <h3>${program.title}</h3>
            <span class="grade-range">${program.description}</span>
            <span class="age-range">${ageRangeMap[program.title] || 'Contact for details'}</span>
          </article>
        `;
      }).join('');
    } catch (error) {
      console.warn('Failed to load programs:', error);

      container.innerHTML = fallbackPrograms.map((program) => {
        const ageRangeMap = {
          'Early Years': 'Age 3–6 years',
          'Primary': 'Grade 1–5, Age 6–11 years',
          'Middle': 'Grade 6–8, Age 11–14 years',
          'Secondary': 'Grade 9–10, Age 14–16 years',
          'Higher Secondary': 'Grade 11–12, Age 16–18 years'
        };

        return `
          <article class="program-option" data-reveal="fade-up">
            <div class="program-option__label">${program.label}</div>
            <h3>${program.title}</h3>
            <span class="grade-range">${program.description}</span>
            <span class="age-range">${ageRangeMap[program.title] || 'Contact for details'}</span>
          </article>
        `;
      }).join('');
    }
  };

  const renderFAQs = async () => {
    const container = document.getElementById('faqs-list');
    if (!container) return;

    const fallbackFAQs = [
      {
        id: 1,
        question: 'When do admissions open?',
        answer: 'Applications for the 2026–27 academic session open on January 15, 2026. Families are encouraged to apply early because places may be limited. The priority application period runs until August 15, 2026.'
      },
      {
        id: 2,
        question: 'Which grades are accepting applications?',
        answer: 'Applications may be submitted for Early Years through Higher Secondary, subject to available places and program requirements. Each grade level has specific admission criteria. Contact the admissions office to confirm availability for your child\'s intended grade.'
      },
      {
        id: 3,
        question: 'Can I visit the school before applying?',
        answer: 'Yes. Families can contact the admissions office to discuss a campus visit and available visiting arrangements. Campus visits are encouraged as they help families understand the school environment and help us learn more about your child.'
      },
      {
        id: 4,
        question: 'Is an entrance assessment required?',
        answer: 'Assessment requirements depend on the student\'s age and grade. The admissions team will explain the applicable process during the application stage. Some grades may include informal assessments to understand the child\'s learning style and needs.'
      },
      {
        id: 5,
        question: 'What documents should I prepare?',
        answer: 'Parents should prepare student identification, recent photographs and academic records where applicable, along with parent/guardian identification and contact information. The admissions office will provide a complete list of required documents specific to your child\'s grade.'
      },
      {
        id: 6,
        question: 'Can transfer students apply?',
        answer: 'Yes. Transfer applications can be considered subject to available places and the school\'s admission requirements. Transfer students must provide relevant documentation, academic records and information about their previous school.'
      },
      {
        id: 7,
        question: 'How can I contact the admissions office?',
        answer: 'Families can contact the admissions team by phone at +92 21 3456 7890, email at admissions@horizoninternationalschool.edu, or through the website\'s inquiry form. Our team is available Monday–Friday, 8:00 AM–4:00 PM.'
      },
      {
        id: 8,
        question: 'How long does the admission process take?',
        answer: 'The timeline depends on the application, required documentation, assessment and availability of places. Generally, the process takes 4–8 weeks from application to admission decision. The admissions team will guide families through each stage and provide updates.'
      }
    ];

    try {
      const response = await fetch('data/faqs.json');
      const data = await response.json();
      const faqs = (data.faqs || fallbackFAQs).slice(0, 10);

      container.innerHTML = faqs.map((faq) => `
        <div class="faq-item" data-reveal="fade-up">
          <button class="faq-question" type="button" aria-expanded="false">
            ${faq.question}
          </button>
          <div class="faq-answer" role="region">
            <p>${faq.answer}</p>
          </div>
        </div>
      `).join('');

      // Accordion functionality
      document.querySelectorAll('.faq-question').forEach((button) => {
        button.addEventListener('click', () => {
          const item = button.closest('.faq-item');
          const isOpen = item.classList.contains('open');

          // Close all other items
          document.querySelectorAll('.faq-item.open').forEach((openItem) => {
            if (openItem !== item) {
              openItem.classList.remove('open');
              openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            }
          });

          // Toggle current item
          item.classList.toggle('open', !isOpen);
          button.setAttribute('aria-expanded', String(!isOpen));
        });

        // Keyboard support
        button.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            button.click();
          } else if (event.key === 'Escape') {
            const item = button.closest('.faq-item');
            if (item.classList.contains('open')) {
              item.classList.remove('open');
              button.setAttribute('aria-expanded', 'false');
            }
          }
        });
      });

      revealObserver.observe(container);
    } catch (error) {
      console.warn('Failed to load FAQs:', error);

      container.innerHTML = fallbackFAQs.map((faq) => `
        <div class="faq-item" data-reveal="fade-up">
          <button class="faq-question" type="button" aria-expanded="false">
            ${faq.question}
          </button>
          <div class="faq-answer" role="region">
            <p>${faq.answer}</p>
          </div>
        </div>
      `).join('');

      // Accordion functionality (same as above)
      document.querySelectorAll('.faq-question').forEach((button) => {
        button.addEventListener('click', () => {
          const item = button.closest('.faq-item');
          const isOpen = item.classList.contains('open');

          document.querySelectorAll('.faq-item.open').forEach((openItem) => {
            if (openItem !== item) {
              openItem.classList.remove('open');
              openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            }
          });

          item.classList.toggle('open', !isOpen);
          button.setAttribute('aria-expanded', String(!isOpen));
        });

        button.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            button.click();
          } else if (event.key === 'Escape') {
            const item = button.closest('.faq-item');
            if (item.classList.contains('open')) {
              item.classList.remove('open');
              button.setAttribute('aria-expanded', 'false');
            }
          }
        });
      });
    }
  };

  Promise.all([renderPrograms(), renderEvents(), renderGallery(), renderSubjects(), renderProgramsForAdmissions(), renderFAQs(), loadSchoolData()]);

  body.classList.add('ready');
});
