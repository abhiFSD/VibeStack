import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API } from 'aws-amplify';
import * as queries from '../graphql/queries';

const ReportChartView = ({ reportId: propReportId }) => {
  const { reportId: urlReportId } = useParams();
  const reportId = propReportId || urlReportId;
  const [report, setReport] = useState(null);
  const [draggables, setDraggables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use the same dimensions as BoardView
  const fixedWidth = (report?.type === 'Impact Map Report' || report?.type === 'Stakeholder Analysis Report') ? 994 : 1024;
  const fixedHeight = (report?.type === 'Impact Map Report' || report?.type === 'Stakeholder Analysis Report') ? 590 : 640;
  const boneLength = 250;
  const gap = boneLength * 0.10;

  useEffect(() => {
    if (reportId) {
      fetchReportData();
      fetchChartData();
    }
  }, [reportId]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const reportResult = await API.graphql({
        query: queries.getReport,
        variables: { id: reportId }
      });
      setReport(reportResult.data.getReport);
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Failed to load report data');
    }
  };

  const fetchChartData = async () => {
    try {
      let allItems = [];
      let nextToken = null;
      
      // Fetch all pages of data
      do {
        const chartDataResult = await API.graphql({
          query: queries.listChartData,
          variables: {
            filter: { reportID: { eq: reportId } },
            limit: 100, // Fetch up to 100 items per page
            nextToken: nextToken
          }
        });
        
        const items = chartDataResult.data.listChartData.items.filter(item => !item._deleted);
        allItems = [...allItems, ...items];
        nextToken = chartDataResult.data.listChartData.nextToken;
        
        console.log(`Fetched ${items.length} items, total so far: ${allItems.length}`);
      } while (nextToken);
      
      console.log('Total chart data items fetched:', allItems.length);
      setDraggables(allItems);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const renderStructure = () => {
    if (!report) return null;

    const commonStyles = {
      position: 'absolute',
      backgroundColor: 'black'
    };

    switch (report.type) {
      case 'Fishbone Diagram Report':
        return (
          <>
            {/* Spine */}
            <div style={{
              ...commonStyles,
              top: '50%',
              left: 40 + gap,
              width: fixedWidth - 310 - (2 * gap),
              height: '2px'
            }} />
            
            {/* Arrow */}
            <div style={{
              ...commonStyles,
              left: fixedWidth - 300,
              top: 'calc(50% - 4px)',
              width: 0,
              height: 0,
              backgroundColor: 'transparent',
              borderTop: '5px solid transparent',
              borderLeft: '10px solid black',
              borderBottom: '5px solid transparent'
            }} />

            {/* Vertical line after arrow */}
            <div style={{
              ...commonStyles,
              top: '25%',
              right: '230px',
              width: '2px',
              height: '50%',
              backgroundColor: 'black'
            }} />

            {/* Labels */}
            <div style={{ position: 'absolute', top: '5%', left: '25%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              "Bones" Major Cause Categories
            </div>
            <div style={{ position: 'absolute', top: '5%', right: '10%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Effect
            </div>

            {/* Bones */}
            {[...Array(report.bones/2)].map((_, index) => {
              const boneSpacingMultiplier = ((2 * gap)) / (report.bones/3.5);
              const boneStart = (index * boneSpacingMultiplier + 3) / 100 * (fixedWidth - 300 - (2 * gap));
              
              return (
                <React.Fragment key={index}>
                  {/* Top bone */}
                  <div style={{
                    ...commonStyles,
                    top: '50%',
                    left: boneStart,
                    width: boneLength,
                    height: '2px',
                    transform: 'translateY(-110px) rotate(60deg)'
                  }} />
                  
                  {/* Bottom bone */}
                  <div style={{
                    ...commonStyles,
                    top: '50%',
                    left: boneStart,
                    width: boneLength,
                    height: '2px',
                    transform: 'translateY(110px) rotate(-60deg)'
                  }} />
                </React.Fragment>
              );
            })}
          </>
        );

      case 'Impact Map Report':
        return (
          <>
            <div style={{ ...commonStyles, top: '50%', width: fixedWidth, height: '1px' }} />
            <div style={{ ...commonStyles, left: '50%', height: fixedHeight, width: '1px' }} />
            <div style={{ position: 'absolute', top: '25%', left: '15%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Implement Immediately
            </div>
            <div style={{ position: 'absolute', top: '25%', right: '20%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Develop Further
            </div>
            <div style={{ position: 'absolute', bottom: '25%', left: '10%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Develop Greater Business Impact
            </div>
            <div style={{ position: 'absolute', bottom: '25%', right: '12%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Watch For Further Development
            </div>
            <div style={{ position: 'absolute', left: '-31px', top: '10px', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              High
            </div>
            <div style={{ position: 'absolute', left: '-121px', top: '50%', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              Impact of Implementation
            </div>
            <div style={{ position: 'absolute', left: '-28px', bottom: '5px', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              Low
            </div>
            <div style={{ position: 'absolute', left: '0', bottom: '-20px', fontWeight: 'bold', color: 'black', fontSize: '18px' }}>
              Very Easy
            </div>
            <div style={{ position: 'absolute', left: '40%', bottom: '-20px', fontWeight: 'bold', color: 'black', fontSize: '18px' }}>
              Ease of Implementation
            </div>
            <div style={{ position: 'absolute', right: '0', bottom: '-20px', fontWeight: 'bold', color: 'black', fontSize: '18px' }}>
              Very Difficult
            </div>
          </>
        );

      case 'Stakeholder Analysis Report':
        return (
          <>
            <div style={{ ...commonStyles, top: '50%', width: fixedWidth, height: '1px' }} />
            <div style={{ ...commonStyles, left: '50%', height: fixedHeight, width: '1px' }} />
            <div style={{ position: 'absolute', left: '-20px', top: '10px', fontWeight: 'bold', color: 'black', fontSize: '28px' }}>
              +
            </div>
            <div style={{ position: 'absolute', left: '-45px', top: '50%', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              Attitude
            </div>
            <div style={{ position: 'absolute', left: '-20px', bottom: '5px', fontWeight: 'bold', color: 'black', fontSize: '38px' }}>
              -
            </div>
            <div style={{ position: 'absolute', left: '20px', bottom: '-30px', fontWeight: 'bold', color: 'black', fontSize: '38px' }}>
              -
            </div>
            <div style={{ position: 'absolute', left: '30%', bottom: '-20px', fontSize: '18px' }}>
              <span style={{ fontWeight: 'bold' }}>Influence</span>
              <span> (Note: This is a political map of your key stakeholders.)</span>
            </div>
            <div style={{ position: 'absolute', right: '0', bottom: '-25px', fontWeight: 'bold', color: 'black', fontSize: '28px' }}>
              +
            </div>
          </>
        );

      default: // Brainstorming
        return (
          <>
            <div style={{ ...commonStyles, top: '50%', width: fixedWidth, height: '1px' }} />
            <div style={{ ...commonStyles, left: '50%', height: fixedHeight, width: '1px' }} />
            <div style={{ position: 'absolute', top: '25%', left: '20%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem
            </div>
            <div style={{ position: 'absolute', top: '25%', right: '21%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem
            </div>
            <div style={{ position: 'absolute', bottom: '25%', left: '17%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem Solution
            </div>
            <div style={{ position: 'absolute', bottom: '25%', right: '17%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem Solution
            </div>
          </>
        );
    }
  };

  const renderDraggableItems = () => {
    return draggables.map((item, index) => (
      <div
        key={index}
        style={{
          position: 'absolute',
          left: parseFloat(item.posX),
          top: parseFloat(item.posY),
          color: item.textColor,
          padding: '16px',
          userSelect: 'none',
          whiteSpace: 'pre-wrap',
          maxWidth: '350px'
        }}
      >
        {item.text}
      </div>
    ));
  };

  if (!reportId) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>No report ID provided</div>;
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading chart view...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
  }

  if (!report) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Report not found</div>;
  }

  return (
    <div style={{
      position: 'relative',
      width: fixedWidth + 80,
      height: fixedHeight + 80,
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'relative',
        margin: '20px',
        width: fixedWidth,
        height: fixedHeight,
        border: '1px solid black'
      }}>
        {renderStructure()}
        {renderDraggableItems()}
      </div>
    </div>
  );
};

export default ReportChartView;
