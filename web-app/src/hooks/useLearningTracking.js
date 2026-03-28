import { useState, useEffect, useRef, useCallback } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { createLearningSession, updateLearningSession, createLearningProgress, updateLearningProgress } from '../graphql/mutations';
import { listLearningProgresses, getLearningProgress } from '../graphql/queries';
import { useUser } from '../contexts/UserContext';
import { useOrganization } from '../contexts/OrganizationContext';

const useLearningTracking = (learningId) => {
  const { user: currentUser } = useUser();
  const { activeOrganization: currentOrganization } = useOrganization();
  
  // Use localStorage for persistence across re-renders
  const getStorageKey = (key) => `learning_${learningId}_${currentUser?.attributes?.sub}_${key}`;
  
  const [sessionId, setSessionId] = useState(null);
  const [progressId, setProgressId] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [sectionsViewed, setSectionsViewed] = useState([]);
  
  const sessionStartTimeRef = useRef(null);
  const lastUpdateTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const pageVisibleRef = useRef(true);
  const lastActivityRef = useRef(Date.now());
  const isActiveRef = useRef(true);
  const activityTimeoutRef = useRef(null);
  const sessionIdRef = useRef(null);
  const progressIdRef = useRef(null);
  const isTrackingRef = useRef(false);

  // Initialize from localStorage - only run once when component mounts
  useEffect(() => {
    if (!learningId || !currentUser?.attributes?.sub) return;
    
    const getKey = (key) => `learning_${learningId}_${currentUser.attributes.sub}_${key}`;
    
    const storedSessionId = localStorage.getItem(getKey('sessionId'));
    const storedProgressId = localStorage.getItem(getKey('progressId'));
    const storedIsTracking = localStorage.getItem(getKey('isTracking')) === 'true';
    
    console.log('Initializing from localStorage for learningId:', learningId, {
      userSub: currentUser.attributes.sub,
      sessionKey: getKey('sessionId'),
      progressKey: getKey('progressId'),
      storedSessionId,
      storedProgressId,
      storedIsTracking
    });
    
    if (storedSessionId) {
      console.log('Restoring sessionId from localStorage:', storedSessionId);
      setSessionId(storedSessionId);
      sessionIdRef.current = storedSessionId;
    }
    if (storedProgressId) {
      console.log('Restoring progressId from localStorage:', storedProgressId);
      setProgressId(storedProgressId);
      progressIdRef.current = storedProgressId;
    }
    if (storedIsTracking) {
      console.log('Restoring isTracking from localStorage:', storedIsTracking);
      setIsTracking(storedIsTracking);
    }
  }, [learningId, currentUser?.attributes?.sub]); // Remove circular dependencies

  // Debug: Track when IDs change and update refs
  useEffect(() => {
    isTrackingRef.current = isTracking;
    console.log('ID State changed:', {
      sessionId: sessionId,
      progressId: progressId,
      isTracking: isTracking
    });
  }, [sessionId, progressId, isTracking]);

  // Activity tracking functions
  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      console.log('User became active');
    }
    
    // Clear existing timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    // Set new timeout for 30 seconds of inactivity
    activityTimeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
      console.log('User became inactive (30s without activity)');
    }, 30000);
  }, []);

  // Setup activity listeners
  useEffect(() => {
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus'
    ];
    
    events.forEach(event => {
      document.addEventListener(event, markActivity, true);
    });
    
    // Initialize activity
    markActivity();
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, markActivity, true);
      });
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [markActivity]);

  // Page visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      pageVisibleRef.current = isVisible;
      
      if (isVisible) {
        console.log('Tab became visible');
        markActivity(); // Mark as active when tab becomes visible
      } else {
        console.log('Tab became hidden');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [markActivity]);

  // Initialize progress when needed (called from startSession)
  const initializeProgress = useCallback(async () => {
    if (!currentUser?.attributes?.sub || !currentOrganization?.id || !learningId) {
      console.log('Missing data for progress initialization');
      return null;
    }

    if (progressIdRef.current) {
      console.log('Progress already initialized:', progressIdRef.current);
      return progressIdRef.current;
    }

    console.log('Initializing progress for:', learningId);

    try {
      // Check if progress already exists
      const progressData = await API.graphql(
        graphqlOperation(listLearningProgresses, {
          filter: {
            userSub: { eq: currentUser.attributes.sub },
            learningID: { eq: learningId },
            organizationID: { eq: currentOrganization.id },
            _deleted: { ne: true }
          }
        })
      );

      console.log('Existing progress query result:', progressData.data.listLearningProgresses.items.length);

      if (progressData.data.listLearningProgresses.items.length > 0) {
        const existingProgress = progressData.data.listLearningProgresses.items[0];
        console.log('Using existing progress:', existingProgress.id, 'with time:', existingProgress.totalTimeSpent);
        const progressIdValue = existingProgress.id;
        setProgressId(progressIdValue);
        progressIdRef.current = progressIdValue;
        localStorage.setItem(getStorageKey('progressId'), progressIdValue);
        
        // Ensure we use the database value for totalTimeSpent
        const dbTotalTime = existingProgress.totalTimeSpent || 0;
        console.log('Re-entering learning - database time:', dbTotalTime, 'current state time:', totalTimeSpent);
        setTotalTimeSpent(dbTotalTime);
        setSectionsViewed(existingProgress.sectionsViewed || []);
        console.log('Loaded total time from database:', dbTotalTime);
        return progressIdValue;
      } else {
        console.log('Creating new progress record');
        const newProgress = await API.graphql(
          graphqlOperation(createLearningProgress, {
            input: {
              userSub: currentUser.attributes.sub,
              organizationID: currentOrganization.id,
              learningID: learningId,
              totalTimeSpent: 0,
              sectionsViewed: [],
              chaptersCompleted: [],
              completionPercentage: 0,
              firstAccessedAt: new Date().toISOString(),
              lastAccessedAt: new Date().toISOString(),
              totalSessions: 0,
              averageSessionDuration: 0
            }
          })
        );
        const progressIdValue = newProgress.data.createLearningProgress.id;
        console.log('Created new progress:', progressIdValue);
        setProgressId(progressIdValue);
        progressIdRef.current = progressIdValue;
        localStorage.setItem(getStorageKey('progressId'), progressIdValue);
        return progressIdValue;
      }
    } catch (error) {
      console.error('Error initializing learning progress:', error);
      return null;
    }
  }, [currentUser, currentOrganization, learningId]);

  // Update session time periodically - only for active time
  const updateSessionTime = useCallback(async () => {
    const currentSessionId = sessionIdRef.current;
    const currentProgressId = progressIdRef.current;
    
    if (!currentSessionId || !currentProgressId) {
      console.log('Cannot update session time - missing sessionId or progressId:', {
        sessionId: !!currentSessionId,
        progressId: !!currentProgressId
      });
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastUpdate = Math.floor((currentTime - lastUpdateTimeRef.current) / 1000);
    
    // Only count time if user was active during this period
    // Check if there was activity in the last update interval
    const lastActivityTime = lastActivityRef.current;
    const wasActiveRecently = (currentTime - lastActivityTime) < 15000; // 15 seconds buffer
    
    if (!wasActiveRecently) {
      console.log('Skipping time update - user was inactive');
      lastUpdateTimeRef.current = currentTime; // Update timestamp but don't count time
      return;
    }

    lastUpdateTimeRef.current = currentTime;

    console.log('Updating progress with active time:', {
      timeSinceLastUpdate,
      currentTotalTime: totalTimeSpent,
      newTotalTime: totalTimeSpent + timeSinceLastUpdate,
      lastActivity: new Date(lastActivityTime).toLocaleTimeString(),
      progressId: currentProgressId,
      learningId: learningId
    });

    try {
      // Update the session duration as well for better accuracy
      const sessionDuration = Math.floor((currentTime - sessionStartTimeRef.current) / 1000);
      await API.graphql(
        graphqlOperation(updateLearningSession, {
          input: {
            id: currentSessionId,
            duration: sessionDuration
          }
        })
      );
      
      await API.graphql(
        graphqlOperation(updateLearningProgress, {
          input: {
            id: currentProgressId,
            totalTimeSpent: totalTimeSpent + timeSinceLastUpdate,
            lastAccessedAt: new Date().toISOString()
          }
        })
      );
      setTotalTimeSpent(prev => prev + timeSinceLastUpdate);
      console.log('Progress and session updated successfully');
    } catch (error) {
      console.error('Error updating session time:', error);
    }
  }, [totalTimeSpent, learningId]);

  // Start tracking session
  const startSession = useCallback(async () => {
    if (!currentUser?.attributes?.sub || !currentOrganization?.id || !learningId) {
      console.log('Cannot start session - missing data:', {
        userSub: !!currentUser?.attributes?.sub,
        orgId: !!currentOrganization?.id,
        learningId: !!learningId
      });
      return;
    }

    // If already tracking and have valid sessionId, don't create new session
    if (isTracking && sessionId) {
      console.log('Session already active:', { sessionId, isTracking });
      return;
    }

    console.log('Starting learning session...');

    // Initialize progress first (only once)
    const progressIdValue = await initializeProgress();
    if (!progressIdValue) {
      console.error('Failed to initialize progress, cannot start session');
      return;
    }

    try {
      // If there's an existing session ID in localStorage, try to end it first
      const existingSessionId = localStorage.getItem(getStorageKey('sessionId'));
      if (existingSessionId && existingSessionId !== sessionId) {
        console.log('Cleaning up existing session:', existingSessionId);
        try {
          await API.graphql(
            graphqlOperation(updateLearningSession, {
              input: {
                id: existingSessionId,
                endTime: new Date().toISOString(),
                duration: 0  // Unknown duration for cleanup
              }
            })
          );
        } catch (cleanupError) {
          console.warn('Could not cleanup existing session:', cleanupError);
        }
      }

      const sessionData = await API.graphql(
        graphqlOperation(createLearningSession, {
          input: {
            userSub: currentUser.attributes.sub,
            organizationID: currentOrganization.id,
            learningID: learningId,
            startTime: new Date().toISOString(),
            sectionsViewed: []
          }
        })
      );

      const sessionIdValue = sessionData.data.createLearningSession.id;
      console.log('Session created with ID:', sessionIdValue);
      
      setSessionId(sessionIdValue);
      sessionIdRef.current = sessionIdValue;
      localStorage.setItem(getStorageKey('sessionId'), sessionIdValue);
      sessionStartTimeRef.current = Date.now();
      lastUpdateTimeRef.current = Date.now();
      setIsTracking(true);
      localStorage.setItem(getStorageKey('isTracking'), 'true');

      console.log('Session started successfully:', {
        sessionId: sessionIdValue,
        startTime: new Date()
      });

      // Start periodic updates - more frequent for better accuracy
      intervalRef.current = setInterval(() => {
        const isTabVisible = pageVisibleRef.current;
        const isUserActive = isActiveRef.current;
        
        if (isTabVisible && isUserActive) {
          console.log('Updating session time... (tab visible & user active)');
          updateSessionTime();
        } else {
          console.log('Skipping update:', { 
            tabVisible: isTabVisible, 
            userActive: isUserActive 
          });
        }
      }, 10000); // Update every 10 seconds for better responsiveness
    } catch (error) {
      console.error('Error starting learning session:', error);
    }
  }, [currentUser, currentOrganization, learningId, isTracking, sessionId]);

  // End tracking session
  const endSession = useCallback(async () => {
    if (!sessionId || !isTracking) {
      console.log('Cannot end session - missing sessionId or not tracking:', {
        sessionId: !!sessionId,
        isTracking
      });
      return;
    }

    console.log('Ending learning session:', sessionId);

    try {
      const now = Date.now();
      const startTime = sessionStartTimeRef.current;
      const duration = Math.floor((now - startTime) / 1000);
      
      console.log('Session timing details:', {
        now: new Date(now).toISOString(),
        startTime: new Date(startTime).toISOString(),
        durationMs: now - startTime,
        durationSeconds: duration
      });
      
      // Prevent multiple calls by clearing start time
      sessionStartTimeRef.current = null;
      
      // Update session first - but handle errors gracefully
      try {
        const sessionUpdateResult = await API.graphql(
          graphqlOperation(updateLearningSession, {
            input: {
              id: sessionId,
              endTime: new Date().toISOString(),
              duration: duration,
              sectionsViewed: [...new Set(sectionsViewed)]
            }
          })
        );
        console.log('Session updated:', sessionUpdateResult);
      } catch (sessionError) {
        console.warn('Could not update session (maybe already ended):', sessionError);
        // Continue to update progress even if session update fails
      }

      // Update progress - use actual session duration, not accumulated time
      if (progressId) {
        // Get the actual total time from the database first
        try {
          const progressData = await API.graphql(
            graphqlOperation(`
              query GetLearningProgress($id: ID!) {
                getLearningProgress(id: $id) {
                  id
                  totalTimeSpent
                }
              }
            `, { id: progressId })
          );
          
          let currentDbTime = progressData.data.getLearningProgress?.totalTimeSpent || 0;
          
          // Validate time - if it's unrealistic (more than 24 hours), reset it
          const maxReasonableTime = 24 * 60 * 60; // 24 hours in seconds
          if (currentDbTime > maxReasonableTime) {
            console.warn('Detected corrupted time data:', currentDbTime, 'seconds. Resetting to 0.');
            currentDbTime = 0;
          }
          
          const newTotalTime = currentDbTime + duration;
          
          console.log('Updating progress with accurate time:', {
            originalDbTime: progressData.data.getLearningProgress?.totalTimeSpent,
            currentDbTime,
            sessionDuration: duration,
            newTotalTime,
            progressId
          });
          
          const progressUpdateResult = await API.graphql(
            graphqlOperation(updateLearningProgress, {
              input: {
                id: progressId,
                totalTimeSpent: newTotalTime,
                sectionsViewed: [...new Set(sectionsViewed)],
                lastAccessedAt: new Date().toISOString()
              }
            })
          );
          
          console.log('Progress updated in endSession:', progressUpdateResult);
          setTotalTimeSpent(newTotalTime);
        } catch (error) {
          console.error('Error fetching/updating progress:', error);
          // Try to fetch current progress one more time before falling back
          try {
            console.log('Attempting fallback fetch...');
            const fallbackProgressResponse = await API.graphql({
              query: getLearningProgress,
              variables: { id: progressId }
            });
            
            let fallbackCurrentTime = fallbackProgressResponse.data.getLearningProgress?.totalTimeSpent || 0;
            
            // Validate fallback time too
            const maxReasonableTime = 24 * 60 * 60;
            if (fallbackCurrentTime > maxReasonableTime) {
              console.warn('Fallback: Detected corrupted time data:', fallbackCurrentTime, 'seconds. Resetting to 0.');
              fallbackCurrentTime = 0;
            }
            
            const newTotalTime = fallbackCurrentTime + duration;
            console.log('Fallback time calculation:', { fallbackCurrentTime, duration, newTotalTime });
            
            await API.graphql(
              graphqlOperation(updateLearningProgress, {
                input: {
                  id: progressId,
                  totalTimeSpent: newTotalTime,
                  sectionsViewed: [...new Set(sectionsViewed)],
                  lastAccessedAt: new Date().toISOString()
                }
              })
            );
            setTotalTimeSpent(newTotalTime);
          } catch (fallbackError) {
            console.error('Fallback also failed, using local time:', fallbackError);
            // Last resort: use local time
            const newTotalTime = totalTimeSpent + duration;
            await API.graphql(
              graphqlOperation(updateLearningProgress, {
                input: {
                  id: progressId,
                  totalTimeSpent: newTotalTime,
                  sectionsViewed: [...new Set(sectionsViewed)],
                  lastAccessedAt: new Date().toISOString()
                }
              })
            );
            setTotalTimeSpent(newTotalTime);
          }
        }
      }

      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      setIsTracking(false);
      setSessionId(null);
      sessionIdRef.current = null;
      localStorage.removeItem(getStorageKey('sessionId'));
      localStorage.removeItem(getStorageKey('isTracking'));
    } catch (error) {
      console.error('Error ending learning session:', error);
      console.error('Error details:', error.errors || error.message);
    }
  }, [sessionId, isTracking, progressId, totalTimeSpent, sectionsViewed]);

  // Track section view
  const trackSectionView = useCallback((sectionId) => {
    if (!sectionId || sectionsViewed.includes(sectionId)) return;
    
    setSectionsViewed(prev => [...prev, sectionId]);
  }, [sectionsViewed]);

  // Reset total time
  const resetTotalTime = useCallback(async () => {
    if (!progressId) {
      console.log('Cannot reset time - no progressId');
      return;
    }

    try {
      console.log('Resetting total time to 0');
      await API.graphql(
        graphqlOperation(updateLearningProgress, {
          input: {
            id: progressId,
            totalTimeSpent: 0,
            lastAccessedAt: new Date().toISOString()
          }
        })
      );
      setTotalTimeSpent(0);
      console.log('Total time reset successfully');
    } catch (error) {
      console.error('Error resetting total time:', error);
    }
  }, [progressId]);


  // Reset progress when learning changes
  useEffect(() => {
    console.log('Learning ID changed to:', learningId);
    // End current session if tracking
    if (isTracking && sessionIdRef.current) {
      console.log('Ending session due to learning change');
      endSession();
    }
    // Clear progress and session references
    progressIdRef.current = null;
    sessionIdRef.current = null;
    setProgressId(null);
    setSessionId(null);
    setIsTracking(false);
    setTotalTimeSpent(0);
    setSectionsViewed([]);
    // Clear localStorage for old learning
    if (learningId && currentUser?.attributes?.sub) {
      localStorage.removeItem(getStorageKey('sessionId'));
      localStorage.removeItem(getStorageKey('progressId'));
      localStorage.removeItem(getStorageKey('isTracking'));
    }
  }, [learningId]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sessionIdRef.current) {
        // Don't call endSession in cleanup as it can cause loops
        // Just clear localStorage
        localStorage.removeItem(getStorageKey('sessionId'));
        localStorage.removeItem(getStorageKey('isTracking'));
      }
    };
  }, []);

  return {
    startSession,
    endSession,
    trackSectionView,
    resetTotalTime,
    isTracking,
    totalTimeSpent,
    sectionsViewed,
    progressId,
    sessionIdRef,
    isTrackingRef
  };
};

export default useLearningTracking;