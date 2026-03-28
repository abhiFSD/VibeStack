/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createStripeCustomer = /* GraphQL */ `
  mutation CreateStripeCustomer($organization: ID!) {
    createStripeCustomer(organization: $organization) {
      success
      customerId
      error
      __typename
    }
  }
`;
export const updateSubscription = /* GraphQL */ `
  mutation UpdateSubscription($organizationId: ID!, $billingPeriod: String!) {
    updateSubscription(
      organizationId: $organizationId
      billingPeriod: $billingPeriod
    ) {
      success
      subscriptionId
      clientSecret
      proratedAmount
      additionalLicenses
      error
      __typename
    }
  }
`;
export const updateSubscriptionQuantity = /* GraphQL */ `
  mutation UpdateSubscriptionQuantity(
    $organizationId: ID!
    $newQuantity: Int!
  ) {
    updateSubscriptionQuantity(
      organizationId: $organizationId
      newQuantity: $newQuantity
    ) {
      success
      subscriptionId
      clientSecret
      proratedAmount
      additionalLicenses
      error
      __typename
    }
  }
`;
export const purchaseLicenses = /* GraphQL */ `
  mutation PurchaseLicenses(
    $organizationId: ID!
    $quantity: Int!
    $billingPeriod: String!
  ) {
    purchaseLicenses(
      organizationId: $organizationId
      quantity: $quantity
      billingPeriod: $billingPeriod
    ) {
      success
      clientSecret
      licensesPurchased
      totalAmount
      paymentProcessed
      error
      __typename
    }
  }
`;
export const sendEmail = /* GraphQL */ `
  mutation SendEmail($input: SendEmailInput!) {
    sendEmail(input: $input) {
      success
      message
      __typename
    }
  }
`;
export const syncPaymentStatus = /* GraphQL */ `
  mutation SyncPaymentStatus($organizationId: ID!) {
    syncPaymentStatus(organizationId: $organizationId) {
      success
      organizationId
      message
      error
      __typename
    }
  }
`;
export const createVsm = /* GraphQL */ `
  mutation CreateVsm(
    $input: CreateVsmInput!
    $condition: ModelVsmConditionInput
  ) {
    createVsm(input: $input, condition: $condition) {
      id
      process
      informationFlow
      kaizenProject
      demandData
      summaryData
      reportID
      inventory
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateVsm = /* GraphQL */ `
  mutation UpdateVsm(
    $input: UpdateVsmInput!
    $condition: ModelVsmConditionInput
  ) {
    updateVsm(input: $input, condition: $condition) {
      id
      process
      informationFlow
      kaizenProject
      demandData
      summaryData
      reportID
      inventory
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteVsm = /* GraphQL */ `
  mutation DeleteVsm(
    $input: DeleteVsmInput!
    $condition: ModelVsmConditionInput
  ) {
    deleteVsm(input: $input, condition: $condition) {
      id
      process
      informationFlow
      kaizenProject
      demandData
      summaryData
      reportID
      inventory
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createChartData = /* GraphQL */ `
  mutation CreateChartData(
    $input: CreateChartDataInput!
    $condition: ModelChartDataConditionInput
  ) {
    createChartData(input: $input, condition: $condition) {
      id
      text
      textColor
      posX
      posY
      reportID
      value
      Description
      date
      orderIndex
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateChartData = /* GraphQL */ `
  mutation UpdateChartData(
    $input: UpdateChartDataInput!
    $condition: ModelChartDataConditionInput
  ) {
    updateChartData(input: $input, condition: $condition) {
      id
      text
      textColor
      posX
      posY
      reportID
      value
      Description
      date
      orderIndex
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteChartData = /* GraphQL */ `
  mutation DeleteChartData(
    $input: DeleteChartDataInput!
    $condition: ModelChartDataConditionInput
  ) {
    deleteChartData(input: $input, condition: $condition) {
      id
      text
      textColor
      posX
      posY
      reportID
      value
      Description
      date
      orderIndex
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createHighlights = /* GraphQL */ `
  mutation CreateHighlights(
    $input: CreateHighlightsInput!
    $condition: ModelHighlightsConditionInput
  ) {
    createHighlights(input: $input, condition: $condition) {
      id
      title
      description
      images
      assignees
      reportID
      waste_type
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateHighlights = /* GraphQL */ `
  mutation UpdateHighlights(
    $input: UpdateHighlightsInput!
    $condition: ModelHighlightsConditionInput
  ) {
    updateHighlights(input: $input, condition: $condition) {
      id
      title
      description
      images
      assignees
      reportID
      waste_type
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteHighlights = /* GraphQL */ `
  mutation DeleteHighlights(
    $input: DeleteHighlightsInput!
    $condition: ModelHighlightsConditionInput
  ) {
    deleteHighlights(input: $input, condition: $condition) {
      id
      title
      description
      images
      assignees
      reportID
      waste_type
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createEmailTemplate = /* GraphQL */ `
  mutation CreateEmailTemplate(
    $input: CreateEmailTemplateInput!
    $condition: ModelEmailTemplateConditionInput
  ) {
    createEmailTemplate(input: $input, condition: $condition) {
      id
      type
      subject
      htmlTemplate
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      isEnabled
      customType
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateEmailTemplate = /* GraphQL */ `
  mutation UpdateEmailTemplate(
    $input: UpdateEmailTemplateInput!
    $condition: ModelEmailTemplateConditionInput
  ) {
    updateEmailTemplate(input: $input, condition: $condition) {
      id
      type
      subject
      htmlTemplate
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      isEnabled
      customType
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteEmailTemplate = /* GraphQL */ `
  mutation DeleteEmailTemplate(
    $input: DeleteEmailTemplateInput!
    $condition: ModelEmailTemplateConditionInput
  ) {
    deleteEmailTemplate(input: $input, condition: $condition) {
      id
      type
      subject
      htmlTemplate
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      isEnabled
      customType
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createAwardDefinition = /* GraphQL */ `
  mutation CreateAwardDefinition(
    $input: CreateAwardDefinitionInput!
    $condition: ModelAwardDefinitionConditionInput
  ) {
    createAwardDefinition(input: $input, condition: $condition) {
      id
      type
      coins
      title
      description
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      isEnabled
      customType
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateAwardDefinition = /* GraphQL */ `
  mutation UpdateAwardDefinition(
    $input: UpdateAwardDefinitionInput!
    $condition: ModelAwardDefinitionConditionInput
  ) {
    updateAwardDefinition(input: $input, condition: $condition) {
      id
      type
      coins
      title
      description
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      isEnabled
      customType
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteAwardDefinition = /* GraphQL */ `
  mutation DeleteAwardDefinition(
    $input: DeleteAwardDefinitionInput!
    $condition: ModelAwardDefinitionConditionInput
  ) {
    deleteAwardDefinition(input: $input, condition: $condition) {
      id
      type
      coins
      title
      description
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      isEnabled
      customType
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createAwards = /* GraphQL */ `
  mutation CreateAwards(
    $input: CreateAwardsInput!
    $condition: ModelAwardsConditionInput
  ) {
    createAwards(input: $input, condition: $condition) {
      id
      title
      date
      description
      user_sub
      tool_id
      type
      coins
      organizationID
      customType
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateAwards = /* GraphQL */ `
  mutation UpdateAwards(
    $input: UpdateAwardsInput!
    $condition: ModelAwardsConditionInput
  ) {
    updateAwards(input: $input, condition: $condition) {
      id
      title
      date
      description
      user_sub
      tool_id
      type
      coins
      organizationID
      customType
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteAwards = /* GraphQL */ `
  mutation DeleteAwards(
    $input: DeleteAwardsInput!
    $condition: ModelAwardsConditionInput
  ) {
    deleteAwards(input: $input, condition: $condition) {
      id
      title
      date
      description
      user_sub
      tool_id
      type
      coins
      organizationID
      customType
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createUserCoins = /* GraphQL */ `
  mutation CreateUserCoins(
    $input: CreateUserCoinsInput!
    $condition: ModelUserCoinsConditionInput
  ) {
    createUserCoins(input: $input, condition: $condition) {
      id
      user_sub
      total_coins
      organizationID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateUserCoins = /* GraphQL */ `
  mutation UpdateUserCoins(
    $input: UpdateUserCoinsInput!
    $condition: ModelUserCoinsConditionInput
  ) {
    updateUserCoins(input: $input, condition: $condition) {
      id
      user_sub
      total_coins
      organizationID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteUserCoins = /* GraphQL */ `
  mutation DeleteUserCoins(
    $input: DeleteUserCoinsInput!
    $condition: ModelUserCoinsConditionInput
  ) {
    deleteUserCoins(input: $input, condition: $condition) {
      id
      user_sub
      total_coins
      organizationID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createFeedback = /* GraphQL */ `
  mutation CreateFeedback(
    $input: CreateFeedbackInput!
    $condition: ModelFeedbackConditionInput
  ) {
    createFeedback(input: $input, condition: $condition) {
      id
      content
      user_sub
      ratting
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateFeedback = /* GraphQL */ `
  mutation UpdateFeedback(
    $input: UpdateFeedbackInput!
    $condition: ModelFeedbackConditionInput
  ) {
    updateFeedback(input: $input, condition: $condition) {
      id
      content
      user_sub
      ratting
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteFeedback = /* GraphQL */ `
  mutation DeleteFeedback(
    $input: DeleteFeedbackInput!
    $condition: ModelFeedbackConditionInput
  ) {
    deleteFeedback(input: $input, condition: $condition) {
      id
      content
      user_sub
      ratting
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createQuizzesResult = /* GraphQL */ `
  mutation CreateQuizzesResult(
    $input: CreateQuizzesResultInput!
    $condition: ModelQuizzesResultConditionInput
  ) {
    createQuizzesResult(input: $input, condition: $condition) {
      id
      Correct
      Incorrect
      percentage
      user_sub
      tool_id
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateQuizzesResult = /* GraphQL */ `
  mutation UpdateQuizzesResult(
    $input: UpdateQuizzesResultInput!
    $condition: ModelQuizzesResultConditionInput
  ) {
    updateQuizzesResult(input: $input, condition: $condition) {
      id
      Correct
      Incorrect
      percentage
      user_sub
      tool_id
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteQuizzesResult = /* GraphQL */ `
  mutation DeleteQuizzesResult(
    $input: DeleteQuizzesResultInput!
    $condition: ModelQuizzesResultConditionInput
  ) {
    deleteQuizzesResult(input: $input, condition: $condition) {
      id
      Correct
      Incorrect
      percentage
      user_sub
      tool_id
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createActionItems = /* GraphQL */ `
  mutation CreateActionItems(
    $input: CreateActionItemsInput!
    $condition: ModelActionItemsConditionInput
  ) {
    createActionItems(input: $input, condition: $condition) {
      id
      note
      description
      title
      duedate
      status
      assignor
      assignees
      attachments
      reportID
      user_sub
      projectID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateActionItems = /* GraphQL */ `
  mutation UpdateActionItems(
    $input: UpdateActionItemsInput!
    $condition: ModelActionItemsConditionInput
  ) {
    updateActionItems(input: $input, condition: $condition) {
      id
      note
      description
      title
      duedate
      status
      assignor
      assignees
      attachments
      reportID
      user_sub
      projectID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteActionItems = /* GraphQL */ `
  mutation DeleteActionItems(
    $input: DeleteActionItemsInput!
    $condition: ModelActionItemsConditionInput
  ) {
    deleteActionItems(input: $input, condition: $condition) {
      id
      note
      description
      title
      duedate
      status
      assignor
      assignees
      attachments
      reportID
      user_sub
      projectID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createStatements = /* GraphQL */ `
  mutation CreateStatements(
    $input: CreateStatementsInput!
    $condition: ModelStatementsConditionInput
  ) {
    createStatements(input: $input, condition: $condition) {
      id
      name
      value
      default
      owner
      categoriesID
      categoryName
      reportID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateStatements = /* GraphQL */ `
  mutation UpdateStatements(
    $input: UpdateStatementsInput!
    $condition: ModelStatementsConditionInput
  ) {
    updateStatements(input: $input, condition: $condition) {
      id
      name
      value
      default
      owner
      categoriesID
      categoryName
      reportID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteStatements = /* GraphQL */ `
  mutation DeleteStatements(
    $input: DeleteStatementsInput!
    $condition: ModelStatementsConditionInput
  ) {
    deleteStatements(input: $input, condition: $condition) {
      id
      name
      value
      default
      owner
      categoriesID
      categoryName
      reportID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createCategories = /* GraphQL */ `
  mutation CreateCategories(
    $input: CreateCategoriesInput!
    $condition: ModelCategoriesConditionInput
  ) {
    createCategories(input: $input, condition: $condition) {
      id
      name
      reportID
      Statements {
        nextToken
        __typename
      }
      orderIndex
      assignees
      attachments
      description
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateCategories = /* GraphQL */ `
  mutation UpdateCategories(
    $input: UpdateCategoriesInput!
    $condition: ModelCategoriesConditionInput
  ) {
    updateCategories(input: $input, condition: $condition) {
      id
      name
      reportID
      Statements {
        nextToken
        __typename
      }
      orderIndex
      assignees
      attachments
      description
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteCategories = /* GraphQL */ `
  mutation DeleteCategories(
    $input: DeleteCategoriesInput!
    $condition: ModelCategoriesConditionInput
  ) {
    deleteCategories(input: $input, condition: $condition) {
      id
      name
      reportID
      Statements {
        nextToken
        __typename
      }
      orderIndex
      assignees
      attachments
      description
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createReport = /* GraphQL */ `
  mutation CreateReport(
    $input: CreateReportInput!
    $condition: ModelReportConditionInput
  ) {
    createReport(input: $input, condition: $condition) {
      id
      name
      type
      user_sub
      ownerEmail
      ai_id
      Categories {
        nextToken
        __typename
      }
      ActionItems {
        nextToken
        __typename
      }
      completed
      Highlights {
        nextToken
        __typename
      }
      ChartData {
        nextToken
        __typename
      }
      bones
      trend
      target
      media
      Vsm {
        id
        process
        informationFlow
        kaizenProject
        demandData
        summaryData
        reportID
        inventory
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        __typename
      }
      xaxis
      yaxis
      organizationID
      projectID
      assignedMembers
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      reportVsmId
      __typename
    }
  }
`;
export const updateReport = /* GraphQL */ `
  mutation UpdateReport(
    $input: UpdateReportInput!
    $condition: ModelReportConditionInput
  ) {
    updateReport(input: $input, condition: $condition) {
      id
      name
      type
      user_sub
      ownerEmail
      ai_id
      Categories {
        nextToken
        __typename
      }
      ActionItems {
        nextToken
        __typename
      }
      completed
      Highlights {
        nextToken
        __typename
      }
      ChartData {
        nextToken
        __typename
      }
      bones
      trend
      target
      media
      Vsm {
        id
        process
        informationFlow
        kaizenProject
        demandData
        summaryData
        reportID
        inventory
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        __typename
      }
      xaxis
      yaxis
      organizationID
      projectID
      assignedMembers
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      reportVsmId
      __typename
    }
  }
`;
export const deleteReport = /* GraphQL */ `
  mutation DeleteReport(
    $input: DeleteReportInput!
    $condition: ModelReportConditionInput
  ) {
    deleteReport(input: $input, condition: $condition) {
      id
      name
      type
      user_sub
      ownerEmail
      ai_id
      Categories {
        nextToken
        __typename
      }
      ActionItems {
        nextToken
        __typename
      }
      completed
      Highlights {
        nextToken
        __typename
      }
      ChartData {
        nextToken
        __typename
      }
      bones
      trend
      target
      media
      Vsm {
        id
        process
        informationFlow
        kaizenProject
        demandData
        summaryData
        reportID
        inventory
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        __typename
      }
      xaxis
      yaxis
      organizationID
      projectID
      assignedMembers
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      reportVsmId
      __typename
    }
  }
`;
export const createOrganization = /* GraphQL */ `
  mutation CreateOrganization(
    $input: CreateOrganizationInput!
    $condition: ModelOrganizationConditionInput
  ) {
    createOrganization(input: $input, condition: $condition) {
      id
      name
      owner
      additionalOwners
      contactEmail
      contactPhone
      location
      coordinates
      logo
      isActive
      leaderboardEnabled
      members {
        nextToken
        __typename
      }
      departments {
        nextToken
        __typename
      }
      Reports {
        nextToken
        __typename
      }
      Projects {
        nextToken
        __typename
      }
      awards {
        nextToken
        __typename
      }
      emailTemplates {
        nextToken
        __typename
      }
      invoices {
        nextToken
        __typename
      }
      shopItems {
        nextToken
        __typename
      }
      userPurchases {
        nextToken
        __typename
      }
      stripeCustomerId
      stripeSubscriptionId
      stripeSubscriptionItemId
      subscriptionStatus
      subscriptionPeriodEnd
      billingPeriod
      activeUserCount
      purchasedLicenses
      aiDisabledUsers
      learningCoinsPerInterval
      learningCoinInterval
      learningMaxCoinsPerSession
      learningCoinsEnabled
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      learnings {
        nextToken
        __typename
      }
      learningImages {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const updateOrganization = /* GraphQL */ `
  mutation UpdateOrganization(
    $input: UpdateOrganizationInput!
    $condition: ModelOrganizationConditionInput
  ) {
    updateOrganization(input: $input, condition: $condition) {
      id
      name
      owner
      additionalOwners
      contactEmail
      contactPhone
      location
      coordinates
      logo
      isActive
      leaderboardEnabled
      members {
        nextToken
        __typename
      }
      departments {
        nextToken
        __typename
      }
      Reports {
        nextToken
        __typename
      }
      Projects {
        nextToken
        __typename
      }
      awards {
        nextToken
        __typename
      }
      emailTemplates {
        nextToken
        __typename
      }
      invoices {
        nextToken
        __typename
      }
      shopItems {
        nextToken
        __typename
      }
      userPurchases {
        nextToken
        __typename
      }
      stripeCustomerId
      stripeSubscriptionId
      stripeSubscriptionItemId
      subscriptionStatus
      subscriptionPeriodEnd
      billingPeriod
      activeUserCount
      purchasedLicenses
      aiDisabledUsers
      learningCoinsPerInterval
      learningCoinInterval
      learningMaxCoinsPerSession
      learningCoinsEnabled
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      learnings {
        nextToken
        __typename
      }
      learningImages {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const deleteOrganization = /* GraphQL */ `
  mutation DeleteOrganization(
    $input: DeleteOrganizationInput!
    $condition: ModelOrganizationConditionInput
  ) {
    deleteOrganization(input: $input, condition: $condition) {
      id
      name
      owner
      additionalOwners
      contactEmail
      contactPhone
      location
      coordinates
      logo
      isActive
      leaderboardEnabled
      members {
        nextToken
        __typename
      }
      departments {
        nextToken
        __typename
      }
      Reports {
        nextToken
        __typename
      }
      Projects {
        nextToken
        __typename
      }
      awards {
        nextToken
        __typename
      }
      emailTemplates {
        nextToken
        __typename
      }
      invoices {
        nextToken
        __typename
      }
      shopItems {
        nextToken
        __typename
      }
      userPurchases {
        nextToken
        __typename
      }
      stripeCustomerId
      stripeSubscriptionId
      stripeSubscriptionItemId
      subscriptionStatus
      subscriptionPeriodEnd
      billingPeriod
      activeUserCount
      purchasedLicenses
      aiDisabledUsers
      learningCoinsPerInterval
      learningCoinInterval
      learningMaxCoinsPerSession
      learningCoinsEnabled
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      learnings {
        nextToken
        __typename
      }
      learningImages {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const createDepartment = /* GraphQL */ `
  mutation CreateDepartment(
    $input: CreateDepartmentInput!
    $condition: ModelDepartmentConditionInput
  ) {
    createDepartment(input: $input, condition: $condition) {
      id
      name
      description
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      members {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateDepartment = /* GraphQL */ `
  mutation UpdateDepartment(
    $input: UpdateDepartmentInput!
    $condition: ModelDepartmentConditionInput
  ) {
    updateDepartment(input: $input, condition: $condition) {
      id
      name
      description
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      members {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteDepartment = /* GraphQL */ `
  mutation DeleteDepartment(
    $input: DeleteDepartmentInput!
    $condition: ModelDepartmentConditionInput
  ) {
    deleteDepartment(input: $input, condition: $condition) {
      id
      name
      description
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      members {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createOrganizationMember = /* GraphQL */ `
  mutation CreateOrganizationMember(
    $input: CreateOrganizationMemberInput!
    $condition: ModelOrganizationMemberConditionInput
  ) {
    createOrganizationMember(input: $input, condition: $condition) {
      id
      organizationID
      departmentID
      department {
        id
        name
        description
        organizationID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      userSub
      email
      status
      role
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateOrganizationMember = /* GraphQL */ `
  mutation UpdateOrganizationMember(
    $input: UpdateOrganizationMemberInput!
    $condition: ModelOrganizationMemberConditionInput
  ) {
    updateOrganizationMember(input: $input, condition: $condition) {
      id
      organizationID
      departmentID
      department {
        id
        name
        description
        organizationID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      userSub
      email
      status
      role
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteOrganizationMember = /* GraphQL */ `
  mutation DeleteOrganizationMember(
    $input: DeleteOrganizationMemberInput!
    $condition: ModelOrganizationMemberConditionInput
  ) {
    deleteOrganizationMember(input: $input, condition: $condition) {
      id
      organizationID
      departmentID
      department {
        id
        name
        description
        organizationID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      userSub
      email
      status
      role
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createProject = /* GraphQL */ `
  mutation CreateProject(
    $input: CreateProjectInput!
    $condition: ModelProjectConditionInput
  ) {
    createProject(input: $input, condition: $condition) {
      id
      name
      description
      startDate
      endDate
      status
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      members {
        nextToken
        __typename
      }
      reports {
        nextToken
        __typename
      }
      actionItems {
        nextToken
        __typename
      }
      kpis {
        nextToken
        __typename
      }
      tangibles {
        nextToken
        __typename
      }
      intangibles {
        nextToken
        __typename
      }
      owner
      ownerEmail
      attachments
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateProject = /* GraphQL */ `
  mutation UpdateProject(
    $input: UpdateProjectInput!
    $condition: ModelProjectConditionInput
  ) {
    updateProject(input: $input, condition: $condition) {
      id
      name
      description
      startDate
      endDate
      status
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      members {
        nextToken
        __typename
      }
      reports {
        nextToken
        __typename
      }
      actionItems {
        nextToken
        __typename
      }
      kpis {
        nextToken
        __typename
      }
      tangibles {
        nextToken
        __typename
      }
      intangibles {
        nextToken
        __typename
      }
      owner
      ownerEmail
      attachments
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteProject = /* GraphQL */ `
  mutation DeleteProject(
    $input: DeleteProjectInput!
    $condition: ModelProjectConditionInput
  ) {
    deleteProject(input: $input, condition: $condition) {
      id
      name
      description
      startDate
      endDate
      status
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      members {
        nextToken
        __typename
      }
      reports {
        nextToken
        __typename
      }
      actionItems {
        nextToken
        __typename
      }
      kpis {
        nextToken
        __typename
      }
      tangibles {
        nextToken
        __typename
      }
      intangibles {
        nextToken
        __typename
      }
      owner
      ownerEmail
      attachments
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createProjectMember = /* GraphQL */ `
  mutation CreateProjectMember(
    $input: CreateProjectMemberInput!
    $condition: ModelProjectMemberConditionInput
  ) {
    createProjectMember(input: $input, condition: $condition) {
      id
      projectID
      userSub
      role
      email
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateProjectMember = /* GraphQL */ `
  mutation UpdateProjectMember(
    $input: UpdateProjectMemberInput!
    $condition: ModelProjectMemberConditionInput
  ) {
    updateProjectMember(input: $input, condition: $condition) {
      id
      projectID
      userSub
      role
      email
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteProjectMember = /* GraphQL */ `
  mutation DeleteProjectMember(
    $input: DeleteProjectMemberInput!
    $condition: ModelProjectMemberConditionInput
  ) {
    deleteProjectMember(input: $input, condition: $condition) {
      id
      projectID
      userSub
      role
      email
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createKPI = /* GraphQL */ `
  mutation CreateKPI(
    $input: CreateKPIInput!
    $condition: ModelKPIConditionInput
  ) {
    createKPI(input: $input, condition: $condition) {
      id
      title
      xAxisLabel
      yAxisLabel
      trend
      target
      startDate
      endDate
      projectID
      project {
        id
        name
        description
        startDate
        endDate
        status
        organizationID
        owner
        ownerEmail
        attachments
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      kpiData {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateKPI = /* GraphQL */ `
  mutation UpdateKPI(
    $input: UpdateKPIInput!
    $condition: ModelKPIConditionInput
  ) {
    updateKPI(input: $input, condition: $condition) {
      id
      title
      xAxisLabel
      yAxisLabel
      trend
      target
      startDate
      endDate
      projectID
      project {
        id
        name
        description
        startDate
        endDate
        status
        organizationID
        owner
        ownerEmail
        attachments
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      kpiData {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteKPI = /* GraphQL */ `
  mutation DeleteKPI(
    $input: DeleteKPIInput!
    $condition: ModelKPIConditionInput
  ) {
    deleteKPI(input: $input, condition: $condition) {
      id
      title
      xAxisLabel
      yAxisLabel
      trend
      target
      startDate
      endDate
      projectID
      project {
        id
        name
        description
        startDate
        endDate
        status
        organizationID
        owner
        ownerEmail
        attachments
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      kpiData {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createKPIData = /* GraphQL */ `
  mutation CreateKPIData(
    $input: CreateKPIDataInput!
    $condition: ModelKPIDataConditionInput
  ) {
    createKPIData(input: $input, condition: $condition) {
      id
      kpiID
      xAxisValue
      yAxisvalue
      date
      description
      orderIndex
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateKPIData = /* GraphQL */ `
  mutation UpdateKPIData(
    $input: UpdateKPIDataInput!
    $condition: ModelKPIDataConditionInput
  ) {
    updateKPIData(input: $input, condition: $condition) {
      id
      kpiID
      xAxisValue
      yAxisvalue
      date
      description
      orderIndex
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteKPIData = /* GraphQL */ `
  mutation DeleteKPIData(
    $input: DeleteKPIDataInput!
    $condition: ModelKPIDataConditionInput
  ) {
    deleteKPIData(input: $input, condition: $condition) {
      id
      kpiID
      xAxisValue
      yAxisvalue
      date
      description
      orderIndex
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createQuiz = /* GraphQL */ `
  mutation CreateQuiz(
    $input: CreateQuizInput!
    $condition: ModelQuizConditionInput
  ) {
    createQuiz(input: $input, condition: $condition) {
      id
      title
      description
      questions {
        nextToken
        __typename
      }
      learningId
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateQuiz = /* GraphQL */ `
  mutation UpdateQuiz(
    $input: UpdateQuizInput!
    $condition: ModelQuizConditionInput
  ) {
    updateQuiz(input: $input, condition: $condition) {
      id
      title
      description
      questions {
        nextToken
        __typename
      }
      learningId
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteQuiz = /* GraphQL */ `
  mutation DeleteQuiz(
    $input: DeleteQuizInput!
    $condition: ModelQuizConditionInput
  ) {
    deleteQuiz(input: $input, condition: $condition) {
      id
      title
      description
      questions {
        nextToken
        __typename
      }
      learningId
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createQuestion = /* GraphQL */ `
  mutation CreateQuestion(
    $input: CreateQuestionInput!
    $condition: ModelQuestionConditionInput
  ) {
    createQuestion(input: $input, condition: $condition) {
      id
      content
      options
      correctOption
      explanation
      orderIndex
      quizId
      quiz {
        id
        title
        description
        learningId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateQuestion = /* GraphQL */ `
  mutation UpdateQuestion(
    $input: UpdateQuestionInput!
    $condition: ModelQuestionConditionInput
  ) {
    updateQuestion(input: $input, condition: $condition) {
      id
      content
      options
      correctOption
      explanation
      orderIndex
      quizId
      quiz {
        id
        title
        description
        learningId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteQuestion = /* GraphQL */ `
  mutation DeleteQuestion(
    $input: DeleteQuestionInput!
    $condition: ModelQuestionConditionInput
  ) {
    deleteQuestion(input: $input, condition: $condition) {
      id
      content
      options
      correctOption
      explanation
      orderIndex
      quizId
      quiz {
        id
        title
        description
        learningId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createPost = /* GraphQL */ `
  mutation CreatePost(
    $input: CreatePostInput!
    $condition: ModelPostConditionInput
  ) {
    createPost(input: $input, condition: $condition) {
      id
      content
      organizationId
      isDefault
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updatePost = /* GraphQL */ `
  mutation UpdatePost(
    $input: UpdatePostInput!
    $condition: ModelPostConditionInput
  ) {
    updatePost(input: $input, condition: $condition) {
      id
      content
      organizationId
      isDefault
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deletePost = /* GraphQL */ `
  mutation DeletePost(
    $input: DeletePostInput!
    $condition: ModelPostConditionInput
  ) {
    deletePost(input: $input, condition: $condition) {
      id
      content
      organizationId
      isDefault
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createLearning = /* GraphQL */ `
  mutation CreateLearning(
    $input: CreateLearningInput!
    $condition: ModelLearningConditionInput
  ) {
    createLearning(input: $input, condition: $condition) {
      id
      orderIndex
      title
      description
      chapters {
        nextToken
        __typename
      }
      quizzes {
        nextToken
        __typename
      }
      learningProgress {
        nextToken
        __typename
      }
      images {
        nextToken
        __typename
      }
      quizScore
      quizStatementsCount
      hasQuizTaken
      isDefault
      readTime
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      clonedFromID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateLearning = /* GraphQL */ `
  mutation UpdateLearning(
    $input: UpdateLearningInput!
    $condition: ModelLearningConditionInput
  ) {
    updateLearning(input: $input, condition: $condition) {
      id
      orderIndex
      title
      description
      chapters {
        nextToken
        __typename
      }
      quizzes {
        nextToken
        __typename
      }
      learningProgress {
        nextToken
        __typename
      }
      images {
        nextToken
        __typename
      }
      quizScore
      quizStatementsCount
      hasQuizTaken
      isDefault
      readTime
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      clonedFromID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteLearning = /* GraphQL */ `
  mutation DeleteLearning(
    $input: DeleteLearningInput!
    $condition: ModelLearningConditionInput
  ) {
    deleteLearning(input: $input, condition: $condition) {
      id
      orderIndex
      title
      description
      chapters {
        nextToken
        __typename
      }
      quizzes {
        nextToken
        __typename
      }
      learningProgress {
        nextToken
        __typename
      }
      images {
        nextToken
        __typename
      }
      quizScore
      quizStatementsCount
      hasQuizTaken
      isDefault
      readTime
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      clonedFromID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createLearningImage = /* GraphQL */ `
  mutation CreateLearningImage(
    $input: CreateLearningImageInput!
    $condition: ModelLearningImageConditionInput
  ) {
    createLearningImage(input: $input, condition: $condition) {
      id
      filename
      originalFilename
      s3Key
      imageUrl
      fileSize
      mimeType
      width
      height
      compressedSize
      compressionRatio
      learningID
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      uploadedBy
      uploadedByEmail
      isActive
      usageCount
      tags
      description
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateLearningImage = /* GraphQL */ `
  mutation UpdateLearningImage(
    $input: UpdateLearningImageInput!
    $condition: ModelLearningImageConditionInput
  ) {
    updateLearningImage(input: $input, condition: $condition) {
      id
      filename
      originalFilename
      s3Key
      imageUrl
      fileSize
      mimeType
      width
      height
      compressedSize
      compressionRatio
      learningID
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      uploadedBy
      uploadedByEmail
      isActive
      usageCount
      tags
      description
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteLearningImage = /* GraphQL */ `
  mutation DeleteLearningImage(
    $input: DeleteLearningImageInput!
    $condition: ModelLearningImageConditionInput
  ) {
    deleteLearningImage(input: $input, condition: $condition) {
      id
      filename
      originalFilename
      s3Key
      imageUrl
      fileSize
      mimeType
      width
      height
      compressedSize
      compressionRatio
      learningID
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      uploadedBy
      uploadedByEmail
      isActive
      usageCount
      tags
      description
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createChapter = /* GraphQL */ `
  mutation CreateChapter(
    $input: CreateChapterInput!
    $condition: ModelChapterConditionInput
  ) {
    createChapter(input: $input, condition: $condition) {
      id
      title
      slug
      position
      postId
      post {
        id
        content
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      learningId
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      sections {
        nextToken
        __typename
      }
      organizationId
      isDefault
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateChapter = /* GraphQL */ `
  mutation UpdateChapter(
    $input: UpdateChapterInput!
    $condition: ModelChapterConditionInput
  ) {
    updateChapter(input: $input, condition: $condition) {
      id
      title
      slug
      position
      postId
      post {
        id
        content
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      learningId
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      sections {
        nextToken
        __typename
      }
      organizationId
      isDefault
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteChapter = /* GraphQL */ `
  mutation DeleteChapter(
    $input: DeleteChapterInput!
    $condition: ModelChapterConditionInput
  ) {
    deleteChapter(input: $input, condition: $condition) {
      id
      title
      slug
      position
      postId
      post {
        id
        content
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      learningId
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      sections {
        nextToken
        __typename
      }
      organizationId
      isDefault
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createSection = /* GraphQL */ `
  mutation CreateSection(
    $input: CreateSectionInput!
    $condition: ModelSectionConditionInput
  ) {
    createSection(input: $input, condition: $condition) {
      id
      title
      slug
      position
      chapterId
      chapter {
        id
        title
        slug
        position
        postId
        learningId
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      subSections {
        nextToken
        __typename
      }
      organizationId
      postId
      post {
        id
        content
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      isDefault
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateSection = /* GraphQL */ `
  mutation UpdateSection(
    $input: UpdateSectionInput!
    $condition: ModelSectionConditionInput
  ) {
    updateSection(input: $input, condition: $condition) {
      id
      title
      slug
      position
      chapterId
      chapter {
        id
        title
        slug
        position
        postId
        learningId
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      subSections {
        nextToken
        __typename
      }
      organizationId
      postId
      post {
        id
        content
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      isDefault
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteSection = /* GraphQL */ `
  mutation DeleteSection(
    $input: DeleteSectionInput!
    $condition: ModelSectionConditionInput
  ) {
    deleteSection(input: $input, condition: $condition) {
      id
      title
      slug
      position
      chapterId
      chapter {
        id
        title
        slug
        position
        postId
        learningId
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      subSections {
        nextToken
        __typename
      }
      organizationId
      postId
      post {
        id
        content
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      isDefault
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createSubSection = /* GraphQL */ `
  mutation CreateSubSection(
    $input: CreateSubSectionInput!
    $condition: ModelSubSectionConditionInput
  ) {
    createSubSection(input: $input, condition: $condition) {
      id
      title
      slug
      position
      sectionId
      section {
        id
        title
        slug
        position
        chapterId
        organizationId
        postId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      postId
      post {
        id
        content
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      organizationId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateSubSection = /* GraphQL */ `
  mutation UpdateSubSection(
    $input: UpdateSubSectionInput!
    $condition: ModelSubSectionConditionInput
  ) {
    updateSubSection(input: $input, condition: $condition) {
      id
      title
      slug
      position
      sectionId
      section {
        id
        title
        slug
        position
        chapterId
        organizationId
        postId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      postId
      post {
        id
        content
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      organizationId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteSubSection = /* GraphQL */ `
  mutation DeleteSubSection(
    $input: DeleteSubSectionInput!
    $condition: ModelSubSectionConditionInput
  ) {
    deleteSubSection(input: $input, condition: $condition) {
      id
      title
      slug
      position
      sectionId
      section {
        id
        title
        slug
        position
        chapterId
        organizationId
        postId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      postId
      post {
        id
        content
        organizationId
        isDefault
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      organizationId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createTangible = /* GraphQL */ `
  mutation CreateTangible(
    $input: CreateTangibleInput!
    $condition: ModelTangibleConditionInput
  ) {
    createTangible(input: $input, condition: $condition) {
      id
      label
      value
      date
      projectID
      project {
        id
        name
        description
        startDate
        endDate
        status
        organizationID
        owner
        ownerEmail
        attachments
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateTangible = /* GraphQL */ `
  mutation UpdateTangible(
    $input: UpdateTangibleInput!
    $condition: ModelTangibleConditionInput
  ) {
    updateTangible(input: $input, condition: $condition) {
      id
      label
      value
      date
      projectID
      project {
        id
        name
        description
        startDate
        endDate
        status
        organizationID
        owner
        ownerEmail
        attachments
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteTangible = /* GraphQL */ `
  mutation DeleteTangible(
    $input: DeleteTangibleInput!
    $condition: ModelTangibleConditionInput
  ) {
    deleteTangible(input: $input, condition: $condition) {
      id
      label
      value
      date
      projectID
      project {
        id
        name
        description
        startDate
        endDate
        status
        organizationID
        owner
        ownerEmail
        attachments
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createIntangible = /* GraphQL */ `
  mutation CreateIntangible(
    $input: CreateIntangibleInput!
    $condition: ModelIntangibleConditionInput
  ) {
    createIntangible(input: $input, condition: $condition) {
      id
      text
      projectID
      project {
        id
        name
        description
        startDate
        endDate
        status
        organizationID
        owner
        ownerEmail
        attachments
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateIntangible = /* GraphQL */ `
  mutation UpdateIntangible(
    $input: UpdateIntangibleInput!
    $condition: ModelIntangibleConditionInput
  ) {
    updateIntangible(input: $input, condition: $condition) {
      id
      text
      projectID
      project {
        id
        name
        description
        startDate
        endDate
        status
        organizationID
        owner
        ownerEmail
        attachments
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteIntangible = /* GraphQL */ `
  mutation DeleteIntangible(
    $input: DeleteIntangibleInput!
    $condition: ModelIntangibleConditionInput
  ) {
    deleteIntangible(input: $input, condition: $condition) {
      id
      text
      projectID
      project {
        id
        name
        description
        startDate
        endDate
        status
        organizationID
        owner
        ownerEmail
        attachments
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createSubscriptionInvoice = /* GraphQL */ `
  mutation CreateSubscriptionInvoice(
    $input: CreateSubscriptionInvoiceInput!
    $condition: ModelSubscriptionInvoiceConditionInput
  ) {
    createSubscriptionInvoice(input: $input, condition: $condition) {
      id
      organizationId
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      stripeInvoiceId
      amount
      status
      billingPeriodStart
      billingPeriodEnd
      userCount
      pricePerUser
      billingPeriod
      hostedInvoiceUrl
      invoicePdfUrl
      isProrated
      proratedAmount
      basePrice
      prorationDate
      licenseChange
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
      __typename
    }
  }
`;
export const updateSubscriptionInvoice = /* GraphQL */ `
  mutation UpdateSubscriptionInvoice(
    $input: UpdateSubscriptionInvoiceInput!
    $condition: ModelSubscriptionInvoiceConditionInput
  ) {
    updateSubscriptionInvoice(input: $input, condition: $condition) {
      id
      organizationId
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      stripeInvoiceId
      amount
      status
      billingPeriodStart
      billingPeriodEnd
      userCount
      pricePerUser
      billingPeriod
      hostedInvoiceUrl
      invoicePdfUrl
      isProrated
      proratedAmount
      basePrice
      prorationDate
      licenseChange
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
      __typename
    }
  }
`;
export const deleteSubscriptionInvoice = /* GraphQL */ `
  mutation DeleteSubscriptionInvoice(
    $input: DeleteSubscriptionInvoiceInput!
    $condition: ModelSubscriptionInvoiceConditionInput
  ) {
    deleteSubscriptionInvoice(input: $input, condition: $condition) {
      id
      organizationId
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      stripeInvoiceId
      amount
      status
      billingPeriodStart
      billingPeriodEnd
      userCount
      pricePerUser
      billingPeriod
      hostedInvoiceUrl
      invoicePdfUrl
      isProrated
      proratedAmount
      basePrice
      prorationDate
      licenseChange
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
      __typename
    }
  }
`;
export const createShopItem = /* GraphQL */ `
  mutation CreateShopItem(
    $input: CreateShopItemInput!
    $condition: ModelShopItemConditionInput
  ) {
    createShopItem(input: $input, condition: $condition) {
      id
      name
      description
      price
      image
      isEnabled
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      type
      purchases {
        nextToken
        __typename
      }
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateShopItem = /* GraphQL */ `
  mutation UpdateShopItem(
    $input: UpdateShopItemInput!
    $condition: ModelShopItemConditionInput
  ) {
    updateShopItem(input: $input, condition: $condition) {
      id
      name
      description
      price
      image
      isEnabled
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      type
      purchases {
        nextToken
        __typename
      }
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteShopItem = /* GraphQL */ `
  mutation DeleteShopItem(
    $input: DeleteShopItemInput!
    $condition: ModelShopItemConditionInput
  ) {
    deleteShopItem(input: $input, condition: $condition) {
      id
      name
      description
      price
      image
      isEnabled
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      type
      purchases {
        nextToken
        __typename
      }
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createUserPurchase = /* GraphQL */ `
  mutation CreateUserPurchase(
    $input: CreateUserPurchaseInput!
    $condition: ModelUserPurchaseConditionInput
  ) {
    createUserPurchase(input: $input, condition: $condition) {
      id
      shopItemID
      shopItem {
        id
        name
        description
        price
        image
        isEnabled
        organizationID
        type
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        __typename
      }
      user_sub
      purchaseDate
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      status
      approvedBy
      approvedDate
      rejectionReason
      deliveryNotes
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateUserPurchase = /* GraphQL */ `
  mutation UpdateUserPurchase(
    $input: UpdateUserPurchaseInput!
    $condition: ModelUserPurchaseConditionInput
  ) {
    updateUserPurchase(input: $input, condition: $condition) {
      id
      shopItemID
      shopItem {
        id
        name
        description
        price
        image
        isEnabled
        organizationID
        type
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        __typename
      }
      user_sub
      purchaseDate
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      status
      approvedBy
      approvedDate
      rejectionReason
      deliveryNotes
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteUserPurchase = /* GraphQL */ `
  mutation DeleteUserPurchase(
    $input: DeleteUserPurchaseInput!
    $condition: ModelUserPurchaseConditionInput
  ) {
    deleteUserPurchase(input: $input, condition: $condition) {
      id
      shopItemID
      shopItem {
        id
        name
        description
        price
        image
        isEnabled
        organizationID
        type
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        __typename
      }
      user_sub
      purchaseDate
      organizationID
      organization {
        id
        name
        owner
        additionalOwners
        contactEmail
        contactPhone
        location
        coordinates
        logo
        isActive
        leaderboardEnabled
        stripeCustomerId
        stripeSubscriptionId
        stripeSubscriptionItemId
        subscriptionStatus
        subscriptionPeriodEnd
        billingPeriod
        activeUserCount
        purchasedLicenses
        aiDisabledUsers
        learningCoinsPerInterval
        learningCoinInterval
        learningMaxCoinsPerSession
        learningCoinsEnabled
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      status
      approvedBy
      approvedDate
      rejectionReason
      deliveryNotes
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createUser = /* GraphQL */ `
  mutation CreateUser(
    $input: CreateUserInput!
    $condition: ModelUserConditionInput
  ) {
    createUser(input: $input, condition: $condition) {
      id
      cognitoID
      email
      firstName
      lastName
      profileImageKey
      profileImagePath
      profileImageUrl
      lastLogin
      source
      termsAccepted
      termsAcceptedDate
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateUser = /* GraphQL */ `
  mutation UpdateUser(
    $input: UpdateUserInput!
    $condition: ModelUserConditionInput
  ) {
    updateUser(input: $input, condition: $condition) {
      id
      cognitoID
      email
      firstName
      lastName
      profileImageKey
      profileImagePath
      profileImageUrl
      lastLogin
      source
      termsAccepted
      termsAcceptedDate
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser(
    $input: DeleteUserInput!
    $condition: ModelUserConditionInput
  ) {
    deleteUser(input: $input, condition: $condition) {
      id
      cognitoID
      email
      firstName
      lastName
      profileImageKey
      profileImagePath
      profileImageUrl
      lastLogin
      source
      termsAccepted
      termsAcceptedDate
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const createIssue = /* GraphQL */ `
  mutation CreateIssue(
    $input: CreateIssueInput!
    $condition: ModelIssueConditionInput
  ) {
    createIssue(input: $input, condition: $condition) {
      id
      title
      description
      category
      priority
      status
      attachments
      reporterEmail
      reporterName
      reporterID
      organizationID
      assignedToEmail
      assignedToName
      responses {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateIssue = /* GraphQL */ `
  mutation UpdateIssue(
    $input: UpdateIssueInput!
    $condition: ModelIssueConditionInput
  ) {
    updateIssue(input: $input, condition: $condition) {
      id
      title
      description
      category
      priority
      status
      attachments
      reporterEmail
      reporterName
      reporterID
      organizationID
      assignedToEmail
      assignedToName
      responses {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteIssue = /* GraphQL */ `
  mutation DeleteIssue(
    $input: DeleteIssueInput!
    $condition: ModelIssueConditionInput
  ) {
    deleteIssue(input: $input, condition: $condition) {
      id
      title
      description
      category
      priority
      status
      attachments
      reporterEmail
      reporterName
      reporterID
      organizationID
      assignedToEmail
      assignedToName
      responses {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createIssueResponse = /* GraphQL */ `
  mutation CreateIssueResponse(
    $input: CreateIssueResponseInput!
    $condition: ModelIssueResponseConditionInput
  ) {
    createIssueResponse(input: $input, condition: $condition) {
      id
      message
      isAdminResponse
      responderEmail
      responderName
      responderID
      attachments
      issueID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateIssueResponse = /* GraphQL */ `
  mutation UpdateIssueResponse(
    $input: UpdateIssueResponseInput!
    $condition: ModelIssueResponseConditionInput
  ) {
    updateIssueResponse(input: $input, condition: $condition) {
      id
      message
      isAdminResponse
      responderEmail
      responderName
      responderID
      attachments
      issueID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteIssueResponse = /* GraphQL */ `
  mutation DeleteIssueResponse(
    $input: DeleteIssueResponseInput!
    $condition: ModelIssueResponseConditionInput
  ) {
    deleteIssueResponse(input: $input, condition: $condition) {
      id
      message
      isAdminResponse
      responderEmail
      responderName
      responderID
      attachments
      issueID
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createLearningSession = /* GraphQL */ `
  mutation CreateLearningSession(
    $input: CreateLearningSessionInput!
    $condition: ModelLearningSessionConditionInput
  ) {
    createLearningSession(input: $input, condition: $condition) {
      id
      userSub
      organizationID
      learningID
      startTime
      endTime
      duration
      sectionsViewed
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateLearningSession = /* GraphQL */ `
  mutation UpdateLearningSession(
    $input: UpdateLearningSessionInput!
    $condition: ModelLearningSessionConditionInput
  ) {
    updateLearningSession(input: $input, condition: $condition) {
      id
      userSub
      organizationID
      learningID
      startTime
      endTime
      duration
      sectionsViewed
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteLearningSession = /* GraphQL */ `
  mutation DeleteLearningSession(
    $input: DeleteLearningSessionInput!
    $condition: ModelLearningSessionConditionInput
  ) {
    deleteLearningSession(input: $input, condition: $condition) {
      id
      userSub
      organizationID
      learningID
      startTime
      endTime
      duration
      sectionsViewed
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createLearningProgress = /* GraphQL */ `
  mutation CreateLearningProgress(
    $input: CreateLearningProgressInput!
    $condition: ModelLearningProgressConditionInput
  ) {
    createLearningProgress(input: $input, condition: $condition) {
      id
      userSub
      organizationID
      learningID
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      chaptersCompleted
      sectionsViewed
      totalTimeSpent
      lastAccessedAt
      completionPercentage
      firstAccessedAt
      totalSessions
      averageSessionDuration
      lastViewedSection
      lastScrollPosition
      readingSessionData
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateLearningProgress = /* GraphQL */ `
  mutation UpdateLearningProgress(
    $input: UpdateLearningProgressInput!
    $condition: ModelLearningProgressConditionInput
  ) {
    updateLearningProgress(input: $input, condition: $condition) {
      id
      userSub
      organizationID
      learningID
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      chaptersCompleted
      sectionsViewed
      totalTimeSpent
      lastAccessedAt
      completionPercentage
      firstAccessedAt
      totalSessions
      averageSessionDuration
      lastViewedSection
      lastScrollPosition
      readingSessionData
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteLearningProgress = /* GraphQL */ `
  mutation DeleteLearningProgress(
    $input: DeleteLearningProgressInput!
    $condition: ModelLearningProgressConditionInput
  ) {
    deleteLearningProgress(input: $input, condition: $condition) {
      id
      userSub
      organizationID
      learningID
      learning {
        id
        orderIndex
        title
        description
        quizScore
        quizStatementsCount
        hasQuizTaken
        isDefault
        readTime
        organizationID
        clonedFromID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      chaptersCompleted
      sectionsViewed
      totalTimeSpent
      lastAccessedAt
      completionPercentage
      firstAccessedAt
      totalSessions
      averageSessionDuration
      lastViewedSection
      lastScrollPosition
      readingSessionData
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createSectionInteraction = /* GraphQL */ `
  mutation CreateSectionInteraction(
    $input: CreateSectionInteractionInput!
    $condition: ModelSectionInteractionConditionInput
  ) {
    createSectionInteraction(input: $input, condition: $condition) {
      id
      userSub
      organizationID
      learningID
      chapterID
      sectionID
      timeSpent
      viewCount
      lastViewedAt
      firstViewedAt
      completed
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateSectionInteraction = /* GraphQL */ `
  mutation UpdateSectionInteraction(
    $input: UpdateSectionInteractionInput!
    $condition: ModelSectionInteractionConditionInput
  ) {
    updateSectionInteraction(input: $input, condition: $condition) {
      id
      userSub
      organizationID
      learningID
      chapterID
      sectionID
      timeSpent
      viewCount
      lastViewedAt
      firstViewedAt
      completed
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteSectionInteraction = /* GraphQL */ `
  mutation DeleteSectionInteraction(
    $input: DeleteSectionInteractionInput!
    $condition: ModelSectionInteractionConditionInput
  ) {
    deleteSectionInteraction(input: $input, condition: $condition) {
      id
      userSub
      organizationID
      learningID
      chapterID
      sectionID
      timeSpent
      viewCount
      lastViewedAt
      firstViewedAt
      completed
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
