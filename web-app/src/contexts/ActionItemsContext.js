import React, { createContext, useContext } from 'react';
import useUpcomingActionItems from '../hooks/useUpcomingActionItems';

const ActionItemsContext = createContext();

export const ActionItemsProvider = ({ children }) => {
  const { upcomingCount, loading, refreshCount } = useUpcomingActionItems();

  const value = {
    upcomingCount,
    loading,
    refreshCount
  };

  return (
    <ActionItemsContext.Provider value={value}>
      {children}
    </ActionItemsContext.Provider>
  );
};

export const useActionItems = () => {
  const context = useContext(ActionItemsContext);
  if (!context) {
    // Return default values if context is not available
    return {
      upcomingCount: 0,
      loading: false,
      refreshCount: () => {}
    };
  }
  return context;
};

export default ActionItemsContext;