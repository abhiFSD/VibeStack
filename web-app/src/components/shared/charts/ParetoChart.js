import React from 'react';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryLine, VictoryLabel, VictoryScatter } from 'victory';

class ParetoChart extends React.Component {
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

  calculateCumulativeData = (data) => {
    let cumulativeValue = 0;
    return data.map((item) => {
      cumulativeValue += item.value;
      return {
        x: item.text,
        y: cumulativeValue
      };
    });
  };

  calculateCumulativeDataValue = (data) => {
    let cumulativeValue = 0;
    const totalSum = data.reduce((total, item) => total + item.value, 0);
    
    return data.map((item) => {
      cumulativeValue += item.value;
      return {
        x: item.text,
        y: (cumulativeValue / totalSum) * 100,
        cumulativeScore: cumulativeValue
      };
    });
  };

  render() {
    const { data, onBarClick } = this.props;
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const chartWidth = Math.max(sortedData.length * 100, 800);
    const cumulativeData = this.calculateCumulativeData(sortedData);
    const cumulativeDataValue = this.calculateCumulativeDataValue(sortedData);

    // Calculate the total sum and 80% threshold
    const totalSum = sortedData.reduce((total, item) => total + item.value, 0);
    const eightyPercentSum = totalSum * 0.8;

    // Calculate the index of the eighty percent point
    let eightyPercentIndex;
    let cumulativeSum = 0;
    for (let i = 0; i < sortedData.length; i++) {
      cumulativeSum += sortedData[i].value;
      if (cumulativeSum >= eightyPercentSum) {
        eightyPercentIndex = i + (eightyPercentSum - (cumulativeSum - sortedData[i].value)) / sortedData[i].value + 0.1;
        break;
      }
    }

    const margin = {
      top: 20,
      right: 60, // Increased right margin to accommodate cumulative % label
      bottom: 60,
      left: 60
    };

    return (
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <div style={{ minWidth: chartWidth, position: 'relative' }}>
          <VictoryChart
            height={400}
            width={chartWidth}
            domain={{ y: [0, totalSum] }}
            domainPadding={{ x: 50, y: [0, 0] }}
          >
            <VictoryAxis
              tickFormat={(tick, index) => {
                const item = sortedData[index];
                if (item) {
                  return `${this.truncateLabel(tick)}\n${item.value} (${Math.round(item.value / totalSum * 100)}%)`;
                }
                return this.truncateLabel(tick);
              }}
              style={{
                tickLabels: { fontSize: 10, padding: 5 }
              }}
            />
            <VictoryAxis
              dependentAxis
              domain={[0, Math.max(...data.map(item => item.value))]}
              style={{
                grid: { stroke: "#ccc", strokeWidth: 0.5 },
                tickLabels: { fontSize: 10 }
              }}
              tickLabelComponent={<VictoryLabel dx={8} />}
            />
            <VictoryAxis
              dependentAxis
              orientation="right"
              style={{
                axis: { stroke: "black" },
                ticks: { stroke: "black" },
                tickLabels: { fill: "none" }
              }}
            />
            <VictoryAxis
              orientation="top"
              style={{
                axis: { stroke: "black" },
                ticks: { stroke: "black" },
                tickLabels: { fontSize: 10 }
              }}
              tickFormat={(tick, index) => {
                const item = cumulativeData[index];
                const itemValue = cumulativeDataValue[index];
                if (item && itemValue) {
                  return `${Math.round(item.y)} (${Math.round(itemValue.y)}%)`;
                }
                return null;
              }}
            />
            <VictoryLine
              data={cumulativeData}
              style={{
                data: { stroke: "green" }
              }}
            />
            <VictoryScatter
              data={cumulativeData}
              size={7}
              style={{ data: { fill: "green" } }}
            />
            {sortedData.map((item, index) => (
              <VictoryLine
                key={index}
                data={[
                  { x: item.text, y: item.value },
                  { x: item.text, y: cumulativeData[index].y }
                ]}
                style={{
                  data: { stroke: "black", strokeWidth: 0.5, strokeDasharray: "5,5" }
                }}
              />
            ))}

            {eightyPercentIndex !== undefined && (
              <VictoryLine
                data={[{ x: eightyPercentIndex, y: 0 }, { x: eightyPercentIndex, y: totalSum }]}
                style={{ data: { stroke: "green", strokeWidth: 2 } }}
              />
            )}

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
              data={sortedData}
              x="text"
              y="value"
            />
          </VictoryChart>

          <div style={{ 
            position: 'absolute', 
            right: 0, 
            top: 40, 
            bottom: 50, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            marginRight: '1px'
          }}>
            <div>100%</div>
            <div style={{ color: 'red' }}>80%</div>
            <div>60%</div>
            <div>40%</div>
            <div>20%</div>
            <div>0%</div>
          </div>

          <div style={{ 
            position: 'absolute', 
            left: '10px', 
            top: '50%', 
            transform: 'rotate(-90deg) translateX(-50%)', 
            transformOrigin: '0 0' 
          }}>
            Frequency/Values(Units)
          </div>

          <div style={{ 
            position: 'absolute', 
            right: '-36px', 
            top: '50%', 
            transform: 'rotate(-90deg) translateX(-50%)', 
            transformOrigin: '0 0' 
          }}>
            Cumulative %
          </div>
        </div>
      </div>
    );
  }
}

export default ParetoChart; 