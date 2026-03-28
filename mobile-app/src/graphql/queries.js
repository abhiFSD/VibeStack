/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getAnswers = /* GraphQL */ `
  query GetAnswers($id: ID!) {
    getAnswers(id: $id) {
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
export const listAnswers = /* GraphQL */ `
  query ListAnswers(
    $filter: ModelAnswersFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAnswers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const answersByAssessmentID = /* GraphQL */ `
  query AnswersByAssessmentID(
    $assessmentID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAnswersFilterInput
    $limit: Int
    $nextToken: String
  ) {
    answersByAssessmentID(
      assessmentID: $assessmentID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getAssessment = /* GraphQL */ `
  query GetAssessment($id: ID!) {
    getAssessment(id: $id) {
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
export const listAssessments = /* GraphQL */ `
  query ListAssessments(
    $filter: ModelAssessmentFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAssessments(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        self_statement_completed
        peer_statement_completed
        direct_statement_completed
        boss_statement_completed
        user_id
        ques_per_module
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
