import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, Menu, ProgressBar, Text, Chip, IconButton } from 'react-native-paper';
import { generateClient } from "aws-amplify/api";
import { listAssessments, listAnswers } from '../graphql/queries';
import { UserContext } from '../UserContext';
import { BarChart, LineChart } from 'react-native-chart-kit';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const client = generateClient();

const HomePage = ({ navigation }) => {
  const userId = useContext(UserContext);
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [filters, setFilters] = useState({
    assessmentType: 'All',
    learningModule: 'All',
    dateRange: { start: '', end: '' }
  });
  const [assessmentTypeMenuVisible, setAssessmentTypeMenuVisible] = useState(false);
  const [learningModuleMenuVisible, setLearningModuleMenuVisible] = useState(false);
  const [learningModules, setLearningModules] = useState([]);
  const [combinedScores, setCombinedScores] = useState([]);
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    filters: true,
    recentAssessments: true,
    overallScore: true,
    completionRate: true,
    scoresByModule: true,
    trendAnalysis: true,
    improvementSuggestions: true,
  });
  const [showAllAssessments, setShowAllAssessments] = useState(false);

  const showStartDatePicker = () => {
    setStartDatePickerVisibility(true);
  };

  const hideStartDatePicker = () => {
    setStartDatePickerVisibility(false);
  };

  const showEndDatePicker = () => {
    setEndDatePickerVisibility(true);
  };

  const hideEndDatePicker = () => {
    setEndDatePickerVisibility(false);
  };

  const handleStartDateConfirm = (date) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, start: date.toISOString().split('T')[0] }
    }));
    hideStartDatePicker();
  };

  const handleEndDateConfirm = (date) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, end: date.toISOString().split('T')[0] }
    }));
    hideEndDatePicker();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, assessments, answers]);

  const fetchData = async () => {
    setLoadingStates({
      filters: true,
      recentAssessments: true,
      overallScore: true,
      completionRate: true,
      scoresByModule: true,
      trendAnalysis: true,
      improvementSuggestions: true,
    });

    try {
      const assessmentsResult = await client.graphql({
        query: listAssessments,
        variables: { filter: { user_id: { eq: userId } } }
      });
      const fetchedAssessments = assessmentsResult.data.listAssessments.items;

      setAssessments(fetchedAssessments);
      setFilteredAssessments(fetchedAssessments);
      setLoadingStates(prev => ({ ...prev, filters: false, recentAssessments: false }));

      let allAnswers = [];
      let scores = [];
      for (const assessment of fetchedAssessments) {
        const answersResult = await client.graphql({
          query: listAnswers,
          variables: { filter: { assessmentID: { eq: assessment.id } } }
        });
        const assessmentAnswers = answersResult.data.listAnswers.items;
        allAnswers = [...allAnswers, ...assessmentAnswers];
        
        const score = calculateCombinedScore(assessmentAnswers);
        scores.push({ assessmentId: assessment.id, score });
      }

      setAnswers(allAnswers);
      setCombinedScores(scores);
      setLoadingStates(prev => ({ ...prev, overallScore: false, completionRate: false }));

      const modules = [...new Set(allAnswers.map(answer => getLearningNameById(answer.learning_id)))];
      setLearningModules(['All', ...modules]);
      setLoadingStates(prev => ({ ...prev, scoresByModule: false, trendAnalysis: false, improvementSuggestions: false }));

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getLearningNameById = (id) => {
    const learningNames = [
      'Combined', 'Coaching', 'Communications', 'Conflict Management', 'Discipline',
      "Engaging Today's Workforce", 'Innovation & Creativity', 'Integrating Change',
      'Meetings', 'Motivation', 'Performance Management and Goal Setting',
      'Problem Solving', 'Remote Supervising', 'Time Management', 'Trust'
    ];
    return learningNames[parseInt(id) - 1] || 'Unknown';
  };

  const applyFilters = () => {
    let filtered = assessments;

    if (filters.assessmentType !== 'All') {
      filtered = filtered.filter(assessment => 
        assessment[`${filters.assessmentType.toLowerCase()}_statement_completed`]
      );
    }

    if (filters.learningModule !== 'All') {
      const relevantAnswers = answers.filter(answer => 
        getLearningNameById(answer.learning_id) === filters.learningModule
      );
      const relevantAssessmentIds = new Set(relevantAnswers.map(a => a.assessmentID));
      filtered = filtered.filter(assessment => relevantAssessmentIds.has(assessment.id));
    }

    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Set to end of day

      filtered = filtered.filter(assessment => {
        const assessmentDate = new Date(assessment.createdAt);
        return assessmentDate >= startDate && assessmentDate <= endDate;
      });
    }

    setFilteredAssessments(filtered);
  };

  const calculateCombinedScore = (answers) => {
    if (answers.length === 0) return 0;
    const total = answers.reduce((acc, answer) => acc + parseInt(answer.answer), 0);
    return total / answers.length;
  };

  const calculateOverallScore = (assessmentIds) => {
    const relevantAnswers = answers.filter(answer => assessmentIds.includes(answer.assessmentID));
    return calculateCombinedScore(relevantAnswers);
  };

  const calculateCompletionRate = () => {
    const totalPossible = filteredAssessments.length * 4; // 4 types per assessment
    const completed = filteredAssessments.reduce((acc, assessment) => 
      acc + ['self', 'peer', 'direct', 'boss'].filter(type => 
        assessment[`${type}_statement_completed`]
      ).length, 0
    );
    return totalPossible > 0 ? (completed / totalPossible) * 100 : 0;
  };

  const calculateScoresByModule = () => {
    const moduleScores = {};
    learningModules.forEach(module => {
      if (module !== 'All') {
        const moduleAnswers = answers.filter(answer => 
          getLearningNameById(answer.learning_id) === module &&
          filteredAssessments.some(assessment => assessment.id === answer.assessmentID)
        );
        if (moduleAnswers.length > 0) {
          moduleScores[module] = calculateCombinedScore(moduleAnswers);
        }
      }
    });
    return moduleScores;
  };

  const navigateToDetails = (assessment) => {
    const combinedScore = combinedScores.find(score => score.assessmentId === assessment.id)?.score || 0;
    navigation.navigate('AssessmentDetails', { assessment, combinedScore });
  };

  const renderSectionWithLoader = (sectionName, renderFunction) => {
    if (loadingStates[sectionName]) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <ActivityIndicator size="large" color="#808080" />
          </Card.Content>
        </Card>
      );
    }
    return renderFunction();
  };

  const renderFilters = () => (
    <Card style={styles.filterCard}>
      <Card.Content>
        <View style={styles.filterHeader}>
          <Title style={styles.filterTitle}>Filters</Title>
          <IconButton
            icon="filter-remove"
            size={24}
            onPress={() => setFilters({
              assessmentType: 'All',
              learningModule: 'All',
              dateRange: { start: '', end: '' }
            })}
          />
        </View>
        <View style={styles.filterChips}>
          <Menu
            visible={assessmentTypeMenuVisible}
            onDismiss={() => setAssessmentTypeMenuVisible(false)}
            anchor={
              <Chip
                icon="clipboard-list"
                onPress={() => setAssessmentTypeMenuVisible(true)}
                style={styles.filterChip}
              >
                {filters.assessmentType}
              </Chip>
            }
          >
            {['All', 'Self', 'Peer', 'Direct', 'Boss'].map((type) => (
              <Menu.Item
                key={type}
                onPress={() => {
                  setFilters(prev => ({ ...prev, assessmentType: type }));
                  setAssessmentTypeMenuVisible(false);
                }}
                title={type}
              />
            ))}
          </Menu>

          <Menu
            visible={learningModuleMenuVisible}
            onDismiss={() => setLearningModuleMenuVisible(false)}
            anchor={
              <Chip
                icon="book-open-variant"
                onPress={() => setLearningModuleMenuVisible(true)}
                style={styles.filterChip}
              >
                {filters.learningModule}
              </Chip>
            }
          >
            {learningModules.map((module) => (
              <Menu.Item
                key={module}
                onPress={() => {
                  setFilters(prev => ({ ...prev, learningModule: module }));
                  setLearningModuleMenuVisible(false);
                }}
                title={module}
              />
            ))}
          </Menu>
        </View>
        <View style={styles.dateFilter}>
          <Chip
            icon="calendar-start"
            onPress={showStartDatePicker}
            style={styles.dateChip}
          >
            {filters.dateRange.start || "Start Date"}
          </Chip>
          <Icon name="arrow-right" size={24} color="#666" style={styles.dateArrow} />
          <Chip
            icon="calendar-end"
            onPress={showEndDatePicker}
            style={styles.dateChip}
          >
            {filters.dateRange.end || "End Date"}
          </Chip>
        </View>
        <DateTimePickerModal
          isVisible={isStartDatePickerVisible}
          mode="date"
          onConfirm={handleStartDateConfirm}
          onCancel={hideStartDatePicker}
        />
        <DateTimePickerModal
          isVisible={isEndDatePickerVisible}
          mode="date"
          onConfirm={handleEndDateConfirm}
          onCancel={hideEndDatePicker}
        />
      </Card.Content>
    </Card>
  );

  const getGapColor = (gap) => {
    const absGap = Math.abs(gap);
    if (absGap >= 1) return '#B71C1C'; // Darker Red
    if (absGap >= 0.5) return '#F57F17'; // Darker Yellow
    return '#1B5E20'; // Darker Green
  };

 // Updated helper functions for correct gap calculation
const calculateTypeScore = (assessmentId, type) => {
  const relevantAnswers = answers.filter(answer => 
    answer.assessmentID === assessmentId && answer.type === type
  );
  return calculateCombinedScore(relevantAnswers);
};

const calculateLearningScores = (assessmentId) => {
  const scores = {};
  learningModules.forEach(module => {
    if (module !== 'All') {
      const moduleAnswers = answers.filter(answer => 
        answer.assessmentID === assessmentId && 
        getLearningNameById(answer.learning_id) === module
      );
      scores[module] = calculateCombinedScore(moduleAnswers);
    }
  });
  return scores;
};

const renderRecentAssessments = () => {
  const assessmentsToShow = showAllAssessments ? filteredAssessments : filteredAssessments.slice(0, 5);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Recent Assessments</Title>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: '#0D47A1' }]} />
            <Text style={styles.legendText}>Combined Score</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.colorBox, { backgroundColor: '#4A148C' }]} />
            <Text style={styles.legendText}>Individual Scores</Text>
          </View>
          <View style={styles.legendRow}>
          <Text style={styles.legendText}>Gap:</Text>
          <View style={styles.gapLegendContainer}>
            <View style={styles.gapLegendItem}>
              <View style={[styles.colorBox, { backgroundColor: '#B71C1C' }]} />
              <Text style={styles.legendText}>&ge;1</Text>
            </View>
            <View style={styles.gapLegendItem}>
              <View style={[styles.colorBox, { backgroundColor: '#F57F17' }]} />
              <Text style={styles.legendText}>0.5-0.99</Text>
            </View>
            <View style={styles.gapLegendItem}>
              <View style={[styles.colorBox, { backgroundColor: '#1B5E20' }]} />
              <Text style={styles.legendText}>&lt;0.5</Text>
            </View>
          </View>
        </View>
        </View>
        <Paragraph>
          Tap on an assessment to view detailed insights.
        </Paragraph>
        {assessmentsToShow.map(assessment => {
          const date = new Date(assessment.createdAt);
          const combinedScore = combinedScores.find(score => score.assessmentId === assessment.id)?.score || 0;
          const selfScore = calculateTypeScore(assessment.id, 'self');
          const peerScore = calculateTypeScore(assessment.id, 'peer');
          const directScore = calculateTypeScore(assessment.id, 'direct');
          const bossScore = calculateTypeScore(assessment.id, 'boss');
          const learningScores = calculateLearningScores(assessment.id);
          const gap = calculateGap(assessment.id);

          return (
            <TouchableOpacity 
              key={assessment.id} 
              onPress={() => navigateToDetails(assessment)}
              style={styles.assessmentItem}
            >
              <View style={styles.assessmentRow}>
                <Text style={styles.assessmentDate}>
                  {`${date.getDate()}${date.toLocaleString('default', { month: 'short' })}`}
                </Text>
                <Text style={[styles.assessmentScore, { color: '#0D47A1' }]}>{combinedScore.toFixed(2)}</Text>
                {filters.assessmentType === 'All' && (
                  <>
                    {selfScore > 0 && <Text style={[styles.scoreLabel, { color: '#4A148C' }]}>S:{selfScore.toFixed(0)}</Text>}
                    {peerScore > 0 && <Text style={[styles.scoreLabel, { color: '#4A148C' }]}>P:{peerScore.toFixed(0)}</Text>}
                    {directScore > 0 && <Text style={[styles.scoreLabel, { color: '#4A148C' }]}>D:{directScore.toFixed(0)}</Text>}
                    {bossScore > 0 && <Text style={[styles.scoreLabel, { color: '#4A148C' }]}>B:{bossScore.toFixed(0)}</Text>}
                  </>
                )}
                {filters.learningModule !== 'All' && (
                  <Text style={[styles.scoreLabel, { color: '#4A148C' }]}>
                    {filters.learningModule.substring(0, 3)}:
                    {learningScores[filters.learningModule]?.toFixed(0) || 'N/A'}
                  </Text>
                )}
                <Text style={[styles.gapText, { color: getGapColor(gap) }]}>
                  Gap: {gap.toFixed(1)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <Button 
          onPress={() => setShowAllAssessments(!showAllAssessments)}
          mode="outlined"
          style={styles.showMoreButton}
        >
          {showAllAssessments ? 'Show Less' : 'Show More'}
        </Button>
      </Card.Content>
    </Card>
  );
};

const calculateGap = (assessmentId) => {
  const selfScore = calculateTypeScore(assessmentId, 'self');
  const otherScores = [
    calculateTypeScore(assessmentId, 'peer'),
    calculateTypeScore(assessmentId, 'direct'),
    calculateTypeScore(assessmentId, 'boss')
  ].filter(score => score > 0);
  
  if (otherScores.length === 0 || selfScore === 0) return 0;
  const averageOtherScore = otherScores.reduce((a, b) => a + b) / otherScores.length;
  return selfScore - averageOtherScore;
};


  const renderOverallScore = () => {
    const overallScore = calculateOverallScore(filteredAssessments.map(a => a.id));
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Overall Score</Title>
          <Paragraph>
            This score represents the average of all assessments based on your current filters.
          </Paragraph>
          <Text style={styles.score}>{overallScore.toFixed(2)}</Text>
          <ProgressBar progress={overallScore / 5} color="#6200ee" style={styles.progressBar} />
        </Card.Content>
      </Card>
    );
  };

  const renderCompletionRate = () => {
    const completionRate = calculateCompletionRate();
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Assessment Completion Rate</Title>
          <Paragraph>
            This shows the percentage of completed assessments out of all possible assessments
            for the current filter selection.
          </Paragraph>
          <Text style={styles.score}>{completionRate.toFixed(2)}</Text>
          <ProgressBar progress={completionRate / 100} color="#03dac6" style={styles.progressBar} />
        </Card.Content>
      </Card>
    );
  };

  const renderScoresByModule = () => {
    const moduleScores = calculateScoresByModule();
    const data = Object.entries(moduleScores).map(([name, score]) => ({ name, score }));
  
    // Calculate dynamic width based on number of data points
    const chartWidth = Math.max(350, data.length * 60);
  
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Scores by Learning Module</Title>
          <Paragraph>
            This chart breaks down your performance across different learning modules.
          </Paragraph>
          {data.length > 0 ? (
            <ScrollView horizontal>
              <BarChart
                data={{
                  labels: data.map(item => item.name.substring(0, 3)),
                  datasets: [{ data: data.map(item => Math.round(item.score)) }]
                }}
                width={chartWidth}
                height={220}
                yAxisLabel=""
                chartConfig={{
                  backgroundColor: '#1e2430',
                  backgroundGradientFrom: '#1e2430',
                  backgroundGradientTo: '#2c3e50',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  barPercentage: 0.5,
                  propsForLabels: {
                    fontSize: 10,
                    fontWeight: 'bold'
                  },
                  propsForVerticalLabels: {
                    fontSize: 10,
                    fontWeight: 'bold'
                  }
                }}
                style={styles.chart}
                showValuesOnTopOfBars={true}
                fromZero={true}
              />
            </ScrollView>
          ) : (
            <Paragraph>No data available for the selected filters</Paragraph>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderTrendAnalysis = () => {
    console.log("Filtered Assessments:", filteredAssessments);
  
    const trendData = filteredAssessments
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(assessment => {
        const date = new Date(assessment.createdAt);
        const score = calculateOverallScore([assessment.id]);
        console.log(`Assessment ${assessment.id}: Date=${date}, Score=${score}`);
        return { date, score };
      })
      .filter(item => !isNaN(item.score) && item.date instanceof Date && !isNaN(item.date));
  
    console.log("Trend Data:", trendData);
  
    // Function to format dates more concisely
    const formatDate = (date) => {
      if (!(date instanceof Date) || isNaN(date)) {
        console.error("Invalid date:", date);
        return "";
      }
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };
  
    // Calculate dynamic width based on number of data points
    const chartWidth = Math.max(350, trendData.length * 50);
  
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Performance Trend Analysis</Title>
          <Paragraph>
            This chart shows how your overall performance has changed over time.
          </Paragraph>
          {trendData.length > 1 ? (
            <ScrollView horizontal>
              <LineChart
                data={{
                  labels: trendData.map(item => formatDate(item.date)),
                  datasets: [{ data: trendData.map(item => item.score) }]
                }}
                width={chartWidth}
                height={220}
                yAxisLabel=""
                chartConfig={{
                  backgroundColor: '#1e2430',
                  backgroundGradientFrom: '#1e2430',
                  backgroundGradientTo: '#2c3e50',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#ffa726"
                  },
                  propsForLabels: {
                    rotation: -45,
                    fontSize: 10,
                    fontWeight: 'bold'
                  },
                  propsForVerticalLabels: {
                    fontSize: 10,
                    fontWeight: 'bold'
                  }
                }}
                bezier
                style={styles.chart}
              />
            </ScrollView>
          ) : (
            <Paragraph>Not enough data to show a trend. Complete more assessments to see your progress over time.</Paragraph>
          )}
        </Card.Content>
      </Card>
    );
  };

  const generateImprovementSuggestions = () => {
    const moduleScores = calculateScoresByModule();
    const overallScore = calculateOverallScore(filteredAssessments.map(a => a.id));

    let suggestions = [];

    // Identify the lowest scoring modules
    const sortedModules = Object.entries(moduleScores).sort((a, b) => a[1] - b[1]);
    const lowestScoringModules = sortedModules.slice(0, 3);

    lowestScoringModules.forEach(([module, score]) => {
      suggestions.push(`Focus on improving your ${module} skills. Your current score is ${score.toFixed(2)}.`);
    });

    // Check overall performance
    if (overallScore < 3) {
      suggestions.push("Your overall performance is below average. Consider reviewing all learning modules and practicing more frequently.");
    } else if (overallScore < 4) {
      suggestions.push("Your overall performance is good, but there's room for improvement. Focus on your weaker areas to boost your overall score.");
    }

    // Check assessment completion rate
    const completionRate = calculateCompletionRate();
    if (completionRate < 80) {
      suggestions.push("Try to complete more assessments to get a more comprehensive view of your skills.");
    }

    return suggestions;
  };

  const renderImprovementSuggestions = () => {
    const suggestions = generateImprovementSuggestions();

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Areas for Improvement</Title>
          <Paragraph>
            Based on your assessment results, here are some suggestions for improvement:
          </Paragraph>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  if (assessments.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No assessment data available.</Text>
        <Text style={styles.noDataSubText}>Please take an assessment to generate your dashboard.</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('AssessmentList')} 
          style={styles.takeAssessmentButton}
        >
          Take an Assessment
        </Button>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Paragraph style={styles.refreshNote}>
        Pull down to refresh this page
      </Paragraph>
      
      {renderSectionWithLoader('filters', renderFilters)}
      {renderSectionWithLoader('recentAssessments', renderRecentAssessments)}
      {renderSectionWithLoader('overallScore', renderOverallScore)}
      {renderSectionWithLoader('completionRate', renderCompletionRate)}
      {renderSectionWithLoader('scoresByModule', renderScoresByModule)}
      {renderSectionWithLoader('trendAnalysis', renderTrendAnalysis)}
      {renderSectionWithLoader('improvementSuggestions', renderImprovementSuggestions)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  filterCard: {
    marginBottom: 20,
    elevation: 4,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterChip: {
    marginRight: 10,
    marginBottom: 10,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChip: {
    flex: 1,
  },
  dateArrow: {
    marginHorizontal: 10,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  assessmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bulletPoint: {
    marginRight: 5,
    fontSize: 16,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  noDataSubText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  takeAssessmentButton: {
    marginTop: 20,
  },
  refreshNote: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  assessmentItem: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  assessmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  assessmentDate: {
    fontWeight: 'bold',
    minWidth: 40,
  },
  assessmentScore: {
    fontWeight: 'bold',
    color: '#6200ee',
    minWidth: 40,
  },
  scoreLabel: {
    fontSize: 12,
    minWidth: 40,
  },
  gapText: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 60,
  },
  legendContainer: {
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  assessmentItem: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  assessmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  assessmentDate: {
    fontWeight: 'bold',
    minWidth: 40,
  },
  assessmentScore: {
    fontWeight: 'bold',
    minWidth: 40,
  },
  scoreLabel: {
    fontSize: 12,
    minWidth: 40,
  },
  gapText: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 60,
  },
  showMoreButton: {
    marginTop: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  gapLegendContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: 5,
  },
  gapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorBox: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
  },
});

export default HomePage;