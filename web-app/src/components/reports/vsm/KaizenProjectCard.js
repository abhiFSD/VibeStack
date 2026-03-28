import React, { useState, useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faCheck } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
import * as queries from '../../../graphql/queries';
import * as mutations from '../../../graphql/mutations';

const KaizenProjectCard = ({ reportId }) => {
    const [kaizenProjectText, setKaizenProjectText] = useState('');
    const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
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
                    setKaizenProjectText(existingEntry.kaizenProject || '');
                    setVsmVersion(existingEntry._version);
                }
            } catch (error) {
                console.error('Error fetching VSM data:', error);
            }
        };
        
        fetchData();
    }, [reportId]);

    const saveKaizenProject = async () => {
        setSaveStatus('saving');

        try {
            const vsmResult = await API.graphql({
                query: queries.listVsms,
                variables: {
                    filter: { reportID: { eq: reportId } }
                }
            });
            
            const existingEntry = vsmResult.data.listVsms.items[0];
            
            if (existingEntry) {
                await API.graphql({
                    query: mutations.updateVsm,
                    variables: {
                        input: {
                            id: existingEntry.id,
                            kaizenProject: kaizenProjectText,
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
                            kaizenProject: kaizenProjectText,
                            process: '[]',
                            informationFlow: '',
                            demandData: '{}',
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

    return (
        <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">KAIZEN PROJECT</h5>
                <Button
                    variant={saveStatus === 'saved' ? 'success' : 'light'}
                    onClick={saveKaizenProject}
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
                        placeholder="Enter Kaizen Project details"
                        value={kaizenProjectText}
                        onChange={(e) => setKaizenProjectText(e.target.value)}
                    />
                </Form.Group>
            </Card.Body>
        </Card>
    );
};

export default KaizenProjectCard;
