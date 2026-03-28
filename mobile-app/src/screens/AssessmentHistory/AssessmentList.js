import React from 'react';
import { View, ScrollView, StyleSheet, Text, SafeAreaView } from 'react-native';
import { Card, Title, Badge, FAB } from 'react-native-paper';
import moment from 'moment';

const AssessmentList = ({ assessments, combinedScores, expandedAssessment, toggleExpand, navigation, userId }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {assessments.map(assessment => (
          <Card key={assessment.id} style={styles.card} onPress={() => toggleExpand(assessment.id)}>
            <Card.Title
              title={`Combined Score: ${combinedScores.find(score => score.assessmentId === assessment.id)?.score?.toFixed(2) ?? '0'}`}
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
          </Card>
        ))}
      </ScrollView>
      <FAB
        style={styles.fab}
        icon="plus"
        label="Take New"
        onPress={() => navigation.navigate('TakeAssessment', { userId: userId })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  card: {
    marginVertical: 10,
    marginHorizontal: 10,
  },
  completed: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default AssessmentList;