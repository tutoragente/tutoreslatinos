// Responsive desktop nav
  function setDesktopNav() {
    const isDesktop = window.innerWidth >= 768;
    ['dn-services','dn-pricing','dn-benefits','dn-testimonials','dn-contact','dn-cta'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = isDesktop ? (id === 'dn-cta' ? 'inline-flex' : 'block') : 'none';
    });
    const dtToggle = document.getElementById('theme-toggle-desktop');
    if (dtToggle) dtToggle.style.display = isDesktop ? 'flex' : 'none';
    document.getElementById('menu-toggle').style.display = isDesktop ? 'none' : 'flex';
  }
  setDesktopNav();

  // Theme toggle
  const html = document.documentElement;
  const isLight = () => html.classList.contains('light');

  function applyTheme(light) {
    html.classList.toggle('light', light);
    html.classList.toggle('dark', !light);
    document.body.style.removeProperty('background');
    document.body.style.removeProperty('color');
    // Icons desktop
    const moonD = document.getElementById('icon-moon-d');
    const sunD  = document.getElementById('icon-sun-d');
    if (moonD) moonD.style.display = light ? 'none' : 'block';
    if (sunD)  sunD.style.display  = light ? 'block' : 'none';
    // Icons mobile
    const moonM  = document.getElementById('icon-moon-m');
    const sunM   = document.getElementById('icon-sun-m');
    const labelM = document.getElementById('theme-label-m');
    if (moonM)  moonM.style.display  = light ? 'none' : 'block';
    if (sunM)   sunM.style.display   = light ? 'block' : 'none';
    if (labelM) labelM.textContent   = light ? 'Modo Oscuro' : 'Modo Claro';
    // Header background
    const header = document.querySelector('header');
    if (header) header.style.background = light ? 'rgba(232,245,242,0.82)' : 'rgba(0,0,0,0.85)';
    localStorage.setItem('theme', light ? 'light' : 'dark');
  }

  // Remove hardcoded inline styles from body so CSS variables take over
  document.body.style.removeProperty('background');
  document.body.style.removeProperty('color');

  // Restore saved preference
  applyTheme(localStorage.getItem('theme') === 'light');

  ['theme-toggle-desktop', 'theme-toggle-mobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => applyTheme(!isLight()));
  });
  window.addEventListener('resize', setDesktopNav);

  // Mobile menu
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const iconMenu = document.getElementById('icon-menu');
  const iconClose = document.getElementById('icon-close');

  menuToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    iconMenu.style.display = isOpen ? 'none' : 'block';
    iconClose.style.display = isOpen ? 'block' : 'none';
  });

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      iconMenu.style.display = 'block';
      iconClose.style.display = 'none';
    });
  });

  document.addEventListener('click', e => {
    if (!menuToggle.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
      iconMenu.style.display = 'block';
      iconClose.style.display = 'none';
    }
  });

  // Smooth scroll with header offset
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Active nav highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('#desktop-nav a[href^="#"]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          const active = link.getAttribute('href') === '#' + entry.target.id;
          link.style.color = active ? 'var(--foreground)' : '';
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-72px 0px 0px 0px' });
  sections.forEach(s => io.observe(s));

  // Contact form — HubSpot API v3
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Enviando...';

      const data = new FormData(form);
      const nameParts = (data.get('name') || '').trim().split(' ');
      const firstname = nameParts[0] || '';
      const lastname = nameParts.slice(1).join(' ') || '';

      const payload = {
        fields: [
          { name: 'firstname', value: firstname },
          { name: 'lastname', value: lastname },
          { name: 'email', value: data.get('email') },
          { name: 'company', value: data.get('company') },
          { name: 'numemployees', value: data.get('size') },
          { name: 'message', value: data.get('message') }
        ],
        context: {
          pageUri: window.location.href,
          pageName: document.title
        }
      };

      try {
        const res = await fetch(
          'https://api.hsforms.com/submissions/v3/integration/submit/343331914/b7c76907-5fb2-4a97-ad68-f3dcb0b623f5',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        );
        if (!res.ok) throw new Error('Error ' + res.status);
        form.style.display = 'none';
        success.style.display = 'block';
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Reservar Consultoría de IA ($1,000) →';
        alert('Hubo un error al enviar el formulario. Por favor intenta de nuevo.');
      }
    });
  }