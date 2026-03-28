import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useTutorial } from '../../contexts/TutorialContext';
import { TUTORIAL_TYPES } from '../../utils/tutorialSteps';

const ReportsTutorial = ({ hasReports = false }) => {
  console.log('ReportsTutorial rendering with hasReports:', hasReports);
  const { tutorialState, completeTutorial } = useTutorial();
  console.log('Tutorial state in ReportsTutorial:', tutorialState);
  
  const [createButtonClicked, setCreateButtonClicked] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Listen for modal opening to detect create button click
  useEffect(() => {
    const checkModalOpen = () => {
      const modal = document.querySelector('.modal.show');
      if (modal && !createButtonClicked) {
        console.log('Modal detected, create button was clicked');
        setCreateButtonClicked(true);
      }
    };

    // Check periodically for modal
    const interval = setInterval(checkModalOpen, 500);
    return () => clearInterval(interval);
  }, [createButtonClicked]);

  // Complete tutorial steps including modal form
  const steps = hasReports ? [
    {
      target: 'body',
      content: 'Welcome to your Reports Dashboard! This tutorial will guide you through creating and managing lean methodology reports.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.fab-create-report',
      content: createButtonClicked 
        ? 'Great! Now you\'ve clicked the create button. Click "Next" to continue to the form.'
        : 'Click this button to create a new report. This is your main entry point for starting any lean methodology project. The tutorial will continue once you click it.',
      placement: 'top-start',
      offset: 20,
      spotlightClicks: true,
      disableBeacon: true,
      hideNextButton: !createButtonClicked,
      styles: {
        options: {
          primaryColor: createButtonClicked ? '#00897b' : '#ff9800',
          width: 320,
        },
        tooltip: {
          fontSize: '14px',
          padding: '20px'
        }
      }
    },
    {
      target: '.modal-header',
      content: 'Great! Now you\'re in the Report Creation Modal. Let\'s walk through each field to set up your lean methodology report.',
      placement: 'top',
    },
    {
      target: 'input[name="name"]',
      content: 'First, give your report a descriptive name. This helps you identify and organize your lean projects. For example: "Production Line 5S Implementation".',
      placement: 'bottom',
    },
    {
      target: 'select[name="type"]',
      content: 'Select the lean methodology you want to use. VibeStack Pro offers 21+ different report types, each with specific features designed for different improvement scenarios.',
      placement: 'bottom',
    },
    {
      target: 'select[name="project"]',
      content: 'Optionally, link this report to a project for better organization. This helps track progress across multiple related initiatives.',
      placement: 'bottom',
    },
    {
      target: '.assign-members-section',
      content: 'You can assign team members to collaborate on this report. They\'ll receive notifications and can contribute to the process.',
      placement: 'top',
    },
    {
      target: '.modal-footer .btn-primary',
      content: 'Finally, click "Create Report" to start your lean methodology project. You\'ll be taken to the report editor to begin your work.',
      placement: 'top',
      spotlightClicks: true,
    }
  ] : [
    {
      target: 'body',
      content: 'Welcome to VibeStack Pro! You don\'t have any reports yet. Let\'s create your first one!',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.btn-create-report-empty',
      content: createButtonClicked 
        ? 'Perfect! You\'ve clicked the create button. Click "Next" to continue to the form.'
        : 'Click this button to create your first lean methodology report. The tutorial will continue once you click it.',
      placement: 'top',
      spotlightClicks: true,
      disableBeacon: true,
      hideNextButton: !createButtonClicked,
      styles: {
        options: {
          primaryColor: createButtonClicked ? '#00897b' : '#ff9800',
        }
      }
    },
    {
      target: '.modal-header',
      content: 'Perfect! Now you\'re in the Report Creation Modal. Let\'s fill out the form to create your first report.',
      placement: 'top',
    },
    {
      target: 'input[name="name"]',
      content: 'Give your report a descriptive name. For example: "Manufacturing Line 5S Implementation" or "Customer Service Kaizen Event".',
      placement: 'bottom',
    },
    {
      target: 'select[name="type"]',
      content: 'Choose the lean methodology that best fits your improvement goal. VibeStack Pro offers 21+ different report types, each with specific tools and templates.',
      placement: 'bottom',
    },
    {
      target: 'select[name="project"]',
      content: 'Optionally link this report to a project for better organization. You can skip this for now.',
      placement: 'bottom',
    },
    {
      target: '.assign-members-section',
      content: 'You can assign team members to collaborate on this report. This is optional for your first report.',
      placement: 'top',
    },
    {
      target: '.modal-footer .btn-primary',
      content: 'Click "Create Report" to start your first lean methodology project!',
      placement: 'top',
      spotlightClicks: true,
    }
  ];

  const handleCallback = (data) => {
    console.log('Tutorial callback:', data);
    const { status, index, action } = data;
    
    // Update step index
    if (action === 'next' || action === 'prev') {
      setStepIndex(index);
    }
    
    // Prevent going to next step if on create button step and button hasn't been clicked
    if (action === 'next' && (index === 1) && !createButtonClicked) {
      console.log('Preventing next step - create button not clicked yet');
      return false; // Prevent progression
    }
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      completeTutorial(TUTORIAL_TYPES.REPORTS_CREATE);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={tutorialState.isRunning && tutorialState.tutorialType === TUTORIAL_TYPES.REPORTS_CREATE}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: '#00897b',
          textColor: '#333',
          backgroundColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          arrowColor: '#fff',
          zIndex: 10000
        },
        tooltip: {
          fontSize: '14px',
          padding: '20px'
        },
        tooltipContent: {
          padding: '10px 0'
        },
        buttonNext: {
          backgroundColor: '#00897b',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 16px',
          fontSize: '14px'
        },
        buttonSkip: {
          color: '#666',
          fontSize: '14px'
        }
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tutorial'
      }}
    />
  );
};

export default ReportsTutorial;