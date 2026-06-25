import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import LandingPage from './pages/landing/LandingPage'
import AboutPage from './pages/landing/AboutPage'
import OnboardingPage from './pages/onboarding/OnboardingPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './pages/dashboard/DashboardPage'
import HotspotsPage from './pages/dashboard/HotspotsPage'
import HotspotDetailPage from './pages/dashboard/HotspotDetailPage'
import NewHotspotPage from './pages/dashboard/NewHotspotPage'
import TicketsPage from './pages/dashboard/TicketsPage'
import HotspotPlansPage from './pages/dashboard/HotspotPlansPage'
import ForfaitNewPage from './pages/dashboard/ForfaitNewPage'
import TicketNewPage from './pages/dashboard/TicketNewPage'
import SessionsPage from './pages/dashboard/SessionsPage'
import PaymentsPage from './pages/dashboard/PaymentsPage'
import WithdrawalsPage from './pages/dashboard/WithdrawalsPage'
import SubscriptionsPage from './pages/dashboard/SubscriptionsPage'
import PlansPage from './pages/dashboard/PlansPage'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminUsersPage from './pages/dashboard/AdminUsersPage'
import AdminRouterBrandsPage from './pages/dashboard/AdminRouterBrandsPage'
import AdminDashboardPage from './pages/dashboard/AdminDashboardPage'
import SettingsPage from './pages/dashboard/SettingsPage'
import ProfilePage from './pages/dashboard/ProfilePage'
import AdminSettingsPage from './pages/dashboard/AdminSettingsPage'
import AdminTicketsPage from './pages/dashboard/AdminTicketsPage'
import AdminMonitoringPage from './pages/dashboard/AdminMonitoringPage'
import AdminWithdrawalsPage from './pages/dashboard/AdminWithdrawalsPage'
import AdminPaymentsPage from './pages/dashboard/AdminPaymentsPage'
import SupportPage from './pages/dashboard/SupportPage'
import { PublicSettingsProvider } from './context/PublicSettingsContext'
import PortalPage from './pages/portal/PortalPage'
import ReturnFromPayment from './pages/portal/ReturnFromPayment'

function App() {
  return (
    <div className="custom-scrollbar">
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: { background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' },
          duration: 4000,
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Pages publiques */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/sign-in" element={<LoginPage />} />
          <Route path="/sign-up" element={<RegisterPage />} />
          <Route path="/portal/:hotspotId" element={<PortalPage />} />
          <Route path="/payment/return" element={<ReturnFromPayment />} />

          {/* Onboarding protégé */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Pages protégées */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="hotspots" element={<HotspotsPage />} />
            <Route path="hotspots/new" element={<NewHotspotPage />} />
            <Route path="hotspots/:slug" element={<HotspotDetailPage />} />
            <Route path="forfaits" element={<HotspotPlansPage />} />
            <Route path="forfaits/new" element={<ForfaitNewPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/new" element={<TicketNewPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="withdrawals" element={<WithdrawalsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/router-brands" element={<AdminRouterBrandsPage />} />
            <Route path="admin/monitoring" element={<AdminMonitoringPage />} />
            <Route path="admin/withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="admin/payments" element={<AdminPaymentsPage />} />
            <Route path="admin/tickets" element={<AdminTicketsPage />} />
            <Route path="admin/settings" element={<AdminSettingsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="support" element={<PublicSettingsProvider><SupportPage /></PublicSettingsProvider>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
