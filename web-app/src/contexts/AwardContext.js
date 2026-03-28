import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AwardModal from '../components/shared/AwardModal';
import CoinAnimation from '../components/shared/CoinAnimation';
import { setAwardCallback } from '../utils/awards';

const AwardContext = createContext();

export const useAward = () => {
  const context = useContext(AwardContext);
  if (!context) {
    throw new Error('useAward must be used within an AwardProvider');
  }
  return context;
};

export const AwardProvider = ({ children }) => {
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [awardCoins, setAwardCoins] = useState(0);
  const coinTargetRef = useRef(null);

  // This function will be called when targeting the coins in the header
  const setCoinTarget = (ref) => {
    // Store the ref object itself, not its current value
    coinTargetRef.current = ref;
  };

  const showAward = (coins) => {
    setAwardCoins(coins);
    setShowAwardModal(true);
    
    // Schedule coin animation to start after the award modal is shown
    setTimeout(() => {
      // Award modal will stay visible during coin animation
      setShowCoinAnimation(true);
      
      // Hide coin animation after 3 seconds
      setTimeout(() => {
        setShowCoinAnimation(false);
        
        // Hide award modal after coin animation is done
        setTimeout(() => {
          setShowAwardModal(false);
        }, 500);
      }, 3000);
    }, 1500); // Start coin animation 1.5 seconds after award appears
  };

  const hideAward = () => {
    setShowAwardModal(false);
    setShowCoinAnimation(false);
  };

  useEffect(() => {
    setAwardCallback(showAward);
    return () => setAwardCallback(null);
  }, []);

  return (
    <AwardContext.Provider value={{ showAward, hideAward, setCoinTarget }}>
      {children}
      <AwardModal 
        show={showAwardModal} 
        onHide={hideAward}
        coins={awardCoins}
      />
      <CoinAnimation
        show={showCoinAnimation}
        coins={awardCoins}
        targetRef={coinTargetRef}
      />
    </AwardContext.Provider>
  );
}; 