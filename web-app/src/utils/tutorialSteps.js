// Tutorial steps configuration for different pages/features

export const TUTORIAL_TYPES = {
  REPORTS_CREATE: 'reports-create',
  REPORTS_LIST: 'reports-list'
};

// Tutorial steps for empty state (no reports)
export const emptyStateTutorialSteps = [
  {
    target: '.btn-create-report-empty',
    content: 'Welcome to VibeStack Pro! Let\'s create your first lean methodology report. Click this button to get started.',
    placement: 'top',
    disableBeacon: true,
    spotlightClicks: true,
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      },
      spotlight: {
        backgroundColor: 'transparent'
      }
    }
  }
];

// Tutorial steps for the Reports List page and Report Creation flow
export const reportsTutorialSteps = [
  {
    target: '.fab-create-report',
    content: 'Welcome to VibeStack Pro! Click this button to create your first report. This is your main entry point for starting any lean methodology project.',
    placement: 'left',
    disableBeacon: true,
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: '.modal-header',
    content: 'This is the Report Creation Modal. Here you can set up a new lean methodology report. Let\'s walk through each field to get you started.',
    placement: 'top',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: 'input[name="name"]',
    content: 'First, give your report a descriptive name. This will help you identify and organize your lean projects. For example: "Production Line 5S Implementation" or "Customer Service Process Improvement".',
    placement: 'top',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: 'select[name="type"]',
    content: 'Select the type of lean methodology you want to use. Each tool has specific features and templates designed for different improvement scenarios. Popular choices include 5S, Kaizen, and Value Stream Mapping.',
    placement: 'top',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: 'select[name="project"]',
    content: 'Optionally, associate this report with a specific project. This helps organize related reports and track project progress across multiple methodologies.',
    placement: 'top',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: '.assign-members-section',
    content: 'You can assign team members to collaborate on this report. Assigned members will receive notifications and can contribute to the improvement process.',
    placement: 'top',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: '.modal-footer .btn-primary',
    content: 'Once you\'ve filled in the details, click "Create Report" to start your lean methodology project. You\'ll be taken to the report editing page where you can begin your analysis.',
    placement: 'top',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  }
];

// Tutorial steps for the Reports List page (after creation)
export const reportsListTutorialSteps = [
  {
    target: '.reports-section',
    content: 'This is your Reports Dashboard. Here you can view all your lean methodology reports organized by status and ownership.',
    placement: 'top',
    disableBeacon: true,
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: '.report-card:first-child',
    content: 'Each report card shows key information: report name, type, creation date, assigned members, and progress status. The colored badges indicate the methodology type.',
    placement: 'top',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: '.report-card:first-child .report-actions',
    content: 'Use these action buttons to: Open (view/edit), Copy (duplicate), Mark as Complete, or Delete your reports. The tutorial video link provides methodology-specific guidance.',
    placement: 'left',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: '.filter-section',
    content: 'Use these filters to find specific reports by methodology type or project. This helps you manage large numbers of improvement projects efficiently.',
    placement: 'bottom',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: '.my-reports-section',
    content: 'Your reports are organized into "My Reports" (reports you created) and "Assigned Reports" (reports where you\'re a collaborator). Each section shows Ongoing and Completed reports.',
    placement: 'top',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  }
];

// Tutorial steps specifically for the modal when it's open
export const reportCreateModalSteps = [
  {
    target: '.modal-content',
    content: 'Welcome to the Report Creation Modal! Let\'s walk through creating your first lean methodology report step by step.',
    placement: 'center',
    disableBeacon: true,
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 400,
        zIndex: 10000
      }
    }
  },
  {
    target: 'input[name="name"]',
    content: 'Give your report a descriptive name that clearly identifies the improvement project. For example: "Manufacturing Line 5S Implementation" or "Customer Service Kaizen Event".',
    placement: 'bottom',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: 'select[name="type"]',
    content: 'Choose the lean methodology that best fits your improvement goal. Each methodology has specific tools and templates designed for different types of problems.',
    placement: 'bottom',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: 'select[name="project"]',
    content: 'Optionally link this report to a project for better organization. This helps track progress across multiple related improvement initiatives.',
    placement: 'bottom',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: '.assign-members-section',
    content: 'Assign team members to collaborate on this report. They\'ll receive notifications and can contribute to the improvement process.',
    placement: 'top',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  },
  {
    target: '.modal-footer .btn-primary',
    content: 'Click "Create Report" to start your lean methodology project. You\'ll be taken to the report editor where you can begin your analysis and improvement work.',
    placement: 'top',
    styles: {
      options: {
        primaryColor: '#00897b',
        width: 350,
        zIndex: 10000
      }
    }
  }
];

// Helper function to get steps by tutorial type
export const getTutorialSteps = (tutorialType, hasReports = true) => {
  switch (tutorialType) {
    case TUTORIAL_TYPES.REPORTS_CREATE:
      // If there are no reports, show empty state tutorial
      return hasReports ? reportsTutorialSteps : emptyStateTutorialSteps;
    case TUTORIAL_TYPES.REPORTS_LIST:
      return reportsListTutorialSteps;
    default:
      return [];
  }
};

// Helper function to get modal-specific steps
export const getModalTutorialSteps = () => {
  return reportCreateModalSteps;
};