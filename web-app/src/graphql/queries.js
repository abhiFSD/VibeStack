/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getVsm = /* GraphQL */ `
  query GetVsm($id: ID!) {
    getVsm(id: $id) {
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
export const listVsms = /* GraphQL */ `
  query ListVsms(
    $filter: ModelVsmFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listVsms(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const vsmsByReportID = /* GraphQL */ `
  query VsmsByReportID(
    $reportID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelVsmFilterInput
    $limit: Int
    $nextToken: String
  ) {
    vsmsByReportID(
      reportID: $reportID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getChartData = /* GraphQL */ `
  query GetChartData($id: ID!) {
    getChartData(id: $id) {
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
export const listChartData = /* GraphQL */ `
  query ListChartData(
    $filter: ModelChartDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listChartData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const chartDataByReportID = /* GraphQL */ `
  query ChartDataByReportID(
    $reportID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelChartDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    chartDataByReportID(
      reportID: $reportID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getHighlights = /* GraphQL */ `
  query GetHighlights($id: ID!) {
    getHighlights(id: $id) {
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
export const listHighlights = /* GraphQL */ `
  query ListHighlights(
    $filter: ModelHighlightsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listHighlights(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const highlightsByReportIDAndCreatedAt = /* GraphQL */ `
  query HighlightsByReportIDAndCreatedAt(
    $reportID: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelHighlightsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    highlightsByReportIDAndCreatedAt(
      reportID: $reportID
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getEmailTemplate = /* GraphQL */ `
  query GetEmailTemplate($id: ID!) {
    getEmailTemplate(id: $id) {
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
export const listEmailTemplates = /* GraphQL */ `
  query ListEmailTemplates(
    $filter: ModelEmailTemplateFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listEmailTemplates(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        type
        subject
        htmlTemplate
        organizationID
        isEnabled
        customType
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const emailTemplatesByOrganizationID = /* GraphQL */ `
  query EmailTemplatesByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelEmailTemplateFilterInput
    $limit: Int
    $nextToken: String
  ) {
    emailTemplatesByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        type
        subject
        htmlTemplate
        organizationID
        isEnabled
        customType
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getAwardDefinition = /* GraphQL */ `
  query GetAwardDefinition($id: ID!) {
    getAwardDefinition(id: $id) {
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
export const listAwardDefinitions = /* GraphQL */ `
  query ListAwardDefinitions(
    $filter: ModelAwardDefinitionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAwardDefinitions(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        type
        coins
        title
        description
        organizationID
        isEnabled
        customType
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const awardDefinitionsByOrganizationID = /* GraphQL */ `
  query AwardDefinitionsByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAwardDefinitionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    awardDefinitionsByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        type
        coins
        title
        description
        organizationID
        isEnabled
        customType
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getAwards = /* GraphQL */ `
  query GetAwards($id: ID!) {
    getAwards(id: $id) {
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
export const listAwards = /* GraphQL */ `
  query ListAwards(
    $filter: ModelAwardsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAwards(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const awardsByOrganizationID = /* GraphQL */ `
  query AwardsByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAwardsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    awardsByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getUserCoins = /* GraphQL */ `
  query GetUserCoins($id: ID!) {
    getUserCoins(id: $id) {
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
export const listUserCoins = /* GraphQL */ `
  query ListUserCoins(
    $filter: ModelUserCoinsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserCoins(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const userCoinsByOrganizationID = /* GraphQL */ `
  query UserCoinsByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUserCoinsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    userCoinsByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getFeedback = /* GraphQL */ `
  query GetFeedback($id: ID!) {
    getFeedback(id: $id) {
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
export const listFeedbacks = /* GraphQL */ `
  query ListFeedbacks(
    $filter: ModelFeedbackFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFeedbacks(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getQuizzesResult = /* GraphQL */ `
  query GetQuizzesResult($id: ID!) {
    getQuizzesResult(id: $id) {
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
export const listQuizzesResults = /* GraphQL */ `
  query ListQuizzesResults(
    $filter: ModelQuizzesResultFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listQuizzesResults(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getActionItems = /* GraphQL */ `
  query GetActionItems($id: ID!) {
    getActionItems(id: $id) {
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
export const listActionItems = /* GraphQL */ `
  query ListActionItems(
    $filter: ModelActionItemsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listActionItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const actionItemsByReportID = /* GraphQL */ `
  query ActionItemsByReportID(
    $reportID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelActionItemsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    actionItemsByReportID(
      reportID: $reportID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const actionItemsByProjectID = /* GraphQL */ `
  query ActionItemsByProjectID(
    $projectID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelActionItemsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    actionItemsByProjectID(
      projectID: $projectID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getStatements = /* GraphQL */ `
  query GetStatements($id: ID!) {
    getStatements(id: $id) {
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
export const listStatements = /* GraphQL */ `
  query ListStatements(
    $filter: ModelStatementsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStatements(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const statementsByCategoriesID = /* GraphQL */ `
  query StatementsByCategoriesID(
    $categoriesID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelStatementsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    statementsByCategoriesID(
      categoriesID: $categoriesID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getCategories = /* GraphQL */ `
  query GetCategories($id: ID!) {
    getCategories(id: $id) {
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
export const listCategories = /* GraphQL */ `
  query ListCategories(
    $filter: ModelCategoriesFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCategories(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        reportID
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
      nextToken
      __typename
    }
  }
`;
export const categoriesByReportID = /* GraphQL */ `
  query CategoriesByReportID(
    $reportID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelCategoriesFilterInput
    $limit: Int
    $nextToken: String
  ) {
    categoriesByReportID(
      reportID: $reportID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        name
        reportID
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
      nextToken
      __typename
    }
  }
`;
export const getReport = /* GraphQL */ `
  query GetReport($id: ID!) {
    getReport(id: $id) {
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
export const listReports = /* GraphQL */ `
  query ListReports(
    $filter: ModelReportFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listReports(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        type
        user_sub
        ownerEmail
        ai_id
        completed
        bones
        trend
        target
        media
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
      nextToken
      __typename
    }
  }
`;
export const reportsByOrganizationID = /* GraphQL */ `
  query ReportsByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelReportFilterInput
    $limit: Int
    $nextToken: String
  ) {
    reportsByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        name
        type
        user_sub
        ownerEmail
        ai_id
        completed
        bones
        trend
        target
        media
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
      nextToken
      __typename
    }
  }
`;
export const reportsByProjectID = /* GraphQL */ `
  query ReportsByProjectID(
    $projectID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelReportFilterInput
    $limit: Int
    $nextToken: String
  ) {
    reportsByProjectID(
      projectID: $projectID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        name
        type
        user_sub
        ownerEmail
        ai_id
        completed
        bones
        trend
        target
        media
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
      nextToken
      __typename
    }
  }
`;
export const getOrganization = /* GraphQL */ `
  query GetOrganization($id: ID!) {
    getOrganization(id: $id) {
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
export const listOrganizations = /* GraphQL */ `
  query ListOrganizations(
    $filter: ModelOrganizationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listOrganizations(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getDepartment = /* GraphQL */ `
  query GetDepartment($id: ID!) {
    getDepartment(id: $id) {
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
export const listDepartments = /* GraphQL */ `
  query ListDepartments(
    $filter: ModelDepartmentFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDepartments(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const departmentsByOrganizationID = /* GraphQL */ `
  query DepartmentsByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelDepartmentFilterInput
    $limit: Int
    $nextToken: String
  ) {
    departmentsByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getOrganizationMember = /* GraphQL */ `
  query GetOrganizationMember($id: ID!) {
    getOrganizationMember(id: $id) {
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
export const listOrganizationMembers = /* GraphQL */ `
  query ListOrganizationMembers(
    $filter: ModelOrganizationMemberFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listOrganizationMembers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        organizationID
        departmentID
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
      nextToken
      __typename
    }
  }
`;
export const organizationMembersByOrganizationID = /* GraphQL */ `
  query OrganizationMembersByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelOrganizationMemberFilterInput
    $limit: Int
    $nextToken: String
  ) {
    organizationMembersByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        organizationID
        departmentID
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
      nextToken
      __typename
    }
  }
`;
export const organizationMembersByDepartmentID = /* GraphQL */ `
  query OrganizationMembersByDepartmentID(
    $departmentID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelOrganizationMemberFilterInput
    $limit: Int
    $nextToken: String
  ) {
    organizationMembersByDepartmentID(
      departmentID: $departmentID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        organizationID
        departmentID
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
      nextToken
      __typename
    }
  }
`;
export const getProject = /* GraphQL */ `
  query GetProject($id: ID!) {
    getProject(id: $id) {
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
export const listProjects = /* GraphQL */ `
  query ListProjects(
    $filter: ModelProjectFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listProjects(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const projectsByOrganizationID = /* GraphQL */ `
  query ProjectsByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelProjectFilterInput
    $limit: Int
    $nextToken: String
  ) {
    projectsByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getProjectMember = /* GraphQL */ `
  query GetProjectMember($id: ID!) {
    getProjectMember(id: $id) {
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
export const listProjectMembers = /* GraphQL */ `
  query ListProjectMembers(
    $filter: ModelProjectMemberFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listProjectMembers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const projectMembersByProjectID = /* GraphQL */ `
  query ProjectMembersByProjectID(
    $projectID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelProjectMemberFilterInput
    $limit: Int
    $nextToken: String
  ) {
    projectMembersByProjectID(
      projectID: $projectID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getKPI = /* GraphQL */ `
  query GetKPI($id: ID!) {
    getKPI(id: $id) {
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
export const listKPIS = /* GraphQL */ `
  query ListKPIS(
    $filter: ModelKPIFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listKPIS(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        xAxisLabel
        yAxisLabel
        trend
        target
        startDate
        endDate
        projectID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const kPISByProjectID = /* GraphQL */ `
  query KPISByProjectID(
    $projectID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelKPIFilterInput
    $limit: Int
    $nextToken: String
  ) {
    kPISByProjectID(
      projectID: $projectID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        title
        xAxisLabel
        yAxisLabel
        trend
        target
        startDate
        endDate
        projectID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getKPIData = /* GraphQL */ `
  query GetKPIData($id: ID!) {
    getKPIData(id: $id) {
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
export const listKPIData = /* GraphQL */ `
  query ListKPIData(
    $filter: ModelKPIDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listKPIData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const kPIDataByKpiID = /* GraphQL */ `
  query KPIDataByKpiID(
    $kpiID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelKPIDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    kPIDataByKpiID(
      kpiID: $kpiID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getQuiz = /* GraphQL */ `
  query GetQuiz($id: ID!) {
    getQuiz(id: $id) {
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
export const listQuizzes = /* GraphQL */ `
  query ListQuizzes(
    $filter: ModelQuizFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listQuizzes(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const quizzesByLearningId = /* GraphQL */ `
  query QuizzesByLearningId(
    $learningId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelQuizFilterInput
    $limit: Int
    $nextToken: String
  ) {
    quizzesByLearningId(
      learningId: $learningId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getQuestion = /* GraphQL */ `
  query GetQuestion($id: ID!) {
    getQuestion(id: $id) {
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
export const listQuestions = /* GraphQL */ `
  query ListQuestions(
    $filter: ModelQuestionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listQuestions(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        content
        options
        correctOption
        explanation
        orderIndex
        quizId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const questionsByQuizId = /* GraphQL */ `
  query QuestionsByQuizId(
    $quizId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelQuestionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    questionsByQuizId(
      quizId: $quizId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        content
        options
        correctOption
        explanation
        orderIndex
        quizId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getPost = /* GraphQL */ `
  query GetPost($id: ID!) {
    getPost(id: $id) {
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
export const listPosts = /* GraphQL */ `
  query ListPosts(
    $filter: ModelPostFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPosts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const postsByOrganizationId = /* GraphQL */ `
  query PostsByOrganizationId(
    $organizationId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelPostFilterInput
    $limit: Int
    $nextToken: String
  ) {
    postsByOrganizationId(
      organizationId: $organizationId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getLearning = /* GraphQL */ `
  query GetLearning($id: ID!) {
    getLearning(id: $id) {
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
export const listLearnings = /* GraphQL */ `
  query ListLearnings(
    $filter: ModelLearningFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLearnings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const learningsByOrganizationID = /* GraphQL */ `
  query LearningsByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelLearningFilterInput
    $limit: Int
    $nextToken: String
  ) {
    learningsByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getLearningImage = /* GraphQL */ `
  query GetLearningImage($id: ID!) {
    getLearningImage(id: $id) {
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
export const listLearningImages = /* GraphQL */ `
  query ListLearningImages(
    $filter: ModelLearningImageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLearningImages(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
        organizationID
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
      nextToken
      __typename
    }
  }
`;
export const learningImagesByLearningIDAndCreatedAt = /* GraphQL */ `
  query LearningImagesByLearningIDAndCreatedAt(
    $learningID: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelLearningImageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    learningImagesByLearningIDAndCreatedAt(
      learningID: $learningID
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
        organizationID
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
      nextToken
      __typename
    }
  }
`;
export const learningImagesByOrganizationIDAndCreatedAt = /* GraphQL */ `
  query LearningImagesByOrganizationIDAndCreatedAt(
    $organizationID: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelLearningImageFilterInput
    $limit: Int
    $nextToken: String
  ) {
    learningImagesByOrganizationIDAndCreatedAt(
      organizationID: $organizationID
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
        organizationID
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
      nextToken
      __typename
    }
  }
`;
export const getChapter = /* GraphQL */ `
  query GetChapter($id: ID!) {
    getChapter(id: $id) {
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
export const listChapters = /* GraphQL */ `
  query ListChapters(
    $filter: ModelChapterFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listChapters(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const chaptersByLearningIdAndPosition = /* GraphQL */ `
  query ChaptersByLearningIdAndPosition(
    $learningId: ID!
    $position: ModelIntKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelChapterFilterInput
    $limit: Int
    $nextToken: String
  ) {
    chaptersByLearningIdAndPosition(
      learningId: $learningId
      position: $position
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const chaptersByOrganizationId = /* GraphQL */ `
  query ChaptersByOrganizationId(
    $organizationId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelChapterFilterInput
    $limit: Int
    $nextToken: String
  ) {
    chaptersByOrganizationId(
      organizationId: $organizationId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getSection = /* GraphQL */ `
  query GetSection($id: ID!) {
    getSection(id: $id) {
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
export const listSections = /* GraphQL */ `
  query ListSections(
    $filter: ModelSectionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSections(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const sectionsByChapterIdAndPosition = /* GraphQL */ `
  query SectionsByChapterIdAndPosition(
    $chapterId: ID!
    $position: ModelIntKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelSectionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    sectionsByChapterIdAndPosition(
      chapterId: $chapterId
      position: $position
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const sectionsByOrganizationId = /* GraphQL */ `
  query SectionsByOrganizationId(
    $organizationId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelSectionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    sectionsByOrganizationId(
      organizationId: $organizationId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getSubSection = /* GraphQL */ `
  query GetSubSection($id: ID!) {
    getSubSection(id: $id) {
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
export const listSubSections = /* GraphQL */ `
  query ListSubSections(
    $filter: ModelSubSectionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSubSections(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        slug
        position
        sectionId
        postId
        organizationId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const subSectionsBySectionIdAndPosition = /* GraphQL */ `
  query SubSectionsBySectionIdAndPosition(
    $sectionId: ID!
    $position: ModelIntKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelSubSectionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    subSectionsBySectionIdAndPosition(
      sectionId: $sectionId
      position: $position
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        title
        slug
        position
        sectionId
        postId
        organizationId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const subSectionsByOrganizationId = /* GraphQL */ `
  query SubSectionsByOrganizationId(
    $organizationId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelSubSectionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    subSectionsByOrganizationId(
      organizationId: $organizationId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        title
        slug
        position
        sectionId
        postId
        organizationId
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getTangible = /* GraphQL */ `
  query GetTangible($id: ID!) {
    getTangible(id: $id) {
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
export const listTangibles = /* GraphQL */ `
  query ListTangibles(
    $filter: ModelTangibleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTangibles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        label
        value
        date
        projectID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const tangiblesByProjectID = /* GraphQL */ `
  query TangiblesByProjectID(
    $projectID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelTangibleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    tangiblesByProjectID(
      projectID: $projectID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        label
        value
        date
        projectID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getIntangible = /* GraphQL */ `
  query GetIntangible($id: ID!) {
    getIntangible(id: $id) {
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
export const listIntangibles = /* GraphQL */ `
  query ListIntangibles(
    $filter: ModelIntangibleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listIntangibles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        text
        projectID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const intangiblesByProjectID = /* GraphQL */ `
  query IntangiblesByProjectID(
    $projectID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelIntangibleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    intangiblesByProjectID(
      projectID: $projectID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        text
        projectID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getSubscriptionInvoice = /* GraphQL */ `
  query GetSubscriptionInvoice($id: ID!) {
    getSubscriptionInvoice(id: $id) {
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
export const listSubscriptionInvoices = /* GraphQL */ `
  query ListSubscriptionInvoices(
    $filter: ModelSubscriptionInvoiceFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSubscriptionInvoices(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        organizationId
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
      nextToken
      __typename
    }
  }
`;
export const subscriptionInvoicesByOrganizationId = /* GraphQL */ `
  query SubscriptionInvoicesByOrganizationId(
    $organizationId: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelSubscriptionInvoiceFilterInput
    $limit: Int
    $nextToken: String
  ) {
    subscriptionInvoicesByOrganizationId(
      organizationId: $organizationId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        organizationId
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
      nextToken
      __typename
    }
  }
`;
export const getShopItem = /* GraphQL */ `
  query GetShopItem($id: ID!) {
    getShopItem(id: $id) {
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
export const listShopItems = /* GraphQL */ `
  query ListShopItems(
    $filter: ModelShopItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listShopItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const shopItemsByOrganizationID = /* GraphQL */ `
  query ShopItemsByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelShopItemFilterInput
    $limit: Int
    $nextToken: String
  ) {
    shopItemsByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getUserPurchase = /* GraphQL */ `
  query GetUserPurchase($id: ID!) {
    getUserPurchase(id: $id) {
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
export const listUserPurchases = /* GraphQL */ `
  query ListUserPurchases(
    $filter: ModelUserPurchaseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserPurchases(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        shopItemID
        user_sub
        purchaseDate
        organizationID
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
      nextToken
      __typename
    }
  }
`;
export const userPurchasesByShopItemID = /* GraphQL */ `
  query UserPurchasesByShopItemID(
    $shopItemID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUserPurchaseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    userPurchasesByShopItemID(
      shopItemID: $shopItemID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        shopItemID
        user_sub
        purchaseDate
        organizationID
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
      nextToken
      __typename
    }
  }
`;
export const userPurchasesByOrganizationID = /* GraphQL */ `
  query UserPurchasesByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUserPurchaseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    userPurchasesByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        shopItemID
        user_sub
        purchaseDate
        organizationID
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
      nextToken
      __typename
    }
  }
`;
export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
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
export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const usersByCognitoID = /* GraphQL */ `
  query UsersByCognitoID(
    $cognitoID: String!
    $sortDirection: ModelSortDirection
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    usersByCognitoID(
      cognitoID: $cognitoID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getIssue = /* GraphQL */ `
  query GetIssue($id: ID!) {
    getIssue(id: $id) {
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
export const listIssues = /* GraphQL */ `
  query ListIssues(
    $filter: ModelIssueFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listIssues(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const issuesByOrganizationIDAndCreatedAt = /* GraphQL */ `
  query IssuesByOrganizationIDAndCreatedAt(
    $organizationID: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelIssueFilterInput
    $limit: Int
    $nextToken: String
  ) {
    issuesByOrganizationIDAndCreatedAt(
      organizationID: $organizationID
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getIssueResponse = /* GraphQL */ `
  query GetIssueResponse($id: ID!) {
    getIssueResponse(id: $id) {
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
export const listIssueResponses = /* GraphQL */ `
  query ListIssueResponses(
    $filter: ModelIssueResponseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listIssueResponses(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const issueResponsesByIssueIDAndCreatedAt = /* GraphQL */ `
  query IssueResponsesByIssueIDAndCreatedAt(
    $issueID: ID!
    $createdAt: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelIssueResponseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    issueResponsesByIssueIDAndCreatedAt(
      issueID: $issueID
      createdAt: $createdAt
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getLearningSession = /* GraphQL */ `
  query GetLearningSession($id: ID!) {
    getLearningSession(id: $id) {
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
export const listLearningSessions = /* GraphQL */ `
  query ListLearningSessions(
    $filter: ModelLearningSessionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLearningSessions(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const learningSessionsByUserSubAndStartTime = /* GraphQL */ `
  query LearningSessionsByUserSubAndStartTime(
    $userSub: String!
    $startTime: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelLearningSessionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    learningSessionsByUserSubAndStartTime(
      userSub: $userSub
      startTime: $startTime
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const learningSessionsByOrganizationIDAndStartTime = /* GraphQL */ `
  query LearningSessionsByOrganizationIDAndStartTime(
    $organizationID: ID!
    $startTime: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelLearningSessionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    learningSessionsByOrganizationIDAndStartTime(
      organizationID: $organizationID
      startTime: $startTime
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const learningSessionsByLearningIDAndStartTime = /* GraphQL */ `
  query LearningSessionsByLearningIDAndStartTime(
    $learningID: ID!
    $startTime: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelLearningSessionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    learningSessionsByLearningIDAndStartTime(
      learningID: $learningID
      startTime: $startTime
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const getLearningProgress = /* GraphQL */ `
  query GetLearningProgress($id: ID!) {
    getLearningProgress(id: $id) {
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
export const listLearningProgresses = /* GraphQL */ `
  query ListLearningProgresses(
    $filter: ModelLearningProgressFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLearningProgresses(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userSub
        organizationID
        learningID
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
      nextToken
      __typename
    }
  }
`;
export const learningProgressesByUserSub = /* GraphQL */ `
  query LearningProgressesByUserSub(
    $userSub: String!
    $sortDirection: ModelSortDirection
    $filter: ModelLearningProgressFilterInput
    $limit: Int
    $nextToken: String
  ) {
    learningProgressesByUserSub(
      userSub: $userSub
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userSub
        organizationID
        learningID
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
      nextToken
      __typename
    }
  }
`;
export const learningProgressesByOrganizationID = /* GraphQL */ `
  query LearningProgressesByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelLearningProgressFilterInput
    $limit: Int
    $nextToken: String
  ) {
    learningProgressesByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userSub
        organizationID
        learningID
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
      nextToken
      __typename
    }
  }
`;
export const learningProgressesByLearningID = /* GraphQL */ `
  query LearningProgressesByLearningID(
    $learningID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelLearningProgressFilterInput
    $limit: Int
    $nextToken: String
  ) {
    learningProgressesByLearningID(
      learningID: $learningID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userSub
        organizationID
        learningID
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
      nextToken
      __typename
    }
  }
`;
export const getSectionInteraction = /* GraphQL */ `
  query GetSectionInteraction($id: ID!) {
    getSectionInteraction(id: $id) {
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
export const listSectionInteractions = /* GraphQL */ `
  query ListSectionInteractions(
    $filter: ModelSectionInteractionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSectionInteractions(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const sectionInteractionsByUserSub = /* GraphQL */ `
  query SectionInteractionsByUserSub(
    $userSub: String!
    $sortDirection: ModelSortDirection
    $filter: ModelSectionInteractionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    sectionInteractionsByUserSub(
      userSub: $userSub
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const sectionInteractionsByOrganizationID = /* GraphQL */ `
  query SectionInteractionsByOrganizationID(
    $organizationID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelSectionInteractionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    sectionInteractionsByOrganizationID(
      organizationID: $organizationID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const sectionInteractionsByLearningID = /* GraphQL */ `
  query SectionInteractionsByLearningID(
    $learningID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelSectionInteractionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    sectionInteractionsByLearningID(
      learningID: $learningID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
export const sectionInteractionsBySectionID = /* GraphQL */ `
  query SectionInteractionsBySectionID(
    $sectionID: String!
    $sortDirection: ModelSortDirection
    $filter: ModelSectionInteractionFilterInput
    $limit: Int
    $nextToken: String
  ) {
    sectionInteractionsBySectionID(
      sectionID: $sectionID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      __typename
    }
  }
`;
