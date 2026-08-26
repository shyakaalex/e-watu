import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthSessionRefresh } from './components/AuthSessionRefresh';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { TenantBlockedPage } from './pages/TenantBlockedPage';
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
import { CandidateDetailPage } from './pages/recruitment/CandidateDetailPage';
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
import { PayrollRunsPage } from './pages/payroll/PayrollRunsPage';
import { PayrollRunDetailPage } from './pages/payroll/PayrollRunDetailPage';
import { PayrollClientsPage } from './pages/payroll/PayrollClientsPage';
import { PayrollPlaceholderPage } from './pages/payroll/PayrollPlaceholderPage';
import { PayrollBulkUploadPage } from './pages/payroll/PayrollBulkUploadPage';
import { ClientPortalPayrollPage } from './pages/client-portal/ClientPortalPayrollPage';
import { PerformanceCyclesPage } from './pages/payroll/PerformanceCyclesPage';
import { PerformanceGoalsPage } from './pages/payroll/PerformanceGoalsPage';
import { PerformanceAppraisalsPage } from './pages/payroll/PerformanceAppraisalsPage';
import { PerformanceImprovementPlansPage } from './pages/payroll/PerformanceImprovementPlansPage';
import { ImmigrationPermitsPage } from './pages/payroll/ImmigrationPermitsPage';
import { Feedback360Page } from './pages/payroll/Feedback360Page';
import { LeaveLayout } from './pages/leave/LeaveLayout';
import { LeaveDashboardPage } from './pages/leave/LeaveDashboardPage';
import { LeaveApplyPage } from './pages/leave/LeaveApplyPage';
import { LeaveRequestsPage } from './pages/leave/LeaveRequestsPage';
import { MyLeaveBalancePage } from './pages/leave/MyLeaveBalancePage';
import { LeaveCalendarPage } from './pages/leave/LeaveCalendarPage';
import { LeavePolicyPage } from './pages/leave/LeavePolicyPage';
import { LeaveHolidaysPage } from './pages/leave/LeaveHolidaysPage';
import { LeaveApprovalsPage } from './pages/leave/LeaveApprovalsPage';
import { LeaveBalancesPage } from './pages/leave/LeaveBalancesPage';
import { LeaveTypesPage } from './pages/leave/LeaveTypesPage';
import { PerformanceLayout } from './pages/performance/PerformanceLayout';


export default function App() {
  return (
    <>
      <AuthSessionRefresh />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/company-blocked" element={<TenantBlockedPage />} />
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
        <Route path="candidates/:id" element={<CandidateDetailPage />} />
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
        <Route index element={<Navigate to="approvals" replace />} />
        <Route path="approvals" element={<PayrollApprovalsPage />} />
        <Route path="clients" element={<PayrollClientsPage />} />
        <Route path="employees" element={<PayrollEmployeesPage />} />
        <Route path="employees/new" element={<PayrollEmployeeFormPage />} />
        <Route path="employees/:employeeId" element={<PayrollEmployeeDetailPage />} />
        <Route path="employees/:id/edit" element={<PayrollEmployeeFormPage />} />
        <Route path="bulk-upload" element={<PayrollBulkUploadPage />} />
        <Route path="consultants-upload" element={<PayrollPlaceholderPage title="Consultants Upload" />} />
        <Route path="runs" element={<PayrollRunsPage />} />
        <Route path="runs/:runId" element={<PayrollRunDetailPage />} />
        <Route path="periods" element={<PayrollPeriodsPage />} />
        <Route path="periods/:id" element={<PayrollPeriodDetailPage />} />
        <Route path="contracts" element={<OutsourcingContractsPage />} />
        <Route path="contract-templates" element={<PayrollPlaceholderPage title="Contract Templates" />} />
        <Route path="reports" element={<PayrollReportsPage />} />
        <Route path="email-settings" element={<PayrollPlaceholderPage title="Email Settings" />} />
        <Route path="email-templates" element={<PayrollPlaceholderPage title="Email Templates" />} />
        <Route path="notifications" element={<PayrollPlaceholderPage title="Notifications" />} />
        <Route path="settings" element={<PayrollConfigPage />} />
        <Route path="dashboard" element={<PayrollDashboard />} />
        <Route path="outsourcing" element={<PayrollOutsourcingPage />} />
        <Route path="outsourcing/contracts" element={<OutsourcingContractsPage />} />
        <Route path="config" element={<Navigate to="/payroll/settings" replace />} />
        <Route path="config/new" element={<Navigate to="/payroll/settings" replace />} />
        <Route path="billing" element={<PayrollBillingPage />} />
        <Route path="leave" element={<Navigate to="/leave" replace />} />
        <Route path="performance/*" element={<Navigate to="/performance/goals" replace />} />
        <Route path="immigration" element={<ImmigrationPermitsPage />} />
      </Route>
      <Route
        path="/leave"
        element={
          <ProtectedRoute>
            <LeaveLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LeaveDashboardPage />} />
        <Route path="apply" element={<LeaveApplyPage />} />
        <Route path="requests" element={<LeaveRequestsPage />} />
        <Route path="balance" element={<MyLeaveBalancePage />} />
        <Route path="calendar" element={<LeaveCalendarPage />} />
        <Route path="policy" element={<LeavePolicyPage />} />
        <Route path="holidays" element={<LeaveHolidaysPage />} />
        <Route path="documents" element={<PayrollPlaceholderPage title="Documents" />} />
        <Route path="notifications" element={<PayrollPlaceholderPage title="Notifications" />} />
        <Route path="settings" element={<PayrollPlaceholderPage title="Settings" />} />
        <Route path="help" element={<PayrollPlaceholderPage title="Help & Support" />} />
        <Route path="approvals" element={<LeaveApprovalsPage />} />
        <Route path="balances" element={<LeaveBalancesPage />} />
        <Route path="types" element={<LeaveTypesPage />} />
      </Route>
      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <PerformanceLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="goals" replace />} />
        <Route path="cycles" element={<PerformanceCyclesPage />} />
        <Route path="goals" element={<PerformanceGoalsPage />} />
        <Route path="appraisals" element={<PerformanceAppraisalsPage />} />
        <Route path="360-feedback" element={<Feedback360Page />} />
        <Route path="pips" element={<PerformanceImprovementPlansPage />} />
      </Route>
      <Route path="/client-portal/payroll" element={<ProtectedRoute><ClientPortalPayrollPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
