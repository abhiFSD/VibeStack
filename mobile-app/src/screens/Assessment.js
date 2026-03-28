import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TextInput, Button } from 'react-native';
import { Card, IconButton, Title, Paragraph, Badge, FAB } from 'react-native-paper';
import { generateClient } from "aws-amplify/api";
import awsconfig from '../aws-exports';
import { listAssessments, listAnswers } from '../graphql/queries';
import { BarChart, LineChart } from 'react-native-chart-kit';
import moment from 'moment';
import { onCreateAssessment, onCreateAnswers } from '../graphql/subscriptions';
import { UserContext } from '../UserContext';
import Clipboard from '@react-native-community/clipboard';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const client = generateClient();

const screenWidth = Dimensions.get('window').width;

const calculateCombinedScore = (answers) => {
    const total = answers.reduce((acc, answer) => acc + parseInt(answer.answer), 0);
    return total / answers.length;
  };


const GapAnalysisCard = ({ gap }) => (
    <Card style={[styles.gapCard, { borderColor: gap.color }]}>
      <Card.Content>
        <Title>{gap.learningName}</Title>
        <Paragraph>Gap: {gap.gap.toFixed(2)}</Paragraph>
        <Paragraph>Assessor Type: {gap.assessorType}</Paragraph>
      </Card.Content>
    </Card>
  );

  const getGapColor = (gap, percentile) => {
    if (gap <= 0) return 'green';
    if (percentile <= 0.2) return 'green';
    if (percentile <= 0.8) return 'yellow';
    return 'red';
  };

  const assignColorsToGaps = (gaps) => {
    const sortedGaps = [...gaps].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
    const totalGaps = sortedGaps.length;
  
    return sortedGaps.map((gap, index) => ({
      ...gap,
      color: getGapColor(gap.gap, (index + 1) / totalGaps)
    }));
  };


const AssessmentHistory = ({ navigation }) => {
    const userId = useContext(UserContext);
    const [assessments, setAssessments] = useState([]);
    const [expandedAssessment, setExpandedAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [combinedScores, setCombinedScores] = useState([]);
    const [index, setIndex] = useState(0);
    const [routes, setRoutes] = useState([]);
    const [gaps, setGaps] = useState([]);

    const copyToClipboard = (text) => {
        Clipboard.setString(text);
        alert('Copied to clipboard');
    };

    const calculateGaps = (selfAnswers, otherAnswers) => {
        const gaps = [];
        const selfModules = groupAnswersByLearningId(selfAnswers);
        const otherTypes = ['peer', 'direct', 'boss'];
    
        otherTypes.forEach(type => {
            const typeAnswers = otherAnswers.filter(answer => answer.type === type);
            const typeModules = groupAnswersByLearningId(typeAnswers);
    
            Object.entries(selfModules).forEach(([learningId, selfGroupedAnswers]) => {
                const selfScore = calculateCombinedScore(selfGroupedAnswers);
                const otherScore = typeModules[learningId] 
                    ? calculateCombinedScore(typeModules[learningId])
                    : null;
    
                if (otherScore !== null) {
                    const gap = selfScore - otherScore;
                    gaps.push({
                        learningId,
                        learningName: getLearningNameById(learningId),
                        gap,
                        assessorType: type,
                        selfScore,
                        otherScore
                    });
                }
            });
        });
    
        return gaps;
    };

    const renderGapAnalysis = () => {
        if (!expandedAssessment || !answers[expandedAssessment]) {
            return <Text>No data available for gap analysis.</Text>;
        }

        const selfAnswers = answers[expandedAssessment].filter(answer => answer.type === 'self');
        const otherAnswers = answers[expandedAssessment].filter(answer => answer.type !== 'self');
        
        if (selfAnswers.length === 0 || otherAnswers.length === 0) {
            return <Text>Insufficient data for gap analysis. Ensure both self and other assessments are completed.</Text>;
        }

        const calculatedGaps = calculateGaps(selfAnswers, otherAnswers);
        const coloredGaps = assignColorsToGaps(calculatedGaps);

        return (
            <>
                <Text style={styles.gapExplanation}>
                    This Gap Analysis shows the difference between your self-assessment and other assessors' scores.
                    Positive gaps (red/yellow) indicate areas where you may be overestimating your skills.
                    Negative gaps (green) suggest areas where you may be underestimating yourself.
                </Text>
                <View style={styles.legend}>
                    <View style={[styles.legendItem, { backgroundColor: 'red' }]}><Text>Large Gap</Text></View>
                    <View style={[styles.legendItem, { backgroundColor: 'yellow' }]}><Text>Moderate Gap</Text></View>
                    <View style={[styles.legendItem, { backgroundColor: 'green' }]}><Text>Small/No Gap</Text></View>
                </View>
                {coloredGaps.map(gap => (
                    <GapAnalysisCard key={`${gap.learningId}-${gap.assessorType}`} gap={gap} />
                ))}
            </>
        );
    };
    

    useEffect(() => {
        let newAssessmentId = null;
        const assessmentSubscription = client.graphql(
            { query: onCreateAssessment, variables: { user_id: userId } }
        ).subscribe({
            next: async (data) => {
                const newAssessment = data.value.data.onCreateAssessment;
                newAssessmentId = newAssessment.id;
                setAssessments(prevAssessments => [newAssessment, ...prevAssessments]);
            }
        });

        const answerSubscription = client.graphql(
            { query: onCreateAnswers }
        ).subscribe({
            next: async (data) => {
                const newAnswer = data.value.data.onCreateAnswers;
                if (newAnswer.assessmentID === newAssessmentId) {
                    const answersResult = await client.graphql({
                        query: listAnswers,
                        variables: {
                            filter: {
                                assessmentID: { eq: newAssessmentId }
                            }
                        }
                    });
                    const assessmentAnswers = answersResult.data.listAnswers.items;
                    const combinedScore = calculateCombinedScore(assessmentAnswers);

                    setCombinedScores(prevScores => [...prevScores, {
                        assessmentId: newAssessmentId,
                        score: combinedScore,
                        createdAt: newAnswer.createdAt
                    }]);
                }
            }
        });

        return () => {
            assessmentSubscription.unsubscribe();
            answerSubscription.unsubscribe();
        };
    }, [userId]);

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
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

            console.log('Combined Scores:', scores);
            setCombinedScores(scores);
        } catch (error) {
            console.error('Error fetching assessments:', error);
        }
    };

    const fetchAnswers = async (assessmentId) => {
        let allAnswers = [];
        let nextToken = null;

        do {
            try {
                const result = await client.graphql({
                    query: listAnswers,
                    variables: {
                        filter: {
                            assessmentID: { eq: assessmentId }
                        },
                        nextToken: nextToken
                    }
                });

                const answersFetched = result.data.listAnswers.items;
                nextToken = result.data.listAnswers.nextToken;

                allAnswers = [...allAnswers, ...answersFetched];
            } catch (error) {
                console.error('Error fetching answers:', error);
            }
        } while (nextToken);

        console.log(`Retrieved ${allAnswers.length} answers for assessment ID ${assessmentId}`);

        setAnswers(prevAnswers => ({
            ...prevAnswers,
            [assessmentId]: allAnswers
        }));

        const types = ['self', 'peer', 'direct', 'boss'];
        types.forEach(type => {
            const filteredAnswers = filterAnswersByType(allAnswers, type);
            console.log(`Type ${type} has ${filteredAnswers.length} answers`);
            const groupedByLearning = groupAnswersByLearningId(filteredAnswers);
            groupedByLearning.forEach(([learningId, groupedAnswers]) => {
                console.log(`Learning ID ${learningId} under type ${type} has ${groupedAnswers.length} answers`);
            });
        });
    };

    const toggleExpand = (assessmentId) => {
        if (expandedAssessment === assessmentId) {
            setExpandedAssessment(null);
        } else {
            setExpandedAssessment(assessmentId);
            if (!answers[assessmentId]) {
                fetchAnswers(assessmentId);
            }
        }
    };

    const calculateCombinedScore = (answers) => {
        const total = answers.reduce((acc, answer) => acc + parseInt(answer.answer), 0);
        return (total / (answers.length * 5)) * 100; // Assuming the max score for each answer is 5
    };

    const calculateScoresByLearning = (answers, type) => {
        const filteredAnswers = filterAnswersByType(answers, type);
        const grouped = groupAnswersByLearningId(filteredAnswers);
        return grouped.map(([learningId, groupedAnswers]) => ({
            learningId,
            score: calculateCombinedScore(groupedAnswers)
        }));
    };

    const filterAnswersByType = (answers, type) => {
        return answers.filter(answer => answer.type === type);
    };

    const renderTabBar = props => (
        <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: 'blue' }}
            style={{ backgroundColor: 'white' }}
            labelStyle={{ color: 'black' }}
        />
    );

    const AnswerList = ({ type, answers }) => {
        const groupedAnswers = groupAnswersByLearningId(filterAnswersByType(answers, type));
        return (
            <ScrollView style={styles.scene}>
                {groupedAnswers.map(([learningId, groupedAnswers]) => (
                    <Card key={learningId} style={styles.innerCard}>
                        <Card.Content>
                            <Title>{getLearningNameById(learningId)}</Title>
                            {groupedAnswers.map(answer => (
                                <Paragraph key={answer.id}>
                                    {answer.question}: {answer.answer}
                                </Paragraph>
                            ))}
                        </Card.Content>
                    </Card>
                ))}
            </ScrollView>
        );
    };

    const renderScene = ({ route }) => {
        switch (route.key) {
            // ... (keep existing cases)
            case 'gapAnalysis':
                return (
                    <ScrollView style={styles.scene}>
                        {renderGapAnalysis()}
                    </ScrollView>
                );
            default:
                return null;
        }
    };

    useEffect(() => {
        if (expandedAssessment) {
            const availableTypes = ['self', 'peer', 'direct', 'boss'].filter(type =>
                answers[expandedAssessment]?.some(answer => answer.type === type)
            );

            const tabs = availableTypes.map(type => ({ key: type, title: capitalizeFirstLetter(type) }));
            setRoutes(tabs);
        }
    }, [expandedAssessment, answers]);

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    useEffect(() => {
        if (expandedAssessment) {
            setRoutes(prevRoutes => {
                if (!prevRoutes.some(route => route.key === 'gapAnalysis')) {
                    return [...prevRoutes, { key: 'gapAnalysis', title: 'Gap Analysis' }];
                }
                return prevRoutes;
            });
        }
    }, [expandedAssessment]);

      useEffect(() => {
        if (expandedAssessment && answers[expandedAssessment]) {
            const selfAnswers = answers[expandedAssessment].filter(answer => answer.type === 'self');
            const otherAnswers = answers[expandedAssessment].filter(answer => answer.type !== 'self');
    
            const calculatedGaps = calculateGaps(selfAnswers, otherAnswers);
            const coloredGaps = assignColorsToGaps(calculatedGaps);
            setGaps(coloredGaps);
        }
    }, [expandedAssessment, answers]);
    

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {combinedScores.length > 2 ? (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Title>Run Chart of Combined Scores</Title>
                            <ScrollView horizontal>
                                <LineChart
                                    data={{
                                        labels: combinedScores.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(score => moment(score.createdAt).format('MM-DD')),
                                        datasets: [{
                                            data: combinedScores.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(score => score.score)
                                        }]
                                    }}
                                    width={screenWidth * 2}
                                    height={220}
                                    chartConfig={{
                                        backgroundColor: '#1cc910',
                                        backgroundGradientFrom: '#eff3ff',
                                        backgroundGradientTo: '#efefef',
                                        decimalPlaces: 2,
                                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                        style: {
                                            borderRadius: 16
                                        }
                                    }}
                                    style={{
                                        marginVertical: 8,
                                        borderRadius: 16
                                    }}
                                />
                            </ScrollView>
                        </Card.Content>
                    </Card>
                ) : (
                    <Text>You need 3 assessments to see the run chart 📈📊📉</Text>
                )}
                {assessments.map(assessment => (
                    <Card key={assessment.id} style={styles.card} onPress={() => toggleExpand(assessment.id)}>
                        <Card.Title
                            title={`Combined Score: ${combinedScores.find(score => score.assessmentId === assessment.id)?.score.toFixed(2)}%`}
                            subtitle={
                                <View>
                                    <Text>{`Created At: ${moment(assessment.createdAt).local().format('YYYY-MM-DD HH:mm:ss')}`}</Text>
                                    <View style={styles.completed}>
                                        <Badge size={22} style={{ backgroundColor: assessment.self_statement_completed ? '#4D8C51' : '#9A2A25', marginRight: 10 }}>
                                            Self
                                        </Badge>
                                        <Badge size={22} style={{ backgroundColor: assessment.peer_statement_completed ? '#4D8C51' : '#9A2A25', marginRight: 10 }}>
                                            Peer
                                        </Badge>
                                        <Badge size={22} style={{ backgroundColor: assessment.direct_statement_completed ? '#4D8C51' : '#9A2A25', marginRight: 10 }}>
                                            Direct
                                        </Badge>
                                        <Badge size={22} style={{ backgroundColor: assessment.boss_statement_completed ? '#4D8C51' : '#9A2A25', marginRight: 10 }}>
                                            Boss
                                        </Badge>
                                    </View>
                                </View>
                            }
                            style={{ padding: 10 }}
                        />
                        {expandedAssessment === assessment.id && (
                            <Card.Content>
                                <View style={styles.urlContainer}>
                                    <Text style={styles.urlLabel}>Peer:</Text>
                                    <TextInput
                                        style={styles.urlInput}
                                        value={`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessment.id}/peer_statement`}
                                        editable={false}
                                    />
                                    <Button
                                        onPress={() => copyToClipboard(`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessment.id}/peer_statement`)}
                                        style={styles.copyButton}
                                        title="Copy"
                                    />
                                </View>
                                <View style={styles.urlContainer}>
                                    <Text style={styles.urlLabel}>Direct:</Text>
                                    <TextInput
                                        style={styles.urlInput}
                                        value={`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessment.id}/direct_statement`}
                                        editable={false}
                                    />
                                    <Button
                                        onPress={() => copyToClipboard(`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessment.id}/direct_statement`)}
                                        style={styles.copyButton}
                                        title="Copy"
                                    />
                                </View>
                                <View style={styles.urlContainer}>
                                    <Text style={styles.urlLabel}>Boss:</Text>
                                    <TextInput
                                        style={styles.urlInput}
                                        value={`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessment.id}/boss_statement`}
                                        editable={false}
                                    />
                                    <Button
                                        onPress={() => copyToClipboard(`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessment.id}/boss_statement`)}
                                        style={styles.copyButton}
                                        title="Copy"
                                    />
                                </View>

                                {routes.length > 0 && (
                                    <TabView
                                        navigationState={{ index, routes }}
                                        renderScene={renderScene}
                                        onIndexChange={setIndex}
                                        renderTabBar={renderTabBar}
                                    />
                                )}

                                <Title>Scores by Learning Group</Title>
                                {answers[expandedAssessment] && (
                                    <>
                                        {calculateScoresByLearning(answers[expandedAssessment], routes[index]?.key).map(score => (
                                            <Text key={score.learningId} style={styles.learningScore}>
                                                {getLearningNameById(score.learningId)}: {score.score.toFixed(2)}
                                            </Text>
                                        ))}
                                        <ScrollView horizontal>
                                            <BarChart
                                                data={{
                                                    labels: calculateScoresByLearning(answers[expandedAssessment], routes[index]?.key).map(score => {
                                                        const name = getLearningNameById(score.learningId);
                                                        return name.length > 6 ? `${name.slice(0, 6)}...` : name;
                                                    }),
                                                    datasets: [{
                                                        data: calculateScoresByLearning(answers[expandedAssessment], routes[index]?.key).map(score => score.score)
                                                    }]
                                                }}
                                                width={calculateScoresByLearning(answers[expandedAssessment], routes[index]?.key).length * 80} // Adjust the width based on the number of bars
                                                height={220}
                                                chartConfig={{
                                                    backgroundColor: '#1cc910',
                                                    backgroundGradientFrom: '#eff3ff',
                                                    backgroundGradientTo: '#efefef',
                                                    decimalPlaces: 2,
                                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                                    style: {
                                                        borderRadius: 16,
                                                    },
                                                    propsForLabels: {
                                                        fontSize: 12,
                                                        textAnchor: 'start'
                                                    },
                                                }}
                                                style={{
                                                    marginVertical: 8,
                                                    marginStart: -30,
                                                    marginEnd: 20,
                                                    borderRadius: 16
                                                }}
                                                fromZero
                                            />
                                        </ScrollView>
                                    </>
                                )}
                                <Title>Answers</Title>
                                {answers[expandedAssessment] && groupAnswersByLearningId(filterAnswersByType(answers[expandedAssessment], routes[index]?.key)).map(([learningId, groupedAnswers]) => (
                                    <Card key={learningId} style={styles.innerCard}>
                                        <Card.Content>
                                            <Title>{getLearningNameById(learningId)}</Title>
                                            {groupedAnswers.map(answer => (
                                                <Paragraph key={answer.id}>
                                                    {answer.question}: {answer.answer}
                                                </Paragraph>
                                            ))}
                                        </Card.Content>
                                    </Card>
                                ))}
                            </Card.Content>
                        )}
                    </Card>
                ))}
            </ScrollView>
            <FAB
                style={styles.fab}
                icon="plus"
                label="Take New"
                onPress={() => navigation.navigate('TakeAssessment', { userId: userId })}
            />
        </View>
    );
};

const groupAnswersByLearningId = (answers) => {
    const grouped = answers.reduce((acc, answer) => {
        if (!acc[answer.learning_id]) {
            acc[answer.learning_id] = [];
        }
        acc[answer.learning_id].push(answer);
        return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => parseInt(a) - parseInt(b));
};

const getLearningNameById = (id) => {
    const learningNames = [
        'Combined',
        'Coaching',
        'Communications',
        'Conflict Management',
        'Discipline',
        "Engaging Today's Workforce",
        'Innovation & Creativity',
        'Integrating Change',
        'Meetings',
        'Motivation',
        'Performance Management and Goal Setting',
        'Problem Solving',
        'Remote Supervising',
        'Time Management',
        'Trust'
    ];

    return learningNames[parseInt(id) - 1] || 'Unknown';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100%',
    },
    scrollView: {
        paddingBottom: 50,
    },
    card: {
        marginVertical: 10,
        marginHorizontal: 10,
    },
    innerCard: {
        marginVertical: 5,
    },
    score: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    learningScore: {
        marginVertical: 5,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    completed: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    urlContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    urlLabel: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    urlInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 5,
        marginHorizontal: 5,
    },
    copyButton: {
        paddingHorizontal: 10,
    },
    scene: {
        flex: 1,
    },
    gapCard: {
        marginVertical: 5,
        borderWidth: 2,
      },
      gapExplanation: {
        marginBottom: 10,
        fontSize: 14,
      },
      legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
      },
      legendItem: {
        padding: 5,
        borderRadius: 5,
      },
});

export default AssessmentHistory;
