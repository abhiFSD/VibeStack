/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateAnswers = /* GraphQL */ `
  subscription OnCreateAnswers($filter: ModelSubscriptionAnswersFilterInput) {
    onCreateAnswers(filter: $filter) {
      id
      learning_id
      answer
      type
      question
      assessmentID
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateAnswers = /* GraphQL */ `
  subscription OnUpdateAnswers($filter: ModelSubscriptionAnswersFilterInput) {
    onUpdateAnswers(filter: $filter) {
      id
      learning_id
      answer
      type
      question
      assessmentID
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteAnswers = /* GraphQL */ `
  subscription OnDeleteAnswers($filter: ModelSubscriptionAnswersFilterInput) {
    onDeleteAnswers(filter: $filter) {
      id
      learning_id
      answer
      type
      question
      assessmentID
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateAssessment = /* GraphQL */ `
  subscription OnCreateAssessment(
    $filter: ModelSubscriptionAssessmentFilterInput
  ) {
    onCreateAssessment(filter: $filter) {
      id
      self_statement_completed
      peer_statement_completed
      direct_statement_completed
      boss_statement_completed
      user_id
      Answers {
        nextToken
        __typename
      }
      ques_per_module
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateAssessment = /* GraphQL */ `
  subscription OnUpdateAssessment(
    $filter: ModelSubscriptionAssessmentFilterInput
  ) {
    onUpdateAssessment(filter: $filter) {
      id
      self_statement_completed
      peer_statement_completed
      direct_statement_completed
      boss_statement_completed
      user_id
      Answers {
        nextToken
        __typename
      }
      ques_per_module
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteAssessment = /* GraphQL */ `
  subscription OnDeleteAssessment(
    $filter: ModelSubscriptionAssessmentFilterInput
  ) {
    onDeleteAssessment(filter: $filter) {
      id
      self_statement_completed
      peer_statement_completed
      direct_statement_completed
      boss_statement_completed
      user_id
      Answers {
        nextToken
        __typename
      }
      ques_per_module
      createdAt
      updatedAt
      __typename
    }
  }
`;
