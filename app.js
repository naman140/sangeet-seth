document.addEventListener('DOMContentLoaded', () => {
  // 1. Scroll Reveal Animation
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, {
    root: null,
    rootMargin: '-50px',
    threshold: 0.1
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // 2. Navigation Scroll Effect
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.classList.add('bg-black/60', 'backdrop-blur-md', 'border-b', 'border-[rgba(255,255,255,0.1)]');
      nav.classList.remove('bg-transparent');
    } else {
      nav.classList.remove('bg-black/60', 'backdrop-blur-md', 'border-b', 'border-[rgba(255,255,255,0.1)]');
      nav.classList.add('bg-transparent');
    }
  });

  // 3. Mobile Menu Toggle
  const menuBtn = document.getElementById('mobile-menu-btn');
  const closeBtn = document.getElementById('mobile-menu-close');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu?.querySelectorAll('a');

  menuBtn?.addEventListener('click', () => {
    mobileMenu.classList.remove('hidden');
    mobileMenu.classList.add('flex');
  });

  closeBtn?.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    mobileMenu.classList.remove('flex');
  });

  mobileLinks?.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
    });
  });

  // 4. Parallax Backgrounds
  const parallaxBgs = document.querySelectorAll('.parallax-bg');
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    parallaxBgs.forEach(bg => {
      const speed = bg.dataset.speed || 0.4;
      bg.style.transform = `translateY(${scrolled * speed}px)`;
    });
  });

  // 5. 3D Tilt Cards
  const tiltCards = document.querySelectorAll('.tilt-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });

  // 6. Hero AI Pattern Mouse Tracker (Flashlight effect)
  const heroSection = document.querySelector('.parallax-section'); // Hero is the first one
  const aiPattern = document.querySelector('.ai-pattern-overlay');
  if (heroSection && aiPattern) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();

      // Because .ai-pattern-overlay has inset: -20% in CSS, it is 20% wider/taller on all sides
      // We must add 20% of the container's width/height to the mouse coordinates 
      // so the center of the mask perfectly aligns with the mouse.
      const offsetX = rect.width * 0.2;
      const offsetY = rect.height * 0.2;

      const x = (e.clientX - rect.left) + offsetX;
      const y = (e.clientY - rect.top) + offsetY;

      aiPattern.style.setProperty('--mouse-x', `${x}px`);
      aiPattern.style.setProperty('--mouse-y', `${y}px`);
    });
  }

  // 7. FAQ Accordion
  const faqButtons = document.querySelectorAll('.faq-button');
  faqButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('aria-controls');
      const content = document.getElementById(targetId);
      const icon = btn.querySelector('.faq-icon');

      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      // Close all other FAQs
      faqButtons.forEach(otherBtn => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          const otherContent = document.getElementById(otherBtn.getAttribute('aria-controls'));
          const otherIcon = otherBtn.querySelector('.faq-icon');
          otherContent.style.height = '0px';
          otherContent.style.opacity = '0';
          otherIcon.style.transform = 'rotate(0deg)';
          otherIcon.style.background = 'var(--color-surface-2)';
          otherIcon.style.color = 'var(--color-text-tertiary)';
        }
      });

      // Toggle current FAQ
      if (isExpanded) {
        btn.setAttribute('aria-expanded', 'false');
        content.style.height = '0px';
        content.style.opacity = '0';
        icon.style.transform = 'rotate(0deg)';
        icon.style.background = 'var(--color-surface-2)';
        icon.style.color = 'var(--color-text-tertiary)';
      } else {
        btn.setAttribute('aria-expanded', 'true');
        content.style.height = content.scrollHeight + 'px';
        content.style.opacity = '1';
        icon.style.transform = 'rotate(45deg)';
        icon.style.background = 'var(--color-accent)';
        icon.style.color = 'white';
      }
    });
  });
});
