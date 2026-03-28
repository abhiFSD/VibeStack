import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import awsconfig from './aws-exports';
import AppRouter from './AppRouter';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { UserProvider } from './contexts/UserContext';
import { ToolContextProvider } from './contexts/ToolContextProvider';
import { AwardProvider } from './contexts/AwardContext';
import { AdminProvider } from './contexts/AdminContext';
import { TutorialProvider } from './contexts/TutorialContext';
import TermsAndConditionsCheck from './components/TermsAndConditionsCheck';
import { testOxworksOrganization } from './test-oxworks';
import { addUserToOxworks } from './fix-oxworks-membership';
import { findOxworksOwner } from './find-owner';

Amplify.configure(awsconfig);

// Global error handler to suppress AWS auth byteLength errors in public pages
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && event.error.message.includes('byteLength')) {
    console.log('Suppressed AWS authentication error on public page');
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('byteLength')) {
    console.log('Suppressed AWS authentication promise rejection on public page');
    event.preventDefault();
  }
});

// Make test functions available in browser console
window.findOwner = findOxworksOwner;

// Add debug function for user sync issues
