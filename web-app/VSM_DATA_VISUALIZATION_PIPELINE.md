# VSM Data Visualization Pipeline: GraphQL → PDF

## Overview

This document provides a comprehensive breakdown of how Value Stream Mapping (VSM) data flows from the GraphQL database through data transformation, calculations, image processing, and finally renders in the PDF report. This is the most complex data visualization pipeline in the VibeStack™ Pro application.

---

## 📊 **Data Flow Architecture**

```
GraphQL Database (AWS AppSync)
           ↓
    Data Fetching Layer
           ↓
    JSON Parsing & Validation
           ↓
    Data Transformation Pipeline
           ↓
    Mathematical Calculations Engine
           ↓
    Image Processing & S3 Integration
           ↓
    PDF Layout Engine
           ↓
    Final PDF Visualization
```

---

## 🔍 **Phase 1: GraphQL Data Fetching**

### **Primary Data Query**
**File**: `ReportVsmPdf.js` lines 631-643
```javascript
const vsmData = await API.graphql({
    query: queries.listVsms,
    variables: {
        filter: { 
            reportID: { eq: effectiveReportId },
            _deleted: { ne: true }
        }
    }
});
```

### **Data Sources Retrieved**
1. **Report Entity**: Basic report metadata
2. **Vsm Entity**: Complex VSM-specific data with JSON fields
3. **ActionItems**: Related action items for the report
4. **Organization**: Multi-tenant context and member data

### **Raw Data Structure Retrieved**
```javascript
vsmItem = {
    id: "vsm_id",
    reportID: "report_id", 
    process: '[]',              // JSON String - Array of ProcessCards
    inventory: '[]',            // JSON String - Array of InventoryCards  
    demandData: '{}',          // JSON String - Demand calculations
    summaryData: '{}',         // JSON String - Summary metrics
    informationFlow: '',       // String - Information flow description
    kaizenProject: '',         // String - Kaizen project details
    _version: 1,               // Optimistic locking
    _deleted: false,           // Soft delete flag
    createdAt: "2024-01-01",   // Creation timestamp
    updatedAt: "2024-01-01"    // Last update timestamp
}
```

---

## 🔄 **Phase 2: Data Transformation Pipeline**

### **JSON Parsing Process**
**File**: `ReportVsmPdf.js` lines 645-687

```javascript
// 1. Parse Process Cards
const processCards = JSON.parse(vsmItem.process || '[]');

// 2. Parse Inventory Cards  
const inventoryCards = JSON.parse(vsmItem.inventory || '[]');

// 3. Parse Summary Data with Error Handling
if (vsmItem.summaryData) {
    try {
        parsedVsmItem.summaryData = JSON.parse(vsmItem.summaryData);
    } catch (error) {
        console.error("Error parsing summaryData:", error);
        parsedVsmItem.summaryData = {};
    }
}

// 4. Parse Demand Data with Error Handling
if (vsmItem.demandData) {
    try {
        parsedVsmItem.demandData = JSON.parse(vsmItem.demandData);
    } catch (error) {
        console.error("Error parsing demandData:", error);
        parsedVsmItem.demandData = {};
    }
}
```

### **Transformed Data Structures**

#### **ProcessCard Structure** (After Parsing)
```javascript
ProcessCard = {
    processID: "1704067200000_123456",
    Name: "Assembly Process",
    CycleTime: "15",
    CycleTimeUnit: "minutes", 
    CycleEfficiency: "",
    CycleTimeIsSumOfAttributes: true,
    Note: "Critical assembly step requiring precision",
    Images: ["vsm-attachments/process1/image1.jpg"],
    Waste: ["Transportation", "Waiting"],
    Attributes: [
        {
            id: "attr_1",
            name: "Machine Setup", 
            value: "5",
            unit: "minutes",
            status: "Value Added"
        },
        {
            id: "attr_2",
            name: "Part Assembly",
            value: "8", 
            unit: "minutes",
            status: "Value Added"
        },
        {
            id: "attr_3", 
            name: "Quality Check",
            value: "2",
            unit: "minutes", 
            status: "Value Enabled"
        }
    ]
}
```

#### **InventoryCard Structure** (After Parsing)
```javascript
InventoryCard = {
    WaitTimeOrInventory: "30",
    WaitTimeOrInventoryUnit: "minutes",
    waste: ["Inventory", "Overproduction"]
}
```

#### **DemandData Structure** (After Parsing)
```javascript
DemandData = {
    totalDemand: "100",
    timeToProduce: "480", 
    timeToProduceUnit: "minutes",
    taktTime: 4.8  // Calculated: timeToProduce / totalDemand
}
```

#### **SummaryData Structure** (After Parsing)
```javascript
SummaryData = {
    totalLeadTime: { value: "75.00", unit: "minutes" },
    totalCycleTime: { value: "45.00", unit: "minutes" },
    cycleTimePercentage: "60.00",
    totalWaitTimeOrInventory: { value: "30.00", unit: "minutes" },
    waitTimeOrInventoryDelayPercentage: "40.00"
}
```

---

## 🧮 **Phase 3: Mathematical Calculations Engine**

### **Cycle Time Calculation Algorithm**
**File**: `ReportVsmPdf.js` lines 522-546

```javascript
const calculateCycleTime = (card) => {
    if (!card || !card.Attributes) return 0;
    
    if (card.CycleTimeIsSumOfAttributes) {
        // Auto-calculation mode
        const validUnits = ["seconds", "minutes", "hours", "days", "weeks", "months", "years"];
        const validAttributes = card.Attributes.filter(attr => validUnits.includes(attr.unit));

        const totalCycleTime = validAttributes.reduce((acc, attr) => {
            return acc + convertTime(Number(attr.value), attr.unit, card.CycleTimeUnit);
        }, 0);
        
        return Math.round(totalCycleTime * 100) / 100;
    } else {
        // Manual cycle time mode
        return Number(card.CycleTime);
    }
};
```

### **Time Unit Conversion Matrix**
**File**: `ReportVsmPdf.js` lines 476-520

```javascript
// Conversion to Minutes (Base Unit)
const convertToMinutes = (value, unit) => {
    switch (unit) {
        case "seconds": return value / 60;
        case "minutes": return value;
        case "hours": return value * 60;
        case "days": return value * 60 * 24;
        case "weeks": return value * 60 * 24 * 7;
        case "months": return value * 60 * 24 * 30;
        case "years": return value * 60 * 24 * 365;
        default: return value;
    }
};

// Conversion from Minutes to Target Unit
const convertTime = (value, fromUnit, toUnit) => {
    const valueInMinutes = convertToMinutes(value, fromUnit);
    
    switch (toUnit) {
        case "seconds": return valueInMinutes * 60;
        case "minutes": return valueInMinutes;
        case "hours": return valueInMinutes / 60;
        case "days": return valueInMinutes / (60 * 24);
        case "weeks": return valueInMinutes / (60 * 24 * 7);
        case "months": return valueInMinutes / (60 * 24 * 30);
        case "years": return valueInMinutes / (60 * 24 * 365);
        default: return valueInMinutes;
    }
};
```

### **Cycle Efficiency Calculation Algorithm**
**File**: `ReportVsmPdf.js` lines 548-587

```javascript
const calculateCycleEfficiency = (card) => {
    if (!card.Attributes || card.Attributes.length === 0) return 0;

    // Handle edge cases
    const nonValueAddedAttributes = card.Attributes.filter(attr => attr.status === "Non-value Added");
    if (nonValueAddedAttributes.length === card.Attributes.length) return 0;
    if (nonValueAddedAttributes.length === 0) return 100;

    const cycleTimeInMinutes = convertToMinutes(parseFloat(card.CycleTime), card.CycleTimeUnit);
    if (cycleTimeInMinutes === 0) return 0;

    // Calculate Value Added Time
    const sumValueAddedTime = card.Attributes
        .filter(attr => attr.status === "Value Added")
        .reduce((acc, attr) => acc + convertToMinutes(Number(attr.value), attr.unit), 0);

    // Calculate Value Enabled Time  
    const sumValueEnabledTime = card.Attributes
        .filter(attr => attr.status === "Value Enabled")
        .reduce((acc, attr) => acc + convertToMinutes(Number(attr.value), attr.unit), 0);

    // Calculate Non-Value Added Time
    const sumNonValueTime = nonValueAddedAttributes
        .reduce((acc, attr) => acc + convertToMinutes(Number(attr.value), attr.unit), 0);

    // Efficiency Formula: (Value Added + Value Enabled) / Total Time × 100
    const numerator = sumValueAddedTime + sumValueEnabledTime;
    const denominator = numerator + sumNonValueTime;

    if (denominator === 0) return 0;
    const efficiency = (numerator / denominator) * 100;

    return Math.min(100, parseFloat(efficiency.toFixed(2)));
};
```

### **Summary Data Calculation Algorithm**
**File**: `ReportVsmPdf.js` lines 1009-1039

```javascript
const computeSummaryData = () => {
    if (!vsmProcess || !vsmInventory) return null;

    try {
        // Calculate total cycle time across all processes
        const rawCycleTimeValue = computeTotalCycleTime(vsmProcess);
        
        // Calculate total inventory time across all inventory points
        const rawInventoryTimeValue = totalInventoryTime(vsmInventory);
        
        // Lead time = Cycle time + Wait/Inventory time
        const rawLeadTimeValue = rawCycleTimeValue + rawInventoryTimeValue;

        return {
            totalLeadTime: {
                value: convertTime(rawLeadTimeValue, 'minutes', 'minutes').toFixed(2),
                unit: 'minutes'
            },
            totalCycleTime: {
                value: convertTime(rawCycleTimeValue, 'minutes', 'minutes').toFixed(2), 
                unit: 'minutes'
            },
            cycleTimePercentage: rawLeadTimeValue ? (rawCycleTimeValue / rawLeadTimeValue * 100).toFixed(2) : "0.00",
            totalWaitTimeOrInventory: {
                value: convertTime(rawInventoryTimeValue, 'minutes', 'minutes').toFixed(2),
                unit: 'minutes'  
            },
            waitTimeOrInventoryDelayPercentage: rawLeadTimeValue ? (rawInventoryTimeValue / rawLeadTimeValue * 100).toFixed(2) : "0.00"
        };
    } catch (error) {
        console.error('Error computing summary data:', error);
        return null;
    }
};
```

---

## 🖼️ **Phase 4: Image Processing & S3 Integration**

### **Image URL Fetching Process**
**File**: `ReportVsmPdf.js` lines 443-473

```javascript
const fetchSignedUrlsForProcess = async (process) => {
    const signedUrls = [];
    if (process && process.Images) {
        for (let imageName of process.Images) {
            try {  
                let signedUrl;
                
                // Try authenticated access first
                try {
                    signedUrl = await Storage.get(imageName);
                } catch (authError) {
                    // Fallback to direct public S3 URL
                    const cleanKey = imageName.startsWith('public/') ? imageName : `public/${imageName}`;
                    signedUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
                }
                
                // Fetch as blob and create object URL for PDF rendering
                const response = await fetch(signedUrl, { method: 'GET', mode: 'cors' });
                const blob = await response.blob();
                const objectURL = URL.createObjectURL(blob);

                signedUrls.push(objectURL);
            } catch (err) {
                console.error('Error fetching signed URL for image:', imageName, err);
            }
        }
    }
    return signedUrls;
};
```

### **Image Loading State Management**
**File**: `ReportVsmPdf.js` lines 56-71

```javascript
// Track which images have loaded for PDF readiness
const allImagesLoaded = useMemo(() => {
    // Check process images
    const processImagesLoaded = vsmProcess?.every(process => 
        !process.Images?.length || // Skip if no images
        (imageUrlsMap[process.processID] && loadedImages[process.processID])
    ) ?? true;

    // Check action item images  
    const actionItemImagesLoaded = actionItemsData?.every(item =>
        !item.attachments?.length || // Skip if no attachments
        (imageUrlsMap[item.id] && loadedImages[item.id])
    ) ?? true;

    return processImagesLoaded && actionItemImagesLoaded;
}, [vsmProcess, actionItemsData, imageUrlsMap, loadedImages]);

// Image load event handler
const handleImageLoad = (id) => {
    console.log('Image loaded for ID:', id);
    setLoadedImages(prevState => ({
        ...prevState,
        [id]: true
    }));
};
```

### **Image URL Mapping Structure**
```javascript
imageUrlsMap = {
    "process_id_1": [
        "blob:http://localhost:3000/abc123",
        "blob:http://localhost:3000/def456"
    ],
    "process_id_2": [
        "blob:http://localhost:3000/ghi789"
    ],
    "action_item_id_1": [
        "blob:http://localhost:3000/jkl012"
    ]
}
```

---

## 📑 **Phase 5: PDF Layout Engine**

### **Layout Structure Overview**
The PDF is rendered in three main sections:

1. **Portrait Section**: Report header, summary data, demand data, information flow, kaizen projects
2. **Landscape Section**: Visual process flow diagram 
3. **Portrait Section**: Detailed process/inventory cards and action items

### **Report Header Rendering**
**File**: `ReportVsmPdf.js` lines 911-995

```javascript
const renderReportInfoHeader = () => {
    return (
        <div className="portrait">
            <Card style={headerCardStyle}>
                <Card.Body style={reportInfoStyle}>
                    <h5>Report Information</h5>
                    
                    <Row>
                        <Col xs={12} md={6}>
                            {/* Owner Information */}
                            <div>
                                <h6>Owner</h6>
                                <UserAvatar 
                                    email={reportData.ownerEmail}
                                    organizationID={reportData?.organizationID}
                                    size={40}
                                />
                                <span>{reportData.ownerEmail}</span>
                            </div>
                            
                            {/* Assigned Members */}
                            {assignedMembers.length > 0 && (
                                <div>
                                    <h6>Assigned Members ({assignedMembers.length})</h6>
                                    {assignedMembers.map((userSub) => (
                                        <UserAvatar 
                                            userSub={userSub}
                                            organizationID={reportData?.organizationID}
                                            size={36}
                                        />
                                    ))}
                                </div>
                            )}
                        </Col>
                        
                        <Col xs={12} md={6}>
                            {/* Project Details */}
                            {projectDetails && (
                                <div>
                                    <h6>Project</h6>
                                    <div>Name: {projectDetails.name}</div>
                                    <div>Status: {projectDetails.status}</div>
                                </div>
                            )}
                            
                            {/* Report Details */}
                            <div>
                                <h6>Report Details</h6>
                                <div>Type: {reportData?.type}</div>
                                <div>Created: {new Date(reportData.createdAt).toLocaleDateString()}</div>
                                <div>Status: {reportData?.completed ? 'Completed' : 'In Progress'}</div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
    );
};
```

### **Summary Data Card Rendering**
**File**: `ReportVsmPdf.js` lines 1100-1158

```javascript
{/* Summary Data Card */}
{vsmData && (
    <Card style={cardStyle} className="capture-card">
        <div className="card-header" style={cardHeaderStyle}>
            SUMMARY DATA
        </div>
        <div className="card-body" style={cardBodyStyle}>
            <div className="alert alert-info mb-4">
                Please note that when converting time to seconds or minutes, we round to the nearest whole number to keep the display simple. 
                This rounding can cause slight discrepancies in the total values.
            </div>

            {(() => {
                const summaryData = computeSummaryData();
                if (!summaryData) return null;

                return (
                    <>
                        <div className="mb-3">
                            <span>Total Lead Time:</span>
                            <span>{summaryData.totalLeadTime.value} {summaryData.totalLeadTime.unit}</span>
                        </div>

                        <div className="mb-3">
                            <span>Total Cycle Time:</span>
                            <span>{summaryData.totalCycleTime.value} {summaryData.totalCycleTime.unit}</span>
                        </div>

                        <div className="mb-3">
                            <span>Cycle Time Percentage:</span>
                            <span>{summaryData.cycleTimePercentage}%</span>
                        </div>

                        <div className="mb-3">
                            <span>Total Wait Time or Inventory:</span>
                            <span>{summaryData.totalWaitTimeOrInventory.value} {summaryData.totalWaitTimeOrInventory.unit}</span>
                        </div>

                        <div className="mb-3">
                            <span>Wait Time or Inventory Delay Percentage:</span>
                            <span>{summaryData.waitTimeOrInventoryDelayPercentage}%</span>
                        </div>
                    </>
                );
            })()}
        </div>
    </Card>
)}
```

### **Visual Process Flow Diagram** (Landscape Section)
**File**: `ReportVsmPdf.js` lines 720-886

The most complex rendering logic creates the visual process flow:

```javascript
const renderInventoryCards = (startIndex) => {
    const endIndex = stacked ? vsmInventory.length : startIndex + MAX_ITEMS_PER_CARD;
    
    return (
        <Card style={{ ...cardStyle, display: 'flex', flexDirection: 'row' }}>
            {vsmInventory.slice(startIndex, endIndex).map((inventory, index) => {
                const actualIndex = startIndex + index;
                const relatedProcess = vsmProcess ? vsmProcess[actualIndex] : null;

                return (
                    <React.Fragment key={actualIndex}>
                        {/* Inventory Triangle */}
                        <div style={{ width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ border: '1px solid #e0e0e0', borderRadius: 5 }}>
                                <div className="card-header">
                                    <img src={triangleImage} alt="Triangle" style={{ width: '50px', height: '50px' }} />
                                </div>
                                <div className="card-body">
                                    <div>{inventory.WaitTimeOrInventory || 0} {inventory.WaitTimeOrInventoryUnit}</div>
                                    <div>Wait Time or Inventory</div>
                                    {inventory.waste && inventory.waste.length > 0 && (
                                        <div>
                                            <div>Waste:</div>
                                            <div>{inventory.waste.join(', ')}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Timeline representation */}
                            <div style={{ marginTop: 'auto', marginBottom: 30 }}>
                                <div style={{ 
                                    width: '100%', 
                                    borderBottom: '1px solid #000',
                                    textAlign: 'center'
                                }}>
                                    <p>{inventory.WaitTimeOrInventory || 0} {inventory.WaitTimeOrInventoryUnit}</p>
                                    <p style={{ color: 'red' }}>wait time or inventory</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Related Process Card */}
                        {relatedProcess && (
                            <div style={{ width: '220px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ border: '1px solid #e0e0e0' }}>
                                    <div style={{ backgroundColor: '#00897b', color: '#FFFFFF' }}>
                                        {`Process ${++processCount}`}
                                    </div>
                                    <div style={{ minHeight: '400px' }}>
                                        <ul>
                                            <li>Name: {relatedProcess.Name}</li>
                                            <li>Cycle Time: {calculateCycleTime(relatedProcess)} {relatedProcess.CycleTimeUnit}</li>
                                            <li>Cycle Efficiency: {calculateCycleEfficiency(relatedProcess)}%</li>
                                            <li>Is Sum of Attributes? {relatedProcess.CycleTimeIsSumOfAttributes ? "Yes" : "No"}</li>
                                            <li>Notes: {truncateNote(relatedProcess.Note)}</li>
                                        </ul>
                                        
                                        {/* Attributes Preview (first 2) */}
                                        <div>Attributes:</div>
                                        {relatedProcess.Attributes && (
                                            <ul>
                                                {relatedProcess.Attributes.slice(0, 2).map((attr) => (
                                                    <li key={attr.id}>
                                                        <div>{attr.name.length > 25 ? `${attr.name.substring(0, 25)}...` : attr.name}</div>
                                                        <div style={{
                                                            backgroundColor: getColorForStatus(attr.status),
                                                            color: 'white',
                                                            borderRadius: '5px',
                                                            padding: '2px 5px',
                                                            display: 'inline-block',
                                                            fontSize: '0.6rem'
                                                        }}>
                                                            {attr.status}
                                                        </div>
                                                        <div>{attr.value} {attr.unit}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* First Process Image */}
                                        {relatedProcess.Images && relatedProcess.Images.length > 0 && imageUrlsMap[relatedProcess.processID] && (
                                            <div>
                                                <div>Images:</div>
                                                <img 
                                                    src={imageUrlsMap[relatedProcess.processID][0]} 
                                                    alt="Process Image" 
                                                    style={{ width: '100%', height: '200px', objectFit: 'contain' }} 
                                                    onLoad={() => handleImageLoad(relatedProcess.processID)}
                                                />
                                            </div>
                                        )}
                                        <div>For Full Attributes, images, wastes and notes see below.</div>
                                    </div>
                                </div>

                                {/* Timeline representation */}
                                <div style={{ marginTop: 'auto', marginBottom: 25 }}>
                                    <div style={{ 
                                        width: '220px',
                                        borderLeft: '1px solid #000',
                                        borderRight: '1px solid #000', 
                                        borderTop: '1px solid #000'
                                    }}>
                                        <p style={{ textAlign: 'center', color: 'green' }}>Cycle Time</p>
                                        <p style={{ textAlign: 'center' }}>
                                            {calculateCycleTime(relatedProcess)} {relatedProcess.CycleTimeUnit}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </Card>
    );
};
```

### **Detailed Process Cards** (Portrait Section)
**File**: `ReportVsmPdf.js` lines 1226-1402

```javascript
{/* Detailed Process and Inventory Cards */}
<div className="portrait">
    <div className="inventory-section">
        {(vsmInventory || []).map((inventory, index) => {
            const process = vsmProcess ? vsmProcess[index] : null;

            return (
                <React.Fragment key={index}>
                    {/* Inventory Details */}
                    <Card style={cardStyle}>
                        <Card.Header style={cardHeaderStyle}>
                            {`Inventory ${index + 1}`}
                        </Card.Header>
                        <Card.Body>
                            <div>
                                <strong>Wait Time Or Inventory:</strong> {inventory.WaitTimeOrInventory} {inventory.WaitTimeOrInventoryUnit}
                            </div>
                            {inventory.waste && inventory.waste.length > 0 && (
                                <>
                                    <div style={{ fontWeight: 'bold' }}>Waste:</div>
                                    <div>{inventory.waste.join(', ')}</div>
                                </>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Process Details */}
                    {process && (
                        <Card style={cardStyle}>
                            <Card.Header style={cardHeaderStyle}>
                                {process.Name}
                            </Card.Header>
                            <Card.Body>
                                {/* Attributes Table */}
                                <div style={{ fontWeight: 'bold' }}>Attributes:</div>
                                <Table bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Status</th>
                                            <th>Value</th>
                                            <th>Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!process.Attributes || process.Attributes.length === 0) ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center' }}>No Data available</td>
                                            </tr>
                                        ) : (
                                            <>
                                                {process.Attributes.map((attr) => (
                                                    <tr key={attr.id}>
                                                        <td style={{ 
                                                            wordBreak: 'break-word',
                                                            maxWidth: '150px' 
                                                        }}>
                                                            {attr.name}
                                                        </td>
                                                        <td style={{
                                                            backgroundColor: getColorForStatus(attr.status),
                                                            color: 'white',
                                                            textAlign: 'center'
                                                        }}>
                                                            {attr.status}
                                                        </td>
                                                        <td>{attr.value}</td>
                                                        <td>{attr.unit}</td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td colSpan="4">
                                                        Total cycle time for this process: 
                                                        <b>{process.Attributes.reduce((total, attr) => total + Number(attr.value), 0)}</b>
                                                    </td>
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </Table>
                                
                                {/* Waste Information */}
                                {process.Waste && process.Waste.length > 0 && (
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>Waste:</div>
                                        <div>{process.Waste.join(', ')}</div>
                                    </div>
                                )}

                                {/* Process Notes */}
                                {process.Note && process.Note.length > 0 && (
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>Note:</div>
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{process.Note}</div>
                                    </div>
                                )}

                                {/* All Process Images */}
                                {process.Images && process.Images.length > 0 && imageUrlsMap[process.processID] && (
                                    <div style={{ marginTop: 10 }}>
                                        <div style={{ fontWeight: 'bold' }}>Images:</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {imageUrlsMap[process.processID].map((url, imgIndex) => (
                                                <img 
                                                    key={imgIndex}
                                                    src={url}
                                                    alt={`Process Image ${imgIndex}`} 
                                                    style={{ width: '150px', height: '150px' }} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    )}
                </React.Fragment>
            );
        })}
    </div>
</div>
```

### **Action Items Rendering**
**File**: `ReportVsmPdf.js` lines 1403-1457

```javascript
{/* Action Items Section */}
{reportData && actionItemsData && actionItemsData.length > 0 && (
    <div className="capture-card">
        <Card style={cardStyle}>
            <Card.Header style={cardHeaderStyle}>
                <h2>Action Items / Notes: {actionItemsData.length}</h2>
            </Card.Header>
        </Card>
        {actionItemsData.map((item) => (
            <Card key={item.id} style={cardStyle}>
                <Card.Header style={cardHeaderStyle}>
                    {item.title}
                </Card.Header>
                <Card.Body style={cardBodyStyle}>
                    <p>Status: {statusText[item.status]}</p>
                    {item.duedate && <p>Due Date: {new Date(item.duedate).toLocaleDateString()}</p>}
                    <p>Description: {item.description}</p>
                    
                    {/* Assignees with avatars */}
                    {item.assignees && item.assignees.length > 0 && (
                        <div>
                            <p>Assignee(s):</p>
                            {item.assignees.map((userSub) => (
                                <div key={userSub} style={{ display: 'flex', alignItems: 'center' }}>
                                    <UserAvatar 
                                        userSub={userSub}
                                        organizationID={reportData?.organizationID}
                                        size={24}
                                    />
                                    <span>{emailMap.get(userSub) || '(Email not available)'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Action item attachments */}
                    {item.attachments && item.attachments.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap" }}>
                            {imageUrlsMap[item.id]?.map((url, imgIndex) => (
                                <img
                                    key={imgIndex}
                                    src={url}
                                    alt={`Attachment ${imgIndex + 1}`}
                                    style={{ width: "200px", height: "200px", objectFit: "cover" }}
                                    onLoad={() => handleImageLoad(item.id)}
                                />
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>
        ))}
    </div>
)}
```

---

## 📤 **Phase 6: PDF Generation Process**

### **PDF Generation Trigger**
**File**: `ReportVsmPdf.js` lines 397-428

```javascript
const generateCombinedPDF = async () => {
    // Wait for all images to load
    if (!allImagesLoaded) {
        console.warn('Not all images are loaded yet');
        return;
    }

    setIsGeneratingPDF(true);

    try {
        // Get current page URL for PDF generation
        const currentUrl = window.location.href;
        
        console.log('VSM PDF generation payload:', {
            url: currentUrl,
            allImagesLoaded,
            vsmProcess: !!vsmProcess,
            vsmInventory: !!vsmInventory,
            imageUrlsMap: Object.keys(imageUrlsMap)
        });
        
        // Call external PDF generation API
        await generatePdfViaApi(currentUrl);
        
        console.log('PDF generation initiated successfully');
    } catch (error) {
        console.error('Error generating PDF:', error);
        setError(error.message || 'Failed to generate PDF');
    } finally {
        setIsGeneratingPDF(false);
    }
};
```

### **PDF Generation States**

1. **Loading State**: Shows spinner while fetching data
2. **Image Loading State**: Waits for all images to load completely  
3. **Generation State**: Shows "Generating PDF..." message
4. **Ready State**: Enables PDF generation button

### **PDF Export Button Logic**
```javascript
<Button 
    onClick={() => generateCombinedPDF()}
    disabled={isGeneratingPDF || !allImagesLoaded}
>
    {isGeneratingPDF ? 'Generating PDF...' : 
     !allImagesLoaded ? 'Loading images...' : 
     'Export Report as PDF'}
</Button>
```

---

## 🎯 **Critical Performance Considerations**

### **Image Loading Optimization**
1. **Blob URL Creation**: Converts S3 images to blob URLs for PDF compatibility
2. **Load State Tracking**: Prevents PDF generation until all images are loaded
3. **Memory Management**: Properly cleans up blob URLs to prevent memory leaks

### **Calculation Performance**
1. **Memoization**: Uses `useMemo` for expensive calculations
2. **Lazy Loading**: Only calculates summary data when needed
3. **Error Handling**: Graceful fallbacks for malformed data

### **Data Loading Strategy**
1. **Parallel Fetching**: Fetches reports, VSM data, and action items simultaneously
2. **Progressive Loading**: Shows partial content as data becomes available
3. **Retry Logic**: Handles temporary API failures with retry mechanism

---

## 🔄 **Real-Time Data Synchronization**

### **GraphQL Subscriptions**
**File**: `ReportVsmPdf.js` lines 319-354

```javascript
// Action Items Subscriptions
const subscription = API.graphql(graphqlOperation(onCreateActionItems)).subscribe({
    next: ({ value }) => {
        if (value.data.onCreateActionItems.reportID === effectiveReportId) {
            fetchActionItemsByReportId();
        }
    }
});

const updateSubscription = API.graphql(graphqlOperation(onUpdateActionItems)).subscribe({
    next: ({ value }) => {
        if (value.data.onUpdateActionItems.reportID === effectiveReportId) {
            fetchActionItemsByReportId();
        }
    }
});

const deleteSubscription = API.graphql(graphqlOperation(onDeleteActionItems)).subscribe({
    next: ({ value }) => {
        if (value.data.onDeleteActionItems.reportID === effectiveReportId) {
            fetchActionItemsByReportId();
        }
    }
});
```

---

## 🚨 **Error Handling & Edge Cases**

### **Data Validation**
1. **JSON Parsing**: Try-catch blocks for malformed JSON
2. **Null Checks**: Graceful handling of missing data
3. **Type Validation**: Ensures data types match expected format

### **Image Error Handling**
1. **S3 Access Fallback**: Falls back to public URLs if authentication fails
2. **Missing Image Handling**: Skips broken images gracefully
3. **Loading Timeout**: Prevents infinite loading states

### **Calculation Error Handling**
1. **Division by Zero**: Prevents mathematical errors
2. **Invalid Units**: Filters out invalid time units
3. **Missing Attributes**: Returns sensible defaults

---

## 📊 **Data Flow Summary**

```
GraphQL → JSON Parsing → Data Validation → Mathematical Calculations → Image Processing → Layout Rendering → PDF Generation
    ↑            ↑              ↑                    ↑                     ↑               ↑              ↑
Report Data   Process/       Error            Time Unit           S3 URL          React         PDF API
ActionItems   Inventory     Handling         Conversions         Fetching       Components    Generation  
VsmData      DemandData    Validation       Efficiency Calcs     Blob URLs      Rendering     Final PDF
```

This comprehensive pipeline transforms raw GraphQL data into a professional, visual VSM report with sophisticated calculations, real-time data synchronization, and robust error handling throughout the entire process.