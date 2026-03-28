export const getUserAnalyticsData = /* GraphQL */ `
  query GetUserAnalyticsData($userSub: String!) {
    # Get projects where user is a member
    projectMembersByUserSub: listProjectMembers(filter: { userSub: { eq: $userSub }, _deleted: { ne: true } }) {
      items {
        project {
          id
          name
          description
          status
          startDate
          endDate
          organizationID
        }
      }
    }
    
    # Get reports created by or assigned to user
    userReports: listReports(filter: { user_sub: { eq: $userSub }, _deleted: { ne: true } }) {
      items {
        id
        name
        type
        completed
        organizationID
        projectID
      }
    }
    assignedReports: listReports(filter: { assignedMembers: { contains: $userSub }, _deleted: { ne: true } }) {
      items {
        id
        name
        type
        completed
        organizationID
        projectID
      }
    }
    
    # Get action items created by or assigned to user
    userActionItems: listActionItems(filter: { user_sub: { eq: $userSub }, _deleted: { ne: true } }) {
      items {
        id
        title
        description
        status
        projectID
      }
    }
    assignedActionItems: listActionItems(filter: { assignees: { contains: $userSub }, _deleted: { ne: true } }) {
      items {
        id
        title
        description
        status
        projectID
      }
    }
    
    # Get user's awards
    userAwards: listAwards(filter: { user_sub: { eq: $userSub }, _deleted: { ne: true } }) {
      items {
        id
        title
        type
        coins
        date
      }
    }
  }
`;

export const getOrganizationMembers = /* GraphQL */ `
  query GetOrganizationMembers($organizationID: ID!) {
    listOrganizationMembers(filter: { organizationID: { eq: $organizationID }, _deleted: { ne: true } }) {
      items {
        id
        userSub
        email
        role
        departmentID
        status
      }
    }
  }
`;

export const getDepartmentMembers = /* GraphQL */ `
  query GetDepartmentMembers($departmentID: ID!) {
    listOrganizationMembers(filter: { departmentID: { eq: $departmentID }, _deleted: { ne: true } }) {
      items {
        id
        userSub
        email
        role
        organizationID
        status
      }
    }
  }
`;

export const getOrganizationWithDetails = /* GraphQL */ `
  query GetOrganizationWithDetails($id: ID!) {
    getOrganization(id: $id) {
      # Basic Organization Details
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
      createdAt
      updatedAt
      
      # Members with Department Details
      members {
        items {
          id
          organizationID
          departmentID
          department {
            id
            name
            description
          }
          userSub
          email
          status
          role
          createdAt
          updatedAt
        }
      }
      
      # Departments
      departments {
        items {
          id
          name
          description
          createdAt
          updatedAt
        }
      }
      
      # Reports with Categories, Action Items, and Highlights
      Reports {
        items {
          id
          name
          type
          user_sub
          ownerEmail
          completed
          bones
          trend
          target
          media
          xaxis
          yaxis
          projectID
          assignedMembers
          createdAt
          updatedAt
          
          # Categories within Reports
          Categories {
            items {
              id
              name
              orderIndex
              assignees
              attachments
              description
              
              # Statements within Categories
              Statements {
                items {
                  id
                  name
                  value
                  default
                  owner
                  categoryName
                }
              }
            }
          }
          
          # Action Items within Reports
          ActionItems {
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
              user_sub
              projectID
              createdAt
              updatedAt
            }
          }
          
          # Highlights within Reports
          Highlights {
            items {
              id
              title
              description
              images
              assignees
              waste_type
              createdAt
              updatedAt
            }
          }
          
          # Chart Data within Reports
          ChartData {
            items {
              id
              text
              textColor
              posX
              posY
              value
              Description
              date
              orderIndex
            }
          }
          
          # VSM Data
          Vsm {
            id
            process
            informationFlow
            kaizenProject
            demandData
            summaryData
            inventory
          }
        }
      }
      
      # Projects with Members, Reports, Action Items and KPIs
      Projects {
        items {
          id
          name
          description
          startDate
          endDate
          status
          owner
          ownerEmail
          attachments
          createdAt
          updatedAt
          
          # Project Members
          members {
            items {
              id
              userSub
              role
              email
              createdAt
              updatedAt
            }
          }
          
          # Project Action Items
          actionItems {
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
              user_sub
              reportID
              createdAt
              updatedAt
            }
          }
          
          # Project KPIs
          kpis {
            items {
              id
              title
              xAxisLabel
              yAxisLabel
              trend
              target
              startDate
              endDate
              
              # KPI Data Points
              kpiData {
                items {
                  id
                  xAxisValue
                  yAxisvalue
                  date
                  description
                  orderIndex
                }
              }
            }
          }
          
          # Project Tangibles
          tangibles {
            items {
              id
              label
              value
              date
            }
          }
          
          # Project Intangibles
          intangibles {
            items {
              id
              text
            }
          }
        }
      }
      
      # Awards
      awards {
        items {
          id
          type
          coins
          title
          description
          isEnabled
          customType
        }
      }
      
      # Email Templates
      emailTemplates {
        items {
          id
          type
          subject
          htmlTemplate
          isEnabled
          customType
        }
      }
      
      # Learning Content
      learnings {
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
          
          # Chapters
          chapters {
            items {
              id
              title
              slug
              position
              
              # Sections
              sections {
                items {
                  id
                  title
                  slug
                  position
                  
                  # Sub-sections
                  subSections {
                    items {
                      id
                      title
                      slug
                      position
                    }
                  }
                }
              }
            }
          }
          
          # Quizzes
          quizzes {
            items {
              id
              title
              description
              
              # Questions
              questions {
                items {
                  id
                  content
                  options
                  correctOption
                  explanation
                  orderIndex
                }
              }
            }
          }
        }
      }
    }
  }
`;