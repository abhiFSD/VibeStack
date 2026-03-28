import React, { forwardRef } from 'react';
import { VictoryChart, VictoryPolarAxis, VictoryGroup, VictoryArea } from 'victory';

const RadarChart = forwardRef(({ label_arr, data_arr, labels, data, height = 250 }, ref) => {
  // Use either label_arr/data_arr or labels/data props
  const finalLabels = label_arr || labels || [];
  const finalData = data_arr || data || [];

  if (!finalData || finalData.length === 0) {
    return null;
  }

  const firstLabel = finalLabels.slice(0, 1);
  const restLabels = finalLabels.slice(1).reverse();

  const firstData = finalData.slice(0, 1);
  const restData = finalData.slice(1).reverse();

  const chartData = [...firstLabel, ...restLabels].map((label, index) => {
    let truncatedLabel = label.length > 12 ? label.slice(0, 12) + '...' : label;
    return {
      key: index,
      x: truncatedLabel,
      y: [...firstData, ...restData][index],
    };
  });

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <VictoryChart
        polar
        height={height}
        theme={{
          axis: {
            style: {
              tickLabels: {
                fontSize: height > 200 ? 10 : 8,
                padding: height > 200 ? 8 : 6,
                angle: 0,
              },
            },
          },
        }}
        domain={{ y: [1, 5] }}
        animate={{ duration: 600 }}
      >
        <VictoryPolarAxis 
          key={`VictoryPolarAxis-${Date.now()}`}
          dependentAxis 
          labelPlacement="perpendicular"
          style={{
            tickLabels: {
              fontSize: height > 200 ? 11 : 9,
            },
          }} 
        />
        <VictoryPolarAxis key={`VictoryPolarAxis-2-${new Date().getTime()}`} />

        <VictoryGroup
          colorScale={['rgba(0, 137, 123, 1.0)']}
          style={{
            data: {
              fillOpacity: 0.2,
              strokeWidth: 2,
              strokeLinejoin: 'round',
            },
          }}
        >
          <VictoryArea key={new Date().getTime()} data={chartData} />
        </VictoryGroup>
      </VictoryChart>
    </div>
  );
});

export default RadarChart;
