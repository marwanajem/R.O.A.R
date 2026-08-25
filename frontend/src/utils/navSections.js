/**
 * navSections — shared side-nav configs for TM and Admin pages.
 *
 * Usage:
 *   Top-level TM:    <SideNav sections={tmTopNavSections()} />
 *   Event-level TM:  <SideNav sections={tmNavSections(eventId)} />
 *   Top-level Admin: <SideNav sections={adminTopNavSections()} />
 *   Event Admin:     <SideNav sections={adminNavSections(eventId)} />
 */

export function tmTopNavSections() {
  return [
    {
      label: 'Navigation',
      items: [{ to: '/events', label: 'All Events', end: true }],
    },
  ]
}

export function tmNavSections(eventId) {
  const base = `/events/${eventId}`
  return [
    {
      label: 'Event',
      items: [{ to: base, label: 'Overview', end: true }],
    },
    {
      label: 'Registration',
      items: [
        { to: `${base}/competitors`, label: 'Competitors' },
        { to: `${base}/teams`,       label: 'Teams & Pairs' },
      ],
    },
    {
      label: 'Payment',
      items: [{ to: `${base}/fees`, label: 'Fees & Payment', dot: true }],
    },
  ]
}

export function adminTopNavSections() {
  return [
    {
      label: 'Admin',
      items: [
        { to: '/admin',                    label: 'Event List',        end: true },
        { to: '/admin/weight-templates',   label: 'Weight Templates'             },
      ],
    },
  ]
}

export function adminNavSections(eventId) {
  const base = `/admin/events/${eventId}`
  return [
    {
      label: 'Admin',
      items: [
        { to: '/admin',                    label: 'Event List',        end: true },
        { to: '/admin/weight-templates',   label: 'Weight Templates'             },
      ],
    },
    {
      label: 'Event',
      items: [
        { to: base,                    label: 'Dashboard',           end: true },
        { to: `${base}/roster`,        label: 'Competitor Roster'              },
        { to: `${base}/categories`,    label: 'Category Overrides'             },
      ],
    },
  ]
}
