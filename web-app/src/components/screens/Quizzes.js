import React, { useState, useEffect } from 'react';
import { Container, Card, Button, ProgressBar, Spinner, Row, Col } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';
import * as queries from '../../graphql/queries';

const Quizzes = () => {
  const navigate = useNavigate();
  const [learnings, setLearnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizResults, setQuizResults] = useState({});

  useEffect(() => {
    fetchLearningsAndQuizzes();
    fetchQuizResults();
  }, []);

  const fetchLearningsAndQuizzes = async () => {
    try {
      // Fetch all learnings
      const learningsResult = await API.graphql({
        query: queries.listLearnings,
        variables: {
          filter: {
            _deleted: { ne: true }
          }
        }
      });
      
      // Fetch all quizzes
      const quizzesResult = await API.graphql({
        query: queries.listQuizzes,
        variables: {
          filter: {
            _deleted: { ne: true }
          }
        }
      });

      // Group quizzes by learning
      const learningsList = learningsResult.data.listLearnings.items;
      const quizzesList = quizzesResult.data.listQuizzes.items;
      
      // Create a map of quizzes by learningId
      const quizzesByLearning = {};
      quizzesList.forEach(quiz => {
        if (!quizzesByLearning[quiz.learningId]) {
          quizzesByLearning[quiz.learningId] = [];
        }
        quizzesByLearning[quiz.learningId].push(quiz);
      });

      // Add quizzes to each learning
      const learningsWithQuizzes = learningsList.map(learning => ({
        ...learning,
        quizzes: quizzesByLearning[learning.id] || []
      })).filter(learning => learning.quizzes.length > 0); // Only show learnings with quizzes

      setLearnings(learningsWithQuizzes);
    } catch (error) {
      console.error('Error fetching learnings and quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizResults = async () => {
    try {
      const { attributes } = await Auth.currentAuthenticatedUser();
      const userSub = attributes.sub;

      // 🔍 DEBUG LOGGING - WEB QUIZ RESULTS FETCH (Quizzes Page)
      console.log('🌐 WEB (Quizzes Page): Fetching quiz results for user:', userSub);

      const results = await API.graphql({
        query: queries.listQuizzesResults,
        variables: {
          filter: {
            user_sub: { eq: userSub }
          }
        }
      });

      console.log('🌐 WEB (Quizzes Page): Quiz results raw data:', results.data.listQuizzesResults.items);

      // Create a map of quiz ID to latest result
      const resultMap = {};
      results.data.listQuizzesResults.items.forEach(result => {
        if (!result._deleted) {
          const quizId = result.tool_id;
          console.log('🌐 WEB (Quizzes Page): Processing quiz result:', {
            result_id: result.id,
            tool_id: result.tool_id, // ⚠️ WEB EXPECTS THIS TO BE QUIZ ID
            percentage: result.percentage,
            user_sub: result.user_sub,
            createdAt: result.createdAt
          });
          
          if (!resultMap[quizId] || new Date(result.createdAt) > new Date(resultMap[quizId].createdAt)) {
            resultMap[quizId] = result;
          }
        }
      });

      console.log('🌐 WEB (Quizzes Page): Final quiz results map:', resultMap);

      setQuizResults(resultMap);
    } catch (error) {
      console.error('🌐 WEB (Quizzes Page): Error fetching quiz results:', error);
    }
  };

  const calculateLearningProgress = (quizzes) => {
    let totalProgress = 0;
    let completedQuizzes = 0;

    quizzes.forEach(quiz => {
      const result = quizResults[quiz.id];
      if (result) {
        totalProgress += parseInt(result.percentage);
        completedQuizzes++;
      }
    });

    return completedQuizzes > 0 ? Math.round(totalProgress / completedQuizzes) : 0;
  };

  const handleStartQuiz = (quiz) => {
    navigate(`/learning/${quiz.learningId}/quiz/${quiz.id}/take`);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4 pt-5">
      <h2 className="mb-4">Quiz Progress by Learning</h2>
      
      {learnings.map((learning) => {
        const averageProgress = calculateLearningProgress(learning.quizzes);
        
        return (
          <Card key={learning.id} className="mb-4">
            <Card.Header>
              <h3 className="mb-0">{learning.title}</h3>
              <div className="mt-2">
                <small className="text-muted">Overall Progress</small>
                <ProgressBar 
                  now={averageProgress} 
                  label={`${averageProgress}%`}
                  variant={averageProgress >= 70 ? 'success' : averageProgress > 0 ? 'warning' : 'secondary'}
                />
              </div>
            </Card.Header>
            <Card.Body>
              <Row xs={1} md={2} className="g-4">
                {learning.quizzes.map((quiz) => {
                  const result = quizResults[quiz.id];
                  const progress = result ? parseInt(result.percentage) : 0;
                  
                  return (
                    <Col key={quiz.id}>
                      <Card className="h-100">
                        <Card.Body>
                          <Card.Title>{quiz.title}</Card.Title>
                          <Card.Text>{quiz.description}</Card.Text>
                          
                          <div className="mb-3">
                            <small className="text-muted">Quiz Progress</small>
                            <ProgressBar 
                              now={progress} 
                              label={`${progress}%`}
                              variant={progress >= 70 ? 'success' : progress > 0 ? 'warning' : 'secondary'}
                            />
                          </div>
                          
                          <Button 
                            variant="primary"
                            onClick={() => handleStartQuiz(quiz)}
                          >
                            {result ? 'Retake Quiz' : 'Start Quiz'}
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>
        );
      })}
      
      {learnings.length === 0 && (
        <Card>
          <Card.Body className="text-center">
            <Card.Text>No quizzes available at the moment.</Card.Text>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Quizzes; 