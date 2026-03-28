import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TextInput, Button } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { BarChart } from 'react-native-chart-kit';
import Clipboard from '@react-native-community/clipboard';
import { generateClient } from "aws-amplify/api";
import { listAnswers } from '../../graphql/queries';
import { Dimensions } from 'react-native';

const client = generateClient();

const AssessmentDetails = ({ route, navigation }) => {
  const { assessment, combinedScore } = route.params;
  const [answers, setAnswers] = useState([]);
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([]);
  const [individualScores, setIndividualScores] = useState({});

  useEffect(() => {
    fetchAnswers();
  }, []);
  
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

const fetchAnswers = async () => {
  try {
    let allAnswers = [];
    let nextToken = null;

    do {
      const result = await client.graphql({
        query: listAnswers,
        variables: {
          filter: {
            assessmentID: { eq: assessment.id }
          },
          limit: 1000,
          nextToken: nextToken
        }
      });
      allAnswers = [...allAnswers, ...result.data.listAnswers.items];
      nextToken = result.data.listAnswers.nextToken;
    } while (nextToken);

    console.log(`Fetched ${allAnswers.length} answers`);
    setAnswers(allAnswers);

    const groupedAnswers = {
      self: allAnswers.filter(a => a.type === 'self'),
      peer: groupAnswersByAssessor(allAnswers.filter(a => a.type === 'peer')),
      direct: groupAnswersByAssessor(allAnswers.filter(a => a.type === 'direct')),
      boss: allAnswers.filter(a => a.type === 'boss')
    };

    const peerCount = Object.keys(groupedAnswers.peer).length;
    const directCount = Object.keys(groupedAnswers.direct).length;

    setRoutes([
      { key: 'self', title: 'Self' },
      { key: 'peer', title: `Peer (${peerCount})` },
      { key: 'direct', title: `Direct (${directCount})` },
      { key: 'boss', title: 'Boss' },
      { key: 'gapAnalysis', title: 'Gap Analysis' }
    ]);

    setIndividualScores(groupedAnswers);

  } catch (error) {
    console.error('Error fetching answers:', error);
  }
};

const groupAnswersByAssessor = (answers) => {
  if (!answers || answers.length === 0) return {};
  return answers.reduce((acc, answer) => {
    if (!acc[answer.assessorEmail]) {
      acc[answer.assessorEmail] = [];
    }
    acc[answer.assessorEmail].push(answer);
    return acc;
  }, {});
};

const calculateCombinedScore = (answers) => {
  if (!answers || answers.length === 0) return 0;
  const validAnswers = answers.filter(answer => !isNaN(parseInt(answer.answer)));
  if (validAnswers.length === 0) return 0;
  const total = validAnswers.reduce((acc, answer) => acc + parseInt(answer.answer), 0);
  return total / validAnswers.length;
};

const calculateGaps = () => {
  const selfScores = calculateScoresByLearning(answers.filter(a => a.type === 'self'), 'self');
  const otherTypes = ['peer', 'direct', 'boss'];
  
  let gaps = [];

  otherTypes.forEach(type => {
    const typeScores = calculateScoresByLearning(answers.filter(a => a.type === type), type);
    
    typeScores.forEach(typeScore => {
      const selfScore = selfScores.find(s => s.learningId === typeScore.learningId);
      if (selfScore) {
        const gap = typeScore.score - selfScore.score;
        gaps.push({
          learningId: typeScore.learningId,
          type,
          gap,
          selfScore: selfScore.score,
          otherScore: typeScore.score
        });
      }
    });
  });

  return gaps.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
};

const getGapColor = (gap) => {
  const absGap = Math.abs(gap);
  if (absGap >= 1) return '#B71C1C'; // Darker Red
  if (absGap >= 0.5) return '#F57F17'; // Darker Yellow
  return '#1B5E20'; // Darker Green
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

const filterAnswersByType = (answers, type) => {
  return answers.filter(answer => answer.type === type);
};

const calculateScoresByLearning = (answers, type) => {
  const filteredAnswers = filterAnswersByType(answers, type);
  const grouped = groupAnswersByLearningId(filteredAnswers);
  return grouped.map(([learningId, groupedAnswers]) => ({
      learningId,
      score: calculateCombinedScore(groupedAnswers)
  }));
};

const renderTabBar = props => (
  <TabBar
    {...props}
    indicatorStyle={{ backgroundColor: 'blue' }}
    style={{ backgroundColor: 'white' }}
    labelStyle={{ color: 'black' }}
  />
);

const renderScene = ({ route }) => {
  switch (route.key) {
    case 'gapAnalysis':
      return (
        <ScrollView>
          {renderGapAnalysis()}
        </ScrollView>
      );
    case 'peer':
    case 'direct':
      return renderMultipleAssessments(route.key);
    default:
      return (
        <ScrollView style={styles.scene}>
          <AnswerList type={route.key} answers={individualScores[route.key] || []} />
        </ScrollView>
      );
  }
};

const renderMultipleAssessments = (type) => {
  const assessments = individualScores[type] || {};
  
  if (Object.keys(assessments).length < 2) {
    return (
      <ScrollView style={styles.scene}>
        <Card style={styles.messageCard}>
          <Card.Content>
            <Paragraph style={styles.messageText}>
              You need at least 2 {type} assessments to view this data.
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  return (
    <TabView
      navigationState={{
        index: 0,
        routes: Object.keys(assessments).map((email, index) => ({ key: index.toString(), title: `${capitalizeFirstLetter(type)} ${index + 1}` }))
      }}
      renderScene={({ route }) => (
        <ScrollView style={styles.scene}>
          <AnswerList type={type} answers={assessments[Object.keys(assessments)[parseInt(route.key)]] || []} />
        </ScrollView>
      )}
      onIndexChange={() => {}}
      renderTabBar={renderTabBar}
    />
  );
};

const AnswerList = ({ type, answers }) => {
  const groupedAnswers = groupAnswersByLearningId(answers);
  const scoresByLearning = calculateScoresByLearning(answers, type);
  const overallScore = calculateCombinedScore(answers);
  
  return (
    <>
      <Title>{capitalizeFirstLetter(type)} Assessment</Title>
      <Paragraph>Overall Score: {overallScore ? overallScore.toFixed(2) : 'N/A'}</Paragraph>
      <Paragraph style={styles.note}>This overall score is calculated across all learning areas for the {type} assessment.</Paragraph>
      
      <Title>Detailed Scores by Learning Group</Title>
      <Paragraph style={styles.note}>These scores are calculated per learning group and may differ from the overall score. They provide insight into specific areas of strength or improvement.</Paragraph>
      {scoresByLearning.map(score => (
        <Text key={score.learningId} style={styles.learningScore}>
          {getLearningNameById(score.learningId)}: {score.score ? score.score.toFixed(2) : 'N/A'}
        </Text>
      ))}
      
      {scoresByLearning.length > 0 && (
        <ScrollView horizontal>
          <BarChart
            data={{
              labels: scoresByLearning.map(score => {
                const name = getLearningNameById(score.learningId);
                return name.length > 6 ? `${name.slice(0, 6)}...` : name;
              }),
              datasets: [{
                data: scoresByLearning.map(score => score.score || 0)
              }]
            }}
            width={scoresByLearning.length * 80}
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
      )}
      {scoresByLearning.length > 0 && (
        <Paragraph style={styles.note}>The chart above visualizes scores across different learning areas for easy comparison.</Paragraph>
      )}
      
      <Title>Detailed Answers</Title>
      <Paragraph style={styles.note}>Below are the individual answers grouped by learning area. Each answer is scored on a scale of 1-5.</Paragraph>
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
    </>
  );
};

const renderGapAnalysis = () => {
  const selfAnswers = answers.filter(a => a.type === 'self');
  const otherAnswers = answers.filter(a => a.type !== 'self');
  
  if (selfAnswers.length === 0 || otherAnswers.length === 0) {
    return (
      <ScrollView style={styles.scene}>
        <Title>Gap Analysis</Title>
        <Card style={styles.messageCard}>
          <Card.Content>
            <Paragraph style={styles.messageText}>
              Insufficient data to perform gap analysis. You need at least:
            </Paragraph>
            <View style={styles.bulletList}>
              <Text style={styles.bullet}>• Self-assessment data</Text>
              <Text style={styles.bullet}>• One other assessment type (peer, direct, or boss)</Text>
            </View>
            <Paragraph style={styles.messageText}>
              Please complete the missing assessments to view the gap analysis.
            </Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  const gaps = calculateGaps();
  
  return (
    <ScrollView style={styles.scene}>
      <Title>Gap Analysis</Title>
      <Paragraph style={styles.note}>
        This analysis shows the difference between self-assessment scores and scores from other assessor types.
        Gaps are color-coded: Red (≥1), Yellow (0.5-0.99), Green (&lt;0.5).
      </Paragraph>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.learningAreaCell]}>Learning Area</Text>
        <Text style={styles.headerCell}>Type</Text>
        <Text style={[styles.headerCell, styles.numericCell]}>Gap</Text>
        <Text style={[styles.headerCell, styles.numericCell]}>Self</Text>
        <Text style={[styles.headerCell, styles.numericCell]}>Other</Text>
      </View>
      {gaps.map((gap, index) => (
        <View key={index} style={[styles.tableRow, { backgroundColor: getGapColor(gap.gap) }]}>
          <Text style={[styles.cell, styles.learningAreaCell]}>{getLearningNameById(gap.learningId)}</Text>
          <Text style={styles.cell}>{capitalizeFirstLetter(gap.type)}</Text>
          <Text style={[styles.cell, styles.numericCell]}>{gap.gap.toFixed(2)}</Text>
          <Text style={[styles.cell, styles.numericCell]}>{gap.selfScore.toFixed(2)}</Text>
          <Text style={[styles.cell, styles.numericCell]}>{gap.otherScore.toFixed(2)}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const copyToClipboard = (text) => {
  Clipboard.setString(text);
  alert('Copied to clipboard');
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

return (
  <ScrollView style={styles.container}>
    <Card style={styles.card}>
      <Card.Content>
        <Title>Assessment Details</Title>
        <Paragraph>Created At: {new Date(assessment.createdAt).toLocaleString()}</Paragraph>
        <Paragraph>Combined Score: {combinedScore.toFixed(2)}</Paragraph>
        <Paragraph style={styles.note}>Note: The Combined Score is an average of all assessment types.</Paragraph>
        {Object.entries(individualScores).map(([type, score]) => (
          <Paragraph key={type}>
            {capitalizeFirstLetter(type)} Score: {
              Array.isArray(score) 
                ? score.map((s, index) => `${index + 1}: ${s ? s.toFixed(2) : 'N/A'}`).join(', ')
                : score ? score.toFixed(2) : 'N/A'
            }
          </Paragraph>
        ))}
        <Paragraph style={styles.note}>Note: Individual scores represent the overall score for each assessment type across all learning areas.</Paragraph>
      </Card.Content>
    </Card>

    <Card style={styles.card}>
      <Card.Content>
        <Title>Assessment Links</Title>
        <Paragraph style={styles.note}>These links can be shared with peers, direct reports, and bosses to gather their assessments.</Paragraph>
        {['peer', 'direct', 'boss'].map(type => (
          <View key={type} style={styles.urlContainer}>
            <Text style={styles.urlLabel}>{capitalizeFirstLetter(type)}:</Text>
            <TextInput
              style={styles.urlInput}
              value={`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessment.id}/${type}_statement`}
              editable={false}
            />
            <Button
              onPress={() => copyToClipboard(`https://main.d3mg3gkyw8g143.amplifyapp.com/${assessment.id}/${type}_statement`)}
              title="Copy"
            />
          </View>
        ))}
      </Card.Content>
    </Card>

    {routes.length > 0 && (
      <>
        <Paragraph style={styles.note}>The tabs below provide detailed breakdowns for each assessment type and a gap analysis.</Paragraph>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={renderTabBar}
          style={styles.tabView}
        />
      </>
    )}
  </ScrollView>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 10,
  },
  scene: {
    flex: 1,
    padding: 16,
  },
  innerCard: {
    marginVertical: 5,
  },
  learningScore: {
    marginVertical: 5,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  urlLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 60,
  },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 5,
    marginHorizontal: 5,
  },
  tabView: {
    height: 500, // Adjust this value as needed
  },
  note: {
    fontStyle: 'italic',
    fontSize: 12,
    marginBottom: 10,
    color: '#666',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5,
  },
  headerCell: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left',
  },
  cell: {
    flex: 1,
    textAlign: 'left',
  },
  numericCell: {
    textAlign: 'right',
  },
  learningAreaCell: {
    flex: 2,
  },
  messageCard: {
    marginTop: 20,
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 10,
  },
  bulletList: {
    marginLeft: 20,
    marginBottom: 10,
  },
  bullet: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default AssessmentDetails;