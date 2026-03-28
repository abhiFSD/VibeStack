import React, { useState, useEffect } from 'react';
import ToolContext from './ToolContext';
import toolsData from '../json/tools.json';

export const ToolContextProvider = ({ children }) => {
  const [tools, setTools] = useState([]);
  const [TOOL_ID, setTOOL_ID] = useState('0');

  useEffect(() => {
    // Load tools from the JSON file
    setTools(toolsData);
  }, []);

  const value = {
    tools,
    TOOL_ID,
    setTOOL_ID
  };

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  );
}; 