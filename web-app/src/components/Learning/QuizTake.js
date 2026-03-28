import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert, Form, ProgressBar, Spinner } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { addAward } from '../../utils/awards';
import { useAward } from '../../contexts/AwardContext';
import { useOrganization } from '../../contexts/OrganizationContext';

const QuizTake = () => {
  const { learningId, quizId } = useParams();
  const navigate = useNavigate();
  const { showAward } = useAward();
  const { activeOrganization } = useOrganization();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submittedQuestions, setSubmittedQuestions] = useState({});
  const [showExplanation, setShowExplanation] = useState({});

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch quiz data
      const quizData = await API.graphql({
        query: queries.getQuiz,
        variables: { id: quizId }
      });
      const fetchedQuiz = quizData.data.getQuiz;
      
      if (!fetchedQuiz) {
        throw new Error('Quiz not found');
      }
      
      setQuiz(fetchedQuiz);

      // Fetch questions separately
      const questionsData = await API.graphql({
        query: queries.questionsByQuizId,
        variables: {
          quizId: quizId,
          filter: {
            _deleted: { ne: true }
          }
        }
      });
      
      const fetchedQuestions = questionsData.data.questionsByQuizId.items;
      
      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        throw new Error('No questions found for this quiz');
      }
      
      // First sort by createdAt as fallback
      let sortedQuestions = [...fetchedQuestions].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Then sort by orderIndex if available
      sortedQuestions = sortedQuestions.sort((a, b) => {
        // If both have orderIndex, use it
        if (a.orderIndex !== undefined && a.orderIndex !== null && 
            b.orderIndex !== undefined && b.orderIndex !== null) {
          return a.orderIndex - b.orderIndex;
        }
        // If only one has orderIndex, prioritize the one with it
        if (a.orderIndex !== undefined && a.orderIndex !== null) return -1;
        if (b.orderIndex !== undefined && b.orderIndex !== null) return 1;
        // Otherwise fall back to createdAt order (already sorted)
        return 0;
      });
      
      setQuestions(sortedQuestions);
    } catch (err) {
      console.error('Error in fetchQuiz:', err);
      setError(err.message || 'Error fetching quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, selectedOption) => {
    setAnswers({
      ...answers,
      [questionId]: selectedOption
    });
  };

  const handleSubmitQuestion = (questionId) => {
    setSubmittedQuestions({
      ...submittedQuestions,
      [questionId]: true
    });
    setShowExplanation({
      ...showExplanation,
      [questionId]: true
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
      submitQuizResult();
    }
  };

  const submitQuizResult = async () => {
    const correctAnswers = questions.reduce((count, question) => {
      return count + (answers[question.id] === question.correctOption ? 1 : 0);
    }, 0);

    const percentage = Math.round((correctAnswers / questions.length) * 100);

    try {
      // Get current user's identity
      const { attributes } = await Auth.currentAuthenticatedUser();
      const userSub = attributes.sub;

      // 🔍 DEBUG LOGGING - WEB QUIZ SUBMISSION
      console.log('🌐 WEB: Taking quiz on web platform');
      console.log('🌐 WEB: Quiz submission details:', {
        user_sub: userSub,
        tool_id: quizId,
        quiz_id: quizId,
        learning_id: learningId,
        quiz_title: quiz?.title,
        learning_title: 'Check learning context for title',
        percentage: percentage,
        correctAnswers: correctAnswers,
        totalQuestions: questions.length,
        timestamp: new Date().toISOString()
      });

      const quizResultInput = {
        Correct: correctAnswers.toString(),
        Incorrect: (questions.length - correctAnswers).toString(),
        percentage: percentage.toString(),
        tool_id: quizId, // ⚠️ WEB USES QUIZ ID as tool_id
        user_sub: userSub
      };

      console.log('🌐 WEB: Creating new quiz result with input:', quizResultInput);

      // Save quiz result
      const result = await API.graphql({
        query: mutations.createQuizzesResult,
        variables: {
          input: quizResultInput
        }
      });

      console.log('🌐 WEB: Quiz result created successfully:', result.data.createQuizzesResult);

      // Update learning score
      await API.graphql({
        query: mutations.updateLearning,
        variables: {
          input: {
            id: learningId,
            quizScore: percentage,
            hasQuizTaken: true
          }
        }
      });

      // Give award if score is good
      if (percentage === 100) {
        console.log('Attempting to give perfect score award...');
        await addAward('QUIZ_PERFECT', activeOrganization?.id, null, quizId);
      } else if (percentage >= 80) {
        console.log('Attempting to give mastery award...');
        await addAward('QUIZ_MASTERY', activeOrganization?.id, null, quizId);
      }
    } catch (err) {
      console.error('Error submitting quiz result:', err);
      setError('Error saving quiz result: ' + err.message);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4 pt-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-2">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <div>Loading quiz...</div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4 pt-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button
              variant="outline-danger"
              onClick={() => navigate(`/learning/${learningId}/quizzes`)}
            >
              Back to Quizzes
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <Container className="mt-4 pt-5">
        <Alert variant="warning">
          This quiz has no questions yet.
          <Button
            variant="link"
            onClick={() => navigate(`/learning/${learningId}/quiz/${quizId}`)}
          >
            Edit Quiz
          </Button>
        </Alert>
      </Container>
    );
  }

  if (showResults) {
    const correctAnswers = questions.reduce((count, question) => {
      return count + (answers[question.id] === question.correctOption ? 1 : 0);
    }, 0);

    const percentage = Math.round((correctAnswers / questions.length) * 100);

    return (
      <Container className="mt-4 pt-5">
        <Card>
          <Card.Body>
            <h2>Quiz Results</h2>
            <div className="mb-4">
              <ProgressBar
                now={percentage}
                label={`${percentage}%`}
                variant={percentage >= 70 ? 'success' : 'danger'}
              />
            </div>
            <p>You got {correctAnswers} out of {questions.length} questions correct.</p>
            
            <div className="mt-4">
              <h3>Review</h3>
              {questions.map((question, index) => (
                <Card key={question.id} className="mb-3">
                  <Card.Body>
                    <Card.Title>Question {index + 1}</Card.Title>
                    <Card.Text>{question.content}</Card.Text>
                    
                    <div className="mb-3">
                      {question.options.map((option, optionIndex) => (
                        <Form.Check
                          key={optionIndex}
                          type="radio"
                          id={`q${question.id}-${optionIndex}`}
                          label={option}
                          checked={answers[question.id] === optionIndex}
                          disabled
                          className={
                            optionIndex === question.correctOption
                              ? 'text-success'
                              : answers[question.id] === optionIndex
                              ? 'text-danger'
                              : ''
                          }
                        />
                      ))}
                    </div>

                    {answers[question.id] !== question.correctOption && question.explanation && (
                      <Alert variant="info">
                        <strong>Explanation:</strong> {question.explanation}
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>

            <Button
              variant="primary"
              onClick={() => navigate(`/learning/${learningId}/quizzes`)}
              className="mt-3"
            >
              Back to Quizzes
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const question = questions[currentQuestion];
  const isQuestionSubmitted = submittedQuestions[question?.id];

  return (
    <Container className="mt-4 pt-5">
      <Card>
        <Card.Body>
          <div className="mb-3">
            <ProgressBar
              now={(currentQuestion / questions.length) * 100}
              label={`${currentQuestion + 1}/${questions.length}`}
            />
          </div>

          <Card.Title>Question {currentQuestion + 1}</Card.Title>
          <Card.Text>{question.content}</Card.Text>

          <Form>
            {question.options.map((option, index) => (
              <Form.Check
                key={index}
                type="radio"
                id={`option-${index}`}
                name="quizOption"
                label={option}
                checked={answers[question.id] === index}
                onChange={() => !isQuestionSubmitted && handleAnswer(question.id, index)}
                className={`mb-2 ${
                  isQuestionSubmitted
                    ? index === question.correctOption
                      ? 'text-success fw-bold'
                      : answers[question.id] === index
                      ? 'text-danger'
                      : 'text-dark'
                    : ''
                }`}
              />
            ))}
          </Form>

          {!isQuestionSubmitted ? (
            <Button
              variant="primary"
              onClick={() => handleSubmitQuestion(question.id)}
              disabled={answers[question.id] === undefined}
              className="mt-3 me-2"
            >
              Submit Answer
            </Button>
          ) : (
            <>
              {showExplanation[question.id] && question.explanation && (
                <Alert variant="info" className="mt-3">
                  <strong>Explanation:</strong> {question.explanation}
                </Alert>
              )}
              <Button
                variant="primary"
                onClick={handleNext}
                className="mt-3"
              >
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QuizTake; 