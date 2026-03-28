import React, { useState, useEffect, useRef } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { useParams } from 'react-router-dom';
import { Card, Button, Alert, Col, Container, Table, Badge } from 'react-bootstrap';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryScatter, VictoryContainer, VictoryArea, VictoryLabel, VictoryTooltip } from 'victory';
import { getKPI, listKPIData } from '../../graphql/queries';
import { generatePdfViaApi } from '../../utils/apiPdfGenerator';
import { handleKPIGoalAchievedAward } from '../../utils/awards';

const styles = {
    container: { width: '1024px' },
    colStyle: { marginBottom: '20px' },
    buttonStyle: { marginBottom: '20px' },
    card: { marginBottom: '20px', border: 'none' },
    cardHeader: {
        backgroundColor: '#009688',
        color: 'white',
        padding: '10px',
        display: 'flex',
        alignItems: 'center'
    },
    cardBody: {
        backgroundColor: '#f5f5f5',
        padding: '20px'
    }
};

const KPIViewPDF = ({ kpiId: propKpiId, fromProject = false }) => {
    const { kpiId: urlKpiId } = useParams();
    const kpiId = propKpiId || urlKpiId;
    const [kpi, setKPI] = useState(null);
    const [kpiData, setKPIData] = useState([]);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [lastAwardedValue, setLastAwardedValue] = useState(null);
    const chartRef = useRef(null);
    const reportRef = useRef(null);
    const gridRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, [kpiId]);

    const checkKPIGoalAchievement = async (newData, kpiDetails) => {
        if (!kpiDetails || !kpiDetails.target || !kpiDetails.trend || !kpiDetails.projectID) {
            return;
        }

        // Get the latest data point
        const latestDataPoint = newData[newData.length - 1];
        if (!latestDataPoint) return;

        const currentValue = parseFloat(latestDataPoint.yAxisvalue);
        const targetValue = parseFloat(kpiDetails.target);

        // Check if we've already awarded for this value
        if (lastAwardedValue === currentValue) {
            return;
        }

        // For positive trend, check if we've reached or exceeded target
        // For negative trend, check if we've reached or gone below target
        const goalAchieved = kpiDetails.trend 
            ? currentValue >= targetValue  // Positive trend
            : currentValue <= targetValue; // Negative trend

        if (goalAchieved) {
            console.log('KPI goal achieved! Creating awards for project members...');
            try {
                await handleKPIGoalAchievedAward(
                    kpiDetails.organizationID,
                    kpiDetails.projectID,
                    kpiDetails.name
                );
                setLastAwardedValue(currentValue);
                console.log('KPI goal achievement awards created successfully');
            } catch (error) {
                console.error('Error creating KPI goal achievement awards:', error);
            }
        }
    };

    const fetchData = async () => {
        try {
            const kpiResponse = await API.graphql(
                graphqlOperation(getKPI, { id: kpiId })
            );
            const kpiDetails = kpiResponse.data.getKPI;
            setKPI(kpiDetails);

            const dataResponse = await API.graphql({
                query: listKPIData,
                variables: { 
                    filter: { 
                        kpiID: { eq: kpiId },
                        _deleted: { ne: true }
                    }
                }
            });
            const sortedData = dataResponse.data.listKPIData.items
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            setKPIData(sortedData);

            // Check for goal achievement with new data
            await checkKPIGoalAchievement(sortedData, kpiDetails);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const generateCombinedPDF = async () => {
        setIsGeneratingPDF(true);

        try {
            // Get the current URL of the page
            const currentUrl = window.location.href;
            
            // Call the API to generate the PDF
            await generatePdfViaApi(currentUrl);
            
            console.log('PDF generation initiated successfully');
        } catch (error) {
            console.error('Error initiating PDF generation:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const renderChart = () => {
        if (!kpiData.length) return null;

        const chartData = kpiData.map(data => ({
            x: new Date(data.date),
            y: parseFloat(data.yAxisvalue),
            xAxisValue: data.xAxisValue,
            type: 'data'
        }));

        const importantDates = [
            {
                x: new Date(kpi.startDate),
                y: null,
                xAxisValue: 'KPI Start',
                label: 'KPI Start',
                type: 'milestone'
            },
            {
                x: new Date(kpi.endDate),
                y: null,
                xAxisValue: 'KPI End',
                label: 'KPI End',
                type: 'milestone'
            }
        ];

        const allDataPoints = [...chartData, ...importantDates]
            .sort((a, b) => a.x - b.x)
            .map((point, index) => ({
                ...point,
                indexPosition: index
            }));

        return (
            <div ref={chartRef} style={{ width: '100%', height: '400px' }}>
                <VictoryChart
                    width={1000}
                    height={400}
                    padding={{ top: 50, bottom: 100, left: 50, right: 50 }}
                    domainPadding={{ x: 20, y: 20 }}
                    scale={{ x: "linear", y: "linear" }}
                    domain={{ 
                        x: [-0.5, allDataPoints.length - 0.5],
                        y: [0, Math.max(...chartData.map(d => d.y), kpi.target || 0) * 1.2]
                    }}
                    containerComponent={
                        <VictoryContainer 
                            responsive={true}
                            style={{
                                touchAction: "auto",
                                width: '100%'
                            }}
                        />
                    }
                >
                    <VictoryAxis
                        dependentAxis
                        label={kpi.yAxisLabel}
                        style={{
                            axis: { stroke: "#ccc" },
                            grid: { stroke: "#e5e5e5", strokeWidth: 1 },
                            axisLabel: { padding: 35, fontSize: 12 },
                            tickLabels: { fontSize: 10 }
                        }}
                        tickFormat={(t) => Number(t).toFixed(1)}
                    />
                    <VictoryAxis
                        label={kpi.xAxisLabel}
                        style={{
                            axis: { stroke: "#ccc" },
                            grid: { stroke: "#e5e5e5", strokeWidth: 1 },
                            axisLabel: { padding: 80, fontSize: 12 },
                            tickLabels: { fontSize: 10, textAnchor: 'start' }
                        }}
                        tickValues={allDataPoints.map((_, index) => index)}
                        tickFormat={(index) => {
                            const point = allDataPoints[index];
                            const dateStr = point.x.toLocaleDateString();
                            return point.type === 'milestone' 
                                ? `${point.label}\n${dateStr}`
                                : `${point.xAxisValue}\n${dateStr}`;
                        }}
                        tickLabelComponent={
                            <VictoryLabel 
                                dy={0}
                                dx={10}
                                textAnchor="start"
                                verticalAnchor="middle"
                                angle={90}
                            />
                        }
                    />
                    <VictoryLine
                        data={chartData.map((point, index) => ({
                            ...point,
                            x: allDataPoints.findIndex(p => p.x === point.x)
                        }))}
                        x="x"
                        y="y"
                        style={{
                            data: { stroke: kpi.trend ? "#4CAF50" : "#F44336", strokeWidth: 2 }
                        }}
                    />
                    <VictoryScatter
                        data={allDataPoints.map((point, index) => ({
                            ...point,
                            x: index
                        }))}
                        x="x"
                        y="y"
                        size={({ datum }) => datum.type === 'milestone' ? 7 : 5}
                        style={{
                            data: {
                                fill: ({ datum }) => datum.type === 'milestone' ? "#FFA500" : (kpi.trend ? "#4CAF50" : "#F44336")
                            }
                        }}
                        labels={({ datum }) => {
                            const originalDate = allDataPoints[datum.x].x;
                            const dateStr = new Date(originalDate).toLocaleDateString();
                            return datum.type === 'milestone'
                                ? `${datum.label}\n${dateStr}`
                                : `${kpi.xAxisLabel}: ${datum.xAxisValue}\n${dateStr}\n${kpi.yAxisLabel}: ${datum.y}`;
                        }}
                        labelComponent={
                            <VictoryTooltip
                                style={{ fontSize: 10 }}
                            />
                        }
                    />
                    {kpi.target && (
                        <VictoryLine
                            y={() => kpi.target}
                            style={{
                                data: { stroke: "#4CAF50", strokeWidth: 2, strokeDasharray: "5,5" }
                            }}
                        />
                    )}
                </VictoryChart>
            </div>
        );
    };

    return (
        <Container style={{ width: '1024px' }} className="chart-component">
            {isGeneratingPDF && (
                <Alert variant="success">
                    <Alert.Heading>PDF is generating, please wait it can take a moment..</Alert.Heading>
                </Alert>
            )}
            
            {!fromProject && (
                <Col style={styles.colStyle}>
                    <Button 
                        variant="primary"
                        style={styles.buttonStyle} 
                        onClick={generateCombinedPDF}
                        disabled={isGeneratingPDF}
                    >
                        {isGeneratingPDF ? 'Generating PDF...' : 'Export KPI as PDF'}
                    </Button>
                </Col>
            )}

            <div ref={gridRef} className="grid-section">
                {kpi && (
                    <Card style={styles.card} className="card-header">
                        <Card.Header style={styles.cardHeader}>
                            <h6>
                                KPI Report - {kpi.name} | Created At: {new Date(kpi.createdAt).toLocaleDateString()}
                                <span style={{ 
                                    marginLeft: '10px', 
                                    color: kpi.trend ? 'lightgreen' : 'lightcoral'
                                }}>
                                    | Desired Trend: {kpi.trend ? "Positive (+)" : "Negative (-)"}
                                </span>
                            </h6>
                        </Card.Header>
                    </Card>
                )}

                <Card style={styles.card} className="chart-card">
                    {renderChart()}
                </Card>
            </div>

            <div ref={reportRef} className="portrait-content">
                {kpiData.length > 0 && (
                    <Card style={styles.card} className="content-card">
                        <Card.Header style={styles.cardHeader}>
                            <h2 style={{ margin: '20px 0' }}>Data Points: {kpiData.length}</h2>
                        </Card.Header>
                        <Card.Body style={styles.cardBody}>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>{kpi?.xAxisLabel}</th>
                                        <th>{kpi?.yAxisLabel}</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kpiData.map((item, index) => (
                                        <tr key={index}>
                                            <td>{new Date(item.date).toLocaleDateString()}</td>
                                            <td>{item.xAxisValue}</td>
                                            <td>
                                                <Badge variant="primary">{item.yAxisvalue}</Badge>
                                            </td>
                                            <td>{item.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                )}
            </div>
        </Container>
    );
};

export default KPIViewPDF;