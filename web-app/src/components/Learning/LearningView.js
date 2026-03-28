import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API, Storage } from 'aws-amplify';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, ListGroup, Alert, Button } from 'react-bootstrap';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { FaDownload } from 'react-icons/fa';
import LearningTrackingBar from '../shared/LearningTrackingBar';
import LearningStartModal from './LearningStartModal';
import { useUser } from '../../contexts/UserContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import awsExports from '../../aws-exports';

const LearningView = () => {
  const { learningId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const { activeOrganization: currentOrganization } = useOrganization();
  const [learning, setLearning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState({});
  const [downloadingContent, setDownloadingContent] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [readyToShowModal, setReadyToShowModal] = useState(false);
  const [trackingState, setTrackingState] = useState({
    isTracking: false,
    sessionElapsedTime: 0,
    activeTime: 0,
    totalTimeSpent: 0,
    isUserActive: true,
    isTabVisible: true,
    progressLoaded: false,
    progressId: null
  });
  const trackingBarRef = useRef();
  const contentScrollRef = useRef();
  const sectionRefs = useRef(new Map());
  const [savedPosition, setSavedPosition] = useState(null);
  const positionSaveTimeout = useRef(null);

  // Handler functions for modal - moved to top to satisfy rules of hooks
  const handleStartTracking = useCallback(() => {
    // The actual tracking will be started by the LearningTrackingBar component
    // This just closes the modal - the tracking bar will update the state
    setShowStartModal(false);
  }, []);

  const handleStopTracking = useCallback(() => {
    // Save current position before stopping (will be handled by cleanup effect)
    setTrackingState(prev => ({ ...prev, isTracking: false }));
    // Show the start modal again after stopping
    setShowStartModal(true);
  }, []);

  const handleTrackingStateUpdate = useCallback((newState) => {
    setTrackingState(prev => ({ ...prev, ...newState }));
    
    // Show modal if progress is loaded, progressId is available, not tracking
    // This handles both initial load and after stopping tracking
    if (newState.progressLoaded && newState.progressId && !newState.isTracking && !showStartModal) {
      console.log('🎯 Progress loaded with valid ID - ready to show modal', {
        progressId: newState.progressId,
        progressLoaded: newState.progressLoaded,
        reason: readyToShowModal ? 'after_stop' : 'initial_load'
      });
      if (!readyToShowModal) {
        setReadyToShowModal(true);
      }
      setShowStartModal(true);
    }
  }, [readyToShowModal, showStartModal]);

  const handleModalClose = useCallback(() => {
    if (trackingState.isTracking) {
      setShowStartModal(false);
    }
    // Don't close modal if not tracking - user must start or go back
  }, [trackingState.isTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up position save timeout
      if (positionSaveTimeout.current) {
        clearTimeout(positionSaveTimeout.current);
      }
    };
  }, []);

  // Load saved reading position from database
  const loadSavedPosition = useCallback(async () => {
    if (!trackingState.progressId || !currentUser || !currentOrganization) return;

    try {
      const progressResponse = await API.graphql({
        query: queries.getLearningProgress,
        variables: { id: trackingState.progressId }
      });

      const progress = progressResponse.data.getLearningProgress;
      if (progress && progress.lastViewedSection && progress.lastScrollPosition !== null) {
        const savedPos = {
          sectionId: progress.lastViewedSection,
          scrollPosition: progress.lastScrollPosition,
          sessionData: progress.readingSessionData ? JSON.parse(progress.readingSessionData) : null
        };
        
        setSavedPosition(savedPos);
        console.log('📖 Loaded saved reading position:', savedPos);
        return savedPos;
      }
    } catch (error) {
      console.error('Error loading saved position:', error);
    }
    return null;
  }, [trackingState.progressId, currentUser, currentOrganization]);

  // Restore scroll position and active section
  const restorePosition = useCallback(async (savedPos) => {
    if (!savedPos || !contentScrollRef.current) return;

    // Wait a bit for content to render
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Set active section first
      setActiveSection(savedPos.sectionId);
      
      // Scroll to saved position
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = savedPos.scrollPosition;
        console.log('🎯 Restored scroll position:', savedPos.scrollPosition);
        console.log('📖 Reading position restored! You were last reading:', savedPos.sectionId);
      }

      // Try to scroll to the specific section as backup
      const sectionElement = sectionRefs.current.get(savedPos.sectionId);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log('📍 Scrolled to saved section:', savedPos.sectionId);
      }
    } catch (error) {
      console.error('Error restoring position:', error);
    }
  }, []);

  // Scroll spy functionality
  const updateActiveSection = useCallback(() => {
    if (!contentScrollRef.current) return;

    const scrollContainer = contentScrollRef.current;
    const scrollTop = scrollContainer.scrollTop;
    const containerHeight = scrollContainer.clientHeight;
    
    // Get all section elements with their positions and types
    const sections = [];
    sectionRefs.current.forEach((element, id) => {
      if (element) {
        const rect = element.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top + scrollTop;
        
        // Determine section type for priority
        let type = 'chapter';
        let priority = 1;
        if (id.startsWith('subsection-')) {
          type = 'subsection';
          priority = 3; // Highest priority
        } else if (id.startsWith('section-')) {
          type = 'section';
          priority = 2; // Medium priority
        }
        
        sections.push({
          id,
          element,
          type,
          priority,
          top: relativeTop,
          bottom: relativeTop + rect.height,
          rect
        });
      }
    });

    // Sort sections by their position
    sections.sort((a, b) => a.top - b.top);

    // Find the active section with improved algorithm
    let activeId = null;
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerHeight;
    const viewportCenter = viewportTop + (containerHeight / 2);
    
    // Method 1: Find sections that are currently visible in viewport
    // Add some padding to make detection more sensitive
    const detectionPadding = 50; // pixels
    const detectionTop = viewportTop - detectionPadding;
    const detectionBottom = viewportBottom + detectionPadding;
    
    const visibleSections = sections.filter(section => {
      const isVisible = section.bottom > detectionTop && section.top < detectionBottom;
      if (isVisible) {
        // Calculate how much of the section is visible
        const visibleTop = Math.max(section.top, viewportTop);
        const visibleBottom = Math.min(section.bottom, viewportBottom);
        const visibleArea = visibleBottom - visibleTop;
        const totalArea = section.bottom - section.top;
        const visibilityPercentage = (visibleArea / totalArea) * 100;
        
        section.visibleArea = visibleArea;
        section.visibilityPercentage = visibilityPercentage;
        section.distanceFromCenter = Math.abs((section.top + section.bottom) / 2 - viewportCenter);
        
        return true;
      }
      return false;
    });
    
    if (visibleSections.length > 0) {
      // Sort visible sections by priority (subsection > section > chapter), 
      // then by visibility percentage, then by distance from center
      visibleSections.sort((a, b) => {
        // First priority: section type (subsections are most important)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        
        // If same type, prefer the one with higher visibility percentage
        if (Math.abs(a.visibilityPercentage - b.visibilityPercentage) > 10) {
          return b.visibilityPercentage - a.visibilityPercentage;
        }
        
        // If similar visibility, prefer the one closer to viewport center
        return a.distanceFromCenter - b.distanceFromCenter;
      });
      
      activeId = visibleSections[0].id;
    }

    // Method 2: Fallback - if no section is visible, find the closest one
    if (!activeId && sections.length > 0) {
      // Find the section closest to the viewport center
      let minDistance = Infinity;
      for (const section of sections) {
        const sectionCenter = (section.top + section.bottom) / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          activeId = section.id;
        }
      }
    }

    // Update active section if it changed
    if (activeId && activeId !== activeSection) {
      console.log('🎯 Active section changed:', {
        from: activeSection,
        to: activeId,
        visibleSections: visibleSections.map(s => ({
          id: s.id,
          type: s.type,
          priority: s.priority,
          visibilityPercentage: s.visibilityPercentage?.toFixed(1)
        }))
      });
      setActiveSection(activeId);
      
      // Position saving will be handled by a separate effect
    }
  }, [activeSection]);

  // Set up scroll spy when tracking starts
  useEffect(() => {
    if (!trackingState.isTracking || !contentScrollRef.current) return;

    const scrollContainer = contentScrollRef.current;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also listen for resize events in case content changes
    const handleResize = () => {
      setTimeout(updateActiveSection, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial check with multiple attempts to ensure content is loaded
    setTimeout(updateActiveSection, 100);
    setTimeout(updateActiveSection, 500);
    setTimeout(updateActiveSection, 1000);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [trackingState.isTracking, updateActiveSection]);

  // Save position when active section changes
  useEffect(() => {
    if (trackingState.isTracking && activeSection && contentScrollRef.current && trackingState.progressId && currentUser && currentOrganization) {
      const currentScrollPosition = contentScrollRef.current.scrollTop;
      
      // Clear any existing timeout
      if (positionSaveTimeout.current) {
        clearTimeout(positionSaveTimeout.current);
      }
      
      // Set new timeout to save position after 2 seconds
      positionSaveTimeout.current = setTimeout(() => {
        const readingSessionData = {
          timestamp: new Date().toISOString(),
          sectionId: activeSection,
          scrollPosition: currentScrollPosition,
          userAgent: navigator.userAgent,
          viewportHeight: window.innerHeight
        };

        API.graphql({
          query: mutations.updateLearningProgress,
          variables: {
            input: {
              id: trackingState.progressId,
              lastViewedSection: activeSection,
              lastScrollPosition: currentScrollPosition,
              readingSessionData: JSON.stringify(readingSessionData),
              lastAccessedAt: new Date().toISOString()
            }
          }
        }).then(() => {
          setSavedPosition({ sectionId: activeSection, scrollPosition: currentScrollPosition });
          console.log('💾 Saved reading position:', { sectionId: activeSection, scrollPosition: currentScrollPosition });
        }).catch(error => {
          console.error('Error saving reading position:', error);
        });
      }, 2000);
    }
  }, [activeSection, trackingState.isTracking, trackingState.progressId, currentUser, currentOrganization]);

  // Load and restore saved position when tracking starts
  useEffect(() => {
    if (trackingState.isTracking && trackingState.progressId && learning?.chapters) {
      const loadAndRestore = async () => {
        const savedPos = await loadSavedPosition();
        if (savedPos) {
          await restorePosition(savedPos);
        }
      };
      
      // Delay loading to ensure content is rendered
      setTimeout(loadAndRestore, 1000);
    }
  }, [trackingState.isTracking, trackingState.progressId, learning?.chapters, loadSavedPosition, restorePosition]);

  // Save position when tracking stops
  useEffect(() => {
    if (!trackingState.isTracking && activeSection && contentScrollRef.current && trackingState.progressId) {
      const currentScrollPosition = contentScrollRef.current.scrollTop;
      // Use setTimeout to ensure this runs after state updates
      setTimeout(() => {
        if (currentUser && currentOrganization) {
          const readingSessionData = {
            timestamp: new Date().toISOString(),
            sectionId: activeSection,
            scrollPosition: currentScrollPosition,
            userAgent: navigator.userAgent,
            viewportHeight: window.innerHeight
          };

          API.graphql({
            query: mutations.updateLearningProgress,
            variables: {
              input: {
                id: trackingState.progressId,
                lastViewedSection: activeSection,
                lastScrollPosition: currentScrollPosition,
                readingSessionData: JSON.stringify(readingSessionData),
                lastAccessedAt: new Date().toISOString()
              }
            }
          }).then(() => {
            setSavedPosition({ sectionId: activeSection, scrollPosition: currentScrollPosition });
            console.log('💾 Saved final reading position on stop:', { sectionId: activeSection, scrollPosition: currentScrollPosition });
          }).catch(error => {
            console.error('Error saving final reading position:', error);
          });
        }
      }, 100);
    }
  }, [trackingState.isTracking, activeSection, trackingState.progressId, currentUser, currentOrganization]);

  // Update section refs when learning content changes
  const setSectionRef = useCallback((id, element) => {
    if (element) {
      sectionRefs.current.set(id, element);
      // Trigger update when new sections are added
      setTimeout(() => updateActiveSection(), 50);
    } else {
      sectionRefs.current.delete(id);
    }
  }, [updateActiveSection]);

  // Process content to refresh expired image URLs
  const processContentImages = async (content) => {
    if (!content) return content;
    
    try {
      let updatedContent = content;
      
      // Find all image src attributes in the content
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      const matches = [...content.matchAll(imgRegex)];
      
      for (const match of matches) {
        const fullMatch = match[0];
        const src = match[1];
        
        if (!src) continue;
        
        console.log('🔍 Processing image src in view:', src);
        
        // Check if this is already a public URL
        if (src.includes('amazonaws.com') && !src.includes('?')) {
          console.log('Image already has public URL, skipping:', src);
          continue;
        }
        
        // Determine if it's already an S3 key or a full URL
        let s3Key = src;
        let needsRefresh = false;
        
        // Case 1: Full URL with query parameters (expired signed URL)
        if (src.includes('amazonaws.com')) {
          needsRefresh = true;
          // Remove query parameters
          if (s3Key.includes('?')) {
            s3Key = s3Key.split('?')[0];
          }
          // Extract key from full URL
          if (s3Key.includes('amazonaws.com/')) {
            const parts = s3Key.split('amazonaws.com/');
            if (parts.length > 1) {
              s3Key = parts[1];
            }
          }
        }
        // Case 2: Just the S3 key (e.g., "learning-images/...")
        else if (src.includes('learning-images/')) {
          needsRefresh = true;
          // S3 key is already in the correct format
          s3Key = src;
        }
        
        if (needsRefresh) {
          try {
            console.log('Generating public URL for S3 key:', s3Key);
            
            // Generate public URL directly instead of signed URL
            // First check if this is a learning image (should use learning images bucket)
            let publicUrl;
            if (s3Key.includes('learning-images/')) {
              const learningBucket = process.env.REACT_APP_LEARNING_IMAGES_BUCKET;
              const region = awsExports.aws_user_files_s3_bucket_region;
              publicUrl = `https://${learningBucket}.s3.${region}.amazonaws.com/${s3Key}`;
            } else {
              // For other images, use the default bucket
              const bucketName = awsExports.aws_user_files_s3_bucket;
              const region = awsExports.aws_user_files_s3_bucket_region;
              publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/public/${s3Key}`;
            }
            
            console.log('Generated public URL:', publicUrl);
            
            // Replace the entire img tag's src attribute
            const newImgTag = fullMatch.replace(src, publicUrl);
            updatedContent = updatedContent.replace(fullMatch, newImgTag);
          } catch (error) {
            console.error('Error generating public URL:', error);
          }
        }
      }
      
      return updatedContent;
    } catch (error) {
      console.error('Error processing content images:', error);
      return content;
    }
  };

  useEffect(() => {
    if (learningId) {
      fetchLearningContent(learningId);
    }
  }, [learningId]);

  // Debug modal visibility
  useEffect(() => {
    console.log('🔍 Modal visibility check:', {
      showStartModal,
      readyToShowModal,
      progressLoaded: trackingState.progressLoaded,
      progressId: trackingState.progressId,
      isTracking: trackingState.isTracking,
      finalShow: showStartModal && trackingState.progressLoaded && trackingState.progressId && readyToShowModal
    });
  }, [showStartModal, readyToShowModal, trackingState.progressLoaded, trackingState.progressId, trackingState.isTracking]);

  const fetchLearningContent = async (id) => {
    try {
      // Using the same fetch logic as in LearningEdit
      const learningResponse = await API.graphql({
        query: queries.getLearning,
        variables: { id }
      });

      const learningData = learningResponse.data.getLearning;

      const chaptersResponse = await API.graphql({
        query: queries.chaptersByLearningIdAndPosition,
        variables: { 
          learningId: id,
          sortDirection: 'ASC'
        }
      });

      const chapters = chaptersResponse.data.chaptersByLearningIdAndPosition.items;

      const chaptersWithSections = await Promise.all(chapters.map(async chapter => {
        const sectionsResponse = await API.graphql({
          query: queries.sectionsByChapterIdAndPosition,
          variables: { 
            chapterId: chapter.id,
            sortDirection: 'ASC'
          }
        });

        const sections = await Promise.all(
          sectionsResponse.data.sectionsByChapterIdAndPosition.items
            .filter(section => !section._deleted)
            .map(async section => {
              let post = null;
              if (section.postId) {
                const postResponse = await API.graphql({
                  query: queries.getPost,
                  variables: { id: section.postId }
                });
                post = postResponse.data.getPost;
                // Process content to fix any expired image URLs
                if (post && post.content) {
                  post.content = await processContentImages(post.content);
                }
              }

              const subSectionsResponse = await API.graphql({
                query: queries.subSectionsBySectionIdAndPosition,
                variables: { 
                  sectionId: section.id,
                  sortDirection: 'ASC'
                }
              });

              const subSections = await Promise.all(
                subSectionsResponse.data.subSectionsBySectionIdAndPosition.items
                  .filter(subSection => !subSection._deleted)
                  .sort((a, b) => (a.position || 0) - (b.position || 0))  // Still need client-side sort for subsections
                  .map(async subSection => {
                    let subSectionPost = null;
                    if (subSection.postId) {
                      const postResponse = await API.graphql({
                        query: queries.getPost,
                        variables: { id: subSection.postId }
                      });
                      subSectionPost = postResponse.data.getPost;
                      // Process content to fix any expired image URLs
                      if (subSectionPost && subSectionPost.content) {
                        subSectionPost.content = await processContentImages(subSectionPost.content);
                      }
                    }
                    return { ...subSection, post: subSectionPost };
                  })
              );

              return { ...section, post, subSections };
            })
        );

        return { ...chapter, sections };
      }));

      setLearning({ ...learningData, chapters: chaptersWithSections });
      
      try {
        // Fetch all quizzes for this learning
        const quizzesResponse = await API.graphql({
          query: queries.listQuizzes,  // Using listQuizzes instead of quizzesByLearningId
          variables: {
            filter: {
              learningId: { eq: id },
              _deleted: { ne: true }
            }
          }
        });
        
        const fetchedQuizzes = quizzesResponse.data.listQuizzes.items;
        setQuizzes(fetchedQuizzes);
        
        // Fetch questions for each quiz
        const questionsByQuiz = {};
        
        // Use Promise.allSettled instead of Promise.all to handle individual quiz failures
        await Promise.allSettled(fetchedQuizzes.map(async (quiz) => {
          try {
            const questionsResponse = await API.graphql({
              query: queries.questionsByQuizId,
              variables: { 
                quizId: quiz.id,
                filter: { _deleted: { ne: true } }
              }
            });
            
            if (questionsResponse.data?.questionsByQuizId?.items) {
              const questions = questionsResponse.data.questionsByQuizId.items
                .sort((a, b) => {
                  // Sort first by orderIndex if available
                  if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
                    return a.orderIndex - b.orderIndex;
                  }
                  // Otherwise sort by creation date
                  return new Date(a.createdAt) - new Date(b.createdAt);
                });
                
              questionsByQuiz[quiz.id] = questions;
            } else {
              questionsByQuiz[quiz.id] = [];
            }
          } catch (err) {
            console.warn(`Error fetching questions for quiz ${quiz.id}:`, err);
            questionsByQuiz[quiz.id] = []; // Set empty array on error
          }
        }));
        
        setQuizQuestions(questionsByQuiz);
      } catch (quizError) {
        console.error("Error fetching quizzes:", quizError);
        // Don't fail the whole learning loading if quizzes fail
        setQuizzes([]);
        setQuizQuestions({});
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching learning content:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
      
      // Section navigation (tracking removed for manual system)
    }
  };

  const renderNavigation = () => {
    if (!learning?.chapters) return null;

    return (
      <ListGroup variant="flush">
        {learning.chapters.map((chapter, chapterIndex) => (
          <div key={chapter.id}>
            <ListGroup.Item
              action
              onClick={() => scrollToSection(`chapter-${chapter.id}`)}
              active={activeSection === `chapter-${chapter.id}`}
              className="d-flex align-items-center"
              style={{
                ...styles.listItem,
                ...(activeSection === `chapter-${chapter.id}` ? styles.activeListItem : {})
              }}
            >
              <span className="me-2">📚</span>
              {chapterIndex + 1}. {chapter.title}
            </ListGroup.Item>
            
            {chapter.sections?.map((section, sectionIndex) => (
              <div key={section.id}>
                <ListGroup.Item
                  action
                  onClick={() => scrollToSection(`section-${section.id}`)}
                  active={activeSection === `section-${section.id}`}
                  className="ms-3"
                  style={{
                    ...styles.listItem,
                    ...(activeSection === `section-${section.id}` ? styles.activeListItem : {})
                  }}
                >
                  <span className="me-2">📑</span>
                  {chapterIndex + 1}.{sectionIndex + 1} {section.title}
                </ListGroup.Item>

                {section.subSections?.map((subSection, subSectionIndex) => (
                  <ListGroup.Item
                    key={subSection.id}
                    action
                    onClick={() => scrollToSection(`subsection-${subSection.id}`)}
                    active={activeSection === `subsection-${subSection.id}`}
                    className="ms-5"
                    style={{
                      ...styles.listItem,
                      ...(activeSection === `subsection-${subSection.id}` ? styles.activeListItem : {})
                    }}
                  >
                    <span className="me-2">📄</span>
                    {chapterIndex + 1}.{sectionIndex + 1}.{subSectionIndex + 1} {subSection.title}
                  </ListGroup.Item>
                ))}
              </div>
            ))}
          </div>
        ))}
      </ListGroup>
    );
  };

  const generateTextContent = () => {
    if (!learning) return '';
    
    let textContent = `${learning.title}\n\n`;
    
    learning.chapters?.forEach((chapter, chapterIndex) => {
      textContent += `${chapterIndex + 1}. ${chapter.title}\n\n`;
      
      chapter.sections?.forEach((section, sectionIndex) => {
        textContent += `${chapterIndex + 1}.${sectionIndex + 1} ${section.title}\n\n`;
        
        if (section.post?.content) {
          // Convert HTML content to plain text
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = section.post.content;
          textContent += `${tempDiv.textContent}\n\n`;
        }
        
        section.subSections?.forEach((subSection, subSectionIndex) => {
          textContent += `${chapterIndex + 1}.${sectionIndex + 1}.${subSectionIndex + 1} ${subSection.title}\n\n`;
          
          if (subSection.post?.content) {
            // Convert HTML content to plain text
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = subSection.post.content;
            textContent += `${tempDiv.textContent}\n\n`;
          }
        });
      });
    });
    
    // Add quizzes if available
    if (quizzes && quizzes.length > 0) {
      textContent += "\n\n======= QUIZZES =======\n\n";
      
      quizzes.forEach((quiz, quizIndex) => {
        textContent += `QUIZ ${quizIndex + 1}: ${quiz.title}\n`;
        if (quiz.description) {
          textContent += `${quiz.description}\n`;
        }
        textContent += "\n";
        
        const questions = quizQuestions[quiz.id] || [];
        if (questions.length === 0) {
          textContent += "No questions available for this quiz.\n\n";
        } else {
          questions.forEach((question, questionIndex) => {
            textContent += `Question ${questionIndex + 1}: ${question.content}\n`;
            
            // List all options - handle case where options might be undefined
            if (question.options && Array.isArray(question.options)) {
              question.options.forEach((option, optionIndex) => {
                const isCorrect = optionIndex === question.correctOption;
                textContent += `${String.fromCharCode(65 + optionIndex)}. ${option}${isCorrect ? ' ✓' : ''}\n`;
              });
            }
            
            // Add explanation if available
            if (question.explanation) {
              textContent += `Explanation: ${question.explanation}\n`;
            }
            
            textContent += "\n";
          });
        }
        
        textContent += "------------------------\n\n";
      });
    }
    
    return textContent;
  };

  const downloadLearningContent = async () => {
    try {
      setDownloadingContent(true);
      
      const textContent = generateTextContent();
      const filename = `${learning.title.replace(/[^\w\s]/gi, '')}.txt`;
      
      const element = document.createElement('a');
      const file = new Blob([textContent], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error("Error downloading content:", error);
    } finally {
      setDownloadingContent(false);
    }
  };

  if (isRedirecting) {
    return (
      <Container className="mt-4">
        <Alert variant="info" className="text-center">
          <h5>🔄 Redirecting...</h5>
          <p>To ensure proper tracking, you're being redirected to the learnings list.</p>
          <p className="mb-0">Please select your learning from there to continue.</p>
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <>
      <style>{`
        /* Center images in learning content */
        .content-section img {
          display: block;
          margin: 1rem auto;
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        /* Ensure paragraphs with images are centered */
        .content-section p:has(img) {
          text-align: center;
        }
        
        /* Center any div containing images */
        .content-section div:has(img) {
          text-align: center;
        }
        
        /* Additional styling for better presentation */
        .content-section {
          line-height: 1.6;
        }
        
        .content-section img:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: box-shadow 0.3s ease;
        }

        /* Enhanced navigation styling */
        .list-group-item {
          border: none !important;
          border-radius: 0 !important;
        }
        
        .list-group-item:hover {
          background-color: #f8f9fa !important;
          transform: translateX(2px);
        }
        
        .list-group-item.active {
          background-color: #e3f2fd !important;
          border-left: 3px solid #2196f3 !important;
          font-weight: 600 !important;
          color: #1976d2 !important;
          box-shadow: 0 2px 4px rgba(33, 150, 243, 0.1);
        }

        /* Smooth scrolling enhancement */
        html {
          scroll-behavior: smooth;
        }

        /* Active section indicator in content */
        .content-section-active {
          position: relative;
        }
        
        .content-section-active::before {
          content: '';
          position: absolute;
          left: -20px;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(to bottom, #2196f3, #1976d2);
          border-radius: 2px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scaleY(0); }
          to { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
      {/* Learning Start/Progress Modal - only show when progress is loaded and progressId is available */}
      <LearningStartModal
        show={showStartModal && trackingState.progressLoaded && trackingState.progressId && readyToShowModal}
        learningTitle={learning?.title}
        learningId={learningId}
        isTracking={trackingState.isTracking}
        sessionElapsedTime={trackingState.sessionElapsedTime}
        activeTime={trackingState.activeTime}
        totalTimeSpent={trackingState.totalTimeSpent}
        isUserActive={trackingState.isUserActive}
        isTabVisible={trackingState.isTabVisible}
        onStartTracking={handleStartTracking}
        onStopTracking={handleStopTracking}
        onClose={handleModalClose}
        trackingBarRef={trackingBarRef}
        progressId={trackingState.progressId}
      />

      {/* Learning Tracking Bar - hidden behind modal until started */}
      <LearningTrackingBar 
        ref={trackingBarRef}
        learningId={learningId} 
        learningTitle={learning?.title}
        onTrackingStateChange={handleTrackingStateUpdate}
        onTrackingStopped={handleStopTracking}
        isHidden={showStartModal}
      />
      
      {/* Learning Content - only visible when tracking has started */}
      {trackingState.isTracking && !showStartModal && (
        <Container fluid style={{paddingTop: '116px'}}>
          <Row>
            <Col md={3} className="border-end vh-100 overflow-auto" style={{zIndex: 1010}}>
              <div className="sticky-top pt-3" style={{paddingTop: '116px'}}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="mb-0">{learning?.title}</h3>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={downloadLearningContent} 
                    title="Download as text file"
                    disabled={downloadingContent}
                  >
                    {downloadingContent ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <FaDownload />
                    )}
                  </Button>
                </div>
                
                {renderNavigation()}
              </div>
            </Col>
            <Col md={9} className="vh-100 overflow-auto" ref={contentScrollRef}>
              <div className="p-4">
                {learning?.chapters?.map((chapter, chapterIndex) => (
                  <div 
                    key={chapter.id} 
                    id={`chapter-${chapter.id}`} 
                    className={`mb-5 ${activeSection === `chapter-${chapter.id}` ? 'content-section-active' : ''}`}
                    ref={(el) => setSectionRef(`chapter-${chapter.id}`, el)}
                  >
                    <h2 className="mb-4 chapter-title">
                      {chapterIndex + 1}. {chapter.title}
                    </h2>

                    {chapter.sections?.map((section, sectionIndex) => (
                      <div 
                        key={section.id} 
                        id={`section-${section.id}`} 
                        data-section-id={section.id}
                        className={`mb-5 ${activeSection === `section-${section.id}` ? 'content-section-active' : ''}`}
                        ref={(el) => setSectionRef(`section-${section.id}`, el)}
                      >
                        <h3 className="mb-4 section-title">
                          {chapterIndex + 1}.{sectionIndex + 1} {section.title}
                        </h3>
                        
                        {section.post?.content && (
                          <div 
                            className="content-section mb-5"
                            dangerouslySetInnerHTML={{ __html: section.post.content }}
                          />
                        )}

                        {section.subSections?.map((subSection, subSectionIndex) => (
                          <div 
                            key={subSection.id} 
                            id={`subsection-${subSection.id}`}
                            data-section-id={subSection.id}
                            className={`ms-4 mb-5 ${activeSection === `subsection-${subSection.id}` ? 'content-section-active' : ''}`}
                            ref={(el) => setSectionRef(`subsection-${subSection.id}`, el)}
                          >
                            <h4 className="mb-4 subsection-title">
                              {chapterIndex + 1}.{sectionIndex + 1}.{subSectionIndex + 1} {subSection.title}
                            </h4>
                            {subSection.post?.content && (
                              <div 
                                className="content-section"
                                dangerouslySetInnerHTML={{ __html: subSection.post.content }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      )}

      {/* Show placeholder when not tracking and modal is not shown */}
      {!trackingState.isTracking && !showStartModal && !trackingState.progressLoaded && (
        <Container className="mt-5">
          <div className="text-center">
            <h3 className="text-muted">Loading...</h3>
            <p>Preparing your learning session...</p>
          </div>
        </Container>
      )}
    </>
  );
};

const styles = {
  listItem: {
    padding: '0.5rem 1rem',
    fontSize: '0.95rem',
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    transition: 'all 0.2s ease',
  },
  activeListItem: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196f3',
    fontWeight: '600',
    color: '#1976d2',
  }
};

export default LearningView; 