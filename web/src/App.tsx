import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthSessionRefresh } from './components/AuthSessionRefresh';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { TenantsPage } from './pages/admin/TenantsPage';
import { SystemPage } from './pages/admin/SystemPage';
import { RegisterCompanyPage } from './pages/RegisterCompanyPage';
import { SignUpPage } from './pages/SignUpPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { RecruitmentLayout } from './pages/recruitment/RecruitmentLayout';
import { JobsPage } from './pages/recruitment/JobsPage';
import { JobPipelinePage } from './pages/recruitment/JobPipelinePage';
import { CandidatesPage } from './pages/recruitment/CandidatesPage';
import { InterviewsPage } from './pages/recruitment/InterviewsPage';
import { OffersPage } from './pages/recruitment/OffersPage';
import { PlacementsPage } from './pages/recruitment/PlacementsPage';
import { TalentPoolLayout } from './pages/talent-pool/TalentPoolLayout';
import { PoolsPage } from './pages/talent-pool/PoolsPage';
import { PoolDetailPage } from './pages/talent-pool/PoolDetailPage';
import { ProfilesPage } from './pages/talent-pool/ProfilesPage';
import { SavedSearchesPage } from './pages/talent-pool/SavedSearchesPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { PublicCareersLayout } from './pages/public/PublicCareersLayout';
import { PublicJobsPage } from './pages/public/PublicJobsPage';
import { PublicApplyPage } from './pages/public/PublicApplyPage';
import { PublicTalentPoolPage } from './pages/public/PublicTalentPoolPage';
import { PayrollLayout } from './pages/payroll/PayrollLayout';
import { PayrollDashboard } from './pages/payroll/PayrollDashboard';
import { PayrollEmployeesPage } from './pages/payroll/PayrollEmployeesPage';
import { PayrollEmployeeDetailPage } from './pages/payroll/PayrollEmployeeDetailPage';
import { PayrollEmployeeFormPage } from './pages/payroll/PayrollEmployeeFormPage';
import { PayrollPeriodsPage } from './pages/payroll/PayrollPeriodsPage';
import { PayrollPeriodDetailPage } from './pages/payroll/PayrollPeriodDetailPage';
import { PayrollApprovalsPage } from './pages/payroll/PayrollApprovalsPage';
import { PayrollOutsourcingPage } from './pages/payroll/PayrollOutsourcingPage';
import { OutsourcingContractsPage } from './pages/payroll/OutsourcingContractsPage';
import { PayrollReportsPage } from './pages/payroll/PayrollReportsPage';
import { PayrollConfigPage } from './pages/payroll/PayrollConfigPage';
import { PayrollBillingPage } from './pages/payroll/PayrollBillingPage';
import { ClientPortalPayrollPage } from './pages/client-portal/ClientPortalPayrollPage';

export default function App() {
  return (
    <>
      <AuthSessionRefresh />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/register-company" element={<RegisterCompanyPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/apply/:slug" element={<PublicCareersLayout />}>
        <Route index element={<PublicJobsPage />} />
        <Route path="jobs/:jobId" element={<PublicApplyPage />} />
        <Route path="talent-pool" element={<PublicTalentPoolPage />} />
      </Route>
      <Route
        path="/platform"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="system" element={<SystemPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route
        path="/recruitment"
        element={
          <ProtectedRoute>
            <RecruitmentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="jobs" replace />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:jobId" element={<JobPipelinePage />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="placements" element={<PlacementsPage />} />
      </Route>
      <Route
        path="/talent-pool"
        element={
          <ProtectedRoute>
            <TalentPoolLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="pools" replace />} />
        <Route path="pools" element={<PoolsPage />} />
        <Route path="pools/:poolId" element={<PoolDetailPage />} />
        <Route path="profiles" element={<ProfilesPage />} />
        <Route path="searches" element={<SavedSearchesPage />} />
      </Route>
      <Route
        path="/payroll"
        element={
          <ProtectedRoute>
            <PayrollLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PayrollDashboard />} />
        <Route path="employees" element={<PayrollEmployeesPage />} />
        <Route path="employees/new" element={<PayrollEmployeeFormPage />} />
        <Route path="employees/:employeeId" element={<PayrollEmployeeDetailPage />} />
        <Route path="employees/:id/edit" element={<PayrollEmployeeFormPage />} />
        <Route path="periods" element={<PayrollPeriodsPage />} />
        <Route path="periods/:id" element={<PayrollPeriodDetailPage />} />
        <Route path="approvals" element={<PayrollApprovalsPage />} />
        <Route path="outsourcing" element={<PayrollOutsourcingPage />} />
        <Route path="outsourcing/contracts" element={<OutsourcingContractsPage />} />
        <Route path="reports" element={<PayrollReportsPage />} />
        <Route path="config" element={<PayrollConfigPage />} />
        <Route path="config/new" element={<PayrollConfigPage />} />
        <Route path="billing" element={<PayrollBillingPage />} />
      </Route>
      <Route path="/client-portal/payroll" element={<ProtectedRoute><ClientPortalPayrollPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
