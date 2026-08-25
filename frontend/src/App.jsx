import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ui/ProtectedRoute'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// TM pages
import EventPicker from './pages/tm/EventPicker'
import EventHome from './pages/tm/EventHome'
import CompetitorList from './pages/tm/CompetitorList'
import AddCompetitor from './pages/tm/AddCompetitor'
import EditCompetitor from './pages/tm/EditCompetitor'
import BulkUpload from './pages/tm/BulkUpload'
import TeamList from './pages/tm/TeamList'
import TeamBuilder from './pages/tm/TeamBuilder'
import FeesPayment from './pages/tm/FeesPayment'

// Admin pages
import AdminEventList from './pages/admin/AdminEventList'
import CreateEvent from './pages/admin/CreateEvent'
import AdminEventDashboard from './pages/admin/AdminEventDashboard'
import AdminRoster from './pages/admin/AdminRoster'
import CategoryOverride from './pages/admin/CategoryOverride'
import WeightTemplates from './pages/admin/WeightTemplates'

// Misc
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* TM routes */}
            <Route path="/events" element={<ProtectedRoute requiredRole="TM"><EventPicker /></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute requiredRole="TM"><EventHome /></ProtectedRoute>} />
            <Route path="/events/:id/competitors" element={<ProtectedRoute requiredRole="TM"><CompetitorList /></ProtectedRoute>} />
            <Route path="/events/:id/competitors/upload" element={<ProtectedRoute requiredRole="TM"><BulkUpload /></ProtectedRoute>} />
            <Route path="/events/:id/competitors/add" element={<ProtectedRoute requiredRole="TM"><AddCompetitor /></ProtectedRoute>} />
            <Route path="/events/:id/competitors/:cid/edit" element={<ProtectedRoute requiredRole="TM"><EditCompetitor /></ProtectedRoute>} />
            <Route path="/events/:id/teams" element={<ProtectedRoute requiredRole="TM"><TeamList /></ProtectedRoute>} />
            <Route path="/events/:id/teams/new" element={<ProtectedRoute requiredRole="TM"><TeamBuilder /></ProtectedRoute>} />
            <Route path="/events/:id/fees" element={<ProtectedRoute requiredRole="TM"><FeesPayment /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminEventList /></ProtectedRoute>} />
            <Route path="/admin/weight-templates" element={<ProtectedRoute requiredRole="ADMIN"><WeightTemplates /></ProtectedRoute>} />
            <Route path="/admin/events/new" element={<ProtectedRoute requiredRole="ADMIN"><CreateEvent /></ProtectedRoute>} />
            <Route path="/admin/events/:id" element={<ProtectedRoute requiredRole="ADMIN"><AdminEventDashboard /></ProtectedRoute>} />
            <Route path="/admin/events/:id/roster" element={<ProtectedRoute requiredRole="ADMIN"><AdminRoster /></ProtectedRoute>} />
            <Route path="/admin/events/:id/categories" element={<ProtectedRoute requiredRole="ADMIN"><CategoryOverride /></ProtectedRoute>} />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
