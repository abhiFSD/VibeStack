import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Carousel, Tabs, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faClipboardCheck, 
  faProjectDiagram, 
  faGraduationCap, 
  faHandshake, 
  faChartPie, 
  faUsers, 
  faAward,
  faArrowRight,
  faCheck,
  faLightbulb,
  faStar,
  faSitemap,
  faChartBar,
  faCheckSquare,
  faListOl,
  faChartArea,
  faSearch,
  faLayerGroup,
  faGamepad,
  faTrophy,
  faCoins,
  faRobot,
  faDatabase,
  faBrain,
  faRocket,
  faBug,
  faBook,
  faTools,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import LFlogo from '../assets/VibeStack_pro.png';
import '../styles/LandingPage.css';
import { FaFileAlt, FaBuilding, FaRegStar, FaPlus } from 'react-icons/fa';
import { MdDashboard, MdInsights, MdPeopleAlt, MdCalculate, MdOutlineCategory } from 'react-icons/md';
import { Auth } from 'aws-amplify';
import DynamicFITT from './shared/DynamicFITT';
import toolsData from '../json/tools.json';
import iconMappings from '../utils/iconMappings';

const LandingPage = () => {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const [userName, setUserName] = useState('');
  const [isVisible, setIsVisible] = useState({
    features: false,
    benefits: false,
    testimonials: false,
    industries: false,
    tools: false
  });

  const [showAllTools, setShowAllTools] = useState(false);

  // Animated number counter for statistics
  const [stats, setStats] = useState({
    companies: 0,
    projects: 0,
    improvement: 0,
    countries: 0
  });

  // Mock testimonials data
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Operations Director",
      company: "Global Manufacturing Inc.",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      quote: "VibeStack™ Pro transformed how we manage our continuous improvement projects. We've seen a 34% reduction in lead times across our production lines."
    },
    {
      name: "Michael Chen",
      role: "Process Excellence Manager",
      company: "Healthcare Solutions",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      quote: "The value stream mapping tools and KPI dashboards have provided unprecedented visibility into our operations. Our team is now aligned and focused on what truly matters."
    },
    {
      name: "Elena Rodriguez",
      role: "Lean Six Sigma Black Belt",
      company: "Logistics Express",
      image: "https://randomuser.me/api/portraits/women/45.jpg",
      quote: "As someone who leads multiple improvement projects simultaneously, the action item tracking and collaboration features have been game-changing for our team."
    }
  ];


  // Get tools from JSON data and categorize them
  const leanTools = toolsData.filter(tool => tool.type === 'Lean Tools' && tool.id !== 0);
  const qualityTools = toolsData.filter(tool => tool.type === 'Quality');
  
  // Add descriptions to tools
  const enhancedLeanTools = leanTools.map(tool => ({
    ...tool,
    category: 'Lean Tools',
    description: getToolDescription(tool.name)
  }));
  
  const enhancedQualityTools = qualityTools.map(tool => ({
    ...tool,
    category: 'Quality',
    description: getToolDescription(tool.name)
  }));

  function getToolDescription(toolName) {
    const descriptions = {
      '5S': 'Organize your workspace for efficiency and effectiveness through Sort, Set in Order, Shine, Standardize, and Sustain',
      'A3 Project': 'Structured problem-solving and project documentation methodology on a single A3-sized sheet',
      'DMAIC': 'Define, Measure, Analyze, Improve, Control methodology for systematic process improvement',
      'Gemba Walk': 'Go to where the work happens to observe processes and identify improvement opportunities',
      'Kaizen Project': 'Continuous improvement projects focused on eliminating waste and optimizing processes',
      'Leadership': 'Evaluate and develop leadership capabilities for organizational transformation and engagement',
      'Lean Assessment': 'Comprehensive evaluation of your organization\'s lean maturity and implementation gaps',
      'Mistake Proofing': 'Prevent errors and defects through systematic error-proofing techniques and design',
      'PDCA': 'Plan-Do-Check-Act methodology for structured problem solving and continuous improvement',
      'Standard Work': 'Document and standardize best practices to ensure consistent, efficient operations',
      'Value Stream Mapping': 'Map your processes to identify waste, bottlenecks, and optimization opportunities',
      'Waste Walk': 'Systematic observation to identify and eliminate the 8 types of waste in your processes',
      '5 Whys': 'Root cause analysis technique using five successive "why" questions to reach the true cause',
      'Brainstorming': 'Generate creative solutions and innovative ideas through structured team collaboration',
      'Fishbone Diagram': 'Cause and effect analysis to systematically identify potential sources of problems',
      'Histogram': 'Visualize data distribution to understand process variation, patterns, and capability',
      'Impact Map': 'Strategic planning tool to align improvement activities with business objectives and outcomes',
      'Pareto Chart': '80/20 analysis to prioritize improvement efforts on the vital few significant issues',
      'Run Chart': 'Track performance over time to identify trends, patterns, and process stability',
      'Scatter Plot': 'Analyze relationships between variables to understand correlations and dependencies',
      'Stakeholder Analysis': 'Identify and manage key stakeholders for successful project implementation and buy-in'
    };
    return descriptions[toolName] || 'Powerful lean methodology tool for process improvement and operational excellence';
  }

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    if (authStatus === 'authenticated') {
      fetchUserName();
    }

    // Animate the numbers when they come into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateNumbers();
          }
        });
      },
      { threshold: 0.1 }
    );

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) observer.observe(statsSection);

    // Observe sections for fade-in animations
    const sections = {
      features: document.querySelector('#features'),
      benefits: document.querySelector('.benefits-section'),
      testimonials: document.querySelector('.testimonials-section'),
      industries: document.querySelector('.industries-section'),
      tools: document.querySelector('.tools-section')
    };

    Object.entries(sections).forEach(([key, section]) => {
      if (section) {
        new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                setIsVisible(prev => ({ ...prev, [key]: true }));
              }
            });
          },
          { threshold: 0.1 }
        ).observe(section);
      }
    });

    return () => {
      if (statsSection) observer.unobserve(statsSection);
      Object.values(sections).forEach(section => {
        if (section) observer.unobserve(section);
      });
    };
  }, [authStatus]);

  const fetchUserName = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const firstName = user.attributes['custom:first_name'] || user.attributes?.name?.split(' ')[0] || '';
      setUserName(firstName);
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await Auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const animateNumbers = () => {
    const finalStats = {
      companies: 250,
      projects: 3500,
      improvement: 30,
      countries: 15
    };

    // Animate the numbers over 2 seconds
    const duration = 2000;
    const frameDuration = 16; // ~60fps
    const frames = duration / frameDuration;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / frames;
      
      setStats({
        companies: Math.floor(progress * finalStats.companies),
        projects: Math.floor(progress * finalStats.projects),
        improvement: Math.floor(progress * finalStats.improvement),
        countries: Math.floor(progress * finalStats.countries)
      });

      if (frame === frames) clearInterval(timer);
    }, frameDuration);
  };

  return (
    <div className="landing-page">
      {/* Dynamic FITT Component - Always visible at top right */}
      <DynamicFITT />
      
      {/* Hero Section with Animated Background */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        <Container>
          {authStatus === 'authenticated' && (
            <div className="text-end mb-4">
              <div className="welcome-text mb-2">
                Hello{userName ? `, ${userName}` : ''}! 👋
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <Link to="/dashboard">
                  <Button variant="light" size="lg" className="hero-dashboard-button shadow-sm">
                    <FontAwesomeIcon icon={faChartLine} className="me-2" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline-light" 
                  size="lg" 
                  className="hero-dashboard-button shadow-sm"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                  Logout
                </Button>
              </div>
            </div>
          )}
          <Row className="align-items-center">
            <Col lg={6} className="hero-content">
              <div className="logo-container mb-4 fade-in">
                <img src={LFlogo} alt="VibeStack Pro Logo" className="landing-logo" />
              </div>
              <h1 className="hero-title slide-up">
                Work Smarter. Waste Less. 
                <span className="text-gradient"> Win More.</span>
              </h1>
              <p className="hero-subtitle slide-up-delay">
                VibeStack™ Pro makes it easy for your team to spot what's slowing you down, 
                fix it fast, and keep leveling up.
              </p>
              <p className="hero-subtitle slide-up-delay">
                No boring manuals — just simple, powerful tools to map, track, and improve 
                the way you work every day.
              </p>
              <div className="hero-buttons slide-up-delay-2">
                <Link to="/login">
                  <Button variant="primary" size="lg" className="me-3 pulse-button">
                    Start Free Trial <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                  </Button>
                </Link>
                <a href="https://www.youtube.com/@VibeStack6053" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline-primary" size="lg">Watch Demo Video</Button>
                </a>
              </div>
              <div className="hero-buttons mt-3 slide-up-delay-2">
                <Link to="/preview/list">
                  <Button variant="outline-secondary" size="lg">
                    Explore Sample Reports and Video Tutorials
                  </Button>
                </Link>
              </div>
              <div className="hero-features mt-4 slide-up-delay-3">
                <div className="hero-feature">
                  <FontAwesomeIcon icon={faCheck} className="text-primary" /> 
                  <span>No credit card required for 1 user up to 30 days</span>
                </div>
                <div className="hero-feature">
                  <FontAwesomeIcon icon={faCheck} className="text-primary" /> 
                  <span>Cancel anytime</span>
                </div>
              </div>
            </Col>
            <Col lg={6} className="hero-image-container">
              <div className="hero-shape floating"></div>
              <div className="hero-dashboard-image floating-reverse">
                <object 
                  type="image/svg+xml"
                  data="/images/dashboard-preview.svg" 
                  className="img-fluid dashboard-image"
                  aria-label="VibeStack Dashboard Preview"
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <Container>
          <Row className="text-center">
            <Col md={3} className="stat-item">
              <div className="stat-number">{stats.companies}+</div>
              <div className="stat-label">Companies</div>
            </Col>
            <Col md={3} className="stat-item">
              <div className="stat-number">{stats.projects}+</div>
              <div className="stat-label">Improvement Projects</div>
            </Col>
            <Col md={3} className="stat-item">
              <div className="stat-number">{stats.improvement}%</div>
              <div className="stat-label">Avg. Efficiency Gain</div>
            </Col>
            <Col md={3} className="stat-item">
              <div className="stat-number">{stats.countries}</div>
              <div className="stat-label">Countries</div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <Container>
          <div className="section-header text-center">
            <span className="section-subtitle">POWERFUL FEATURES</span>
            <h2>Accelerate Your Lean Journey</h2>
            <p>Everything you need to implement and sustain Lean practices and smarter processes across your organization</p>
          </div>
          
          <Row className={`g-4 feature-cards ${isVisible.features ? 'visible' : ''}`}>
            <Col md={6} lg={3}>
              <Card className="feature-card">
                <Card.Body>
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                  <Card.Title>KPI Management</Card.Title>
                  <Card.Text>
                    Track, visualize, and optimize your key performance indicators with customizable dashboards.
                  </Card.Text>
                  <div className="feature-hover">
                    <ul className="feature-list">
                      <li>Real-time metrics tracking</li>
                      <li>Custom dashboard creation</li>
                      <li>Goal setting & notifications</li>
                      <li>Historical trend analysis</li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="feature-card">
                <Card.Body>
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faClipboardCheck} />
                  </div>
                  <Card.Title>Action Items</Card.Title>
                  <Card.Text>
                    Efficiently manage tasks, assign ownership, and track completion of improvement initiatives.
                  </Card.Text>
                  <div className="feature-hover">
                    <ul className="feature-list">
                      <li>Task assignment & tracking</li>
                      <li>Due date management</li>
                      <li>Progress visualization</li>
                      <li>Team collaboration tools</li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="feature-card">
                <Card.Body>
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faProjectDiagram} />
                  </div>
                  <Card.Title>Mapping and Waste Identification</Card.Title>
                  <Card.Text>
                    Create value stream maps and process visualizations to identify and eliminate waste.
                  </Card.Text>
                  <div className="feature-hover">
                    <ul className="feature-list">
                      <li>Value stream mapping</li>
                      <li>Process flow diagrams</li>
                      <li>8 wastes identification</li>
                      <li>Bottleneck analysis</li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="feature-card">
                <Card.Body>
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faGraduationCap} />
                  </div>
                  <Card.Title>Lean Learning</Card.Title>
                  <Card.Text>
                    Comprehensive training resources and quizzes to build Lean capability across your team.
                  </Card.Text>
                  <div className="feature-hover">
                    <ul className="feature-list">
                      <li>Interactive learning modules</li>
                      <li>Earn coins while learning</li>
                      <li>Knowledge assessment</li>
                      <li>Team capability dashboard</li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className={`g-4 feature-cards mt-4 ${isVisible.features ? 'visible' : ''}`}>
            <Col md={6} lg={3}>
              <Card className="feature-card">
                <Card.Body>
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faGamepad} />
                  </div>
                  <Card.Title>Engagement through Gamification</Card.Title>
                  <Card.Text>
                    Motivate your team with rewards, competitions, and achievements as they improve processes.
                  </Card.Text>
                  <div className="feature-hover">
                    <ul className="feature-list">
                      <li>Earn Coins for all activities</li>
                      <li>Climb the Leaderboard</li>
                      <li>Attain Awards/Prizes</li>
                      <li>Team competitions</li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3}>
              <Card className="feature-card">
                <Card.Body>
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faRobot} />
                  </div>
                  <Card.Title>AI - LF Mentor</Card.Title>
                  <Card.Text>
                    Your personal Lean coach powered by AI, providing intelligent guidance and insights.
                  </Card.Text>
                  <div className="feature-hover">
                    <ul className="feature-list">
                      <li>A personal Lean Coach</li>
                      <li>Access to organizational data</li>
                      <li>Tokens used</li>
                      <li>Choice of AI platforms</li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3}>
              <Card className="feature-card">
                <Card.Body>
                  <div className="feature-icon">
                    <FontAwesomeIcon icon={faRocket} />
                  </div>
                  <Card.Title>Start Smart</Card.Title>
                  <Card.Text>
                    Get up and running quickly with guided setup and transparent progress tracking.
                  </Card.Text>
                  <div className="feature-hover">
                    <ul className="feature-list">
                      <li>From Chaos to Clarity: The Tinker Town Challenge</li>
                      <li>Detailed set up procedures for onboarding</li>
                      <li>Full transparency with a global bug tracker — and the power for you to add your own</li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

        </Container>
      </section>
      
      {/* Tools Section */}
      <section id="tools" className="tools-section">
        <Container>
          <div className="section-header text-center">
            <span className="section-subtitle">LEAN MANAGEMENT TOOLKIT</span>
            <h2>Powerful Tools at Your Fingertips</h2>
            <p>Explore our suite of lean management smart tools designed to drive continuous improvement and engage employees in the process.</p>
          </div>
          
          <div className={`tools-container ${isVisible.tools ? 'visible' : ''}`}>
            <Tabs defaultActiveKey="lean" id="tools-tabs" className="mb-4 justify-content-center">
              <Tab 
                eventKey="lean" 
                title={
                  <span>
                    <FontAwesomeIcon icon={faTools} className="me-2" />
                    Lean Tools ({enhancedLeanTools.length})
                  </span>
                }
              >
                <Row className="g-4">
                  {enhancedLeanTools.slice(0, showAllTools ? enhancedLeanTools.length : 6).map((tool, index) => (
                    <Col md={6} lg={4} key={tool.id}>
                      <div className="tool-card" style={{animationDelay: `${index * 0.1}s`}}>
                        <div className="tool-icon">
                          <img 
                            src={iconMappings[tool.subtitle] || LFlogo} 
                            alt={tool.name}
                            style={{width: '48px', height: '48px', objectFit: 'contain'}}
                            onError={(e) => {
                              e.target.src = LFlogo;
                            }}
                          />
                        </div>
                        <h3>{tool.name}</h3>
                        <p>{tool.description}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
                
                {enhancedLeanTools.length > 6 && (
                  <div className="text-center mt-4">
                    <Button 
                      variant="outline-primary" 
                      size="lg" 
                      onClick={() => setShowAllTools(!showAllTools)}
                      className="load-more-btn"
                    >
                      {showAllTools ? 'Show Less' : 'Load More Lean Tools'} 
                      <FontAwesomeIcon 
                        icon={faArrowRight} 
                        className={`ms-2 ${showAllTools ? 'rotate-down' : ''}`} 
                      />
                    </Button>
                  </div>
                )}
              </Tab>
              
              <Tab 
                eventKey="quality" 
                title={
                  <span>
                    <FontAwesomeIcon icon={faChartLine} className="me-2" />
                    Quality Tools ({enhancedQualityTools.length})
                  </span>
                }
              >
                <Row className="g-4">
                  {enhancedQualityTools.map((tool, index) => (
                    <Col md={6} lg={4} key={tool.id}>
                      <div className="tool-card" style={{animationDelay: `${index * 0.1}s`}}>
                        <div className="tool-icon">
                          <img 
                            src={iconMappings[tool.subtitle] || LFlogo} 
                            alt={tool.name}
                            style={{width: '48px', height: '48px', objectFit: 'contain'}}
                            onError={(e) => {
                              e.target.src = LFlogo;
                            }}
                          />
                        </div>
                        <h3>{tool.name}</h3>
                        <p>{tool.description}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Tab>
            </Tabs>
          </div>
        </Container>
      </section>
      
      {/* Testimonials Section */}
      <section className="testimonials-section">
        <Container>
          <div className="section-header text-center">
            <span className="section-subtitle">SUCCESS STORIES</span>
            <h2>What Our Customers Say</h2>
            <p>Join hundreds of organizations achieving operational excellence with VibeStack Pro</p>
          </div>
          
          <div className={`testimonials-container ${isVisible.testimonials ? 'visible' : ''}`}>
            <Carousel 
              indicators={true} 
              controls={true}
              interval={6000}
              className="testimonial-carousel"
            >
              {testimonials.map((testimonial, index) => (
                <Carousel.Item key={index}>
                  <div className="testimonial-card">
                    <div className="testimonial-rating">
                      {[...Array(5)].map((_, i) => (
                        <FontAwesomeIcon key={i} icon={faStar} className="star-icon" />
                      ))}
                    </div>
                    <p className="testimonial-quote">{testimonial.quote}</p>
                    <div className="testimonial-author">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name} 
                        className="testimonial-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="testimonial-info">
                        <h4>{testimonial.name}</h4>
                        <p>{testimonial.role}, {testimonial.company}</p>
                      </div>
                    </div>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </div>

        </Container>
      </section>
      
      {/* Benefits Section */}
      <section className="benefits-section">
        <Container>
          <div className="section-header text-center">
            <span className="section-subtitle">WHY CHOOSE VibeStack™ PRO</span>
            <h2>Transform Your Operations Today</h2>
            <p>Our platform delivers measurable results for organizations of all sizes</p>
          </div>
          
          <Row className="align-items-center">
            <Col lg={6}>
              <div className="benefits-image">
                <div className="benefits-shape floating-slow"></div>
                <div className="benefits-content floating-reverse-slow">
                  <div className="benefit-highlight">
                    <FontAwesomeIcon icon={faLightbulb} className="highlight-icon" />
                    <span>30% avg. process efficiency improvement</span>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className={`benefits-list ${isVisible.benefits ? 'visible' : ''}`}>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faChartPie} />
                  </div>
                  <div className="benefit-content">
                    <h3>Improve Operational Efficiency</h3>
                    <p>Identify and eliminate waste in your processes to boost productivity and reduce costs.</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  <div className="benefit-content">
                    <h3>Enhance Team Collaboration</h3>
                    <p>Break down silos with shared visibility into improvement activities across departments.</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faHandshake} />
                  </div>
                  <div className="benefit-content">
                    <h3>Drive Customer Satisfaction</h3>
                    <p>Focus your improvement efforts on what creates the most value for your customers.</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faAward} />
                  </div>
                  <div className="benefit-content">
                    <h3>Build a Culture of Excellence</h3>
                    <p>Recognize achievements and foster continuous improvement with built-in gamification.</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <FontAwesomeIcon icon={faBrain} />
                  </div>
                  <div className="benefit-content">
                    <h3>Capture Knowledge, Drive Future Success</h3>
                    <p>With AI-powered insights from LF Mentor, every idea and activity is captured, transformed into actionable guidance, and applied forward — ensuring nothing is wasted and your organization keeps getting smarter.</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
        </div>
        <Container>
          <div className="cta-content text-center">
            <h2>Ready to Transform Your Operations?</h2>
            <p>Join thousands of organizations already improving with VibeStack™ Pro</p>
            <div className="cta-buttons">
              <Link to="/login">
                <Button variant="light" size="lg" className="cta-button">
                  Start Free Trial <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                </Button>
              </Link>
            </div>
            <div className="cta-features mt-4">
              <div className="cta-feature">
                <FontAwesomeIcon icon={faCheck} /> 
                <span>Full platform access</span>
              </div>
              <div className="cta-feature">
                <FontAwesomeIcon icon={faCheck} /> 
                <span>Premium support</span>
              </div>
              <div className="cta-feature">
                <FontAwesomeIcon icon={faCheck} /> 
                <span>No commitment</span>
              </div>
            </div>
          </div>
        </Container>
      </section>
      
      {/* Footer */}
      <Footer />

    </div>
  );
};

const Footer = () => {
  return (
    <footer className="landing-footer">
      <Container>
        <Row className="footer-content py-5">
          <Col lg={4} md={6} className="mb-4">
            <div className="footer-brand">
              <img src={LFlogo} alt="VibeStack Logo" className="footer-logo mb-3" />
              <p className="footer-description">
                Empowering organizations worldwide to achieve operational excellence through lean methodologies and continuous improvement.
              </p>
              <div className="footer-social mt-3">
                <a href="https://www.youtube.com/@VibeStack6053" target="_blank" rel="noopener noreferrer" className="social-link">
                  <FontAwesomeIcon icon={faChartLine} />
                </a>
                <a href="#" className="social-link">
                  <FontAwesomeIcon icon={faUsers} />
                </a>
                <a href="#" className="social-link">
                  <FontAwesomeIcon icon={faAward} />
                </a>
              </div>
            </div>
          </Col>
          
          <Col lg={2} md={6} className="mb-4">
            <h5 className="footer-heading">Product</h5>
            <ul className="footer-links">
              <li><Link to="/preview/list">Sample Reports</Link></li>
              <li><a href="https://www.youtube.com/@VibeStack6053" target="_blank" rel="noopener noreferrer">Video Tutorials</a></li>
              <li><Link to="/login">Access Platform</Link></li>
              <li><Link to="/login">Start Free Trial</Link></li>
            </ul>
          </Col>
          
          <Col lg={2} md={6} className="mb-4">
            <h5 className="footer-heading">Resources</h5>
            <ul className="footer-links">
              <li><Link to="/preview/list">Features Overview</Link></li>
              <li><Link to="/preview/samples">Sample Data</Link></li>
              <li><a href="https://www.youtube.com/@VibeStack6053" target="_blank" rel="noopener noreferrer">YouTube Channel</a></li>
            </ul>
          </Col>
          
          <Col lg={2} md={6} className="mb-4">
            <h5 className="footer-heading">Quick Links</h5>
            <ul className="footer-links">
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/login">Sign Up</Link></li>
              <li><Link to="/">Home</Link></li>
            </ul>
          </Col>
          
          <Col lg={2} md={12}>
            <h5 className="footer-heading">Get Started</h5>
            <p className="footer-cta-text">
              Join thousands of teams improving their processes with VibeStack Pro.
            </p>
            <Link to="/login">
              <Button variant="primary" className="footer-cta-button w-100 mb-2">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline-light" className="w-100">
                Sign In
              </Button>
            </Link>
          </Col>
        </Row>
        
        <hr className="footer-divider" />
        
        <Row className="footer-bottom py-3">
          <Col md={6}>
            <p className="mb-0">© {new Date().getFullYear()} VibeStack™ Pro. All rights reserved.</p>
          </Col>
          <Col md={6} className="text-md-end">
            <div className="footer-legal">
              <span className="text-muted">Lean Manufacturing Excellence Platform</span>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default LandingPage; 