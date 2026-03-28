import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Badge, Divider, Text, FAB } from 'react-native-paper';
import { generateClient } from "aws-amplify/api";
import { listAssessments, listAnswers } from '../../graphql/queries';
import { UserContext } from '../../UserContext';
import MainRunChart from './MainRunChart';
import { useFocusEffect } from '@react-navigation/native';

const client = generateClient();

const renderBadge = (isCompleted, label) => (
    <View style={styles.badgeWrapper}>
        <Badge 
            style={[
                styles.badge, 
                { backgroundColor: isCompleted ? '#4D8C51' : '#9A2A25' }
            ]}
        >
            {label}
        </Badge>
    </View>
);


const AssessmentHistory = ({ navigation }) => {
    const userId = useContext(UserContext);
    const [assessments, setAssessments] = useState([]);
    const [combinedScores, setCombinedScores] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAssessments = useCallback(async () => {
        try {
            const result = await client.graphql({
                query: listAssessments,
                variables: {
                    filter: {
                        user_id: { eq: userId }
                    }
                }
            });

            let fetchedAssessments = result.data.listAssessments.items;
            fetchedAssessments = fetchedAssessments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAssessments(fetchedAssessments);

            // Calculate combined scores for all assessments
            const scores = await Promise.all(fetchedAssessments.map(async assessment => {
                const answersResult = await client.graphql({
                    query: listAnswers,
                    variables: {
                        filter: {
                            assessmentID: { eq: assessment.id }
                        }
                    }
                });
                const assessmentAnswers = answersResult.data.listAnswers.items;
                const combinedScore = calculateCombinedScore(assessmentAnswers);
                return {
                    assessmentId: assessment.id,
                    score: combinedScore,
                    createdAt: assessment.createdAt
                };
            }));

            setCombinedScores(scores);
        } catch (error) {
            console.error('Error fetching assessments:', error);
        }
    }, [userId]);

    useEffect(() => {
        fetchAssessments();
    }, [fetchAssessments]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAssessments();
        setRefreshing(false);
    }, [fetchAssessments]);

    useFocusEffect(
        useCallback(() => {
            fetchAssessments();
        }, [fetchAssessments])
    );

    const calculateCombinedScore = (answers) => {
        const total = answers.reduce((acc, answer) => acc + parseInt(answer.answer), 0);
        return total / answers.length;
      };

    const navigateToDetails = (assessment) => {
        const combinedScore = combinedScores.find(score => score.assessmentId === assessment.id)?.score || 0;
        navigation.navigate('AssessmentDetails', { assessment, combinedScore });
    };

    const getFormattedScore = (assessment) => {
        const score = combinedScores.find(score => score.assessmentId === assessment.id)?.score;
        if (isNaN(score) || score === undefined || score === 0) {
            return '0';
        }
        return `${score.toFixed(2)}`;
    };

    const getValidScoresForChart = () => {
        return combinedScores.filter(score => 
            !isNaN(score.score) && score.score !== undefined && score.score !== 0
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4D8C51']} // You can customize the color
                    />
                }
            >
                <MainRunChart combinedScores={getValidScoresForChart()} />
                <Text style={styles.refreshNote}>
                    Note: If you're not seeing updated data, please pull down the page to refresh.
                </Text>
                <Title style={styles.sectionTitle}>Assessment History</Title>
                <Text style={styles.explanationText}>
                    Below is a list of your past assessments. Each card shows the combined score and completion status for different assessment types. Pull down to refresh or navigate back to this screen to update.
                </Text>
                {assessments.map((assessment, index) => (
                    <TouchableOpacity key={assessment.id} onPress={() => navigateToDetails(assessment)}>
                        <Card style={styles.card}>
                            <Card.Content>
                                <View style={styles.cardHeader}>
                                    <Title style={styles.scoreTitle}>
                                        {getFormattedScore(assessment)}
                                    </Title>
                                    <Paragraph style={styles.dateText}>
                                        {new Date(assessment.createdAt).toLocaleDateString()}
                                    </Paragraph>
                                </View>
                                <Divider style={styles.divider} />
                                <Text style={styles.badgeExplanation}>Completion status:</Text>
                                <View style={styles.badgeContainer}>
                                    {renderBadge(assessment.self_statement_completed, 'Self')}
                                    {renderBadge(assessment.peer_statement_completed, 'Peer')}
                                    {renderBadge(assessment.direct_statement_completed, 'Direct')}
                                    {renderBadge(assessment.boss_statement_completed, 'Boss')}
                                </View>
                                <Text style={styles.badgeLegend}>Green: Completed | Red: Incomplete</Text>
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => navigation.navigate('TakeAssessment', { userId })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    chartCard: {
        margin: 16,
        elevation: 4,
        borderRadius: 8,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    explanationText: {
        fontSize: 14,
        color: '#666',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    refreshNote: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
    },
    card: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    scoreTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4D8C51',
    },
    dateText: {
        fontSize: 14,
        color: '#666',
    },
    divider: {
        marginVertical: 12,
    },
    badgeExplanation: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    badgeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    badgeWrapper: {
        alignItems: 'center',
    },
    badge: {
        fontSize: 12,
        fontWeight: 'bold',
        width: 50,
        height: 22,
        borderRadius: 6,
    },
    badgeLegend: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
});

export default AssessmentHistory;