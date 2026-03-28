import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { API } from 'aws-amplify';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';

const ReportOperations = ({ 
  report = null, 
  mode = 'create', // 'create', 'edit', 'copy'
  onSuccess,
  onCancel,
  userSub,
  organizationID,
  projectID,
  tools
}) => {
  const [name, setName] = useState(report?.name || '');
  const [type, setType] = useState(report?.type || '');
  const [bones, setBones] = useState(report?.bones || null);
  const [trend, setTrend] = useState(report?.trend ?? true);
  const [target, setTarget] = useState(report?.target || '');
  const [xaxis, setXaxis] = useState(report?.xaxis || '');
  const [yaxis, setYaxis] = useState(report?.yaxis || '');
  const [media, setMedia] = useState(report?.media || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingReportDetails, setIsLoadingReportDetails] = useState(false);
  const [fullReport, setFullReport] = useState(null);
  const [copyReportName, setCopyReportName] = useState("");
  const [checkedCategories, setCheckedCategories] = useState([]);
  const [checkedActionItems, setCheckedActionItems] = useState([]);
  const [checkedChartItems, setCheckedChartItems] = useState([]);

  useEffect(() => {
    if (mode === 'copy' && report) {
      fetchFullReport();
    }
  }, [mode, report]);

  const fetchFullReport = async () => {
    setIsLoadingReportDetails(true);
    try {
      const reportResult = await API.graphql({
        query: queries.getReport,
        variables: { id: report.id }
      });
      
      const reportData = reportResult.data.getReport;
      if (!reportData) {
        console.error('Report not found');
        return null;
      }

      // Get all categories for this report
      const categoriesResult = await API.graphql({
        query: queries.listCategories,
        variables: {
          filter: { reportID: { eq: report.id } }
        }
      });
      const categories = categoriesResult.data.listCategories.items;

      // Fetch statements for each category
      for (let category of categories) {
        const statementsResult = await API.graphql({
          query: queries.listStatements,
          variables: {
            filter: { categoriesID: { eq: category.id } }
          }
        });
        category.Statements = statementsResult.data.listStatements.items;
      }

      // Get all action items for this report
      const actionItemsResult = await API.graphql({
        query: queries.listActionItems,
        variables: {
          filter: { reportID: { eq: report.id } }
        }
      });
      const actionItems = actionItemsResult.data.listActionItems.items;

      // Get chart data if applicable
      let chartData = null;
      if (reportData.type === 'Brainstorming Report' || reportData.type === 'Fishbone Diagram Report' ||
          reportData.type === 'Impact Map Report' || reportData.type === 'Stakeholder Analysis Report' ||
          reportData.type === 'Histogram Report' || reportData.type === 'Pareto Chart Report' ||
          reportData.type === 'Run Chart Report' || reportData.type === 'Scatter Plot Report' ||
          reportData.type === 'Standard Work Report') {
        const chartDataResult = await API.graphql({
          query: queries.listChartData,
          variables: {
            filter: { reportID: { eq: report.id } }
          }
        });
        chartData = chartDataResult.data.listChartData.items;
      }

      const fullReportData = {
        ...reportData,
        Categories: categories,
        ActionItems: actionItems,
        ChartData: chartData,
      };

      setFullReport(fullReportData);
      setCopyReportName(fullReportData.name);
      setCheckedCategories(categories.map(category => category.id));
      setCheckedActionItems(actionItems.map(actionItem => actionItem.id));
      if (chartData) {
        setCheckedChartItems(chartData.map(item => item.id));
      }
    } catch (error) {
      console.error('Error fetching full report:', error);
    } finally {
      setIsLoadingReportDetails(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (mode === 'edit' && report) {
        const result = await API.graphql({
          query: queries.getReport,
          variables: { id: report.id }
        });
        
        const original = result.data.getReport;
        
        await API.graphql({
          query: mutations.updateReport,
          variables: { 
            input: {
              id: report.id,
              name,
              type,
              bones: type === 'Fishbone Diagram Report' ? bones : null,
              media: type === 'Scatter Plot Report' ? media : '',
              target: type === 'Scatter Plot Report' ? target : 
                     type === 'Run Chart Report' ? target : '',
              xaxis: type === 'Run Chart Report' ? xaxis : '',
              yaxis: type === 'Run Chart Report' ? yaxis : '',
              trend: type === 'Run Chart Report' ? trend : null,
              _version: original._version
            }
          }
        });
      } else if (mode === 'create') {
        const reportInput = {
          name,
          type: type || '',
          user_sub: userSub || '',
          organizationID: organizationID,
          projectID: projectID || null,
          ai_id: 'Lorem ipsum dolor sit amet',
          completed: false,
          bones: type === 'Fishbone Diagram Report' ? (bones || 0) : 
                 type === 'Standard Work Report' ? 1 : null,
          media: type === 'Scatter Plot Report' ? media : '',
          target: type === 'Scatter Plot Report' ? target : 
                  type === 'Run Chart Report' ? target : '',
          xaxis: type === 'Run Chart Report' ? xaxis : '',
          yaxis: type === 'Run Chart Report' ? yaxis : '',
          trend: type === 'Run Chart Report' ? trend : null
        };

        const newReport = await API.graphql({
          query: mutations.createReport,
          variables: { input: reportInput }
        });

        const createdReport = newReport.data.createReport;

        if (type === 'Value Stream Mapping Report') {
          const vsmInput = {
            reportID: createdReport.id,
            process: '[]',
            informationFlow: '',
            kaizenProject: '',
            demandData: '{}',
            summaryData: '{}',
            inventory: '[]'
          };

          await API.graphql({
            query: mutations.createVsm,
            variables: { input: vsmInput }
          });
        }
      } else if (mode === 'copy' && fullReport) {
        const reportInput = {
          name: `Copy of ${copyReportName}`,
          type: fullReport.type,
          user_sub: userSub,
          organizationID: organizationID,
          projectID: projectID,
          ai_id: fullReport.ai_id,
          completed: false,
          bones: fullReport.bones,
          media: fullReport.media,
          target: fullReport.target,
          xaxis: fullReport.xaxis,
          yaxis: fullReport.yaxis,
          trend: fullReport.trend
        };

        const newReport = await API.graphql({
          query: mutations.createReport,
          variables: { input: reportInput }
        });

        const createdReport = newReport.data.createReport;

        // Copy selected categories and their statements
        await Promise.all(
          checkedCategories.map(async (categoryId) => {
            const category = fullReport.Categories.find(c => c.id === categoryId);
            if (!category) return;

            const newCategory = await API.graphql({
              query: mutations.createCategories,
              variables: {
                input: {
                  name: category.name,
                  reportID: createdReport.id,
                  orderIndex: category.orderIndex,
                  assignees: category.assignees || [],
                  attachments: category.attachments || [],
                  description: category.description || '',
                }
              }
            });

            if (category.Statements) {
              await Promise.all(
                category.Statements.map(statement =>
                  API.graphql({
                    query: mutations.createStatements,
                    variables: {
                      input: {
                        name: statement.name,
                        value: statement.value,
                        default: statement.default,
                        owner: statement.owner,
                        categoriesID: newCategory.data.createCategories.id,
                      }
                    }
                  })
                )
              );
            }
          })
        );

        // Copy selected action items
        if (checkedActionItems.length > 0) {
          await Promise.all(
            checkedActionItems.map(async (actionItemId) => {
              const actionItem = fullReport.ActionItems.find(ai => ai.id === actionItemId);
              if (!actionItem) return;

              return API.graphql({
                query: mutations.createActionItems,
                variables: {
                  input: {
                    note: actionItem.note || false,
                    description: actionItem.description || '',
                    title: actionItem.title,
                    duedate: actionItem.duedate,
                    status: actionItem.status,
                    assignor: actionItem.assignor,
                    assignees: actionItem.assignees || [],
                    attachments: actionItem.attachments || [],
                    reportID: createdReport.id,
                    user_sub: actionItem.user_sub,
                  }
                }
              });
            })
          );
        }

        // Copy selected chart data
        if (checkedChartItems.length > 0) {
          await Promise.all(
            checkedChartItems.map(async (chartItemId) => {
              const chartItem = fullReport.ChartData.find(cd => cd.id === chartItemId);
              if (!chartItem) return;

              return API.graphql({
                query: mutations.createChartData,
                variables: {
                  input: {
                    text: chartItem.text || '',
                    textColor: chartItem.textColor || '',
                    posX: chartItem.posX || '',
                    posY: chartItem.posY || '',
                    reportID: createdReport.id,
                    value: chartItem.value || '',
                    date: chartItem.date || '',
                    Description: chartItem.Description || '',
                    orderIndex: chartItem.orderIndex || 0,
                  }
                }
              });
            })
          );
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error processing report:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const reportTypes = tools?.filter(tool => 
    tool.type === "Lean Tools" || tool.type === "Quality"
  ) || [];

  if (mode === 'copy') {
    return (
      <Modal show={true} onHide={onCancel} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Copy Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isLoadingReportDetails ? (
            <div className="text-center">
              <Spinner animation="border" />
              <p className="mt-2">Loading report details...</p>
            </div>
          ) : (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Report Name</Form.Label>
                <Form.Control
                  type="text"
                  value={copyReportName}
                  onChange={(e) => setCopyReportName(e.target.value)}
                  disabled
                />
              </Form.Group>

              {fullReport?.Categories?.length > 0 && (
                <div className="mb-3">
                  <h6>Categories</h6>
                  {fullReport.Categories.map(category => (
                    <Form.Check
                      key={category.id}
                      type="checkbox"
                      label={category.name}
                      checked={checkedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCheckedCategories([...checkedCategories, category.id]);
                        } else {
                          setCheckedCategories(checkedCategories.filter(id => id !== category.id));
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              {fullReport?.ActionItems?.length > 0 && (
                <div className="mb-3">
                  <h6>Action Items</h6>
                  {fullReport.ActionItems.map(item => (
                    <Form.Check
                      key={item.id}
                      type="checkbox"
                      label={item.title}
                      checked={checkedActionItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCheckedActionItems([...checkedActionItems, item.id]);
                        } else {
                          setCheckedActionItems(checkedActionItems.filter(id => id !== item.id));
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              {fullReport?.ChartData?.length > 0 && (
                <div className="mb-3">
                  <h6>Chart Data</h6>
                  {fullReport.ChartData.map((item, index) => (
                    <Form.Check
                      key={item.id}
                      type="checkbox"
                      label={`Data Point ${index + 1}`}
                      checked={checkedChartItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCheckedChartItems([...checkedChartItems, item.id]);
                        } else {
                          setCheckedChartItems(checkedChartItems.filter(id => id !== item.id));
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoadingReportDetails || isProcessing}
          >
            {isProcessing ? 'Copying...' : 'Copy Report'}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={true} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === 'create' && 'Create Report'}
          {mode === 'edit' && 'Edit Report'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter report name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Type</Form.Label>
            <Form.Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              disabled={mode === 'edit'}
            >
              <option value="">Select type</option>
              {reportTypes.map((tool) => (
                <option key={tool.id} value={tool.subtitle}>
                  {tool.subtitle}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {type === 'Fishbone Diagram Report' && (
            <Form.Group className="mb-3">
              <Form.Label>Number of Bones</Form.Label>
              <Form.Select
                value={bones || ''}
                onChange={(e) => setBones(Number(e.target.value))}
                disabled={mode === 'edit'}
              >
                <option value="">Select number of bones</option>
                {[4, 6, 8].map((num) => (
                  <option key={num} value={num}>{num} bones</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          {type === 'Run Chart Report' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Desired Trend</Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    label="Positive (+)"
                    checked={trend === true}
                    onChange={() => setTrend(true)}
                    disabled={mode === 'edit'}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    label="Negative (-)"
                    checked={trend === false}
                    onChange={() => setTrend(false)}
                    disabled={mode === 'edit'}
                  />
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Target</Form.Label>
                <Form.Control
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>X Axis</Form.Label>
                <Form.Control
                  type="text"
                  value={xaxis}
                  onChange={(e) => setXaxis(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Y Axis</Form.Label>
                <Form.Control
                  type="text"
                  value={yaxis}
                  onChange={(e) => setYaxis(e.target.value)}
                />
              </Form.Group>
            </>
          )}

          {type === 'Scatter Plot Report' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>X Axis Label</Form.Label>
                <Form.Control
                  type="text"
                  value={media}
                  onChange={(e) => setMedia(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Y Axis Label</Form.Label>
                <Form.Control
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </Form.Group>
            </>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={!name || !type || isProcessing}
        >
          {isProcessing ? 'Processing...' : (mode === 'create' ? 'Create' : 'Update')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportOperations; 