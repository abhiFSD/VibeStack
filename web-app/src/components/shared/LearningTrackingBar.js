import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Alert, Button, Row, Col } from 'react-bootstrap';
import { FaPlay, FaStop, FaClock, FaBook, FaCoins } from 'react-icons/fa';
import { API, graphqlOperation } from 'aws-amplify';
import { createLearningSession, updateLearningSession, createLearningProgress, updateLearningProgress } from '../../graphql/mutations';
import { listLearningProgresses, getLearningProgress, listAwards } from '../../graphql/queries';
import { useUser } from '../../contexts/UserContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { addAward } from '../../utils/awards';

const LearningTrackingBar = forwardRef(({ 
  learningId, 
  learningTitle, 
  onTrackingStateChange,
  onTrackingStopped,
  isHidden = false
}, ref) => {
  const { user: currentUser } = useUser();
  const { activeOrganization: currentOrganization } = useOrganization();
  
  const [isTracking, setIsTracking] = useState(false);
  const [sessionElapsedTime, setSessionElapsedTime] = useState(0); // Total elapsed since start
  const [activeTime, setActiveTime] = useState(0); // Only active time in current session
  const [totalTimeSpent, setTotalTimeSpent] = useState(0); // Cumulative across all sessions
  const [progressId, setProgressId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isUserActive, setIsUserActive] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [sessionCoinsProgress, setSessionCoinsProgress] = useState(0);
  const [totalEarnedCoins, setTotalEarnedCoins] = useState(0);
  
  const sessionStartTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const activityTimeoutRef = useRef(null);
  const progressLoadedRef = useRef(null); // Track which learning we've loaded progress for

  // Storage keys
  const getStorageKey = (key) => `learning_${learningId}_${currentUser?.attributes?.sub}_${key}`;

  // Load existing progress when component mounts
  useEffect(() => {
    if (learningId && currentUser?.attributes?.sub && currentOrganization?.id) {
      const loadKey = `${currentUser.attributes.sub}-${learningId}-${currentOrganization.id}`;
      
      // Only load if we haven't already loaded progress for this specific combination
      if (progressLoadedRef.current !== loadKey) {
        console.log('🔄 Loading progress for new learning:', loadKey);
        progressLoadedRef.current = loadKey;
        loadExistingProgress();
      } else {
        console.log('✅ Progress already loaded for:', loadKey);
      }
    }
  }, [learningId, currentUser?.attributes?.sub, currentOrganization?.id]);

  // Activity tracking
  useEffect(() => {
    const markActivity = () => {
      setIsUserActive(true);
      lastActivityRef.current = Date.now();
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = setTimeout(() => {
        setIsUserActive(false);
      }, 30000); // 30 seconds of inactivity
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, markActivity, true);
    });

    markActivity(); // Initialize as active

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, markActivity, true);
      });
      clearTimeout(activityTimeoutRef.current);
    };
  }, []);

  // Sync activity status check (runs every second when tracking)
  useEffect(() => {
    if (!isTracking) return;

    const syncInterval = setInterval(() => {
      const currentTime = Date.now();
      const isCurrentlyActive = (currentTime - lastActivityRef.current) < 30000;
      
      if (isUserActive !== isCurrentlyActive) {
        setIsUserActive(isCurrentlyActive);
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [isTracking, isUserActive]);

  // Tab visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Refresh warning when tracking
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isTracking) {
        e.preventDefault();
        e.returnValue = 'You have an active learning session. Your progress will be lost if you refresh or leave. Are you sure?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isTracking]);

  const loadExistingProgress = useCallback(async () => {
    const loadKey = `${currentUser.attributes.sub}-${learningId}-${currentOrganization.id}`;
    const lockKey = `progress_loading_${loadKey}`;
    const timestampKey = `progress_timestamp_${loadKey}`;
    
    // Check if another instance is already loading or has recently loaded
    const existingLock = localStorage.getItem(lockKey);
    const lastLoadTime = localStorage.getItem(timestampKey);
    
    // If loaded within last 5 seconds, skip
    if (lastLoadTime && (Date.now() - parseInt(lastLoadTime)) < 5000) {
      console.log('🚫 Progress loaded recently, skipping duplicate load');
      return;
    }
    
    // If another instance is loading right now, wait a bit and check
    if (existingLock && (Date.now() - parseInt(existingLock)) < 30000) {
      console.log('🔒 Another instance is loading, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if it completed
      const newTimestamp = localStorage.getItem(timestampKey);
      if (newTimestamp && (Date.now() - parseInt(newTimestamp)) < 5000) {
        console.log('✅ Another instance completed loading, skipping');
        return;
      }
    }
    
    if (isLoadingProgress) {
      console.log('🚫 Already loading in this instance, skipping...');
      return;
    }
    
    setIsLoadingProgress(true);
    
    try {
      // Set lock
      localStorage.setItem(lockKey, Date.now().toString());
      console.log('🔒 Acquired load lock for:', loadKey);
      
      // Query for existing records
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

      let existingRecords = progressData.data.listLearningProgresses.items;
      console.log('📊 Progress query result:', existingRecords.length, 'records found for', loadKey);

      if (existingRecords.length > 0) {
        // Sort by creation date to get the most recent
        existingRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const existingProgress = existingRecords[0];
        
        setProgressId(existingProgress.id);
        setTotalTimeSpent(existingProgress.totalTimeSpent || 0);
        setTotalEarnedCoins(calculateTotalEarnedCoins(existingProgress.totalTimeSpent || 0));
        console.log('✅ Using existing progress:', existingProgress.id, 'with time:', existingProgress.totalTimeSpent, 'seconds');
        
        // Set progress loaded after state is updated
        setTimeout(() => setProgressLoaded(true), 100);
        
        // Log duplicates if any
        if (existingRecords.length > 1) {
          console.warn('⚠️ DUPLICATE ALERT: Found', existingRecords.length, 'progress records!');
          console.warn('All records:', existingRecords.map(r => ({ 
            id: r.id, 
            createdAt: r.createdAt, 
            time: r.totalTimeSpent,
            lastAccessed: r.lastAccessedAt 
          })));
          console.warn('👉 Please use the "Clean Duplicates" button in Learning Analytics');
        }
      } else {
        // Use localStorage as an additional coordination mechanism
        const creationLockKey = `progress_creating_${loadKey}`;
        const existingCreationLock = localStorage.getItem(creationLockKey);
        
        if (existingCreationLock && (Date.now() - parseInt(existingCreationLock)) < 10000) {
          console.log('🚫 Another instance is creating, waiting...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Re-query to see if it was created
          const recheckData = await API.graphql(
            graphqlOperation(listLearningProgresses, {
              filter: {
                userSub: { eq: currentUser.attributes.sub },
                learningID: { eq: learningId },
                organizationID: { eq: currentOrganization.id },
                _deleted: { ne: true }
              }
            })
          );
          
          const recheckRecords = recheckData.data.listLearningProgresses.items;
          if (recheckRecords.length > 0) {
            const existingProgress = recheckRecords[0];
            setProgressId(existingProgress.id);
            setTotalTimeSpent(existingProgress.totalTimeSpent || 0);
            setTotalEarnedCoins(calculateTotalEarnedCoins(existingProgress.totalTimeSpent || 0));
            console.log('📝 Found record created by another instance:', existingProgress.id);
            
            // Set progress loaded after state is updated
            setTimeout(() => setProgressLoaded(true), 100);
            return;
          }
        }
        
        // Set creation lock
        localStorage.setItem(creationLockKey, Date.now().toString());
        console.log('🔨 Creating new progress record for:', loadKey);
        
        try {
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
          setProgressId(newProgress.data.createLearningProgress.id);
          setTotalTimeSpent(0);
          setTotalEarnedCoins(0);
          console.log('✅ Successfully created new progress:', newProgress.data.createLearningProgress.id);
          
          // Set progress loaded after state is updated
          setTimeout(() => setProgressLoaded(true), 100);
          
          // Clear creation lock
          localStorage.removeItem(creationLockKey);
        } catch (createError) {
          console.error('❌ Error creating progress:', createError);
          localStorage.removeItem(creationLockKey);
          
          // Final fallback - query one more time
          const finalData = await API.graphql(
            graphqlOperation(listLearningProgresses, {
              filter: {
                userSub: { eq: currentUser.attributes.sub },
                learningID: { eq: learningId },
                organizationID: { eq: currentOrganization.id },
                _deleted: { ne: true }
              }
            })
          );
          
          const finalRecords = finalData.data.listLearningProgresses.items;
          if (finalRecords.length > 0) {
            const existingProgress = finalRecords[0];
            setProgressId(existingProgress.id);
            setTotalTimeSpent(existingProgress.totalTimeSpent || 0);
            setTotalEarnedCoins(calculateTotalEarnedCoins(existingProgress.totalTimeSpent || 0));
            console.log('🔄 Fallback: Using existing record:', existingProgress.id);
            
            // Set progress loaded after state is updated
            setTimeout(() => setProgressLoaded(true), 100);
          }
        }
      }
      
      // Mark as loaded successfully
      localStorage.setItem(timestampKey, Date.now().toString());
      
    } catch (error) {
      console.error('❌ Error in loadExistingProgress:', error);
    } finally {
      // Clear locks
      localStorage.removeItem(lockKey);
      setIsLoadingProgress(false);
      console.log('🔓 Released load lock for:', loadKey);
    }
  }, [currentUser, learningId, currentOrganization, isLoadingProgress]);

  const calculateSessionCoinsProgress = (activeTime) => {
    if (!currentOrganization?.learningCoinsEnabled) {
      return 0;
    }

    const coinsPerInterval = currentOrganization.learningCoinsPerInterval || 5;
    const intervalSeconds = currentOrganization.learningCoinInterval || 300; // 5 minutes
    const maxCoinsPerSession = currentOrganization.learningMaxCoinsPerSession || 20;

    const completeIntervals = Math.floor(activeTime / intervalSeconds);
    const potentialCoins = Math.min(completeIntervals * coinsPerInterval, maxCoinsPerSession);

    return potentialCoins;
  };

  const calculateTotalEarnedCoins = (totalTime) => {
    if (!currentOrganization?.learningCoinsEnabled) {
      return 0;
    }

    const coinsPerInterval = currentOrganization.learningCoinsPerInterval || 5;
    const intervalSeconds = currentOrganization.learningCoinInterval || 300; // 5 minutes
    const maxCoinsPerModule = currentOrganization.learningMaxCoinsPerSession || 20;

    // Calculate based on total accumulated time for this learning module
    const totalCompleteIntervals = Math.floor(totalTime / intervalSeconds);
    const totalPotentialCoins = Math.min(totalCompleteIntervals * coinsPerInterval, maxCoinsPerModule);

    return totalPotentialCoins;
  };

  const calculateAndAwardLearningCoins = async (newTotalTimeSeconds, learningId) => {
    try {
      console.log('🎯 === LEARNING COINS CALCULATION START ===');
      console.log('📊 Input params:', {
        newTotalTimeSeconds,
        learningId,
        userSub: currentUser?.attributes?.sub,
        organizationId: currentOrganization?.id
      });

      // Check if learning coins are enabled for this organization
      console.log('⚙️ Organization learning coins settings from database:', {
        learningCoinsEnabled: currentOrganization?.learningCoinsEnabled,
        learningCoinsPerInterval: currentOrganization?.learningCoinsPerInterval,
        learningCoinInterval: currentOrganization?.learningCoinInterval,
        learningMaxCoinsPerSession: currentOrganization?.learningMaxCoinsPerSession,
        fullOrganizationObject: currentOrganization
      });

      if (!currentOrganization?.learningCoinsEnabled) {
        console.log('❌ Learning coins are disabled for this organization');
        return 0;
      }

      // Get organization settings with defaults
      const coinsPerInterval = currentOrganization.learningCoinsPerInterval || 5;
      const intervalSeconds = currentOrganization.learningCoinInterval || 300; // 5 minutes
      const maxCoinsPerModule = currentOrganization.learningMaxCoinsPerSession || 20; // Note: keeping same field name for backward compatibility
      
      console.log('📋 Final settings after applying defaults:', {
        coinsPerInterval,
        intervalSeconds,
        intervalMinutes: intervalSeconds / 60,
        maxCoinsPerModule
      });

      // Calculate how many complete intervals should exist based on total time
      const totalCompleteIntervals = Math.floor(newTotalTimeSeconds / intervalSeconds);
      const totalPotentialCoins = totalCompleteIntervals * coinsPerInterval;

      console.log('🧮 Time-based calculations:', {
        newTotalTimeSeconds,
        newTotalTimeMinutes: newTotalTimeSeconds / 60,
        intervalSeconds,
        intervalMinutes: intervalSeconds / 60,
        totalCompleteIntervals,
        coinsPerInterval,
        totalPotentialCoins
      });

      // Check how many coins user has already earned from this specific learning module
      console.log('🔍 Querying existing awards with filter:', {
        user_sub: currentUser.attributes.sub,
        organizationID: currentOrganization.id,
        tool_id: learningId,
        type: 'LEARNING_TIME_MILESTONE'
      });

      const existingCoinsQuery = await API.graphql(
        graphqlOperation(listAwards, {
          filter: {
            user_sub: { eq: currentUser.attributes.sub },
            organizationID: { eq: currentOrganization.id },
            tool_id: { eq: learningId },
            type: { eq: 'LEARNING_TIME_MILESTONE' },
            _deleted: { ne: true }
          },
          limit: 1000
        })
      );

      console.log('📝 Raw awards query result:', existingCoinsQuery);

      const existingAwards = existingCoinsQuery.data.listAwards.items;
      const totalExistingCoins = existingAwards.reduce((sum, award) => sum + (award.coins || 0), 0);
      
      console.log('💰 Existing awards analysis:', {
        existingAwardsCount: existingAwards.length,
        existingAwards: existingAwards.map(award => ({
          id: award.id,
          coins: award.coins,
          title: award.title,
          date: award.date,
          tool_id: award.tool_id
        })),
        totalExistingCoins
      });
      
      // Calculate how many coins we should award based on the difference
      const coinsUserShouldHave = Math.min(totalPotentialCoins, maxCoinsPerModule);
      const coinsToAward = Math.max(0, coinsUserShouldHave - totalExistingCoins);

      console.log('🎯 FINAL DECISION CALCULATION:', {
        newTotalTimeSeconds,
        intervalSeconds,
        totalCompleteIntervals,
        coinsPerInterval,
        maxCoinsPerModule,
        totalPotentialCoins,
        totalExistingCoins,
        coinsUserShouldHave,
        coinsToAward,
        willAwardCoins: coinsToAward > 0
      });

      // Award coins if any are due
      if (coinsToAward > 0) {
        console.log('🏆 PROCEEDING TO AWARD COINS');
        const totalMinutesLearned = Math.floor(newTotalTimeSeconds / 60);
        const awardTitle = `${totalMinutesLearned} Minutes Total Learning Time`;
        
        console.log('🎁 Award details:', {
          awardType: 'LEARNING_TIME_MILESTONE',
          organizationId: currentOrganization.id,
          awardTitle,
          learningId,
          userSub: currentUser.attributes.sub,
          coinsToAward
        });
        
        try {
          // Pass the calculated coin amount to override the default
          const awardResult = await addAward(
            'LEARNING_TIME_MILESTONE',
            currentOrganization.id,
            awardTitle,
            learningId,
            null,
            currentUser.attributes.sub,
            coinsToAward // Override the default coin amount
          );

          console.log('🎉 Award creation result:', awardResult);
          console.log(`✅ Successfully awarded ${coinsToAward} coins for reaching ${totalMinutesLearned} total minutes of learning`);
          console.log(`Total coins earned from this learning module: ${totalExistingCoins + coinsToAward}/${maxCoinsPerModule}`);
        } catch (awardError) {
          console.error('❌ Error creating award:', awardError);
        }
      } else if (coinsUserShouldHave <= totalExistingCoins) {
        console.log(`⏹️ No coins awarded - user already has correct amount (${totalExistingCoins}/${coinsUserShouldHave} for ${totalCompleteIntervals} completed intervals)`);
      } else {
        console.log('⏹️ No coins awarded - insufficient total learning time for next interval');
      }

      console.log('🎯 === LEARNING COINS CALCULATION END ===');

      return coinsToAward;
    } catch (error) {
      console.error('Error calculating and awarding learning coins:', error);
      return 0;
    }
  };

  const startTracking = async (externalProgressId = null) => {
    // Use external progressId if provided, otherwise use internal state
    const useProgressId = externalProgressId || progressId;
    
    if (!useProgressId) {
      console.error('No progress ID available - progress may not be loaded yet');
      console.log('Current state:', { 
        internalProgressId: progressId, 
        externalProgressId, 
        useProgressId,
        progressLoaded, 
        isLoadingProgress 
      });
      return;
    }
    
    console.log('✅ Starting tracking with progressId:', useProgressId);

    // If we got an external progressId and our internal one is different, update it
    if (externalProgressId && progressId !== externalProgressId) {
      console.log('🔄 Updating internal progressId from external source');
      setProgressId(externalProgressId);
    }

    try {
      // Create new session
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

      const newSessionId = sessionData.data.createLearningSession.id;
      setSessionId(newSessionId);
      setIsTracking(true);
      setSessionElapsedTime(0);
      setActiveTime(0);
      setSessionCoinsProgress(0);
      sessionStartTimeRef.current = Date.now();

      // Start dual timers
      intervalRef.current = setInterval(() => {
        // Always increment session elapsed time
        setSessionElapsedTime(prev => prev + 1);
        
        // Check current activity status and increment active time accordingly
        setActiveTime(prev => {
          // Get current values by checking refs and document state
          const currentTime = Date.now();
          const isCurrentlyActive = (currentTime - lastActivityRef.current) < 30000;
          const isCurrentlyVisible = !document.hidden;
          
          if (isCurrentlyActive && isCurrentlyVisible) {
            const newActiveTime = prev + 1;
            
            // Update session coins progress based on current organization settings
            setSessionCoinsProgress(calculateSessionCoinsProgress(newActiveTime));
            
            return newActiveTime;
          }
          return prev;
        });
      }, 1000);

      console.log('Started tracking session:', newSessionId);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const stopTracking = async () => {
    if (!isTracking || !sessionId || !progressId) {
      console.error('Cannot stop tracking - missing data');
      return;
    }

    try {
      // Save the active time (not the total session elapsed time)
      const activeTimeDuration = activeTime;
      const sessionElapsedDuration = sessionElapsedTime;
      
      // Update session with end time and elapsed duration (for record keeping)
      await API.graphql(
        graphqlOperation(updateLearningSession, {
          input: {
            id: sessionId,
            endTime: new Date().toISOString(),
            duration: sessionElapsedDuration, // Full session duration for records
            sectionsViewed: []
          }
        })
      );

      // Get current progress from database and add ONLY active time
      const currentProgress = await API.graphql(
        graphqlOperation(getLearningProgress, {
          id: progressId
        })
      );

      const currentDbTime = currentProgress.data.getLearningProgress?.totalTimeSpent || 0;
      const newTotalTime = currentDbTime + activeTimeDuration; // Add only active time

      // Update progress with new total time
      await API.graphql(
        graphqlOperation(updateLearningProgress, {
          input: {
            id: progressId,
            totalTimeSpent: newTotalTime,
            lastAccessedAt: new Date().toISOString()
          }
        })
      );

      // Calculate and award learning time coins based on total accumulated time
      console.log('🚀 CALLING calculateAndAwardLearningCoins with:', { newTotalTime, learningId });
      await calculateAndAwardLearningCoins(newTotalTime, learningId);

      // Update UI
      setTotalTimeSpent(newTotalTime);
      setTotalEarnedCoins(calculateTotalEarnedCoins(newTotalTime));
      setIsTracking(false);
      setSessionElapsedTime(0);
      setActiveTime(0);
      setSessionCoinsProgress(0);
      setSessionId(null);
      sessionStartTimeRef.current = null;

      // Clear timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      console.log('Session ended - breakdown:', {
        sessionElapsedTime: sessionElapsedDuration,
        activeTimeOnly: activeTimeDuration,
        previousTotal: currentDbTime,
        newTotal: newTotalTime,
        note: 'Only active time was added to total'
      });

      // Notify parent that tracking has stopped so it can show the modal again
      if (onTrackingStopped) {
        onTrackingStopped();
      }

    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Clean up localStorage locks to prevent stale locks
      if (learningId && currentUser?.attributes?.sub && currentOrganization?.id) {
        const loadKey = `${currentUser.attributes.sub}-${learningId}-${currentOrganization.id}`;
        const lockKey = `progress_loading_${loadKey}`;
        const creationLockKey = `progress_creating_${loadKey}`;
        
        localStorage.removeItem(lockKey);
        localStorage.removeItem(creationLockKey);
        console.log('🧹 Cleaned up localStorage locks on unmount');
      }
      
      // Reset progress loaded ref when component unmounts
      progressLoadedRef.current = null;
    };
  }, []);

  // Reset progress loaded ref when learning changes
  useEffect(() => {
    return () => {
      progressLoadedRef.current = null;
    };
  }, [learningId]);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    startTracking,
    stopTracking
  }), []);

  // Communicate state changes to parent component
  useEffect(() => {
    if (onTrackingStateChange) {
      onTrackingStateChange({
        isTracking,
        sessionElapsedTime,
        activeTime,
        totalTimeSpent,
        isUserActive,
        isTabVisible,
        progressLoaded,
        progressId // Pass progressId to parent so it can verify
      });
    }
  }, [isTracking, sessionElapsedTime, activeTime, totalTimeSpent, isUserActive, isTabVisible, progressLoaded, progressId]);

  if (!learningId || !currentUser?.attributes?.sub) {
    return null;
  }

  // Hide the tracking bar when modal should be shown
  if (isHidden) {
    return null;
  }

  return (
    <>
      <Alert variant={isTracking ? "success" : "info"} className="mb-0 rounded-0 border-0 border-bottom position-fixed w-100" style={{top: '70px', zIndex: 1020}}>
        <Row className="align-items-center">
          <Col md={2}>
            <div className="d-flex align-items-center">
              <FaBook className="me-2" />
              <strong className="text-truncate">{learningTitle || `Learning ${learningId.substring(0, 8)}`}</strong>
            </div>
          </Col>
          <Col md={7}>
            <div className="d-flex align-items-center justify-content-center">
              <FaClock className="me-3 text-primary" />
              
              {/* Session Timer - Single Line with Better Spacing */}
              <div className="d-flex align-items-center gap-3" style={{minWidth: '420px'}}>
                <span className="fw-bold" style={{minWidth: '90px', display: 'inline-block'}}>
                  <span className="text-muted me-1">Session:</span>
                  <span className="text-primary" style={{fontSize: '1.05rem'}}>{formatTime(sessionElapsedTime)}</span>
                </span>
                <span className="text-muted">|</span>
                <span className="fw-bold" style={{minWidth: '85px', display: 'inline-block'}}>
                  <span className="text-muted me-1">Active:</span>
                  <span className="text-success" style={{fontSize: '1.05rem'}}>{formatTime(activeTime)}</span>
                </span>
                <span className="text-muted">|</span>
                <span className="fw-bold" style={{minWidth: '80px', display: 'inline-block'}}>
                  <span className="text-muted me-1">Total:</span>
                  <span className="text-info" style={{fontSize: '1.05rem'}}>{formatTime(totalTimeSpent)}</span>
                </span>
                
                {/* Coins Display - Always show when enabled */}
                {currentOrganization?.learningCoinsEnabled && (
                  <>
                    <span className="text-muted mx-2">•</span>
                    <div className="d-flex align-items-center">
                      <FaCoins className="text-warning me-1" style={{fontSize: '13px'}} />
                      <span style={{fontSize: '13px'}} className="text-muted">
                        <strong>{totalEarnedCoins}</strong>/{currentOrganization.learningMaxCoinsPerSession || 20} earned
                        {isTracking && sessionCoinsProgress > 0 && (
                          <span className="text-success ms-1">
                            (+{sessionCoinsProgress} pending)
                          </span>
                        )}
                      </span>
                    </div>
                  </>
                )}
                
                {isTracking && (
                  <>
                    <span className="text-muted mx-2">•</span>
                    <div className="d-flex gap-2">
                      <span className={`badge ${isTabVisible ? 'bg-success' : 'bg-warning'}`} style={{fontSize: '10px'}}>
                        {isTabVisible ? '👁️' : '🙈'}
                      </span>
                      <span className={`badge ${isUserActive ? 'bg-success' : 'bg-warning'}`} style={{fontSize: '10px'}}>
                        {isUserActive ? '🖱️' : '😴'}
                      </span>
                      <span className={`badge ${isUserActive && isTabVisible ? 'bg-success' : 'bg-secondary'}`} style={{fontSize: '10px'}}>
                        {isUserActive && isTabVisible ? '⏱️' : '⏸️'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Col>
          <Col md={3} className="text-end">
            {!isTracking ? (
              <Button 
                variant="success" 
                size="sm" 
                onClick={startTracking}
                disabled={!progressId || isLoadingProgress}
              >
                <FaPlay className="me-1" />
                Start Tracking
              </Button>
            ) : (
              <Button 
                variant="danger" 
                size="sm" 
                onClick={stopTracking}
              >
                <FaStop className="me-1" />
                Stop & Save
              </Button>
            )}
          </Col>
        </Row>
      </Alert>
      
      {/* Warning message when tracking is active */}
      {isTracking && (
        <Alert variant="warning" className="mb-0 rounded-0 border-0 py-1 position-fixed w-100" style={{top: '130px', zIndex: 1020}}>
          <Row>
            <Col className="text-center">
              <small>
                <strong>⚠️ Important:</strong> Don't close, reload, or press back button without stopping the session - you will lose your progress! 
                <strong> The rewards/coins will be generated when you stop and save the session.</strong>
              </small>
            </Col>
          </Row>
        </Alert>
      )}
    </>
  );
});

export default LearningTrackingBar;