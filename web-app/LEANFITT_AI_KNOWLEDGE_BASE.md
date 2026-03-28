# VibeStack™ Pro - AI Knowledge Base & GraphQL Query Mapping

This document provides a comprehensive mapping of the VibeStack application structure to GraphQL operations for AI assistant integration. It serves as a complete reference for understanding what data to fetch based on user requests and UI contexts.

## Table of Contents
1. [Application Overview](#application-overview)
2. [Core Data Models](#core-data-models)
3. [21 Lean Methodology Tools](#21-lean-methodology-tools)
4. [Project Management](#project-management)
5. [Action Items Management](#action-items-management)
6. [KPI Tracking](#kpi-tracking)
7. [Learning Management](#learning-management)
8. [Awards & Gamification](#awards--gamification)
9. [Common GraphQL Patterns](#common-graphql-patterns)
10. [UI Component to Query Mapping](#ui-component-to-query-mapping)

## Application Overview

VibeStack™ Pro is a multi-tenant React application supporting 21 lean methodology tools with comprehensive project management, KPI tracking, and gamification features.

### Key Architecture Patterns
- **Multi-tenant**: Organization-based data segregation
- **Context-driven**: React Context for state management
- **Real-time**: GraphQL subscriptions for collaboration
- **User-based**: Organization user access control

### Core Contexts
- `UserContext` - Authentication and user profile
- `OrganizationContext` - Multi-tenant organization management  
- `ToolContext` - Lean tools configuration and data
- `AwardContext` - Gamification and rewards system

## Core Data Models

### Report Model
```graphql
type Report {
  id: ID!
  organizationID: ID!
  categoryID: ID!
  reportTitle: String!
  reportDescription: String
  reportType: String!  # One of 21 tool types
  assignedToUserIDs: [String]
  assignedToUserNames: [String]
  priority: String     # Low, Medium, High, Critical
  reportStatus: String # Active, Completed, Archived
  startDate: AWSDate
  endDate: AWSDate
  createdBy: String
  updatedBy: String
  projectID: ID
  # Report-specific data fields...
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

### Project Model (Legacy - See Project Management section for updated model)
```graphql
# Note: This model is outdated. See Project Management section for correct structure.
type Project {
  id: ID!
  organizationID: ID!
  projectName: String!
  projectDescription: String
  projectStatus: String    # Planning, Active, On Hold, Completed
  startDate: AWSDate
  endDate: AWSDate
  assignedToUserIDs: [String]
  assignedToUserNames: [String]
  createdBy: String
  updatedBy: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

### ActionItem Model
```graphql
type ActionItem {
  id: ID!
  organizationID: ID!
  actionTitle: String!
  actionDescription: String
  status: String          # To Do, In Progress, In Review, Done
  priority: String        # Low, Medium, High, Critical
  dueDate: AWSDate
  assignedToUserIDs: [String]
  assignedToUserNames: [String]
  reportID: ID           # Optional - can be linked to report
  projectID: ID          # Optional - can be linked to project
  createdBy: String
  updatedBy: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

### KPI Model
```graphql
type KPI {
  id: ID!
  organizationID: ID!
  kpiName: String!
  kpiDescription: String
  kpiType: String        # Metric type
  targetValue: Float
  currentValue: Float
  unit: String
  frequency: String      # Daily, Weekly, Monthly, Quarterly
  projectID: ID!
  createdBy: String
  updatedBy: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

## 21 Lean Methodology Tools - Data Structure Guide

### Report Type Categories by Data Model

The AI needs to understand which GraphQL data model each report type uses:

#### Group A: Categories & Statements Data Model
**GraphQL Tables**: Report → Categories → Statements
**Report Types**:
1. **5S Report** - 5 categories (Sort, Set in Order, Shine, Standardize, Sustain)
2. **Gemba Walk Report** - Observation-based assessment
3. **Kaizen Project Report** - Continuous improvement tracking
4. **Lean Assessment Report** - Overall lean maturity assessment
5. **Mistake Proofing Report** - Error prevention evaluation
6. **PDCA Report** - Plan-Do-Check-Act cycle tracking
7. **Waste Walk Report** - 7 wastes identification
8. **Leadership Report** - Leadership effectiveness assessment
9. **A3 Project Report** - Problem-solving methodology
10. **DMAIC Report** - Define-Measure-Analyze-Improve-Control

#### Group B: ChartData Visual Model
**GraphQL Tables**: Report → ChartData (with positioning)
**Report Types**:
11. **Brainstorming Report** - Ideas with spatial positioning
12. **Fishbone Diagram Report** - Root causes by 6M categories
13. **Impact Map Report** - Impact vs Implementation matrix
14. **Stakeholder Analysis Report** - Attitude vs Influence mapping

#### Group C: ChartData Numeric Model
**GraphQL Tables**: Report → ChartData (with numeric values)
**Report Types**:
15. **Histogram Report** - Frequency distribution data
16. **Pareto Chart Report** - Frequency data for 80/20 analysis
17. **Run Chart Report** - Time series numeric data
18. **Scatter Plot Report** - X/Y coordinate data

#### Group D: ChartData Time Model
**GraphQL Tables**: Report → ChartData (with time data)
**Report Types**:
19. **Standard Work Report** - Process timing and operations

#### Standard Work Report Data Model
```graphql
query GetStandardWorkData($reportId: ID!) {
  getReport(id: $reportId) {
    id
    reportTitle
    reportType        # "Standard Work Report"
    bones            # Time unit (1=seconds, 2=minutes, 3=hours)
    target           # Time goal/target for total cycle time
    organizationID
    projectID
    assignedToUserIDs
    assignedToUserNames
    createdAt
    updatedAt
  }
  
  chartDataByReportID(reportID: $reportId) {
    items {
      id
      text             # Operation/task name
      value            # Time duration (in seconds, minutes, or hours)
      description      # Detailed task description
      orderIndex       # Sequence order (drag-and-drop reordering)
      xValue           # Can be used for additional metrics
      yValue           # Can be used for additional metrics
      date             # Task date if applicable
      organizationID
      reportID
      createdAt
      updatedAt
    }
  }
}
```

**Standard Work Data Structure:**
- **Operations**: Each ChartData item represents a work operation/task
- **Timing**: Value field contains the time duration for each operation
- **Sequence**: orderIndex determines the workflow sequence (supports drag-and-drop reordering)
- **Time Units**: Report.bones determines display units (1=seconds, 2=minutes, 3=hours)
- **Target Time**: Report.target contains the goal/target time for total cycle
- **Total Calculation**: Sum of all ChartData.value fields gives total cycle time
- **Video Support**: Can include video attachments for visual work instructions

**How AI Should Interpret Standard Work:**
- Timed sequence of work operations with precise duration tracking
- Supports drag-and-drop reordering to optimize workflow
- Calculates total cycle time automatically
- Compares actual vs target time performance
- Can include video demonstrations of standard procedures
- Used for cycle time optimization and training standardization

#### Group E: VSM Complex Model
**GraphQL Tables**: Report → Vsm → Attributes
**Report Types**:
20. **Value Stream Mapping Report** - Process flow with value analysis

#### Group F: 5 Whys Special Model
**GraphQL Tables**: Report → Categories → Statements (nested questions)
**Report Types**:
21. **5 Whys Report** - Root cause analysis through questioning

### GraphQL Data Queries by Report Group

#### Group A: Categories & Statements Data
```graphql
# Query for Categories & Statements data
query GetReportWithCategories($reportId: ID!) {
  getReport(id: $reportId) {
    id
    name
    type
    completed
    bones        # Time units (1=seconds, 2=minutes, 3=hours)
    trend        # For Run Chart (positive/negative trend)
    target       # Target values, Y-axis labels, takt time
    media        # Video keys, X-axis labels
    xaxis        # X-axis label
    yaxis        # Y-axis label
    assignedMembers # Array of user IDs
  }
  
  categoriesByReportID(reportID: $reportId) {
    items {
      id
      name
      orderIndex
      reportID
      assignees    # Array of user IDs for Additional Details assignees
      attachments  # Array of S3 keys for Additional Details attachments
      description  # Rich text description from Additional Details section
    }
  }
  
  statementsByCategoriesID(categoriesID: $categoryId) {
    items {
      id
      name         # Statement text
      value        # 1-5 scale (1=Strongly Disagree, 2=Disagree, 3=Neutral, 4=Agree, 5=Strongly Agree)
      categoriesID
      default      # True for default/template statements
      owner        # User sub for custom statements
    }
  }
}
```

**How AI Should Interpret:**
- **5S Report**: 6 categories (Sort, Set in Order, Shine, Standardize, Sustain, Safety) with specific default statements each, 1-5 scale scoring, radar chart
- **Gemba Walk**: Department-based categories with observation statements, 0-4 scale assessment
- **Kaizen Project**: Project phase categories with improvement statements, 0-4 scale assessment
- **Lean Assessment**: Lean principle categories with maturity assessment statements, 0-4 scale scoring
- **Mistake Proofing**: Prevention categories with detection statements, 0-4 scale assessment
- **Standard Work**: Uses ChartData model, not categories (see Group D)
- **Waste Walk**: Area/waste type categories with identification statements, 0-4 scale + highlights
- **5 Whys**: Sequential categories (Problem Statement, Why 1-5, Root Cause) with text-based responses
- **Leadership**: Uses highlights primarily, categories as secondary (see Group A Special)
- **PDCA**: Uses highlights primarily, categories as secondary (see Group A Special)

#### Group A Special: Highlight Cards Data Model
**GraphQL Tables**: Report → Highlights
**Report Types with Highlights**:
- **A3 Project Report**: 8 structured phases (Problem Statement, Current State, Improvement Opportunity, Problem Analysis, Future State, Implementation Plan, Verify Results, Follow-Up)
- **PDCA Report**: 4 phases (Plan, Do, Check, Act) + traditional categories
- **DMAIC Report**: 5-6 phases (Prepare, Define, Measure, Analyze, Improve, Control)
- **Leadership Report**: 6 business-focused areas (Accomplishments and significant events, Improvement PDCAs, Special recognitions, Upcoming issues and events, Resource and support needs, Action Items) + traditional categories
- **Waste Walk Report**: 7 waste types with highlight cards

#### Highlights Model
```graphql
type Highlights {
  id: ID!
  title: String!           # Phase/step name (e.g., "Problem Statement", "Define")
  description: String!     # Rich HTML content with detailed information
  images: [String]         # Array of S3 keys for attached files/images
  assignees: [String]      # Array of email addresses for assigned team members
  reportID: ID!            # Reference to parent report
  waste_type: String       # Used for Waste Walk Report categorization
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime
}
```

#### Query Highlights by Report
```graphql
query GetReportHighlights($reportId: ID!) {
  getReport(id: $reportId) {
    id
    reportTitle
    reportType
    reportStatus
  }
  
  highlightsByReportIDAndCreatedAt(
    reportID: $reportId
    sortDirection: ASC
  ) {
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
}
```

**How AI Should Interpret Highlights:**
- **A3 Project Report**: 8 structured problem-solving phases with rich content (Note: "Implementation Plan" card shows action items)
- **PDCA Report**: 4 continuous improvement phases + traditional scoring
- **DMAIC Report**: 5-6 Six Sigma methodology phases
- **Leadership Report**: 6 business-focused areas for leadership communication + traditional scoring (Note: "Action Items" card shows action items)
- **Waste Walk Report**: 7 waste categories with observations and images

#### Special Highlight Cards with Action Items
Some highlight cards display action items instead of regular highlight content:
- **A3 Project Report**: "Implementation Plan" card shows ActionItemsCard component
- **Leadership Report**: "Action Items" card shows ActionItemsCard component

These cards provide:
- Total count of action items/notes
- Up to 2 items by default with "Load More" functionality
- Status badges, due dates, assignees, and attachments
- Buttons for creating new action items and viewing full board

#### Group B: ChartData Visual Data (Board/Canvas Reports)
```graphql
query GetBoardReportData($reportId: ID!) {
  getReport(id: $reportId) {
    id
    reportTitle
    reportType
    bones        # Number of fishbone categories or board structure
    organizationID
    projectID
    assignedToUserIDs
    assignedToUserNames
    createdAt
    updatedAt
  }
  
  chartDataByReportID(reportID: $reportId) {
    items {
      id
      text         # Content of draggable elements (ideas, causes, factors)
      textColor    # Color coding for visual categories
      posX         # X position on board/canvas
      posY         # Y position on board/canvas
      Description  # Detailed description
      orderIndex   # Order in lists
      organizationID
      reportID
      createdAt
      updatedAt
    }
  }
}
```

**Board Reports Data Structure:**
- **Brainstorming Report**: Ideas with spatial positioning, color-coded categories, drag-and-drop interface for creative thinking
- **Fishbone Diagram Report**: Causes organized by 6M categories (Man, Machine, Material, Method, Measurement, Environment), fishbone diagram layout
- **Impact Map Report**: Items positioned on Impact (High/Low) vs Implementation (Easy/Hard) matrix, strategic visualization
- **Stakeholder Analysis Report**: Stakeholders positioned on Attitude/Influence or Power/Interest matrix, relationship mapping

**How AI Should Interpret Board Reports:**
- Use posX/posY coordinates for spatial positioning and visual relationships
- textColor provides categorical grouping and visual organization
- Description field contains detailed analysis and context
- orderIndex maintains sequence for list-based views
- These reports support both board view (spatial) and list view (linear) modes
- Board navigation: `/report/board/${reportId}` for interactive editing

#### Group C: ChartData Numeric Data (Chart Reports)
```graphql
query GetChartReportData($reportId: ID!) {
  getReport(id: $reportId) {
    id
    reportTitle
    reportType
    target       # Target line value, Y-axis label
    media        # X-axis label
    trend        # For Run Chart (positive/negative trend)
    xaxis        # X-axis label
    yaxis        # Y-axis label
    organizationID
    projectID
    assignedToUserIDs
    assignedToUserNames
    createdAt
    updatedAt
  }
  
  chartDataByReportID(reportID: $reportId) {
    items {
      id
      text         # Label/category name, bin range
      value        # Numeric value, frequency count
      xValue       # X-axis value (scatter plot)
      yValue       # Y-axis value (scatter plot)
      date         # Date value (run chart, time-series)
      description  # Additional context, data point description
      organizationID
      reportID
      createdAt
      updatedAt
    }
  }
}
```

**Chart Reports Data Structure:**
- **Histogram Report**: Frequency distribution with bin labels (`text`) and counts (`value`), statistical analysis
- **Pareto Chart Report**: Categories (`text`) with frequencies (`value`), automatic descending sort, cumulative percentages, 80/20 rule
- **Run Chart Report**: Time-series data with values (`value`) and dates (`date`), trend analysis, target line overlay
- **Scatter Plot Report**: Correlation data with X (`xValue`) and Y (`yValue`) coordinates, custom axis labels

**How AI Should Interpret Chart Reports:**
- Use specific fields based on chart type: date for time-series, xValue/yValue for scatter plots
- target field provides baseline or goal line for comparison
- media/xaxis/yaxis provide axis labeling and context
- trend field indicates positive/negative trend direction for Run Charts
- value field contains primary numeric data for analysis
- description provides context and insights for each data point

#### Group D: ChartData Time Data (Standard Work)
Note: This overlaps with the detailed Standard Work section above - same data structure as Group D in the detailed breakdown.

#### Group E: VSM Complex Data (Value Stream Mapping)
Note: This overlaps with the comprehensive VSM section above - same data structure as Group E in the detailed breakdown.

#### Group F: 5 Whys Special Data (Sequential Questioning)
```graphql
query Get5WhysData($reportId: ID!) {
  getReport(id: $reportId) {
    id
    reportTitle
    reportType        # "5 Whys Report"
    organizationID
    projectID
    assignedToUserIDs
    assignedToUserNames
    createdAt
    updatedAt
  }
  
  categoriesByReportID(reportID: $reportId) {
    items {
      id
      name            # "Problem Statement", "Why 1", "Why 2", "Why 3", "Why 4", "Why 5", "Root Cause"
      orderIndex      # Sequential order (0-6)
      assignees       # Array of user IDs for Additional Details assignees
      attachments     # Array of S3 keys for Additional Details attachments
      description     # Rich text description from Additional Details section
      reportID
      organizationID
      createdAt
      updatedAt
    }
  }
  
  statementsByCategoriesID(categoriesID: $categoryId) {
    items {
      id
      name           # Question text or response
      value          # Not used in 5 Whys (always 0)
      categoriesID
      default        # True for template questions
      owner          # User sub for custom responses
      organizationID
      createdAt
      updatedAt
    }
  }
}
```

**5 Whys Data Structure:**
- **Sequential Categories**: Problem Statement → Why 1 → Why 2 → Why 3 → Why 4 → Why 5 → Root Cause
- **Text-Based**: Uses statements for questions and responses, not numerical scoring
- **Progressive**: Each "Why" builds on the previous response
- **Root Cause**: Final category contains the identified root cause
- **Additional Details**: Each category can have detailed description, assignees, and attachments

**How AI Should Interpret 5 Whys:**
- Follow the sequential questioning pattern from problem to root cause
- Use statement.name for question text and response content
- Focus on the logical progression of analysis
- Root cause is the final outcome in the last category
- Additional Details provide context and supporting documentation

### VSM Process Cards Structure (Detailed Reference)
**VSM Process Cards Structure** (JSON array in `process` field):
```json
[
  {
    "processID": "1704123456_123",           // Unique identifier for each process
    "Name": "Order Receipt",                 // Process name displayed in UI
    "CycleTime": "8.5",                     // Total cycle time for this process
    "CycleTimeUnit": "minutes",             // Unit for cycle time
    "CycleEfficiency": "",                  // Process efficiency percentage (optional)
    "CycleTimeIsSumOfAttributes": true,     // Whether cycle time equals sum of attributes
    "Note": "Customer call processing...",  // Process description/notes
    "Images": [                             // Array of S3 image keys for process photos
      "image-key-1.jpg",
      "image-key-2.jpg"
    ],
    "Waste": ["Waiting", "Motion"],         // Array of waste types in this process
    "Attributes": [                         // Array of detailed process attributes
      {
        "id": "attr-1",                     // Unique attribute ID
        "name": "Customer call intake",     // Attribute name/description
        "status": "Value Added",            // "Value Added", "Value Enabled", "Non-value Added"
        "value": "3.0",                     // Time value for this attribute
        "unit": "minutes"                   // Time unit for this attribute
      },
      {
        "id": "attr-2",
        "name": "Data entry verification",
        "status": "Value Enabled",
        "value": "2.5",
        "unit": "minutes"
      },
      {
        "id": "attr-3",
        "name": "System processing wait",
        "status": "Non-value Added",
        "value": "3.0",
        "unit": "minutes"
      }
    ]
  }
]
```

**VSM Inventory Cards Structure** (JSON array in `inventory` field):
```json
[
  {
    "WaitTimeOrInventory": "45",            // Wait time or inventory level
    "WaitTimeOrInventoryUnit": "minutes",   // Unit for wait time/inventory
    "waste": ["Waiting", "Overprocessing"] // Array of waste types during wait
  },
  {
    "WaitTimeOrInventory": "30",
    "WaitTimeOrInventoryUnit": "minutes",
    "waste": ["Waiting"]
  }
]
```

**VSM Demand Data Structure** (JSON in `demandData` field):
```json
{
  "totalDemand": "240",                     // Total customer demand volume
  "timeToProduce": "480",                   // Total time to produce demand
  "timeToProduceUnit": "minutes"            // Unit for production time
}
```

**VSM Summary Data Structure** (JSON in `summaryData` field):
```json
{
  "totalLeadTime": {
    "value": "336.50",                      // Total lead time across all processes
    "unit": "minutes"                       // Unit for lead time
  },
  "totalCycleTime": {
    "value": "66.50",                       // Total cycle time (sum of all process cycle times)
    "unit": "minutes"
  },
  "cycleTimePercentage": "19.75",           // Cycle time as percentage of total lead time
  "totalWaitTimeOrInventory": {
    "value": "270.00",                      // Total wait time between processes
    "unit": "minutes"
  },
  "waitTimeOrInventoryDelayPercentage": "80.25" // Wait time as percentage of lead time
}
```

**Information Flow Data** (Text in `informationFlow` field):
- Communication patterns between processes
- Data flow descriptions
- Information system interactions
- Scheduling and planning communications

**Kaizen Project Data** (Text in `kaizenProject` field):
- Improvement opportunities identified
- Kaizen initiatives planned or implemented
- Continuous improvement projects
- Future state recommendations

**How to Access VSM Data with GraphQL:**

**Step 1: Fetch VSM Data**
```javascript
const fetchVSMData = async (reportId) => {
  const result = await API.graphql({
    query: `
      query GetVSMData($reportId: ID!) {
        vsmsByReportID(reportID: $reportId, filter: { _deleted: { ne: true } }) {
          items {
            id
            process
            inventory
            informationFlow
            kaizenProject
            demandData
            summaryData
          }
        }
      }
    `,
    variables: { reportId }
  });
  
  return result.data.vsmsByReportID.items[0];
};
```

**Step 2: Parse JSON Data**
```javascript
const parseVSMData = (vsmItem) => {
  // Parse JSON strings to objects/arrays
  const processCards = JSON.parse(vsmItem.process || '[]');
  const inventoryCards = JSON.parse(vsmItem.inventory || '[]');
  const demandData = JSON.parse(vsmItem.demandData || '{}');
  const summaryData = JSON.parse(vsmItem.summaryData || '{}');
  
  return {
    processCards,
    inventoryCards,
    demandData,
    summaryData,
    informationFlow: vsmItem.informationFlow,
    kaizenProject: vsmItem.kaizenProject
  };
};
```

**Step 3: Access Process Attributes**
```javascript
const displayProcessDetails = (processCards) => {
  processCards.forEach(process => {
    console.log('Process:', process.Name);
    console.log('Cycle Time:', process.CycleTime, process.CycleTimeUnit);
    
    // Access each attribute within the process
    process.Attributes.forEach(attr => {
      console.log(`  Attribute: ${attr.name}`);
      console.log(`  Time: ${attr.value} ${attr.unit}`);
      console.log(`  Value Type: ${attr.status}`);
    });
    
    // Access waste types
    console.log('Waste Types:', process.Waste.join(', '));
    
    // Access images
    if (process.Images && process.Images.length > 0) {
      console.log('Process Images:', process.Images);
    }
  });
};
```

**Step 4: Display Wait Times and Inventory**
```javascript
const displayWaitTimes = (inventoryCards) => {
  inventoryCards.forEach((inventory, index) => {
    console.log(`Wait/Inventory ${index + 1}:`);
    console.log(`  Time: ${inventory.WaitTimeOrInventory} ${inventory.WaitTimeOrInventoryUnit}`);
    console.log(`  Waste: ${inventory.waste.join(', ')}`);
  });
};
```

**Complete VSM Data Access Pattern:**
```javascript
const getCompleteVSMData = async (reportId) => {
  // 1. Fetch VSM data
  const vsmData = await fetchVSMData(reportId);
  
  // 2. Parse JSON fields
  const {
    processCards,
    inventoryCards,
    demandData,
    summaryData,
    informationFlow,
    kaizenProject
  } = parseVSMData(vsmData);
  
  // 3. Access all data components
  return {
    // Process flow with attributes
    processes: processCards.map(process => ({
      id: process.processID,
      name: process.Name,
      cycleTime: process.CycleTime,
      cycleTimeUnit: process.CycleTimeUnit,
      attributes: process.Attributes.map(attr => ({
        name: attr.name,
        value: attr.value,
        unit: attr.unit,
        valueType: attr.status  // Value Added, Value Enabled, Non-value Added
      })),
      waste: process.Waste,
      images: process.Images,
      notes: process.Note
    })),
    
    // Wait times between processes
    waitTimes: inventoryCards.map(inventory => ({
      time: inventory.WaitTimeOrInventory,
      unit: inventory.WaitTimeOrInventoryUnit,
      waste: inventory.waste
    })),
    
    // Overall metrics
    summary: {
      totalLeadTime: summaryData.totalLeadTime,
      totalCycleTime: summaryData.totalCycleTime,
      efficiency: summaryData.cycleTimePercentage,
      waitTimePercentage: summaryData.waitTimeOrInventoryDelayPercentage
    },
    
    // Demand and targets
    demand: {
      customerDemand: demandData.totalDemand,
      productionTime: demandData.timeToProduce,
      timeUnit: demandData.timeToProduceUnit
    },
    
    // Flow descriptions
    informationFlow: informationFlow,
    kaizenProjects: kaizenProject
  };
};
```

**How AI Should Interpret:**
- **Process Cards**: Each process has detailed attributes with value classification and timing
- **Attributes Access**: Use `process.Attributes[]` array to get detailed breakdown of each process step
- **Wait Times**: Between processes, stored in inventory cards with waste identification
- **Value Analysis**: Each attribute classified as "Value Added", "Value Enabled", or "Non-value Added"
- **Waste Tracking**: Both at process level (`process.Waste`) and inventory level (`inventory.waste`)
- **Summary Metrics**: Calculated totals for lead time, cycle time, and efficiency percentages
- **Demand Planning**: Customer requirements and production targets
- **Information Flow**: Communication and data flow descriptions
- **Kaizen Projects**: Improvement opportunities and initiatives
- **All Data is JSON**: Process, inventory, demand, and summary data stored as JSON strings requiring parsing

#### Group F: 5 Whys Special Data (Root Cause Analysis)
```graphql
query Get5WhysData($reportId: ID!) {
  getReport(id: $reportId) {
    id
    name
    type
    completed
  }
  
  categoriesByReportID(reportID: $reportId) {
    items {
      id
      name         # Problem statement or "Why" level
      orderIndex   # Sequential order (0=Problem, 1=Why1, 2=Why2, etc.)
      assignees    # Array of user IDs
      attachments  # Array of S3 keys
      description  # Category description
    }
  }
  
  statementsByCategoriesID(categoriesID: $categoryId) {
    items {
      id
      name         # Why question or answer text
      value        # Not used in 5 Whys (text-based)
      default      # True for default template questions
      owner        # User sub for custom statements
    }
  }
}
```

**Default Categories Structure**:
- **Problem Statement** (orderIndex: 0)
- **Why 1** (orderIndex: 1)
- **Why 2** (orderIndex: 2)
- **Why 3** (orderIndex: 3)
- **Why 4** (orderIndex: 4)
- **Why 5** (orderIndex: 5)
- **Root Cause** (orderIndex: 6)

**How AI Should Interpret:**
- **5 Whys**: Sequential root cause analysis through iterative questioning
- **Text-based responses**: Unlike other reports, uses text rather than numeric scoring
- **Sequential flow**: Each "Why" builds on the previous answer
- **Root cause identification**: Final category identifies the fundamental cause

### Complete Report Type Details

#### **LEAN TOOLS (12 Reports)**

##### **1. 5S Report**
- **Data Model**: Categories (6) + Statements (30 default statements)
- **Categories**: Sort (6 statements), Set in Order (5), Shine (4), Standardize (5), Safety (5), Sustain (5)
- **Scoring**: 1-5 Likert scale (Strongly Disagree to Strongly Agree)
- **Visualization**: Radar chart with category averages (domain 1-5)
- **Features**: Manual initialization, drag-and-drop category ordering, attachments, assignees, rich text descriptions
- **Action Items**: Supported
- **Special**: No automatic setup - users manually add categories and statements

**5S Additional Details Component:**
Each category has an "Additional Details" section that includes:
- **Description**: Rich text editor (ReactQuill) for detailed category descriptions
- **Assignees**: Team member assignments with add/remove functionality and avatar display
- **Attachments**: File upload and management system with image compression support

**5S Statement Management:**
- **StatementModal**: Dedicated modal for statement management with two tabs:
  - **Default Statements Tab**: Shows all predefined statements for the specific category
  - **Added Statements Tab**: Shows statements that have been added to the current category
- **Custom Statements**: Users can add their own statements to any category
- **Statement Values**: 1-5 Likert scale (Strongly Disagree to Strongly Agree)
- **Category Scoring**: Total score and average score displayed as badges on each category card

**Note**: The Additional Details component is also used in other category-based reports (Gemba Walk, Kaizen, Lean Assessment, Mistake Proofing, 5 Whys, Leadership)

**5S Default Categories and Statements Structure:**

**Sort Category (6 statements):**
- "The area is clear of excess equipment, paperwork, or other types of materials."
- "The area looks organized."
- "The area is clear of excess personal items or is appropriately placed."
- "The area is clear of outdated manuals, brochures, visual performance charts, etc."
- "Electronic files are organized and only recent ones are available."
- "Emails are not kept longer than a certain period of time to ensure time not wasted looking for one."

**Set In Order Category (5 statements):**
- "Equipment, paperwork, or other types of materials are in their correct places."
- "Equipment, paperwork, supplies, etc. are properly labeled."
- "Visual indicators are used to help locate items as needed."
- "Electronic files and folders use a standard naming convention."
- "Email folders are organized by a standard naming convention."

**Shine Category (4 statements):**
- "Equipment of all types is free or grime and dust."
- "Trash containers are emptied on a regular basis."
- "Bulletin boards (physical ones as well as Web postings) are up-to-date."
- "Desktop areas are clean."

**Standardize Category (5 statements):**
- "Employees can explain the benefits of 5S."
- "Checklists are available and visible to help identify correct locations for items."
- "Display boards are up-to-date."
- "Specific cleaning assignments are assigned."
- "5S standards are posted and everyone is aware of them."

**Safety Category (5 statements):**
- "There is no equipment, supplies, etc. creating work hazards."
- "Employees are wearing protective clothing."
- "Entrance ways and pathways are clear."
- "Fire extinguishers and safety equipment are easily accessible."
- "There are no trip hazards (cords, wires, equipment, etc.) in the area."

**Sustain Category (5 statements):**
- "Success 5S stories are shared."
- "There have been improvements to the 5S program."
- "Everyone is aware of their role in 5S."
- "5S seems to be a way of life."
- "Reward and recognition is evident for 5S."

##### **2. A3 Project Report**
- **Data Model**: Highlights only (8 predefined sections)
- **Highlights**: Problem Statement, Current State, Improvement Opportunity, Problem Analysis, Future State, Implementation Plan, Verify Results, Follow-Up
- **Special**: Implementation Plan card shows ActionItemsCard
- **Visualization**: Document-style layout, no radar chart
- **Features**: Rich HTML content, **Additional Details** (description, assignees, images), team assignments
- **Action Items**: Integrated into Implementation Plan highlight

##### **3. DMAIC Report**
- **Data Model**: Highlights only (5-6 predefined phases)
- **Highlights**: (Prepare), Define, Measure, Analyze, Improve, Control
- **Visualization**: 3x2 grid layout, no radar chart
- **Features**: Six Sigma methodology focus, process improvement phases, **Additional Details** (description, assignees, images)
- **Action Items**: Supported

##### **4. Gemba Walk Report**
- **Data Model**: Categories (department-based) + Statements (observation-based)
- **Categories**: Vary by organization (departments/areas)
- **Scoring**: 0-4 scale assessment
- **Visualization**: Radar chart for department assessments
- **Features**: Department-specific filtering, observation focus, **Additional Details** (description, assignees, attachments)
- **Action Items**: Supported

##### **5. Kaizen Project Report**
- **Data Model**: Categories (project phases) + Statements (improvement-focused)
- **Categories**: Project phases (varies by project type)
- **Scoring**: 0-4 scale assessment
- **Visualization**: Radar chart showing phase progress
- **Features**: Phase-based organization, continuous improvement focus, **Additional Details** (description, assignees, attachments)
- **Action Items**: Supported

##### **6. Leadership Report**
- **Data Model**: Highlights (6 sections) + Traditional Categories
- **Highlights**: Accomplishments, Improvement PDCAs, Special recognitions, Upcoming issues, Resource needs, Action Items
- **Special**: Action Items card shows ActionItemsCard, dual tab structure
- **Visualization**: 3x2 grid layout + traditional radar chart
- **Features**: Leadership communication tool, defaults to Departments tab
- **Action Items**: Integrated into Action Items highlight

##### **7. Lean Assessment Report**
- **Data Model**: Categories (lean principles) + Statements (maturity assessment)
- **Categories**: Lean principle categories (varies by assessment type)
- **Scoring**: 0-4 scale maturity assessment
- **Visualization**: Radar chart for lean maturity
- **Features**: Comprehensive lean evaluation, no highlights, **Additional Details** (description, assignees, attachments)
- **Action Items**: Supported

##### **8. Mistake Proofing Report**
- **Data Model**: Categories (prevention areas) + Statements (detection/prevention)
- **Categories**: Mistake-proofing categories
- **Scoring**: 0-4 scale effectiveness assessment
- **Visualization**: Radar chart showing prevention effectiveness
- **Features**: Error prevention focus, detection mechanisms, **Additional Details** (description, assignees, attachments)
- **Action Items**: Supported

##### **9. PDCA Report**
- **Data Model**: Highlights (4 phases) + Traditional Categories
- **Highlights**: Plan, Do, Check, Act
- **Visualization**: 2x2 grid layout + traditional radar chart
- **Features**: Continuous improvement cycle, dual structure, **Additional Details** (description, assignees, images for highlights; description, assignees, attachments for categories)
- **Action Items**: Supported

##### **10. Standard Work Report**
- **Data Model**: ChartData (operations) + Video attachments
- **ChartData**: Operation type, start/end times, cycle times, descriptions
- **Operation Types**: Auto (blue), Manual (green), Wait (red), Walk (orange)
- **Visualization**: Gantt-style timeline chart
- **Features**: Drag-and-drop ordering, video support, takt time analysis
- **Action Items**: Supported

##### **11. Value Stream Mapping Report**
- **Data Model**: VSM (complex JSON) + ActionItems
- **VSM Data Components**:
  - **Process Cards**: Cycle times, attributes, value classification, waste tracking
  - **Inventory Cards**: Wait times, waste identification
  - **Summary Data**: Process metrics and calculations
  - **Total Demand/Target Data**: Customer demand and production targets
  - **Information Flow**: Communication and data flow descriptions
  - **Kaizen Project**: Improvement opportunities and initiatives
- **Visualization**: Process flow diagram with value analysis
- **Features**: Complex process mapping, waste identification, value-added analysis, comprehensive flow documentation
- **Action Items**: Improvement opportunities

##### **12. Waste Walk Report**
- **Data Model**: Categories (areas/waste types) + Statements + Highlights
- **Categories**: Area or waste type categories
- **Scoring**: 0-4 scale waste identification
- **Visualization**: Radar chart + highlight cards
- **Features**: Waste type tracking, observation documentation, **Additional Details** (description, assignees, attachments for categories; description, assignees, images for highlights)
- **Action Items**: Supported

#### **QUALITY TOOLS (9 Reports)**

##### **13. 5 Whys Report**
- **Data Model**: Categories (sequential why levels) + Statements (text-based)
- **Categories**: Problem Statement, Why 1-5, Root Cause (7 total)
- **Scoring**: Text-based responses (no numeric scoring)
- **Visualization**: Radar chart for analysis
- **Features**: Sequential root cause analysis, iterative questioning, **Additional Details** (description, assignees, attachments)
- **Action Items**: Supported

##### **14. Brainstorming Report**
- **Data Model**: ChartData (board positioning)
- **ChartData**: Ideas with spatial positioning, color coding
- **Visualization**: Interactive board/canvas view
- **Features**: Drag-and-drop idea positioning, color-coded categories
- **Action Items**: Supported

##### **15. Fishbone Diagram Report**
- **Data Model**: ChartData (cause positioning)
- **ChartData**: Causes with 6M category colors, spatial positioning
- **6M Categories**: Man, Machine, Material, Method, Measurement, Environment
- **Visualization**: Fishbone diagram layout
- **Features**: Cause-and-effect visualization, category-based cause organization
- **Action Items**: Supported

##### **16. Histogram Report**
- **Data Model**: ChartData (frequency data)
- **ChartData**: Bin labels, frequency counts
- **Visualization**: Histogram bar chart
- **Features**: Frequency distribution analysis, statistical insights
- **Action Items**: Supported

##### **17. Impact Map Report**
- **Data Model**: ChartData (matrix positioning)
- **ChartData**: Impact factors with positioning on impact vs implementation matrix
- **Visualization**: Interactive impact vs implementation matrix
- **Features**: Strategic impact visualization, priority quadrants
- **Action Items**: Supported

##### **18. Pareto Chart Report**
- **Data Model**: ChartData (categorical frequency)
- **ChartData**: Categories with frequency counts
- **Visualization**: Pareto chart (bars + cumulative line)
- **Features**: Automatic descending sort, cumulative percentages, 80/20 rule
- **Action Items**: Supported

##### **19. Run Chart Report**
- **Data Model**: ChartData (time series)
- **ChartData**: Values with dates
- **Report Fields**: `trend` (direction), `target` (goal line), axis labels
- **Visualization**: Line chart over time with trend analysis
- **Features**: Time-series analysis, trend indicators, target line overlay
- **Action Items**: Supported

##### **20. Scatter Plot Report**
- **Data Model**: ChartData (correlation data)
- **ChartData**: X/Y coordinates for correlation analysis
- **Report Fields**: Custom axis labels (`media` = X-axis, `target` = Y-axis)
- **Visualization**: Scatter plot with correlation analysis
- **Features**: Correlation analysis, custom axis labeling
- **Action Items**: Supported

##### **21. Stakeholder Analysis Report**
- **Data Model**: ChartData (stakeholder positioning)
- **ChartData**: Stakeholders with positioning on influence/interest matrix
- **Visualization**: Interactive stakeholder matrix
- **Features**: Stakeholder relationship mapping, power/interest analysis
- **Action Items**: Supported

### Universal Data Features

#### **Additional Details Component**
The Additional Details component is a **universal feature** used across multiple report types:

**Category-Based Reports** (using CategoryCard component):
- **Reports**: 5S, Gemba Walk, Kaizen, Lean Assessment, Mistake Proofing, 5 Whys, Leadership (categories tab)
- **Data Model**: Categories model with `assignees`, `attachments`, `description` fields
- **Features**: 
  - **Description**: Rich text editor (ReactQuill) for detailed category descriptions
  - **Assignees**: Team member assignments with add/remove functionality and avatar display
  - **Attachments**: File upload and management system with image compression support

**Highlight-Based Reports** (using HighlightCard component):
- **Reports**: A3, DMAIC, PDCA, Leadership (highlights tab), Waste Walk (highlights)
- **Data Model**: Highlights model with `assignees`, `images`, `description` fields
- **Features**:
  - **Description**: Rich text editor (ReactQuill) for detailed highlight descriptions
  - **Assignees**: Team member assignments with add/remove functionality and avatar display
  - **Images**: File upload and management system (equivalent to attachments)

**Implementation Pattern**:
- **Header**: "Additional Details" section in each category/highlight card
- **Three Action Buttons**: Upload, Description, Assignees
- **Display Areas**: Show populated content when available
- **PDF Support**: Additional details included in PDF generation

#### **Action Items Integration**
- **Supported**: All reports except where integrated into highlights
- **Status Flow**: To Do → In Progress → In Review → Done
- **Features**: Assignees, due dates, priorities, attachments
- **Special Cases**: A3 Implementation Plan, Leadership Action Items

#### **File Attachments**
- **Category Level**: Images, documents per category
- **Highlight Level**: Images, documents per highlight
- **Report Level**: Videos (Standard Work), process images (VSM)
- **Storage**: S3 with signed URLs

#### **Team Assignments**
- **Category Level**: Assignees per category
- **Highlight Level**: Assignees per highlight
- **Report Level**: Overall assigned members
- **Features**: Email notifications, collaboration tracking

#### **Visualization Types**
- **Radar Charts**: Category-based reports with 3+ categories
- **Timeline Charts**: Standard Work Gantt-style
- **Statistical Charts**: Histogram, Pareto, Run Chart, Scatter Plot
- **Interactive Boards**: Brainstorming, Fishbone, Impact Map, Stakeholder
- **Process Diagrams**: Value Stream Mapping
- **Document Layout**: A3, DMAIC, PDCA, Leadership highlights

### GraphQL Queries for Reports

#### Get Specific Report
```graphql
query GetReport($id: ID!) {
  getReport(id: $id) {
    id
    organizationID
    categoryID
    reportTitle
    reportDescription
    reportType
    assignedToUserIDs
    assignedToUserNames
    priority
    reportStatus
    startDate
    endDate
    projectID
    # Include all report-specific fields based on reportType
    createdAt
    updatedAt
  }
}
```

#### List Reports by Organization
```graphql
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
      reportTitle
      reportType
      reportStatus
      priority
      assignedToUserNames
      startDate
      endDate
      createdAt
    }
    nextToken
  }
}
```

#### List Reports by Project
```graphql
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
      reportTitle
      reportType
      reportStatus
      priority
      assignedToUserNames
      startDate
      endDate
    }
    nextToken
  }
}
```


## Project Management

### Project Model (Updated from Code Analysis)
```graphql
type Project {
  id: ID!
  name: String!              # Project name
  description: String        # Project description  
  startDate: AWSDateTime     # Project start date
  endDate: AWSDateTime       # Project end date (optional)
  status: String!            # ACTIVE, COMPLETED, ON_HOLD, PLANNING
  organizationID: ID!        # Organization reference
  owner: String!             # Project owner (user sub)
  attachments: [String]      # Array of S3 keys for project-level attachments
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _version: Int!
  _deleted: Boolean
  _lastChangedAt: AWSDateTime
}
```

### ProjectMember Model
```graphql
type ProjectMember {
  id: ID!
  projectID: ID!             # Reference to Project
  userSub: String!           # User identifier
  role: String               # Member role (optional)
  email: String!             # Member email address
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _version: Int!
  _deleted: Boolean
  _lastChangedAt: AWSDateTime
}
```

### Tangible Model
```graphql
type Tangible {
  id: ID!
  label: String!             # Description/name of tangible benefit
  value: Float!              # Monetary value of the tangible benefit
  date: AWSDateTime!         # Date when benefit was recorded
  projectID: ID!             # Reference to Project
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _version: Int!
  _deleted: Boolean
  _lastChangedAt: AWSDateTime
}
```

### Intangible Model
```graphql
type Intangible {
  id: ID!
  text: String!              # Description of intangible benefit
  projectID: ID!             # Reference to Project
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _version: Int!
  _deleted: Boolean
  _lastChangedAt: AWSDateTime
}
```

### GraphQL Queries for Projects

#### Get Project Details
```graphql
query GetProject($id: ID!) {
  getProject(id: $id) {
    id
    name
    description
    startDate
    endDate
    status
    organizationID
    owner
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
  }
}
```

#### List Projects by Organization
```graphql
query ListProjects($organizationId: ID!) {
  listProjects(
    filter: { 
      organizationID: { eq: $organizationId }
      _deleted: { ne: true }
    }
  ) {
    items {
      id
      name
      description
      status
      startDate
      endDate
      organizationID
      owner
      createdAt
      updatedAt
    }
  }
}
```

#### Get Project Members
```graphql
query GetProjectMembers($projectId: ID!) {
  projectMembersByProjectID(projectID: $projectId) {
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
    }
  }
}
```

#### Get Project Tangibles
```graphql
query GetProjectTangibles($projectId: ID!) {
  tangiblesByProjectID(
    projectID: $projectId
    filter: { _deleted: { ne: true } }
    sortDirection: DESC
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
    }
  }
}
```

#### Get Project Intangibles
```graphql
query GetProjectIntangibles($projectId: ID!) {
  intangiblesByProjectID(
    projectID: $projectId
    filter: { _deleted: { ne: true } }
    sortDirection: DESC
  ) {
    items {
      id
      text
      projectID
      createdAt
      updatedAt
      _version
      _deleted
    }
  }
}
```

#### List All Projects for User (Owner + Member)
```graphql
# First query: Get projects where user is owner
query GetOwnedProjects($userSub: String!, $organizationId: ID!) {
  listProjects(
    filter: {
      owner: { eq: $userSub }
      organizationID: { eq: $organizationId }
      _deleted: { ne: true }
    }
  ) {
    items {
      id
      name
      description
      status
      startDate
      endDate
      owner
      createdAt
      updatedAt
    }
  }
}

# Second query: Get projects where user is member
query GetMemberProjects($userSub: String!) {
  listProjectMembers(
    filter: {
      userSub: { eq: $userSub }
      _deleted: { ne: true }
    }
  ) {
    items {
      id
      projectID
      role
      email
      # Then use projectID to fetch project details with getProject
    }
  }
}
```

#### Get Reports by Project
```graphql
query GetReportsByProject($projectId: ID!) {
  reportsByProjectID(
    projectID: $projectId
    filter: { _deleted: { ne: true } }
  ) {
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
      organizationID
      projectID
      assignedMembers
      createdAt
      updatedAt
      _version
    }
  }
}
```

#### Get Complete Project with All Related Data
Use this comprehensive pattern to fetch project with all related entities:
```graphql
query GetCompleteProjectData($projectID: ID!) {
  getProject(id: $projectID) {
    id
    name
    description
    status
    startDate
    endDate
    organizationID
    owner
    attachments           # Project-level attachments
    createdAt
    updatedAt
    _version
  }
  
  projectMembersByProjectID(projectID: $projectID) {
    items {
      id
      userSub
      email
      role
      createdAt
    }
  }
  
  tangiblesByProjectID(projectID: $projectID, filter: { _deleted: { ne: true } }) {
    items {
      id
      label
      value
      date
      createdAt
    }
  }
  
  intangiblesByProjectID(projectID: $projectID, filter: { _deleted: { ne: true } }) {
    items {
      id
      text
      createdAt
    }
  }
  
  reportsByProjectID(projectID: $projectID, filter: { _deleted: { ne: true } }) {
    items {
      id
      name
      type
      completed
      user_sub
      ownerEmail
      assignedMembers
      createdAt
      updatedAt
    }
  }
  
  kPIsByProjectID(projectID: $projectID) {
    items {
      id
      title
      target
      startDate
      endDate
      trend
      xAxisLabel
      yAxisLabel
    }
  }
  
  actionItemsByProjectID(projectID: $projectID, filter: { note: { eq: false } }) {
    items {
      id
      title
      description
      status
      priority
      dueDate
      assignedToUserIDs
      attachments
      createdAt
    }
  }
}
```

### Project Data Relationships and AI Context

**Project Access Control**:
- Projects have an `owner` (user sub) who created the project
- Additional users can be added as members via `ProjectMember` table
- Users can access projects where they are either owner OR member
- All data must be filtered by organizationID for multi-tenant isolation

**Project Status Workflow**:
- `PLANNING` - Initial planning phase
- `ACTIVE` - Currently in progress
- `ON_HOLD` - Temporarily paused
- `COMPLETED` - Finished project

**Related Entity Queries**:
When user asks about project data, AI should understand these relationships:
- **Project Reports**: Use `reportsByProjectID` to get all reports linked to project
- **Project KPIs**: Use `kPIsByProjectID` to get performance metrics for project
- **Project Action Items**: Use `actionItemsByProjectID` with `note: false` filter to get tasks (not notes)
- **Project Members**: Use `projectMembersByProjectID` to get team members
- **Project Tangibles**: Use `tangiblesByProjectID` to get monetary benefits tracked
- **Project Intangibles**: Use `intangiblesByProjectID` to get non-monetary benefits
- **Project Attachments**: Available at project level and through related reports/action items

**Project Benefits Tracking**:
- **Tangibles**: Quantifiable monetary benefits with labels, values, and dates
  - Examples: "Cost Savings: $50,000", "Revenue Increase: $25,000"
  - Has calculated total value for ROI analysis
- **Intangibles**: Qualitative benefits that cannot be easily quantified
  - Examples: "Improved employee morale", "Better customer satisfaction", "Enhanced team collaboration"
  - Text-based descriptions of non-monetary improvements

**Common Project AI Queries**:
- "Show project status" → `getProject` + calculate completion from reports
- "List project reports" → `reportsByProjectID` with filtering
- "Who's working on this project?" → `projectMembersByProjectID` + owner info
- "What KPIs are being tracked?" → `kPIsByProjectID` 
- "Show project action items" → `actionItemsByProjectID` with note filter
- "What's the project timeline?" → `getProject` for dates + report completion status
- "Project team performance" → Combine reports, KPIs, and action item completion rates
- "What are the project benefits?" → `tangiblesByProjectID` + `intangiblesByProjectID`
- "Calculate project ROI" → Sum tangible values vs project costs
- "Show tangible savings" → `tangiblesByProjectID` with value calculations
- "List intangible benefits" → `intangiblesByProjectID` with descriptions
- "Project financial impact" → Total tangible values and breakdown by category

**Project Page Components (UI Context)**:
The ProjectView page displays these main sections:
1. **Project Header**: Basic info, status, dates, owner
2. **Team Members**: ProjectMember list with avatars, roles, status badges
3. **Tangibles Card**: Monetary benefits with total value calculation
4. **Intangibles Card**: List of qualitative benefits
5. **Action Items Card**: Project tasks (first 2 with expand option)
6. **Reports Section**: Ongoing vs Completed reports with progress tracking
7. **KPIs Section**: Performance metrics with trend indicators
8. **Attachments Card**: Project-level file attachments

## Action Items Management

### Action Item Status Workflow
- **To Do** - Initial state
- **In Progress** - Work started
- **In Review** - Awaiting approval
- **Done** - Completed

### GraphQL Queries for Action Items

#### List Action Items by Report
```graphql
query ActionItemsByReportID(
  $reportID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelActionItemFilterInput
) {
  actionItemsByReportID(
    reportID: $reportID
    sortDirection: $sortDirection
    filter: $filter
  ) {
    items {
      id
      actionTitle
      actionDescription
      status
      priority
      dueDate
      assignedToUserNames
      createdAt
    }
  }
}
```

#### List Action Items by Project
```graphql
query ActionItemsByProjectID(
  $projectID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelActionItemFilterInput
) {
  actionItemsByProjectID(
    projectID: $projectID
    sortDirection: $sortDirection
    filter: $filter
  ) {
    items {
      id
      actionTitle
      status
      priority
      dueDate
      assignedToUserNames
    }
  }
}
```


## KPI Tracking

### KPI Model (Updated from Code Analysis)
```graphql
type KPI {
  id: ID!
  title: String!            # KPI title/name
  xAxisLabel: String        # Chart X-axis label
  yAxisLabel: String        # Chart Y-axis label  
  trend: Boolean            # Positive/negative trend indicator
  target: String            # Target value as string
  startDate: AWSDateTime    # KPI tracking start date
  endDate: AWSDateTime      # KPI tracking end date
  projectID: ID!            # Reference to Project
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _version: Int!
  _deleted: Boolean
  _lastChangedAt: AWSDateTime
}
```

### KPIData Model (Updated from Code Analysis)
```graphql
type KPIData {
  id: ID!
  kpiID: ID!                # Reference to KPI
  xAxisValue: String!       # X-axis value/label for data point
  yAxisvalue: Float!        # Y-axis numeric value (note: lowercase 'v' in field name)
  date: AWSDateTime!        # Data point date
  description: String       # Optional description for data point
  orderIndex: Int           # Order/sequence of data points
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _version: Int!
  _deleted: Boolean
  _lastChangedAt: AWSDateTime
}
```

### KPI Types and Metrics
- Performance metrics with target values and trend analysis
- Time-series data tracking with date-based data points
- Chart visualization with custom axis labels
- Trend indicators for positive/negative performance direction

### KPI Data Structure and Relationships

**KPI Configuration**:
- **title**: KPI name/description
- **xAxisLabel**: Custom label for X-axis (e.g., "Time Period", "Month", "Quarter")
- **yAxisLabel**: Custom label for Y-axis (e.g., "Sales Revenue", "Defect Rate", "Customer Satisfaction")
- **trend**: Boolean indicating positive (true) or negative (false) trend direction
- **target**: Target value that determines goal achievement
- **startDate/endDate**: KPI tracking period
- **projectID**: Links KPI to specific project

**KPI Data Points**:
- **xAxisValue**: String label for the data point (e.g., "Q1 2024", "Week 5", "January")
- **yAxisvalue**: Numeric measurement value (note: field name has lowercase 'v')
- **date**: Timestamp when measurement was recorded
- **description**: Optional context or notes about the data point
- **orderIndex**: Sequence order for display

**Goal Achievement Logic**:
- **Positive Trend** (trend = true): Goal achieved when yAxisvalue >= target
- **Negative Trend** (trend = false): Goal achieved when yAxisvalue <= target
- Awards are triggered when goals are met
- Duplicate award prevention based on value tracking

### KPI Chart and Visualization Features

**Chart Components**:
- Time-series line chart with data points
- Target line overlay (dashed green line)
- Milestone markers for project/KPI dates
- Color coding: Green for positive trend, Red for negative trend
- Interactive tooltips showing full data context
- Responsive scrolling for large datasets

**Important Dates Displayed**:
- KPI Start Date (from KPI.startDate)
- KPI End Date (from KPI.endDate)  
- Project Start Date (from linked Project.startDate)
- Project End Date (from linked Project.endDate)

**Data Table Features**:
- Sortable by date (newest first by default)
- Shows all data points with xAxisValue, yAxisvalue, description
- Edit/delete actions for each data point
- Date validation prevents duplicate entries for same date

### GraphQL Queries for KPIs

#### List KPIs by Project
```graphql
query KPIsByProjectID(
  $projectID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelKPIFilterInput
  $limit: Int
  $nextToken: String
) {
  kPIsByProjectID(
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
    }
    nextToken
  }
}
```

#### Get KPI Data Points
```graphql
query GetKPIData($id: ID!) {
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
  }
}

query KPIDataByKPIID(
  $kpiID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelKPIDataFilterInput
  $limit: Int
  $nextToken: String
) {
  kPIDataByKPIID(
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
      yAxisvalue         # Note: lowercase 'v' in field name
      date
      description
      orderIndex
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
    nextToken
  }
}
```

#### Get Individual KPI Data Point
```graphql
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
  }
}
```

#### List All KPI Data (with filtering)
```graphql
query ListKPIData(
  $filter: ModelKPIDataFilterInput
  $limit: Int
  $nextToken: String
) {
  listKPIData(
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
    }
    nextToken
  }
}
```

### KPI AI Query Patterns and Analysis

**Common KPI AI Queries**:
- "Show KPI performance" → `getKPI` + `kPIDataByKPIID` for complete view
- "What's the current KPI value?" → Latest data point from `kPIDataByKPIID` sorted by date DESC
- "Is the KPI meeting target?" → Compare latest yAxisvalue with target using trend logic
- "Show KPI trend over time" → All data points sorted by date for trend analysis
- "KPI goal achievement status" → Calculate if latest value meets target criteria
- "KPI data for specific period" → Filter `kPIDataByKPIID` by date range
- "Compare KPI vs target" → Calculate percentage of target achieved
- "Show KPI chart data" → Format data for visualization with milestones

**KPI Analysis Calculations**:
```javascript
// Goal achievement check
const isGoalAchieved = (kpi, latestDataPoint) => {
  if (!kpi.target || !latestDataPoint) return false;
  const currentValue = parseFloat(latestDataPoint.yAxisvalue);
  const targetValue = parseFloat(kpi.target);
  
  return kpi.trend 
    ? currentValue >= targetValue  // Positive trend: higher is better
    : currentValue <= targetValue; // Negative trend: lower is better
};

// Progress percentage calculation
const calculateProgress = (kpi, latestDataPoint) => {
  if (!kpi.target || !latestDataPoint) return 0;
  const currentValue = parseFloat(latestDataPoint.yAxisvalue);
  const targetValue = parseFloat(kpi.target);
  
  if (kpi.trend) {
    // For positive trends, calculate how close to target
    return Math.min((currentValue / targetValue) * 100, 100);
  } else {
    // For negative trends, calculate how much below target
    return currentValue <= targetValue ? 100 : ((targetValue / currentValue) * 100);
  }
};

// Trend analysis
const analyzeTrend = (kpiDataPoints) => {
  if (kpiDataPoints.length < 2) return 'insufficient_data';
  
  const sortedData = kpiDataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstValue = parseFloat(sortedData[0].yAxisvalue);
  const lastValue = parseFloat(sortedData[sortedData.length - 1].yAxisvalue);
  
  if (lastValue > firstValue) return 'improving';
  if (lastValue < firstValue) return 'declining';
  return 'stable';
};
```

**Complete KPI with Data Query**:
```graphql
query GetCompleteKPIData($kpiId: ID!, $projectId: ID!) {
  getKPI(id: $kpiId) {
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
  }
  
  getProject(id: $projectId) {
    id
    name
    status
    startDate
    endDate
  }
  
  kPIDataByKPIID(
    kpiID: $kpiId
    sortDirection: ASC
    filter: { _deleted: { ne: true } }
  ) {
    items {
      id
      xAxisValue
      yAxisvalue
      date
      description
      orderIndex
      createdAt
    }
  }
}
```

**KPI Page Components (UI Context)**:
The KPI View page displays these main sections:
1. **KPI Header**: Title, trend badge, target badge, action buttons
2. **Chart Section**: Time-series visualization with target line and milestones
3. **Data Points Table**: All measurements with edit/delete capabilities
4. **Add Data Modal**: Form for creating/editing data points
5. **Export Features**: PDF generation for reports

**Data Point Management**:
- Date validation prevents duplicate entries for same date
- Automatic goal achievement detection and award triggering
- Sequential orderIndex for proper data ordering
- Rich tooltip information in chart visualization
- Milestone markers for project and KPI important dates


## Learning Management System

### Purpose and Overview
The VibeStack learning system delivers structured educational content about lean manufacturing and business improvement methodologies. It provides:
- **Multi-tenant learning modules** for different organizations
- **Hierarchical content organization** with 4-level structure
- **Progress tracking** with time-based monitoring and gamification
- **Quiz integration** for knowledge assessment
- **Clone functionality** for customizing global content per organization

### Learning Content Hierarchy
The learning system follows a **4-level hierarchical structure**:

```
Learning (Root Level)
├── Chapters (Level 1)
│   ├── Sections (Level 2)
│   │   ├── SubSections (Level 3)
│   │   │   └── Post (Content)
│   │   └── Post (Content)
│   └── Post (Content)
└── Quizzes (Independent)
    └── Questions
```

### Complete Learning Data Models

#### Learning Model
```graphql
type Learning {
  id: ID!
  title: String!
  description: String
  orderIndex: Int
  isDefault: Boolean     # Global vs Organization-specific
  organizationID: ID
  hasQuizTaken: Boolean
  quizScore: Float
  quizStatementsCount: Int
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

#### Chapter Model
```graphql
type Chapter {
  id: ID!
  title: String!
  slug: String
  position: Int!        # For ordering
  postId: ID           # References Post for content
  learningId: ID!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

#### Section Model
```graphql
type Section {
  id: ID!
  title: String!
  slug: String
  position: Int!        # For ordering within chapter
  chapterId: ID!
  postId: ID           # References Post for content
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

#### SubSection Model
```graphql
type SubSection {
  id: ID!
  title: String!
  slug: String
  position: Int!        # For ordering within section
  sectionId: ID!
  postId: ID           # References Post for content
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

#### Post Model (Content Container)
```graphql
type Post {
  id: ID!
  content: String!     # HTML/Rich text content
  organizationId: ID
  isDefault: Boolean   # Global vs Organization-specific
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

#### Quiz Model
```graphql
type Quiz {
  id: ID!
  title: String!
  description: String
  learningId: ID!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

#### Question Model
```graphql
type Question {
  id: ID!
  content: String!     # Question text
  options: [String]!   # Multiple choice options
  correctOption: Int!  # Index of correct answer
  explanation: String  # Explanation of correct answer
  orderIndex: Int!     # Question order
  quizId: ID!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

### Complete Learning Content Fetching

#### Get Full Learning Structure
```graphql
query GetCompleteLearningContent($learningId: ID!) {
  # Get learning metadata
  getLearning(id: $learningId) {
    id
    title
    description
    orderIndex
    isDefault
    organizationID
    hasQuizTaken
    quizScore
    quizStatementsCount
  }
  
  # Get chapters ordered by position
  chaptersByLearningIdAndPosition(
    learningId: $learningId
    sortDirection: ASC
  ) {
    items {
      id
      title
      slug
      position
      postId
      learningId
    }
  }
  
  # Get quizzes for this learning
  quizzesByLearningId(learningId: $learningId) {
    items {
      id
      title
      description
      learningId
    }
  }
}
```

#### Get Chapter Content with Sections
```graphql
query GetChapterWithSections($chapterId: ID!) {
  # Get chapter details
  getChapter(id: $chapterId) {
    id
    title
    slug
    position
    postId
    learningId
  }
  
  # Get chapter content
  getPost(id: $postId) {
    id
    content
    organizationId
    isDefault
  }
  
  # Get sections within chapter
  sectionsByChapterIdAndPosition(
    chapterId: $chapterId
    sortDirection: ASC
  ) {
    items {
      id
      title
      slug
      position
      chapterId
      postId
    }
  }
}
```

#### Get Section Content with SubSections
```graphql
query GetSectionWithSubSections($sectionId: ID!) {
  # Get section details
  getSection(id: $sectionId) {
    id
    title
    slug
    position
    chapterId
    postId
  }
  
  # Get section content
  getPost(id: $postId) {
    id
    content
    organizationId
    isDefault
  }
  
  # Get subsections within section
  subSectionsBySectionIdAndPosition(
    sectionId: $sectionId
    sortDirection: ASC
  ) {
    items {
      id
      title
      slug
      position
      sectionId
      postId
    }
  }
}
```

#### Get SubSection Content
```graphql
query GetSubSectionContent($subSectionId: ID!) {
  # Get subsection details
  getSubSection(id: $subSectionId) {
    id
    title
    slug
    position
    sectionId
    postId
  }
  
  # Get subsection content
  getPost(id: $postId) {
    id
    content
    organizationId
    isDefault
  }
}
```

#### Get Quiz with Questions
```graphql
query GetQuizWithQuestions($quizId: ID!) {
  # Get quiz details
  getQuiz(id: $quizId) {
    id
    title
    description
    learningId
  }
  
  # Get questions ordered by index
  questionsByQuizIdAndOrderIndex(
    quizId: $quizId
    sortDirection: ASC
  ) {
    items {
      id
      content
      options
      correctOption
      explanation
      orderIndex
      quizId
    }
  }
}
```

### Learning Progress Tracking

#### Learning Session Model
```graphql
type LearningSession {
  id: ID!
  userId: ID!
  learningId: ID!
  startTime: AWSDateTime!
  endTime: AWSDateTime
  activeTime: Int!      # Time actively engaged (seconds)
  totalTime: Int!       # Total session time (seconds)
  organizationId: ID!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

#### Learning Progress Model
```graphql
type LearningProgress {
  id: ID!
  userId: ID!
  learningId: ID!
  totalActiveTime: Int!     # Cumulative active time
  totalSessions: Int!       # Number of sessions
  lastAccessTime: AWSDateTime!
  coinsEarned: Int!        # Gamification rewards
  organizationId: ID!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

### Multi-Organization Learning Support

#### List All Available Learnings
```graphql
query GetOrganizationLearnings($organizationId: ID!) {
  # Get global learnings (available to all organizations)
  listLearnings(filter: { isDefault: { eq: true } }) {
    items {
      id
      title
      description
      orderIndex
      isDefault
    }
  }
  
  # Get organization-specific learnings
  learningsByOrganizationId(
    organizationId: $organizationId
    filter: { isDefault: { eq: false } }
  ) {
    items {
      id
      title
      description
      orderIndex
      isDefault
      organizationID
    }
  }
}
```

### AI Learning System Understanding

**When user asks about learning content:**
- **"Show me the learning modules"** → Query all learnings for organization
- **"What's in learning X?"** → Get complete learning structure with chapters
- **"Show me chapter Y content"** → Get chapter with sections and content
- **"What are the quiz questions?"** → Get quiz with all questions
- **"Show my learning progress"** → Get learning sessions and progress data

**Data Interpretation:**
- **Learning**: Root educational module with title/description
- **Chapters**: Major topical divisions (position-ordered)
- **Sections**: Subdivisions within chapters (position-ordered)
- **SubSections**: Granular content divisions (position-ordered)
- **Posts**: Actual HTML content for each level
- **Quizzes**: Assessment tools with multiple choice questions
- **Progress**: Time-based tracking with gamification

## Awards & Gamification

### Award System
- **Awards** - Achievement badges
- **Coins** - Point-based rewards
- **Leaderboard** - User ranking system

### GraphQL Queries for Awards

#### List Awards by Organization
```graphql
query AwardsByOrganizationID(
  $organizationID: ID!
  $sortDirection: ModelSortDirection
) {
  awardsByOrganizationID(
    organizationID: $organizationID
    sortDirection: $sortDirection
  ) {
    items {
      id
      awardName
      awardDescription
      awardType
      pointsValue
      organizationID
    }
  }
}
```

#### List User Awards
```graphql
query UserAwardsByUserID(
  $userID: ID!
  $sortDirection: ModelSortDirection
) {
  userAwardsByUserID(
    userID: $userID
    sortDirection: $sortDirection
  ) {
    items {
      id
      userID
      awardID
      earnedDate
      organizationID
    }
  }
}
```

## Common GraphQL Patterns

### Filtering by Organization
All queries should include organization-based filtering:
```graphql
{
  filter: {
    organizationID: { eq: $organizationID }
  }
}
```

### Sorting Options
```graphql
{
  sortDirection: ASC | DESC
}
```

### Pagination
```graphql
{
  limit: Int
  nextToken: String
}
```

### Real-time Subscriptions
For collaborative features:
```graphql
subscription OnUpdateReport($filter: ModelSubscriptionReportFilterInput) {
  onUpdateReport(filter: $filter) {
    id
    reportTitle
    reportStatus
    updatedBy
    updatedAt
  }
}
```

## AI Integration Guidelines

### Query Selection Strategy

Based on user requests, the AI should select appropriate GraphQL queries:

**Category-Based Reports**:
- "Show 5S audit results" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` with 1-5 scale context
- "What's the Gemba Walk assessment?" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` with 0-4 scale context  
- "Show Kaizen project progress" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` with project phases context
- "Display Lean Assessment maturity" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` with maturity scoring
- "Show Mistake Proofing evaluation" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` with prevention focus

**Highlight-Based Reports**:
- "What's in the A3 project phases?" → `getReport` + `highlightsByReportIDAndCreatedAt` with 8-phase structure context
- "Show DMAIC methodology progress" → `getReport` + `highlightsByReportIDAndCreatedAt` with 5-6 phase context  
- "Display Leadership report highlights" → `getReport` + `highlightsByReportIDAndCreatedAt` + `categoriesByReportID` with dual structure context
- "Show PDCA cycle progress" → `getReport` + `highlightsByReportIDAndCreatedAt` + `categoriesByReportID` with dual structure context

**Chart-Based Reports**:
- "What's in the fishbone diagram?" → `getReport` + `chartDataByReportID` with 6M categories and cause positioning
- "Show the Standard Work timing" → `getReport` + `chartDataByReportID` with operation timing and drag-and-drop context
- "What does the Pareto chart show?" → `getReport` + `chartDataByReportID` with frequency analysis and 80/20 rule
- "Show Run Chart trend analysis" → `getReport` + `chartDataByReportID` with time-series and trend indicators
- "What's the Scatter Plot correlation?" → `getReport` + `chartDataByReportID` with X/Y coordinates and correlation analysis
- "Show Histogram distribution" → `getReport` + `chartDataByReportID` with frequency bins and statistical analysis

**Board-Based Reports**:
- "What ideas are in Brainstorming?" → `getReport` + `chartDataByReportID` with spatial positioning and color coding
- "Show Impact Map priorities" → `getReport` + `chartDataByReportID` with impact vs implementation matrix
- "What's the Stakeholder Analysis?" → `getReport` + `chartDataByReportID` with influence/interest positioning

**Complex Reports**:
- "Show VSM process flow" → `getReport` + `vsmsByReportID` + `actionItemsByReportID` with process cards and value analysis
- "What are the 5 Whys findings?" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` with sequential questioning context
- "Show Waste Walk observations" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` + `highlightsByReportIDAndCreatedAt` with dual structure

**Cross-Entity Queries**:
- "Show all reports for project X" → `reportsByProjectID`
- "What action items are linked to this report?" → `actionItemsByReportID`
- "Show KPI performance for project Y" → `kPIsByProjectID`
- "Show action items from A3 Implementation Plan" → `actionItemsByReportID` (displayed in highlight card grid)
- "What are the Leadership report action items?" → `actionItemsByReportID` (displayed in highlight card grid)

**Contextual Understanding**:
- "What does this report show?" → Identify report type and explain its specific data representation
- "How is this data structured?" → Explain the data model and representation for that report type
- "What can I do with this report?" → Describe available actions based on report type

### Data Interpretation Patterns

**Report Completion Status**:
```javascript
// Category-based reports (5S, Gemba Walk, etc.)
const isCategoryReportComplete = (categories, statements) => {
  return categories.every(category => {
    const categoryStatements = statements.filter(stmt => 
      stmt.categoriesID === category.id && stmt.default === true
    );
    return categoryStatements.every(stmt => stmt.value > 0);
  });
};

// Highlight-based reports (A3, PDCA, DMAIC, Leadership)
const isHighlightReportComplete = (highlights) => {
  return highlights.every(highlight => 
    highlight.description && highlight.description.trim().length > 0
  );
};

// Chart-based reports (Standard Work, Histogram, etc.)
const isChartReportComplete = (chartData, reportType) => {
  const minDataPoints = {
    'Standard Work Report': 3,
    'Histogram Report': 5,
    'Run Chart Report': 5,
    'Pareto Chart Report': 3
  };
  return chartData.length >= (minDataPoints[reportType] || 1);
};

// VSM reports
const isVSMComplete = (vsmData) => {
  const processCards = JSON.parse(vsmData.process || '[]');
  return processCards.length >= 3;
};
```

**Score Calculations**:
```javascript
// 5S scoring (1-5 scale)
const calculate5SScore = (categories, statements) => {
  const scores = categories.map(category => {
    const categoryStatements = statements.filter(stmt => stmt.categoriesID === category.id);
    const total = categoryStatements.reduce((sum, stmt) => sum + stmt.value, 0);
    return categoryStatements.length > 0 ? total / categoryStatements.length : 0;
  });
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

// Other category reports (0-4 scale)  
const calculateCategoryScore = (categories, statements) => {
  const scores = categories.map(category => {
    const categoryStatements = statements.filter(stmt => stmt.categoriesID === category.id);
    const total = categoryStatements.reduce((sum, stmt) => sum + stmt.value, 0);
    return categoryStatements.length > 0 ? total / categoryStatements.length : 0;
  });
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

// Standard Work timing
const calculateStandardWorkTiming = (chartData, report) => {
  const totalCycleTime = chartData.reduce((sum, item) => sum + parseFloat(item.value || 0), 0);
  const targetTime = parseFloat(report.target || 0);
  const efficiency = targetTime > 0 ? (targetTime / totalCycleTime) * 100 : 0;
  return { totalCycleTime, targetTime, efficiency };
};
```

### Report Type Detection and Context

**Report Type Identification**:
```javascript
const getReportDataModel = (reportType) => {
  const models = {
    // Group A: Category + Statements
    '5S Report': { model: 'categories', scale: '1-5', hasAdditionalDetails: true },
    'Gemba Walk Report': { model: 'categories', scale: '0-4', hasAdditionalDetails: true },
    'Kaizen Project Report': { model: 'categories', scale: '0-4', hasAdditionalDetails: true },
    'Lean Assessment Report': { model: 'categories', scale: '0-4', hasAdditionalDetails: true },
    'Mistake Proofing Report': { model: 'categories', scale: '0-4', hasAdditionalDetails: true },
    
    // Group A Special: Highlights + Categories (dual model)
    'A3 Project Report': { model: 'highlights', phases: 8, hasActionItems: ['Implementation Plan'] },
    'PDCA Report': { model: 'highlights+categories', phases: 4, hasAdditionalDetails: true },
    'DMAIC Report': { model: 'highlights', phases: 6, hasAdditionalDetails: true },
    'Leadership Report': { model: 'highlights+categories', phases: 6, hasActionItems: ['Action Items'], hasAdditionalDetails: true },
    'Waste Walk Report': { model: 'categories+highlights', scale: '0-4', phases: 7, hasAdditionalDetails: true },
    
    // Group B: ChartData (Board/Visual)
    'Brainstorming Report': { model: 'chartdata', type: 'board', spatial: true },
    'Fishbone Diagram Report': { model: 'chartdata', type: 'board', spatial: true, categories: '6M' },
    'Impact Map Report': { model: 'chartdata', type: 'board', spatial: true, matrix: 'impact-implementation' },
    'Stakeholder Analysis Report': { model: 'chartdata', type: 'board', spatial: true, matrix: 'power-interest' },
    
    // Group C: ChartData (Numeric/Charts)
    'Histogram Report': { model: 'chartdata', type: 'chart', chartType: 'histogram' },
    'Pareto Chart Report': { model: 'chartdata', type: 'chart', chartType: 'pareto' },
    'Run Chart Report': { model: 'chartdata', type: 'chart', chartType: 'run', hasDateAxis: true },
    'Scatter Plot Report': { model: 'chartdata', type: 'chart', chartType: 'scatter', hasXY: true },
    
    // Group D: ChartData (Time-based)
    'Standard Work Report': { model: 'chartdata', type: 'time', hasSequence: true, operations: ['Auto', 'Manual', 'Wait', 'Walk'] },
    
    // Group E: VSM (Complex)
    'Value Stream Mapping Report': { model: 'vsm', complex: true, hasProcessCards: true, hasInventory: true, hasActionItems: true },
    
    // Group F: 5 Whys (Sequential)
    '5 Whys Report': { model: 'categories', sequential: true, phases: 7, textBased: true, hasAdditionalDetails: true }
  };
  
  return models[reportType] || { model: 'unknown' };
};
```

### UI Component to Query Mapping

#### Main Report List (`/reports`)
- **Component**: `Reports.js`
- **Query**: `reportsByOrganizationID`
- **Filters**: reportType, reportStatus, priority
- **Context**: Shows all reports with filtering and search

#### Individual Report View (`/report/:id`)
- **Component**: Varies by reportType
  - Most reports: `Report5s.js`
  - VSM: `ReportVsm.js`
  - Standard Work: `ReportSw.js`
  - Fishbone/Impact/Stakeholder: `BoardView.js`
  - Brainstorming: `ReportBs.js`
  - Histogram: `ReportHg.js`
- **Query**: `getReport`
- **Related Queries**: `actionItemsByReportID`

#### Report Creation (`/create-report`)
- **Component**: `CreateReport.js`
- **Mutation**: `createReport`
- **Context**: Uses tools.json for report type selection

### Project Views

#### Project Dashboard (`/projects`)
- **Component**: `Projects.js`
- **Query**: `projectsByOrganizationID`
- **Context**: Overview of all projects with status

#### Project Details (`/project/:id`)
- **Component**: `ProjectDetail.js`
- **Queries**: 
  - `getProject`
  - `reportsByProjectID`
  - `kPIsByProjectID`
  - `actionItemsByProjectID`

### Action Item Views

#### Action Items List (`/action-items`)
- **Component**: `ActionItems.js`
- **Queries**: 
  - `actionItemsByOrganizationID`
  - Can filter by reportID or projectID

#### Action Item Board View
- **Component**: `ActionItemBoard.js`
- **Query**: `actionItemsByOrganizationID`
- **Context**: Kanban-style board (To Do, In Progress, In Review, Done)

### Dashboard Views

#### Main Dashboard (`/dashboard`)
- **Component**: `Dashboard.js`
- **Queries**: Multiple for overview data
  - Recent reports
  - Pending action items
  - KPI summaries
  - Award progress

#### Analytics View
- **Component**: `Analytics.js`
- **Queries**: Aggregated data queries for charts and metrics

### Learning Views

#### Learning Center (`/learning`)
- **Component**: `Learning.js`
- **Query**: `learningsByOrganizationID`

#### Learning Content (`/learning/:id`)
- **Component**: `LearningDetail.js`
- **Queries**:
  - `getLearning`
  - `learningChaptersByLearningID`
  - `learningSectionsByLearningChapterID`

### Awards Views

#### Awards Center (`/awards`)
- **Component**: `Awards.js`
- **Queries**:
  - `awardsByOrganizationID`
  - `userAwardsByUserID`

## AI Assistant Integration Guidelines

### Understanding User Intent for Report Data

When a user asks about a specific report, the AI needs to:

#### 1. **Identify Report Type from Context**
- Determine which of the 21 report types the user is referring to
- Understand which UI component and data model to use
- Know what specific data fields are meaningful for that report type

#### 2. **Report-Specific Data Interpretation**

**For Categories & Statements Reports (5S, Gemba Walk, Kaizen, etc.)**:
```
User: "Show me the 5S report scores"
AI Should: 
- Query: getReport + categoriesByReportID + statementsByCategoriesID
- Interpret: Present 5 categories (Sort, Set in Order, Shine, Standardize, Sustain) with their averaged scores
- Context: Radar chart visualization available, scores typically 1-5 scale
```

**For Highlight Cards Reports (A3, PDCA, DMAIC, Leadership, Waste Walk)**:
```
User: "Show me the A3 project details"
AI Should:
- Query: getReport + highlightsByReportIDAndCreatedAt + actionItemsByReportID
- Interpret: Present 8 structured phases with rich HTML content, assignees, and attachments
- Context: Problem-solving methodology with phases like Problem Statement, Current State, Future State, etc.
- Note: "Implementation Plan" card shows actual action items, not highlight content
```

```
User: "What's in the DMAIC report?"
AI Should:
- Query: getReport + highlightsByReportIDAndCreatedAt
- Interpret: Present 5-6 Six Sigma phases (Prepare, Define, Measure, Analyze, Improve, Control)
- Context: Each phase has detailed content, images, and assigned team members
```

```
User: "Show me the Leadership report updates"
AI Should:
- Query: getReport + highlightsByReportIDAndCreatedAt + actionItemsByReportID
- Interpret: Present 6 business areas (Accomplishments, Improvement PDCAs, Special recognitions, Upcoming issues, Resource needs, Action Items)
- Context: Leadership communication tool with rich content and team assignments
- Note: "Action Items" card shows actual action items, not highlight content
```

**For Board/Visual Reports (Brainstorming, Fishbone, Impact Map, Stakeholder)**:
```
User: "What causes are identified in the fishbone diagram?"
AI Should:
- Query: getReport + chartDataByReportID  
- Interpret: Group text elements by textColor (representing 6M categories)
- Context: Causes are positioned spatially, organized by Man, Machine, Material, Method, Measurement, Environment
```

**For Chart/Numeric Reports (Histogram, Pareto, Run Chart, Scatter Plot)**:
```
User: "What does the Pareto chart show?"
AI Should:
- Query: getReport + chartDataByReportID
- Interpret: Present data as frequency distribution with 80/20 analysis
- Context: Values sorted by frequency, cumulative percentages calculated
```

**For Standard Work Reports**:
```
User: "What's the cycle time analysis?"
AI Should:
- Query: getReport + chartDataByReportID
- Interpret: Show process steps with timing (Auto/Manual/Wait/Walk operations)
- Context: Compare cycle time vs takt time, analyze bottlenecks
```

**For Value Stream Mapping**:
```
User: "Show me the process flow"
AI Should:
- Query: getReport + getVsm + attributesByProcessID
- Interpret: Present process cards with cycle times and value-added classification
- Context: Complex flow with inventory buffers, waste identification
```

#### 3. **Data Presentation Patterns**

**Empty State Handling**:
- Recognize when reports have no data vs. incomplete data
- Provide appropriate guidance based on report type

**Conditional Elements**:
- Know which report types have action items (exclude A3, Leadership)
- Understand which reports show charts (exclude Gemba Walk, Kaizen, 5 Whys, Leadership, A3, DMAIC, PDCA, Waste Walk)
- Recognize special features (drag & drop, real-time collaboration)

**Multi-Tenant Context**:
- Always filter by organizationID
- Respect data segregation between organizations
- Users have access to their organization's data only

### Query Optimization for AI
1. **Batch related queries** when possible
2. **Use specific filters** to reduce data transfer  
3. **Include only needed fields** in query selection
4. **Understand report type routing** to use correct data model

### Common User Request Patterns

**Report-Specific Queries**:

**Category-Based Reports**:
- "Show me all 5S reports" → `reportsByOrganizationID` with `type: "5S Report"` filter
- "What are the 5S scores?" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` with 0-4 scale interpretation
- "Show Gemba Walk observations" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` with department assessment context
- "What's the Lean Assessment maturity?" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` with lean principles scoring

**Highlight-Based Reports**:
- "What's in the A3 project?" → `getReport` + `highlightsByReportIDAndCreatedAt` + `actionItemsByReportID` with A3 phase interpretation
- "Show DMAIC report phases" → `getReport` + `highlightsByReportIDAndCreatedAt` with DMAIC methodology context
- "What's in the Leadership report?" → `getReport` + `highlightsByReportIDAndCreatedAt` + `actionItemsByReportID` with Leadership communication context
- "Show PDCA cycle progress" → `getReport` + `highlightsByReportIDAndCreatedAt` + `categoriesByReportID` with dual structure context

**Chart-Based Reports**:
- "What's in the fishbone diagram?" → `getReport` + `chartDataByReportID` with 6M categories and cause positioning
- "Show the Standard Work timing" → `getReport` + `chartDataByReportID` with operation timing and drag-and-drop context
- "What does the Pareto chart show?" → `getReport` + `chartDataByReportID` with frequency analysis and 80/20 rule
- "Show Run Chart trend analysis" → `getReport` + `chartDataByReportID` with time-series and trend indicators
- "What's the Scatter Plot correlation?" → `getReport` + `chartDataByReportID` with X/Y coordinates and correlation analysis
- "Show Histogram distribution" → `getReport` + `chartDataByReportID` with frequency bins and statistical analysis

**Board-Based Reports**:
- "What ideas are in Brainstorming?" → `getReport` + `chartDataByReportID` with spatial positioning and color coding
- "Show Impact Map priorities" → `getReport` + `chartDataByReportID` with impact vs implementation matrix
- "What's the Stakeholder Analysis?" → `getReport` + `chartDataByReportID` with influence/interest positioning

**Complex Reports**:
- "Show VSM process flow" → `getReport` + `getVsm` + `actionItemsByReportID` with process cards and value analysis
- "What are the 5 Whys findings?" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` with sequential questioning context
- "Show Waste Walk observations" → `getReport` + `categoriesByReportID` + `statementsByCategoriesID` + `highlightsByReportIDAndCreatedAt` with dual structure

**Cross-Entity Queries**:
- "Show all reports for project X" → `reportsByProjectID`
- "What action items are linked to this report?" → `actionItemsByReportID`
- "Show KPI performance for project Y" → `kPIsByProjectID`
- "Show action items from A3 Implementation Plan" → `actionItemsByReportID` (displayed in highlight card grid)
- "What are the Leadership report action items?" → `actionItemsByReportID` (displayed in highlight card grid)

**Contextual Understanding**:
- "What does this report show?" → Identify report type and explain its specific data representation
- "How is this data structured?" → Explain the data model and representation for that report type
- "What can I do with this report?" → Describe available actions based on report type

### Advanced Query Patterns and Edge Cases

#### **Multi-Data Model Reports**
Some reports use multiple data models simultaneously:

**Leadership Report** (Categories + Highlights):
```graphql
query GetLeadershipComplete($reportId: ID!) {
  getReport(id: $reportId) {
    id name type completed assignedMembers
  }
  
  # Traditional categories for "Departments" tab
  categoriesByReportID(reportID: $reportId) {
    items {
      id name orderIndex assignees attachments
    }
  }
  
  # Highlights for "Highlights Report" tab
  highlightsByReportIDAndCreatedAt(reportID: $reportId) {
    items {
      id title description images assignees
    }
  }
  
  # Action items for "Action Items" highlight card
  actionItemsByReportID(reportID: $reportId) {
    items {
      id title description status priority dueDate assignees
    }
  }
}
```

**PDCA Report** (Categories + Highlights):
```graphql
query GetPDCAComplete($reportId: ID!) {
  getReport(id: $reportId) {
    id name type completed
  }
  
  # Traditional categories for assessment
  categoriesByReportID(reportID: $reportId) {
    items {
      id name orderIndex
    }
  }
  
  # Highlights for PDCA phases
  highlightsByReportIDAndCreatedAt(reportID: $reportId) {
    items {
      id title description images assignees
    }
  }
}
```

**Waste Walk Report** (Categories + Statements + Highlights):
```graphql
query GetWasteWalkComplete($reportId: ID!) {
  getReport(id: $reportId) {
    id name type completed
  }
  
  # Categories for waste assessment
  categoriesByReportID(reportID: $reportId) {
    items {
      id name orderIndex
    }
  }
  
  # Statements for scoring
  statementsByCategoriesID(categoriesID: $categoryId) {
    items {
      id name value default
    }
  }
  
  # Highlights for observations
  highlightsByReportIDAndCreatedAt(reportID: $reportId) {
    items {
      id title description images waste_type
    }
  }
}
```

#### **Report State and Completion Logic**
Understanding when reports are considered "complete":

**Category-Based Reports**: 
- Complete when all default statements have values > 0
- Incomplete if any default statement remains at 0

**Highlight-Based Reports**:
- Complete when all highlight descriptions are filled
- Incomplete if any highlight has empty description

**Chart-Based Reports**:
- Complete when minimum data points are entered
- Varies by chart type (Histogram: 5+ bins, Run Chart: 5+ time points)

**VSM Reports**:
- Complete when process flow is defined with at least 3 process cards
- Incomplete if process array is empty or has < 3 processes

#### **Data Filtering and Search Patterns**

**Filter by Report Status**:
```graphql
query GetActiveReports($organizationId: ID!) {
  reportsByOrganizationID(
    organizationID: $organizationId
    filter: { completed: { eq: false } }
  ) {
    items {
      id name type createdAt assignedMembers
    }
  }
}
```

**Filter by Report Type Category**:
```graphql
query GetLeanToolsReports($organizationId: ID!) {
  reportsByOrganizationID(
    organizationID: $organizationId
    filter: { 
      type: { 
        in: ["5S Report", "Gemba Walk Report", "Kaizen Project Report", "Lean Assessment Report"] 
      }
    }
  ) {
    items {
      id name type createdAt
    }
  }
}
```

**Filter by Date Range**:
```graphql
query GetRecentReports($organizationId: ID!, $startDate: AWSDateTime!) {
  reportsByOrganizationID(
    organizationID: $organizationId
    filter: { createdAt: { ge: $startDate } }
    sortDirection: DESC
  ) {
    items {
      id name type createdAt
    }
  }
}
```

#### **Aggregation and Analytics Patterns**

**Category Averages for Radar Charts**:
```javascript
// Calculate category averages for radar chart
const calculateCategoryAverages = (categories, statements) => {
  return categories.map(category => {
    const categoryStatements = statements.filter(stmt => stmt.categoriesID === category.id);
    const total = categoryStatements.reduce((sum, stmt) => sum + stmt.value, 0);
    const average = categoryStatements.length > 0 ? total / categoryStatements.length : 0;
    return {
      categoryName: category.name,
      average: average,
      maxPossible: 4 // 0-4 scale
    };
  });
};
```

**Pareto Chart Calculations**:
```javascript
// Sort and calculate cumulative percentages for Pareto chart
const calculateParetoData = (chartData) => {
  const sorted = chartData.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
  const total = sorted.reduce((sum, item) => sum + parseFloat(item.value), 0);
  
  let cumulative = 0;
  return sorted.map(item => {
    cumulative += parseFloat(item.value);
    return {
      ...item,
      percentage: (parseFloat(item.value) / total) * 100,
      cumulative: (cumulative / total) * 100
    };
  });
};
```

**Run Chart Trend Analysis**:
```javascript
// Calculate trend direction for Run Chart
const calculateTrend = (chartData) => {
  const sortedData = chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sortedData.length < 2) return null;
  
  const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
  const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, item) => sum + parseFloat(item.value), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, item) => sum + parseFloat(item.value), 0) / secondHalf.length;
  
  return secondAvg > firstAvg ? 'positive' : 'negative';
};
```

#### **Error Handling and Data Validation**

**Common Data Validation Patterns**:
- **Empty Categories**: Check if categories array exists and has length > 0
- **Missing Statements**: Verify default statements exist for each category
- **Invalid Values**: Ensure statement values are within 0-4 range
- **Missing Highlights**: Check if required highlights exist for highlight-based reports
- **Invalid ChartData**: Verify posX/posY values are valid numbers for positioning
- **Malformed JSON**: Validate VSM process and inventory JSON structures

**Error Response Patterns**:
```javascript
// Handle missing data gracefully
const handleMissingData = (data, reportType) => {
  if (!data || data.length === 0) {
    return {
      error: true,
      message: `No data found for ${reportType}`,
      suggestion: `This report may not be initialized yet. Please create categories/statements first.`
    };
  }
  return { error: false, data };
};
```

#### **Real-time Updates and Collaboration**

**GraphQL Subscriptions for Live Updates**:
```graphql
subscription OnStatementUpdate($reportId: ID!) {
  onUpdateStatements(
    filter: { reportID: { eq: $reportId } }
  ) {
    id name value categoriesID updatedAt
  }
}

subscription OnHighlightUpdate($reportId: ID!) {
  onUpdateHighlights(
    filter: { reportID: { eq: $reportId } }
  ) {
    id title description images assignees updatedAt
  }
}
```

**Optimistic UI Updates**:
```javascript
// Update UI immediately, then sync with server
const updateStatementOptimistic = (statementId, newValue) => {
  // Update local state immediately
  setStatements(prev => prev.map(stmt => 
    stmt.id === statementId ? { ...stmt, value: newValue } : stmt
  ));
  
  // Then update server
  updateStatements({
    variables: { input: { id: statementId, value: newValue } }
  });
};
```

#### **Performance Optimization Patterns**

**Lazy Loading for Large Reports**:
```graphql
query GetReportWithPagination($reportId: ID!, $limit: Int, $nextToken: String) {
  getReport(id: $reportId) {
    id name type
  }
  
  categoriesByReportID(
    reportID: $reportId
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id name orderIndex
    }
    nextToken
  }
}
```

**Batch Operations for Multiple Updates**:
```javascript
// Batch multiple statement updates
const batchUpdateStatements = async (updates) => {
  const mutations = updates.map(update => ({
    query: UPDATE_STATEMENT,
    variables: { input: update }
  }));
  
  await Promise.all(mutations.map(mutation => client.mutate(mutation)));
};
```

### Special Report Features and Calculations

#### **Standard Work Specific Calculations**
- **Cycle Time**: Calculated as `posY - posX` (end time - start time)
- **Takt Time Comparison**: `report.target` field contains takt time goal
- **Efficiency**: `(Total Cycle Time / Available Time) * 100`
- **Operation Sequence**: Use `orderIndex` for drag-and-drop reordering

#### **VSM Specific Calculations**
- **Value Added Ratio**: `(Value Added Time / Total Lead Time) * 100`
- **Process Efficiency**: `(Cycle Time / Lead Time) * 100`
- **Waste Identification**: Count of waste types across all processes
- **Inventory Days**: Sum of all inventory wait times

#### **Chart Report Specific Features**
- **Histogram Bins**: Auto-calculate optimal bin count using Sturges' rule
- **Pareto 80/20 Line**: Identify items contributing to 80% of total
- **Run Chart Center Line**: Calculate median of all data points
- **Scatter Plot Correlation**: Calculate Pearson correlation coefficient

---

## Quick Reference Guide for AI Implementation

### **Report Type Classification Matrix**

| Report Type | Data Model | Visualization | Key Features | Action Items |
|-------------|-------------|---------------|--------------|--------------|
| **5S Report** | Categories + Statements | Radar Chart | 6 categories, 1-5 Likert scale, 30 default statements total | Standard |
| **A3 Project Report** | Highlights Only | Document Layout | 8 phases, Implementation Plan = ActionItemsCard | Integrated |
| **DMAIC Report** | Highlights Only | 3x2 Grid | 5-6 Six Sigma phases | Standard |
| **Gemba Walk Report** | Categories + Statements | Radar Chart | Department-based, observation focus | Standard |
| **Kaizen Project Report** | Categories + Statements | Radar Chart | Phase-based, improvement focus | Standard |
| **Leadership Report** | Highlights + Categories | 3x2 Grid + Radar | Dual structure, Action Items = ActionItemsCard | Integrated |
| **Lean Assessment Report** | Categories + Statements | Radar Chart | Lean principles, maturity assessment | Standard |
| **Mistake Proofing Report** | Categories + Statements | Radar Chart | Prevention focus, 0-4 scale | Standard |
| **PDCA Report** | Highlights + Categories | 2x2 Grid + Radar | 4 phases, dual structure | Standard |
| **Standard Work Report** | ChartData | Timeline Chart | Operations, timing, video support | Standard |
| **VSM Report** | VSM + ActionItems | Process Flow | Complex JSON, value analysis | Standard |
| **Waste Walk Report** | Categories + Statements + Highlights | Radar + Highlights | Waste tracking, observations | Standard |
| **5 Whys Report** | Categories + Statements | Radar Chart | Sequential questioning, text-based | Standard |
| **Brainstorming Report** | ChartData | Interactive Board | Spatial positioning, ideas | Standard |
| **Fishbone Report** | ChartData | Fishbone Diagram | 6M categories, cause positioning | Standard |
| **Histogram Report** | ChartData | Bar Chart | Frequency distribution, statistical | Standard |
| **Impact Map Report** | ChartData | Matrix Board | Impact vs Implementation matrix | Standard |
| **Pareto Chart Report** | ChartData | Pareto Chart | 80/20 rule, auto-sort, cumulative | Standard |
| **Run Chart Report** | ChartData | Line Chart | Time-series, trend analysis | Standard |
| **Scatter Plot Report** | ChartData | Scatter Plot | Correlation analysis, custom axes | Standard |
| **Stakeholder Analysis Report** | ChartData | Matrix Board | Influence/Interest positioning | Standard |

### **Data Model Quick Reference**

#### **Categories + Statements Pattern**
- **Reports**: 5S, Gemba Walk, Kaizen, Lean Assessment, Mistake Proofing, Waste Walk, 5 Whys
- **Query**: `getReport` → `categoriesByReportID` → `statementsByCategoriesID`
- **Scoring**: 1-5 scale for 5S (Likert scale), 0-4 scale for others (except 5 Whys = text-based)
- **Visualization**: Radar chart with category averages

#### **Highlights Pattern**
- **Reports**: A3, DMAIC, Leadership, PDCA, Waste Walk
- **Query**: `getReport` → `highlightsByReportIDAndCreatedAt` → `actionItemsByReportID`
- **Content**: Rich HTML descriptions, images, assignees
- **Visualization**: Grid layouts (2x2, 3x2, 4x2)

#### **ChartData Pattern**
- **Reports**: Standard Work, Brainstorming, Fishbone, Histogram, Impact Map, Pareto, Run Chart, Scatter Plot, Stakeholder
- **Query**: `getReport` → `chartDataByReportID`
- **Content**: Varies by report type (positioning, values, dates)
- **Visualization**: Chart-specific or interactive boards

#### **VSM Pattern**
- **Reports**: Value Stream Mapping
- **Query**: `getReport` → `getVsm` → `actionItemsByReportID`
- **Content**: Complex JSON with process/inventory cards
- **Visualization**: Process flow diagram

### **Common AI Response Patterns**

#### **When User Asks About Report Data**
1. **Identify Report Type**: Determine from context or ask for clarification
2. **Select Data Model**: Use matrix above to determine query pattern
3. **Fetch Complete Data**: Use appropriate query for report type
4. **Interpret Business Context**: Explain what the data represents
5. **Provide Actionable Insights**: Suggest next steps or improvements

#### **Example Response Framework**
```
User: "What's in the 5S report?"
AI Response:
1. Data: "This 5S report has 5 categories (Sort, Set in Order, Shine, Standardize, Sustain) with assessment statements."
2. Scores: "Current averages: Sort: 3.2/4, Set in Order: 2.8/4, Shine: 3.5/4, Standardize: 2.1/4, Sustain: 2.3/4"
3. Insights: "Standardize and Sustain show lowest scores, indicating opportunity for improvement in process standardization."
4. Actions: "There are 3 open action items related to standardization processes."
```

### **Error Handling Patterns**

#### **Common Issues and Responses**
- **Empty Report**: "This report appears to be newly created. Would you like me to explain how to get started?"
- **Missing Data**: "Some expected data is missing. This might be due to incomplete initialization."
- **Invalid Report Type**: "I don't recognize that report type. The available types are: [list 21 types]"
- **Access Issues**: "You may not have access to this report. Please check with your organization administrator."

### **Performance Considerations**

#### **Query Optimization**
- **Batch Related Queries**: Combine getReport + related data queries
- **Use Pagination**: For large datasets, implement pagination
- **Cache Results**: Cache frequently accessed report data
- **Filter Early**: Apply organizationID filters in all queries

#### **Data Processing**
- **Lazy Load**: Load detailed data only when needed
- **Aggregate Client-Side**: Calculate averages, totals, trends locally
- **Optimize Subscriptions**: Use targeted subscriptions for real-time updates
- **Handle Large JSON**: Process VSM JSON data efficiently

### **Integration Checklist**

#### **Before Implementing AI**
- [ ] Verify GraphQL schema access
- [ ] Test all 21 report type queries
- [ ] Understand organization context switching
- [ ] Implement proper error handling
- [ ] Set up real-time subscriptions
- [ ] Configure file attachment handling
- [ ] Test multi-data model reports (Leadership, PDCA, Waste Walk)
- [ ] Validate calculation algorithms (Pareto, Run Chart, VSM)
- [ ] Implement proper data validation
- [ ] Set up performance monitoring

#### **AI Response Quality Checklist**
- [ ] Correctly identify report type from user input
- [ ] Use appropriate data queries for report type
- [ ] Provide business context for data interpretation
- [ ] Handle missing or incomplete data gracefully
- [ ] Offer actionable insights and next steps
- [ ] Respect organization-based data access
- [ ] Support real-time collaborative features
- [ ] Provide accurate calculations and analytics

---

This comprehensive knowledge base provides complete understanding of all 21 VibeStack report types, their data structures, relationships, calculations, and integration patterns for AI assistant implementation. The AI now has the complete context needed to understand and respond to user questions about any aspect of the VibeStack reporting system.