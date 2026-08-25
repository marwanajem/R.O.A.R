import React from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { events } from '../../data/events'
import { adminTopNavSections } from '../../utils/navSections'

function statusVariant(status) {
  if (status === 'open') return 'ok'
  if (status === 'upcoming') return 'gold'
  return 'default'
}

export default function AdminEventList() {
  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Admin' }, { label: 'Events' }]} />
      <div className="wf-body">
        <SideNav sections={adminTopNavSections()} />
        <div className="wf-main">
        <PageHead
          title="Events CMS"
          sub="Manage championship events, categories, and registrations"
          right={
            <Btn variant="primary" to="/admin/events/new">
              + Create Event
            </Btn>
          }
        />

        {/* Summary chips */}
        <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <Chip variant="ok">{events.filter((e) => e.status === 'open').length} Open</Chip>
          <Chip variant="gold">{events.filter((e) => e.status === 'upcoming').length} Upcoming</Chip>
          <Chip variant="default">{events.filter((e) => e.status === 'archived').length} Archived</Chip>
          <Chip variant="default">{events.length} Total</Chip>
        </div>

        <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Name</th>
                <th>Ruleset</th>
                <th>Status</th>
                <th>Reg Window</th>
                <th>Event Date</th>
                <th>Competitors</th>
                <th>Clubs</th>
                <th>Payments</th>
                <th>Categories</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td className="mono">{ev.id}</td>
                  <td className="name">{ev.name}</td>
                  <td>
                    <Chip variant={ev.ruleset === 'WT' ? 'blue' : 'gold'}>{ev.ruleset}</Chip>
                  </td>
                  <td>
                    <Stamp variant={statusVariant(ev.status)}>
                      {ev.status}
                    </Stamp>
                  </td>
                  <td className="mono" style={{ fontSize: '0.7rem' }}>
                    {ev.regStart}<br />
                    <span style={{ color: 'var(--muted-2)' }}>→ {ev.regEnd}</span>
                  </td>
                  <td className="mono">{ev.eventDate}</td>
                  <td className="mono">{ev.stats.competitors}</td>
                  <td className="mono">{ev.stats.clubs}</td>
                  <td>
                    <span className="mono" style={{ color: ev.stats.pendingPayments > 0 ? 'var(--gold)' : 'var(--ok)' }}>
                      {ev.stats.pendingPayments} pending
                    </span>
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {ev.categories.map((cat) => (
                        <Chip key={cat} variant="ghost" style={{ fontSize: '0.6rem' }}>{cat}</Chip>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <Btn variant="ghost" size="sm" to={`/admin/events/${ev.id}`}>
                        Manage
                      </Btn>
                      <Btn variant="ghost" size="sm" to={`/admin/events/${ev.id}/categories`}>
                        Cats
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  )
}
