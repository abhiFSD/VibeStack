# VibeStack™ Pro - Data Structure & GraphQL Mapping Documentation

## Overview
This document maps the data relationships between each lean tool and the GraphQL schema structure. It explains how each tool's data is structured in the database and how it's presented in the PDF reports, providing a clear understanding of the data flow from backend to frontend presentation.

## Core GraphQL Schema Structure

### Primary Entities
- **Report**: Main entity containing tool data (`id`, `name`, `type`, `user_sub`, `organizationID`, `projectID`)
- **Categories**: Tool-specific categories with statements (`id`, `name`, `reportID`, `orderIndex`)
- **Statements**: Individual assessment items (`id`, `name`, `value`, `categoriesID`, `reportID`)
- **ActionItems**: Action items linked to reports (`id`, `title`, `description`, `status`, `reportID`)
- **Highlights**: Key findings and observations (`id`, `title`, `description`, `images`, `reportID`)
- **ChartData**: Chart and visualization data (`id`, `text`, `posX`, `posY`, `value`, `reportID`)
- **Vsm**: Value Stream Mapping specific data (`id`, `process`, `informationFlow`, `kaizenProject`, `reportID`)

### Organization & Multi-Tenancy
- **Organization**: Multi-tenant organization structure (`id`, `name`, `owner`, `members`)
- **OrganizationMember**: User-organization relationships (`userSub`, `organizationID`, `role`)
- **Project**: Project management entity (`id`, `name`, `organizationID`, `reports`, `actionItems`)

---

## Tool Data Structure Documentation

### 1. 5S Tool
**Tool ID**: 1
**Report Type**: "5S Report"
**Component**: `Report5s.js`

**GraphQL Relations**:
```
Report (type: "5S Report")
├── Categories (6 predefined categories)
│   ├── "Sort" - Clear of excess equipment/materials
│   ├── "Set In Order" - Items in correct places with labels
│   ├── "Shine" - Equipment free of grime, clean areas
│   ├── "Standardize" - Checklists and standards posted
│   ├── "Safety" - No hazards, protective equipment
│   └── "Sustain" - Continuous improvement culture
├── Statements (Assessment items for each category)
│   ├── name: Statement text (e.g., "The area is clear of excess equipment...")
│   ├── value: Numerical score (1-5 scale)
│   ├── categoriesID: Links to parent category
│   └── static: Boolean flag for default statements
├── ActionItems (Improvement actions)
│   ├── title, description: Action details
│   ├── status: Implementation status (0-3)
│   ├── assignees: Array of responsible users
│   └── duedate: Target completion date
└── Highlights (Key observations)
    ├── title, description: Observation details
    ├── images: Array of S3 photo URLs
    ├── waste_type: Classification of observed issues
    └── assignees: Array of stakeholders
```

**Static Data Structure** (`StaticData5s.json`):
- 28 predefined assessment statements across 6 categories
- Each statement has default value of 3 (neutral score)
- Statements cover physical organization, electronic file management, safety protocols
- Categories ensure comprehensive 5S coverage: physical space, processes, and culture

**PDF Presentation Logic**:
- RadarChart component visualizes category average scores
- Requires minimum 3 categories for chart display
- Category scores calculated as: `avgValue = sumValues / statementCount`
- Real-time chart updates via GraphQL subscriptions
- Action items displayed with assignee information and status tracking
- Highlights section shows before/after photos with waste type classification

**Key Data Flow**:
1. **Initialization**: Categories created from static data on first use
2. **Assessment**: Users score statements (value field) from 1-5 scale
3. **Aggregation**: Category averages calculated for radar chart display
4. **Real-time Updates**: GraphQL subscriptions update chart on any statement change
5. **PDF Generation**: Aggregated data rendered in professional report format with charts

**Unique Features**:
- Root cause marking: Statements can be flagged as root causes (value toggle 0/1)
- Organization-level data isolation via `organizationID`
- Order management: Categories support `orderIndex` for custom sequencing
- Multi-user collaboration: Real-time updates across all connected users

---

### 2. A3 Project Tool
**Tool ID**: 2
**Type**: "a3"
**GraphQL Relations**:
- Report (type: "a3")
  - Categories (8 sections: Background, Current Condition, Goal, Analysis, Countermeasures, Implementation Plan, Follow-up, Results)
    - Statements (Detailed items for each section)
  - ActionItems (Implementation steps)
  - Highlights (Key findings)

**PDF Presentation**:
- Single-page A3 format layout
- Problem-solving methodology sections
- Visual process flow
- Results tracking

**Data Flow**: Categories represent A3 sections → Statements contain section details → PDF renders in standardized A3 layout

---

### 3. PDCA Tool
**Tool ID**: 9
**Type**: "pdca"
**GraphQL Relations**:
- Report (type: "pdca")
  - Categories (4 phases: Plan, Do, Check, Act)
    - Statements (Activities and measures for each phase)
  - ActionItems (Implementation actions)
  - Highlights (Key learnings)

**PDF Presentation**:
- Cyclical PDCA diagram
- Phase-based activity breakdown
- Metrics and measurements tracking
- Continuous improvement cycle visualization

**Data Flow**: Categories represent PDCA phases → Statements detail phase activities → Visual cycle representation

---

### 4. Value Stream Mapping (VSM) Tool ⭐ MOST COMPLEX
**Tool ID**: 11
**Report Type**: "Value Stream Mapping Report"
**Component**: `ReportVsm.js` + `ReportVsmPdf.js` (Dedicated VSM entity)

**GraphQL Relations**:
```
Report (type: "Value Stream Mapping Report")
└── Vsm (Dedicated complex entity) ⭐ UNIQUE STRUCTURE
    ├── process: AWSJSON (Array of process cards)
    │   └── ProcessCard Structure:
    │       ├── processID: String (Unique identifier)
    │       ├── Name: String (Process name)
    │       ├── CycleTime: String (Process cycle time value)
    │       ├── CycleTimeUnit: String (Time unit: seconds/minutes/hours/days/weeks/months/years)
    │       ├── CycleEfficiency: String (Calculated efficiency percentage)
    │       ├── CycleTimeIsSumOfAttributes: Boolean (Auto-calculate from attributes?)
    │       ├── Note: String (Process notes)
    │       ├── Images: Array[String] (S3 keys for process images)
    │       ├── Waste: Array[String] (Selected waste types from StaticWasteData.json)
    │       └── Attributes: Array[AttributeObject]
    │           ├── id: String (Generated unique ID)
    │           ├── name: String (Attribute description)
    │           ├── value: String (Time value)
    │           ├── unit: String (Time unit)
    │           └── status: String ("Value Added" | "Value Enabled" | "Non-value Added")
    │
    ├── inventory: AWSJSON (Array of inventory cards)
    │   └── InventoryCard Structure:
    │       ├── WaitTimeOrInventory: String (Wait time/inventory value)
    │       ├── WaitTimeOrInventoryUnit: String (Time unit)
    │       └── waste: Array[String] (Selected waste types)
    │
    ├── demandData: AWSJSON (Demand/Target calculations)
    │   └── DemandData Structure:
    │       ├── totalDemand: String (Total demand/volume)
    │       ├── timeToProduce: String (Available production time)
    │       ├── timeToProduceUnit: String (Unit for production time)
    │       └── taktTime: Calculated (timeToProduce / totalDemand)
    │
    ├── summaryData: AWSJSON (Calculated metrics with units)
    │   └── SummaryData Structure:
    │       ├── totalLeadTime: Object { value: String, unit: String }
    │       ├── totalCycleTime: Object { value: String, unit: String }
    │       ├── cycleTimePercentage: String (% of lead time)
    │       ├── totalWaitTimeOrInventory: Object { value: String, unit: String }
    │       └── waitTimeOrInventoryDelayPercentage: String (% of lead time)
    │
    ├── informationFlow: String (Information flow description)
    ├── kaizenProject: String (Improvement project details)
    ├── reportID: String (Links to parent Report)
    ├── _version: Int (Optimistic locking version)
    ├── _deleted: Boolean (Soft delete flag)
    ├── _lastChangedAt: AWSDateTime (Last modification)
    ├── createdAt: AWSDateTime (Creation timestamp)
    └── updatedAt: AWSDateTime (Update timestamp)
```

**Complex Calculations & Business Logic**:
1. **Cycle Time Calculation**:
   - Manual: Uses `CycleTime` field directly
   - Automatic: Sum of all `Attributes.value` converted to `CycleTimeUnit`
   - Controlled by `CycleTimeIsSumOfAttributes` boolean

2. **Cycle Efficiency Calculation**:
   ```javascript
   // Value Added Time / Total Cycle Time × 100
   efficiency = (sumValueAddedTime / totalCycleTime) * 100
   // Where Value Added = attributes with status "Value Added"
   ```

3. **Time Unit Conversions**:
   - Supports 7 units: seconds, minutes, hours, days, weeks, months, years
   - All calculations normalize to minutes then convert to target unit
   - Conversion matrix handles complex time mathematics

4. **Data Pairing Logic**:
   - Process and Inventory arrays are index-paired
   - Each process[i] relates to inventory[i] and inventory[i+1]
   - Creates visual flow: Inventory → Process → Inventory → Process...

**PDF Presentation Logic**:
- **Visual Flow Diagram**: Horizontal process flow with inventory triangles
- **Process Cards**: Show attributes table, cycle efficiency, waste types, images
- **Summary Data**: Lead time, cycle time, efficiency percentages
- **Demand Analysis**: Takt time calculations, production capacity
- **Information Flow**: Text description of communication patterns
- **Kaizen Projects**: Improvement opportunities and plans

**Critical Data Flows**:
1. **Process Creation**: Creates paired inventory cards automatically
2. **Attribute Management**: Real-time cycle time recalculation
3. **Image Handling**: S3 integration with signed URLs and compression
4. **Waste Assignment**: Integration with StaticWasteData.json (8 lean waste types)
5. **Summary Calculations**: Auto-aggregation across all process/inventory pairs
6. **PDF Generation**: Complex layout engine renders visual process flow

**VSM-Specific Features**:
- **Mathematical Process Flow**: Precise process-inventory pairing
- **Multi-Unit Time System**: Sophisticated time conversion matrix
- **Visual Layout Engine**: Renders process flow diagrams in PDF
- **Capacity Planning**: Takt time and demand analysis
- **Waste Integration**: Links to comprehensive lean waste taxonomy
- **Image Management**: Process-specific photo attachment system
- **Real-time Calculations**: Live efficiency and timing updates

**Unique Complexity**:
- **Largest Data Structure**: Most complex JSON storage in the application
- **Advanced Mathematics**: Multiple calculation engines for time/efficiency
- **Visual Rendering**: Most sophisticated PDF layout generation
- **Business Logic**: Deep lean manufacturing process modeling
- **Integration Depth**: Connects to waste data, image storage, calculations

---

### 5. Kaizen Project Tool
**Tool ID**: 5
**Type**: "kaizen"
**GraphQL Relations**:
- Report (type: "kaizen")
  - Categories (6 sections: Problem Definition, Current State, Target State, Analysis, Implementation, Results)
    - Statements (Detailed improvement items)
  - ActionItems (Implementation tasks)
  - Highlights (Before/after observations)

**PDF Presentation**:
- Problem-solution format
- Before/after comparison
- ROI calculations
- Implementation timeline

**Data Flow**: Categories define improvement phases → Statements track progress → Highlights show visual evidence

---

### 6. DMAIC Tool  
**Tool ID**: 3
**Type**: "dmaic"
**GraphQL Relations**:
- Report (type: "dmaic")
  - Categories (5 phases: Define, Measure, Analyze, Improve, Control)
    - Statements (Six Sigma methodology steps)
  - ActionItems (Implementation actions)
  - ChartData (Statistical data points)
  - Highlights (Key findings)

**PDF Presentation**:
- Six Sigma methodology format
- Statistical charts and graphs
- Control plans
- Process capability studies

**Data Flow**: Categories represent DMAIC phases → ChartData provides statistics → PDF renders control charts

---

### 7. Gemba Walk Tool
**Tool ID**: 4
**Type**: "gemba"
**GraphQL Relations**:
- Report (type: "gemba")
  - Categories (Observation areas/departments)
    - Statements (Observations and findings)
  - ActionItems (Follow-up actions)
  - Highlights (Key observations with photos)

**PDF Presentation**:
- Area-based observation summary
- Photo documentation
- Action tracking
- Trend analysis

**Data Flow**: Categories represent areas observed → Statements capture observations → Highlights provide visual evidence

---

### 8. Leadership Tool
**Tool ID**: 6
**Type**: "leadership"
**GraphQL Relations**:
- Report (type: "leadership")
  - Categories (Leadership dimensions: Vision, Communication, Team Development, Decision Making, Change Management)
    - Statements (Leadership assessment items)
  - ActionItems (Leadership development actions)
  - Highlights (Leadership observations)

**PDF Presentation**:
- Leadership competency matrix
- 360-degree feedback visualization
- Development action plans
- Progress tracking charts

**Data Flow**: Categories define leadership areas → Statements scored for competency → Visual competency mapping

---

### 9. Lean Assessment Tool
**Tool ID**: 7
**Type**: "assessment"
**GraphQL Relations**:
- Report (type: "assessment")
  - Categories (Lean maturity areas: Culture, Process, Tools, Leadership, Continuous Improvement)
    - Statements (Maturity assessment questions)
  - ActionItems (Improvement recommendations)
  - ChartData (Maturity scores)

**PDF Presentation**:
- Lean maturity radar chart
- Gap analysis
- Roadmap recommendations
- Benchmark comparisons

**Data Flow**: Categories represent maturity areas → Statements provide scoring → ChartData aggregates for visualization

---

### 10. Mistake Proofing Tool
**Tool ID**: 8
**Type**: "mistake"
**GraphQL Relations**:
- Report (type: "mistake")
  - Categories (Mistake types and prevention methods)
    - Statements (Poka-yoke implementations)
  - ActionItems (Prevention implementations)
  - Highlights (Error examples and solutions)

**PDF Presentation**:
- Error categorization matrix
- Prevention method documentation
- Implementation guidelines
- Effectiveness tracking

**Data Flow**: Categories classify mistake types → Statements detail prevention methods → Highlights show examples

---

### 11. Standard Work Tool
**Tool ID**: 10
**Type**: "standard"
**GraphQL Relations**:
- Report (type: "standard")
  - Categories (Work elements and procedures)
    - Statements (Standard work steps)
  - ActionItems (Implementation tasks)
  - ChartData (Time studies data)
  - Highlights (Process documentation)

**PDF Presentation**:
- Standard work instruction sheets
- Process flow diagrams
- Time and motion studies
- Quality checkpoints

**Data Flow**: Categories organize work elements → Statements define procedures → ChartData provides timing

---

### 12. Waste Walk Tool
**Tool ID**: 12
**Type**: "waste"
**GraphQL Relations**:
- Report (type: "waste")
  - Categories (8 wastes: Transport, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, Skills)
    - Statements (Waste observations)
  - ActionItems (Waste elimination actions)
  - Highlights (Waste examples with photos)

**PDF Presentation**:
- Waste categorization chart
- Location mapping
- Impact assessment
- Elimination roadmap

**Data Flow**: Categories classify waste types → Statements document observations → Highlights provide visual evidence

---

### 13. 5 Whys Tool
**Tool ID**: 13
**Type**: "whys"
**GraphQL Relations**:
- Report (type: "whys")
  - Categories (Problem investigation layers)
    - Statements (Why questions and answers)
  - ActionItems (Root cause solutions)
  - Highlights (Problem evidence)

**PDF Presentation**:
- Root cause analysis tree
- Why-question progression
- Solution implementation plan
- Problem recurrence prevention

**Data Flow**: Categories structure investigation → Statements capture why-answer pairs → Progressive root cause identification

---

### 14. Brainstorming Tool
**Tool ID**: 14
**Report Type**: "Brainstorming Report"
**Component**: `ReportChartPdf.js` (Canvas-based)

**GraphQL Relations**:
```
Report (type: "Brainstorming Report")
├── ChartData (Canvas positioning data) ⭐ KEY DIFFERENCE
│   ├── text: Idea/concept text content
│   ├── textColor: Display color for the text
│   ├── posX: X-coordinate position (pixels) 
│   ├── posY: Y-coordinate position (pixels)
│   ├── reportID: Links to parent report
│   ├── value: Optional numerical value
│   ├── description: Additional details
│   └── orderIndex: Optional ordering
└── ActionItems (Implementation actions)
    ├── title, description: Action details
    ├── status: Implementation status (0-3)
    ├── assignees: Array of responsible users
    ├── attachments: Array of S3 image URLs
    └── duedate: Target completion date
```

**Canvas Structure**:
- Fixed canvas size: 1024x640 pixels
- Grid layout with quadrant system
- Cross-axis dividers (vertical & horizontal lines)
- Quadrant labels: "Problem" (top quadrants), "Problem Solution" (bottom quadrants)

**PDF Presentation Logic**:
- Canvas-based positioning system using absolute coordinates
- Real-time draggable interface (edit mode) → Fixed positions (PDF mode)
- Each idea rendered as positioned text element at `posX`, `posY` coordinates
- Text color customization via `textColor` field
- Maximum width constraint: 350px per text element
- Automatic text wrapping with `whiteSpace: 'pre-wrap'`

**Key Data Flow**:
1. **Canvas Interaction**: Users drag/drop ideas on 1024x640 pixel canvas
2. **Position Capture**: X,Y coordinates stored in ChartData.posX/posY
3. **Content Storage**: Idea text stored in ChartData.text field
4. **PDF Rendering**: Absolute positioning recreates exact canvas layout
5. **Real-time Updates**: GraphQL subscriptions sync canvas changes across users

**Unique Features**:
- Canvas-based UI (not form-based like other tools)
- Absolute pixel positioning for precise layout control
- Multi-user collaborative canvas with real-time updates
- Quadrant-based problem-solution mapping framework

---

### 15. Fishbone Diagram Tool
**Tool ID**: 15
**Report Type**: "Fishbone Diagram Report"
**Component**: `ReportChartPdf.js` (Canvas-based with dynamic bone structure)

**GraphQL Relations**:
```
Report (type: "Fishbone Diagram Report")
├── ChartData (Cause positioning data) ⭐ CANVAS-BASED
│   ├── text: Cause description/text
│   ├── textColor: Display color for cause text
│   ├── posX: X-coordinate position (pixels)
│   ├── posY: Y-coordinate position (pixels)
│   ├── reportID: Links to parent report
│   ├── value: Optional impact/priority value
│   └── description: Detailed cause analysis
├── bones: Report field for number of fishbone branches
└── ActionItems (Investigation and corrective actions)
    ├── title, description: Action details
    ├── status: Implementation status (0-3)
    ├── assignees: Array of responsible users
    └── attachments: Evidence attachments
```

**Dynamic Fishbone Structure**:
- **Spine**: Horizontal line from left to effect box (right side)
- **Effect Box**: Positioned at right side with problem statement
- **Bones**: Dynamically calculated based on Report.bones field
  - Top bones: 60° angle, positioned above spine
  - Bottom bones: -60° angle, positioned below spine
  - Bone spacing: Calculated as `((2 * gap)) / (bones/3.5)`
  - Bone length: Fixed at 250px
- **Canvas Dimensions**: 1024x640 pixels for standard layout

**Fishbone Mathematics**:
```javascript
boneLength = 250;
gap = boneLength * 0.10; // 10% of bone length
bones = report.bones; // Dynamic number from database
boneSpacingMultiplier = ((2 * gap)) / (bones/3.5);
boneStart = (index * boneSpacingMultiplier + 3) / 100 * (fixedWidth - 300 - (2 * gap));

// Transform calculations:
// Top bone: translateY(-110px) rotate(60deg)
// Bottom bone: translateY(110px) rotate(-60deg)
```

**PDF Presentation Logic**:
- **Structure Generation**: SVG-like bone structure created with CSS transforms
- **Cause Positioning**: Each cause placed at specific posX/posY coordinates
- **Dynamic Layout**: Number of bones adjusts based on Report.bones value
- **Effect Labeling**: Labels positioned: "Bones Major Cause Categories" (left), "Effect" (right)

**Key Data Flow**:
1. **Bone Configuration**: Report.bones field defines fishbone structure complexity
2. **Cause Placement**: Users position causes on canvas, coordinates stored in ChartData
3. **Mathematical Layout**: Bone angles and spacing calculated algorithmically
4. **PDF Rendering**: CSS transforms recreate exact fishbone diagram with positioned causes

**Unique Features**:
- **Mathematical bone generation** based on configurable bone count
- **Precise angular positioning** (60° and -60° bone angles)
- **Dynamic structure scaling** adapts to different bone counts
- **Root cause spatial organization** along fishbone branches

---

### 16. Histogram Tool
**Tool ID**: 16
**Report Type**: "Histogram Report"
**Component**: `ReportDataChartPdf.js` + `ReportHg.js`

**GraphQL Relations**:
```
Report (type: "Histogram Report")
├── ChartData (Statistical data points) ⭐ CHART-FOCUSED
│   ├── text: Data label/category name
│   ├── value: Frequency count (numerical)
│   ├── reportID: Links to parent report
│   ├── description: Additional data context
│   ├── date: Data collection timestamp
│   ├── orderIndex: Display order
│   └── createdAt: Creation timestamp for sorting
├── xaxis: Report field for X-axis label
├── yaxis: Report field for Y-axis label
├── target: Optional target value line
└── ActionItems (Analysis and improvement actions)
```

**Chart Data Management**:
- **Data Input Interface**: Form-based entry (label + value pairs)
- **Sorting Logic**: Chronological by createdAt/date (oldest first) for PDF consistency
- **Validation**: Both text (label) and value fields required
- **Real-time Updates**: GraphQL subscriptions for live chart updates

**PDF Presentation Logic**:
- **BarChart Component**: Renders frequency distribution histogram
- **Axis Configuration**: Report.xaxis and Report.yaxis define axis labels
- **Data Sorting**: Maintains chronological order for reproducible histogram bins
- **Statistical Analysis**: Automatic binning and frequency calculation

**Chart Data Flow**:
1. **Data Collection**: Users input label-value pairs via form interface
2. **Storage**: Each entry creates ChartData record with text/value
3. **Aggregation**: Chart component processes data for histogram bins
4. **Visualization**: BarChart renders frequency distribution
5. **PDF Export**: Maintains exact data order and visual representation

**Key Features**:
- **Frequency distribution analysis** from raw data points
- **Chronological data preservation** for consistent histogram generation
- **Interactive data management** with add/edit/delete capabilities
- **Statistical chart rendering** with configurable axis labels

---

### 17. Impact Map Tool
**Tool ID**: 17
**Type**: "impact"
**GraphQL Relations**:
- Report (type: "impact")
  - Categories (Impact areas and stakeholders)
    - Statements (Impact descriptions)
  - ActionItems (Implementation steps)
  - Highlights (Key impacts)

**PDF Presentation**:
- Impact mapping diagram
- Stakeholder analysis
- Benefit realization plan
- Success metrics

**Data Flow**: Categories define impact areas → Statements describe impacts → Stakeholder relationship mapping

---

### 18. Pareto Chart Tool
**Tool ID**: 18
**Report Type**: "Pareto Chart Report"  
**Component**: `ReportDataChartPdf.js` + `ReportHg.js`

**GraphQL Relations**:
```
Report (type: "Pareto Chart Report")
├── ChartData (Problem frequency data) ⭐ VALUE-SORTED
│   ├── text: Problem category/description
│   ├── value: Frequency/count (numerical)
│   ├── reportID: Links to parent report
│   ├── description: Problem details
│   ├── orderIndex: Calculated sort position
│   └── createdAt: Entry timestamp
├── xaxis: "Problem Categories" (typical)
├── yaxis: "Frequency" (typical)
└── ActionItems (Priority improvement actions)
```

**Pareto-Specific Sorting**:
- **Automatic Sorting**: Data sorted by value (descending) - highest frequency first
- **80/20 Analysis**: ParetoChart component calculates cumulative percentages
- **Priority Ranking**: Visual representation shows critical few vs. trivial many

**Chart Rendering**:
- **ParetoChart Component**: Specialized chart showing bars + cumulative line
- **Dual Y-Axis**: Left axis (frequency), Right axis (cumulative percentage)
- **80% Line**: Visual marker showing 80/20 rule threshold

**Data Flow**:
1. **Problem Entry**: Users input problem categories with frequency counts
2. **Auto-Sorting**: System sorts by value (highest to lowest frequency)
3. **Cumulative Calculation**: Chart calculates running percentage totals
4. **80/20 Visualization**: Clear identification of vital few problems
5. **Priority Actions**: Action items focus on top 20% of causes

---

### 19. Run Chart Tool
**Tool ID**: 19
**Type**: "run"
**GraphQL Relations**:
- Report (type: "run")
  - ChartData (Time series data)
    - text (Time labels)
    - value (Measurement values)
    - date (Time stamps)
  - Categories (Measurement types)
  - ActionItems (Process improvements)

**PDF Presentation**:
- Time series line chart
- Trend analysis
- Process stability assessment
- Control rules application

**Data Flow**: ChartData provides time-ordered measurements → Trend analysis → Process stability visualization

---

### 20. Scatter Plot Tool
**Tool ID**: 20
**Report Type**: "Scatter Plot Report"
**Component**: `ReportDataChartPdf.js` + `ReportHg.js`

**GraphQL Relations**:
```
Report (type: "Scatter Plot Report")
├── ChartData (X-Y coordinate pairs) ⭐ DUAL-VALUE INPUT
│   ├── text: Data point label/identifier
│   ├── value: Y-axis value (numerical) 
│   ├── posX: X-axis value (numerical) ⭐ UNIQUE USAGE
│   ├── posY: Y-axis value (copy of value field)
│   ├── reportID: Links to parent report
│   ├── description: Data point context
│   └── date: Data collection timestamp
├── xaxis: X-variable label (e.g., "Temperature")
├── yaxis: Y-variable label (e.g., "Quality Score")
└── ActionItems (Correlation analysis actions)
```

**Dual-Value Input System**:
- **X-Value Field**: Users enter X-coordinate in dedicated input (stored as posX)
- **Y-Value Field**: Users enter Y-coordinate in dedicated input (stored as value)
- **Validation**: Both X and Y values required (validated in ReportHg.js)
- **Label Field**: Optional identifier for each data point

**Correlation Analysis Features**:
- **ScatterChart Component**: Plots X,Y coordinates with correlation analysis
- **Regression Line**: Automatic best-fit line calculation
- **Correlation Coefficient**: Statistical relationship strength
- **Outlier Detection**: Visual identification of unusual data points

**Data Flow**:
1. **Dual Entry**: Users input both X-value and Y-value for each data point
2. **Coordinate Storage**: posX (X-axis), value (Y-axis) stored in ChartData
3. **Plot Generation**: ScatterChart renders coordinate pairs
4. **Correlation Analysis**: Mathematical relationship analysis
5. **Insight Generation**: Action items based on correlation findings

**Unique Features**:
- **Dual-axis data entry** requiring both X and Y coordinates
- **Statistical correlation analysis** with regression modeling
- **Relationship strength visualization** showing variable dependencies
- **Outlier identification** for quality control analysis

---

### 21. Stakeholder Analysis Tool
**Tool ID**: 21
**Type**: "stakeholder"
**GraphQL Relations**:
- Report (type: "stakeholder")
  - Categories (Stakeholder groups and influence levels)
    - Statements (Stakeholder details and strategies)
  - ActionItems (Engagement actions)
  - Highlights (Key stakeholder insights)

**PDF Presentation**:
- Stakeholder influence matrix
- Engagement strategy map
- Communication plan
- Relationship management

**Data Flow**: Categories classify stakeholder types → Statements define engagement strategies → Influence mapping

---

## Common Data Patterns

### Multi-Tenant Data Isolation
All tools implement organization-level data segregation through:
- `organizationID` field in Report entity
- Organization-specific member access
- Data filtering at GraphQL query level

### Audit Trail
All entities include versioning and soft delete capabilities:
- `_version`: Optimistic locking
- `_deleted`: Soft delete flag
- `_lastChangedAt`: Audit timestamp
- `createdAt/updatedAt`: Entity lifecycle

### Report Lifecycle
1. **Creation**: Report entity with tool type
2. **Configuration**: Categories and Statements setup
3. **Data Collection**: Statement scoring/completion
4. **Analysis**: ChartData generation and Highlights addition
5. **Action Planning**: ActionItems creation
6. **PDF Generation**: Data aggregation for professional reporting

### Visualization Data Flow
Chart data follows consistent patterns:
- ChartData entity stores visualization points
- Categories provide grouping context
- Report-level fields (xaxis, yaxis, target, trend) configure chart display
- PDF components render charts using Chart.js library

---

## Key Data Structure Patterns Discovered

### 📊 Chart-Based Tools (ChartData Entity)
**Tools**: Histogram, Pareto Chart, Run Chart, Scatter Plot, Standard Work
- **Primary Entity**: ChartData with text/value pairs
- **Sorting Logic**: Tool-specific (Pareto: value DESC, Run Chart: date ASC, Histogram: createdAt ASC)
- **Chart Components**: BarChart, ParetoChart, RunChart, ScatterChart
- **PDF Flow**: Form input → ChartData storage → Chart rendering → PDF export

### 🎨 Canvas-Based Tools (Positional ChartData)
**Tools**: Brainstorming, Fishbone Diagram, Impact Map, Stakeholder Analysis
- **Primary Entity**: ChartData with posX/posY coordinates  
- **Canvas Size**: Fixed dimensions (1024x640 or 994x590 pixels)
- **Positioning**: Absolute pixel coordinates for precise layout control
- **PDF Flow**: Canvas interaction → Position capture → Coordinate storage → PDF positioning

### 📋 Category-Statement Tools (Traditional Structure)
**Tools**: 5S, A3, PDCA, Kaizen, Gemba Walk, Leadership, Lean Assessment, etc.
- **Primary Entities**: Categories → Statements hierarchy
- **Assessment Flow**: Categories define areas → Statements provide scoring → Aggregated analysis
- **PDF Flow**: Form-based assessment → Scoring aggregation → Chart/table visualization

### 🗺️ Specialized Tools (Custom Entities)
**Value Stream Mapping**: Dedicated Vsm entity with complex JSON fields
- **JSON Fields**: process, demandData, summaryData, inventory
- **Complex Data**: Process flow definitions, metrics, kaizen projects
- **Visual Flow**: JSON data → Process diagram rendering

### 🔄 Real-Time Collaboration Features
**All Tools**: GraphQL subscriptions for live updates
- **Multi-user editing**: Real-time synchronization across connected users
- **Version control**: Optimistic locking with _version field
- **Organization isolation**: Multi-tenant data segregation

### 📱 Action Items & Attachments (Universal)
**All Tools**: Consistent action item and attachment handling
- **Status tracking**: 4-state workflow (To Do, In Progress, In Review, Done)
- **Assignee management**: UserSub-based assignment with email resolution
- **S3 attachments**: Photo/file storage with signed URL access
- **PDF integration**: Action items included in all PDF exports

This comprehensive documentation provides the complete foundation for understanding how each lean tool's data flows from GraphQL backend through React frontend to PDF presentation layer, with specific attention to the unique data patterns and positioning requirements of different tool categories.