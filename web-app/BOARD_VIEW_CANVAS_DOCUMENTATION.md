# Board View Canvas Documentation

## Overview

The Board View is an interactive canvas system in VibeStack™ Pro that allows users to create, position, and manage text elements on structured diagrams. This documentation explains how data is added to the canvas, how positioning works, and the underlying mechanics of the board view system.

## URL Structure and Routing

- **Report Detail View**: `/report/bs/{reportId}` (ReportBs component)
- **Board View**: `/report/board/{reportId}` (BoardView component)

The board view is accessed from the report detail view via the "Board View" button which navigates to `/report/board/{reportId}`.

## Architecture Components

### Core Components

1. **BoardView.js** (`src/components/reports/BoardView.js`)
   - Main canvas container and interaction logic
   - Handles drag & drop positioning
   - Manages data fetching and state

2. **InputTextDialog.js** (`src/components/reports/InputTextDialog.js`)
   - Modal for adding new text elements
   - Color selection interface
   - Text input with multi-line support

3. **EditDialog.js** (`src/components/reports/EditDialog.js`)
   - Modal for editing existing text elements
   - Text modification and deletion capabilities
   - Color updates

### Data Model (GraphQL Schema)

```graphql
type ChartData @model @auth(rules: [{allow: public}]) {
  id: ID!
  text: String
  textColor: String
  posX: String           // X coordinate as string
  posY: String           // Y coordinate as string  
  reportID: ID! @index(name: "byReport")
  value: String
  Description: String
  date: String
  orderIndex: Int
  _version: Int          // For optimistic concurrency control
  _deleted: Boolean      // Soft delete flag
  _lastChangedAt: AWSTimestamp
}
```

## Canvas Positioning System

### Canvas Dimensions

The canvas has fixed dimensions that vary by report type:

```javascript
const fixedWidth = (report?.type === 'Impact Map Report' || report?.type === 'Stakeholder Analysis Report') ? 994 : 1024;
const fixedHeight = (report?.type === 'Impact Map Report' || report?.type === 'Stakeholder Analysis Report') ? 590 : 640;
```

### Container Structure

```
Outer Container (fixedWidth + 80 x fixedHeight + 80)
└── Inner Canvas (fixedWidth x fixedHeight)
    ├── Static Structure Elements (lines, labels)
    └── Draggable Text Elements
```

### Coordinate System

- **Origin**: Top-left corner (0, 0)
- **X-axis**: Left to right (positive values move right)
- **Y-axis**: Top to bottom (positive values move down)
- **Units**: Pixels
- **Storage**: Coordinates stored as strings in database

### Default Positioning

When new text is added:
```javascript
const posX = 500;  // Default X position
const posY = 3;    // Default Y position (near top)
```

## Data Flow and Canvas Operations

### 1. Adding Text to Canvas

**User Flow:**
1. User clicks "Add Text" button
2. InputTextDialog modal opens
3. User enters text and selects color
4. Modal calls `addText()` function
5. Text appears on canvas at default position

**Technical Flow:**
```javascript
const addText = async ({ text, textColor }) => {
  // Create new ChartData record
  const createChartDataResult = await API.graphql({
    query: mutations.createChartData,
    variables: {
      input: {
        text,
        textColor,
        posX: posX.toString(),  // Convert to string
        posY: posY.toString(),  // Convert to string
        reportID: reportId,
      }
    }
  });
  
  // Optimistically update local state
  setDraggables(prevDraggables => [...prevDraggables, newChartData]);
};
```

### 2. Canvas Data Loading

**Initial Load Process:**
```javascript
const fetchData = useCallback(async () => {
  let allItems = [];
  let nextToken = null;
  
  // Paginated fetch to handle large datasets
  do {
    const chartDataResult = await API.graphql({
      query: queries.listChartData,
      variables: {
        filter: { reportID: { eq: reportId } },
        limit: 100,
        nextToken: nextToken
      }
    });
    
    const items = chartDataResult.data.listChartData.items.filter(item => !item._deleted);
    allItems = [...allItems, ...items];
    nextToken = chartDataResult.data.listChartData.nextToken;
  } while (nextToken);
  
  setDraggables(allItems);
}, [reportId]);
```

### 3. Positioning and Movement

**Draggable Component Setup:**
```javascript
const DraggableItem = ({ item }) => {
  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ 
        x: parseFloat(item.posX),  // Convert string back to number
        y: parseFloat(item.posY) 
      }}
      onStop={(e, data) => {
        handleDrag(e, data, item.id);  // Save position on drag end
      }}
    >
      <div style={{
        position: 'absolute',
        cursor: 'move',
        padding: '16px',
        color: item.textColor,
        maxWidth: '350px'
      }}>
        {item.text}
      </div>
    </Draggable>
  );
};
```

**Position Update Process:**
```javascript
const handleDrag = async (_, data, id) => {
  // 1. Fetch latest version for optimistic concurrency
  const getChartDataResult = await API.graphql({
    query: queries.getChartData,
    variables: { id }
  });
  
  const original = getChartDataResult.data.getChartData;
  
  // 2. Update with new position
  const updateResult = await API.graphql({
    query: mutations.updateChartData,
    variables: {
      input: {
        id,
        posX: data.x.toString(),     // Convert coordinates to strings
        posY: data.y.toString(),
        _version: original._version  // Prevent concurrent modifications
      }
    }
  });
  
  // 3. Optimistically update local state
  setDraggables(prevDraggables => 
    prevDraggables.map(item => 
      item.id === id 
        ? { ...item, posX: data.x.toString(), posY: data.y.toString() }
        : item
    )
  );
};
```

## Canvas Structure Types

### 1. Fishbone Diagram Report
- Central spine with arrow pointing right
- Angled "bones" extending from spine
- Categories labeled as "Bones Major Cause Categories"
- Effect section on the right

### 2. Impact Map Report  
- 2x2 quadrant grid
- Quadrants labeled: "Implement Immediately", "Develop Further", "Develop Greater Business Impact", "Watch For Further Development"
- Axes: "Impact of Implementation" (vertical) and "Ease of Implementation" (horizontal)

### 3. Stakeholder Analysis Report
- 2x2 quadrant grid  
- Axes: "Attitude" (vertical, + to -) and "Influence" (horizontal, - to +)
- Political mapping of stakeholders

### 4. Brainstorming (Default)
- Simple 2x2 quadrant grid
- Generic "Problem" and "Problem Solution" labels

## State Management

### Local State (React)
```javascript
const [report, setReport] = useState(null);           // Report metadata
const [draggables, setDraggables] = useState([]);     // Canvas text elements
const [showInputDialog, setShowInputDialog] = useState(false);  // Modal visibility
const [editDialog, setEditDialog] = useState(false);           // Edit modal
const [editingItem, setEditingItem] = useState(null);          // Item being edited
```

### Database State (AWS Amplify/GraphQL)
- **ChartData records**: Persistent storage of all canvas elements
- **Optimistic Concurrency**: Uses `_version` field to prevent conflicts
- **Soft Deletes**: Uses `_deleted` flag instead of hard deletion
- **Multi-tenant**: Filtered by `reportID` for data isolation

## Error Handling and Edge Cases

### 1. Concurrent Modifications
- Uses GraphQL `_version` field for optimistic concurrency control
- Fetches latest version before updates
- Handles version conflicts gracefully

### 2. Network Issues
- Optimistic updates for immediate UI feedback
- Fallback to server refresh on errors
- Error messages with auto-dismissal

### 3. Large Datasets
- Paginated data fetching (100 items per page)
- Efficient state updates using functional setState
- Memory management for draggable components

## Performance Optimizations

### 1. Optimistic Updates
- Local state updated immediately on user actions
- Server synchronization happens in background
- Prevents UI lag during network operations

### 2. Efficient Re-rendering
- Uses `useCallback` for stable function references
- Minimal re-renders through proper dependency arrays
- Individual draggable components manage their own state

### 3. Data Loading Strategy
- Single comprehensive fetch on component mount
- Avoids redundant API calls
- Intelligent error recovery

## Integration Points

### PDF Export
- Board view integrates with PDF generation system
- URL: `/report/Charts/${reportId}` opens PDF version
- Canvas elements positioned identically in PDF output

### Navigation
- Seamless transition between report detail (`/report/bs/`) and board view (`/report/board/`)
- Back button returns to previous view
- State preservation across navigation

## Security Considerations

- Multi-tenant data isolation via `reportID` filtering
- AWS Amplify authentication integration
- Public GraphQL schema with proper authorization rules
- Input sanitization for text content