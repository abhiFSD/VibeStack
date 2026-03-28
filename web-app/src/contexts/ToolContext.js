import React from 'react';

const ToolContext = React.createContext();

export default ToolContext;

export const useToolContext = () => {
  const context = React.useContext(ToolContext);
  if (!context) {
    throw new Error('useToolContext must be used within a ToolContextProvider');
  }
  return context;
}; 