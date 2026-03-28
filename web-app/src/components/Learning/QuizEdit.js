import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';

const QuizEdit = () => {
  const { learningId, quizId } = useParams();
  const navigate = useNavigate();
  
  // Main state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Quiz data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Questions data - stored in local state only until save
  const [questions, setQuestions] = useState([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]);
  
  // Load quiz and questions on mount
  useEffect(() => {
    if (quizId) {
      loadQuizData();
    } else {
      setLoading(false);
    }
  }, [quizId]);
  
  // Load quiz and its questions
  const loadQuizData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch quiz
      const quizResponse = await API.graphql({
        query: queries.getQuiz,
        variables: { id: quizId }
      });
      
      const quizData = quizResponse.data.getQuiz;
      setTitle(quizData.title || '');
      setDescription(quizData.description || '');
      
      // Fetch questions for this quiz
      const questionsResponse = await API.graphql({
        query: queries.questionsByQuizId,
        variables: {
          quizId: quizId,
          filter: {
            _deleted: { ne: true }
          }
        }
      });
      
      let questionsData = questionsResponse.data.questionsByQuizId.items;
      
      // First sort by createdAt to get a base order
      questionsData = questionsData.sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      
      // Initialize any missing orderIndex values
      questionsData = questionsData.map((question, index) => {
        if (question.orderIndex === undefined || question.orderIndex === null) {
          return { ...question, orderIndex: index, isModified: true };
        }
        return question;
      });
      
      // Then sort by orderIndex
      questionsData = questionsData.sort((a, b) => {
        return a.orderIndex - b.orderIndex;
      });
      
      setQuestions(questionsData);
    } catch (err) {
      console.error('Error loading quiz:', err);
      setError('Failed to load quiz data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new empty quiz (title + description)
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Quiz title is required');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      // Create new quiz
      const result = await API.graphql({
        query: mutations.createQuiz,
        variables: {
          input: {
            title,
            description,
            learningId
          }
        }
      });
      
      const newQuizId = result.data.createQuiz.id;
      navigate(`/learning/${learningId}/quiz/${newQuizId}`);
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError('Failed to create quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Add a new question to local state only
  const handleAddQuestion = () => {
    // Find the highest orderIndex
    const highestIndex = questions.length > 0 
      ? Math.max(...questions.map(q => q.orderIndex !== null && q.orderIndex !== undefined ? q.orderIndex : 0))
      : -1;
      
    const newQuestion = {
      // Use temporary id for local state management
      tempId: `temp-${Date.now()}-${questions.length}`,
      content: 'New Question',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctOption: 0,
      explanation: '',
      orderIndex: highestIndex + 1,
      quizId: quizId,
      isNew: true
    };
    
    setQuestions([...questions, newQuestion]);
  };
  
  // Update question in local state
  const handleUpdateQuestion = (questionIndex, updates) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      ...updates,
      // Mark as modified if it's not a new question
      isModified: !updatedQuestions[questionIndex].isNew
    };
    setQuestions(updatedQuestions);
  };
  
  // Move question up or down
  const handleMoveQuestion = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }
    
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Ensure all questions have an orderIndex before swapping
    newQuestions.forEach((q, i) => {
      if (q.orderIndex === undefined || q.orderIndex === null) {
        q.orderIndex = i;
        if (!q.isNew) {
          q.isModified = true;
        }
      }
    });
    
    // Swap the questions
    [newQuestions[index], newQuestions[targetIndex]] = 
      [newQuestions[targetIndex], newQuestions[index]];
    
    // Swap their orderIndex values
    [newQuestions[index].orderIndex, newQuestions[targetIndex].orderIndex] = 
      [newQuestions[targetIndex].orderIndex, newQuestions[index].orderIndex];
    
    // Mark both questions as modified since their order changed
    if (!newQuestions[index].isNew) {
      newQuestions[index].isModified = true;
    }
    
    if (!newQuestions[targetIndex].isNew) {
      newQuestions[targetIndex].isModified = true;
    }
    
    setQuestions(newQuestions);
  };
  
  // Delete question - if it exists in the database, mark for deletion
  // otherwise just remove from local state
  const handleDeleteQuestion = (index) => {
    const questionToDelete = questions[index];
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    
    // Update orderIndex values for all questions after the deleted one
    for (let i = index; i < newQuestions.length; i++) {
      if (newQuestions[i].orderIndex !== undefined && newQuestions[i].orderIndex !== null) {
        newQuestions[i].orderIndex -= 1;
        newQuestions[i].isModified = !newQuestions[i].isNew;
      } else {
        // If orderIndex is null or undefined, set it based on position
        newQuestions[i].orderIndex = i;
        newQuestions[i].isModified = !newQuestions[i].isNew;
      }
    }
    
    setQuestions(newQuestions);
    
    // If this is an existing question (has an ID), track it for deletion
    if (questionToDelete.id) {
      setDeletedQuestionIds([...deletedQuestionIds, questionToDelete.id]);
    }
  };
  
  // Save entire quiz including all questions
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Quiz title is required');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      // 1. Update or create the quiz
      if (quizId) {
        await API.graphql({
          query: mutations.updateQuiz,
          variables: {
            input: {
              id: quizId,
              title,
              description,
              learningId
            }
          }
        });
      } else {
        const result = await API.graphql({
          query: mutations.createQuiz,
          variables: {
            input: {
              title,
              description,
              learningId
            }
          }
        });
        
        // Get the new quiz ID
        const newQuizId = result.data.createQuiz.id;
        navigate(`/learning/${learningId}/quiz/${newQuizId}`);
        return; // Exit here as we've redirected
      }
      
      // Ensure all questions have an orderIndex that matches their current position
      const orderedQuestions = questions.map((q, index) => ({
        ...q,
        orderIndex: index,
        isModified: q.orderIndex !== index && !q.isNew ? true : q.isModified
      }));
      
      // 2. Process questions
      // Create new questions
      const newQuestions = orderedQuestions.filter(q => q.isNew);
      for (const question of newQuestions) {
        await API.graphql({
          query: mutations.createQuestion,
          variables: {
            input: {
              content: question.content,
              options: question.options,
              correctOption: question.correctOption,
              explanation: question.explanation,
              orderIndex: question.orderIndex,
              quizId
            }
          }
        });
      }
      
      // Update modified questions
      const modifiedQuestions = orderedQuestions.filter(q => (q.isModified || q.orderIndex === null || q.orderIndex === undefined) && !q.isNew);
      for (const question of modifiedQuestions) {
        await API.graphql({
          query: mutations.updateQuestion,
          variables: {
            input: {
              id: question.id,
              content: question.content,
              options: question.options,
              correctOption: question.correctOption,
              explanation: question.explanation,
              orderIndex: question.orderIndex,
              quizId
            }
          }
        });
      }
      
      // Delete questions
      for (const questionId of deletedQuestionIds) {
        await API.graphql({
          query: mutations.deleteQuestion,
          variables: {
            input: { id: questionId }
          }
        });
      }
      
      setSuccess('Quiz and questions saved successfully');
      
      // Reset tracking arrays
      setDeletedQuestionIds([]);
      
      // Reload to get the latest state from database
      await loadQuizData();
    } catch (err) {
      console.error('Error saving quiz:', err);
      setError('Failed to save quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" />
        <p>Loading quiz...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <h1>{quizId ? 'Edit Quiz' : 'Create Quiz'}</h1>
      
      {/* Success and Error Alerts */}
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}
      
      {/* Quiz Details Form */}
      <Form className="mb-4">
        <Card className="mb-4">
          <Card.Header>
            <h4>Quiz Details</h4>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Quiz Title</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
            
            {!quizId && (
              <Button 
                onClick={handleCreateQuiz}
                disabled={saving}
              >
                {saving ? 'Creating...' : 'Create Quiz'}
              </Button>
            )}
          </Card.Body>
        </Card>
        
        {/* Questions Section - Only show if quiz exists */}
        {quizId && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2>Questions ({questions.length})</h2>
              <Button 
                variant="success" 
                onClick={handleAddQuestion}
                disabled={saving}
              >
                Add Question
              </Button>
            </div>
            
            {questions.length === 0 ? (
              <Alert variant="info">
                No questions yet. Click "Add Question" to create your first question.
              </Alert>
            ) : (
              <div className="questions-container">
                {questions.map((question, index) => (
                  <Card key={question.id || question.tempId} className="mb-3">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Question {index + 1}</h5>
                      <div>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => handleMoveQuestion(index, 'up')}
                          disabled={index === 0}
                          className="me-1"
                        >
                          ↑
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => handleMoveQuestion(index, 'down')}
                          disabled={index === questions.length - 1}
                          className="me-1"
                        >
                          ↓
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteQuestion(index)}
                        >
                          ✕
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Question Text</Form.Label>
                        <Form.Control
                          type="text"
                          value={question.content}
                          onChange={(e) => handleUpdateQuestion(index, { content: e.target.value })}
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Answer Options</Form.Label>
                        {question.options && question.options.map((option, optIndex) => (
                          <Row key={optIndex} className="mb-2 align-items-center">
                            <Col xs="auto">
                              <Form.Check
                                type="radio"
                                name={`correct-${question.id || question.tempId}`}
                                checked={question.correctOption === optIndex}
                                onChange={() => handleUpdateQuestion(index, { correctOption: optIndex })}
                                id={`option-${question.id || question.tempId}-${optIndex}`}
                              />
                            </Col>
                            <Col>
                              <Form.Control
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options];
                                  newOptions[optIndex] = e.target.value;
                                  handleUpdateQuestion(index, { options: newOptions });
                                }}
                              />
                            </Col>
                          </Row>
                        ))}
                      </Form.Group>
                      
                      <Form.Group className="mb-0">
                        <Form.Label>Explanation (Optional)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={question.explanation || ''}
                          onChange={(e) => handleUpdateQuestion(index, { explanation: e.target.value })}
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="mt-4 d-flex justify-content-end">
              <Button 
                variant="primary" 
                onClick={handleSaveQuiz}
                disabled={saving}
                size="lg"
              >
                {saving ? 'Saving Quiz...' : 'Save All Changes'}
              </Button>
            </div>
          </>
        )}
      </Form>
    </Container>
  );
};

export default QuizEdit; 