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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
