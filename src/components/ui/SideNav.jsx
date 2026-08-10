import React from 'react'
import { NavLink } from 'react-router-dom'

/**
 * SideNav
 * sections: [{ label, items: [{ to, label, badge?, dot? }] }]
 */
export default function SideNav({ sections }) {
  return (
    <nav className="sidenav" aria-label="Side navigation">
      {sections.map((section, si) => (
        <div key={si}>
          {section.label && (
            <div className="sidenav-section">{section.label}</div>
          )}
          {section.items.map((item, ii) => (
            <NavLink
              key={ii}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidenav-item${isActive ? ' active' : ''}`
              }
            >
              {item.dot && <span className="sidenav-dot" aria-hidden="true" />}
              <span>{item.label}</span>
              {item.badge != null && (
                <span className="sidenav-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
