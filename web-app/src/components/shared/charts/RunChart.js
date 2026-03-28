import React from 'react';
import PropTypes from 'prop-types';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryScatter, VictoryContainer, VictoryArea } from 'victory';

class RunChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedDataPoint: null
    };
  }

  handleDataPointPress = (datum) => {
    this.setState({ selectedDataPoint: datum });
    if (this.props.onScatterPress) {
      this.props.onScatterPress(datum);
    }
  };

  render() {
    const { data, target, xaxis, yaxis, maxWidth, isPdfView } = this.props;
    
    if (!data || data.length === 0) {
      return <div>No data available for RunChart</div>;
    }

    // Ensure all required data properties exist
    const validData = data.filter(item => 
      item && 
      item.date && 
      typeof item.value === 'number' && 
      !isNaN(item.value)
    );

    if (validData.length === 0) {
      return <div>Invalid data format for RunChart. Required format: array of {`{date: string, value: number}`}</div>;
    }

    // Calculate chart width with PDF view constraint
    let chartWidth = Math.max(800, validData.length * (125 - (Math.min(Math.max(validData.length - 3, 0), 3) * 10)));
    
    // For PDF view, constrain the width to fit in the container
    if (isPdfView && maxWidth) {
      chartWidth = Math.min(chartWidth, maxWidth);
    }
    const startDate = validData[0]?.date;
    const endDate = validData[validData.length - 1]?.date;
    const maxValue = Math.max(...validData.map(item => item.value));
    const targetValue = Number(target) || 0;
    const chartMaxValue = Math.max(maxValue, targetValue) + 10;
    
    // Add debugging
    console.log('RunChart target value:', target, 'parsed:', targetValue);

    const areaData = validData.map(item => ({
      date: item.date,
      y0: 0,
      y: item.value
    }));

    return (
      <div style={{ position: 'relative', width: '100%', overflowX: isPdfView ? 'hidden' : 'auto' }}>
        <div style={{ minWidth: isPdfView ? 'auto' : chartWidth, width: isPdfView ? '100%' : 'auto', position: 'relative' }}>
          <VictoryChart 
            width={chartWidth} 
            height={400}
            domainPadding={{ x: 20, y: [20, 20] }}
            padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
            containerComponent={<VictoryContainer width={chartWidth} />}
          >
            <defs>
              <linearGradient id="gradientFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="tomato" />
                <stop offset="100%" stopColor="white" />
              </linearGradient>
            </defs>
            <VictoryArea
              data={areaData}
              x="date"
              interpolation="monotoneX"
              style={{
                data: {
                  fill: "url(#gradientFill)"
                }
              }}
            />
            <VictoryAxis
              label={xaxis}
              tickFormat={(datum) => {
                return `${datum}`;
              }}
              tickValues={validData.map(item => item.date)}
              style={{
                tickLabels: { fontSize: 14, padding: 5 },
                axisLabel: { padding: 35, fontSize: 12 }
              }}
            />
            <VictoryAxis
              dependentAxis
              label={yaxis}
              domain={[0, chartMaxValue]}
              style={{
                grid: {
                  stroke: "#ccc",
                  strokeWidth: 0.5 
                },
                axisLabel: { padding: 35, fontSize: 12 }
              }}
            />
            <VictoryLine
              data={validData}
              x="date"
              y="value"
              interpolation="monotoneX"
              style={{
                data: { stroke: "tomato", strokeWidth: 3 }
              }}
            />
            {/* Target line */}
            <VictoryLine
              data={[
                { x: startDate, y: targetValue },
                { x: endDate, y: targetValue }
              ]}
              style={{
                data: { stroke: "green", strokeWidth: 3, strokeDasharray: "5,5" }
              }}
            />
            <VictoryScatter
              data={validData.map(item => ({ x: item.date, y: targetValue }))}
              size={5}
              style={{
                data: { fill: "green" }
              }}
            />
            <VictoryScatter
              events={[{
                target: "data",
                eventHandlers: {
                  onClick: (event, props) => {
                    this.handleDataPointPress(props.datum);
                    return [];
                  }
                }
              }]}
              data={validData}
              size={5}
              x="date"
              y="value"
              style={{
                data: {
                  fill: "#c43a31"
                }
              }}
            />
          </VictoryChart>
        </div>
      </div>
    );
  }
}

RunChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        date: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        text: PropTypes.string // Assuming text is optional based on your usage
    })).isRequired,
    target: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    xaxis: PropTypes.string,
    yaxis: PropTypes.string,
    maxWidth: PropTypes.number,
    isPdfView: PropTypes.bool,
    onScatterPress: PropTypes.func
};

RunChart.defaultProps = {
    data: []
};

export default RunChart;
