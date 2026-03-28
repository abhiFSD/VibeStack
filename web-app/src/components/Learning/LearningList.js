import React, { useState, useEffect } from 'react';
import { API, Auth } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Alert, Spinner, ProgressBar, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faBook, faChartBar, faClone, faBuilding, faGlobe, faTrash } from '@fortawesome/free-solid-svg-icons';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import tools from '../../json/tools.json';
import iconMappings from '../../utils/iconMappings';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAdmin } from '../../contexts/AdminContext';
import { cloneLearningForOrganization } from '../../utils/learningCloner';
import '../../styles/LearningList.css';

const getIconForLearning = (title) => {
  // Find matching tool from tools.json
  const matchingTool = tools.find(tool => 
    tool.name.toLowerCase() === title.toLowerCase() ||
    title.toLowerCase().includes(tool.name.toLowerCase())
  );
  
  // If we found a matching tool, use its subtitle to get the icon
  if (matchingTool) {
    return iconMappings[matchingTool.subtitle] || iconMappings['VibeStack'];
  }
  
  // Directly try to find a matching icon
  const iconKey = Object.keys(iconMappings).find(key => 
    title.toLowerCase().includes(key.toLowerCase().replace(' report', ''))
  );
  
  return iconKey ? iconMappings[iconKey] : iconMappings['VibeStack'];
};

const LearningList = () => {
  const [learnings, setLearnings] = useState([['', []]]); // Initialize with empty group
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizzesByLearning, setQuizzesByLearning] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const navigate = useNavigate();
  const { activeOrganization } = useOrganization();
  const { isSuperAdmin } = useAdmin();
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedLearning, setSelectedLearning] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [learningToDelete, setLearningToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchLearnings();
    fetchQuizResults();
  }, [activeOrganization?.id]);

  const fetchLearnings = async () => {
    try {
      let learningItems = [];
      
      // Fetch both organization-specific and default learnings
      const [orgLearningsResponse, defaultLearningsResponse] = await Promise.all([
        activeOrganization?.id ? API.graphql({
          query: queries.listLearnings,
          variables: {
            filter: {
              organizationID: { eq: activeOrganization.id },
              _deleted: { ne: true }
            }
          }
        }) : Promise.resolve({ data: { listLearnings: { items: [] } } }),
        
        API.graphql({
          query: queries.listLearnings,
          variables: {
            filter: {
              isDefault: { eq: true },
              _deleted: { ne: true }
            }
          }
        })
      ]);

      const orgLearnings = orgLearningsResponse.data.listLearnings.items;
      const defaultLearnings = defaultLearningsResponse.data.listLearnings.items;

      // Create a set of cloned learning IDs
      const clonedLearningIds = new Set(
        orgLearnings.map(learning => learning.clonedFromID).filter(Boolean)
      );

      // Combine org learnings with uncloned default learnings
      learningItems = [
        ...orgLearnings,
        ...defaultLearnings.filter(learning => !clonedLearningIds.has(learning.id))
      ];

      console.log('Fetched learnings:', learningItems);

      if (learningItems && learningItems.length > 0) {
        // Fetch quizzes for each learning
        const quizzesPromises = learningItems.map(learning => 
          API.graphql({
            query: queries.listQuizzes,
            variables: {
              filter: {
                learningId: { eq: learning.id },
                _deleted: { ne: true }
              }
            }
          })
        );

        const quizzesResults = await Promise.all(quizzesPromises);
        const quizzesByLearningMap = {};
        
        // For each learning, get its quizzes
        for (let i = 0; i < learningItems.length; i++) {
          const learningId = learningItems[i].id;
          const quizzes = quizzesResults[i].data.listQuizzes.items;
          quizzesByLearningMap[learningId] = quizzes;
        }

        setQuizzesByLearning(quizzesByLearningMap);

        // Group learnings by tool type
        const groupedLearnings = groupAndOrderLearnings(learningItems);
        setLearnings(groupedLearnings);
      } else {
        setLearnings([['No Learnings', []]]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching learnings:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchQuizResults = async () => {
    try {
      const { attributes } = await Auth.currentAuthenticatedUser();
      const userSub = attributes.sub;

      // 🔍 DEBUG LOGGING - WEB QUIZ RESULTS FETCH
      console.log('🌐 WEB: Fetching quiz results for user:', userSub);

      const results = await API.graphql({
        query: queries.listQuizzesResults,
        variables: {
          filter: {
            user_sub: { eq: userSub }
          }
        }
      });

      console.log('🌐 WEB: Quiz results raw data:', results.data.listQuizzesResults.items);
      console.log('🌐 WEB: Total quiz results found:', results.data.listQuizzesResults.items.length);

      // Create a map of quiz ID to latest result
      const resultMap = {};
      results.data.listQuizzesResults.items.forEach(result => {
        if (!result._deleted) {
          const quizId = result.tool_id;
          console.log('🌐 WEB: Processing quiz result:', {
            result_id: result.id,
            tool_id: result.tool_id, // ⚠️ WEB EXPECTS THIS TO BE QUIZ ID
            percentage: result.percentage,
            user_sub: result.user_sub,
            createdAt: result.createdAt,
            isDeleted: result._deleted
          });
          
          if (!resultMap[quizId] || new Date(result.createdAt) > new Date(resultMap[quizId].createdAt)) {
            resultMap[quizId] = result;
          }
        }
      });

      console.log('🌐 WEB: Final quiz results map:', resultMap);
      console.log('🌐 WEB: Quiz IDs with results:', Object.keys(resultMap));

      setQuizResults(resultMap);
    } catch (error) {
      console.error('🌐 WEB: Error fetching quiz results:', error);
    }
  };

  const calculateLearningProgress = (learningId) => {
    const quizzes = quizzesByLearning[learningId] || [];
    let totalProgress = 0;
    let completedQuizzes = 0;

    quizzes.forEach(quiz => {
      const result = quizResults[quiz.id];
      if (result) {
        totalProgress += parseInt(result.percentage);
        completedQuizzes++;
      }
    });

    return {
      progress: completedQuizzes > 0 ? Math.round(totalProgress / completedQuizzes) : 0,
      hasQuizTaken: completedQuizzes > 0
    };
  };

  const groupAndOrderLearnings = (learningItems) => {
    if (!Array.isArray(learningItems) || learningItems.length === 0) {
      return [['No Learnings', []]];
    }

    // Helper function to get tool type from tools.json
    const getToolType = (learningTitle) => {
      const matchingTool = tools.find(tool => 
        tool.name.toLowerCase() === learningTitle.toLowerCase() ||
        learningTitle.toLowerCase().includes(tool.name.toLowerCase()) ||
        tool.subtitle.toLowerCase().includes(learningTitle.toLowerCase())
      );
      return matchingTool?.type || 'Other';
    };

    // Initialize groups for both organizational and global learnings
    const groupedLearnings = {
      // Organization groups
      'Your Organization\'s Lean Tools': [],
      'Your Organization\'s Quality Tools': [],
      'Your Organization\'s Other Modules': [],
      // Global groups
      'Global Lean Tools': [],
      'Global Quality Tools': [],
      'Global Other Modules': []
    };

    // Process each learning item
    learningItems.forEach(learning => {
      if (!learning || !learning.title) return;

      // Determine if it's an organizational learning
      const isOrgLearning = learning.organizationID === activeOrganization?.id;
      const toolType = getToolType(learning.title);
      
      // Determine the group key based on organization and type
      let groupKey;
      if (isOrgLearning) {
        switch (toolType) {
          case 'Lean Tools':
            groupKey = 'Your Organization\'s Lean Tools';
            break;
          case 'Quality':
            groupKey = 'Your Organization\'s Quality Tools';
            break;
          default:
            groupKey = 'Your Organization\'s Other Modules';
        }
      } else {
        switch (toolType) {
          case 'Lean Tools':
            groupKey = 'Global Lean Tools';
            break;
          case 'Quality':
            groupKey = 'Global Quality Tools';
            break;
          default:
            groupKey = 'Global Other Modules';
        }
      }
      
      groupedLearnings[groupKey].push(learning);
    });

    // Sort learnings within each group by their stored order index
    Object.keys(groupedLearnings).forEach(key => {
      groupedLearnings[key].sort((a, b) => {
        const orderA = a?.orderIndex || 0;
        const orderB = b?.orderIndex || 0;
        return orderA - orderB;
      });
    });

    // Convert to array format and filter out empty groups
    // Order: Organization groups first, then Global groups
    const groupOrder = [
      'Your Organization\'s Lean Tools',
      'Your Organization\'s Quality Tools', 
      'Your Organization\'s Other Modules',
      'Global Lean Tools',
      'Global Quality Tools',
      'Global Other Modules'
    ];

    const sortedGroups = groupOrder
      .map(groupName => [groupName, groupedLearnings[groupName]])
      .filter(([_, items]) => items.length > 0);

    return sortedGroups.length > 0 ? sortedGroups : [['No Learnings', []]];
  };

  const handleEdit = (learningId) => {
    navigate(`/learning/${learningId}/edit`);
  };

  const handleQuizzes = (learningId) => {
    navigate(`/learning/${learningId}/quizzes`);
  };

  const handleRead = (learningId) => {
    if (!learningId) {
      console.error('Learning ID is undefined or null');
      return;
    }
    navigate(`/learning/${learningId}/view`);
  };

  const handleClone = async (learning) => {
    setSelectedLearning(learning);
    setShowCloneModal(true);
  };

  const confirmClone = async () => {
    if (!activeOrganization?.id || !selectedLearning) return;
    
    setIsCloning(true);
    try {
      await cloneLearningForOrganization(selectedLearning.id, activeOrganization.id);
      await fetchLearnings(); // Refresh the list
      setShowCloneModal(false);
    } catch (error) {
      console.error('Error cloning learning:', error);
      setError('Failed to clone learning. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };

  const handleDelete = (learning) => {
    setLearningToDelete(learning);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!learningToDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete all associated quizzes and their questions
      const quizzes = quizzesByLearning[learningToDelete.id] || [];
      for (const quiz of quizzes) {
        // Delete all questions in the quiz
        const questionsResponse = await API.graphql({
          query: queries.questionsByQuizId,
          variables: { 
            quizId: quiz.id,
            filter: { _deleted: { ne: true } }
          }
        });
        
        const questions = questionsResponse.data.questionsByQuizId.items;
        for (const question of questions) {
          await API.graphql({
            query: mutations.deleteQuestion,
            variables: { input: { id: question.id } }
          });
        }

        // Delete the quiz
        await API.graphql({
          query: mutations.deleteQuiz,
          variables: { input: { id: quiz.id } }
        });
      }

      // Delete all chapters and their content
      const chaptersResponse = await API.graphql({
        query: queries.chaptersByLearningIdAndPosition,
        variables: { 
          learningId: learningToDelete.id,
          filter: { _deleted: { ne: true } }
        }
      });

      const chapters = chaptersResponse.data.chaptersByLearningIdAndPosition.items;
      for (const chapter of chapters) {
        // Delete chapter's post if it exists
        if (chapter.postId) {
          const postResponse = await API.graphql({
            query: queries.getPost,
            variables: { id: chapter.postId }
          });
          const post = postResponse.data.getPost;
          await API.graphql({
            query: mutations.deletePost,
            variables: { input: { id: post.id } }
          });
        }

        // Delete all sections and their content
        const sectionsResponse = await API.graphql({
          query: queries.sectionsByChapterIdAndPosition,
          variables: { 
            chapterId: chapter.id,
            filter: { _deleted: { ne: true } }
          }
        });

        const sections = sectionsResponse.data.sectionsByChapterIdAndPosition.items;
        for (const section of sections) {
          // Delete section's post if it exists
          if (section.postId) {
            const postResponse = await API.graphql({
              query: queries.getPost,
              variables: { id: section.postId }
            });
            const post = postResponse.data.getPost;
            await API.graphql({
              query: mutations.deletePost,
              variables: { input: { id: post.id } }
            });
          }

          // Delete all subsections and their content
          const subSectionsResponse = await API.graphql({
            query: queries.subSectionsBySectionIdAndPosition,
            variables: { 
              sectionId: section.id,
              filter: { _deleted: { ne: true } }
            }
          });

          const subSections = subSectionsResponse.data.subSectionsBySectionIdAndPosition.items;
          for (const subSection of subSections) {
            // Delete subsection's post if it exists
            if (subSection.postId) {
              const postResponse = await API.graphql({
                query: queries.getPost,
                variables: { id: subSection.postId }
              });
              const post = postResponse.data.getPost;
              await API.graphql({
                query: mutations.deletePost,
                variables: { input: { id: post.id } }
              });
            }

            // Delete the subsection
            await API.graphql({
              query: mutations.deleteSubSection,
              variables: { input: { id: subSection.id } }
            });
          }

          // Delete the section
          await API.graphql({
            query: mutations.deleteSection,
            variables: { input: { id: section.id } }
          });
        }

        // Delete the chapter
        await API.graphql({
          query: mutations.deleteChapter,
          variables: { input: { id: chapter.id } }
        });
      }

      // Finally, delete the learning itself
      await API.graphql({
        query: mutations.deleteLearning,
        variables: { 
          input: { 
            id: learningToDelete.id
          }
        }
      });

      await fetchLearnings(); // Refresh the list
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting learning:', error);
      setError('Failed to delete learning. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasManagementAccess = (isGlobalLearning = false) => {
    // Super admins can manage global learnings
    if (isGlobalLearning) {
      return isSuperAdmin;
    }
    
    // For organization-specific learnings, use the existing permission check
    if (!activeOrganization || !currentUser?.attributes?.sub || !currentUser?.attributes?.email) return false;
    return (
      activeOrganization.owner === currentUser.attributes.sub || 
      (Array.isArray(activeOrganization.additionalOwners) && 
       activeOrganization.additionalOwners.includes(currentUser.attributes.email))
    );
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
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
    <Container className="mt-4 pt-5">
      <div className="learning-header">
        <h2>
          <FontAwesomeIcon icon={faBook} className="me-2" />
          Learning Modules
        </h2>
      </div>

      {Array.isArray(learnings) && learnings.map(([groupName, groupLearnings]) => (
        <div key={groupName || 'default'} className="learning-group mb-5">
          <div className={`learning-group-header p-3 rounded ${
            groupName.includes('Organization') ? 'bg-primary' : 'bg-secondary'
          }`}>
            <h3 className="text-white mb-0">
              {groupName === 'Your Organization\'s Learning Modules' ? (
                <>
                  <FontAwesomeIcon icon={faBuilding} className="me-2" />
                  {groupName}
                  {activeOrganization && (
                    <small className="ms-2">({activeOrganization.name})</small>
                  )}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faGlobe} className="me-2" />
                  {groupName}
                </>
              )}
            </h3>
            {groupName === 'Global Learning Modules' && (
              <p className="text-white-50 mb-0 mt-2">
                These are default learning modules available to all organizations. Clone them to customize for your organization.
              </p>
            )}
          </div>

          <div className="learning-list mt-4">
            {Array.isArray(groupLearnings) && groupLearnings.map(learning => {
              if (!learning) return null;
              
              const { progress, hasQuizTaken } = calculateLearningProgress(learning.id);
              const quizzes = quizzesByLearning[learning.id] || [];
              const isDefaultLearning = learning.isDefault || !learning.organizationID;

              return (
                <div key={learning.id} className="learning-card">
                  <div className="learning-card-content">
                    <div className="learning-card-header">
                      <div className="tool-icon-container">
                        <img 
                          src={getIconForLearning(learning.title)} 
                          alt={learning.title}
                          className="tool-icon"
                        />
                      </div>
                      <h4 className="mt-3">{learning.title}</h4>
                      {quizzes.length > 0 && (
                        <div className="quiz-badge">
                          {quizzes.length} {quizzes.length === 1 ? 'Quiz' : 'Quizzes'}
                        </div>
                      )}
                    </div>

                    <div className="learning-card-body">
                      <div className="learning-card-description">
                        {learning.description || 'No description available'}
                        {isDefaultLearning && activeOrganization && (
                          <div className="mt-2">
                            <small className="text-muted">
                              This is a default learning module. Clone it to create your organization's version.
                            </small>
                          </div>
                        )}
                      </div>

                      <div className="learning-stats">
                        {hasQuizTaken && (
                          <div className="learning-progress">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="text-muted">Quiz Score</small>
                              <small className="fw-bold">{progress}%</small>
                            </div>
                            <ProgressBar 
                              now={progress} 
                              variant={progress >= 70 ? "success" : "danger"}
                            />
                          </div>
                        )}

                        <div className="learning-actions">
                          <Button
                            variant="primary"
                            onClick={() => handleRead(learning.id)}
                          >
                            <FontAwesomeIcon icon={faBook} className="me-1" />
                            Read
                          </Button>
                          
                          {((!isDefaultLearning && hasManagementAccess()) || (isDefaultLearning && isSuperAdmin)) && (
                            <>
                              <Button
                                variant="outline-primary"
                                onClick={() => handleEdit(learning.id)}
                              >
                                <FontAwesomeIcon icon={faEdit} className="me-1" />
                                Edit
                              </Button>
                              {!isDefaultLearning && (
                                <Button
                                  variant="outline-danger"
                                  onClick={() => handleDelete(learning)}
                                >
                                  <FontAwesomeIcon icon={faTrash} className="me-1" />
                                  Delete
                                </Button>
                              )}
                            </>
                          )}

                          {isDefaultLearning && activeOrganization && (isSuperAdmin || hasManagementAccess()) && (
                            <Button
                              variant="outline-success"
                              onClick={() => handleClone(learning)}
                            >
                              <FontAwesomeIcon icon={faClone} className="me-1" />
                              Clone
                            </Button>
                          )}
                          
                          <Button
                            variant="outline-primary"
                            onClick={() => handleQuizzes(learning.id)}
                          >
                            <FontAwesomeIcon icon={faChartBar} className="me-1" />
                            Quizzes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Clone Confirmation Modal */}
      <Modal show={showCloneModal} onHide={() => setShowCloneModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Clone Learning Module</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to clone "{selectedLearning?.title}"? This will create a copy of all content and quizzes for your organization.
          <Alert variant="danger" className="mt-3">
            <strong>Warning!</strong> The cloning process may take several minutes to complete. Please do not close or refresh this window until the process is finished. Doing so may result in incomplete data.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCloneModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={confirmClone}
            disabled={isCloning}
          >
            {isCloning ? 'Cloning...' : 'Clone'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Learning Module</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete "{learningToDelete?.title}"?</p>
          <p className="text-danger">This action cannot be undone and will delete:</p>
          <ul>
            <li>All chapters and their content</li>
            <li>All sections and their content</li>
            <li>All subsections and their content</li>
            <li>All associated quizzes and questions</li>
          </ul>
          <Alert variant="warning" className="mt-3">
            <strong>Important!</strong> The deletion process may take several minutes to complete. Please do not close or refresh this window until the process is finished. By deleting your customized Learning, the Default Learning will be restored!
          </Alert>
          <Alert variant="info" className="mt-3">
            <strong>Alternative:</strong> If deletion fails, you can click on Edit and manually delete all chapters and sections individually, then delete the learning module.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LearningList; 