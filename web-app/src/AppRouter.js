import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import { Container, Image, Form, Alert } from 'react-bootstrap';
import LFlogo from './assets/VibeStack_pro.png';
import TermsAndConditions from './components/TermsAndConditions';
import TermsPage from './components/public/TermsPage';
import { useState, useEffect } from 'react';
// Import components from their correct locations
import { 
  // Layouts
  AuthWrapper,
  
  // Screens
  Home,
  Reports,
  ActionItems,
  Projects,
  Profile,
  Awards,
  Tools,
  Quizzes,
  OrganizationManagement,
  ActionItemsByDate,
  
  // Public Components
  LandingPage,
  ReportPdf,
  ReportVsm as ReportVsmPdf,
  ReportChartPdf,
  ReportDataChartPdf,
  InviteAccept,
  
  // Shared Components
  DataCleanup,
  OrganizationSelector
} from './components';

// Direct imports for components not in index.js
import ReportChartView from './components/ReportChartView';
import TestPdf from './components/TestPdf';
import DeleteAccount from './components/DeleteAccount';
import TrialGuard from './components/auth/TrialGuard';
import LearningEdit from './components/Learning/LearningEdit';
import LearningList from './components/Learning/LearningList';
import LearningView from './components/Learning/LearningView';
import LearningAnalytics from './components/analytics/LearningAnalytics';
import LearningTrackingDebug from './components/debug/LearningTrackingDebug';
import LearningAwardsDebug from './components/debug/LearningAwardsDebug';
import KPIView from './components/screens/KPIView';
import Report5s from './components/reports/Report5s';
import QuizEdit from './components/Learning/QuizEdit';
import QuizList from './components/Learning/QuizList';
import QuizTake from './components/Learning/QuizTake';
import ProjectView from './components/screens/ProjectView';
import KPIViewPDF from './components/KPI/KPIView';
import SuperAdminConsole from './components/screens/SuperAdminConsole';
import SuperAdminRoute from './components/auth/SuperAdminRoute';
import AdministrativeFunctions from './components/screens/AdministrativeFunctions';
import QuickGuide from './components/screens/QuickGuide';
import IssueReporting from './components/screens/IssueReporting';
import IssueDetailPage from './components/screens/IssueDetailPage';
import TestFormattedHighlights from './components/TestFormattedHighlights';
import SimpleHighlightTest from './components/SimpleHighlightTest';
import ActionItemsList from './components/screens/ActionItemsList';
import UserShop from './components/shop/UserShop';
import UserInventory from './components/shop/UserInventory';
import ShopManagement from './components/shop/ShopManagement';
import { useOrganization } from './contexts/OrganizationContext';
import ReportBs from './components/reports/ReportBs';
import BoardView from './components/reports/BoardView';
import ReportHg from './components/reports/ReportHg';
import ReportSw from './components/reports/ReportSw';
import ReportVsm from './components/reports/ReportVsm';
import ProjectDetailsPdf from './components/public/ProjectDetailsPdf';
// Import the ChatBot component
import ChatBot from './components/ChatBot';
// Import the preview components
import SampleDataPreview from './components/preview/SampleDataPreview';
import SampleListPage from './components/preview/SampleListPage';

const LoginRoute = () => {
  const location = useLocation();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { activeOrganization } = useOrganization();

  // Add form validation for terms acceptance
  useEffect(() => {
    const handleFormSubmit = (e) => {
      // Check if this is a signup form
      const form = e.target;
      const hasConfirmPassword = form.querySelector('input[name="confirm_password"]');
      
      if (hasConfirmPassword) {
        // Get current checkbox state directly from DOM
        const termsCheckbox = document.getElementById('terms-checkbox');
        const isTermsChecked = termsCheckbox ? termsCheckbox.checked : false;
        
        console.log('Form submit, terms checkbox checked:', isTermsChecked);
        
        if (!isTermsChecked) {
          e.preventDefault();
          e.stopPropagation();
          alert('Please accept the Terms and Conditions to create an account.');
          return false;
        }
        console.log('Terms accepted, allowing form submission');
      }
    };

    // Add single global form submit listener
    document.addEventListener('submit', handleFormSubmit, true);
    
    return () => {
      document.removeEventListener('submit', handleFormSubmit, true);
    };
  }, []); // Empty dependency array since we're reading from DOM directly
  
  return (
    <Container fluid className="p-0 min-vh-100 d-flex flex-column justify-content-center align-items-center" style={{ background: '#f8f9fa' }}>
      <div className="text-center mb-4">
        <Image 
          src={LFlogo} 
          alt="VibeStack Logo" 
          style={{ 
            maxWidth: '200px', 
            marginBottom: '1rem' 
          }} 
        />
        <h2 className="mb-3" style={{ color: '#333' }}>Welcome to VibeStack™ Pro</h2>
        <p className="text-muted mb-4">Sign in to access your workspace</p>
      </div>
      
      <div style={{ 
        background: 'white', 
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <Authenticator
          initialState="signUp"
          signUpAttributes={['email', 'custom:first_name', 'custom:last_name']}
          formFields={{
            signUp: {
              email: {
                order: 1,
                label: 'Email',
                placeholder: 'Enter your email'
              },
              password: {
                order: 2,
                label: 'Password',
                placeholder: 'Enter your password'
              },
              confirm_password: {
                order: 3,
                label: 'Confirm Password',
                placeholder: 'Please confirm your password'
              },
              'custom:first_name': {
                order: 4,
                label: 'First Name',
                placeholder: 'Enter your first name'
              },
              'custom:last_name': {
                order: 5,
                label: 'Last Name',
                placeholder: 'Enter your last name'
              }
            }
          }}
        >
          {({ signOut, user }) => {
            if (user && !activeOrganization) {
              return (
                <div className="text-center">
                  <h3 className="mb-4">Welcome to VibeStack™ Pro</h3>
                  <OrganizationSelector />
                </div>
              );
            }
            const from = location.state?.from?.pathname || '/dashboard';
            return <Navigate to={from} replace />;
          }}
        </Authenticator>
        
        <div className="mt-3">
          <Form.Check
            type="checkbox"
            id="terms-checkbox"
            label={
              <span style={{ fontSize: '0.9rem' }}>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  style={{ 
                    color: '#007bff', 
                    textDecoration: 'none', 
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer'
                  }}
                >
                  Terms and Conditions
                </button>
              </span>
            }
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="text-start"
          />
          {!termsAccepted && (
            <Alert variant="info" className="mt-2 mb-0" style={{ fontSize: '0.8rem' }}>
              Please accept the Terms and Conditions to create an account.
            </Alert>
          )}
        </div>
      </div>
      
      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <TermsAndConditions 
          onAccept={() => setShowTermsModal(false)}
          onClose={() => setShowTermsModal(false)}
          requireCheckbox={false}
          viewOnly={true}
        />
      )}
    </Container>
  );
};

const AppRouter = () => {
  return (
    <Routes>
      {/* VibeStack Pro landing page at root URL */}
      <Route path="/" element={<LandingPage />} />
      
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/invite" element={<InviteAccept />} />
      <Route path="/terms" element={<TermsPage />} />
      
      {/* Public Routes - No Auth Required */}
      <Route path="/report_pdf/:reportId" element={<ReportPdf />} />
      <Route path="/report_vsm/:reportId" element={<ReportVsmPdf />} />
      <Route path="/report/Charts/:reportId" element={<ReportChartPdf />} />
      <Route path="/report/Charts_view/:reportId" element={<ReportChartView />} />
      <Route path="/report_Chart/:reportId" element={<ReportDataChartPdf />} />
      <Route path="/kpi_pdf/:kpiId" element={<KPIViewPDF />} />
      <Route path="/project_details/:projectId" element={<ProjectDetailsPdf />} />
      <Route path="/preview/samples" element={<SampleDataPreview />} />
      <Route path="/preview/list" element={<SampleListPage />} />
      
      <Route element={<TrialGuard><AuthWrapper /></TrialGuard>}>
        {/* Dashboard (authenticated home) */}
        <Route path="/dashboard" element={<Home />} />

        {/* Main */}
        <Route path="/reports" element={<Reports />} />
        <Route path="/action-items" element={<ActionItems />} />
        <Route path="/action-items-list" element={<ActionItemsList />} />
        <Route path="/action-items/:reportId?" element={<ActionItems />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/project/:projectId" element={<ProjectView />} />
        <Route path="/learnings" element={<LearningList />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/awards" element={<Awards />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/organization-management" element={<OrganizationManagement />} />
        <Route path="/action-items/:date" element={<ActionItemsByDate />} />
        <Route path="/kpi/:kpiId" element={<KPIView />} />
        <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminConsole /></SuperAdminRoute>} />
        <Route path="/start-smart" element={<AdministrativeFunctions />} />
        <Route path="/quick-guide" element={<QuickGuide />} />
        <Route path="/issue-reporting" element={<IssueReporting />} />
        <Route path="/issue/:issueId" element={<IssueDetailPage />} />
        <Route path="/chatbot" element={<ChatBot />} />
        
        {/* Shop Routes */}
        <Route path="/shop" element={<UserShop />} />
        <Route path="/inventory" element={<UserInventory />} />
        <Route path="/organization-management/shop" element={<ShopManagement />} />
        
        {/* Reports */}
        <Route path="/report/:reportId" element={<Report5s />} />
        <Route path="/report/bs/:reportId" element={<ReportBs />} />
        <Route path="/report/board/:reportId" element={<BoardView />} />
        <Route path="/report/hg/:reportId" element={<ReportHg />} />
        <Route path="/report/sw/:reportId" element={<ReportSw />} />
        <Route path="/report/vsm/:reportId" element={<ReportVsm />} />
        
        {/* Others */}
        <Route path="/test" element={<TestPdf />} />
        <Route path="/test-formatted" element={<TestFormattedHighlights />} />
        <Route path="/test-simple" element={<SimpleHighlightTest />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        

        {/* Learnings */}
        <Route path="/learning/:learningId/edit" element={<LearningEdit />} />
        <Route path="/learning/:learningId/view" element={<LearningView />} />
        <Route path="/learning/:learningId/quizzes" element={<QuizList />} />
        <Route path="/learning/:learningId/quiz/new" element={<QuizEdit />} />
        <Route path="/learning/:learningId/quiz/:quizId" element={<QuizEdit />} />
        <Route path="/learning/:learningId/quiz/:quizId/take" element={<QuizTake />} />
        
        {/* Learning Analytics */}
        <Route path="/learning-analytics" element={<LearningAnalytics />} />
        <Route path="/learning-debug" element={<LearningTrackingDebug />} />
        <Route path="/learning-awards-debug" element={<LearningAwardsDebug />} />
      </Route>

      {/* Catch all route - redirect to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter; 