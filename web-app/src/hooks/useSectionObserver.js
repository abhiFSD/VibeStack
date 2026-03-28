import { useEffect, useRef, useCallback } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { createSectionInteraction, updateSectionInteraction } from '../graphql/mutations';
import { listSectionInteractions } from '../graphql/queries';
import { useUser } from '../contexts/UserContext';
import { useOrganization } from '../contexts/OrganizationContext';

const useSectionObserver = (learningId, chapterId) => {
  const { user: currentUser } = useUser();
  const { activeOrganization: currentOrganization } = useOrganization();
  const sectionTimersRef = useRef({});
  const sectionInteractionsRef = useRef({});
  const observerRef = useRef(null);

  // Initialize section interactions
  const initializeSectionInteraction = useCallback(async (sectionId) => {
    if (!currentUser?.attributes?.sub || !currentOrganization?.id || !learningId || !chapterId || !sectionId) return;

    try {
      // Check if interaction exists
      const interactionData = await API.graphql(
        graphqlOperation(listSectionInteractions, {
          filter: {
            userSub: { eq: currentUser.attributes.sub },
            sectionID: { eq: sectionId },
            organizationID: { eq: currentOrganization.id }
          }
        })
      );

      if (interactionData.data.listSectionInteractions.items.length > 0) {
        const existing = interactionData.data.listSectionInteractions.items[0];
        sectionInteractionsRef.current[sectionId] = existing;
      } else {
        // Create new interaction
        const newInteraction = await API.graphql(
          graphqlOperation(createSectionInteraction, {
            input: {
              userSub: currentUser.attributes.sub,
              organizationID: currentOrganization.id,
              learningID: learningId,
              chapterID: chapterId,
              sectionID: sectionId,
              timeSpent: 0,
              viewCount: 1,
              firstViewedAt: new Date().toISOString(),
              lastViewedAt: new Date().toISOString(),
              completed: false
            }
          })
        );
        sectionInteractionsRef.current[sectionId] = newInteraction.data.createSectionInteraction;
      }
    } catch (error) {
      console.error('Error initializing section interaction:', error);
    }
  }, [currentUser, currentOrganization, learningId, chapterId]);

  // Update section time spent
  const updateSectionTime = useCallback(async (sectionId, timeSpent) => {
    const interaction = sectionInteractionsRef.current[sectionId];
    if (!interaction) return;

    try {
      const newTimeSpent = (interaction.timeSpent || 0) + timeSpent;
      const isCompleted = newTimeSpent >= 30; // Mark as completed after 30 seconds

      await API.graphql(
        graphqlOperation(updateSectionInteraction, {
          input: {
            id: interaction.id,
            timeSpent: newTimeSpent,
            lastViewedAt: new Date().toISOString(),
            completed: isCompleted,
            viewCount: (interaction.viewCount || 0) + 1
          }
        })
      );

      // Update local reference
      sectionInteractionsRef.current[sectionId] = {
        ...interaction,
        timeSpent: newTimeSpent,
        completed: isCompleted
      };
    } catch (error) {
      console.error('Error updating section time:', error);
    }
  }, []);

  // Observer callback
  const handleIntersection = useCallback((entries) => {
    entries.forEach((entry) => {
      const sectionId = entry.target.getAttribute('data-section-id');
      if (!sectionId) return;

      if (entry.isIntersecting) {
        // Section is visible
        if (!sectionTimersRef.current[sectionId]) {
          sectionTimersRef.current[sectionId] = {
            startTime: Date.now(),
            isVisible: true
          };
          
          // Initialize interaction if needed
          if (!sectionInteractionsRef.current[sectionId]) {
            initializeSectionInteraction(sectionId);
          }
        }
      } else {
        // Section is no longer visible
        const timer = sectionTimersRef.current[sectionId];
        if (timer && timer.isVisible) {
          const timeSpent = Math.floor((Date.now() - timer.startTime) / 1000);
          if (timeSpent > 0) {
            updateSectionTime(sectionId, timeSpent);
          }
          
          sectionTimersRef.current[sectionId] = {
            ...timer,
            isVisible: false
          };
        }
      }
    });
  }, [initializeSectionInteraction, updateSectionTime]);

  // Setup observer
  const setupObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '0px',
      threshold: 0.5 // Section is considered visible when 50% is in viewport
    });

    // Observe all sections
    const sections = document.querySelectorAll('[data-section-id]');
    sections.forEach((section) => {
      observerRef.current.observe(section);
    });
  }, [handleIntersection]);

  // Cleanup visible sections on unmount
  const cleanupVisibleSections = useCallback(() => {
    Object.entries(sectionTimersRef.current).forEach(([sectionId, timer]) => {
      if (timer.isVisible) {
        const timeSpent = Math.floor((Date.now() - timer.startTime) / 1000);
        if (timeSpent > 0) {
          updateSectionTime(sectionId, timeSpent);
        }
      }
    });
  }, [updateSectionTime]);

  // Setup and cleanup
  useEffect(() => {
    if (currentUser?.attributes?.sub && currentOrganization?.id && learningId) {
      setupObserver();
    }

    return () => {
      cleanupVisibleSections();
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentUser, currentOrganization, learningId, setupObserver, cleanupVisibleSections]);

  // Re-observe when DOM changes
  const observeSections = useCallback(() => {
    setupObserver();
  }, [setupObserver]);

  return {
    observeSections
  };
};

export default useSectionObserver;