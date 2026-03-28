import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Accordion, Badge, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faArrowLeft, faIndustry, faBullseye, faChartLine, faCog, faCheckCircle, faLightbulb, faUsers, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../../contexts/UserContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useOrganization } from '../../contexts/OrganizationContext';

const AdministrativeFunctions = () => {
  const navigate = useNavigate();
  const [activeAccordion, setActiveAccordion] = useState(null);
  const { user } = useUser();
  const { isSuperAdmin } = useAdmin();
  const { activeOrganization } = useOrganization();
  
  // Check if user is organization admin (owner or co-owner)
  const isOwner = activeOrganization?.owner === user?.attributes?.sub;
  const isCoOwner = activeOrganization?.additionalOwners?.includes(user?.attributes?.email);
  const isOrgAdmin = isOwner || isCoOwner;
  const isUser = !isOrgAdmin;

  return (
    <Container className="py-4">
      {/* Back Button */}
      <Row className="mb-3">
        <Col>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate(-1)}
            className="mb-0"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back
          </Button>
        </Col>
      </Row>

      {/* Welcome Message */}
      <Row className="mb-4">
        <Col>
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">🚀 Welcome to VibeStack™ Pro</h4>
            </Card.Header>
            <Card.Body>
              <p className="lead">
                We're proud to introduce a platform 10 years in the making — purpose-built to empower teams like yours.
              </p>
              <p>
                ✅ Over the past year, dozens of organizations have beta-tested VibeStack™, and the feedback is clear: it's driving real value and measurable results.
              </p>
              <p>
                Like any smart platform, VibeStack™ Pro continues to evolve. While you might come across a few rough edges, we believe in full transparency and rapid iteration:
              </p>
              
              <Row className="mt-3">
                <Col md={4}>
                  <Card className="h-100 border-danger">
                    <Card.Body>
                      <h6 className="text-danger">🐛 Known Issues & Improvements</h6>
                      <p className="small mb-0">View what's actively being refined — and why.</p>
                      <p className="small text-muted mb-0">➤ Go to: Profile &gt; Report Issues (Bugs)</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 border-info">
                    <Card.Body>
                      <h6 className="text-info">🔄 Frequent Updates</h6>
                      <p className="small mb-0">The platform improves fast, based on real user feedback.</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 border-success">
                    <Card.Body>
                      <h6 className="text-success">📣 Your Voice Matters</h6>
                      <p className="small mb-0">Use the in-platform reporting to share feedback and suggestions directly with our team.</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <div className="alert alert-info mt-3 mb-0">
                <p className="mb-0">
                  <strong>💡 Reporting through the platform ensures your issue reaches the right team quickly</strong> — faster than through app stores or external reviews.
                </p>
              </div>
              
              <hr className="my-3"/>
              
              <p className="mb-0 text-muted">
                Thanks for helping us build a smarter, leaner future — and for shaping what's next with VibeStack™ Pro.
              </p>
              <p className="mb-0">
                <strong>VibeStack™ Pro Development Team</strong> (<a href="mailto:hello@vibestack.example">hello@vibestack.example</a>)
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Guide Link */}
      <Row className="mb-4">
        <Col className="text-center">
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => navigate('/quick-guide')}
            className="px-5"
          >
            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
            Quick Guide - Start Smart & Level Up
          </Button>
          <p className="text-muted mt-2">
            Access comprehensive guides for both Admins and Users to maximize your VibeStack™ Pro experience
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <h1 className="display-4">Smarter Workflows & Problem-Solving Made Simple: A3 Project Reports + D-M-A-I-C</h1>
          <p className="lead text-muted">
            Heads up: Admin Essentials give setup context—jump ahead to the parts built to help you thrive on the platform.
          </p>
        </Col>
      </Row>

      {/* Admin-only section */}
      {isOrgAdmin && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <h5 className="mb-3">Available Administrative Functions</h5>
                <p>The following administrative functions are available only on the web version:</p>
              
              <Row className="mt-4">
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-primary">
                    <Card.Body>
                      <h6 className="text-primary">AI Platform Selection</h6>
                      <p className="mb-0">Choose and configure your preferred AI platform</p>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-info">
                    <Card.Body>
                      <h6 className="text-info">Token Management</h6>
                      <p className="mb-0">Monitor and manage AI tokens usage</p>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-success">
                    <Card.Body>
                      <h6 className="text-success">Credits Top-up</h6>
                      <p className="mb-0">Add AI token credits to your account for continued usage</p>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-warning">
                    <Card.Body>
                      <h6 className="text-warning">Coins and Awards Configuration</h6>
                      <p className="mb-0">Set up rewards system and achievement parameters</p>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-danger">
                    <Card.Body>
                      <h6 className="text-danger">Notifications</h6>
                      <p className="mb-0">Configure system-wide notification settings</p>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-secondary">
                    <Card.Body>
                      <h6 className="text-secondary">Leaderboard Options</h6>
                      <p className="mb-0">Manage leaderboard display and ranking criteria</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <div className="alert alert-info mt-4">
                <h6 className="alert-heading">
                  <FontAwesomeIcon icon={faVideo} className="me-2" />
                  Need Help?
                </h6>
                <p className="mb-0">
                  See the detailed video on how to create Org and customize at{' '}
                  <a 
                    href="https://VibeStack.com/support" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="alert-link"
                  >
                    https://VibeStack.com/support
                  </a>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      )}

      {/* DMAIC A3 Case Study Section */}
      <Row className="mb-4">
        <Col>
          <Card className="border-success">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faVideo} className="me-2" />
                Two Real Projects—Two Proven Approaches. See How A3 and DMAIC Each Get Results
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="lead">
                Unlock smarter processes (i.e., Lean) with real-world A3 Project Reports and D-M-A-I-C problem-solving case studies.
              </p>
              
              <Row className="mt-4">
                <Col lg={6} className="mb-4">
                  <Card className="h-100 border-info">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0">A3 Project Report Made Simple: A Project Snapshot</h6>
                    </Card.Header>
                    <Card.Body>
                      <h6 className="text-info">Production Line Cycle Time Reduction</h6>
                      <p><strong>Performance:</strong> 9-second improvement (45s to 36s cycle time)</p>
                      <p><strong>Customer Impact:</strong> Satisfaction improved from 7.2 to 9.1</p>
                      <p><strong>Business Value:</strong> $180,000 annual savings</p>
                      
                      <h6 className="mt-3 text-info">A3 Framework Application:</h6>
                      <ul className="small">
                        <li><strong>Problem Statement:</strong> Quantified 12.5% takt time exceedance</li>
                        <li><strong>Current State:</strong> 8-step process, Station 5 bottleneck</li>
                        <li><strong>Root Cause:</strong> Fishbone analysis, 3 primary factors</li>
                        <li><strong>Future State:</strong> Semi-automated tooling, cellular layout</li>
                        <li><strong>Implementation:</strong> 12-week phased approach</li>
                        <li><strong>Results:</strong> Exceeded targets, zero late deliveries</li>
                        <li><strong>Follow-up:</strong> Comprehensive sustainability plan</li>
                      </ul>
                      
                      <div className="alert alert-info mt-3">
                        <small><strong>Key Learning:</strong> Systematic A3 approach integrating automation with lean principles, achieving sustainable improvements through comprehensive problem-solving.</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col lg={6} className="mb-4">
                  <Card className="h-100 border-primary">
                    <Card.Header className="bg-primary text-white">
                      <h6 className="mb-0">DMAIC Made Simple: A Project Snapshot</h6>
                    </Card.Header>
                    <Card.Body>
                      <h6 className="text-primary">Customer Order Processing Defect Reduction</h6>
                      <p><strong>Business Impact:</strong> $2.3M annual improvement</p>
                      <p><strong>Performance:</strong> 67% defect reduction (18.3% to 6.2% DPMO)</p>
                      <p><strong>Sigma Level:</strong> Improved from 3.2 to 4.8 sigma (world-class)</p>
                      
                      <h6 className="mt-3 text-primary">DMAIC Phase Highlights:</h6>
                      <ul className="small">
                        <li><strong>Define:</strong> Clear problem quantification with VOC integration</li>
                        <li><strong>Measure:</strong> &gt;95% MSA accuracy, comprehensive baseline</li>
                        <li><strong>Analyze:</strong> Advanced statistical tools (DOE, regression)</li>
                        <li><strong>Improve:</strong> 65% pilot reduction, full-scale success</li>
                        <li><strong>Control:</strong> SPC implementation, 6-month sustainment</li>
                      </ul>
                      
                      <div className="alert alert-success mt-3">
                        <small><strong>Key Learning:</strong> Black Belt excellence with statistical rigor, achieving world-class Cp = 1.6 performance through systematic DMAIC methodology.</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Row className="mt-4">
                <Col>
                  <Card className="bg-light">
                    <Card.Body>
                      <h4 className="text-success text-center mb-4">Learning Objectives & Best Practices</h4>
                      <Row>
                        <Col md={6}>
                          <h6 className="text-info">A3 Project Report Excellence:</h6>
                          <ul className="small">
                            <li>Data-driven problem quantification with business impact</li>
                            <li>Systematic root cause analysis using multiple tools</li>
                            <li>Technology integration with lean manufacturing principles</li>
                            <li>Comprehensive sustainability and continuous improvement</li>
                          </ul>
                        </Col>
                        <Col md={6}>
                          <h6 className="text-primary">DMAIC Methodology Mastery:</h6>
                          <ul className="small">
                            <li>Statistical rigor with MSA, DOE, and hypothesis testing</li>
                            <li>Process capability improvement (Cp = 0.8 to 1.6)</li>
                            <li>Sustained performance through SPC monitoring</li>
                            <li>Cross-functional leadership and stakeholder engagement</li>
                          </ul>
                        </Col>
                      </Row>
                      
                      <div className="alert alert-warning mt-3">
                        <h6 className="alert-heading">Implementation Insights:</h6>
                        <Row>
                          <Col sm={6}>
                            <small><strong>DMAIC Success Factors:</strong> Executive sponsorship, Black Belt leadership, statistical validation, and systematic Control phase implementation</small>
                          </Col>
                          <Col sm={6}>
                            <small><strong>A3 Success Factors:</strong> Clear problem definition, comprehensive analysis, phased implementation, and robust follow-up procedures</small>
                          </Col>
                        </Row>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tinker Town Comprehensive Case Study */}
      <Row className="mb-4">
        <Col>
          <Card className="border-warning">
            <Card.Header className="bg-warning text-dark">
              <h4 className="mb-0">
                <FontAwesomeIcon icon={faIndustry} className="me-2" />
                🧸 From Chaos to Clarity: The Tinker Town Challenge
              </h4>
              <p className="mb-0 mt-2">A complete journey through all 21 VibeStack™ tools solving real business problems</p>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                <Col lg={8}>
                  <p className="lead">
                    Things spiraled at Tinker Town—rising defects, misaligned priorities, and mounting frustration across the team. 
                    Now that the dust has settled, you're here to analyze what happened. What went wrong, what went right, and what would you have done differently?
                  </p>
                  <p>
                    Meet <strong>Tinker Town</strong> — a fictional teddy bear factory where classic craftsmanship meets smart tech. 
                    This case study gives you a behind-the-scenes look at how a real improvement journey unfolds, using all 21 VibeStack™ tools to tackle a business problem that matters.
                  </p>
                </Col>
                <Col lg={4}>
                  <Card className="bg-danger text-white">
                    <Card.Body className="text-center">
                      <h5><FontAwesomeIcon icon={faBullseye} className="me-2" />The Challenge</h5>
                      <h3>Rising Return Rates</h3>
                      <div className="d-flex justify-content-between">
                        <div>
                          <small>From</small>
                          <h4>2.1%</h4>
                        </div>
                        <div className="align-self-center">
                          <FontAwesomeIcon icon={faChartLine} size="2x" />
                        </div>
                        <div>
                          <small>To</small>
                          <h4>6.8%</h4>
                        </div>
                      </div>
                      <small>More than triple the usual rate!</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <div className="alert alert-info">
                <h6 className="alert-heading">
                  <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                  💡 That's where VibeStack™ comes in.
                </h6>
                <p className="mb-2">
                  Over a focused two-month period, a cross-functional team stepped in and applied a full set of 21 Lean tools, 
                  carefully mapped to the 8 phases of the A3 Project Report. The result? A clear, collaborative effort to find the causes, make smart fixes, and drive lasting results.
                </p>
                <div className="alert alert-warning">
                  <small>
                    <strong>🧠 Heads-up:</strong> Most real-life projects don't use every single Lean tool — and that's okay. 
                    We used all 21 here on purpose so you can see each one in action. It's not about checking boxes; it's about knowing what tools are out there and when to reach for them.
                  </small>
                </div>
              </div>

              <Row className="mb-4">
                <Col>
                  <h5>What you'll learn from this:</h5>
                  <Row>
                    <Col md={6}>
                      <ul>
                        <li>Where each tool fits in a real improvement journey</li>
                        <li>Why the team chose certain tools (and skipped others)</li>
                      </ul>
                    </Col>
                    <Col md={6}>
                      <ul>
                        <li>How structured teamwork can create real change</li>
                        <li>Ideas for applying VibeStack™ in your own work</li>
                      </ul>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* A3 Project Timeline */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                📊 Your Data in Action - A3 Project Timeline
              </h5>
            </Card.Header>
            <Card.Body>
              <p>
                With the story set, you're ready to see how the tools were actually used. 
                The next section presents the full A3 Project Report, divided into 8 key phases. 
                Inside each one, you'll see exactly when and where the VibeStack™ tools were applied — and how they helped reduce that climbing return rate.
              </p>
              
              <Accordion activeKey={activeAccordion} onSelect={setActiveAccordion}>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="primary" className="me-2">Phase 1</Badge>
                      <strong>Problem Statement</strong>
                      <Badge bg="secondary" className="ms-auto me-2">June 1-5</Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col lg={8}>
                        <h6>🗓️ June 1 – June 5</h6>
                        <p><strong>Objective:</strong> Clearly define the business problem and explain why it matters.</p>
                        
                        <h6 className="text-primary">Tools Used:</h6>
                        <ul>
                          <li><strong>Stakeholder Analysis</strong> – Helped the team map out who was affected, including Customer Support, Quality, Engineering, and Sales. Without this, departments were working in silos.</li>
                          <li><strong>Impact Map</strong> – Created a shared vision across functions, identifying the key actors and impacts needed to solve the issue.</li>
                          <li><strong>A3 Project Report</strong> – Served as the master document to guide the team through the phases.</li>
                        </ul>

                        <h6 className="text-success">Dialogue & Situations:</h6>
                        <div className="bg-light p-3 rounded">
                          <p className="mb-2"><em>"Returns are killing us,"</em> said Mia from Customer Support. <em>"But I don't know what the root problem is. Engineering keeps telling me it's user error."</em></p>
                          <p className="mb-2"><em>"Let's map this out. If we don't understand the stakeholders, we won't fix this right,"</em> replied Jon, the CI Lead.</p>
                          <p className="mb-0">Later, Jon gathered the group: <em>"We're going to use Stakeholder Analysis so everyone's voice is on the table. Let's not treat this like just another 'quality issue.' It affects every corner of this business."</em></p>
                        </div>

                        <div className="alert alert-warning mt-3">
                          <h6>Pain Point Experienced:</h6>
                          <p className="mb-0">Confusion over responsibility. Customer complaints were handled reactively with no structured handoff to Engineering. The team resolved this by building the stakeholder map to clarify roles.</p>
                        </div>
                      </Col>
                      <Col lg={4}>
                        <Card className="bg-primary text-white">
                          <Card.Body>
                            <h6>Visual Suggestions:</h6>
                            <ul className="small mb-0">
                              <li>Stakeholder Alignment Map</li>
                              <li>Project Charter Snapshot</li>
                              <li>VOC Summary Table</li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="1">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="info" className="me-2">Phase 2</Badge>
                      <strong>Current State</strong>
                      <Badge bg="secondary" className="ms-auto me-2">June 5-15</Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col lg={8}>
                        <h6>🗓️ June 5 – June 15</h6>
                        <p><strong>Objective:</strong> Understand how things currently work and what performance looks like.</p>
                        
                        <h6 className="text-primary">Tools Used:</h6>
                        <ul>
                          <li><strong>Pareto Chart</strong> – Revealed that 3 defect types (loose wiring, unresponsive sensors, and battery failures) made up 80% of all returns.</li>
                          <li><strong>Value Stream Map (High Level)</strong> – Mapped the entire West Wing process to see how materials and information flowed.</li>
                          <li><strong>Waste Walk</strong> – Floor visits revealed redundant motion and bottlenecks at the wiring station.</li>
                          <li><strong>Histogram</strong> – Used batch data to visualize defect frequency and variations.</li>
                        </ul>

                        <h6 className="text-success">Dialogue & Situations:</h6>
                        <div className="bg-light p-3 rounded">
                          <p className="mb-2"><em>"Why are we seeing so many sensor issues just on the night shift?"</em> asked Priya from Quality.</p>
                          <p className="mb-2"><em>"Let's go see,"</em> suggested Rico, the supervisor. During the Gemba walk, they found one machine that was out of calibration.</p>
                          <p className="mb-0"><em>"We've had that oven since forever,"</em> Rico admitted. <em>"The night crew tweaks it to stay on pace."</em></p>
                        </div>

                        <div className="alert alert-warning mt-3">
                          <h6>Pain Point Experienced:</h6>
                          <p className="mb-0">Data wasn't being used. Line workers had concerns but lacked a way to raise them formally. The team started posting histograms daily, giving visibility to trends.</p>
                        </div>
                      </Col>
                      <Col lg={4}>
                        <Card className="bg-info text-white">
                          <Card.Body>
                            <h6>Visual Suggestions:</h6>
                            <ul className="small mb-0">
                              <li>SIPOC Diagram</li>
                              <li>Stakeholder Map</li>
                              <li>Current defect metrics</li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="2">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="success" className="me-2">Phase 3</Badge>
                      <strong>Improvement Opportunity</strong>
                      <Badge bg="secondary" className="ms-auto me-2">June 10-20</Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col lg={8}>
                        <h6>🗓️ June 10 – June 20</h6>
                        <p><strong>Objective:</strong> Identify improvement areas and prioritize ideas.</p>
                        
                        <h6 className="text-primary">Tools Used:</h6>
                        <ul>
                          <li><strong>Brainstorming</strong> – Cross-functional session generated over 40 root cause ideas.</li>
                          <li><strong>Fishbone Diagram</strong> – Categorized causes into Machines, Methods, Materials, and People.</li>
                          <li><strong>5 Whys</strong> – Used to drill down into the causes for loose wires and battery fit issues.</li>
                          <li><strong>Impact Map (Reused)</strong> – Realigned with updated goals now that more clarity existed.</li>
                        </ul>

                        <h6 className="text-success">Dialogue & Situations:</h6>
                        <div className="bg-light p-3 rounded">
                          <p className="mb-2"><em>"We keep blaming the materials, but did anyone audit the training process?"</em> asked Dee from Ops.</p>
                          <p className="mb-2"><em>"We assume people know the standard,"</em> added Sam. <em>"But when I asked five techs how to solder correctly, I got five different answers."</em></p>
                          <p className="mb-0">Jon: <em>"Let's get these causes on the Fishbone. Then we'll '5 Whys' the biggest ones. Don't just look at the defect—look at the behavior."</em></p>
                        </div>

                        <div className="alert alert-warning mt-3">
                          <h6>Pain Point Experienced:</h6>
                          <p className="mb-0">Assumptions about training quality. No actual documentation existed. Team initiated a plan to define and document standard work.</p>
                        </div>
                      </Col>
                      <Col lg={4}>
                        <Card className="bg-success text-white">
                          <Card.Body>
                            <h6>Visual Suggestions:</h6>
                            <ul className="small mb-0">
                              <li>Financial impact snapshot</li>
                              <li>RACI Matrix</li>
                              <li>Goal definition chart</li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="3">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="warning" className="me-2">Phase 4</Badge>
                      <strong>Problem Analysis</strong>
                      <Badge bg="secondary" className="ms-auto me-2">June 21 - July 1</Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col lg={8}>
                        <h6>🗓️ June 21 – July 1</h6>
                        <p><strong>Objective:</strong> Confirm root causes with supporting data.</p>
                        
                        <h6 className="text-primary">Tools Used:</h6>
                        <ul>
                          <li><strong>Scatter Plot</strong> – Showed a strong correlation between oven temperature and electrical defects.</li>
                          <li><strong>Fishbone + 5 Whys (continued)</strong> – Used again to validate causes under real production conditions.</li>
                          <li><strong>Mistake Proofing</strong> – Started designing ways to prevent improper battery insertion.</li>
                        </ul>

                        <h6 className="text-success">Dialogue & Situations:</h6>
                        <div className="bg-light p-3 rounded">
                          <p className="mb-2"><em>"We're overcooking the boards,"</em> said Sara, the process engineer, reviewing the scatter plot. <em>"Night shift turns up the temp to speed things up."</em></p>
                          <p className="mb-0"><em>"They didn't even know the max temp,"</em> added Rico. <em>"We never had it posted."</em></p>
                        </div>

                        <div className="alert alert-warning mt-3">
                          <h6>Pain Point Experienced:</h6>
                          <p className="mb-0">Pressure to meet output targets caused corners to be cut. The team had to recalibrate machines and communicate why precision mattered more than speed.</p>
                        </div>
                      </Col>
                      <Col lg={4}>
                        <Card className="bg-warning text-dark">
                          <Card.Body>
                            <h6>Visual Suggestions:</h6>
                            <ul className="small mb-0">
                              <li>Fishbone Diagram</li>
                              <li>Pareto Chart of Defect Causes</li>
                              <li>Scatter Plot of Temperature vs. Defects</li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="4">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="secondary" className="me-2">Phase 5</Badge>
                      <strong>Future State</strong>
                      <Badge bg="secondary" className="ms-auto me-2">July 1-10</Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col lg={8}>
                        <h6>🗓️ July 1 – July 10</h6>
                        <p><strong>Objective:</strong> Design a better, more stable process.</p>
                        
                        <h6 className="text-primary">Tools Used:</h6>
                        <ul>
                          <li><strong>5S</strong> – Cleaned and labeled tools, created a shadow board.</li>
                          <li><strong>Standard Work</strong> – Documented and trained on key tasks, including soldering and testing.</li>
                          <li><strong>PDCA</strong> – Piloted new process for battery installation.</li>
                          <li><strong>Value Stream Map (Future State)</strong> – Mapped the redesigned flow.</li>
                        </ul>

                        <h6 className="text-success">Dialogue & Situations:</h6>
                        <div className="bg-light p-3 rounded">
                          <p className="mb-2"><em>"Everything feels calmer now,"</em> said Jordan on the line. <em>"I don't have to guess where tools are anymore."</em></p>
                          <p className="mb-0">Jon during a walkthrough: <em>"Let's lock in the new flow with visual cues. Clarity beats memory."</em></p>
                        </div>

                        <div className="alert alert-warning mt-3">
                          <h6>Pain Point Experienced:</h6>
                          <p className="mb-0">Workspaces were cluttered, and errors were happening during transitions. 5S helped with visual cues and reduced variability.</p>
                        </div>
                      </Col>
                      <Col lg={4}>
                        <Card className="bg-secondary text-white">
                          <Card.Body>
                            <h6>Visual Suggestions:</h6>
                            <ul className="small mb-0">
                              <li>Target Condition Summary</li>
                              <li>Vision-to-Execution Roadmap</li>
                              <li>Future state process flow</li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="5">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="primary" className="me-2">Phase 6</Badge>
                      <strong>Implementation Plan</strong>
                      <Badge bg="secondary" className="ms-auto me-2">July 11-25</Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col lg={8}>
                        <h6>🗓️ July 11 – July 25</h6>
                        <p><strong>Objective:</strong> Roll out changes smoothly and gain momentum.</p>
                        
                        <h6 className="text-primary">Tools Used:</h6>
                        <ul>
                          <li><strong>Kaizen Event</strong> – Two-day sprint led to redesigned station layout and setup checklists.</li>
                          <li><strong>Run Chart</strong> – Monitored defect rate decline over time.</li>
                          <li><strong>Leadership</strong> – Line supervisors held daily huddles and reinforced expectations.</li>
                        </ul>

                        <h6 className="text-success">Dialogue & Situations:</h6>
                        <div className="bg-light p-3 rounded">
                          <p className="mb-2"><em>"I thought this would take forever,"</em> said Taylor, a line lead. <em>"But seeing the changes work so fast was motivating."</em></p>
                          <p className="mb-0">Jon: <em>"Improvements are easier to adopt when people help design them. That's why this Kaizen sprint was critical."</em></p>
                        </div>

                        <div className="alert alert-warning mt-3">
                          <h6>Pain Point Experienced:</h6>
                          <p className="mb-0">Initial resistance. People feared that improvement meant more work. Early wins and visible leader support made the shift easier.</p>
                        </div>
                      </Col>
                      <Col lg={4}>
                        <Card className="bg-primary text-white">
                          <Card.Body>
                            <h6>Visual Suggestions:</h6>
                            <ul className="small mb-0">
                              <li>Timeline of Pilot</li>
                              <li>Kaizen Event Layout</li>
                              <li>Implementation roadmap</li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="6">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="success" className="me-2">Phase 7</Badge>
                      <strong>Verify Results</strong>
                      <Badge bg="secondary" className="ms-auto me-2">July 26 - Aug 5</Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col lg={8}>
                        <h6>🗓️ July 26 – August 5</h6>
                        <p><strong>Objective:</strong> Check results and confirm sustainability.</p>
                        
                        <h6 className="text-primary">Tools Used:</h6>
                        <ul>
                          <li><strong>Run Chart (continued)</strong> – Return rate dropped steadily from 6.8% to under 3.2%.</li>
                          <li><strong>Gemba Walk</strong> – Leaders visited the floor to ask questions and listen.</li>
                          <li><strong>Lean Assessment</strong> – Used to score behaviors and habits.</li>
                        </ul>

                        <h6 className="text-success">Dialogue & Situations:</h6>
                        <div className="bg-light p-3 rounded">
                          <p className="mb-2"><em>"We're not just putting out fires anymore,"</em> said Jasmine in Quality. <em>"Now we're spotting issues early."</em></p>
                          <p className="mb-0">Jon: <em>"Keep using the run chart. Celebrate the trend—but stay vigilant."</em></p>
                        </div>

                        <div className="alert alert-warning mt-3">
                          <h6>Pain Point Experienced:</h6>
                          <p className="mb-0">Inconsistent follow-up. Once the return rate dipped, attention slipped. Daily visuals and weekly reviews helped sustain momentum.</p>
                        </div>
                      </Col>
                      <Col lg={4}>
                        <Card className="bg-success text-white">
                          <Card.Body>
                            <h6>Visual Suggestions:</h6>
                            <ul className="small mb-0">
                              <li>Before vs. After Bar Graph</li>
                              <li>Control Chart</li>
                              <li>Dashboard snapshot</li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="7">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="dark" className="me-2">Phase 8</Badge>
                      <strong>Follow-Up</strong>
                      <Badge bg="secondary" className="ms-auto me-2">Aug 5-15</Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col lg={8}>
                        <h6>🗓️ August 5 – August 15</h6>
                        <p><strong>Objective:</strong> Lock in the gains and replicate what worked.</p>
                        
                        <h6 className="text-primary">Tools Used:</h6>
                        <ul>
                          <li><strong>DMAIC</strong> – Final documentation helped create templates for future projects.</li>
                          <li><strong>A3 Finalization</strong> – Used to share project results with other departments.</li>
                          <li><strong>Leadership Development</strong> – New leads were mentored during the rollout.</li>
                        </ul>

                        <h6 className="text-success">Dialogue & Situations:</h6>
                        <div className="bg-light p-3 rounded">
                          <p className="mb-2"><em>"This was more than fixing a defect,"</em> said Rico. <em>"We learned how to lead better."</em></p>
                          <p className="mb-0">Jon: <em>"Let's archive this A3. Then we'll showcase it during next month's ops review."</em></p>
                        </div>

                        <div className="alert alert-warning mt-3">
                          <h6>Pain Point Experienced:</h6>
                          <p className="mb-0">No formal process for sharing lessons learned. Now, successful projects are turned into case studies and shared at monthly ops reviews.</p>
                        </div>
                      </Col>
                      <Col lg={4}>
                        <Card className="bg-dark text-white">
                          <Card.Body>
                            <h6>Visual Suggestions:</h6>
                            <ul className="small mb-0">
                              <li>Control Plan Table</li>
                              <li>Team Recognition Photo</li>
                              <li>Lessons learned summary</li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* DMAIC Detailed Case Study */}
      <Row className="mb-4">
        <Col>
          <Card className="border-info">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faCog} className="me-2" />
                Your Data in Action - DMAIC Project Timeline
              </h5>
            </Card.Header>
            <Card.Body>
              <Accordion>
                <Accordion.Item eventKey="prepare">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="secondary" className="me-2">Prepare</Badge>
                      <strong>🛠️ Build Readiness and Alignment</strong>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>
                      Before launching into the Define phase of DMAIC, it was critical to prepare the team, align leadership, and assess readiness. 
                      At Tinker Town, we began by recognizing persistent complaints about product defects from both customers and internal quality control teams.
                    </p>
                    <Row>
                      <Col md={8}>
                        <p>
                          We gathered initial performance reports and held a leadership huddle to confirm that this issue was both urgent and worth dedicating resources to. 
                          A pre-project stakeholder meeting was organized to surface any preliminary concerns, align expectations, and clarify roles.
                        </p>
                        <p>
                          Using internal data systems and customer service logs, we compiled a rough baseline of the defect issue and its possible impacts on customer satisfaction and cost. 
                          We then evaluated resource availability—ensuring we had the right data analysts, production line operators, and engineering support for a cross-functional team.
                        </p>
                      </Col>
                      <Col md={4}>
                        <Card className="bg-light">
                          <Card.Body>
                            <h6>Key Outcomes:</h6>
                            <ul className="small mb-0">
                              <li>Full executive sponsorship</li>
                              <li>Cross-functional team assembly</li>
                              <li>Clear resource allocation</li>
                              <li>Risk assessment completed</li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="define">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="primary" className="me-2">Define</Badge>
                      <strong>🔍 Clarify the Problem and Objectives</strong>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>
                      The Define phase formally launched the project. We began by drafting a comprehensive project charter that articulated the problem: 
                      a product defect rate averaging 8%, causing returns, rework, and reduced customer satisfaction. 
                      The goal was to reduce the defect rate to under 3% within four months.
                    </p>
                    <Row>
                      <Col md={6}>
                        <Card className="border-primary mb-3">
                          <Card.Header>Problem Statement</Card.Header>
                          <Card.Body>
                            <p className="mb-0">
                              Persistent complaints from customers and internal quality teams highlighted a significant issue: 
                              an unacceptably high product defect rate of 8%, significantly above industry standards and internal targets.
                            </p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card className="border-success mb-3">
                          <Card.Header>Goal Definition</Card.Header>
                          <Card.Body>
                            <p className="mb-0">
                              Reduce the defect rate from 8% to under 3% within four months, 
                              improving customer satisfaction and reducing rework costs.
                            </p>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="measure">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="info" className="me-2">Measure</Badge>
                      <strong>📊 Establish the Baseline and Quantify the Problem</strong>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>
                      In the Measure phase, we turned our attention to data. First, we identified our Critical-to-Quality (CTQ) characteristics, 
                      with the defect rate being primary, followed by cycle time and rework hours.
                    </p>
                    <Row>
                      <Col md={8}>
                        <p>
                          We developed a data collection plan that detailed how, when, and by whom data would be gathered. 
                          Over the next two weeks, we collected data across all three shifts, capturing defect types, time of occurrence, 
                          product lot, machine ID, and operator name.
                        </p>
                        <div className="alert alert-info">
                          <strong>Baseline Results:</strong> The average defect rate was 8.2%, and rework costs exceeded $10,000/month.
                        </div>
                      </Col>
                      <Col md={4}>
                        <Card className="bg-info text-white">
                          <Card.Body>
                            <h6>Data Collection Tools:</h6>
                            <ul className="small mb-0">
                              <li>Histograms by shift</li>
                              <li>Control charts</li>
                              <li>Gage R&R study</li>
                              <li>Process maps</li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="analyze">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="warning" className="me-2">Analyze</Badge>
                      <strong>🧠 Identify Root Causes</strong>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>
                      With solid data in hand, the Analyze phase began with team workshops to dig into potential causes. 
                      We used a Pareto chart to identify which defects were most frequent—80% of them came from two types: 
                      misaligned components and shorted circuits.
                    </p>
                    <Row>
                      <Col md={6}>
                        <h6 className="text-warning">Key Findings:</h6>
                        <ul>
                          <li>80% of defects from two types: misaligned components and shorted circuits</li>
                          <li>Correlation between machine temperature and short circuits</li>
                          <li>Inconsistent calibration procedures</li>
                          <li>Poor shift communication and handoffs</li>
                        </ul>
                      </Col>
                      <Col md={6}>
                        <Card className="border-warning">
                          <Card.Header>Analysis Tools Used</Card.Header>
                          <Card.Body>
                            <ul className="small mb-0">
                              <li>Pareto chart analysis</li>
                              <li>Fishbone diagram</li>
                              <li>5 Whys analysis</li>
                              <li>Scatter plots</li>
                              <li>FMEA assessment</li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="improve">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="success" className="me-2">Improve</Badge>
                      <strong>🚀 Develop and Test Solutions</strong>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>
                      Armed with root causes, we moved into the Improve phase. The team used brainstorming techniques and Lean tools to generate solutions.
                    </p>
                    <Row>
                      <Col md={6}>
                        <h6 className="text-success">Solutions Implemented:</h6>
                        <ul>
                          <li><strong>Calibration Checklist:</strong> Standardized machine calibration at start of each shift</li>
                          <li><strong>Shift Handoff Form:</strong> Structured communication between shifts</li>
                          <li><strong>Kaizen Event:</strong> Workspace optimization for tool access</li>
                          <li><strong>Visual Controls:</strong> Laminated instructions at workstations</li>
                        </ul>
                      </Col>
                      <Col md={6}>
                        <Card className="border-success">
                          <Card.Header>Pilot Results</Card.Header>
                          <Card.Body>
                            <div className="text-center">
                              <h4 className="text-success">4.1%</h4>
                              <p className="mb-0">Defect rate after 2-week pilot<br/><small>(Down from 8%)</small></p>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="control">
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg="dark" className="me-2">Control</Badge>
                      <strong>📈 Sustain and Monitor the Improvements</strong>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>
                      To ensure that gains wouldn't fade, the Control phase focused on embedding the changes. 
                      Control charts were implemented at each production line to monitor real-time defect rates.
                    </p>
                    <Row>
                      <Col md={8}>
                        <h6 className="text-dark">Sustainability Measures:</h6>
                        <ul>
                          <li>Real-time control charts at each production line</li>
                          <li>Monthly performance scorecards for leadership</li>
                          <li>Bi-weekly operator audits and coaching</li>
                          <li>Quarterly reviews for continuous improvement</li>
                          <li>Updated SOPs in knowledge base</li>
                        </ul>
                      </Col>
                      <Col md={4}>
                        <Card className="bg-success text-white">
                          <Card.Body className="text-center">
                            <h6>Final Results</h6>
                            <h3>&lt;3%</h3>
                            <p className="mb-1">Sustained defect rate</p>
                            <hr className="bg-white"/>
                            <h4>65%</h4>
                            <p className="mb-0">Reduction in rework costs</p>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tools Timeline */}
      <Row className="mb-4">
        <Col>
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                🧰 Complete Tools Timeline - All 21 VibeStack™ Tools in Action
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-3">
                  <Card className="h-100" style={{backgroundColor: '#e8f5e8'}}>
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">🟩 June 1 – June 10: Prepare & Define Phase</h6>
                    </Card.Header>
                    <Card.Body>
                      <ul className="small mb-0">
                        <li><strong>7. Stakeholder Analysis</strong> – Identified all key players and influencers</li>
                        <li><strong>12. Impact Map</strong> – Clarified goals and contributions</li>
                        <li><strong>20. DMAIC</strong> – Selected as primary improvement framework</li>
                        <li><strong>21. A3 Project Report</strong> – Documentation and reporting tool</li>
                        <li><strong>8. Value Stream Map (High-Level)</strong> – End-to-end teddy bear production</li>
                        <li><strong>9. Waste Walk</strong> – Noted waste areas during VSM walkthrough</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6} className="mb-3">
                  <Card className="h-100" style={{backgroundColor: '#fff3cd'}}>
                    <Card.Header style={{backgroundColor: '#f0ad4e', color: 'white'}}>
                      <h6 className="mb-0">🟧 June 11 – June 20: Measure Phase</h6>
                    </Card.Header>
                    <Card.Body>
                      <ul className="small mb-0">
                        <li><strong>1. Pareto Chart</strong> – Returns analysis (past 2 months)</li>
                        <li><strong>5. Histogram</strong> – Defect frequency across shifts</li>
                        <li><strong>6. Scatter Plot</strong> – Machine settings vs. defect patterns</li>
                        <li><strong>19. Run Chart</strong> – Tracked defect rate trends</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6} className="mb-3">
                  <Card className="h-100" style={{backgroundColor: '#fff4e6'}}>
                    <Card.Header style={{backgroundColor: '#f39c12', color: 'white'}}>
                      <h6 className="mb-0">🟨 June 21 – June 30: Analyze Phase</h6>
                    </Card.Header>
                    <Card.Body>
                      <ul className="small mb-0">
                        <li><strong>2. Brainstorming</strong> – Generated root cause ideas</li>
                        <li><strong>3. Fishbone Diagram</strong> – Organized causal categories</li>
                        <li><strong>4. 5 Whys</strong> – Deep dive into priority issues</li>
                        <li><strong>16. Standard Work</strong> – Identified absence during shifts</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6} className="mb-3">
                  <Card className="h-100" style={{backgroundColor: '#e6f3ff'}}>
                    <Card.Header className="bg-primary text-white">
                      <h6 className="mb-0">🟦 July 1 – July 15: Improve Phase</h6>
                    </Card.Header>
                    <Card.Body>
                      <ul className="small mb-0">
                        <li><strong>11. Kaizen Event</strong> – Set-up process improvement</li>
                        <li><strong>10. 5S</strong> – Implemented after Waste Walk</li>
                        <li><strong>13. PDCA</strong> – Mini shadow board iteration</li>
                        <li><strong>15. Mistake Proofing</strong> – Assembly area error prevention</li>
                        <li><strong>14. Lean Assessment</strong> – Team readiness evaluation</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6} className="mb-3">
                  <Card className="h-100" style={{backgroundColor: '#f8e6ff'}}>
                    <Card.Header style={{backgroundColor: '#9b59b6', color: 'white'}}>
                      <h6 className="mb-0">🟪 July 16 – August 5: Control & Sustain</h6>
                    </Card.Header>
                    <Card.Body>
                      <ul className="small mb-0">
                        <li><strong>17. Leadership</strong> – Next gen leader mentoring</li>
                        <li><strong>18. Gemba Walk</strong> – Floor observation for adoption</li>
                        <li><strong>16. Standard Work</strong> – Final version implementation</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6} className="mb-3">
                  <Card className="h-100" style={{backgroundColor: '#e8f8e8'}}>
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">✅ August 6 – August 15: Project Wrap-Up</h6>
                    </Card.Header>
                    <Card.Body>
                      <ul className="small mb-0">
                        <li><strong>21. A3 Project Report</strong> – Final report completion</li>
                        <li><strong>19. Run Chart</strong> – Updated with sustained improvement</li>
                        <li><strong>20. DMAIC</strong> – All phases documented and celebrated</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Summary and Call to Action */}
      <Row className="mb-4">
        <Col>
          <Card className="border-success">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                🔎 Summary & Your Turn
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col lg={8}>
                  <p className="lead">
                    The Tinker Town case wasn't just about reducing product returns. It was a deep dive into how VibeStack™ tools empower a team to ask better questions, work together, and deliver results that stick.
                  </p>
                  <p>
                    This two-month journey used all 21 VibeStack™ tools — an uncommon but purposeful move to help you understand how each fits into the bigger picture. 
                    Consider this a roadmap, not a rulebook.
                  </p>
                  
                  <h6 className="text-success">🚀 Your Turn: Make It Real with VibeStack™</h6>
                  <p>You've seen how every VibeStack™ tool came to life in the Tinker Town project—each one with a purpose, a result, and a lesson.</p>
                  
                  <Row>
                    <Col sm={6}>
                      <ul>
                        <li>✅ Dive into the tools and reinforce what you've learned</li>
                        <li>✅ Take the quiz to challenge your thinking</li>
                        <li>✅ Identify an opportunity in your own work or team</li>
                      </ul>
                    </Col>
                    <Col sm={6}>
                      <ul>
                        <li>✅ Launch your improvement effort and start tracking real data</li>
                        <li>✅ Use what works—ditch what doesn't</li>
                        <li>✅ Shape your own success story</li>
                      </ul>
                    </Col>
                  </Row>
                </Col>
                <Col lg={4}>
                  <Card className="bg-warning text-dark">
                    <Card.Body className="text-center">
                      <h5>Final Results</h5>
                      <Row>
                        <Col>
                          <h4>6.8% → 3.2%</h4>
                          <small>Return Rate Reduction</small>
                        </Col>
                      </Row>
                      <hr/>
                      <Row>
                        <Col>
                          <h4>65%</h4>
                          <small>Cost Savings</small>
                        </Col>
                      </Row>
                      <hr/>
                      <Row>
                        <Col>
                          <h4>21/21</h4>
                          <small>Tools Demonstrated</small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <div className="alert alert-info mt-4">
                <h6 className="alert-heading">
                  <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                  Remember: This isn't just theory.
                </h6>
                <p className="mb-0">
                  It's your chance to build, lead, and improve—one tool, one insight, one win at a time.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Access - Only show for admins and super admins */}
      {(isOrgAdmin || isSuperAdmin) && (
        <Row>
          <Col>
            <Card className="bg-light">
              <Card.Body>
                <h5>Quick Access</h5>
                <p>Navigate to specific administrative sections:</p>
                <div className="d-flex flex-wrap gap-2">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/organization-management')}
                  >
                    Organization Management
                  </Button>
                  {/* Super Admin Console - Only show for super admins */}
                  {isSuperAdmin && (
                    <Button 
                      variant="outline-primary" 
                      onClick={() => navigate('/super-admin')}
                    >
                      Super Admin Console
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default AdministrativeFunctions;