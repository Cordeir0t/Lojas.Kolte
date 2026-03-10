// script.js - PÁGINA PRINCIPAL
// Menu mobile, dark mode, cookies, scroll suave

class HomePage {
  constructor() {
    this.hamburger = document.querySelector('.hamburger');
    this.navMenu = document.querySelector('.nav-menu');
    this.themeToggle = document.querySelector('#toggle-theme');
    this.cookieBanner = document.querySelector('.cookie-banner');
    this.cookieAccept = document.querySelector('.cookie-accept');

    this.init();
  }

  init() {
    this.setupMenuMobile();
    this.setupDarkMode();
    this.setupCookies();
    this.setupScroll();
  }

  setupMenuMobile() {
    if (!this.hamburger || !this.navMenu) return;

    this.hamburger.addEventListener('click', () => {
      this.navMenu.classList.toggle('nav-menu--open');
      this.hamburger.classList.toggle('hamburger--open');
      const expanded = this.navMenu.classList.contains('nav-menu--open');
      this.hamburger.setAttribute('aria-expanded', expanded);
    });

    // Fecha ao clicar link
    this.navMenu.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
      link.addEventListener('click', () => {
        this.navMenu.classList.remove('nav-menu--open');
        this.hamburger.classList.remove('hamburger--open');
        this.hamburger.setAttribute('aria-expanded', false);
      });
    });

    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
      if (!this.hamburger.contains(e.target) && !this.navMenu.contains(e.target)) {
        this.navMenu.classList.remove('nav-menu--open');
        this.hamburger.classList.remove('hamburger--open');
      }
    });
  }

  setupDarkMode() {
    if (!this.themeToggle) return;

    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('lk-theme') || (prefersDark ? 'dark' : 'light');

    this.applyTheme(saved);

    this.themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      this.applyTheme(next);
      localStorage.setItem('lk-theme', next);
    });
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = this.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  setupCookies() {
    if (!this.cookieBanner || !this.cookieAccept) return;

    const accepted = localStorage.getItem('lk-cookies');
    if (accepted !== 'true') {
      this.cookieBanner.classList.remove('cookie-banner--hidden');
    }

    this.cookieAccept.addEventListener('click', () => {
      localStorage.setItem('lk-cookies', 'true');
      this.cookieBanner.classList.add('cookie-banner--hidden');
    });
  }

  setupScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
}

// Inicializa quando carrega
document.addEventListener('DOMContentLoaded', () => {
  new HomePage();
});

// Observador para WhatsApp flutuante
const observer = new IntersectionObserver((entries) => {
  const whatsapp = document.querySelector('.floating-whatsapp');
  if (whatsapp) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        whatsapp.style.opacity = '1';
        whatsapp.style.transform = 'translateY(0)';
      } else {
        whatsapp.style.opacity = '0.9';
        whatsapp.style.transform = 'translateY(10px)';
      }
    });
  }
}, { threshold: 0.1 });

// Observa seções para animação do WhatsApp
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.section');
  observer.observe(sections[sections.length - 1]);
});
