import React, { useState, useEffect } from 'react';
import { Card, Button, Dropdown, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faCheck, faInfoCircle, faRotate } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
import * as queries from '../../../graphql/queries';
import * as mutations from '../../../graphql/mutations';

const SummaryDataCard = ({ reportId, convertTime, fetchSignal }) => {
    const [data, setData] = useState({ process: [], inventory: [] });
    const [saveStatus, setSaveStatus] = useState('idle');
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [units, setUnits] = useState({
        lead: 'minutes',
        cycle: 'minutes',
        inventory: 'minutes'
    });
    const [isReloading, setIsReloading] = useState(false);

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

    const computeTotalCycleTime = (process) => {
        return process.reduce((acc, card) => acc + calculateCycleTime(card), 0);
    };

    const totalInventoryTime = (inventories) => {
        return inventories.reduce((acc, inventory) => {
            return acc + convertTime(parseFloat(inventory.WaitTimeOrInventory || 0), inventory.WaitTimeOrInventoryUnit, 'minutes');
        }, 0);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await API.graphql({
                    query: queries.listVsms,
                    variables: {
                        filter: { reportID: { eq: reportId } }
                    }
                });
                
                const existingEntries = result.data.listVsms.items.filter(item => !item._deleted);
                if (existingEntries && existingEntries.length) {
                    const fetchedData = existingEntries[0];
                    // Parse the JSON strings
                    const parsedData = {
                        ...fetchedData,
                        process: JSON.parse(fetchedData.process || '[]'),
                        inventory: JSON.parse(fetchedData.inventory || '[]')
                    };
                    setData(parsedData);
        
                    // Set the units from the fetched data if they exist
                    if (fetchedData.summaryData) {
                        const summaryData = JSON.parse(fetchedData.summaryData);
                        setUnits({
                            lead: summaryData?.totalLeadTime?.unit || 'minutes',
                            cycle: summaryData?.totalCycleTime?.unit || 'minutes',
                            inventory: summaryData?.totalWaitTimeOrInventory?.unit || 'minutes'
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching VSM data:', error);
            }
        };
        fetchData();
    }, [reportId, fetchSignal]);

    const rawCycleTimeValue = computeTotalCycleTime(data.process);
    const rawInventoryTimeValue = totalInventoryTime(data.inventory);
    const rawLeadTimeValue = rawCycleTimeValue + rawInventoryTimeValue;

    const renderUnitDropdown = (type, rawValue) => (
        <Dropdown>
            <Dropdown.Toggle variant="light" id={`dropdown-${type}`}>
                {units[type] === 'seconds' 
                    ? Math.floor(convertTime(rawValue, 'minutes', units[type])) 
                    : convertTime(rawValue, 'minutes', units[type]).toFixed(2)} {units[type]}
            </Dropdown.Toggle>
            <Dropdown.Menu>
                {['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'].map(unit => (
                    <Dropdown.Item 
                        key={unit}
                        onClick={() => setUnits(prev => ({ ...prev, [type]: unit }))}
                        active={units[type] === unit}
                    >
                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );

    const saveSummaryData = async () => {
        setSaveStatus('saving');
        try {
            const existingEntriesResult = await API.graphql({
                query: queries.listVsms,
                variables: {
                    filter: { reportID: { eq: reportId } }
                }
            });
            
            const existingEntries = existingEntriesResult.data.listVsms.items.filter(item => !item._deleted);
            const existingEntry = existingEntries[0];
        
            const summaryData = {
                totalLeadTime: {
                    value: convertTime(rawLeadTimeValue, 'minutes', units.lead).toFixed(2),
                    unit: units.lead
                },
                totalCycleTime: {
                    value: convertTime(rawCycleTimeValue, 'minutes', units.cycle).toFixed(2),
                    unit: units.cycle
                },
                cycleTimePercentage: (rawCycleTimeValue / rawLeadTimeValue * 100).toFixed(2),
                totalWaitTimeOrInventory: {
                    value: convertTime(rawInventoryTimeValue, 'minutes', units.inventory).toFixed(2),
                    unit: units.inventory
                },
                waitTimeOrInventoryDelayPercentage: (rawInventoryTimeValue / rawLeadTimeValue * 100).toFixed(2)
            };
        
            if (existingEntry) {
                await API.graphql({
                    query: mutations.updateVsm,
                    variables: {
                        input: {
                            id: existingEntry.id,
                            summaryData: JSON.stringify(summaryData),
                            _version: existingEntry._version
                        }
                    }
                });
            }
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Error saving summary data:', error);
            setSaveStatus('idle');
        }
    };

    const getModalContent = (type) => {
        switch (type) {
            case 'lead':
                return 'Total Lead Time is calculated by summing up the total cycle time and the total inventory time. It represents the entire time taken for a process to complete, including both active processing and waiting periods.';
            case 'cycle':
                return 'Total Cycle Time is calculated based on attributes. If "Cycle Time Sum Of Attributes" is true, then it is the sum of all valid attributes. If false, it is the direct cycle time value of the attributes.';
            case 'cyclePercentage':
                return 'Cycle Time Percentage represents the portion of the Lead Time that is spent in active processing (as opposed to waiting or in inventory). It is calculated by dividing the total cycle time by the lead time and then multiplied by 100 to get a percentage.';
            case 'inventory':
                return 'Total Wait Time or Inventory is the sum of all inventory wait times.';
            case 'inventoryDelayPercentage':
                return 'Wait Time or Inventory Delay Percentage signifies the portion of the Lead Time that is spent waiting. It is determined by dividing the total wait time or inventory by the lead time and then multiplied by 100 to get a percentage.';
            default:
                return '';
        }
    };

    const showInfo = (type) => {
        setModalContent(getModalContent(type));
        setShowModal(true);
    };

    const handleReload = async () => {
        setIsReloading(true);
        try {
            const result = await API.graphql({
                query: queries.listVsms,
                variables: {
                    filter: { reportID: { eq: reportId } }
                }
            });
            
            const existingEntries = result.data.listVsms.items.filter(item => !item._deleted);
            if (existingEntries && existingEntries.length) {
                const fetchedData = existingEntries[0];
                // Parse the JSON strings
                const parsedData = {
                    ...fetchedData,
                    process: JSON.parse(fetchedData.process || '[]'),
                    inventory: JSON.parse(fetchedData.inventory || '[]')
                };
                setData(parsedData);
    
                // Set the units from the fetched data if they exist
                if (fetchedData.summaryData) {
                    const summaryData = JSON.parse(fetchedData.summaryData);
                    setUnits({
                        lead: summaryData?.totalLeadTime?.unit || 'minutes',
                        cycle: summaryData?.totalCycleTime?.unit || 'minutes',
                        inventory: summaryData?.totalWaitTimeOrInventory?.unit || 'minutes'
                    });
                }
            }
        } catch (error) {
            console.error('Error reloading VSM data:', error);
        } finally {
            setIsReloading(false);
        }
    };

    return (
        <>
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                        <h5 className="mb-0">SUMMARY DATA</h5>
                        <Button
                            variant="link"
                            onClick={handleReload}
                            disabled={isReloading}
                            className="ms-2 p-0"
                            style={{ color: '#6c757d' }}
                        >
                            <FontAwesomeIcon 
                                icon={faRotate} 
                                spin={isReloading}
                            />
                        </Button>
                    </div>
                    <Button
                        variant={saveStatus === 'saved' ? 'success' : 'light'}
                        onClick={saveSummaryData}
                        className="d-flex align-items-center"
                    >
                        <FontAwesomeIcon 
                            icon={saveStatus === 'saved' ? faCheck : faSave} 
                            className="me-2"
                        />
                        {saveStatus === 'saving' ? 'Saving...' : 'Save'}
                    </Button>
                </Card.Header>
                <Card.Body>
                    <div className="alert alert-info mb-4">
                        Please note that when converting time to seconds or minutes, we round to the nearest whole number to keep the display simple. 
                        This rounding can cause slight discrepancies in the total values. If you need more precise values, please consider using a unit 
                        of time that does not require rounding.
                    </div>

                    <div className="mb-3 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <span className="me-3">Total Lead Time:</span>
                            {renderUnitDropdown('lead', rawLeadTimeValue)}
                        </div>
                        <Button variant="link" onClick={() => showInfo('lead')}>
                            <FontAwesomeIcon icon={faInfoCircle} />
                        </Button>
                    </div>

                    <div className="mb-3 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <span className="me-3">Total Cycle Time:</span>
                            {renderUnitDropdown('cycle', rawCycleTimeValue)}
                        </div>
                        <Button variant="link" onClick={() => showInfo('cycle')}>
                            <FontAwesomeIcon icon={faInfoCircle} />
                        </Button>
                    </div>

                    <div className="mb-3 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <span className="me-3">Cycle Time Percentage:</span>
                            <span>{isNaN(rawCycleTimeValue / rawLeadTimeValue) ? '0' : (rawCycleTimeValue / rawLeadTimeValue * 100).toFixed(2)}%</span>
                        </div>
                        <Button variant="link" onClick={() => showInfo('cyclePercentage')}>
                            <FontAwesomeIcon icon={faInfoCircle} />
                        </Button>
                    </div>

                    <div className="mb-3 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <span className="me-3">Total Wait Time or Inventory:</span>
                            {renderUnitDropdown('inventory', rawInventoryTimeValue)}
                        </div>
                        <Button variant="link" onClick={() => showInfo('inventory')}>
                            <FontAwesomeIcon icon={faInfoCircle} />
                        </Button>
                    </div>

                    <div className="mb-3 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <span className="me-3">Wait Time or Inventory Delay Percentage:</span>
                            <span>{isNaN(rawInventoryTimeValue / rawLeadTimeValue) ? '0' : (rawInventoryTimeValue / rawLeadTimeValue * 100).toFixed(2)}%</span>
                        </div>
                        <Button variant="link" onClick={() => showInfo('inventoryDelayPercentage')}>
                            <FontAwesomeIcon icon={faInfoCircle} />
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Information</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalContent}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default SummaryDataCard;

