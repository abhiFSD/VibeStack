/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createAnswers = /* GraphQL */ `
  mutation CreateAnswers(
    $input: CreateAnswersInput!
    $condition: ModelAnswersConditionInput
  ) {
    createAnswers(input: $input, condition: $condition) {
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
export const updateAnswers = /* GraphQL */ `
  mutation UpdateAnswers(
    $input: UpdateAnswersInput!
    $condition: ModelAnswersConditionInput
  ) {
    updateAnswers(input: $input, condition: $condition) {
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
export const deleteAnswers = /* GraphQL */ `
  mutation DeleteAnswers(
    $input: DeleteAnswersInput!
    $condition: ModelAnswersConditionInput
  ) {
    deleteAnswers(input: $input, condition: $condition) {
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
export const createAssessment = /* GraphQL */ `
  mutation CreateAssessment(
    $input: CreateAssessmentInput!
    $condition: ModelAssessmentConditionInput
  ) {
    createAssessment(input: $input, condition: $condition) {
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
export const updateAssessment = /* GraphQL */ `
  mutation UpdateAssessment(
    $input: UpdateAssessmentInput!
    $condition: ModelAssessmentConditionInput
  ) {
    updateAssessment(input: $input, condition: $condition) {
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
export const deleteAssessment = /* GraphQL */ `
  mutation DeleteAssessment(
    $input: DeleteAssessmentInput!
    $condition: ModelAssessmentConditionInput
  ) {
    deleteAssessment(input: $input, condition: $condition) {
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
