import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PlatformAdminPage } from './pages/PlatformAdminPage';
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/register-company" element={<RegisterCompanyPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route
        path="/platform"
        element={
          <ProtectedRoute>
            <PlatformAdminPage />
          </ProtectedRoute>
        }
      />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
