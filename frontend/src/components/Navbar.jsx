import React from 'react';
import { NavLink } from 'react-router-dom';
import logoUrl from '../../content/LogoSinFondo.png';

const TABS = [
  { to: '/jugadores', icon: '⚽', label: 'Jugadores' },
  { to: '/hinchas',   icon: '👕', label: 'Hinchas'   },
  { to: '/reportes',  icon: '📊', label: 'Reportes'  },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={logoUrl} alt="Einlich" className="brand-logo-img" />
      </div>

      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `navbar-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon" aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
