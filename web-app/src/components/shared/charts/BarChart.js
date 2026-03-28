import React from 'react';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryLabel } from 'victory';

class BarChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: false,
      style: {
        data: { fill: "tomato" }
      }
    };
  }

  handleMouseOver = () => {
    const fillColor = this.state.clicked ? "blue" : "tomato";
    const clicked = !this.state.clicked;
    this.setState({
      clicked,
      style: {
        data: { fill: fillColor }
      }
    });
  };

  truncateLabel = (label) => {
    if (label.length > 10) {
      return `${label.substring(0, 10)}...`;
    }
    return label;
  };

  render() {
    const { data, onBarClick } = this.props;
    const chartWidth = Math.max(data.length * (125 - (Math.min(Math.max(data.length - 3, 0), 3) * 10)), 800);

    return (
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <div style={{ minWidth: chartWidth, position: 'relative' }}>
          <VictoryChart 
            height={400} 
            width={chartWidth} 
            domainPadding={{ x: 50, y: [0, 0] }}
          >
            <VictoryAxis
              tickFormat={(tick, index) => this.truncateLabel(data[index].text)}
              style={{
                tickLabels: { fontSize: 10, padding: 5 }
              }}
            />
            <VictoryAxis
              dependentAxis
              domain={[0, Math.max(...data.map(item => item.value))]}
              style={{
                grid: {
                  stroke: "#ccc",
                  strokeWidth: 0.5
                },
                tickLabels: { fontSize: 10 }
              }}
            />
            <VictoryBar
              events={[{
                target: "data",
                eventHandlers: {
                  onClick: (evt, props) => {
                    if (onBarClick) {
                      onBarClick(props.datum);
                    }
                    return [];
                  }
                }
              }]}
              style={this.state.style}
              data={data}
              x="text"
              y="value"
              labels={({ datum }) => datum.value}
              labelComponent={<VictoryLabel dy={-20} />}
            />
          </VictoryChart>

          <div style={{ 
            position: 'absolute', 
            left: '10px', 
            top: '50%', 
            transform: 'rotate(-90deg) translateX(-50%)', 
            transformOrigin: '0 0' 
          }}>
            Frequency/Values(Units)
          </div>
        </div>
      </div>
    );
  }
}

export default BarChart;
