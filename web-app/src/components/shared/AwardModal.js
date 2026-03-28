import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import Lottie from 'lottie-react';
import awardAnimation from '../../assets/animation/award.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins } from '@fortawesome/free-solid-svg-icons';
import winningSound from '../../assets/sound/winning-218995.mp3';

// Global audio context to enable audio after user interaction
let globalAudioContext = null;
let hasUserInteracted = false;

// Initialize audio context on any user interaction
const enableAudioGlobally = () => {
  if (!hasUserInteracted) {
    hasUserInteracted = true;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext && !globalAudioContext) {
        globalAudioContext = new AudioContext();
        
        // Create a silent buffer and play it to unlock audio
        const buffer = globalAudioContext.createBuffer(1, 1, 22050);
        const source = globalAudioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(globalAudioContext.destination);
        source.start(0);
        
        console.log('Global audio context initialized');
        
        // Remove listeners after first interaction
        document.removeEventListener('click', enableAudioGlobally);
        document.removeEventListener('keydown', enableAudioGlobally);
        document.removeEventListener('touchstart', enableAudioGlobally);
      }
    } catch (error) {
      console.log('Could not initialize global audio context:', error);
    }
  }
};

// Add global listeners for audio context initialization
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('click', enableAudioGlobally);
  document.addEventListener('keydown', enableAudioGlobally);
  document.addEventListener('touchstart', enableAudioGlobally);
}

const AwardModal = ({ show, onHide, coins = 0 }) => {
  const audioRef = useRef(null);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [showClickHint, setShowClickHint] = useState(false);

  // Initialize audio context on first user interaction
  const initializeAudioContext = () => {
    if (!hasUserInteracted) {
      hasUserInteracted = true;
      
      // Create a small audio context to unlock audio
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext && !globalAudioContext) {
          globalAudioContext = new AudioContext();
          
          // Create a silent buffer and play it to unlock audio
          const buffer = globalAudioContext.createBuffer(1, 1, 22050);
          const source = globalAudioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(globalAudioContext.destination);
          source.start(0);
          
          console.log('Audio context initialized for future playback');
        }
      } catch (error) {
        console.log('Could not initialize audio context:', error);
      }
    }
  };

  // Enhanced audio play function
  const playAudio = async () => {
    if (audioRef.current && !audioPlayed) {
      try {
        const audio = audioRef.current;
        
        // Set volume and reset to start
        audio.volume = 0.7;
        audio.currentTime = 0;
        
        // Try to play
        await audio.play();
        setAudioPlayed(true);
        setShowClickHint(false);
        console.log('Award sound played successfully');
      } catch (error) {
        console.log('Audio autoplay prevented:', error.name);
        
        // Show click hint for user interaction
        if (error.name === 'NotAllowedError') {
          setShowClickHint(true);
          // Auto-hide hint after 3 seconds
          setTimeout(() => setShowClickHint(false), 3000);
        }
      }
    }
  };

  // Try to play audio when modal opens
  useEffect(() => {
    if (show) {
      setAudioPlayed(false);
      setShowClickHint(false);
      
      // Wait a bit for modal animation to complete, then try audio
      const timer = setTimeout(() => {
        playAudio();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Handle modal click to enable audio and/or play sound
  const handleModalClick = () => {
    // Initialize audio context on first click
    initializeAudioContext();
    
    // Play audio if it hasn't played yet
    if (!audioPlayed) {
      playAudio();
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={false}
      dialogClassName="award-modal"
      fullscreen
    >
      <Modal.Body 
        className="d-flex flex-column justify-content-center align-items-center p-0 m-0"
        onClick={handleModalClick}
        style={{ cursor: audioPlayed ? 'default' : 'pointer' }}
      >
        <audio
          ref={audioRef}
          preload="auto"
          style={{ display: 'none' }}
        >
          <source src={winningSound} type="audio/mpeg" />
        </audio>
        
        <div className="award-content text-center">
          <h4 className="mb-4 text-success display-4">Congratulations! 🎉</h4>
          <div className="lottie-container">
            <Lottie
              animationData={awardAnimation}
              loop={true}
              autoplay={true}
            />
          </div>
          <p className="mt-4 mb-3 lead">
            You've earned an award!
          </p>
          <div className="coins-earned">
            <FontAwesomeIcon icon={faCoins} className="text-warning me-2" />
            <span className="h3 mb-0">{coins} coins earned!</span>
          </div>
          {showClickHint && (
            <div className="audio-hint mt-3">
              <small className="text-light opacity-75 animate-pulse">
                🔊 Click anywhere to hear celebration sound
              </small>
            </div>
          )}
        </div>
      </Modal.Body>

      <style>{`
        .award-modal {
          margin: 0;
          padding: 0;
        }
        .award-modal .modal-content {
          background-color: rgba(0, 0, 0, 0.85);
          border: none;
          min-height: 100vh;
        }
        .award-content {
          color: white;
          padding: 2rem;
        }
        .lottie-container {
          width: 300px;
          height: 300px;
          margin: auto;
        }
        .coins-earned {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          display: inline-block;
        }
        @media (min-width: 768px) {
          .lottie-container {
            width: 400px;
            height: 400px;
          }
        }
        @media (min-width: 1200px) {
          .lottie-container {
            width: 500px;
            height: 500px;
          }
        }
      `}</style>
    </Modal>
  );
};

export default AwardModal; 