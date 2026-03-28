import React from 'react';
import { View, ScrollView, Text, StyleSheet, Dimensions } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';

const screenWidth = Dimensions.get('window').width;

const MainRunChart = ({ combinedScores }) => {
  if (combinedScores.length < 3) {
    return <Text>You need 3 assessments to see the run chart 📈📊📉</Text>;
  }

  const sortedScores = combinedScores.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.title}>Run Chart of Combined Scores</Title>
        <Paragraph style={styles.paragraph}>
          This chart shows your progress over time across all assessments.
        </Paragraph>
        <ScrollView horizontal>
          <LineChart
            data={{
              labels: sortedScores.map(score => moment(score.createdAt).format('MMM DD')),
              datasets: [{
                data: sortedScores.map(score => score.score),
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White color for the line
                strokeWidth: 2
              }]
            }}
            width={Math.max(screenWidth - 40, sortedScores.length * 50)}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: '#1e2430',
              backgroundGradientFrom: '#1e2430',
              backgroundGradientTo: '#2c3e50',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#ffa726'
              },
              propsForLabels: {
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
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    marginHorizontal: 10,
    backgroundColor: '#1e2430',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    color: 'white',
  },
  paragraph: {
    color: 'white',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default MainRunChart;