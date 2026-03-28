import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert, ProgressBar, Row, Col, Badge, Modal } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import QuizCreateModal from './QuizCreateModal';
import { useOrganization } from '../../contexts/OrganizationContext';

const QuizList = () => {
  const { learningId } = useParams();
  const navigate = useNavigate();
  const { activeOrganization } = useOrganization();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizResults, setQuizResults] = useState({});
  const [learning, setLearning] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [questionCounts, setQuestionCounts] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

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

  const hasManagementAccess = () => {
    if (!activeOrganization || !currentUser?.attributes?.sub || !currentUser?.attributes?.email) return false;
    return (
      activeOrganization.owner === currentUser.attributes.sub || 
      (Array.isArray(activeOrganization.additionalOwners) && activeOrganization.additionalOwners.includes(currentUser.attributes.email))
    );
  };

  useEffect(() => {
    fetchData();
  }, [learningId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch learning details
      const learningResult = await API.graphql({
        query: queries.getLearning,
        variables: { id: learningId }
      });
      setLearning(learningResult.data.getLearning);

      // Fetch quizzes
      const quizzesResult = await API.graphql({
        query: queries.listQuizzes,
        variables: {
          filter: {
            learningId: { eq: learningId },
            _deleted: { ne: true }
          }
        }
      });
      const quizzesList = quizzesResult.data.listQuizzes.items;
      setQuizzes(quizzesList);

      // Fetch questions count for each quiz
      const questionsPromises = quizzesList.map(quiz => 
        API.graphql({
          query: queries.questionsByQuizId,
          variables: {
            quizId: quiz.id,
            filter: {
              _deleted: { ne: true }
            }
          }
        })
      );

      const questionsResults = await Promise.all(questionsPromises);
      const questionCountMap = {};
      questionsResults.forEach((result, index) => {
        const quizId = quizzesList[index].id;
        questionCountMap[quizId] = result.data.questionsByQuizId.items.length;
      });
      setQuestionCounts(questionCountMap);

      // Fetch quiz results
      const { attributes } = await Auth.currentAuthenticatedUser();
      const userSub = attributes.sub;

      const resultsResponse = await API.graphql({
        query: queries.listQuizzesResults,
        variables: {
          filter: {
            user_sub: { eq: userSub }
          }
        }
      });

      // Create a map of quiz ID to latest result
      const resultMap = {};
      resultsResponse.data.listQuizzesResults.items.forEach(result => {
        if (!result._deleted) {
          const quizId = result.tool_id;
          if (!resultMap[quizId] || new Date(result.createdAt) > new Date(resultMap[quizId].createdAt)) {
            resultMap[quizId] = result;
          }
        }
      });

      setQuizResults(resultMap);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching quizzes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizCreated = async (newQuiz) => {
    // Add the new quiz with 0 questions initially
    setQuestionCounts(prev => ({
      ...prev,
      [newQuiz.id]: 0
    }));
    setQuizzes([...quizzes, newQuiz]);
  };

  const calculateOverallProgress = () => {
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
      score: completedQuizzes > 0 ? Math.round(totalProgress / completedQuizzes) : 0,
      completedQuizzes,
      totalQuizzes: quizzes.length
    };
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      setLoading(true);
      await API.graphql({
        query: mutations.deleteQuiz,
        variables: {
          input: { id: quizId }
        }
      });
      setQuizzes(quizzes.filter(q => q.id !== quizId));
      setShowDeleteModal(false);
      setQuizToDelete(null);
    } catch (err) {
      setError('Error deleting quiz: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      </Container>
    );
  }

  const progress = calculateOverallProgress();

  return (
    <Container className="mt-4 pt-5">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="mb-3">Quizzes for {learning?.title}</h2>
          <div className="mb-4" style={{ maxWidth: '400px' }}>
            <div className="d-flex justify-content-between mb-2">
              <small className="text-muted">Overall Progress ({progress.completedQuizzes}/{progress.totalQuizzes} Quizzes)</small>
              <small className="text-muted">{progress.score}%</small>
            </div>
            <ProgressBar
              now={progress.score}
              variant={progress.score >= 70 ? 'success' : progress.score > 0 ? 'warning' : 'secondary'}
            />
          </div>
        </div>
        {hasManagementAccess() && (
          <Button 
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Quiz
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Row xs={1} md={2} className="g-4">
        {quizzes.map((quiz) => {
          const result = quizResults[quiz.id];
          const quizProgress = result ? parseInt(result.percentage) : 0;
          const questionCount = questionCounts[quiz.id] || 0;
          
          return (
            <Col key={quiz.id}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title>{quiz.title}</Card.Title>
                    <Badge bg="info">
                      {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
                    </Badge>
                  </div>
                  <Card.Text>{quiz.description}</Card.Text>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">Quiz Progress</small>
                      <small className="text-muted">{quizProgress}%</small>
                    </div>
                    <ProgressBar 
                      now={quizProgress} 
                      variant={quizProgress >= 70 ? 'success' : quizProgress > 0 ? 'warning' : 'secondary'}
                    />
                  </div>
                  
                  <div className="d-flex gap-2">
                    <Button 
                      variant="primary"
                      onClick={() => navigate(`/learning/${learningId}/quiz/${quiz.id}/take`)}
                      disabled={questionCount === 0}
                    >
                      {questionCount === 0 ? 'No Questions' : result ? 'Retake Quiz' : 'Start Quiz'}
                    </Button>
                    {hasManagementAccess() && (
                      <>
                        <Button 
                          variant="outline-secondary"
                          onClick={() => navigate(`/learning/${learningId}/quiz/${quiz.id}`)}
                        >
                          {questionCount === 0 ? 'Add Questions' : 'Edit Quiz'}
                        </Button>
                        <Button 
                          variant="outline-danger"
                          onClick={() => {
                            setQuizToDelete(quiz);
                            setShowDeleteModal(true);
                          }}
                        >
                          Delete Quiz
                        </Button>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
      
      {quizzes.length === 0 && (
        <Card>
          <Card.Body className="text-center">
            <Card.Text>No quizzes available for this learning. Create one to get started!</Card.Text>
          </Card.Body>
        </Card>
      )}

      <QuizCreateModal
        show={showCreateModal}
        handleClose={() => setShowCreateModal(false)}
        learningId={learningId}
        onQuizCreated={handleQuizCreated}
      />

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this quiz? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={() => handleDeleteQuiz(quizToDelete?.id)}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Quiz'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuizList; 