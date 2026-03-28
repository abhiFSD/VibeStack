import React, { useState, useContext, useEffect, useRef } from 'react';
import { Container, Row, Col, Modal, Button, Form, Card, Badge, Spinner } from 'react-bootstrap';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { useToolContext } from '../../contexts/ToolContext';
import { Storage } from '@aws-amplify/storage';
import waste from '../../json/StaticWasteData.json';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFileExport, faSave, faCheck, faTrash, faPencil, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { compressImage } from '../../utils/imageUtils';

// Move these images to src/assets and update imports
import triangleImage from '../../assets/triangle.png';
import wasteImage from '../../assets/lean-tools/light/waste_walk.png';
import wasteImageDark from '../../assets/lean-tools/dark/waste_walk.png';

// Import local components
import InformationFlowCard from './vsm/InformationFlowCard';
import KaizenProjectCard from './vsm/KaizenProjectCard';
import SummaryDataCard from './vsm/SummaryDataCard';
import DemandDataCard from './vsm/DemandDataCard';
import ActionItemsCard from '../shared/ActionItemsCard';
import AttachmentsList from '../reports/AttachmentsList';
import { handleFileInputClick } from '../basic/FileUploader';

const generateID = () => {
    return Date.now() + '_' + Math.round(Math.random() * 1000000);
};

const ReportVsm = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const { tools } = useToolContext();
    const [report, setReport] = useState(null);
    const [draggables, setDraggables] = useState([]);
    const [selectedWaste, setSelectedWaste] = useState([]);
    const [selectedProcessWaste, setSelectedProcessWaste] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newCardName, setNewCardName] = useState('');
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currentCard, setCurrentCard] = useState(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(null);
    const [cycleTime, setCycleTime] = useState('');
    const [cycleTimeUnit, setCycleTimeUnit] = useState('seconds');
    const [attributeModalVisible, setAttributeModalVisible] = useState(false);
    const [attributeName, setAttributeName] = useState('');
    const [attributeValue, setAttributeValue] = useState('');
    const [attributeUnit, setAttributeUnit] = useState('seconds');
    const [attributeStatus, setAttributeStatus] = useState('Value Added');
    const [notes, setNotes] = useState('');
    const [isCycleTimeSumOfAttributes, setIsCycleTimeSumOfAttributes] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuVisibleInventoryUnit, setMenuVisibleInventoryUnit] = useState(false);
    const [menuVisibleUnit, setMenuVisibleUnit] = useState(false);
    const [menuVisibleStatus, setMenuVisibleStatus] = useState(false);
    const [attributeEditMode, setAttributeEditMode] = useState(false);
    const [waitTimeOrInventoryUnit, setWaitTimeOrInventoryUnit] = useState('seconds');
    const [editingAttributeId, setEditingAttributeId] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [attachmentURLs, setAttachmentURLs] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [allAttachments, setAllAttachments] = useState({});
    const [allAttachmentURLs, setAllAttachmentURLs] = useState({});
    const [selectedWasteTitles, setSelectedWasteTitles] = useState([]);
    const [selectedProcessWasteTitles, setSelectedProcessWasteTitles] = useState([]);
    const [wasteModalVisible, setWasteModalVisible] = useState(false);
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [selectedWasteInfo, setSelectedWasteInfo] = useState(null);
    const [cycleEfficiencyInfo] = useState({
        title: "Cycle Efficiency",
        definition: "Cycle Efficiency is a lean manufacturing metric that measures the percentage of value-added time versus total cycle time in a process. It helps identify how much of the process time actually adds value to the customer.",
        formula: "Cycle Efficiency (%) = (Value Added Time / Total Cycle Time) × 100",
        interpretation: [
            "< 10%: Very poor - significant improvement needed",
            "10-25%: Poor - many opportunities for improvement",
            "25-50%: Fair - some waste elimination possible",
            "50-75%: Good - relatively efficient process",
            "> 75%: Excellent - highly optimized process"
        ],
        tips: [
            "Focus on reducing non-value-added activities",
            "Eliminate or minimize waiting time between steps",
            "Reduce transportation and movement waste",
            "Streamline inspection and rework processes",
            "Consider parallel processing where possible"
        ],
        examples: [
            "Manufacturing: If a product takes 60 minutes total cycle time but only 15 minutes of actual machining (value-added), the cycle efficiency is 25%",
            "Service: If processing a loan application takes 5 days but only 2 hours of actual work, the cycle efficiency is 5%",
            "Healthcare: If a patient visit takes 2 hours but only 20 minutes with the doctor, the cycle efficiency is 16.7%"
        ]
    });
    const [waitTimeOrInventory, setWaitTimeOrInventory] = useState('0');

    useEffect(() => {
        fetchData();
    }, [reportId]);

    const fetchAttachmentUrls = async (processCards) => {
        const newAllAttachments = {};
        const newAllAttachmentURLs = {};

        for (const process of processCards) {
            // Initialize arrays for each process, even if there are no images
            newAllAttachments[process.processID] = [];
            newAllAttachmentURLs[process.processID] = [];
            
            if (process.Images && process.Images.length > 0) {
                newAllAttachments[process.processID] = process.Images;
                const urls = await Promise.all(
                    process.Images.map(async (key) => {
                        try {
                            return await Storage.get(key, {
                                level: 'public',
                                expires: 60 * 60 * 24
                            });
                        } catch (error) {
                            console.error('Error fetching URL for key:', key, error);
                            return null;
                        }
                    })
                );
                newAllAttachmentURLs[process.processID] = urls.filter(url => url !== null);
            }
        }

        return { newAllAttachments, newAllAttachmentURLs };
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const vsmData = await API.graphql({
                query: queries.listVsms,
                variables: {
                    filter: { 
                        reportID: { eq: reportId },
                        _deleted: { ne: true }
                    }
                }
            });
            
            const existingEntries = vsmData.data.listVsms.items.filter(item => !item._deleted);
            const vsmItem = existingEntries[0];

            if (vsmItem) {
                const processCards = JSON.parse(vsmItem.process || '[]');
                const inventoryCards = JSON.parse(vsmItem.inventory || '[]');
                
                // Transform the data into the required format
                const transformedCards = [];
                for (let i = 0; i < Math.max(processCards.length, inventoryCards.length); i++) {
                    if (i < inventoryCards.length) {
                        transformedCards.push({
                            type: 'inventory',
                            data: inventoryCards[i]
                        });
                    }
                    if (i < processCards.length) {
                        transformedCards.push({
                            type: 'process',
                            data: processCards[i]
                        });
                    }
                }
                
                setCards(transformedCards);

                // Fetch attachment URLs with additional logging
                console.log("Process cards before fetching URLs:", JSON.stringify(processCards));
                
                // Create empty containers for attachments and URLs to ensure consistency
                const newAllAttachments = {};
                const newAllAttachmentURLs = {};
                
                // Initialize containers for all process IDs to ensure consistency
                processCards.forEach(process => {
                    if (process.processID) {
                        newAllAttachments[process.processID] = [];
                        newAllAttachmentURLs[process.processID] = [];
                    }
                });
                
                // Now fetch the actual URLs
                for (const process of processCards) {
                    if (process.processID && process.Images && Array.isArray(process.Images) && process.Images.length > 0) {
                        newAllAttachments[process.processID] = [...process.Images];
                        
                        const urls = await Promise.all(
                            process.Images.map(async (key) => {
                                try {
                                    const url = await Storage.get(key, {
                                        level: 'public',
                                        expires: 60 * 60 * 24
                                    });
                                    return { key, url };
                                } catch (error) {
                                    console.error('Error fetching URL for key:', key, error);
                                    return null;
                                }
                            })
                        );
                        
                        // Filter out nulls and extract just the URLs
                        const validUrls = urls.filter(item => item !== null).map(item => item.url);
                        newAllAttachmentURLs[process.processID] = validUrls;
                        
                        console.log(`Fetched ${validUrls.length} URLs for process ${process.processID}`);
                    }
                }
                
                console.log("All attachments after fetch:", JSON.stringify(newAllAttachments));
                console.log("All attachment URLs after fetch:", Object.keys(newAllAttachmentURLs).map(key => 
                    `${key}: ${newAllAttachmentURLs[key].length} URLs`));

                setAllAttachments(newAllAttachments);
                setAllAttachmentURLs(newAllAttachmentURLs);
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching VSM data:", error);
            setLoading(false);
        }
    };

    const handleWasteTitleToggle = (title) => {
        if (selectedWasteTitles.includes(title)) {
            setSelectedWasteTitles(prevTitles => prevTitles.filter(t => t !== title));
        } else {
            setSelectedWasteTitles(prevTitles => [...prevTitles, title]);
        }
    };

    const handleProcessWasteTitleToggle = (title) => {
        if (selectedProcessWasteTitles.includes(title)) {
            setSelectedProcessWasteTitles(prevTitles => prevTitles.filter(t => t !== title));
        } else {
            setSelectedProcessWasteTitles(prevTitles => [...prevTitles, title]);
        }
    };

    const handleAttributeToggle = (selectedAttribute) => {
        if (selectedAttributes.includes(selectedAttribute)) {
            setSelectedAttributes(selectedAttributes.filter(item => item !== selectedAttribute));
        } else {
            setSelectedAttributes([...selectedAttributes, selectedAttribute]);
        }
    };

    const exportPDF = () => {
        window.open(`/report_vsm/${reportId}`, '_blank');
    };

    const handleWasteAction = (card, index) => {
        setCurrentCard(card);
        setCurrentCardIndex(index);
        setNewCardName(card.data.Name);
        setCycleTime(card.data.CycleTime);
        setCycleTimeUnit(card.data.CycleTimeUnit || 'seconds');
        setIsCycleTimeSumOfAttributes(card.data.CycleTimeIsSumOfAttributes);
        setNotes(card.data.Note);
        setSelectedProcessWasteTitles(card.data.Waste);
        setWasteModalVisible(true);
    };

    const calculateCycleEfficiency = (card) => {
        if (!card.data.Attributes || card.data.Attributes.length === 0) return 0;
    
        // Get the actual total cycle time (either from calculateCycleTime or from CycleTime field)
        const totalCycleTime = calculateCycleTime(card) || parseFloat(card.data.CycleTime) || 0;
        if (totalCycleTime === 0) return 0;
    
        // Calculate total value-added time (Value Added only - the strict definition)
        const sumValueAddedTime = card.data.Attributes
            .filter(attr => attr.status === "Value Added")
            .reduce((acc, attr) => {
                const timeInCycleUnit = convertTime(Number(attr.value), attr.unit, card.data.CycleTimeUnit || 'minutes');
                return acc + timeInCycleUnit;
            }, 0);
    
        // Cycle Efficiency = (Value Added Time / Total Cycle Time) × 100
        const efficiency = (sumValueAddedTime / totalCycleTime) * 100;
        return Math.min(100, Math.max(0, efficiency.toFixed(2)));
    };

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

    const calculateCycleTime = (card) => {
        if (!card || !card.data || !card.data.Attributes) return 0;
        
        if (card.data.CycleTimeIsSumOfAttributes) {
            const validUnits = ["seconds", "minutes", "hours", "days", "weeks", "months", "years"];
            const validAttributes = card.data.Attributes.filter(attr => validUnits.includes(attr.unit));
            
            const totalCycleTime = validAttributes.reduce((acc, attr) => {
                return acc + convertTime(Number(attr.value), attr.unit, card.data.CycleTimeUnit);
            }, 0);
            
            return Math.round(totalCycleTime * 100) / 100;
        } else {
            return Number(card.data.CycleTime);
        }
    };

    const openAttributeModal = (card, index, attributeToEdit) => {
        setCurrentCard(card);
        setCurrentCardIndex(index);
    
        if (attributeToEdit) {
            setAttributeName(attributeToEdit.name);
            setAttributeValue(attributeToEdit.value);
            setAttributeUnit(attributeToEdit.unit);
            setAttributeStatus(attributeToEdit.status);
            setEditingAttributeId(attributeToEdit.id);
            setAttributeEditMode(true);
        } else {
            setAttributeName('');
            setAttributeValue('');
            setAttributeUnit('seconds');
            setAttributeStatus('Value Added');
            setAttributeEditMode(false);
            setEditingAttributeId(null);
        }
    
        setAttributeModalVisible(true);
    };

    const handleAddAttribute = async () => {
        try {
            if (attributeName && attributeValue && attributeUnit && attributeStatus) {
                const newAttribute = {
                    id: attributeEditMode ? editingAttributeId : generateID(),
                    name: attributeName,
                    value: attributeValue,
                    unit: attributeUnit,
                    status: attributeStatus
                };
    
                if (currentCard && currentCard.data) {
                    // No need for deep copy if we update state immutably later
                    // const copiedCurrentCard = JSON.parse(JSON.stringify(currentCard));
    
                    const vsmData = await API.graphql({
                        query: queries.listVsms,
                        variables: {
                            filter: { reportID: { eq: reportId } }
                        }
                    });
    
                    const vsmItem = vsmData.data.listVsms.items[0];
                    if (vsmItem) {
                        // Prepare updated data for the backend mutation
                        const fieldToUpdate = currentCard.type === 'process' ? 'process' : 'inventory';
                        let updatedCardsBackend = JSON.parse(vsmItem[fieldToUpdate] || '[]');
                        
                        let adjustedIndex = currentCardIndex;
                         if (currentCard.type === 'process') {
                            adjustedIndex = Math.floor(currentCardIndex / 2);
                        } else {
                            // Inventory index mapping
                            adjustedIndex = Math.floor(currentCardIndex / 2); // This seems more consistent with process logic
                        }

                        // Create a mutable copy for backend update
                        let cardDataToUpdate = JSON.parse(JSON.stringify(updatedCardsBackend[adjustedIndex]));

                        if (!cardDataToUpdate.Attributes) {
                            cardDataToUpdate.Attributes = [];
                        }

                        if (attributeEditMode) {
                            const attrIndex = cardDataToUpdate.Attributes.findIndex(attr => attr.id === editingAttributeId);
                            if (attrIndex !== -1) {
                                cardDataToUpdate.Attributes[attrIndex] = newAttribute;
                            } else {
                                console.warn("Attribute to edit not found in backend data.");
                                // Potentially add it if not found? Or rely on frontend state? For now, log and proceed.
                                cardDataToUpdate.Attributes.push(newAttribute); // Add if missing, might cause duplicates if logic differs
                            }
                        } else {
                           cardDataToUpdate.Attributes.push(newAttribute);
                        }

                        updatedCardsBackend[adjustedIndex] = cardDataToUpdate;
    
                        await API.graphql({
                            query: mutations.updateVsm,
                            variables: {
                                input: {
                                    id: vsmItem.id,
                                    [fieldToUpdate]: JSON.stringify(updatedCardsBackend),
                                    _version: vsmItem._version // Include version for conflict detection
                                }
                            }
                        });
    
                        console.log("Attribute added/updated successfully!");
                        
                        // Update frontend state immutably
                         setCards(prevCards => {
                             const newCards = [...prevCards];
                             const cardToUpdateFrontend = { ...newCards[currentCardIndex] }; // Shallow copy card
                             cardDataToUpdate = { ...cardToUpdateFrontend.data }; // Shallow copy data
                             
                             if (!cardDataToUpdate.Attributes) {
                                 cardDataToUpdate.Attributes = [];
                             } else {
                                 // Ensure Attributes array is also copied immutably
                                 cardDataToUpdate.Attributes = [...cardDataToUpdate.Attributes];
                             }

                             if (attributeEditMode) {
                                 const attrIndex = cardDataToUpdate.Attributes.findIndex(attr => attr.id === editingAttributeId);
                                 if (attrIndex !== -1) {
                                     cardDataToUpdate.Attributes[attrIndex] = newAttribute;
                                 } else {
                                      console.warn("Attribute to edit not found in frontend state.");
                                      // If not found in frontend state, add it (safer than potentially missing an update)
                                      cardDataToUpdate.Attributes.push(newAttribute);
                                 }
                             } else {
                                 cardDataToUpdate.Attributes.push(newAttribute);
                             }
                             
                             cardToUpdateFrontend.data = cardDataToUpdate;
                             newCards[currentCardIndex] = cardToUpdateFrontend;
                             return newCards;
                         });

                    } else {
                        console.warn("Vsm data not found for update.");
                    }
    
                    setAttributeName('');
                    setAttributeValue('');
                    setAttributeUnit('seconds');
                    setAttributeStatus('Value Added');
                    setAttributeModalVisible(false);
                    setEditingAttributeId(null);
                    setAttributeEditMode(false); // Reset edit mode
                } else {
                    console.warn("Current card or its data is undefined.");
                }
            } else {
                console.warn("Some attribute fields are missing.");
            }
        } catch (error) {
             console.error("Error in handleAddAttribute:", error);
             // Handle potential version conflicts or other errors
             alert(`Error saving attribute: ${error.message || 'Please try again.'}`);
        }
    };

    const handleDeleteAttribute = async (card, attrId) => {
        // Find the index from the current card state
        const cardIndex = cards.findIndex(c => c === card); 
        if (cardIndex === -1) {
             console.error("Card not found in state for attribute deletion.");
             return;
        }

        if (card && card.data && Array.isArray(card.data.Attributes)) {
            // Prepare backend update data first
            const attributesForBackend = card.data.Attributes.filter(attr => attr.id !== attrId);
        
            try {
                const vsmData = await API.graphql({
                    query: queries.listVsms,
                    variables: {
                        filter: { reportID: { eq: reportId } }
                    }
                });
        
                const vsmItem = vsmData.data.listVsms.items[0];
                if (vsmItem) {
                    const fieldToUpdate = card.type === 'process' ? 'process' : 'inventory';
                    let updatedCardsBackend = JSON.parse(vsmItem[fieldToUpdate] || '[]');
        
                    let adjustedIndex = cardIndex;
                     if (card.type === 'process') {
                        adjustedIndex = Math.floor(cardIndex / 2);
                    } else {
                        // Inventory index mapping
                         adjustedIndex = Math.floor(cardIndex / 2);
                    }
        
                    if (updatedCardsBackend[adjustedIndex]) {
                         // Create a mutable copy for backend update
                        let cardDataToUpdate = JSON.parse(JSON.stringify(updatedCardsBackend[adjustedIndex]));
                        cardDataToUpdate.Attributes = attributesForBackend;
                        updatedCardsBackend[adjustedIndex] = cardDataToUpdate;

                         await API.graphql({
                            query: mutations.updateVsm,
                            variables: {
                                input: {
                                    id: vsmItem.id,
                                    [fieldToUpdate]: JSON.stringify(updatedCardsBackend),
                                    _version: vsmItem._version // Add version
                                }
                            }
                        });
        
                        console.log("Attribute deleted successfully!");
                        
                        // Update frontend state immutably
                        setCards(prevCards => {
                            const newCards = [...prevCards];
                            const cardToUpdateFrontend = { ...newCards[cardIndex] }; // Shallow copy card
                            const cardData = { ...cardToUpdateFrontend.data }; // Shallow copy data
                            cardData.Attributes = cardData.Attributes.filter(attr => attr.id !== attrId); // Update attributes immutably
                            cardToUpdateFrontend.data = cardData;
                            newCards[cardIndex] = cardToUpdateFrontend;
                            return newCards;
                        });

                    } else {
                        console.error("Card not found in backend data at adjusted index:", adjustedIndex);
                        // Optionally try to refetch data as fallback
                        // fetchData(); 
                    }
                } else {
                    console.error("Vsm data not found for attribute deletion.");
                }
            } catch (error) {
                console.error("Error deleting attribute:", error);
                 alert(`Error deleting attribute: ${error.message || 'Please try again.'}`);
                 // Optionally refetch data on error
                 // fetchData();
            }
        } else {
            console.error("Card or its attributes data is not defined or not an array.");
        }
    };

    const getDeleteHandlerForProcess = (processID) => {
        return async (indexToRemove) => {
            try {
                // Find the card and attachment to remove
                const cardIndex = cards.findIndex(card => card.type === 'process' && card.data.processID === processID);
                if (cardIndex === -1) {
                    console.error("Cannot find card in state to delete attachment from.");
                    return;
                }
                
                const cardData = cards[cardIndex].data;
                if (!cardData.Images || !Array.isArray(cardData.Images) || indexToRemove >= cardData.Images.length) {
                    console.error("Cannot find image at specified index:", indexToRemove);
                    return;
                }
                
                const keyToRemove = cardData.Images[indexToRemove];
                console.log(`Deleting image at index ${indexToRemove} with key ${keyToRemove}`);
                
                // Delete from S3 first
                await Storage.remove(keyToRemove);
                console.log("Attachment removed from S3");
                
                // Create new array without the deleted item
                const newImages = cardData.Images.filter((_, idx) => idx !== indexToRemove);
                
                // Update backend
                const vsmData = await API.graphql({
                    query: queries.listVsms,
                    variables: { filter: { reportID: { eq: reportId } } }
                });
                
                if (vsmData.data.listVsms.items.length > 0) {
                    const vsmItem = vsmData.data.listVsms.items[0];
                    const processCardsBackend = JSON.parse(vsmItem.process || '[]');
                    const cardBackendIndex = processCardsBackend.findIndex(card => card.processID === processID);
                    
                    if (cardBackendIndex > -1) {
                        // Update the Images array in the backend
                        processCardsBackend[cardBackendIndex].Images = newImages;
                        
                        await API.graphql({
                            query: mutations.updateVsm,
                            variables: {
                                input: {
                                    id: vsmItem.id,
                                    process: JSON.stringify(processCardsBackend),
                                    _version: vsmItem._version
                                }
                            }
                        });
                        console.log("Backend updated successfully");
                        
                        // Reload the page after successful deletion
                        window.location.reload();
                    }
                }
            } catch (error) {
                console.error("Error deleting attachment:", error);
                alert(`Failed to delete attachment: ${error.message || 'Please try again.'}`);
                // Reload the page even on error
                window.location.reload();
            }
        };
    };

    const handleDeleteAllImages = async (processID) => {
        try {
            // Find the card
            const cardIndex = cards.findIndex(card => card.type === 'process' && card.data.processID === processID);
            if (cardIndex === -1) {
                console.error("Cannot find card in state to delete attachments from.");
                return;
            }
            
            const cardData = cards[cardIndex].data;
            if (!cardData.Images || !Array.isArray(cardData.Images) || cardData.Images.length === 0) {
                console.error("No images to delete.");
                return;
            }
            
            // Confirm with user
            if (!window.confirm("Are you sure you want to delete all images? This cannot be undone.")) {
                return;
            }
            
            // Delete all images from S3
            const deletePromises = cardData.Images.map(key => Storage.remove(key));
            await Promise.all(deletePromises);
            console.log("All attachments removed from S3");
            
            // Update backend
            const vsmData = await API.graphql({
                query: queries.listVsms,
                variables: { filter: { reportID: { eq: reportId } } }
            });
            
            if (vsmData.data.listVsms.items.length > 0) {
                const vsmItem = vsmData.data.listVsms.items[0];
                const processCardsBackend = JSON.parse(vsmItem.process || '[]');
                const cardBackendIndex = processCardsBackend.findIndex(card => card.processID === processID);
                
                if (cardBackendIndex > -1) {
                    // Clear the Images array in the backend
                    processCardsBackend[cardBackendIndex].Images = [];
                    
                    await API.graphql({
                        query: mutations.updateVsm,
                        variables: {
                            input: {
                                id: vsmItem.id,
                                process: JSON.stringify(processCardsBackend),
                                _version: vsmItem._version
                            }
                        }
                    });
                    console.log("Backend updated successfully - all images deleted");
                    
                    // Reload the page after successful deletion
                    window.location.reload();
                }
            }
        } catch (error) {
            console.error("Error deleting all attachments:", error);
            alert(`Failed to delete all attachments: ${error.message || 'Please try again.'}`);
            // Reload the page even on error
            window.location.reload();
        }
    };

    const handleDeleteProcess = async (processID) => {
        try {
            const vsmData = await API.graphql({
                query: queries.listVsms,
                variables: {
                    filter: { 
                        reportID: { eq: reportId },
                        _deleted: { ne: true }
                    }
                }
            });
            
            if (vsmData.data.listVsms.items.length === 0) {
                console.error("Vsm data not found.");
                return;
            }
    
            // Parse the process JSON string into an array
            const processArray = JSON.parse(vsmData.data.listVsms.items[0].process || '[]');
            const processIndex = processArray.findIndex(p => p.processID === processID);
    
            if (processIndex === -1) {
                console.error("Process not found.");
                return;
            }
    
            const updatedProcesses = [...processArray];
            updatedProcesses.splice(processIndex, 1);
    
            // Parse the inventory JSON string into an array 
            const inventoryArray = JSON.parse(vsmData.data.listVsms.items[0].inventory || '[]');
            let updatedInventory = [...inventoryArray];
            
            if (updatedProcesses.length === 0) {
                updatedInventory = [];
            } else if (updatedInventory.length > processIndex + 1) {
                updatedInventory.splice(processIndex + 1, 1);
            }
    
            await API.graphql({
                query: mutations.updateVsm,
                variables: {
                    input: {
                        id: vsmData.data.listVsms.items[0].id,
                        process: JSON.stringify(updatedProcesses),
                        inventory: JSON.stringify(updatedInventory),
                        _version: vsmData.data.listVsms.items[0]._version
                    }
                }
            });
    
            fetchData();
        } catch (error) {
            console.error("Error deleting process:", error);
        }
    };

    const addCard = async () => {
        try {
            if (!reportId) {
                console.error("No reportId provided");
                return;
            }

            const vsmData = await API.graphql({
                query: queries.listVsms,
                variables: {
                    filter: { 
                        reportID: { eq: reportId },
                        _deleted: { ne: true }
                    }
                }
            });
            
            const existingEntries = vsmData.data.listVsms.items.filter(item => !item._deleted);
            const vsmItem = existingEntries[0];
            
            const newProcessCard = {
                processID: generateID(),
                Name: newCardName,
                CycleTime: '0',
                CycleTimeUnit: 'minutes',
                CycleEfficiency: '',
                Attributes: [],
                Note: '',
                CycleTimeIsSumOfAttributes: true,
                Images: [],
                Waste: []
            };

            const newInventoryCard = {
                WaitTimeOrInventory: '0',
                WaitTimeOrInventoryUnit: 'minutes',
                waste: []
            };

            let processCards = [];
            let inventoryCards = [];

            if (vsmItem) {
                processCards = JSON.parse(vsmItem.process || '[]');
                inventoryCards = JSON.parse(vsmItem.inventory || '[]');

                if (processCards.length === 0) {
                    inventoryCards = [newInventoryCard, newInventoryCard];
                } else {
                    inventoryCards.push(newInventoryCard);
                }
                processCards.push(newProcessCard);

                await API.graphql({
                    query: mutations.updateVsm,
                    variables: {
                        input: {
                            id: vsmItem.id,
                            process: JSON.stringify(processCards),
                            inventory: JSON.stringify(inventoryCards),
                        }
                    }
                });
            } else {
                await API.graphql({
                    query: mutations.createVsm,
                    variables: {
                        input: {
                            reportID: reportId,
                            process: JSON.stringify([newProcessCard]),
                            inventory: JSON.stringify([newInventoryCard, newInventoryCard]),
                            informationFlow: '',
                            kaizenProject: '',
                            demandData: '{}',
                            summaryData: '{}'
                        }
                    }
                });
            }

            await fetchData();
            setModalVisible(false);
            setNewCardName('');
        } catch (error) {
            console.error("Error adding card:", error);
        }
    };

    const saveCardEdits = async () => {
        try {
            const vsmData = await API.graphql({
                query: queries.listVsms,
                variables: {
                    filter: { reportID: { eq: reportId } }
                }
            });
            
            const vsmItem = vsmData.data.listVsms.items[0];
            if (vsmItem && currentCard) { // Ensure currentCard is available
                const fieldToUpdate = currentCard.type === 'process' ? 'process' : 'inventory';
                let updatedCardsBackend = JSON.parse(vsmItem[fieldToUpdate] || '[]');

                let updatedCardData;
                if (currentCard.type === 'process') {
                    updatedCardData = {
                        ...currentCard.data, // Start with existing data
                        Name: newCardName,
                        CycleTime: cycleTime,
                        CycleTimeUnit: cycleTimeUnit,
                        Note: notes,
                        CycleTimeIsSumOfAttributes: isCycleTimeSumOfAttributes,
                        Waste: selectedProcessWasteTitles // Ensure this is correct state variable
                    };
                } else { // Inventory card
                    updatedCardData = {
                         ...currentCard.data, // Start with existing data
                        WaitTimeOrInventory: waitTimeOrInventory, // Use state variable
                        WaitTimeOrInventoryUnit: waitTimeOrInventoryUnit,
                        waste: selectedWasteTitles // Ensure this is correct state variable
                    };
                }

                let adjustedIndex = currentCardIndex;
                 if (currentCard.type === 'process') {
                    adjustedIndex = Math.floor(currentCardIndex / 2);
                } else {
                    // Inventory index mapping
                     adjustedIndex = Math.floor(currentCardIndex / 2); 
                }
    
                 if (updatedCardsBackend[adjustedIndex]) {
                    updatedCardsBackend[adjustedIndex] = updatedCardData;
                    
                    await API.graphql({
                        query: mutations.updateVsm,
                        variables: {
                            input: {
                                id: vsmItem.id,
                                [fieldToUpdate]: JSON.stringify(updatedCardsBackend),
                                _version: vsmItem._version // Add version
                            }
                        }
                    });

                     // Update frontend state immutably
                    setCards(prevCards => {
                        const newCards = [...prevCards];
                        newCards[currentCardIndex] = {
                            ...newCards[currentCardIndex], // Keep existing type etc.
                            data: updatedCardData // Update data part
                        };
                        return newCards;
                    });

                 } else {
                     console.error("Card not found in backend data at adjusted index:", adjustedIndex);
                     // Optionally trigger refetch
                     // fetchData();
                 }

            } else {
                 console.error("VSM item or current card not found for saving edits.");
                 // Optionally trigger refetch if state seems inconsistent
                 // fetchData();
            }
        } catch (error) {
            console.error("Error updating card:", error);
             alert(`Error saving changes: ${error.message || 'Please try again.'}`);
             // Optionally trigger refetch on error
             // fetchData();
        }
        // Close modals regardless of success/error? Usually yes.
        setEditModalVisible(false);
        setWasteModalVisible(false); 
        // Removed fetchData call
    };

    const openEditModal = (card, index) => {
        setCurrentCard(card);
        setCurrentCardIndex(index);
        
        if (card.type === 'process') {
            setNewCardName(card.data.Name || '');
            setCycleTime(card.data.CycleTime || '0');
            setCycleTimeUnit(card.data.CycleTimeUnit || 'minutes');
            setNotes(card.data.Note || '');
            setIsCycleTimeSumOfAttributes(card.data.CycleTimeIsSumOfAttributes || false);
            setSelectedProcessWasteTitles(card.data.Waste || []);
        } else if (card.type === 'inventory') {
            // Only set the inventory-specific values when it's an inventory card
            setWaitTimeOrInventory(card.data.WaitTimeOrInventory || '0');
            setWaitTimeOrInventoryUnit(card.data.WaitTimeOrInventoryUnit || 'minutes');
            setSelectedWasteTitles(card.data.waste || []);
        }
        
        setEditModalVisible(true);
    };

    const handleOnFileInput = async (processID) => {
        try {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true; // Allow multiple file selection
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);

            const files = await new Promise((resolve) => {
                fileInput.onchange = (e) => {
                    const selectedFiles = Array.from(e.target.files);
                    document.body.removeChild(fileInput);
                    resolve(selectedFiles);
                };
                fileInput.click();
            });

            if (files && files.length > 0) {
                setUploading(true);
                console.log(`Uploading ${files.length} files for process ${processID}`);
                
                // Process all selected files
                const uploadPromises = files.map(async (file) => {
                    try {
                        // Compress each image before uploading
                        const compressedFile = await compressImage(file);
                        
                        const key = `vsm-attachments/${processID}/${Date.now()}_${file.name}`;
                        await Storage.put(key, compressedFile, {
                            contentType: file.type,
                            metadata: {
                                processID: processID
                            }
                        });
                        
                        // Get URL for the uploaded file
                        let newUrl = null;
                        try {
                            newUrl = await Storage.get(key, { level: 'public', expires: 60 * 60 * 24 });
                        } catch (urlError) {
                            console.error("Error getting URL for newly uploaded file:", urlError);
                        }
                        
                        return { key, url: newUrl };
                    } catch (error) {
                        console.error("Error processing file:", file.name, error);
                        return null;
                    }
                });
                
                // Wait for all uploads to complete
                const uploadResults = await Promise.all(uploadPromises);
                const successfulUploads = uploadResults.filter(result => result !== null);
                
                if (successfulUploads.length > 0) {
                    console.log(`Successfully uploaded ${successfulUploads.length} files`);
                    
                    // Extract keys and URLs
                    const newKeys = successfulUploads.map(result => result.key);
                    const newUrls = successfulUploads.map(result => result.url).filter(url => url !== null);
                    
                    // Get current state first
                    const cardIndex = cards.findIndex(card => card.type === 'process' && card.data.processID === processID);
                    if (cardIndex === -1) {
                        console.error("Process card not found in state");
                        return;
                    }
                    
                    const cardData = cards[cardIndex].data;
                    const currentImages = Array.isArray(cardData.Images) ? [...cardData.Images] : [];
                    const currentAttachments = Array.isArray(allAttachments[processID]) ? [...allAttachments[processID]] : [];
                    const currentUrls = Array.isArray(allAttachmentURLs[processID]) ? [...allAttachmentURLs[processID]] : [];
                    
                    // Create new arrays with added items
                    const newImages = [...currentImages, ...newKeys];
                    const newAttachments = [...currentAttachments, ...newKeys];
                    const newUrlsArray = [...currentUrls, ...newUrls];
                    
                    console.log("State after adding images:", {
                        images: newImages.length,
                        attachments: newAttachments.length,
                        urls: newUrlsArray.length
                    });
                    
                    // Update all three states consistently
                    setCards(prevCards => {
                        const newCards = [...prevCards];
                        const cardToUpdate = { ...newCards[cardIndex] };
                        const updatedData = { ...cardToUpdate.data };
                        updatedData.Images = newImages;
                        cardToUpdate.data = updatedData;
                        newCards[cardIndex] = cardToUpdate;
                        return newCards;
                    });
                    
                    setAllAttachments(prev => ({
                        ...prev,
                        [processID]: newAttachments
                    }));
                    
                    setAllAttachmentURLs(prev => ({
                        ...prev,
                        [processID]: newUrlsArray
                    }));
                    
                    // Update backend
                    try {
                        const vsmData = await API.graphql({
                            query: queries.listVsms,
                            variables: { filter: { reportID: { eq: reportId } } }
                        });
                        
                        if (vsmData.data.listVsms.items.length > 0) {
                            const vsmItem = vsmData.data.listVsms.items[0];
                            const processCardsBackend = JSON.parse(vsmItem.process || '[]');
                            const cardBackendIndex = processCardsBackend.findIndex(card => card.processID === processID);
                            
                            if (cardBackendIndex > -1) {
                                // Ensure Images array exists
                                if (!processCardsBackend[cardBackendIndex].Images) {
                                    processCardsBackend[cardBackendIndex].Images = [];
                                }
                                
                                // Update with new keys
                                processCardsBackend[cardBackendIndex].Images = newImages;
                                
                                await API.graphql({
                                    query: mutations.updateVsm,
                                    variables: {
                                        input: {
                                            id: vsmItem.id,
                                            process: JSON.stringify(processCardsBackend),
                                            _version: vsmItem._version
                                        }
                                    }
                                });
                                console.log("Backend updated with new images");
                                
                                // Reload the page after successful upload
                                window.location.reload();
                            } else {
                                console.error("Process card not found in backend data");
                            }
                        }
                    } catch (backendError) {
                        console.error("Error updating backend with new attachments:", backendError);
                        alert(`Failed to save attachments: ${backendError.message || 'Please try again.'}`);
                        // Reload the page on error
                        window.location.reload();
                    }
                }
            }
        } catch (error) {
            console.error("Error handling file input:", error);
            alert(`Error uploading attachments: ${error.message || 'Please try again.'}`);
            // Reload data on error
            fetchData();
        } finally {
            setUploading(false);
        }
    };

    const getAttachmentSetters = (processID) => {
        return {
            setAttachments: (newAttachments) => {
                // Ensure we're always setting an array
                const attachmentsArray = Array.isArray(newAttachments) ? newAttachments : [];
                console.log(`Setting ${attachmentsArray.length} attachments for process ${processID}`);
                setAllAttachments(prev => {
                    const newState = {
                        ...prev,
                        [processID]: attachmentsArray
                    };
                    return newState;
                });
            },
            setAttachmentURLs: (newURLs) => {
                // Ensure we're always setting an array
                const urlsArray = Array.isArray(newURLs) ? newURLs : [];
                console.log(`Setting ${urlsArray.length} URLs for process ${processID}`);
                setAllAttachmentURLs(prev => {
                    const newState = {
                        ...prev,
                        [processID]: urlsArray
                    };
                    return newState;
                });
            }
        };
    };

    const handleInfoClick = (wasteItem, e) => {
        e.preventDefault(); // Prevent checkbox interaction
        setSelectedWasteInfo(wasteItem);
        setInfoModalVisible(true);
    };

    const styles = {
        container: {
            padding: '20px',
            minHeight: '100vh'
        },
        scrollContainer: {
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            padding: '20px 0'
        },
        cardContainer: {
            display: 'inline-block',
            verticalAlign: 'top',
            marginRight: '15px',
            minWidth: '300px'
        },
        processCard: {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '15px',
            width: '380px'
        },
        inventoryCard: {
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '15px',
            padding: '15px'
        },
        fab: {
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#00897b',
            border: 'none',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            zIndex: 1000
        }
    };

    return (
        <Container fluid style={styles.container}>
            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ) : (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>Value Stream Mapping</h2>
                        <div>
                            <Button
                                variant="outline-primary"
                                onClick={exportPDF}
                            >
                                <FontAwesomeIcon icon={faFileExport} className="me-2" />
                                Export PDF
                            </Button>
                        </div>
                    </div>

                    <ActionItemsCard reportId={reportId} />

                    {cards.length === 0 && (
                        <div className="text-center my-4">
                            <p>Awesome! You have successfully generated the VSM report. To add Processes, simply click the "+" button at the bottom of the screen.</p>
                        </div>
                    )}

                    {cards.length > 0 && (
                        <>
                            <SummaryDataCard reportId={reportId} convertTime={convertTime} />
                            <DemandDataCard reportId={reportId} />
                            <InformationFlowCard reportId={reportId} />
                            <KaizenProjectCard reportId={reportId} />
                        </>
                    )}

                    <div style={styles.scrollContainer}>
                        {cards.map((card, index) => (
                            <div key={index} style={styles.cardContainer}>
                                {card.type === 'inventory' ? (
                                    <Card style={styles.inventoryCard}>
                                        <div className="d-flex flex-column align-items-center">
                                            <div 
                                                style={{ 
                                                    width: '150px', 
                                                    height: '155px',
                                                    position: 'relative',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => openEditModal(card, index)}
                                            >
                                                <img 
                                                    src={triangleImage} 
                                                    style={{ width: '100%', height: '100%' }} 
                                                    alt="Triangle" 
                                                />
                                                <div 
                                                    style={{ 
                                                        position: 'absolute', 
                                                        bottom: '10px',
                                                        width: '100%',
                                                        textAlign: 'center',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {card.data.WaitTimeOrInventory || 0} {card.data.WaitTimeOrInventoryUnit}
                                                </div>
                                                <div 
                                                    style={{ 
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <span style={{ color: 'white' }}>
                                                        {(card.data.waste || []).length}
                                                    </span>
                                                    <img 
                                                        src={wasteImage} 
                                                        style={{ width: '40px', height: '40px' }} 
                                                        alt="Waste" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ) : (
                                    <Card style={styles.processCard}>
                                        <Card.Header 
                                            className="d-flex justify-content-between align-items-center"
                                            style={{ backgroundColor: '#00897b', color: 'white' }}
                                        >
                                            <h5 className="mb-0">Process {Math.floor(index/2) + 1}</h5>
                                            <div className="d-flex align-items-center">
                                                <Button
                                                    variant="light"
                                                    size="sm"
                                                    className="me-2"
                                                    style={{ padding: '4px 8px', minWidth: '32px' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleWasteAction(card, index);
                                                    }}
                                                >
                                                    <img 
                                                        src={wasteImageDark} 
                                                        style={{ width: '20px', height: '20px' }} 
                                                        alt="Waste" 
                                                    />
                                                    <span className="ms-1">{(card.data.Waste || []).length}</span>
                                                </Button>
                                                <Button
                                                    variant="light"
                                                    size="sm"
                                                    className="me-2"
                                                    style={{ padding: '4px 8px', minWidth: '32px' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(card, index);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faPencil} />
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    style={{ padding: '4px 8px', minWidth: '32px' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteProcess(card.data.processID);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </Button>
                                            </div>
                                        </Card.Header>
                                        <Card.Body>
                                            <div className="mb-3">
                                                <div className="mb-2">
                                                    <strong>Name: </strong>
                                                    <span>{card.data.Name}</span>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Cycle Time: </strong>
                                                    <span>
                                                        {calculateCycleTime(card) || 0} {card.data.CycleTimeUnit || 'seconds'}
                                                    </span>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Cycle Efficiency: </strong>
                                                    <span>{calculateCycleEfficiency(card)}%</span>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedWasteInfo(cycleEfficiencyInfo);
                                                            setInfoModalVisible(true);
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faInfoCircle} />
                                                    </Button>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Is Cycle Time Sum of Attributes? </strong>
                                                    <span>{card.data.CycleTimeIsSumOfAttributes ? "Yes" : "No"}</span>
                                                </div>
                                                <div className="mb-2">
                                                    <strong>Notes: </strong>
                                                    <span style={{
                                                        wordBreak: 'break-word',
                                                        overflowWrap: 'anywhere',
                                                        whiteSpace: 'normal',
                                                        hyphens: 'auto'
                                                    }}>{card.data.Note}</span>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline-primary" 
                                                className="mb-3"
                                                onClick={() => openAttributeModal(card, index)}
                                            >
                                                Add Attributes
                                            </Button>
                                            {card.data.Attributes && card.data.Attributes.map((attr) => (
                                                <div 
                                                    key={attr.id} 
                                                    className="p-2 mb-2 bg-light rounded"
                                                >
                                                    <div>
                                                        {/* Content area with full width */}
                                                        <div>
                                                            <div style={{ 
                                                                wordBreak: 'break-word',
                                                                overflowWrap: 'anywhere',
                                                                lineHeight: '1.4',
                                                                whiteSpace: 'normal',
                                                                hyphens: 'auto',
                                                                marginBottom: '8px'
                                                            }}>
                                                                <strong style={{ 
                                                                    fontSize: '14px',
                                                                    color: '#333'
                                                                }}>
                                                                    {attr.name}
                                                                </strong>
                                                            </div>
                                                            <div style={{ 
                                                                wordBreak: 'break-word',
                                                                marginBottom: '6px',
                                                                fontSize: '13px',
                                                                color: '#666'
                                                            }}>
                                                                {attr.value} {attr.unit}
                                                            </div>
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <div className="d-flex align-items-center">
                                                                    <div style={{
                                                                        width: '8px',
                                                                        height: '8px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: 
                                                                            attr.status === 'Value Added' ? 'green' :
                                                                            attr.status === 'Value Enabled' ? '#ffc107' :
                                                                            'red',
                                                                        marginRight: '6px'
                                                                    }} />
                                                                    <span style={{ 
                                                                        wordBreak: 'break-word',
                                                                        fontSize: '12px',
                                                                        color: '#666'
                                                                    }}>
                                                                        {attr.status}
                                                                    </span>
                                                                </div>
                                                                
                                                                {/* Action buttons next to status */}
                                                                <div style={{ 
                                                                    display: 'flex', 
                                                                    gap: '4px',
                                                                    marginLeft: '10px'
                                                                }}>
                                                                    <Button
                                                                        variant="outline-primary"
                                                                        size="sm"
                                                                        style={{ 
                                                                            padding: '4px 8px', 
                                                                            fontSize: '11px',
                                                                            lineHeight: 1.2,
                                                                            minWidth: 'auto'
                                                                        }}
                                                                        onClick={() => openAttributeModal(card, index, attr)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faPencil} size="sm" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        style={{ 
                                                                            padding: '4px 8px', 
                                                                            fontSize: '11px',
                                                                            lineHeight: 1.2,
                                                                            minWidth: 'auto'
                                                                        }}
                                                                        onClick={() => handleDeleteAttribute(card, attr.id)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrash} size="sm" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="mt-3">
                                                <div className="d-flex mb-2">
                                                    <Button 
                                                        variant="outline-primary" 
                                                        className="me-2"
                                                        onClick={() => handleOnFileInput(card.data.processID)}
                                                        disabled={uploading}
                                                    >
                                                        {uploading ? 'Uploading...' : 'Add Images'}
                                                        {uploading && (
                                                            <Spinner 
                                                                animation="border" 
                                                                size="sm" 
                                                                className="ms-2"
                                                            />
                                                        )}
                                                    </Button>
                                                    
                                                    {allAttachments[card.data.processID]?.length > 0 && (
                                                        <Button 
                                                            variant="outline-danger" 
                                                            onClick={() => handleDeleteAllImages(card.data.processID)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} className="me-1" />
                                                            Delete All Images
                                                        </Button>
                                                    )}
                                                </div>
                                                
                                                {/* Only render AttachmentsList if we have attachments */}
                                                {allAttachments[card.data.processID]?.length > 0 && 
                                                 allAttachmentURLs[card.data.processID]?.length > 0 && (
                                                    <AttachmentsList 
                                                        attachments={allAttachments[card.data.processID] || []} 
                                                        attachmentURLs={allAttachmentURLs[card.data.processID] || []}
                                                        setAttachments={getAttachmentSetters(card.data.processID).setAttachments}
                                                        setAttachmentURLs={getAttachmentSetters(card.data.processID).setAttachmentURLs}
                                                        onDeleteAttachment={getDeleteHandlerForProcess(card.data.processID)} 
                                                    />
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                )}
                            </div>
                        ))}
                        
                        {/* Add step graph visualization at the bottom */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'flex-end',
                            marginTop: '20px',
                            paddingBottom: '20px',
                            width: 'fit-content'
                        }}>
                            {cards.map((card, index) => (
                                <React.Fragment key={`step-${index}`}>
                                    {card.type === 'inventory' ? (
                                        <div style={{ width: '300px', marginRight: '15px' }}>
                                            <Card 
                                                className="card mb-3" 
                                                style={{ 
                                                    width: '100%', 
                                                    height: '70px', 
                                                    borderRadius: 0, 
                                                    borderBottom: '1px solid #000', 
                                                    borderLeft: 'none', 
                                                    borderRight: 'none', 
                                                    borderTop: 'none' 
                                                }}
                                            >
                                                <div className="card-body" style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    justifyContent: 'center',
                                                    padding: '0 2px'
                                                }}>
                                                    <p style={{ 
                                                        textAlign: 'center', 
                                                        margin: '-15px 0 10px 0',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        fontSize: '0.8rem',
                                                        width: '100%'
                                                    }}>
                                                        {card.data.WaitTimeOrInventory || 0} {card.data.WaitTimeOrInventoryUnit}
                                                    </p>
                                                    <p style={{ 
                                                        textAlign: 'center', 
                                                        margin: '0 0 0 0', 
                                                        color: 'red',
                                                        fontSize: '0.7rem'
                                                    }}>
                                                        wait time or inventory
                                                    </p>
                                                </div>
                                            </Card>
                                        </div>
                                    ) : (
                                        <div style={{ width: '380px', marginRight: '15px' }}>
                                            <Card 
                                                className="card mb-3" 
                                                style={{ 
                                                    paddingTop: '10px',
                                                    width: '100%', 
                                                    height: '70px', 
                                                    borderRadius: 0, 
                                                    borderLeft: '1px solid #000', 
                                                    borderRight: '1px solid #000', 
                                                    borderTop: '1px solid #000', 
                                                    borderBottom: 'none' 
                                                }}
                                            >
                                                <div className="card-body">
                                                    <p style={{ textAlign: 'center', margin: '-40px 0 10px 0', color: 'green' }}>Cycle Time</p>
                                                    <p style={{ textAlign: 'center', margin: '10px 0 0 0' }}>
                                                        {calculateCycleTime(card) || 0} {card.data.CycleTimeUnit || 'seconds'}
                                                    </p>
                                                </div>
                                            </Card>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <Button
                        style={styles.fab}
                        onClick={() => {
                            setNewCardName('');
                            setModalVisible(true);
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </Button>

                    {/* Add Process Modal */}
                    <Modal show={modalVisible} onHide={() => setModalVisible(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Add Process</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group>
                                <Form.Label>Process Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newCardName}
                                    onChange={(e) => setNewCardName(e.target.value)}
                                    placeholder="Enter process name"
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={addCard}>
                                Add Process
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Edit Modal */}
                    <Modal show={editModalVisible} onHide={() => setEditModalVisible(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>
                                {currentCard?.type === 'process' ? 'Edit Process' : 'Edit Inventory'}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {currentCard?.type === 'process' ? (
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Process Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={newCardName}
                                            onChange={(e) => setNewCardName(e.target.value)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Cycle Time</Form.Label>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                type="number"
                                                value={cycleTime}
                                                onChange={(e) => setCycleTime(e.target.value)}
                                                disabled={isCycleTimeSumOfAttributes}
                                            />
                                            <Form.Select
                                                value={cycleTimeUnit}
                                                onChange={(e) => setCycleTimeUnit(e.target.value)}
                                                style={{ width: '150px' }}
                                            >
                                                <option value="seconds">Seconds</option>
                                                <option value="minutes">Minutes</option>
                                                <option value="hours">Hours</option>
                                                <option value="days">Days</option>
                                                <option value="weeks">Weeks</option>
                                                <option value="months">Months</option>
                                                <option value="years">Years</option>
                                            </Form.Select>
                                        </div>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="switch"
                                            id="cycle-time-sum"
                                            label="Cycle time is sum of attributes"
                                            checked={isCycleTimeSumOfAttributes}
                                            onChange={(e) => setIsCycleTimeSumOfAttributes(e.target.checked)}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Notes</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </Form.Group>
                                </Form>
                            ) : (
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Wait Time or Inventory</Form.Label>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                type="number"
                                                value={waitTimeOrInventory}
                                                onChange={(e) => setWaitTimeOrInventory(e.target.value)}
                                            />
                                            <Form.Select
                                                value={waitTimeOrInventoryUnit}
                                                onChange={(e) => setWaitTimeOrInventoryUnit(e.target.value)}
                                                style={{ width: '150px' }}
                                            >
                                                <option value="seconds">Seconds</option>
                                                <option value="minutes">Minutes</option>
                                                <option value="hours">Hours</option>
                                                <option value="days">Days</option>
                                                <option value="weeks">Weeks</option>
                                                <option value="months">Months</option>
                                                <option value="years">Years</option>
                                            </Form.Select>
                                        </div>
                                    </Form.Group>
                                    <div className="mt-4">
                                        <h6>Select Waste Types</h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            {waste.map((item) => (
                                                <div key={item.title} className="d-flex align-items-center">
                                                    <Form.Check
                                                        type="checkbox"
                                                        label={item.title}
                                                        checked={selectedWasteTitles.includes(item.title)}
                                                        onChange={() => handleWasteTitleToggle(item.title)}
                                                        className="me-2"
                                                    />
                                                    <FontAwesomeIcon 
                                                        icon={faInfoCircle} 
                                                        className="ms-1"
                                                        onClick={(e) => handleInfoClick(item, e)}
                                                        style={{ 
                                                            cursor: 'pointer',
                                                            color: '#0d6efd'
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Form>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setEditModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={saveCardEdits}>
                                Save Changes
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Waste Modal */}
                    <Modal show={wasteModalVisible} onHide={() => setWasteModalVisible(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Select Process Waste</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="d-flex flex-wrap gap-2">
                                {waste.map((item) => (
                                    <Form.Check
                                        key={item.title}
                                        type="checkbox"
                                        label={item.title}
                                        checked={selectedProcessWasteTitles.includes(item.title)}
                                        onChange={() => handleProcessWasteTitleToggle(item.title)}
                                        className="me-3"
                                    />
                                ))}
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setWasteModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={saveCardEdits}>
                                Save Changes
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Info Modal */}
                    <Modal 
                        show={infoModalVisible} 
                        onHide={() => setInfoModalVisible(false)}
                        size="lg"
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>{selectedWasteInfo?.title}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {selectedWasteInfo && (
                                <>
                                    <h5>Definition</h5>
                                    <p>{selectedWasteInfo.definition}</p>

                                    {selectedWasteInfo.formula && (
                                        <>
                                            <h5 className="mt-4">Formula</h5>
                                            <p className="bg-light p-3 rounded">
                                                <code>{selectedWasteInfo.formula}</code>
                                            </p>
                                        </>
                                    )}

                                    {selectedWasteInfo.interpretation && (
                                        <>
                                            <h5 className="mt-4">Interpretation</h5>
                                            <ul>
                                                {selectedWasteInfo.interpretation.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}

                                    {selectedWasteInfo.to_detect?.ask && (
                                        <>
                                            <h5 className="mt-4">Questions to Ask</h5>
                                            <ul>
                                                {selectedWasteInfo.to_detect.ask.map((question, index) => (
                                                    <li key={index}>{question}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}

                                    {selectedWasteInfo.tips && (
                                        <>
                                            <h5 className="mt-4">Improvement Tips</h5>
                                            <ul>
                                                {selectedWasteInfo.tips.map((tip, index) => (
                                                    <li key={index}>{tip}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}

                                    {selectedWasteInfo.examples && (
                                        <>
                                            <h5 className="mt-4">Examples</h5>
                                            <ul>
                                                {selectedWasteInfo.examples.map((example, index) => (
                                                    <li key={index}>{example}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}

                                    {selectedWasteInfo.to_eliminate && (
                                        <>
                                            <h5 className="mt-4">How to Eliminate</h5>
                                            <ul>
                                                {selectedWasteInfo.to_eliminate.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setInfoModalVisible(false)}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    {/* Attribute Modal */}
                    <Modal show={attributeModalVisible} onHide={() => setAttributeModalVisible(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>
                                {attributeEditMode ? 'Edit Attribute' : 'Add Attribute'}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Attribute Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={attributeName}
                                        onChange={(e) => setAttributeName(e.target.value)}
                                        placeholder="Enter attribute name"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Value</Form.Label>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="number"
                                            value={attributeValue}
                                            onChange={(e) => setAttributeValue(e.target.value)}
                                            placeholder="Enter value"
                                        />
                                        <Form.Select
                                            value={attributeUnit}
                                            onChange={(e) => setAttributeUnit(e.target.value)}
                                            style={{ width: '150px' }}
                                        >
                                            <option value="seconds">Seconds</option>
                                            <option value="minutes">Minutes</option>
                                            <option value="hours">Hours</option>
                                            <option value="days">Days</option>
                                            <option value="weeks">Weeks</option>
                                            <option value="months">Months</option>
                                            <option value="years">Years</option>
                                        </Form.Select>
                                    </div>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <div className="d-flex gap-3">
                                        {['Value Added', 'Value Enabled', 'Non-value Added'].map((status) => (
                                            <Form.Check
                                                key={status}
                                                type="radio"
                                                id={`status-${status}`}
                                                name="attribute-status"
                                                label={
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            style={{
                                                                width: '12px',
                                                                height: '12px',
                                                                borderRadius: '50%',
                                                                backgroundColor:
                                                                    status === 'Value Added' ? 'green' :
                                                                    status === 'Value Enabled' ? 'yellow' :
                                                                    'red',
                                                                marginRight: '8px'
                                                            }}
                                                        />
                                                        {status}
                                                    </div>
                                                }
                                                checked={attributeStatus === status}
                                                onChange={() => setAttributeStatus(status)}
                                            />
                                        ))}
                                    </div>
                                </Form.Group>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setAttributeModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleAddAttribute}>
                                {attributeEditMode ? 'Update Attribute' : 'Add Attribute'}
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </>
            )}
        </Container>
    );
};

export default ReportVsm;