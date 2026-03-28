import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faCheck } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
import * as queries from '../../../graphql/queries';
import * as mutations from '../../../graphql/mutations';

const DemandDataCard = ({ reportId }) => {
    const [totalDemand, setTotalDemand] = useState('');
    const [timeToProduce, setTimeToProduce] = useState('');
    const [timeToProduceUnit, setTimeToProduceUnit] = useState('minutes');
    const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
    const [vsmVersion, setVsmVersion] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const vsmData = await API.graphql({
                    query: queries.listVsms,
                    variables: {
                        filter: { reportID: { eq: reportId } }
                    }
                });
                
                const existingEntry = vsmData.data.listVsms.items[0];
                if (existingEntry && existingEntry.demandData) {
                    const demandData = JSON.parse(existingEntry.demandData);
                    setTotalDemand(demandData.totalDemand || '');
                    setTimeToProduce(demandData.timeToProduce || '');
                    setTimeToProduceUnit(demandData.timeToProduceUnit || 'minutes');
                    setVsmVersion(existingEntry._version);
                }
            } catch (error) {
                console.error('Error fetching VSM data:', error);
            }
        };

        fetchData();
    }, [reportId]);

    const saveDemandData = async () => {
        setSaveStatus('saving');
        try {
            const vsmData = await API.graphql({
                query: queries.listVsms,
                variables: {
                    filter: { reportID: { eq: reportId } }
                }
            });
            
            const existingEntry = vsmData.data.listVsms.items[0];
            const demandData = {
                totalDemand,
                timeToProduce,
                timeToProduceUnit
            };

            if (existingEntry) {
                await API.graphql({
                    query: mutations.updateVsm,
                    variables: {
                        input: {
                            id: existingEntry.id,
                            demandData: JSON.stringify(demandData),
                            _version: existingEntry._version
                        }
                    }
                });
            } else {
                await API.graphql({
                    query: mutations.createVsm,
                    variables: {
                        input: {
                            reportID: reportId,
                            demandData: JSON.stringify(demandData),
                            process: '[]',
                            informationFlow: '',
                            kaizenProject: '',
                            summaryData: '{}',
                            inventory: '[]'
                        }
                    }
                });
            }

            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);  // Revert to idle state after 2 seconds
        } catch (error) {
            console.error('Error saving VSM data:', error);
            setSaveStatus('idle');
        }
    };

    const taktTime = timeToProduce && totalDemand 
                     ? (parseFloat(timeToProduce) / parseFloat(totalDemand)).toFixed(2) 
                     : '0';

    const timeUnits = ['percentage', 'varies', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'];

    return (
        <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">TOTAL DEMAND/TARGET DATA</h5>
                <Button
                    variant={saveStatus === 'saved' ? 'success' : 'light'}
                    onClick={saveDemandData}
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
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Total Demand/Volume</Form.Label>
                        <Form.Control
                            type="number"
                            value={totalDemand}
                            onChange={(e) => setTotalDemand(e.target.value)}
                            placeholder="Enter total demand"
                        />
                    </Form.Group>

                    <div className="d-flex gap-3 mb-3">
                        <Form.Group className="flex-grow-1">
                            <Form.Label>Time to Produce</Form.Label>
                            <Form.Control
                                type="number"
                                value={timeToProduce}
                                onChange={(e) => setTimeToProduce(e.target.value)}
                                placeholder="Enter time"
                            />
                        </Form.Group>

                        <Form.Group style={{ minWidth: '150px' }}>
                            <Form.Label>Unit</Form.Label>
                            <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                    {timeToProduceUnit.charAt(0).toUpperCase() + timeToProduceUnit.slice(1)}
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    {timeUnits.map(unit => (
                                        <Dropdown.Item 
                                            key={unit} 
                                            onClick={() => setTimeToProduceUnit(unit)}
                                            active={timeToProduceUnit === unit}
                                        >
                                            {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </Form.Group>
                    </div>

                    <div className="mt-3">
                        <strong>Takt Time/Target:</strong> {taktTime} {timeToProduceUnit}
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default DemandDataCard;
