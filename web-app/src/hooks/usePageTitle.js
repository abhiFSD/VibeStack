import { useEffect } from 'react';

const usePageTitle = (upcomingCount, loading) => {
  useEffect(() => {
    const updateTitle = () => {
      if (loading) {
        document.title = 'Loading... | VibeStack™ Pro';
        return;
      }

      if (upcomingCount > 0) {
        document.title = `(${upcomingCount}) VibeStack™ Pro`;
      } else {
        document.title = 'VibeStack™ Pro';
      }
    };

    updateTitle();

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'VibeStack™ Pro';
    };
  }, [upcomingCount, loading]);
};

export default usePageTitle;