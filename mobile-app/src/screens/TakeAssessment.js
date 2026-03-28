import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Title, Paragraph, Button, RadioButton, TextInput } from 'react-native-paper';
import { generateClient } from "aws-amplify/api";
import { createAssessment, createAnswers, updateAssessment } from '../graphql/mutations';
import Clipboard from '@react-native-community/clipboard';

const client = generateClient();

const TakeAssessment = ({ route, navigation }) => {
    const { userId } = route.params;
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [assessmentId, setAssessmentId] = useState(null);
    const [questionsPerModule, setQuestionsPerModule] = useState('1');
    const [assessmentStarted, setAssessmentStarted] = useState(false);
    const [assessmentCompleted, setAssessmentCompleted] = useState(false);

    const [assessment, setAssessment] = useState({
        user_id: userId,
        self_statement_completed: false,
        peer_statement_completed: false,
        direct_statement_completed: false,
        boss_statement_completed: false,
        ques_per_module: '1',
        answers: [],
    });

    const startAssessment = async () => {
        setIsLoading(true);
        try {
            const assessmentData = {
                user_id: assessment.user_id,
                self_statement_completed: false,
                peer_statement_completed: false,
                direct_statement_completed: false,
                boss_statement_completed: false,
                ques_per_module: questionsPerModule,
            };

            const newAssessment = await client.graphql({
                query: createAssessment,
                variables: { input: assessmentData }
            });
            const assessmentID = newAssessment.data.createAssessment.id;
            setAssessmentId(assessmentID);

            const statements = require('../json/Statements.json');
            const groupedData = statements.reduce((acc, item) => {
                if (!acc[item.learning_id]) {
                    acc[item.learning_id] = [];
                }
                acc[item.learning_id].push(item);
                return acc;
            }, {});

            const selectedQuestions = Object.values(groupedData).flatMap(statements =>
                statements.slice(0, parseInt(questionsPerModule))
            );

            const shuffledQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
            setQuestions(shuffledQuestions);
            setAssessmentStarted(true);
        } catch (error) {
            console.error('Error starting assessment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        const currentQuestion = questions[currentQuestionIndex];
        const newAnswer = {
            assessment_id: assessmentId,
            learning_id: currentQuestion.learning_id,
            question: currentQuestion.self_statement,
            answer: selectedAnswer,
            answer_type: 'self',
        };

        setAssessment(prevAssessment => ({
            ...prevAssessment,
            answers: [...prevAssessment.answers, newAnswer]
        }));

        setQuestions(prevQuestions => {
            const updatedQuestions = [...prevQuestions];
            updatedQuestions[currentQuestionIndex] = { ...currentQuestion, answer: selectedAnswer };
            return updatedQuestions;
        });

        setSelectedAnswer(null);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setAssessmentCompleted(true);
            saveAssessment();
        }
    };

    const saveAssessment = async () => {
        setIsLoading(true);
        try {
            // Update the assessment record
            const updateAssessmentInput = {
                id: assessmentId,
                self_statement_completed: true,
            };

            await client.graphql({
                query: updateAssessment,
                variables: { input: updateAssessmentInput }
            });

            // Create the answers records
            for (const answer of assessment.answers) {
                const answerData = {
                    learning_id: answer.learning_id,
                    answer: answer.answer.toString(),
                    assessmentID: assessmentId,
                    type: answer.answer_type,
                    question: answer.question,
                };

                await client.graphql({
                    query: createAnswers,
                    variables: { input: answerData }
                });
            }

            console.log('Assessment and answers saved successfully');
        } catch (error) {
            console.error('Error saving assessment and answers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentQuestionIndex >= questions.length && questions.length > 0) {
            saveAssessment();
        }
    }, [currentQuestionIndex, questions.length]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Processing...</Text>
            </View>
        );
    }

    if (!assessmentStarted) {
        return (
            <View style={styles.container}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Select Questions per Module</Title>
                        <RadioButton.Group onValueChange={value => setQuestionsPerModule(value)} value={questionsPerModule}>
                            <RadioButton.Item label="1 Question" value="1" />
                            <RadioButton.Item label="2 Questions" value="2" />
                            <RadioButton.Item label="3 Questions" value="3" />
                        </RadioButton.Group>
                    </Card.Content>
                </Card>
                <Button mode="contained" onPress={startAssessment} style={styles.startButton}>
                    Start Assessment
                </Button>
            </View>
        );
    }

    if (assessmentCompleted) {
        return (
            <View style={styles.thankYouContainer}>
                <Text style={styles.thankYouText}>Thank you for completing the assessment!</Text>
                <Text style={styles.shareText}>Share with:</Text>
                <View style={styles.urlContainer}>
                    <Text style={styles.urlLabel}>Peer:</Text>
                    <TextInput style={styles.urlInput} value={`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessmentId}/peer_statement`} editable={false} />
                    <Button onPress={() => Clipboard.setString(`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessmentId}/peer_statement`)} style={styles.copyButton}>Copy</Button>
                </View>
                <View style={styles.urlContainer}>
                    <Text style={styles.urlLabel}>Direct:</Text>
                    <TextInput style={styles.urlInput} value={`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessmentId}/direct_statement`} editable={false} />
                    <Button onPress={() => Clipboard.setString(`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessmentId}/direct_statement`)} style={styles.copyButton}>Copy</Button>
                </View>
                <View style={styles.urlContainer}>
                    <Text style={styles.urlLabel}>Boss:</Text>
                    <TextInput style={styles.urlInput} value={`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessmentId}/boss_statement`} editable={false} />
                    <Button onPress={() => Clipboard.setString(`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessmentId}/boss_statement`)} style={styles.copyButton}>Copy</Button>
                </View>
                <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>Go Back</Button>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Button mode="contained" onPress={() => navigation.goBack()} style={styles.cancelButton}>Cancel</Button>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Question {currentQuestionIndex + 1} of {questions.length}</Title>
                    <Paragraph>{questions[currentQuestionIndex].self_statement}</Paragraph>
                    <RadioButton.Group onValueChange={value => setSelectedAnswer(value)} value={selectedAnswer}>
                        <RadioButton.Item label="Strongly disagree" value={1} />
                        <RadioButton.Item label="Disagree" value={2} />
                        <RadioButton.Item label="Neutral" value={3} />
                        <RadioButton.Item label="Agree" value={4} />
                        <RadioButton.Item label="Strongly agree" value={5} />
                    </RadioButton.Group>
                </Card.Content>
            </Card>
            <Button mode="contained" onPress={handleConfirm} disabled={selectedAnswer === null} style={styles.confirmButton}>
                {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        marginVertical: 20,
    },
    confirmButton: {
        marginTop: 20,
    },
    cancelButton: {
        marginBottom: 20,
        backgroundColor: '#F5937E',
    },
    thankYouContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thankYouText: {
        fontSize: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    urlContainer: {
        width: '100%',
        marginBottom: 10,
    },
    urlLabel: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    urlInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 5,
        marginBottom: 5,
    },
    copyButton: {
        alignSelf: 'flex-end',
    },
    startButton: {
        marginTop: 20,
    },
});

export default TakeAssessment;