import React from 'react';

const calculateCycleTime = (card) => {
    const attributes = card.Attributes;

    if (!card || !attributes) {
        return 0;
    }
    
    if (card.CycleTimeIsSumOfAttributes) {
        const validUnits = ["seconds", "minutes", "hours", "days", "weeks", "months", "years"];
        const validAttributes = attributes.filter(attr => validUnits.includes(attr.unit));
        
        const totalCycleTime = validAttributes.reduce((acc, attr) => {
            const convertedTime = convertTime(Number(attr.value), attr.unit, 'minutes'); // Convert everything to minutes
            return acc + convertedTime;
        }, 0);
        
        return Math.round(totalCycleTime * 100) / 100;
    } else {
        return convertTime(Number(card.CycleTime), card.CycleTimeUnit, 'minutes'); // Convert the direct cycle time value to minutes
    }
};

const computeTotalCycleTime = (processes, convertTime) => {
    if (!Array.isArray(processes)) {
        console.error('processes is not an array:', processes);
        return 0;
    }

    return processes.reduce((total, process) => {
        if (!process.CycleTime || !process.CycleTimeUnit) return total;
        return total + convertTime(parseFloat(process.CycleTime), process.CycleTimeUnit, 'minutes');
    }, 0);
};

const totalInventoryTime = (inventories, convertTime) => {
    if (!Array.isArray(inventories)) {
        console.error('inventories is not an array:', inventories);
        return 0;
    }

    return inventories.reduce((total, inventory) => {
        if (!inventory.WaitTimeOrInventory || !inventory.WaitTimeOrInventoryUnit) return total;
        return total + convertTime(parseFloat(inventory.WaitTimeOrInventory), inventory.WaitTimeOrInventoryUnit, 'minutes');
    }, 0);
};

const convertToMinutes = (value, unit) => {
    switch (unit) {
        case "seconds":
            return value / 60;
        case "minutes":
            return value; // Value is already in minutes
        case "hours":
            return value * 60;
        case "days":
            return value * 60 * 24;
        case "weeks":
            return value * 60 * 24 * 7;
        case "months":
            return value * 60 * 24 * 30; // Assuming an average month has 30 days
        case "years":
            return value * 60 * 24 * 365; // Not accounting for leap years
        default:
            return value;
    }
};  

const convertTime = (value, fromUnit, toUnit) => {
    // First, convert everything to a common unit, let's say minutes
    const valueInMinutes = convertToMinutes(value, fromUnit);
    
    // Then, convert the value in minutes to the desired unit
    switch (toUnit) {
        case "seconds":
            return valueInMinutes * 60;
        case "minutes":
            return valueInMinutes;
        case "hours":
            return valueInMinutes / 60;
        case "days":
            return valueInMinutes / (60 * 24);
        case "weeks":
            return valueInMinutes / (60 * 24 * 7);
        case "months":
            return valueInMinutes / (60 * 24 * 30); // Assuming an average month has 30 days
        case "years":
            return valueInMinutes / (60 * 24 * 365); // Not accounting for leap years
        default:
            return valueInMinutes;
    }
};

const SummaryCard = ({ reportData }) => {
    const computeSummaryData = () => {
        if (!reportData || !reportData.process || !reportData.inventory) {
            console.warn('Invalid reportData:', reportData);
            return null;
        }

        try {
            const processArray = Array.isArray(reportData.process) ? reportData.process : JSON.parse(reportData.process || '[]');
            const inventoryArray = Array.isArray(reportData.inventory) ? reportData.inventory : JSON.parse(reportData.inventory || '[]');

            const rawCycleTimeValue = computeTotalCycleTime(processArray, convertTime);
            const rawInventoryTimeValue = totalInventoryTime(inventoryArray, convertTime);
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

    const summaryData = computeSummaryData();
    
    return summaryData ? (
        <div className="card mb-3" style={{ marginTop: 10, width: '1024px' }}>
            <div className="card-header" style={{ backgroundColor: "#009688", color: 'white' }}>
                Summary Data
            </div>
            <div className="card-body">
                <p>Total Lead Time: {summaryData.totalLeadTime.value} {summaryData.totalLeadTime.unit}</p>
                <p>Total Cycle Time: {summaryData.totalCycleTime.value} {summaryData.totalCycleTime.unit}</p>
                <p>Cycle Time Percentage: {summaryData.cycleTimePercentage} %</p>
                <p>Total Wait Time or Inventory: {summaryData.totalWaitTimeOrInventory.value} {summaryData.totalWaitTimeOrInventory.unit}</p>
                <p>Wait Time or Inventory Delay Percentage: {summaryData.waitTimeOrInventoryDelayPercentage} %</p>
            </div>
        </div>
    ) : null;
};

export default SummaryCard;
