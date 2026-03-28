import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins } from '@fortawesome/free-solid-svg-icons';

const CoinAnimation = ({ show, coins = 0, targetRef }) => {
  const [coinElements, setCoinElements] = useState([]);
  const animationContainerRef = useRef(null);

  useEffect(() => {
    if (show && coins > 0 && targetRef?.current) {
      // Create coin elements
      const coinsToAnimate = Math.min(Math.max(3, coins), 10); // Min 3, max 10 coins
      const newCoinElements = [];
      
      // Get target position for animation end - targetRef.current is now a ref object itself
      const targetRefElement = targetRef.current.current;
      if (!targetRefElement) {
        console.warn("Target element for coin animation not found");
        return;
      }
      
      const targetRect = targetRefElement.getBoundingClientRect();
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;

      // Create coin elements with random starting positions
      for (let i = 0; i < coinsToAnimate; i++) {
        // Random starting positions in center area of screen
        const startX = window.innerWidth / 2 + (Math.random() * 200 - 100);
        const startY = window.innerHeight / 2 + (Math.random() * 200 - 100);
        
        // Random animation duration between 1.5 and 2.5 seconds
        const duration = 1.5 + Math.random();
        
        // Random delay between 0 and 0.5 seconds
        const delay = Math.random() * 0.5;
        
        newCoinElements.push({
          id: `coin-${i}`,
          startX,
          startY,
          targetX,
          targetY,
          duration,
          delay
        });
      }
      
      setCoinElements(newCoinElements);
      
      // Clear coins after animations complete
      const maxDuration = 3000; // Maximum animation time including delays
      const timerId = setTimeout(() => {
        setCoinElements([]);
      }, maxDuration);
      
      return () => clearTimeout(timerId);
    }
  }, [show, coins, targetRef]);

  if (!show || coins === 0 || !targetRef?.current?.current) {
    return null;
  }

  return (
    <div
      ref={animationContainerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      {coinElements.map((coin) => (
        <div
          key={coin.id}
          style={{
            position: 'absolute',
            left: coin.startX,
            top: coin.startY,
            animation: `moveCoin-${coin.id} ${coin.duration}s ease-in forwards`,
            animationDelay: `${coin.delay}s`,
            color: '#f4ce14',
            fontSize: '36px',
            filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.3))'
          }}
        >
          <FontAwesomeIcon icon={faCoins} spin />
          <style>
            {`
              @keyframes moveCoin-${coin.id} {
                0% {
                  transform: scale(0.7) rotate(0deg);
                  opacity: 0;
                }
                10% {
                  transform: scale(1.5) rotate(20deg);
                  opacity: 1;
                }
                100% {
                  transform: scale(0.6) rotate(360deg);
                  opacity: 0;
                  left: ${coin.targetX}px;
                  top: ${coin.targetY}px;
                }
              }
            `}
          </style>
        </div>
      ))}
    </div>
  );
};

export default CoinAnimation; 