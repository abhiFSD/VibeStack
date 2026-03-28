/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateVsm = /* GraphQL */ `
  subscription OnCreateVsm($filter: ModelSubscriptionVsmFilterInput) {
    onCreateVsm(filter: $filter) {
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
export const onUpdateVsm = /* GraphQL */ `
  subscription OnUpdateVsm($filter: ModelSubscriptionVsmFilterInput) {
    onUpdateVsm(filter: $filter) {
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
export const onDeleteVsm = /* GraphQL */ `
  subscription OnDeleteVsm($filter: ModelSubscriptionVsmFilterInput) {
    onDeleteVsm(filter: $filter) {
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
export const onCreateChartData = /* GraphQL */ `
  subscription OnCreateChartData(
    $filter: ModelSubscriptionChartDataFilterInput
  ) {
    onCreateChartData(filter: $filter) {
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
export const onUpdateChartData = /* GraphQL */ `
  subscription OnUpdateChartData(
    $filter: ModelSubscriptionChartDataFilterInput
  ) {
    onUpdateChartData(filter: $filter) {
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
export const onDeleteChartData = /* GraphQL */ `
  subscription OnDeleteChartData(
    $filter: ModelSubscriptionChartDataFilterInput
  ) {
    onDeleteChartData(filter: $filter) {
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
export const onCreateHighlights = /* GraphQL */ `
  subscription OnCreateHighlights(
    $filter: ModelSubscriptionHighlightsFilterInput
  ) {
    onCreateHighlights(filter: $filter) {
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
export const onUpdateHighlights = /* GraphQL */ `
  subscription OnUpdateHighlights(
    $filter: ModelSubscriptionHighlightsFilterInput
  ) {
    onUpdateHighlights(filter: $filter) {
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
export const onDeleteHighlights = /* GraphQL */ `
  subscription OnDeleteHighlights(
    $filter: ModelSubscriptionHighlightsFilterInput
  ) {
    onDeleteHighlights(filter: $filter) {
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
export const onCreateEmailTemplate = /* GraphQL */ `
  subscription OnCreateEmailTemplate(
    $filter: ModelSubscriptionEmailTemplateFilterInput
  ) {
    onCreateEmailTemplate(filter: $filter) {
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
export const onUpdateEmailTemplate = /* GraphQL */ `
  subscription OnUpdateEmailTemplate(
    $filter: ModelSubscriptionEmailTemplateFilterInput
  ) {
    onUpdateEmailTemplate(filter: $filter) {
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
export const onDeleteEmailTemplate = /* GraphQL */ `
  subscription OnDeleteEmailTemplate(
    $filter: ModelSubscriptionEmailTemplateFilterInput
  ) {
    onDeleteEmailTemplate(filter: $filter) {
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
export const onCreateAwardDefinition = /* GraphQL */ `
  subscription OnCreateAwardDefinition(
    $filter: ModelSubscriptionAwardDefinitionFilterInput
  ) {
    onCreateAwardDefinition(filter: $filter) {
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
export const onUpdateAwardDefinition = /* GraphQL */ `
  subscription OnUpdateAwardDefinition(
    $filter: ModelSubscriptionAwardDefinitionFilterInput
  ) {
    onUpdateAwardDefinition(filter: $filter) {
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
export const onDeleteAwardDefinition = /* GraphQL */ `
  subscription OnDeleteAwardDefinition(
    $filter: ModelSubscriptionAwardDefinitionFilterInput
  ) {
    onDeleteAwardDefinition(filter: $filter) {
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
export const onCreateAwards = /* GraphQL */ `
  subscription OnCreateAwards($filter: ModelSubscriptionAwardsFilterInput) {
    onCreateAwards(filter: $filter) {
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
export const onUpdateAwards = /* GraphQL */ `
  subscription OnUpdateAwards($filter: ModelSubscriptionAwardsFilterInput) {
    onUpdateAwards(filter: $filter) {
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
export const onDeleteAwards = /* GraphQL */ `
  subscription OnDeleteAwards($filter: ModelSubscriptionAwardsFilterInput) {
    onDeleteAwards(filter: $filter) {
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
export const onCreateUserCoins = /* GraphQL */ `
  subscription OnCreateUserCoins(
    $filter: ModelSubscriptionUserCoinsFilterInput
  ) {
    onCreateUserCoins(filter: $filter) {
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
export const onUpdateUserCoins = /* GraphQL */ `
  subscription OnUpdateUserCoins(
    $filter: ModelSubscriptionUserCoinsFilterInput
  ) {
    onUpdateUserCoins(filter: $filter) {
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
export const onDeleteUserCoins = /* GraphQL */ `
  subscription OnDeleteUserCoins(
    $filter: ModelSubscriptionUserCoinsFilterInput
  ) {
    onDeleteUserCoins(filter: $filter) {
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
export const onCreateFeedback = /* GraphQL */ `
  subscription OnCreateFeedback($filter: ModelSubscriptionFeedbackFilterInput) {
    onCreateFeedback(filter: $filter) {
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
export const onUpdateFeedback = /* GraphQL */ `
  subscription OnUpdateFeedback($filter: ModelSubscriptionFeedbackFilterInput) {
    onUpdateFeedback(filter: $filter) {
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
export const onDeleteFeedback = /* GraphQL */ `
  subscription OnDeleteFeedback($filter: ModelSubscriptionFeedbackFilterInput) {
    onDeleteFeedback(filter: $filter) {
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
export const onCreateQuizzesResult = /* GraphQL */ `
  subscription OnCreateQuizzesResult(
    $filter: ModelSubscriptionQuizzesResultFilterInput
  ) {
    onCreateQuizzesResult(filter: $filter) {
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
export const onUpdateQuizzesResult = /* GraphQL */ `
  subscription OnUpdateQuizzesResult(
    $filter: ModelSubscriptionQuizzesResultFilterInput
  ) {
    onUpdateQuizzesResult(filter: $filter) {
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
export const onDeleteQuizzesResult = /* GraphQL */ `
  subscription OnDeleteQuizzesResult(
    $filter: ModelSubscriptionQuizzesResultFilterInput
  ) {
    onDeleteQuizzesResult(filter: $filter) {
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
export const onCreateActionItems = /* GraphQL */ `
  subscription OnCreateActionItems(
    $filter: ModelSubscriptionActionItemsFilterInput
  ) {
    onCreateActionItems(filter: $filter) {
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
export const onUpdateActionItems = /* GraphQL */ `
  subscription OnUpdateActionItems(
    $filter: ModelSubscriptionActionItemsFilterInput
  ) {
    onUpdateActionItems(filter: $filter) {
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
export const onDeleteActionItems = /* GraphQL */ `
  subscription OnDeleteActionItems(
    $filter: ModelSubscriptionActionItemsFilterInput
  ) {
    onDeleteActionItems(filter: $filter) {
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
export const onCreateStatements = /* GraphQL */ `
  subscription OnCreateStatements(
    $filter: ModelSubscriptionStatementsFilterInput
  ) {
    onCreateStatements(filter: $filter) {
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
export const onUpdateStatements = /* GraphQL */ `
  subscription OnUpdateStatements(
    $filter: ModelSubscriptionStatementsFilterInput
  ) {
    onUpdateStatements(filter: $filter) {
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
export const onDeleteStatements = /* GraphQL */ `
  subscription OnDeleteStatements(
    $filter: ModelSubscriptionStatementsFilterInput
  ) {
    onDeleteStatements(filter: $filter) {
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
export const onCreateCategories = /* GraphQL */ `
  subscription OnCreateCategories(
    $filter: ModelSubscriptionCategoriesFilterInput
  ) {
    onCreateCategories(filter: $filter) {
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
export const onUpdateCategories = /* GraphQL */ `
  subscription OnUpdateCategories(
    $filter: ModelSubscriptionCategoriesFilterInput
  ) {
    onUpdateCategories(filter: $filter) {
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
export const onDeleteCategories = /* GraphQL */ `
  subscription OnDeleteCategories(
    $filter: ModelSubscriptionCategoriesFilterInput
  ) {
    onDeleteCategories(filter: $filter) {
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
export const onCreateReport = /* GraphQL */ `
  subscription OnCreateReport($filter: ModelSubscriptionReportFilterInput) {
    onCreateReport(filter: $filter) {
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
export const onUpdateReport = /* GraphQL */ `
  subscription OnUpdateReport($filter: ModelSubscriptionReportFilterInput) {
    onUpdateReport(filter: $filter) {
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
export const onDeleteReport = /* GraphQL */ `
  subscription OnDeleteReport($filter: ModelSubscriptionReportFilterInput) {
    onDeleteReport(filter: $filter) {
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
export const onCreateOrganization = /* GraphQL */ `
  subscription OnCreateOrganization(
    $filter: ModelSubscriptionOrganizationFilterInput
  ) {
    onCreateOrganization(filter: $filter) {
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
export const onUpdateOrganization = /* GraphQL */ `
  subscription OnUpdateOrganization(
    $filter: ModelSubscriptionOrganizationFilterInput
  ) {
    onUpdateOrganization(filter: $filter) {
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
export const onDeleteOrganization = /* GraphQL */ `
  subscription OnDeleteOrganization(
    $filter: ModelSubscriptionOrganizationFilterInput
  ) {
    onDeleteOrganization(filter: $filter) {
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
export const onCreateDepartment = /* GraphQL */ `
  subscription OnCreateDepartment(
    $filter: ModelSubscriptionDepartmentFilterInput
  ) {
    onCreateDepartment(filter: $filter) {
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
export const onUpdateDepartment = /* GraphQL */ `
  subscription OnUpdateDepartment(
    $filter: ModelSubscriptionDepartmentFilterInput
  ) {
    onUpdateDepartment(filter: $filter) {
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
export const onDeleteDepartment = /* GraphQL */ `
  subscription OnDeleteDepartment(
    $filter: ModelSubscriptionDepartmentFilterInput
  ) {
    onDeleteDepartment(filter: $filter) {
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
export const onCreateOrganizationMember = /* GraphQL */ `
  subscription OnCreateOrganizationMember(
    $filter: ModelSubscriptionOrganizationMemberFilterInput
  ) {
    onCreateOrganizationMember(filter: $filter) {
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
export const onUpdateOrganizationMember = /* GraphQL */ `
  subscription OnUpdateOrganizationMember(
    $filter: ModelSubscriptionOrganizationMemberFilterInput
  ) {
    onUpdateOrganizationMember(filter: $filter) {
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
export const onDeleteOrganizationMember = /* GraphQL */ `
  subscription OnDeleteOrganizationMember(
    $filter: ModelSubscriptionOrganizationMemberFilterInput
  ) {
    onDeleteOrganizationMember(filter: $filter) {
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
export const onCreateProject = /* GraphQL */ `
  subscription OnCreateProject($filter: ModelSubscriptionProjectFilterInput) {
    onCreateProject(filter: $filter) {
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
export const onUpdateProject = /* GraphQL */ `
  subscription OnUpdateProject($filter: ModelSubscriptionProjectFilterInput) {
    onUpdateProject(filter: $filter) {
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
export const onDeleteProject = /* GraphQL */ `
  subscription OnDeleteProject($filter: ModelSubscriptionProjectFilterInput) {
    onDeleteProject(filter: $filter) {
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
export const onCreateProjectMember = /* GraphQL */ `
  subscription OnCreateProjectMember(
    $filter: ModelSubscriptionProjectMemberFilterInput
  ) {
    onCreateProjectMember(filter: $filter) {
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
export const onUpdateProjectMember = /* GraphQL */ `
  subscription OnUpdateProjectMember(
    $filter: ModelSubscriptionProjectMemberFilterInput
  ) {
    onUpdateProjectMember(filter: $filter) {
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
export const onDeleteProjectMember = /* GraphQL */ `
  subscription OnDeleteProjectMember(
    $filter: ModelSubscriptionProjectMemberFilterInput
  ) {
    onDeleteProjectMember(filter: $filter) {
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
export const onCreateKPI = /* GraphQL */ `
  subscription OnCreateKPI($filter: ModelSubscriptionKPIFilterInput) {
    onCreateKPI(filter: $filter) {
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
export const onUpdateKPI = /* GraphQL */ `
  subscription OnUpdateKPI($filter: ModelSubscriptionKPIFilterInput) {
    onUpdateKPI(filter: $filter) {
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
export const onDeleteKPI = /* GraphQL */ `
  subscription OnDeleteKPI($filter: ModelSubscriptionKPIFilterInput) {
    onDeleteKPI(filter: $filter) {
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
export const onCreateKPIData = /* GraphQL */ `
  subscription OnCreateKPIData($filter: ModelSubscriptionKPIDataFilterInput) {
    onCreateKPIData(filter: $filter) {
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
export const onUpdateKPIData = /* GraphQL */ `
  subscription OnUpdateKPIData($filter: ModelSubscriptionKPIDataFilterInput) {
    onUpdateKPIData(filter: $filter) {
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
export const onDeleteKPIData = /* GraphQL */ `
  subscription OnDeleteKPIData($filter: ModelSubscriptionKPIDataFilterInput) {
    onDeleteKPIData(filter: $filter) {
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
export const onCreateQuiz = /* GraphQL */ `
  subscription OnCreateQuiz($filter: ModelSubscriptionQuizFilterInput) {
    onCreateQuiz(filter: $filter) {
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
export const onUpdateQuiz = /* GraphQL */ `
  subscription OnUpdateQuiz($filter: ModelSubscriptionQuizFilterInput) {
    onUpdateQuiz(filter: $filter) {
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
export const onDeleteQuiz = /* GraphQL */ `
  subscription OnDeleteQuiz($filter: ModelSubscriptionQuizFilterInput) {
    onDeleteQuiz(filter: $filter) {
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
export const onCreateQuestion = /* GraphQL */ `
  subscription OnCreateQuestion($filter: ModelSubscriptionQuestionFilterInput) {
    onCreateQuestion(filter: $filter) {
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
export const onUpdateQuestion = /* GraphQL */ `
  subscription OnUpdateQuestion($filter: ModelSubscriptionQuestionFilterInput) {
    onUpdateQuestion(filter: $filter) {
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
export const onDeleteQuestion = /* GraphQL */ `
  subscription OnDeleteQuestion($filter: ModelSubscriptionQuestionFilterInput) {
    onDeleteQuestion(filter: $filter) {
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
export const onCreatePost = /* GraphQL */ `
  subscription OnCreatePost($filter: ModelSubscriptionPostFilterInput) {
    onCreatePost(filter: $filter) {
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
export const onUpdatePost = /* GraphQL */ `
  subscription OnUpdatePost($filter: ModelSubscriptionPostFilterInput) {
    onUpdatePost(filter: $filter) {
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
export const onDeletePost = /* GraphQL */ `
  subscription OnDeletePost($filter: ModelSubscriptionPostFilterInput) {
    onDeletePost(filter: $filter) {
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
export const onCreateLearning = /* GraphQL */ `
  subscription OnCreateLearning($filter: ModelSubscriptionLearningFilterInput) {
    onCreateLearning(filter: $filter) {
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
export const onUpdateLearning = /* GraphQL */ `
  subscription OnUpdateLearning($filter: ModelSubscriptionLearningFilterInput) {
    onUpdateLearning(filter: $filter) {
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
export const onDeleteLearning = /* GraphQL */ `
  subscription OnDeleteLearning($filter: ModelSubscriptionLearningFilterInput) {
    onDeleteLearning(filter: $filter) {
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
export const onCreateLearningImage = /* GraphQL */ `
  subscription OnCreateLearningImage(
    $filter: ModelSubscriptionLearningImageFilterInput
  ) {
    onCreateLearningImage(filter: $filter) {
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
export const onUpdateLearningImage = /* GraphQL */ `
  subscription OnUpdateLearningImage(
    $filter: ModelSubscriptionLearningImageFilterInput
  ) {
    onUpdateLearningImage(filter: $filter) {
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
export const onDeleteLearningImage = /* GraphQL */ `
  subscription OnDeleteLearningImage(
    $filter: ModelSubscriptionLearningImageFilterInput
  ) {
    onDeleteLearningImage(filter: $filter) {
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
export const onCreateChapter = /* GraphQL */ `
  subscription OnCreateChapter($filter: ModelSubscriptionChapterFilterInput) {
    onCreateChapter(filter: $filter) {
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
export const onUpdateChapter = /* GraphQL */ `
  subscription OnUpdateChapter($filter: ModelSubscriptionChapterFilterInput) {
    onUpdateChapter(filter: $filter) {
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
export const onDeleteChapter = /* GraphQL */ `
  subscription OnDeleteChapter($filter: ModelSubscriptionChapterFilterInput) {
    onDeleteChapter(filter: $filter) {
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
export const onCreateSection = /* GraphQL */ `
  subscription OnCreateSection($filter: ModelSubscriptionSectionFilterInput) {
    onCreateSection(filter: $filter) {
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
export const onUpdateSection = /* GraphQL */ `
  subscription OnUpdateSection($filter: ModelSubscriptionSectionFilterInput) {
    onUpdateSection(filter: $filter) {
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
export const onDeleteSection = /* GraphQL */ `
  subscription OnDeleteSection($filter: ModelSubscriptionSectionFilterInput) {
    onDeleteSection(filter: $filter) {
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
export const onCreateSubSection = /* GraphQL */ `
  subscription OnCreateSubSection(
    $filter: ModelSubscriptionSubSectionFilterInput
  ) {
    onCreateSubSection(filter: $filter) {
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
export const onUpdateSubSection = /* GraphQL */ `
  subscription OnUpdateSubSection(
    $filter: ModelSubscriptionSubSectionFilterInput
  ) {
    onUpdateSubSection(filter: $filter) {
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
export const onDeleteSubSection = /* GraphQL */ `
  subscription OnDeleteSubSection(
    $filter: ModelSubscriptionSubSectionFilterInput
  ) {
    onDeleteSubSection(filter: $filter) {
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
export const onCreateTangible = /* GraphQL */ `
  subscription OnCreateTangible($filter: ModelSubscriptionTangibleFilterInput) {
    onCreateTangible(filter: $filter) {
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
export const onUpdateTangible = /* GraphQL */ `
  subscription OnUpdateTangible($filter: ModelSubscriptionTangibleFilterInput) {
    onUpdateTangible(filter: $filter) {
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
export const onDeleteTangible = /* GraphQL */ `
  subscription OnDeleteTangible($filter: ModelSubscriptionTangibleFilterInput) {
    onDeleteTangible(filter: $filter) {
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
export const onCreateIntangible = /* GraphQL */ `
  subscription OnCreateIntangible(
    $filter: ModelSubscriptionIntangibleFilterInput
  ) {
    onCreateIntangible(filter: $filter) {
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
export const onUpdateIntangible = /* GraphQL */ `
  subscription OnUpdateIntangible(
    $filter: ModelSubscriptionIntangibleFilterInput
  ) {
    onUpdateIntangible(filter: $filter) {
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
export const onDeleteIntangible = /* GraphQL */ `
  subscription OnDeleteIntangible(
    $filter: ModelSubscriptionIntangibleFilterInput
  ) {
    onDeleteIntangible(filter: $filter) {
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
export const onCreateSubscriptionInvoice = /* GraphQL */ `
  subscription OnCreateSubscriptionInvoice(
    $filter: ModelSubscriptionSubscriptionInvoiceFilterInput
    $owner: String
  ) {
    onCreateSubscriptionInvoice(filter: $filter, owner: $owner) {
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
export const onUpdateSubscriptionInvoice = /* GraphQL */ `
  subscription OnUpdateSubscriptionInvoice(
    $filter: ModelSubscriptionSubscriptionInvoiceFilterInput
    $owner: String
  ) {
    onUpdateSubscriptionInvoice(filter: $filter, owner: $owner) {
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
export const onDeleteSubscriptionInvoice = /* GraphQL */ `
  subscription OnDeleteSubscriptionInvoice(
    $filter: ModelSubscriptionSubscriptionInvoiceFilterInput
    $owner: String
  ) {
    onDeleteSubscriptionInvoice(filter: $filter, owner: $owner) {
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
export const onCreateShopItem = /* GraphQL */ `
  subscription OnCreateShopItem($filter: ModelSubscriptionShopItemFilterInput) {
    onCreateShopItem(filter: $filter) {
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
export const onUpdateShopItem = /* GraphQL */ `
  subscription OnUpdateShopItem($filter: ModelSubscriptionShopItemFilterInput) {
    onUpdateShopItem(filter: $filter) {
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
export const onDeleteShopItem = /* GraphQL */ `
  subscription OnDeleteShopItem($filter: ModelSubscriptionShopItemFilterInput) {
    onDeleteShopItem(filter: $filter) {
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
export const onCreateUserPurchase = /* GraphQL */ `
  subscription OnCreateUserPurchase(
    $filter: ModelSubscriptionUserPurchaseFilterInput
  ) {
    onCreateUserPurchase(filter: $filter) {
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
export const onUpdateUserPurchase = /* GraphQL */ `
  subscription OnUpdateUserPurchase(
    $filter: ModelSubscriptionUserPurchaseFilterInput
  ) {
    onUpdateUserPurchase(filter: $filter) {
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
export const onDeleteUserPurchase = /* GraphQL */ `
  subscription OnDeleteUserPurchase(
    $filter: ModelSubscriptionUserPurchaseFilterInput
  ) {
    onDeleteUserPurchase(filter: $filter) {
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
export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser($filter: ModelSubscriptionUserFilterInput) {
    onCreateUser(filter: $filter) {
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
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser($filter: ModelSubscriptionUserFilterInput) {
    onUpdateUser(filter: $filter) {
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
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser($filter: ModelSubscriptionUserFilterInput) {
    onDeleteUser(filter: $filter) {
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
export const onCreateIssue = /* GraphQL */ `
  subscription OnCreateIssue($filter: ModelSubscriptionIssueFilterInput) {
    onCreateIssue(filter: $filter) {
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
export const onUpdateIssue = /* GraphQL */ `
  subscription OnUpdateIssue($filter: ModelSubscriptionIssueFilterInput) {
    onUpdateIssue(filter: $filter) {
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
export const onDeleteIssue = /* GraphQL */ `
  subscription OnDeleteIssue($filter: ModelSubscriptionIssueFilterInput) {
    onDeleteIssue(filter: $filter) {
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
export const onCreateIssueResponse = /* GraphQL */ `
  subscription OnCreateIssueResponse(
    $filter: ModelSubscriptionIssueResponseFilterInput
  ) {
    onCreateIssueResponse(filter: $filter) {
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
export const onUpdateIssueResponse = /* GraphQL */ `
  subscription OnUpdateIssueResponse(
    $filter: ModelSubscriptionIssueResponseFilterInput
  ) {
    onUpdateIssueResponse(filter: $filter) {
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
export const onDeleteIssueResponse = /* GraphQL */ `
  subscription OnDeleteIssueResponse(
    $filter: ModelSubscriptionIssueResponseFilterInput
  ) {
    onDeleteIssueResponse(filter: $filter) {
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
export const onCreateLearningSession = /* GraphQL */ `
  subscription OnCreateLearningSession(
    $filter: ModelSubscriptionLearningSessionFilterInput
  ) {
    onCreateLearningSession(filter: $filter) {
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
export const onUpdateLearningSession = /* GraphQL */ `
  subscription OnUpdateLearningSession(
    $filter: ModelSubscriptionLearningSessionFilterInput
  ) {
    onUpdateLearningSession(filter: $filter) {
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
export const onDeleteLearningSession = /* GraphQL */ `
  subscription OnDeleteLearningSession(
    $filter: ModelSubscriptionLearningSessionFilterInput
  ) {
    onDeleteLearningSession(filter: $filter) {
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
export const onCreateLearningProgress = /* GraphQL */ `
  subscription OnCreateLearningProgress(
    $filter: ModelSubscriptionLearningProgressFilterInput
  ) {
    onCreateLearningProgress(filter: $filter) {
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
export const onUpdateLearningProgress = /* GraphQL */ `
  subscription OnUpdateLearningProgress(
    $filter: ModelSubscriptionLearningProgressFilterInput
  ) {
    onUpdateLearningProgress(filter: $filter) {
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
export const onDeleteLearningProgress = /* GraphQL */ `
  subscription OnDeleteLearningProgress(
    $filter: ModelSubscriptionLearningProgressFilterInput
  ) {
    onDeleteLearningProgress(filter: $filter) {
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
export const onCreateSectionInteraction = /* GraphQL */ `
  subscription OnCreateSectionInteraction(
    $filter: ModelSubscriptionSectionInteractionFilterInput
  ) {
    onCreateSectionInteraction(filter: $filter) {
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
export const onUpdateSectionInteraction = /* GraphQL */ `
  subscription OnUpdateSectionInteraction(
    $filter: ModelSubscriptionSectionInteractionFilterInput
  ) {
    onUpdateSectionInteraction(filter: $filter) {
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
export const onDeleteSectionInteraction = /* GraphQL */ `
  subscription OnDeleteSectionInteraction(
    $filter: ModelSubscriptionSectionInteractionFilterInput
  ) {
    onDeleteSectionInteraction(filter: $filter) {
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
