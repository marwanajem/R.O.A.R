/**
 * navSections — shared side-nav configs for TM and Admin pages.
 *
 * Usage:
 *   Top-level TM:    <SideNav sections={tmTopNavSections()} />
 *   Event-level TM:  <SideNav sections={tmNavSections(eventId, event?.type)} />
 *   Top-level Admin: <SideNav sections={adminTopNavSections()} />
 *   Event Admin:     <SideNav sections={adminNavSections(eventId)} />
 */

export function tmTopNavSections() {
  return [
    {
      label: 'Navigation',
      items: [
        { to: '/events', label: 'All Events', end: true },
        { to: '/events?filter=open', label: 'Open Registration' },
        { to: '/events?filter=upcoming', label: 'Upcoming' },
        { to: '/events?filter=past', label: 'Past Events' },
      ],
    },
    {
      label: 'Club Management',
      items: [
        { to: '/club/roster', label: 'Master Athlete List' },
        { to: '/club/payments', label: 'Overall Payments' },
      ],
    },
  ]
}

export function tmNavSections(eventId, eventType = 'WT') {
  const base = `/events/${eventId}`
  
  // Dynamically swap terminology based on the rulebook
  const categoryItems = eventType === 'ITF' 
    ? [
        { to: `${base}/sparring`, label: 'Sparring' },
        { to: `${base}/pattern`,  label: 'Pattern' },
      ]
    : [
        { to: `${base}/kyorugi`,  label: 'Kyorugi' },
        { to: `${base}/poomsae`,  label: 'Poomsae' },
      ];

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
      label: 'Categories',
      items: categoryItems,
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