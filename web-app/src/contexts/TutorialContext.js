import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context
const TutorialContext = createContext();

// Create a Provider component
export const TutorialProvider = ({ children }) => {
  const [tutorialState, setTutorialState] = useState({
    isRunning: false,
    currentStep: 0,
    tutorialType: null, // 'reports-create', 'reports-list', etc.
    completedTutorials: [],
    showTutorial: false
  });

  // Load tutorial state from localStorage on component mount
  useEffect(() => {
    const savedTutorialState = localStorage.getItem('tutorialState');
    if (savedTutorialState) {
      try {
        const parsedState = JSON.parse(savedTutorialState);
        setTutorialState(prevState => ({
          ...prevState,
          completedTutorials: parsedState.completedTutorials || []
        }));
      } catch (error) {
        console.error('Error parsing tutorial state:', error);
      }
    }
  }, []);

  // Save tutorial state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tutorialState', JSON.stringify({
      completedTutorials: tutorialState.completedTutorials
    }));
  }, [tutorialState.completedTutorials]);

  const startTutorial = (tutorialType) => {
    setTutorialState(prevState => ({
      ...prevState,
      isRunning: true,
      currentStep: 0,
      tutorialType,
      showTutorial: true
    }));
  };

  const stopTutorial = () => {
    setTutorialState(prevState => ({
      ...prevState,
      isRunning: false,
      currentStep: 0,
      tutorialType: null,
      showTutorial: false
    }));
  };

  const completeTutorial = (tutorialType) => {
    setTutorialState(prevState => ({
      ...prevState,
      isRunning: false,
      currentStep: 0,
      tutorialType: null,
      showTutorial: false,
      completedTutorials: [...prevState.completedTutorials, tutorialType]
    }));
  };

  const skipTutorial = (tutorialType) => {
    setTutorialState(prevState => ({
      ...prevState,
      isRunning: false,
      currentStep: 0,
      tutorialType: null,
      showTutorial: false,
      completedTutorials: [...prevState.completedTutorials, tutorialType]
    }));
  };

  const updateTutorialStep = (step) => {
    setTutorialState(prevState => ({
      ...prevState,
      currentStep: step
    }));
  };

  const isTutorialCompleted = (tutorialType) => {
    return tutorialState.completedTutorials.includes(tutorialType);
  };

  const resetTutorials = () => {
    setTutorialState({
      isRunning: false,
      currentStep: 0,
      tutorialType: null,
      completedTutorials: [],
      showTutorial: false
    });
    localStorage.removeItem('tutorialState');
  };

  // Check if user should see tutorial (first time user for specific tutorial)
  const shouldShowTutorial = (tutorialType) => {
    return !isTutorialCompleted(tutorialType);
  };

  const value = {
    tutorialState,
    startTutorial,
    stopTutorial,
    completeTutorial,
    skipTutorial,
    updateTutorialStep,
    isTutorialCompleted,
    resetTutorials,
    shouldShowTutorial
  };

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
};

// Create a custom hook to use the context
export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

export default TutorialContext;