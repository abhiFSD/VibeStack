import React, { useState, useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faCheck } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
import * as queries from '../../../graphql/queries';
import * as mutations from '../../../graphql/mutations';

const InformationFlowCard = ({ reportId }) => {
    const [informationFlowText, setInformationFlowText] = useState('');
    const [saveStatus, setSaveStatus] = useState('idle');
    const [vsmVersion, setVsmVersion] = useState(null);

    useEffect(() => {
        // Fetch data on component mount
        const fetchData = async () => {
            try {
                const vsmResult = await API.graphql({
                    query: queries.listVsms,
                    variables: {
                        filter: { reportID: { eq: reportId } }
                    }
                });
                
                const existingEntry = vsmResult.data.listVsms.items[0];
                if (existingEntry) {
                    setInformationFlowText(existingEntry.informationFlow || '');
                    setVsmVersion(existingEntry._version);
                }
            } catch (error) {
                console.error('Error fetching VSM data:', error);
            }
        };
        
        fetchData();
    }, [reportId]);

    const saveInformationFlow = async () => {
        setSaveStatus('saving');
        try {
            // Find the existing entry with the specified reportId
            const vsmResult = await API.graphql({
                query: queries.listVsms,
                variables: {
                    filter: { reportID: { eq: reportId } }
                }
            });
            
            const existingEntry = vsmResult.data.listVsms.items[0];
    
            if (existingEntry) {
                // Update the existing entry
                await API.graphql({
                    query: mutations.updateVsm,
                    variables: {
                        input: {
                            id: existingEntry.id,
                            informationFlow: informationFlowText,
                            _version: existingEntry._version
                        }
                    }
                });
            } else {
                // Create a new entry if no existing entry was found
                await API.graphql({
                    query: mutations.createVsm,
                    variables: {
                        input: {
                            reportID: reportId,
                            informationFlow: informationFlowText,
                            process: '[]',
                            kaizenProject: '',
                            demandData: '{}',
                            summaryData: '{}',
                            inventory: '[]'
                        }
                    }
                });
            }
    
            console.log('Saved successfully');
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Error saving information flow:', error);
            setSaveStatus('idle');
        }
    };    

    return (
        <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">INFORMATION FLOW</h5>
                <Button
                    variant={saveStatus === 'saved' ? 'success' : 'light'}
                    onClick={saveInformationFlow}
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
                <Form.Group>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Enter Information Flow details"
                        value={informationFlowText}
                        onChange={(e) => setInformationFlowText(e.target.value)}
                    />
                </Form.Group>
            </Card.Body>
        </Card>
    );
};

export default InformationFlowCard;
