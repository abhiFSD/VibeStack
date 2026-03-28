import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Nav, Container, NavDropdown, Button, Dropdown, Modal, Form, Image, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Auth, API } from 'aws-amplify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faChartArea, 
  faClipboardList, 
  faBookOpen,
  faUser,
  faPlayCircle,
  faTrophy,
  faBuilding,
  faPlus,
  faCog,
  faUserCircle,
  faStore,
  faBox,
  faCoins,
  faRobot,
  faUserShield,
  faRocket,
  faTableCellsLarge
} from '@fortawesome/free-solid-svg-icons';
import { faTrello as brandTrello } from '@fortawesome/free-brands-svg-icons';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useUser } from '../../contexts/UserContext';
import { useAdmin } from '../../contexts/AdminContext';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import * as subscriptions from '../../graphql/subscriptions';
import LFlogo from '../../assets/VibeStack_pro.png';
import AiIcon from '../../assets/Ai-icon.png';
import AwardNotification from '../shared/AwardNotification';
import { OrganizationSelector } from '../../components';
import { getUserCoins } from '../../utils/awardDefinitions';
import { clearAllAvatarCache } from '../../utils/userAvatarService';
import { useAward } from '../../contexts/AwardContext';
import MegaMenu from '../shared/MegaMenu';

const Navigation = ({ user }) => {
  const navigate = useNavigate();
  const { activeOrganization, updateActiveOrganization, fetchUserOrganizations } = useOrganization();
  const { avatarUrl, clearUserData } = useUser();
  const { setCoinTarget } = useAward();
  const { isSuperAdmin } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [aiTokens, setAiTokens] = useState(0);
  const [aiBalance, setAiBalance] = useState(0);
  const [hasAiChatAccess, setHasAiChatAccess] = useState(true); // Default to true
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [scrollPosition, setScrollPosition] = useState(100);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isAnimationPaused, setIsAnimationPaused] = useState(false);
  const [quoteStartTime, setQuoteStartTime] = useState(Date.now());
  const shuffledMessagesRef = useRef(null);
  const coinCounterRef = useRef(null);
  const megaMenuTimeoutRef = useRef(null);

  // Get display name using same pattern as Profile page
  const getDisplayName = () => {
    if (!user?.attributes) return 'User';
    
    const firstName = user.attributes['custom:first_name'] || '';
    const lastName = user.attributes['custom:last_name'] || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    return fullName || user.attributes.email || 'User';
  };

  // Function to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Pre-shuffled quotes arrays (shuffled once on component mount)
  const [shuffledFullQuotes] = useState(() => shuffleArray([
    "5S: Sort, Set in Order, Shine, Standardize, Sustain - Transform your workplace!",
    "A3 Project: One page, one vision, one solution - Structured problem-solving excellence!",
    "DMAIC: Define, Measure, Analyze, Improve, Control - Your roadmap to Six Sigma success!",
    "Gemba Walk: Go where the real work happens - Walk the Gemba, discover the truth!",
    "Kaizen: Small steps, big changes - Continuous improvement is the path to perfection!",
    "Leadership: Lead by example, inspire through action - Great leaders create great teams!",
    "Lean Assessment: Assess to progress - Know where you are to see where you're going!",
    "Mistake Proofing: Prevent errors before they happen - Build quality into every process!",
    "PDCA: Plan, Do, Check, Act - The cycle of continuous improvement never stops!",
    "Standard Work: Consistency breeds excellence - Standardize your way to success!",
    "Value Stream Mapping: Map your value, eliminate waste - See the flow, improve the process!",
    "Waste Walk: Every step counts - Walk to identify waste, run towards efficiency!",
    "5 Whys: Why? Why? Why? Why? Why? - Dig deep to find the root cause!",
    "Brainstorming: Great minds think together - Unleash creativity, capture innovation!",
    "Fishbone Diagram: Every problem has a cause - Map it out, solve it systematically!",
    "Histogram: Data tells the story - Visualize patterns, understand variation!",
    "Impact Map: Visualize impact, maximize value - See the big picture, act strategically!",
    "Pareto Chart: 80/20 rule in action - Focus on the vital few that make the difference!",
    "Run Chart: Track trends over time - See the pattern, predict the future!",
    "Scatter Plot: Relationships revealed - Discover correlations, drive decisions!",
    "Stakeholder Analysis: Know your stakeholders, win their hearts - Engagement drives success!",
    "Excellence is not a destination, it's a continuous journey!",
    "Lean thinking, lean doing, lean succeeding!"
  ]));

  const [shuffledMediumQuotes] = useState(() => shuffleArray([
    "5S: Sort, Set in Order, Shine, Standardize, Sustain",
    "A3 Project: One page, one vision, one solution",
    "DMAIC: Define, Measure, Analyze, Improve, Control",
    "Gemba Walk: Go where the real work happens",
    "Kaizen: Small steps, big changes",
    "Leadership: Lead by example, inspire through action",
    "Lean Assessment: Assess to progress",
    "Mistake Proofing: Prevent errors before they happen",
    "PDCA: Plan, Do, Check, Act",
    "Standard Work: Consistency breeds excellence",
    "Value Stream Mapping: Map your value, eliminate waste",
    "Waste Walk: Every step counts",
    "5 Whys: Dig deep to find the root cause",
    "Brainstorming: Great minds think together",
    "Fishbone Diagram: Every problem has a cause",
    "Histogram: Data tells the story",
    "Impact Map: Visualize impact, maximize value",
    "Pareto Chart: Focus on the vital few",
    "Run Chart: Track trends over time",
    "Scatter Plot: Relationships revealed",
    "Stakeholder Analysis: Know your stakeholders",
    "Excellence is a continuous journey",
    "Lean thinking, lean succeeding"
  ]));

  const [shuffledShortQuotes] = useState(() => shuffleArray([
    "5S: Organize & Sustain",
    "A3: Structured Problem Solving",
    "DMAIC: Six Sigma Method",
    "Gemba: Go & See",
    "Kaizen: Continuous Improvement",
    "Leadership: Inspire Action",
    "Lean Assessment: Know Progress",
    "Mistake Proofing: Prevent Errors",
    "PDCA: Plan Do Check Act",
    "Standard Work: Consistency",
    "VSM: Map Value Flow",
    "Waste Walk: Find Waste",
    "5 Whys: Root Cause Analysis",
    "Brainstorming: Capture Ideas",
    "Fishbone: Cause & Effect",
    "Histogram: Show Patterns",
    "Impact Map: Strategic Vision",
    "Pareto: 80/20 Rule",
    "Run Chart: Trend Analysis",
    "Scatter Plot: Find Relationships",
    "Stakeholder: Engage Success",
    "Excellence: Continuous Journey",
    "Lean: Think & Succeed"
  ]));

  // Function to get current quote based on index and screen size
  const getCurrentQuote = () => {
    // Get appropriate quote array based on screen size
    let quoteArray;
    if (windowWidth >= 1400) {
      quoteArray = shuffledFullQuotes;
    } else if (windowWidth >= 1100) {
      quoteArray = shuffledMediumQuotes;
    } else {
      quoteArray = shuffledShortQuotes;
    }
    
    // For first quote, show welcome message
    if (currentQuoteIndex === 0) {
      return `Welcome back, ${getDisplayName()}!`;
    }
    
    // For subsequent quotes, get from shuffled array
    const quoteIndexInArray = (currentQuoteIndex - 1) % quoteArray.length;
    return quoteArray[quoteIndexInArray];
  };

  // Quote rotation every 30 seconds
  useEffect(() => {
    const rotateQuote = () => {
      setCurrentQuoteIndex(prev => prev + 1);
      setScrollPosition(100); // Reset position for new quote
      setQuoteStartTime(Date.now());
    };

    const interval = setInterval(rotateQuote, 30000); // 30 seconds per quote
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let coinSubscription;
    
    const setupSubscription = async () => {
      if (!activeOrganization?.id || !user?.attributes?.sub) return;
      
      try {
        // Fetch initial coins and AI balance
        await fetchUserCoins();
        await fetchAiBalance();
        
        // Subscribe to user coins updates
        coinSubscription = API.graphql({
          query: subscriptions.onUpdateUserCoins,
          variables: {
            filter: {
              user_sub: { eq: user.attributes.sub },
              organizationID: { eq: activeOrganization.id }
            }
          }
        }).subscribe({
          next: (data) => {
            const coins = data.value.data.onUpdateUserCoins.total_coins;
            setUserCoins(coins);
          },
          error: error => console.error('Error in coins subscription:', error)
        });
      } catch (error) {
        console.error('Error setting up coins subscription:', error);
      }
    };
    
    setupSubscription();
    
    // Cleanup subscription when component unmounts or dependencies change
    return () => {
      if (coinSubscription) {
        try {
          coinSubscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from coins updates:', error);
        }
      }
    };
  }, [activeOrganization?.id, user?.attributes?.sub]);

  useEffect(() => {
    // Provide the coin counter ref to the award context
    setCoinTarget(coinCounterRef);
  }, [setCoinTarget]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (megaMenuTimeoutRef.current) {
        clearTimeout(megaMenuTimeoutRef.current);
      }
    };
  }, []);

  // Window resize listener for responsive text
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation for current quote - Faster speed
  useEffect(() => {
    const animateText = () => {
      if (!isAnimationPaused) {
        setScrollPosition(prev => {
          // Reset if quote just changed
          if (prev <= -100) {
            return 100;
          }
          return prev - 0.3; // Faster movement step
        });
      }
    };

    const interval = setInterval(animateText, 30); // Faster interval
    return () => clearInterval(interval);
  }, [isAnimationPaused]);

  const fetchUserCoins = async () => {
    if (!activeOrganization?.id || !user?.attributes?.sub) return;
    try {
      const coins = await getUserCoins(user.attributes.sub, activeOrganization.id);
      setUserCoins(coins);
    } catch (error) {
      console.error('Error fetching user coins:', error);
    }
  };

  const fetchAiBalance = async () => {
    if (!activeOrganization?.id) return;
    try {
      const API_BASE_URL = process.env.REACT_APP_CHAT_API_URL || 'https://54.188.183.157/api';
      const API_KEY = process.env.REACT_APP_CHAT_API_KEY || 'test-api-key-123';
      
      const response = await fetch(`${API_BASE_URL}/organizations/${activeOrganization.id}`, {
        headers: {
          'X-API-Key': API_KEY
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const balance = data.organization?.available_balance || 0;
        setAiBalance(balance);
        // Convert USD to tokens using same formula as AI Settings (1 USD = 49,999 tokens)
        const tokens = Math.floor(balance * 49999);
        setAiTokens(tokens);
      }
    } catch (error) {
      console.error('Error fetching AI balance:', error);
    }
  };

  // Check user's AI chat permission
  const checkAiChatPermission = async () => {
    if (!activeOrganization?.id || !user?.attributes?.sub) return;
    
    
    try {
      // Get user's organization member data
      const memberResponse = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            organizationID: { eq: activeOrganization.id },
            userSub: { eq: user.attributes.sub }
          }
        }
      });

      const memberData = memberResponse.data.listOrganizationMembers.items.find(
        m => !m._deleted && m.status === 'ACTIVE'
      );

      if (!memberData) {
        setHasAiChatAccess(false);
        return;
      }

      // Check if user is owner or co-owner (they always have access)
      const isOwner = activeOrganization.owner === user.attributes.sub;
      const isCoOwner = activeOrganization.additionalOwners?.includes(user.attributes.email);
      
      if (isOwner || isCoOwner) {
        setHasAiChatAccess(true);
      } else {
        // For regular members, check if they are in the aiDisabledUsers list
        const aiDisabledUsers = activeOrganization.aiDisabledUsers || [];
        setHasAiChatAccess(!aiDisabledUsers.includes(user.attributes.sub));
      }
    } catch (error) {
      console.error('Error checking AI chat permission:', error);
      setHasAiChatAccess(true); // Default to true on error
    }
  };

  // Check AI permission when organization changes
  useEffect(() => {
    checkAiChatPermission();
  }, [activeOrganization?.id, user?.attributes?.sub]);

  const handleSignOut = async () => {
    try {
      // Clear all avatar caches
      clearAllAvatarCache();
      
      // Clear local storage items
      localStorage.removeItem('activeOrganization');
      localStorage.removeItem('lastVisitedPath');
      
      // Clear any session storage items
      sessionStorage.clear();
      
      // Clear any report-specific storage and Amplify-related cache
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('isHorizontal_') || 
            key.startsWith('report_') ||
            key.startsWith('amplify') ||
            key.startsWith('aws') ||
            key.startsWith('CognitoIdentityServiceProvider') ||
            key.includes('user') ||
            key.includes('auth')) {
          console.log('🧹 Clearing storage key:', key);
          localStorage.removeItem(key);
        }
      }

      // Clear user context data
      clearUserData();
      
      // Clear any GraphQL/Apollo cache if it exists
      if (window.__APOLLO_CLIENT__) {
        console.log('🧹 Clearing Apollo cache...');
        window.__APOLLO_CLIENT__.clearStore();
      }
      
      // Sign out from Auth
      await Auth.signOut({ global: true });
      
      // Clear browser cache for the domain
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (error) {
          console.error('Error clearing browser cache:', error);
        }
      }
      
      // Force reload the page to ensure clean state
      window.location.reload(true);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const hasManagementAccess = (organization) => {
    if (!organization || !user?.attributes?.sub || !user?.attributes?.email) return false;
    return (
      organization.owner === user.attributes.sub || 
      (Array.isArray(organization.additionalOwners) && organization.additionalOwners.includes(user.attributes.email))
    );
  };

  const handleMegaMenuEnter = () => {
    // Clear any pending timeouts
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    
    setShowMegaMenu(true);
  };

  const handleMegaMenuLeave = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setShowMegaMenu(false);
    }, 100); // Small delay for better UX
  };

  const handleNavHover = () => {
    // Clear any pending timeouts
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    
    setShowMegaMenu(true);
  };

  const handleNavLeave = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setShowMegaMenu(false);
    }, 100); // Small delay for better UX
  };

  const handleMenuItemClick = () => {
    setShowMegaMenu(false);
  };

  return (
    <>
      <div className="navbar-with-mega-menu">
        <Navbar 
          expand="lg" 
          fixed="top" 
          className="modern-navbar py-2"
          bg="none"
        >
          <Container fluid className="px-4">
            <Navbar.Brand as={Link} to="/" className="py-0 d-flex align-items-center">
              <img
                src={LFlogo}
                alt="VibeStack-PRO"
                height="35"
                className="d-inline-block align-top me-2"
              />
              <span className="brand-text text-white">VibeStack™ Pro</span>
            </Navbar.Brand>
            
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              {/* Organization Selector */}
              <Nav className="me-2">
                <OrganizationSelector />
              </Nav>

              {/* Main Navigation - Hover Menu Trigger with Animation */}
              <Nav className="me-auto main-nav">
                <div 
                  className="nav-menu-trigger animated-menu-button"
                  onMouseEnter={handleNavHover}
                  onMouseLeave={handleNavLeave}
                >
                  <div className="menu-aura"></div>
                  <div className="menu-glow"></div>
                  <span className="nav-menu-text">
                    <FontAwesomeIcon icon={faTableCellsLarge} className="me-2 menu-icon-pulse" />
                    Menu
                  </span>
                  <div className="menu-ripple"></div>
                </div>
              </Nav>

              {/* Moving Motivational Text */}
              <div className="flex-grow-1 d-flex align-items-center justify-content-center overflow-hidden" style={{minWidth: '0', flex: '1 1 auto'}}>
                <div 
                  style={{
                    width: '100%',
                    overflow: 'hidden',
                    height: '30px',
                    position: 'relative',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setIsAnimationPaused(true)}
                  onMouseLeave={() => setIsAnimationPaused(false)}
                >
                  <div
                    style={{
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      opacity: 0.8,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                      whiteSpace: 'nowrap',
                      position: 'absolute',
                      top: '50%',
                      left: `${scrollPosition}%`,
                      transform: 'translateY(-50%)',
                      transition: 'none'
                    }}
                  >
                    {getCurrentQuote()}
                  </div>
                </div>
              </div>

              {/* Right Side Navigation */}
              <Nav className="ms-auto d-flex align-items-center">
                {/* User Tokens/Coins - Clickable to Shop */}
                <OverlayTrigger
                  placement="bottom"
                  overlay={<Tooltip>Click to visit the shop</Tooltip>}
                >
                  <Link to="/shop" className="d-flex align-items-center me-2 text-decoration-none">
                    <div 
                      ref={coinCounterRef}
                      className="user-tokens d-flex align-items-center py-1 px-3 rounded"
                    >
                      <FontAwesomeIcon icon={faCoins} className="text-warning me-2" size="lg" />
                      <span className="text-white fw-semibold">{userCoins}</span>
                    </div>
                  </Link>
                </OverlayTrigger>
                
                {/* LF Mentor - Only visible for organization admins/owners */}
                {(() => {
                  // Check if user is organization admin
                  const isOwner = activeOrganization?.owner === user?.attributes?.sub;
                  const isCoOwner = activeOrganization?.additionalOwners?.includes(user?.attributes?.email);
                  const isOrgAdmin = isOwner || isCoOwner;
                  
                  // Only show for organization admins
                  if (!isOrgAdmin) return null;
                  
                  return (
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip>
                          Tokens: {aiTokens} | Balance: ${aiBalance.toFixed(2)} | LF Mentor
                        </Tooltip>
                      }
                    >
                      <Link to="/chatbot" className="d-flex align-items-center me-2 text-decoration-none">
                        <div className="user-tokens d-flex align-items-center py-1 px-3 rounded">
                          <img src={AiIcon} alt="LF Mentor" style={{width: '20px', height: '20px'}} />
                          <span className="text-white fw-semibold ms-2">${aiBalance.toFixed(2)}</span>
                        </div>
                      </Link>
                    </OverlayTrigger>
                  );
                })()}
                
                {/* Award Notification with improved styling */}
                <div className="me-3">
                  <AwardNotification hideCoinsDisplay={true} />
                </div>

                {/* User Menu */}
                <NavDropdown
                  title={
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>{user.attributes.email}</Tooltip>}
                    >
                      <div className="d-inline-block user-menu">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            roundedCircle
                            width={35}
                            height={35}
                            className="me-2"
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUserCircle} className="me-2 user-icon" />
                        )}
                      </div>
                    </OverlayTrigger>
                  }
                  id="user-dropdown"
                  className="modern-dropdown"
                  drop="start"
                >
                  <NavDropdown.Item as={Link} to="/profile" className="dropdown-item-modern">
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/awards" className="dropdown-item-modern">
                    <FontAwesomeIcon icon={faTrophy} className="me-2" />
                    Awards
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/shop" className="dropdown-item-modern">
                    <FontAwesomeIcon icon={faStore} className="me-2" />
                    Shop
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/inventory" className="dropdown-item-modern">
                    <FontAwesomeIcon icon={faBox} className="me-2" />
                    My Inventory
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/tools" className="dropdown-item-modern">
                    <FontAwesomeIcon icon={faPlayCircle} className="me-2" />
                    Tools
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  {isSuperAdmin && (
                    <NavDropdown.Item as={Link} to="/super-admin" className="dropdown-item-modern text-primary">
                      <FontAwesomeIcon icon={faUserShield} className="me-2" />
                      Super Admin Console
                    </NavDropdown.Item>
                  )}
                  {activeOrganization && hasManagementAccess(activeOrganization) && (
                    <NavDropdown.Item as={Link} to="/organization-management" className="dropdown-item-modern">
                      <FontAwesomeIcon icon={faCog} className="me-2" />
                      Manage Organization
                    </NavDropdown.Item>
                  )}
                  {activeOrganization && hasManagementAccess(activeOrganization) && (
                    <NavDropdown.Item as={Link} to="/learning-analytics" className="dropdown-item-modern">
                      <FontAwesomeIcon icon={faChartArea} className="me-2" />
                      Learning Analytics
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Item onClick={handleSignOut} className="dropdown-item-modern text-danger">
                    Sign Out
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Mega Menu */}
        <MegaMenu
          isVisible={showMegaMenu}
          onMouseEnter={handleMegaMenuEnter}
          onMouseLeave={handleMegaMenuLeave}
          onMenuItemClick={handleMenuItemClick}
          hasAiChatAccess={hasAiChatAccess}
          user={user}
          activeOrganization={activeOrganization}
          hasManagementAccess={hasManagementAccess}
          isSuperAdmin={isSuperAdmin}
        />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --primary-color: #00897b;
            --primary-light: #4ebaaa;
            --primary-dark: #005b4f;
            --secondary-color: #00695c;
          }

          .modern-navbar {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            border-bottom: none;
          }

          .brand-text {
            font-weight: 600;
            font-size: 1.3rem;
          }

          .nav-menu-trigger {
            padding: 0.5rem 1rem;
            margin: 0 0.25rem;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            user-select: none;
            position: relative;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
          }

          .nav-menu-trigger:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px) scale(1.05);
            border-color: rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 137, 123, 0.3);
          }

          .menu-aura {
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 14px;
            background: linear-gradient(45deg, #00897b, #4ebaaa, #00695c, #26a69a);
            background-size: 300% 300%;
            animation: auraFlow 3s ease-in-out infinite;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: -1;
          }

          .nav-menu-trigger:hover .menu-aura {
            opacity: 0.7;
          }

          .menu-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.3s ease;
            pointer-events: none;
            z-index: -1;
          }

          .nav-menu-trigger:hover .menu-glow {
            width: 100px;
            height: 100px;
            opacity: 0.3;
          }

          .menu-ripple {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: none;
            pointer-events: none;
          }

          .nav-menu-trigger:active .menu-ripple {
            animation: ripple 0.6s ease-out;
          }

          @keyframes auraFlow {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          @keyframes ripple {
            0% {
              width: 0;
              height: 0;
              opacity: 1;
            }
            100% {
              width: 200px;
              height: 200px;
              opacity: 0;
            }
          }

          .menu-icon-pulse {
            animation: iconPulse 2s ease-in-out infinite;
          }

          @keyframes iconPulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
          }

          .nav-menu-text {
            color: white;
            font-weight: 600;
            display: flex;
            align-items: center;
            position: relative;
            z-index: 1;
            transition: all 0.3s ease;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }

          .nav-menu-trigger:hover .nav-menu-text {
            color: white;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transform: translateY(-1px);
          }

          .user-menu {
            display: flex;
            align-items: center;
            padding: 0.25rem;
            border-radius: 8px;
            transition: all 0.2s ease;
          }

          .user-icon {
            font-size: 1.5rem;
            color: white;
          }

          .user-email {
            font-weight: 500;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /* Style for the organization selector dropdown */
          :global(.organization-selector .dropdown-toggle) {
            background: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            color: white !important;
            border-radius: 8px !important;
          }

          :global(.organization-selector .dropdown-toggle:hover) {
            background: rgba(255, 255, 255, 0.2) !important;
          }

          .modern-dropdown .dropdown-item-modern {
            padding: 0.75rem 1.25rem;
            color: var(--text-primary);
            transition: all 0.2s ease;
          }

          .modern-dropdown .dropdown-item-modern:hover {
            background: rgba(0, 137, 123, 0.1);
            color: var(--primary-color);
            transform: translateX(5px);
          }

          .modern-dropdown .dropdown-menu {
            border: none;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 0.5rem;
          }

          .user-menu:hover {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 8px;
          }

          @media (max-width: 991.98px) {
            .main-nav {
              margin-top: 1rem;
            }

            .user-menu {
              margin-top: 1rem;
            }
          }

          .user-tokens {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.2s ease;
            cursor: pointer;
            border-radius: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .user-tokens:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }

          /* Navbar with Mega Menu Container */
          .navbar-with-mega-menu {
            position: relative;
            margin-bottom: 10px;
          }

          /* Mega Menu Styles */
          .mega-menu {
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background: white;
            border-radius: 0 0 16px 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
            border-top: 3px solid var(--primary-color);
          }

          .mega-menu.visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }

          .mega-menu-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
          }

          .mega-menu-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            padding: 24px 0;
          }

          .menu-section {
            min-width: 0;
          }

          .section-title {
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(0, 137, 123, 0.15);
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .menu-items {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .menu-item-wrapper {
            position: relative;
          }

          .menu-item {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            border-radius: 8px;
            text-decoration: none;
            color: #333;
            transition: all 0.2s ease;
            border: 1px solid transparent;
            background: rgba(0, 137, 123, 0.03);
            position: relative;
            overflow: hidden;
          }

          .menu-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transition: left 0.5s;
          }

          .menu-item:hover::before {
            left: 100%;
          }

          .menu-item:hover {
            background: rgba(0, 137, 123, 0.08);
            transform: translateX(8px);
            border-color: rgba(0, 137, 123, 0.2);
            box-shadow: 0 4px 16px rgba(0, 137, 123, 0.15);
          }

          .menu-item.active {
            background: rgba(0, 137, 123, 0.1);
            border-color: var(--primary-color);
            color: var(--primary-color);
          }

          .menu-item.highlight {
            background: rgba(0, 123, 255, 0.08);
            border-color: rgba(0, 123, 255, 0.2);
          }

          .menu-item.highlight:hover {
            background: rgba(0, 123, 255, 0.12);
            border-color: rgba(0, 123, 255, 0.3);
          }

          .menu-item-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: rgba(0, 137, 123, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            color: var(--primary-color);
            margin-right: 12px;
            transition: all 0.2s ease;
            flex-shrink: 0;
          }

          .menu-item:hover .menu-item-icon {
            background: var(--primary-color);
            color: white;
            transform: scale(1.1);
          }

          .menu-item.active .menu-item-icon {
            background: var(--primary-color);
            color: white;
          }

          .menu-item.highlight .menu-item-icon {
            background: rgba(0, 123, 255, 0.1);
            color: #007bff;
          }

          .menu-item.highlight:hover .menu-item-icon {
            background: #007bff;
            color: white;
          }

          .ai-icon {
            /* Original purple color preserved */
          }

          .menu-item:hover .ai-icon {
            /* Original purple color preserved on hover */
          }

          .menu-item-content {
            flex: 1;
            min-width: 0;
          }

          .menu-item-label {
            font-size: 0.9rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 2px;
            line-height: 1.2;
          }

          .menu-item-description {
            font-size: 0.75rem;
            color: #777;
            line-height: 1.3;
            opacity: 0.9;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }

          .menu-item:hover .menu-item-label {
            color: var(--primary-color);
          }

          .menu-item.active .menu-item-label {
            color: var(--primary-color);
          }

          .menu-item.highlight:hover .menu-item-label {
            color: #007bff;
          }

          .menu-item-arrow {
            opacity: 0;
            color: var(--primary-color);
            font-size: 0.875rem;
            transition: all 0.2s ease;
            margin-left: 12px;
          }

          .menu-item:hover .menu-item-arrow {
            opacity: 1;
            transform: translateX(4px);
          }

          .menu-item.highlight:hover .menu-item-arrow {
            color: #007bff;
          }

          /* Footer Section Styles */
          .footer-section {
            grid-column: 1 / -1;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 2px solid rgba(0, 137, 123, 0.1);
          }

          .footer-title {
            text-align: center;
            font-size: 1rem;
            font-weight: 800;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 16px;
            position: relative;
          }

          .footer-title::after {
            content: '✨';
            position: absolute;
            right: -25px;
            top: 0;
            font-size: 0.8rem;
            animation: sparkle 2s ease-in-out infinite;
          }

          @keyframes sparkle {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }

          .footer-items {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            justify-items: center;
          }

          .highlight-footer {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)) !important;
            color: white !important;
            border: none !important;
            box-shadow: 0 4px 15px rgba(0, 137, 123, 0.3);
            transform: translateY(-2px);
            position: relative;
            overflow: hidden;
          }

          .highlight-footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.6s;
          }

          .highlight-footer:hover::before {
            left: 100%;
          }

          .highlight-footer:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 8px 25px rgba(0, 137, 123, 0.4);
          }

          .highlight-footer .menu-item-icon {
            background: rgba(255, 255, 255, 0.2) !important;
            color: white !important;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .highlight-footer:hover .menu-item-icon {
            background: rgba(255, 255, 255, 0.3) !important;
            transform: scale(1.1) rotate(5deg);
          }

          .highlight-footer .menu-item-label {
            color: white !important;
            font-weight: 700;
          }

          .highlight-footer .menu-item-description {
            color: rgba(255, 255, 255, 0.9) !important;
            opacity: 1;
          }

          .highlight-footer .menu-item-arrow {
            color: white !important;
            opacity: 1;
          }

          /* Responsive design for mega menu */
          @media (max-width: 768px) {
            .mega-menu-content {
              grid-template-columns: 1fr;
              gap: 18px;
              padding: 20px 0;
            }

            .menu-item {
              padding: 8px 12px;
            }

            .menu-item-icon {
              width: 32px;
              height: 32px;
              margin-right: 10px;
            }

            .footer-items {
              grid-template-columns: 1fr;
              gap: 8px;
            }
          }

          @media (max-width: 480px) {
            .mega-menu-container {
              padding: 0 12px;
            }
            
            .menu-item {
              padding: 6px 10px;
            }

            .menu-item-icon {
              width: 28px;
              height: 28px;
            }

            .footer-section {
              margin-top: 12px;
              padding-top: 12px;
            }

            .footer-title::after {
              right: -20px;
              font-size: 0.7rem;
            }
          }

          /* Submenu Styles */
          .submenu-container {
            position: absolute;
            left: 100%;
            top: 0;
            width: 280px;
            background: white;
            border: 1px solid rgba(0, 137, 123, 0.1);
            border-radius: 8px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
            z-index: 1001;
            margin-left: 6px;
          }

          .submenu {
            padding: 12px;
          }

          .submenu-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(0, 137, 123, 0.1);
          }

          .submenu-header span {
            font-weight: 600;
            color: var(--primary-color);
            font-size: 0.8rem;
          }

          .view-all-link {
            color: var(--primary-color);
            text-decoration: none;
            font-size: 0.8rem;
            font-weight: 500;
            transition: all 0.2s ease;
          }

          .view-all-link:hover {
            color: var(--primary-dark);
            text-decoration: none;
          }

          .submenu-items {
            max-height: 250px;
            overflow-y: auto;
          }

          .submenu-item {
            display: block;
            padding: 6px 8px;
            border-radius: 6px;
            text-decoration: none;
            color: #333;
            transition: all 0.2s ease;
            margin-bottom: 2px;
          }

          .submenu-item:hover {
            background: rgba(0, 137, 123, 0.05);
            color: var(--primary-color);
            text-decoration: none;
            transform: translateX(3px);
          }

          .submenu-item-content {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .submenu-item-name {
            font-weight: 500;
            font-size: 0.8rem;
            line-height: 1.1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .submenu-item-meta {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .status-badge, .completion-badge {
            font-size: 0.65rem;
            padding: 1px 4px;
            border-radius: 3px;
            font-weight: 500;
          }

          .status-badge.active {
            background: rgba(40, 167, 69, 0.1);
            color: #28a745;
          }

          .status-badge.completed {
            background: rgba(0, 123, 255, 0.1);
            color: #007bff;
          }

          .status-badge.on_hold {
            background: rgba(255, 193, 7, 0.1);
            color: #ffc107;
          }

          .status-badge.to_do {
            background: rgba(40, 167, 69, 0.1);
            color: #28a745;
          }

          .status-badge.in_progress {
            background: rgba(255, 152, 0, 0.1);
            color: #ff9800;
          }

          .status-badge.in_review {
            background: rgba(33, 150, 243, 0.1);
            color: #2196f3;
          }

          .status-badge.done {
            background: rgba(76, 175, 80, 0.1);
            color: #4caf50;
          }

          .completion-badge.completed {
            background: rgba(40, 167, 69, 0.1);
            color: #28a745;
          }

          .completion-badge.pending {
            background: rgba(255, 193, 7, 0.1);
            color: #ffc107;
          }

          .action-item-meta {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .due-date {
            font-size: 0.6rem;
            color: #666;
            display: flex;
            align-items: center;
          }

          .due-date.upcoming {
            color: var(--primary-color);
            font-weight: 500;
          }

          .submenu-loading, .submenu-empty {
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9rem;
          }

          .submenu-loading {
            color: var(--primary-color);
          }

          /* Responsive submenu adjustments */
          @media (max-width: 768px) {
            .submenu-container {
              position: fixed;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 90vw;
              max-width: 400px;
              margin-left: 0;
            }
          }
        `
      }} />
    </>
  );
};

export default Navigation; 