(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  if (toggle && nav) {
    document.documentElement.classList.add('enhanced');
    toggle.hidden = false;
    const close = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); };
    toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('open',open); toggle.setAttribute('aria-expanded',String(open)); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { close(); toggle.focus(); } });
    nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); } }), {threshold: .08});
    document.querySelectorAll('.practice-card,.steps li,.guide-card,.attorney-teaser').forEach(el => { el.classList.add('reveal'); observer.observe(el); });
  }
})();
