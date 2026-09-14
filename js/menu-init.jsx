import React from 'react';
import { createRoot } from 'react-dom/client';
import StaggeredMenu from '../StaggeredMenu.jsx';

const menuItems = [
  { label: 'Home', link: '#home', ariaLabel: 'Home Page' },
  { label: 'Simulate', link: '#simulate', ariaLabel: 'Simulation Lab' },
  { label: 'Data Log', link: '#log', ariaLabel: 'Experimental Data Log' },
  { label: 'Methods', link: '#methods', ariaLabel: 'Experimental Methods' },
  { label: 'Reference', link: '#reference', ariaLabel: 'Material References' },
  { label: 'Theory', link: '#theory', ariaLabel: 'Theory & Formulations' },
  { label: 'Compare', link: '#compare', ariaLabel: 'Method Comparison' },
  { label: 'Contributors', link: '#contributors', ariaLabel: 'Project Contributors' },
];

const contactLinks = [
  { label: '✉ Email: xhdudygj@gmail.com', link: 'mailto:xhdudygj@gmail.com', target: '_self' },
  { label: '💬 WhatsApp: 9373897408', link: 'https://wa.me/919373897408', target: '_blank' },
  { label: '✈ Telegram: @omkarnub', link: 'https://t.me/omkarnub', target: '_blank' }
];

let root = null;

function renderMenu() {
  const container = document.getElementById('staggered-menu-root');
  if (!container) return;

  if (!root) {
    root = createRoot(container);
  }

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  root.render(
    <StaggeredMenu
      position="right"
      isFixed={true}
      colors={['#121212', '#1c1c1c', '#282828', '#383838']}
      accentColor="#ffffff"
      menuButtonColor={isLight ? '#121212' : '#f5f5f5'}
      openMenuButtonColor={isLight ? '#121212' : '#ffffff'}
      items={menuItems}
      socialTitle="Contact Us"
      socialItems={contactLinks}
      displaySocials={true}
      displayItemNumbering={true}
      closeOnClickAway={true}
    />
  );
}

function initMenu() {
  renderMenu();
  window.addEventListener('themechange', renderMenu);

  // Close menu when a navigation item is clicked
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.sm-panel-item, .sm-socials-link');
    if (item) {
      const wrapper = document.querySelector('.staggered-menu-wrapper[data-open]');
      if (wrapper) {
        const toggle = wrapper.querySelector('.sm-toggle');
        if (toggle) toggle.click();
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMenu);
} else {
  initMenu();
}
