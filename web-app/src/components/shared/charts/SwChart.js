import React from 'react';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryTheme, VictoryLine, VictoryLabel, VictoryLegend } from 'victory';

class SwChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: false,
      style: {
        data: { fill: "tomato" }
      }
    };
  }

  getColor = (text) => {
    switch (text) {
      case "Auto":
        return "green";
      case "Manual":
        return "#FFD700";
      case "Wait":
        return "red";
      case "Walk":
        return "purple";
      default:
        return "gray";
    }
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
    const { data: unsortedData, onBarPress, taktTime, timeUnit } = this.props;
    
    // Safety check for data
    if (!unsortedData || !Array.isArray(unsortedData) || unsortedData.length === 0) {
      console.warn('SwChart: No data provided or empty data array');
      return <div>No Standard Work data available</div>;
    }
    
    const data = [...unsortedData].sort((a, b) => a.orderIndex - b.orderIndex);

    const TaktTime = taktTime ? taktTime : 0;

    // Determine the maximum end time to set the X-axis scale appropriately
    const maxEndTime = Math.max(...data.map(d => d.end));
    const calculatedMaxTime = Math.max(maxEndTime, TaktTime) + 10;

    const ticksToShow = 10;
    const tickInterval = calculatedMaxTime / ticksToShow;

    const widthPerDataPoint = 150;
    const dynamicChartWidth = Math.max(800, widthPerDataPoint * data.length);

    return (
      <div style={{ 
        width: '100%', 
        overflowX: 'auto',
        overflowY: 'hidden'
      }}>
        <div style={{ 
          width: dynamicChartWidth,
          minHeight: '500px'
        }}>
          <VictoryChart
            theme={VictoryTheme.material}
            domain={{ x: [0, data.length + 1], y: [0, calculatedMaxTime] }}
            width={dynamicChartWidth}
            height={500}
            padding={{ top: 50, right: 50, bottom: 50, left: 150 }}
          >
            <VictoryLegend
              x={100} y={0}
              orientation="horizontal"
              gutter={20}
              style={{ 
                border: { stroke: "black" }, 
                title: { fontSize: 14 }
              }}
              data={[
                { name: "Auto", symbol: { fill: "green", type: "square" } },
                { name: "Manual", symbol: { fill: "#FFD700", type: "square" } },
                { name: "Wait", symbol: { fill: "red", type: "square" } },
                { name: "Walk", symbol: { fill: "purple", type: "square" } }
              ]}
            />

            {/* Takt Time Line */}
            <VictoryLine
              style={{
                data: { 
                  stroke: "#f00", 
                  strokeWidth: 1.5, 
                  strokeDasharray: "5,5"
                }  
              }}
              y={() => TaktTime}
              labels={['Takt Time']}
              labelComponent={
                <VictoryLabel 
                  dy={-15}
                  style={{ fontSize: 12, fill: "#f00" }}
                />
              }
            />

            {/* X-axis */}
            <VictoryAxis
              dependentAxis
              tickValues={Array.from({ length: ticksToShow + 1 }).map((_, idx) => idx * tickInterval)}
              tickFormat={(t) => Math.round(t)}
              style={{
                grid: {
                  stroke: "#ccc",
                  strokeWidth: 1,
                  strokeDasharray: null
                }
              }}
              label={timeUnit}
              axisLabelComponent={<VictoryLabel dy={30} />}
            />
            
            <VictoryAxis
              invertAxis
              tickValues={data.map((item, index) => index + 1)}
              tickFormat={data.map(item => {
                const chunks = item.Description.match(/.{1,23}/g) || [];
                if (chunks.length > 2) {
                  chunks[1] = chunks[1].slice(0, 22) + '...';
                }
                return chunks.slice(0, 2);
              })}
              style={{
                tickLabels: {
                  textAnchor: 'end'
                }
              }}
              tickLabelComponent={
                <VictoryLabel 
                  dx={5} 
                  textAnchor="end" 
                  verticalAnchor="middle" 
                  angle={0}
                />
              }
            />

            {/* Bars */}
            <VictoryBar
              horizontal
              data={data}
              x={(datum) => data.findIndex(item => item.id === datum.id) + 1}
              y="end"
              y0="start"
              style={{
                data: {
                  fill: (d) => this.getColor(d.datum.text)
                }
              }}
              events={[{
                target: "data",
                eventHandlers: {
                  onClick: (evt, targetProps) => {
                    if (onBarPress) {
                      onBarPress(targetProps.datum);
                    }
                    this.handleMouseOver();
                  }
                }
              }]}
              animate={{
                onEnter: {
                  duration: 500,
                  before: () => ({ y: 0 }),
                  after: (datum) => ({ y: datum.end })
                }
              }}
            />
          </VictoryChart>
        </div>
      </div>
    );
  }
}

export default SwChart; 