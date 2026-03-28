import React from 'react';
import { VictoryChart, VictoryScatter, VictoryAxis, VictoryContainer } from 'victory';

class ScatterChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clicked: false,
            style: {
                data: { fill: "tomato" }
            }
        };
    }

    truncateLabel = (label) => {
        if (label.length > 10) {
            return `${label.substring(0, 10)}...`;
        }
        return label;
    };

    render() {
        const { data, onBarPress, xaxis, yaxis } = this.props;

        // Convert xValue and yValue to numbers.
        const processedData = data.map(d => ({
            ...d,
            xValue: parseFloat(d.xValue),
            yValue: parseFloat(d.yValue)
        }));

        // Determine the range for x and y
        const xValues = processedData.map(item => item.xValue);
        const yValues = processedData.map(d => parseFloat(d.yValue));
        
        const xDomain = [Math.min(...xValues), Math.max(...xValues)];
        const yMax = Math.ceil((Math.max(...yValues) + 20 ) / 20) * 20; 

        const yMin = 0; // Minimum y-value is always 0
        const yRange = yMax - yMin; // Range of y-values
        const tickStep = yRange > 100 ? 20 : 1; // If the range is greater than 100, use a step of 20, otherwise use a step of 1
        const tickValues = Array.from({ length: Math.floor(yRange / tickStep) + 1 }, (_, i) => yMin + i * tickStep);
        const yDomain = [0, yMax];

        return (
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <VictoryChart 
                    domain={{ x: xDomain, y: yDomain }}
                    domainPadding={{ x: 50, y: [0, 0] }}
                    containerComponent={<VictoryContainer />}
                    padding={{ left: 100, top: 20, right: 20, bottom: 50 }}
                    width={500} // Adjust as needed
                    height={250} // Reduced from 300 to 250
                >
                    <VictoryAxis
                        label={xaxis}
                        style={{
                            axisLabel: { padding: 30 },
                            grid: {
                                stroke: "#ccc",
                                strokeWidth: 0.5
                            }
                        }}
                    />
                    <VictoryAxis
                        dependentAxis
                        label={yaxis}
                        domain={yDomain}
                        style={{
                            axisLabel: { padding: 75},
                            grid: {
                                stroke: "#ccc",
                                strokeWidth: 0.5
                            }
                        }}
                    />
                    <VictoryScatter
                        events={[{
                            target: "data",
                            eventHandlers: {
                                onClick: (event, props) => {
                                    if (this.props.onBarPress) {
                                        this.props.onBarPress(props.datum);
                                    }
                                    return [];
                                }
                            }
                        }]}
                        style={this.state.style}
                        data={processedData}
                        x="xValue"
                        y="yValue"
                        size={5}
                    />
                </VictoryChart>
            </div>
        );
    }
}

export default ScatterChart;
