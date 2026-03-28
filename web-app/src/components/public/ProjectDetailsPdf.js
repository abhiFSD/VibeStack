import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Spinner, Button, Alert, Table, Form } from 'react-bootstrap';
import { API, graphqlOperation, Storage } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import { generateBatchPdfViaApi } from '../../utils/apiPdfGenerator';
import UserAvatar from '../shared/UserAvatar';

const ProjectDetailsPdf = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tangibles, setTangibles] = useState([]);
  const [intangibles, setIntangibles] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [attachmentUrls, setAttachmentUrls] = useState({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [reports, setReports] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [collectedUrls, setCollectedUrls] = useState([]);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);
  const [selectedReports, setSelectedReports] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [error, setError] = useState(null);

  // CSS styles for portrait mode content
  const portraitStyles = `
    .portrait {
      page-break-inside: avoid;
      break-inside: avoid;
      display: block;
      width: 100%;
      max-height: 1122px; /* A4 portrait height in pixels (approximate) */
      overflow: hidden;
    }
  `;

  // Group definitions for report types
  const reportGroups = {
    vsm: {
      title: "Value Stream Mapping",
      types: ["Value Stream Mapping Report"],
      canExportPDF: true
    },
    charts: {
      title: "Chart Reports",
      types: ["Fishbone Diagram Report", "Stakeholder Analysis Report", "Impact Map Report", "Brainstorming Report"],
      canExportPDF: true
    },
    chartData: {
      title: "Chart Data Reports",
      types: ["Standard Work Report", "Scatter Plot Report", "Pareto Chart Report", "Histogram Report", "Run Chart Report"],
      canExportPDF: true
    },
    standard: {
      title: "Standard Reports",
      types: ["5S Report", "5 Whys Report", "A3 Project Report", "DMAIC Report", "Gemba Walk Report", 
              "Kaizen Project Report", "Leadership Report", "Lean Assessment Report", "Mistake Proofing Report", 
              "PDCA Report", "Waste Walk Report"],
      canExportPDF: true
    },
    kpi: {
      title: "KPI Reports",
      types: ["KPI"],
      canExportPDF: true
    }
  };

  useEffect(() => {
    fetchProject();
    fetchTangibles();
    fetchIntangibles();
    fetchProjectMembers();
    fetchReports();
    fetchKPIs();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const projectData = await API.graphql(
        graphqlOperation(queries.getProject, { id: projectId })
      );
      setProject(projectData.data.getProject);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTangibles = async () => {
    try {
      const tangiblesData = await API.graphql(
        graphqlOperation(queries.tangiblesByProjectID, {
          projectID: projectId,
          filter: {
            _deleted: { ne: true }
          }
        })
      );
      
      if (tangiblesData?.data?.tangiblesByProjectID?.items) {
        const sortedTangibles = tangiblesData.data.tangiblesByProjectID.items
          .filter(item => !item._deleted)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setTangibles(sortedTangibles);
      }
    } catch (error) {
      console.error('Error fetching tangibles:', error);
    }
  };

  const fetchIntangibles = async () => {
    try {
      const intangiblesData = await API.graphql(
        graphqlOperation(queries.intangiblesByProjectID, {
          projectID: projectId,
          filter: {
            _deleted: { ne: true }
          }
        })
      );
      
      if (intangiblesData?.data?.intangiblesByProjectID?.items) {
        const sortedIntangibles = intangiblesData.data.intangiblesByProjectID.items
          .filter(item => !item._deleted)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setIntangibles(sortedIntangibles);
      }
    } catch (error) {
      console.error('Error fetching intangibles:', error);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const membersData = await API.graphql(
        graphqlOperation(queries.projectMembersByProjectID, {
          projectID: projectId,
          filter: {
            _deleted: { ne: true }
          }
        })
      );
      
      if (membersData?.data?.projectMembersByProjectID?.items) {
        const sortedMembers = membersData.data.projectMembersByProjectID.items
          .filter(item => !item._deleted);
        setProjectMembers(sortedMembers);
      }
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  };

  const fetchSignedUrlForAttachment = async (attachmentData) => {
    try {
      // Handle attachment objects with URL (for sample data)
      if (typeof attachmentData === 'object' && attachmentData.url) {
        if (attachmentData.url.startsWith('http')) {
          console.log('Using direct URL for attachment:', attachmentData.url);
          return attachmentData.url;
        }
      }
      
      // Handle direct HTTP URLs (for sample data)
      const attachmentName = typeof attachmentData === 'string' ? attachmentData : (attachmentData?.name || attachmentData?.key || attachmentData);
      if (typeof attachmentName === 'string' && attachmentName.startsWith('http')) {
        console.log('Direct HTTP URL detected, returning as-is:', attachmentName);
        return attachmentName;
      }
      
      let signedUrl;
      try {
        signedUrl = await Storage.get(attachmentName, {
          level: 'public',
          expires: 60 * 60 * 24,
        });
      } catch (authError) {
        // Fallback to direct public S3 URL
        const cleanKey = attachmentName.startsWith('public/') ? attachmentName : `public/${attachmentName}`;
        signedUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
      }

      // Fetch the signed URL as a blob
      const response = await fetch(signedUrl, { method: 'GET', mode: 'cors' });
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);

      return objectURL;
    } catch (err) {
      console.error('Error fetching signed URL for attachment:', attachmentData, err);
      return null;
    }
  };

  useEffect(() => {
    const fetchAllAttachmentUrls = async () => {
      if (project?.attachments) {
        const urlsMap = {};
        for (const attachment of project.attachments) {
          const url = await fetchSignedUrlForAttachment(attachment);
          if (url) {
            urlsMap[attachment] = url;
          }
        }
        setAttachmentUrls(urlsMap);
      }
    };

    if (project) {
      fetchAllAttachmentUrls();
    }

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(attachmentUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [project]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Match ProjectView.js exactly: Query by projectID only, same as project page
      const reportsData = await API.graphql(
        graphqlOperation(queries.reportsByProjectID, {
          projectID: projectId // Only projectID - same as ProjectView.js
        })
      );

      if (!reportsData?.data?.reportsByProjectID?.items) {
        console.log('No reports data received from API');
        setReports([]);
      } else {
        console.log(`Reports fetched by reportsByProjectID: ${reportsData.data.reportsByProjectID.items.length}`);
        
        // Identical to ProjectView.js: Sort directly without any filtering
        const fetchedReports = sortReports(reportsData.data.reportsByProjectID.items);
        
        console.log(`Reports after sorting: ${fetchedReports.length}`);
        setReports(fetchedReports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Error fetching reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Identical sortReports function as in ProjectView.js
  const sortReports = (reports) => {
    return [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const fetchKPIs = async () => {
    try {
      // Use the exact same query as the project page with filter for non-deleted KPIs
      const kpisData = await API.graphql(
        graphqlOperation(queries.kPISByProjectID, {
          projectID: projectId,
          filter: {
            _deleted: { ne: true }
          }
        })
      );
      
      if (kpisData?.data?.kPISByProjectID?.items) {
        const sortedKpis = kpisData.data.kPISByProjectID.items
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        console.log(`Fetched ${sortedKpis.length} KPIs that are directly linked to project ${projectId}`);
        setKpis(sortedKpis);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };

  // Complete rewrite of collectReportUrls to match ProjectView.js report handling
  const collectReportUrls = () => {
    // Only collect if we have the required data
    if (!project || (!reports.length && !kpis.length)) {
      console.log("No project data or no reports/KPIs to collect URLs for");
      return;
    }
    
    // Create arrays for URL storage
    const urls = [];
    const urlDetails = [];
    const initialSelections = {};
    
    // First, add the project details URL
    const projectDetailsUrl = `${window.location.origin}/project_details/${projectId}`;
    urls.push(projectDetailsUrl);
    urlDetails.push({
      url: projectDetailsUrl,
      type: "Project Details",
      name: project?.name || "Project Overview",
      id: projectId
    });
    initialSelections[projectId] = true; // Project details selected by default
    
    // Add URLs for each report type using the correct URL format for each report type
    
    // Standard reports
    const standardReports = reports.filter(r => 
      reportGroups.standard.types.includes(r.type)
    );
    for (const report of standardReports) {
      const url = `${window.location.origin}/report_pdf/${report.id}`;
      urls.push(url);
      urlDetails.push({
        url,
        type: report.type,
        name: report.name || report.type,
        id: report.id,
        createdAt: report.createdAt
      });
      initialSelections[report.id] = true; // All reports selected by default
    }
    
    // VSM reports
    const vsmReports = reports.filter(r => 
      reportGroups.vsm.types.includes(r.type)
    );
    for (const report of vsmReports) {
      const url = `${window.location.origin}/report_vsm/${report.id}`;
      urls.push(url);
      urlDetails.push({
        url,
        type: report.type,
        name: report.name || report.type,
        id: report.id,
        createdAt: report.createdAt
      });
      initialSelections[report.id] = true;
    }
    
    // Chart reports (Fishbone, Stakeholder, Impact Map, Brainstorming)
    const chartReports = reports.filter(r => 
      reportGroups.charts.types.includes(r.type)
    );
    for (const report of chartReports) {
      // Use /report/Charts/<id> format for these specific chart reports
      const url = `${window.location.origin}/report/Charts/${report.id}`;
      urls.push(url);
      urlDetails.push({
        url,
        type: report.type,
        name: report.name || report.type,
        id: report.id,
        createdAt: report.createdAt
      });
      initialSelections[report.id] = true;
    }
    
    // Chart data reports
    const chartDataReports = reports.filter(r => 
      reportGroups.chartData.types.includes(r.type)
    );
    for (const report of chartDataReports) {
      // Fix the URL pattern for Run Chart and other chart data reports
      // Use report_chart instead of report_Chart (lowercase 'c')
      const url = `${window.location.origin}/report_chart/${report.id}`;
      urls.push(url);
      urlDetails.push({
        url,
        type: report.type,
        name: report.name || report.type,
        id: report.id,
        createdAt: report.createdAt
      });
      initialSelections[report.id] = true;
    }
    
    // KPI reports
    for (const kpi of kpis) {
      const url = `${window.location.origin}/kpi_pdf/${kpi.id}`;
      urls.push(url);
      urlDetails.push({
        url,
        type: "KPI Report",
        name: kpi.name || "KPI Report",
        id: kpi.id,
        createdAt: kpi.createdAt
      });
      initialSelections[kpi.id] = true;
    }
    
    // Save all collected URL details
    setCollectedUrls(urlDetails);
    setSelectedReports(initialSelections);
    setSelectAll(true);
  };

  // Call the collectReportUrls function whenever reports or kpis data changes
  useEffect(() => {
    if (project && (reports.length > 0 || kpis.length > 0)) {
      collectReportUrls();
    }
  }, [project, reports, kpis]);
  
  // Function to handle checkbox change for individual reports
  const handleCheckboxChange = (id) => {
    const updatedSelections = { ...selectedReports, [id]: !selectedReports[id] };
    setSelectedReports(updatedSelections);
    
    // Update selectAll state based on all items being selected
    const allSelected = collectedUrls.every(item => updatedSelections[item.id]);
    setSelectAll(allSelected);
  };
  
  // Function to handle select all checkbox
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    // Update all individual selections
    const updatedSelections = {};
    collectedUrls.forEach(item => {
      updatedSelections[item.id] = newSelectAll;
    });
    
    setSelectedReports(updatedSelections);
  };
  
  // Modify the generateProjectPDF function to only use selected reports and always include project details
  const generateProjectPDF = async () => {
    setIsGeneratingPDF(true);
    setGeneratedPdfUrl(null);
    setError(null);

    try {
      // Get the project details URL always
      const projectDetailsUrl = `${window.location.origin}/project_details/${projectId}`;

      // Get only the selected URLs - filtered and sorted by their order in the list
      const selectedUrlItems = collectedUrls
        .filter(item => 
          // Filter for selected reports (excluding Project Details)
          item.type !== "Project Details" && selectedReports[item.id]
        )
        // Sort them by their display index (same order as shown in the table)
        .sort((a, b) => {
          // Find the index of item a in collectedUrls (excluding Project Details)
          const indexA = collectedUrls
            .filter(item => item.type !== "Project Details")
            .findIndex(item => item.id === a.id);
          
          // Find the index of item b in collectedUrls (excluding Project Details)
          const indexB = collectedUrls
            .filter(item => item.type !== "Project Details")
            .findIndex(item => item.id === b.id);
          
          return indexA - indexB;
        });
      
      if (selectedUrlItems.length === 0) {
        alert('Please select at least one report to generate a PDF.');
        setIsGeneratingPDF(false);
        return;
      }
      
      // Combine URLs with Project Details first, then all other URLs in their display order
      const urls = [projectDetailsUrl, ...selectedUrlItems.map(item => item.url)];
      
      console.log(`Selected URLs for PDF in order: ${urls.length}`);
      console.log('URLs being sent to API:', JSON.stringify(urls));
      
      // Call the API with the batch request - no need to reverse the URLs anymore
      const data = await generateBatchPdfViaApi(urls);
      console.log('Batch PDF generation completed:', data);
      
      // If we have a combined PDF URL, store it
      if (data && data.combined_pdf_url) {
        setGeneratedPdfUrl(data.combined_pdf_url);
      } else {
        throw new Error('No combined PDF URL was returned from the API');
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(error.message || 'Error generating PDF. Please try again.');
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to get the badge color - now always returns "danger" (red)
  const getReportBadgeColor = () => "danger";

  return (
    <Container style={{ width: '1024px', margin: '0 auto', padding: '20px' }}>
      {/* Include the portrait styles */}
      <style>{portraitStyles}</style>
      
      {/* Export PDF Button Section */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
        <Button 
          style={{ 
            padding: '12px 25px',
            fontSize: '16px',
            borderRadius: '8px'
          }}
          onClick={generateProjectPDF}
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? 'Generating PDF...' : 'Export Project Report as PDF'}
        </Button>
        
        {generatedPdfUrl && (
          <Button 
            variant="success"
            style={{ 
              padding: '12px 25px',
              fontSize: '16px',
              borderRadius: '8px'
            }}
            onClick={() => window.open(generatedPdfUrl, '_blank')}
          >
            Download Combined PDF
          </Button>
        )}
        
        {isGeneratingPDF && (
          <Alert variant="success" style={{ marginTop: '10px' }}>
            <Alert.Heading>PDF is generating, please wait...</Alert.Heading>
            <p>Please do not close this window until the PDF generation is completed and the file is downloaded. It can take some time depending on how many reports and data you have.</p>
          </Alert>
        )}

        {error && (
          <Alert variant="danger" style={{ marginTop: '10px', width: '100%' }}>
            <Alert.Heading>Error Generating PDF</Alert.Heading>
            <p>{error}</p>
            <hr />
            <p className="mb-0">
              Please check the browser console for more details and try again.
            </p>
          </Alert>
        )}
      </div>

      {project && (
        <div style={{ marginBottom: '20px' }} className="portrait">
          <Card>
            <Card.Header style={{
              backgroundColor: '#2c3e50',
              color: 'white',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: '2' }}>
                  <h4 style={{ margin: 0, marginBottom: '10px' }}>{project.name}</h4>
                  {project.description && (
                    <p style={{ margin: '10px 0 0 0', fontSize: '0.9em' }}>{project.description}</p>
                  )}
                  <div style={{ marginTop: '15px' }}>
                    {project.status && (
                      <Badge 
                        bg={
                          project.status === 'ACTIVE' ? 'success' :
                          project.status === 'COMPLETED' ? 'info' :
                          project.status === 'ON_HOLD' ? 'warning' : 'secondary'
                        }
                        style={{ marginRight: '10px' }}
                      >
                        {project.status}
                      </Badge>
                    )}
                  </div>
                </div>
                <div style={{ flex: '1', textAlign: 'right', fontSize: '0.9em' }}>
                  <div style={{ marginBottom: '5px' }}>Created: {formatDate(project.createdAt)}</div>
                  {project.updatedAt && (
                    <div style={{ marginBottom: '5px' }}>Last Updated: {formatDate(project.updatedAt)}</div>
                  )}
                  {project.startDate && (
                    <div style={{ marginBottom: '5px' }}>Start Date: {formatDate(project.startDate)}</div>
                  )}
                  {project.endDate && (
                    <div style={{ marginBottom: '5px' }}>End Date: {formatDate(project.endDate)}</div>
                  )}
                  {project.ownerEmail && (
                    <div style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ marginRight: '8px' }}>Owner:</span>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <UserAvatar 
                          email={project.ownerEmail} 
                          userSub={project.owner}
                          organizationID={project.organizationID}
                          size={24} 
                          isOwner={true}
                        />
                        <span style={{ marginLeft: '6px', fontWeight: '500' }}>{project.ownerEmail}</span>
                      </div>
                    </div>
                  )}
                  {!project.ownerEmail && project.owner && (
                    <div style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ marginRight: '8px' }}>Owner:</span>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <UserAvatar 
                          email={project.owner} 
                          organizationID={project.organizationID}
                          size={24} 
                          isOwner={true}
                        />
                        <span style={{ marginLeft: '6px', fontWeight: '500' }}>{project.owner}</span>
                      </div>
                    </div>
                  )}
                  {project.organization?.name && (
                    <div style={{ marginBottom: '5px' }}>Organization: {project.organization.name}</div>
                  )}
                </div>
              </div>
            </Card.Header>
            <Card.Body style={{ backgroundColor: '#f8f9fa', padding: '15px' }}>
              <Row>
                {project.attachments?.length > 0 && (
                  <Col md={12} style={{ marginBottom: '15px' }}>
                    <h6>Project Attachments:</h6>
                    <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-10px' }}>
                      {project.attachments.map((attachment, index) => (
                          attachmentUrls[attachment] ? (
                            <div key={index} style={{ margin: "10px", textAlign: "center" }}>
                              <img
                                src={attachmentUrls[attachment]}
                                alt={`Attachment ${index + 1}`}
                                style={{ width: "200px", height: "200px", objectFit: "cover" }}
                              />
                            </div>
                          ) : null
                      ))}
                    </div>
                  </Col>
                )}
              </Row>

              <Row>
                {projectMembers.length > 0 && (
                  <Col md={12} style={{ marginBottom: '15px' }}>
                    <h6>Project Members:</h6>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {projectMembers.map((member, index) => (
                        <Card key={index} style={{ backgroundColor: 'white', border: '1px solid #dee2e6' }}>
                          <Card.Body style={{ padding: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <UserAvatar 
                                  email={member.email} 
                                  userSub={member.userSub}
                                  organizationID={project.organizationID}
                                  size={32}
                                  style={{ marginRight: '12px' }}
                                  isOwner={project.ownerEmail === member.email || (!project.ownerEmail && project.owner === member.userSub)}
                                />
                                <div>
                                  <div style={{ fontWeight: '500' }}>{member.email}</div>
                                  {member.role && (
                                    <div style={{ fontSize: '0.9em', color: '#6c757d' }}>
                                      Role: {member.role}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge bg="info">{member.userSub ? 'Active' : 'Invited'}</Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Tangibles and Intangibles sections - NOT in portrait class */}
      {project && (tangibles.length > 0 || intangibles.length > 0) && (
        <div style={{ marginBottom: '20px' }}>
          <Card>
            <Card.Body style={{ backgroundColor: '#f8f9fa', padding: '15px' }}>
              {/* Tangibles Section */}
              {tangibles.length > 0 && (
                <Row style={{ marginTop: '15px' }}>
                  <Col md={12}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h6 style={{ margin: 0 }}>Tangible Benefits:</h6>
                      <Badge bg="primary" style={{ fontSize: '1.1em', padding: '8px 12px' }}>
                        Total: ${tangibles.reduce((sum, tangible) => sum + (tangible.value || 0), 0).toLocaleString()}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {tangibles.map((tangible, index) => (
                        <Card key={index} style={{ backgroundColor: 'white' }}>
                          <Card.Body style={{ padding: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong>{tangible.label}</strong>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>
                                  {new Date(tangible.date).toLocaleDateString()}
                                </p>
                              </div>
                              {tangible.value && (
                                <Badge bg="success" style={{ fontSize: '1em' }}>
                                  ${tangible.value.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </Col>
                </Row>
              )}

              {/* Intangibles Section */}
              {intangibles.length > 0 && (
                <Row style={{ marginTop: '15px' }}>
                  <Col md={12}>
                    <h6>Intangible Benefits:</h6>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {intangibles.map((intangible, index) => (
                        <Card key={index} style={{ backgroundColor: 'white' }}>
                          <Card.Body style={{ padding: '10px' }}>
                            <p style={{ margin: '0', fontSize: '0.9em' }}>{intangible.text}</p>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Report URLs Section */}
      {collectedUrls.length > 0 && (
        <Card style={{ marginTop: '30px', marginBottom: '30px' }}>
          <Card.Header style={{ 
            backgroundColor: '#2c3e50', 
            color: 'white',
            padding: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h5 style={{ margin: 0 }}>Project Reports ({collectedUrls.filter(item => item.type !== "Project Details").length})</h5>
            <div>
              <Form.Check 
                type="checkbox"
                id="select-all-checkbox"
                label="Select All"
                checked={selectAll}
                onChange={handleSelectAll}
                style={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              />
            </div>
          </Card.Header>
          <Card.Body style={{ padding: 0 }}>
            <Table responsive hover>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ width: '40px' }}>Select</th>
                  <th style={{ width: '40px' }}>#</th>
                  <th style={{ width: '180px' }}>Report Type</th>
                  <th>Report Name</th>
                  <th style={{ width: '150px' }}>Date Created</th>
                  <th>Full URL</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {collectedUrls
                  .filter(item => item.type !== "Project Details") // Remove Project Details
                  .map((item, index) => (
                    <tr key={index}>
                      <td>
                        <Form.Check 
                          type="checkbox"
                          id={`checkbox-${item.id}`}
                          checked={selectedReports[item.id] || false}
                          onChange={() => handleCheckboxChange(item.id)}
                          style={{ margin: '0 auto', display: 'block' }}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td>
                        <Badge 
                          bg="danger"
                          style={{ padding: '6px 10px' }}
                        >
                          {item.type}
                        </Badge>
                      </td>
                      <td>{item.name}</td>
                      <td>{item.createdAt ? formatDate(item.createdAt) : '-'}</td>
                      <td style={{ wordBreak: 'break-all', fontSize: '0.85em' }}>{item.url}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => window.open(item.url, '_blank')}
                          title="Open in new tab"
                          style={{ width: '80px' }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ProjectDetailsPdf; 