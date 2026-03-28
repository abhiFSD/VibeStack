# Scatter Plot Report Documentation

## Overview
This document provides comprehensive details about the Scatter Plot Report implementation in the VibeStack Pro web application, including data structure, field mappings, display ordering, and synchronization requirements for the mobile app.

## Report Creation

### Required Fields for Creating a Scatter Plot Report

When creating a Scatter Plot Report, the following fields are required:

| Field | Type | Description | Usage |
|-------|------|-------------|-------|
| `name` | String | Report name/title | Displayed as report title |
| `type` | String | Must be "Scatter Plot Report" | Identifies report type |
| `media` | String | X-axis label | Displayed as X-axis label on chart |
| `target` | String | Y-axis label | Displayed as Y-axis label on chart |
| `ownerEmail` | String | Report owner's email | Report ownership |
| `organizationID` | String | Organization identifier | Multi-tenant data segregation |

### Example Report Creation Payload
```javascript
{
  name: "Production vs Quality Analysis",
  type: "Scatter Plot Report",
  media: "Production Rate (units/hour)",    // X-axis label
  target: "Quality Score (%)",              // Y-axis label
  ownerEmail: "user@example.com",
  organizationID: "org-123",
  completed: false
}
```

## Data Structure

### Chart Data Fields

Each data point in a Scatter Plot Report uses the following fields:

| Field | Database Field | Type | Description | Display Location |
|-------|---------------|------|-------------|------------------|
| X Value | `posX` | String | X-axis coordinate value | Horizontal position on chart, first column in table |
| Y Value | `posY` | String | Y-axis coordinate value | Vertical position on chart, second column in table |
| Description | `Description` | String | Optional description | Third column in table |
| Report ID | `reportID` | String | Links data to report | Not displayed |

### Data Entry Fields
When adding/editing data points:
- **X Value Input**: Maps to `posX` field
- **Y Value Input**: Maps to `posY` field
- **Description Input**: Maps to `Description` field

## Axis Mapping

### X-Axis (Horizontal)
- **Label Source**: `report.media` field
- **Data Source**: `item.posX` field (stored as string, converted to float for plotting)
- **Display**: Left to right, lower values on left

### Y-Axis (Vertical)
- **Label Source**: `report.target` field  
- **Data Source**: `item.posY` field (stored as string, converted to float for plotting)
- **Display**: Bottom to top, lower values at bottom

### Visual Representation
```
        Y-Axis (report.target)
        ^
        |
    posY |  • (posX, posY)
        |
        +-----------> X-Axis (report.media)
                posX
```

## Data Ordering

### Table Display Order
The table displays data points in the **order they were created** (by `createdAt` timestamp, oldest first):

```javascript
// Normal View (ReportHg.js)
data.sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date))

// PDF View (ReportDataChartPdf.js) - Same ordering
chart.sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date))
```

### Chart Display Order
- Data points are plotted based on their X,Y coordinates
- No sorting is applied for chart rendering
- Points appear at their actual coordinate positions

## Table Structure

### Column Layout
| Column # | Header | Data Source | Type |
|----------|--------|-------------|------|
| 1 | "X Value" | `item.posX` | String/Number |
| 2 | "Y Value" | `item.posY` | String/Number |
| 3 | "Description" | `item.Description` | String |

### Table HTML Structure
```html
<thead>
  <tr>
    <th>X Value</th>
    <th>Y Value</th>
    <th>Description</th>
  </tr>
</thead>
<tbody>
  <!-- Data rows sorted by createdAt ascending -->
  <tr>
    <td>{item.posX}</td>
    <td>{item.posY}</td>
    <td>{item.Description}</td>
  </tr>
</tbody>
```

## Chart Component Integration

### ScatterChart Component Props
```javascript
<ScatterChart 
  data={chartData}           // Array of data points
  onPointClick={handler}     // Click handler for data points
  xaxis={report.media}       // X-axis label from report
  yaxis={report.target}      // Y-axis label from report
/>
```

### Data Transformation
```javascript
// Data passed to chart component
const chartData = data.map(d => ({
  text: d.text,              // Not used in scatter plot
  value: parseFloat(d.value), // Not used in scatter plot
  id: d.id,                  // For identification
  description: d.Description, // For tooltip/details
  xValue: d.posX,            // X coordinate
  yValue: d.posY,            // Y coordinate
  date: d.date               // Not used in scatter plot
}));
```

## Mobile App Synchronization Requirements

### 1. Report Creation
- Collect `media` field for X-axis label
- Collect `target` field for Y-axis label
- Set `type` to "Scatter Plot Report"

### 2. Data Entry Form
- **X Value Field**: Store in `posX` field
- **Y Value Field**: Store in `posY` field
- **Description Field**: Store in `Description` field

### 3. Data Display
- **Table Order**: Sort by `createdAt` ascending (oldest first)
- **Chart Axes**: 
  - X-axis uses `posX` values with `media` as label
  - Y-axis uses `posY` values with `target` as label

### 4. Field Validation
- Both `posX` and `posY` are required (cannot be empty)
- Values should be numeric or convertible to numbers
- Description is optional

### 5. Data Storage
```javascript
// Creating a data point
{
  text: "",                    // Can be empty for scatter plot
  value: "",                   // Can be empty for scatter plot
  Description: userDescription,
  reportID: reportId,
  posX: String(xValue),        // X coordinate as string
  posY: String(yValue),        // Y coordinate as string
  date: new Date().toLocaleDateString()
}
```

## Key Implementation Notes

1. **Field Naming Confusion**: 
   - `media` = X-axis label (not media files)
   - `target` = Y-axis label (not target value)
   - `posX` = X value (position X)
   - `posY` = Y value (position Y)

2. **Data Type Conversion**:
   - Store `posX` and `posY` as strings in database
   - Convert to float/number for chart rendering
   - Use `parseFloat()` for conversion

3. **Sorting Consistency**:
   - Always sort table data by `createdAt` ascending
   - No sorting for chart points (use actual coordinates)

4. **Validation Requirements**:
   - X Value and Y Value cannot be empty
   - Error message: "X Value and Y Value cannot be empty for Scatter Plot Report."

5. **Display Differences from Other Charts**:
   - Table shows "X Value" and "Y Value" headers instead of "Label" and "Value"
   - Chart uses coordinate system instead of bar/line representation
   - No cumulative calculations or trending

## PDF Export Considerations

The PDF view (`/report_Chart/:reportId`) maintains the same:
- Data ordering (by `createdAt` ascending)
- Axis label mapping (`media` for X, `target` for Y)
- Table column structure
- Chart rendering logic

## Testing Checklist for Mobile Implementation

- [ ] Report creation includes `media` and `target` fields
- [ ] Data entry form has X Value and Y Value inputs
- [ ] X Value maps to `posX` field
- [ ] Y Value maps to `posY` field
- [ ] Table displays data sorted by `createdAt` ascending
- [ ] Chart X-axis shows `media` label with `posX` values
- [ ] Chart Y-axis shows `target` label with `posY` values
- [ ] Empty X or Y values show validation error
- [ ] Data points appear at correct coordinates on chart
- [ ] PDF export maintains same ordering and display