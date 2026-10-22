import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import Stamp from '../../components/ui/Stamp'
import { tmTopNavSections } from '../../utils/navSections'

export default function OverallPayments() {
  const { user } = useAuth()
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [grandTotal, setGrandTotal] = useState(0)

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!user?.clubCode) return;

      try {
        const [eventsRes, rosterRes] = await Promise.all([
          fetch('/api/events'),
          fetch(`/api/competitors/club/${user.clubCode}`)
        ]);

        const events = await eventsRes.json();
        const athletes = await rosterRes.json();

        // Fetch teams dynamically for every event this club might be in
        const teamsPromises = events.map(ev => 
          fetch(`/api/teams/event/${ev.id}/club/${user.clubCode}`)
            .then(res => res.ok ? res.json() : [])
        );
        const teamsData = await Promise.all(teamsPromises);

        const athletesByEvent = {};
        athletes.forEach(ath => {
          if (!athletesByEvent[ath.eventId]) athletesByEvent[ath.eventId] = [];
          athletesByEvent[ath.eventId].push(ath);
        });

        let totalAllEvents = 0;
        const clubSummaries = [];

        events.forEach((ev, index) => {
          const eventAthletes = athletesByEvent[ev.id] || [];
          const eventTeams = teamsData[index] || [];
          
          if (eventAthletes.length > 0 || eventTeams.length > 0) {
            const indivRate = parseFloat(ev.individualFee || 0);
            const teamRate = parseFloat(ev.teamFee || 0);
            
            const indivTotal = eventAthletes.length * indivRate;
            const teamTotal = eventTeams.length * teamRate;
            const eventTotalDue = indivTotal + teamTotal;
            
            totalAllEvents += eventTotalDue;

            clubSummaries.push({
              eventId: ev.id,
              eventName: ev.shortName || ev.name,
              athleteCount: eventAthletes.length,
              teamCount: eventTeams.length,
              indivRate,
              teamRate,
              totalDue: eventTotalDue,
              status: 'pending' 
            });
          }
        });

        setSummaries(clubSummaries);
        setGrandTotal(totalAllEvents);
      } catch (error) {
        console.error("Error fetching payment data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPaymentData();
  }, [user]);

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Club Management' }, { label: 'Overall Payments' }]} />
      <div className="wf-body">
        <SideNav sections={tmTopNavSections()} />
        <main className="wf-main" style={{ padding: '2rem' }}>
          <div className="page-head">
            <div>
              <h2>Overall Payments</h2>
              <p className="page-head-sub">
                Financial summary across all registered tournaments for {user?.clubName}
              </p>
            </div>
            <div className="stat-card" style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderColor: 'var(--gold-soft)' }}>
               <div className="stat-card-label" style={{ color: 'var(--gold)' }}>Total Outstanding</div>
               <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>MYR {grandTotal.toFixed(2)}</div>
            </div>
          </div>

          <div className="box" style={{ padding: 0, overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', color: 'var(--muted)' }}>Calculating fees...</div>
            ) : summaries.length === 0 ? (
              <div style={{ padding: '2rem', color: 'var(--muted)' }}>No active event registrations found.</div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Registered</th>
                    <th>Fee Breakdown</th>
                    <th>Total Due</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((summary) => (
                    <tr key={summary.eventId}>
                      <td className="name" style={{ color: 'var(--ink)' }}>{summary.eventName}</td>
                      <td>
                        <div><span className="mono-value">{summary.athleteCount}</span> fighters</div>
                        {summary.teamCount > 0 && (
                          <div style={{ marginTop: '4px' }}><span className="mono-value">{summary.teamCount}</span> teams</div>
                        )}
                      </td>
                      <td>
                         <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                           {summary.athleteCount} × MYR {summary.indivRate}
                         </div>
                         {summary.teamCount > 0 && (
                           <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                             {summary.teamCount} × MYR {summary.teamRate}
                           </div>
                         )}
                      </td>
                      <td className="amount-gold">MYR {summary.totalDue.toFixed(2)}</td>
                      <td>
                        <Stamp variant={summary.status === 'paid' ? 'ok' : 'warn'}>
                          {summary.status.toUpperCase()}
                        </Stamp>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/events/${summary.eventId}/fees`} className="btn btn-sm btn-ghost">
                          View Invoice &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}