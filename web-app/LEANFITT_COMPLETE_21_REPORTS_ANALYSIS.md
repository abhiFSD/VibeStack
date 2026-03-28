# VibeStack™ Pro - Complete 21 Report Types Analysis

This document provides a comprehensive analysis of all 21 report types in the VibeStack application, including their complete data structures, default templates, and specific implementations.

## Core Data Models

### Report Model (Universal)
```graphql
type Report {
  id: ID!
  name: String!
  type: String!              # One of 21 report types
  user_sub: String
  ownerEmail: String
  ai_id: String
  completed: Boolean
  bones: Int                 # Time units (1=seconds, 2=minutes, 3=hours)
  trend: Boolean             # For Run Chart (positive/negative trend)
  target: String             # Target values, Y-axis labels, takt time
  media: String              # Video keys, X-axis labels
  xaxis: String              # X-axis label
  yaxis: String              # Y-axis label
  organizationID: ID!
  projectID: ID
  assignedMembers: [String]  # Array of user IDs
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _version: Int
  _deleted: Boolean
}
```

### Categories Model (Category-Based Reports)
```graphql
type Categories {
  id: ID!
  name: String!
  reportID: ID!
  orderIndex: Int!
  assignees: [String]        # Array of user IDs
  attachments: [String]      # Array of S3 keys
  description: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _version: Int
  _deleted: Boolean
}
```

### Statements Model (Category-Based Reports)
```graphql
type Statements {
  id: ID!
  name: String!
  value: Int                 # 0-4 scale or binary values
  default: Boolean           # True for default/template statements
  owner: String              # User sub for custom statements
  categoriesID: ID!
  categoryName: String
  reportID: ID!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _version: Int
  _deleted: Boolean
}
```

### Highlights Model (Highlight-Based Reports)
```graphql
type Highlights {
  id: ID!
  title: String!
  description: String!       # Rich HTML content
  images: [String]           # Array of S3 keys
  assignees: [String]        # Array of user IDs
  reportID: ID!
  waste_type: String         # For Waste Walk categorization
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

### ChartData Model (Chart-Based Reports)
```graphql
type ChartData {
  id: ID!
  text: String!              # Label or category name
  textColor: String          # Color for visualization
  posX: String               # X coordinate or start time
  posY: String               # Y coordinate or end time
  reportID: ID!
  value: String              # Numeric value
  Description: String        # Detailed description
  date: String               # For time-series data
  orderIndex: Int            # For drag-and-drop ordering
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _version: Int
  _deleted: Boolean
}
```

### VSM Model (Value Stream Mapping)
```graphql
type VSM {
  id: ID!
  process: String!           # JSON string of process cards
  informationFlow: String
  kaizenProject: String
  demandData: String         # JSON string
  summaryData: String        # JSON string
  reportID: ID!
  inventory: String          # JSON string of inventory cards
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  _version: Int
  _deleted: Boolean
}
```

---

## LEAN TOOLS (12 Reports)

### 1. 5S Report
**Data Structure**: Categories + Statements + Radar Chart
**Default Categories**: 
- Sort (Seiri)
- Set in Order (Seiton)
- Shine (Seiso)
- Standardize (Seiketsu)
- Sustain (Shitsuke)

**Default Statements per Category**: ~10-15 assessment statements
**Statement Values**: 0-4 scale (0=Poor, 1=Below Average, 2=Average, 3=Above Average, 4=Excellent)
**Chart**: Radar chart showing average scores per category
**Special Features**: Root cause marking, category ordering

**GraphQL Queries**:
```graphql
query Get5SReport($reportId: ID!) {
  getReport(id: $reportId) {
    id name type completed
  }
  categoriesByReportID(reportID: $reportId) {
    items {
      id name orderIndex assignees attachments
    }
  }
  statementsByCategoriesID(categoriesID: $categoryId) {
    items {
      id name value default owner
    }
  }
}
```

### 2. A3 Project Report
**Data Structure**: Highlights Only (No Categories/Statements)
**Default Highlights**:
- Problem Statement
- Current State
- Improvement Opportunity
- Problem Analysis
- Future State
- Implementation Plan (Shows ActionItems)
- Verify Results
- Follow-Up

**Special Features**: 
- Implementation Plan card shows ActionItemsCard component
- Document-style layout
- Rich HTML content in descriptions
- No radar chart

**GraphQL Queries**:
```graphql
query GetA3Report($reportId: ID!) {
  getReport(id: $reportId) {
    id name type completed
  }
  highlightsByReportIDAndCreatedAt(reportID: $reportId) {
    items {
      id title description images assignees
    }
  }
  actionItemsByReportID(reportID: $reportId) {
    items {
      id title description status priority dueDate
    }
  }
}
```

### 3. DMAIC Report
**Data Structure**: Highlights Only (No Categories/Statements)
**Default Highlights**:
- (Prepare) - Optional phase
- Define
- Measure
- Analyze
- Improve
- Control

**Special Features**:
- Six Sigma methodology focus
- Process improvement phases
- 3x2 grid layout
- No radar chart

**GraphQL Queries**:
```graphql
query GetDMAICReport($reportId: ID!) {
  getReport(id: $reportId) {
    id name type completed
  }
  highlightsByReportIDAndCreatedAt(reportID: $reportId) {
    items {
      id title description images assignees
    }
  }
}
```

### 4. Gemba Walk Report
**Data Structure**: Categories + Statements
**Default Categories**: Department-based (varies by organization)
**Default Statements**: Observation-based statements from static data
**Statement Values**: 0-4 scale assessment
**Chart**: Radar chart for department assessments
**Special Features**: Department-specific filtering, observation focus

**GraphQL Queries**:
```graphql
query GetGembaWalkReport($reportId: ID!) {
  getReport(id: $reportId) {
    id name type completed
  }
  categoriesByReportID(reportID: $reportId) {
    items {
      id name orderIndex
    }
  }
  statementsByCategoriesID(categoriesID: $categoryId) {
    items {
      id name value default
    }
  }
}
```

### 5. Kaizen Project Report
**Data Structure**: Categories + Statements
**Default Categories**: Project phases
**Default Statements**: Phase-specific improvement statements
**Statement Values**: 0-4 scale assessment
**Chart**: Radar chart showing phase progress
**Special Features**: Phase-based organization, continuous improvement focus

### 6. Leadership Report
**Data Structure**: Highlights + Traditional Categories
**Default Highlights**:
- Accomplishments and significant events
- Improvement PDCAs
- Special recognitions
- Upcoming issues and events
- Resource and support needs
- Action Items (Shows ActionItemsCard component)

**Special Features**:
- Dual structure (Highlights + Categories)
- Defaults to "Departments" tab
- Action Items as highlight card
- 3x2 grid layout

**GraphQL Queries**:
```graphql
query GetLeadershipReport($reportId: ID!) {
  getReport(id: $reportId) {
    id name type completed
  }
  highlightsByReportIDAndCreatedAt(reportID: $reportId) {
    items {
      id title description images assignees
    }
  }
  categoriesByReportID(reportID: $reportId) {
    items {
      id name orderIndex
    }
  }
  actionItemsByReportID(reportID: $reportId) {
    items {
      id title description status priority
    }
  }
}
```

### 7. Lean Assessment Report
**Data Structure**: Categories + Statements Only
**Default Categories**: Lean principle categories
**Default Statements**: Assessment statements from LOA static data
**Statement Values**: 0-4 scale assessment
**Chart**: Radar chart for lean maturity assessment
**Special Features**: Comprehensive lean evaluation, no highlights

### 8. Mistake Proofing Report
**Data Structure**: Categories + Statements
**Default Categories**: Mistake-proofing categories
**Default Statements**: Prevention and detection statements
**Statement Values**: 0-4 scale assessment
**Chart**: Radar chart showing prevention effectiveness
**Special Features**: Error prevention focus

### 9. PDCA Report
**Data Structure**: Highlights + Traditional Categories
**Default Highlights**:
- Plan
- Do
- Check
- Act

**Special Features**:
- Dual structure (Highlights + Categories)
- Continuous improvement cycle
- 2x2 grid layout
- Both highlight cards and traditional scoring

### 10. Standard Work Report
**Data Structure**: ChartData + Video Attachments
**ChartData Fields**:
- `text`: Operation type (Auto, Manual, Wait, Walk)
- `posX`: Start time
- `posY`: End time
- `value`: Calculated cycle time
- `orderIndex`: Sequence for drag-and-drop
- `Description`: Operation description

**Report Fields**:
- `bones`: Time unit (1=seconds, 2=minutes, 3=hours)
- `target`: Takt time goal
- `media`: Video attachment S3 key

**Chart**: Gantt-style timeline chart
**Special Features**: 
- Drag-and-drop operation ordering
- Video attachment support
- Cycle time vs takt time analysis
- Color-coded operations

**GraphQL Queries**:
```graphql
query GetStandardWorkReport($reportId: ID!) {
  getReport(id: $reportId) {
    id name type bones target media
  }
  chartDataByReportID(reportID: $reportId) {
    items {
      id text posX posY value orderIndex Description
    }
  }
}
```

### 11. Value Stream Mapping Report
**Data Structure**: VSM + ActionItems
**VSM Process Cards** (JSON in process field):
```json
{
  "processID": "unique-id",
  "Name": "Process Name",
  "CycleTime": "30",
  "CycleTimeUnit": "minutes",
  "CycleEfficiency": "85%",
  "Attributes": [
    {
      "id": "attr-id",
      "name": "Setup Time",
      "value": "15",
      "unit": "minutes",
      "status": "Non-value Added"
    }
  ],
  "Note": "Process notes",
  "CycleTimeIsSumOfAttributes": true,
  "Images": ["s3-key-1", "s3-key-2"],
  "Waste": ["Motion", "Waiting"]
}
```

**VSM Inventory Cards** (JSON in inventory field):
```json
{
  "WaitTimeOrInventory": "2",
  "WaitTimeOrInventoryUnit": "days",
  "waste": ["Inventory", "Waiting"]
}
```

**Additional Fields**:
- `informationFlow`: Text description
- `kaizenProject`: Improvement opportunities
- `demandData`: Customer demand information (JSON)
- `summaryData`: Process summary metrics (JSON)

**GraphQL Queries**:
```graphql
query GetVSMReport($reportId: ID!) {
  getReport(id: $reportId) {
    id name type
  }
  getVSM(id: $reportId) {
    id process inventory informationFlow kaizenProject demandData summaryData
  }
  actionItemsByReportID(reportID: $reportId) {
    items {
      id title description status
    }
  }
}
```

### 12. Waste Walk Report
**Data Structure**: Categories + Statements + Highlights
**Default Categories**: Area or waste type categories
**Default Statements**: Waste identification statements
**Statement Values**: 0-4 scale assessment
**Chart**: Radar chart showing waste levels
**Special Features**: Waste type tracking, highlight cards for observations

---

## QUALITY TOOLS (9 Reports)

### 13. 5 Whys Report
**Data Structure**: Categories + Statements
**Default Categories**: 
- Problem Statement
- Why 1
- Why 2
- Why 3
- Why 4
- Why 5
- Root Cause

**Default Statements**: Why questions and analysis statements
**Statement Values**: Text-based responses
**Chart**: Radar chart for problem analysis
**Special Features**: Root cause analysis flow, sequential questioning

### 14. Brainstorming Report
**Data Structure**: ChartData (Board View)
**ChartData Fields**:
- `text`: Idea content
- `textColor`: Visual color coding
- `posX`: X coordinate on board
- `posY`: Y coordinate on board
- `Description`: Detailed idea description

**Chart**: Interactive board/canvas view
**Special Features**: 
- Drag-and-drop idea positioning
- Color-coded categories
- Visual brainstorming interface

**GraphQL Queries**:
```graphql
query GetBrainstormingReport($reportId: ID!) {
  getReport(id: $reportId) {
    id name type
  }
  chartDataByReportID(reportID: $reportId) {
    items {
      id text textColor posX posY Description
    }
  }
}
```

### 15. Fishbone Diagram Report
**Data Structure**: ChartData (Board View)
**ChartData Fields**:
- `text`: Cause description
- `textColor`: Category color (6M categories)
- `posX`: X coordinate
- `posY`: Y coordinate
- `Description`: Detailed cause description

**Default Categories**: 6M structure
- Man (People)
- Machine
- Material
- Method
- Measurement
- Environment

**Chart**: Fishbone diagram layout
**Special Features**: 
- Cause-and-effect visualization
- 6M category structure
- Spatial cause positioning

### 16. Histogram Report
**Data Structure**: ChartData
**ChartData Fields**:
- `text`: Bin label/range
- `value`: Frequency count
- `Description`: Bin description

**Chart**: Histogram bar chart
**Special Features**: 
- Frequency distribution analysis
- Automatic bin calculations
- Statistical analysis

**GraphQL Queries**:
```graphql
query GetHistogramReport($reportId: ID!) {
  getReport(id: $reportId) {
    id name type
  }
  chartDataByReportID(reportID: $reportId) {
    items {
      id text value Description
    }
  }
}
```

### 17. Impact Map Report
**Data Structure**: ChartData (Board View)
**ChartData Fields**:
- `text`: Impact factor/initiative
- `textColor`: Visual color coding
- `posX`: X coordinate (Implementation difficulty)
- `posY`: Y coordinate (Impact level)
- `Description`: Detailed description

**Chart**: Interactive impact vs implementation matrix
**Special Features**: 
- Strategic impact visualization
- 2x2 or 3x3 matrix layout
- Priority quadrants

### 18. Pareto Chart Report
**Data Structure**: ChartData
**ChartData Fields**:
- `text`: Category/cause label
- `value`: Frequency/count
- `Description`: Category description

**Chart**: Pareto chart (bar + cumulative line)
**Special Features**: 
- Automatic sorting by value (descending)
- Cumulative percentage calculation
- 80/20 rule visualization
- Dual-axis chart

**GraphQL Queries**:
```graphql
query GetParetoReport($reportId: ID!) {
  getReport(id: $reportId) {
    id name type
  }
  chartDataByReportID(reportID: $reportId) {
    items {
      id text value Description
    }
  }
}
```

### 19. Run Chart Report
**Data Structure**: ChartData
**ChartData Fields**:
- `value`: Measured value
- `date`: Time point
- `Description`: Data point description

**Report Fields**:
- `trend`: Positive/negative trend indicator
- `target`: Target line value
- `media`: X-axis label
- `yaxis`: Y-axis label

**Chart**: Run chart (line chart over time)
**Special Features**:
- Time-series analysis
- Trend direction indication
- Target line overlay
- Date-based sorting

**GraphQL Queries**:
```graphql
query GetRunChartReport($reportId: ID!) {
  getReport(id: $reportId) {
    id name type trend target media yaxis
  }
  chartDataByReportID(reportID: $reportId) {
    items {
      id value date Description
    }
  }
}
```

### 20. Scatter Plot Report
**Data Structure**: ChartData
**ChartData Fields**:
- `posX`: X variable value
- `posY`: Y variable value
- `Description`: Data point description

**Report Fields**:
- `media`: X-axis label
- `target`: Y-axis label

**Chart**: Scatter plot
**Special Features**:
- Correlation analysis
- Custom axis labels
- Trend line capabilities

**GraphQL Queries**:
```graphql
query GetScatterPlotReport($reportId: ID!) {
  getReport(id: $reportId) {
    id name type media target
  }
  chartDataByReportID(reportID: $reportId) {
    items {
      id posX posY Description
    }
  }
}
```

### 21. Stakeholder Analysis Report
**Data Structure**: ChartData (Board View)
**ChartData Fields**:
- `text`: Stakeholder name/role
- `textColor`: Visual color coding
- `posX`: X coordinate (Influence/Power)
- `posY`: Y coordinate (Interest/Impact)
- `Description`: Stakeholder details

**Chart**: Interactive stakeholder matrix
**Special Features**: 
- Stakeholder positioning
- Power/Interest or Influence/Impact matrix
- Strategic relationship mapping

---

## Universal Features Across All Reports

### Action Items Integration
```graphql
type ActionItems {
  id: ID!
  title: String!
  description: String
  status: Int                # 0=To Do, 1=In Progress, 2=In Review, 3=Done
  priority: String           # High, Medium, Low
  assignees: [String]        # Array of user IDs
  dueDate: String
  reportID: ID!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

### File Attachments
- Image uploads stored in S3
- Video attachments for Standard Work
- Attachment lists with preview
- Deletion and management capabilities

### Multi-tenant Architecture
- All data segregated by organizationID
- User-based access control
- Organization-specific configurations

### PDF Export
- Professional formatting with charts
- Organization branding
- Comprehensive report generation

### Real-time Updates
- GraphQL subscriptions for live collaboration
- Optimistic UI updates
- Version conflict handling

---

## AI Understanding Summary

When users ask about specific reports, the AI should understand:

1. **Data Structure**: Which model(s) each report uses
2. **Default Content**: What gets created automatically
3. **Specific Features**: Charts, calculations, special handling
4. **Query Patterns**: How to fetch complete data
5. **Relationships**: How data connects (categories→statements, etc.)

This comprehensive analysis provides the complete picture of how all 21 VibeStack report types store, structure, and present their data to users.