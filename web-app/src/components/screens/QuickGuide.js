import React from 'react';
import { Container, Row, Col, Card, Button, Table, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faLock, 
  faUnlock, 
  faSearch, 
  faUsers, 
  faRocket, 
  faCoins, 
  faGift, 
  faTools, 
  faQuestionCircle,
  faShieldAlt,
  faEnvelope,
  faChartLine,
  faBrain,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../../contexts/UserContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useOrganization } from '../../contexts/OrganizationContext';

const QuickGuide = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { isSuperAdmin } = useAdmin();
  const { activeOrganization } = useOrganization();
  
  // Check if user is organization admin (owner or co-owner)
  const isOwner = activeOrganization?.owner === user?.attributes?.sub;
  const isCoOwner = activeOrganization?.additionalOwners?.includes(user?.attributes?.email);
  const isOrgAdmin = isOwner || isCoOwner;

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate(-1)}
            className="mb-3"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back
          </Button>
        </Col>
      </Row>

      {/* Admin Guide */}
      {isOrgAdmin && (
        <>
          <Row className="mb-4">
            <Col>
              <Card className="border-primary">
                <Card.Header className="bg-primary text-white">
                  <h3 className="mb-0">
                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                    👨‍💼 VibeStack™ Pro Admin Start Smart & Level Up Guide
                  </h3>
                </Card.Header>
                <Card.Body>
                  <Alert variant="info">
                    <FontAwesomeIcon icon={faLock} className="me-2" />
                    <strong>Admin Section — Visible to All, Editable by Admins Only</strong>
                    <p className="mb-0 mt-2">
                      This section is visible to everyone to keep you informed about key platform settings and options. 
                      However, only designated Admins have permission to make changes in this part of the platform. 
                      This approach helps maintain transparency and keeps everyone aligned on how the platform is managed. 
                      If you have questions or need changes, please contact your Admin.
                    </p>
                  </Alert>

                  <Card className="mb-4">
                    <Card.Body>
                      <h5>
                        <FontAwesomeIcon icon={faSearch} className="me-2" />
                        🔍 What's a "Diagnostic" in VibeStack™ Pro?
                      </h5>
                      <p>
                        VibeStack™ Pro doesn't include a built-in diagnostic button. Instead, it assumes your organization 
                        already tracks key performance indicators (KPIs) and understands improvement areas — much like 
                        checking your fitness stats before starting a workout.
                      </p>
                      <p>
                        That insight fuels your VibeStack™ Pro journey. The platform is your smart toolbox to turn 
                        known issues — like defects, delays, or waste — into actionable Projects, Reports, and Action Items. 
                        With AI-powered coaching and progress tracking, your team can collaborate, improve, and grow with purpose.
                      </p>
                    </Card.Body>
                  </Card>

                  <h4 className="mb-3">
                    <FontAwesomeIcon icon={faUnlock} className="me-2" />
                    🔓 Part 1: Start Smart — Your First 4 Steps
                  </h4>
                  <p className="lead">As Admin, you lead the charge in creating a culture of continuous improvement. Here's how to begin:</p>

                  <Row>
                    <Col md={6} className="mb-3">
                      <Card className="h-100">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0">
                            <Badge bg="success" className="me-2" style={{borderRadius: '50px'}}>1</Badge>
                            Invite Users & Form the VibeStack™ Pro Development Team
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <ul className="small">
                            <li><strong>Who to Invite:</strong> Managers, team leads, process owners, and change champions</li>
                            <li><strong>Why:</strong> Early engagement boosts adoption and drives fast results</li>
                            <li><strong>Where:</strong> Navigate to Profile &gt; Active Users/Members &gt; Invite</li>
                          </ul>
                          
                          <Card className="bg-light">
                            <Card.Body>
                              <h6>📧 Sample Email: Invite to Join the VibeStack™ Pro Development Team</h6>
                              <div className="small">
                                <p><strong>Subject:</strong> Be a Change-Maker: Join the VibeStack™ Development Team!</p>
                                <p>Hey [Name],</p>
                                <p>We're launching the VibeStack™ Development Team — and we'd love to have you onboard. 
                                It's your chance to lead real improvement efforts and help shape how we work smarter, together.</p>
                                <p><strong>What's VibeStack™ Pro?</strong> It's a smart, AI-enhanced platform that helps teams 
                                reduce waste, boost KPIs, and drive measurable impact using proven Lean tools.</p>
                                <p><strong>Why join?</strong></p>
                                <ul>
                                  <li>Lead projects that drive real change</li>
                                  <li>Collaborate with other innovators</li>
                                  <li>Shape how VibeStack™ is used in our org</li>
                                  <li>Earn rewards, get coaching, and improve daily</li>
                                </ul>
                                <p>Once you say yes, you'll get an invite to access the platform and begin creating Projects, Reports, and Action Items.</p>
                                <p>Let's make work better — together. Reach out if you'd like to chat.</p>
                                <p>Cheers,<br/>[Your Name]<br/>VibeStack™ Pro Admin / Continuous Improvement Lead</p>
                              </div>
                            </Card.Body>
                          </Card>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Card className="h-100">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0">
                            <Badge bg="success" className="me-2" style={{borderRadius: '50px'}}>2</Badge>
                            Jump In & Explore
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <ul>
                            <li>Create Projects aligned with your top KPIs and improvement goals</li>
                            <li>Within each Project, add Reports and Action Items to document tasks and drive execution</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Card className="h-100">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0">
                            <Badge bg="success" className="me-2" style={{borderRadius: '50px'}}>3</Badge>
                            Set AI & Coaching Preferences
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <ul>
                            <li>Choose AI platform: LF Mentor (token-managed)</li>
                            <li>Navigate to: Manage Organization &gt; AI Settings</li>
                            <li>The AI provides smart suggestions based on your org's goals, reports, and performance data</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Card className="h-100">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0">
                            <Badge bg="success" className="me-2" style={{borderRadius: '50px'}}>4</Badge>
                            Define Coin Earnings, Rewards, & Leaderboard Settings
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <ul>
                            <li>Set how users earn Coins via Learnings, quizzes, Projects, and completion of Action Items</li>
                            <li>Establish meaningful rewards to reinforce usage</li>
                            <li>Navigate to: Manage Organization &gt; Awards</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <h4 className="mt-4 mb-3">
                    <FontAwesomeIcon icon={faChartLine} className="me-2" />
                    ⬆️ Part 2: Level Up — Deepen Organizational Engagement
                  </h4>

                  <Card className="mb-3">
                    <Card.Body>
                      <h6>
                        <Badge bg="success" className="me-2" style={{borderRadius: '50px'}}>5</Badge>
                        Send a Welcome Email to All Users
                      </h6>
                      <Card className="bg-light">
                        <Card.Body>
                          <h6>📬 Sample Email: Welcome to VibeStack™ Pro</h6>
                          <div className="small">
                            <p><strong>Subject:</strong> Welcome to VibeStack™ Pro — Your Smart Continuous Improvement Platform</p>
                            <p>Hi Team,</p>
                            <p>We're excited to introduce VibeStack™ Pro — your new platform for leading and participating 
                            in continuous improvement across our organization.</p>
                            <p><strong>VibeStack™ Pro empowers you to:</strong></p>
                            <ul>
                              <li>Create and track improvement projects tied to KPIs</li>
                              <li>Collaborate using tools like 5S and A3 Reports</li>
                              <li>Get real-time coaching from LF Mentor AI</li>
                              <li>Earn Coins and unlock rewards</li>
                              <li>See measurable progress toward team goals</li>
                            </ul>
                            <p>This is more than a tool — it's your space to build a better workplace.</p>
                            <p>Let's get started, one Action Item at a time!</p>
                            <p>– Your VibeStack™ Pro Development Team</p>
                          </div>
                        </Card.Body>
                      </Card>
                    </Card.Body>
                  </Card>

                  <Row>
                    <Col md={6} className="mb-3">
                      <Card>
                        <Card.Body>
                          <h6>
                            <Badge bg="success" className="me-2" style={{borderRadius: '50px'}}>6</Badge>
                            Encourage Ongoing Projects & Action Items
                          </h6>
                          <ul className="small mb-0">
                            <li>Reinforce importance of completing Action Items tied to real improvement goals</li>
                            <li>Recognize team members who consistently engage and contribute</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Card>
                        <Card.Body>
                          <h6>
                            <Badge bg="success" className="me-2" style={{borderRadius: '50px'}}>7</Badge>
                            Promote Use of Reports & AI Coaching
                          </h6>
                          <ul className="small mb-0">
                            <li>Use reports like 5S audits, A3 summaries, and Value Stream Maps to inform decisions</li>
                            <li>Encourage users to ask the LF Mentor AI for support, project insights, and tool recommendations</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Card>
                        <Card.Body>
                          <h6>
                            <Badge bg="success" className="me-2" style={{borderRadius: '50px'}}>8</Badge>
                            Monitor Engagement & Share Analytics
                          </h6>
                          <ul className="small mb-0">
                            <li>Generate usage and engagement reports regularly</li>
                            <li>Share outcomes with leadership to celebrate progress and adjust strategies</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Card>
                        <Card.Body>
                          <h6>
                            <Badge bg="success" className="me-2" style={{borderRadius: '50px'}}>9</Badge>
                            Reassess Regularly & Sustain Momentum
                          </h6>
                          <ul className="small mb-0">
                            <li>Schedule regular KPI reviews and Project retrospectives</li>
                            <li>Continue monthly VibeStack™ Pro Development Team meetings to track momentum and spark innovation</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* User Guide - Always visible */}
      <Row className="mb-4">
        <Col>
          <Card className="border-success">
            <Card.Header className="bg-success text-white">
              <h3 className="mb-0">
                <FontAwesomeIcon icon={faRocket} className="me-2" />
                👋 Welcome to VibeStack™ Pro — User Start Smart & Level Up Guide
              </h3>
              <p className="mb-0 mt-2">Your smart start to continuous improvement begins now!</p>
            </Card.Header>
            <Card.Body>
              <h4 className="mb-3">
                <FontAwesomeIcon icon={faUnlock} className="me-2" />
                🔓 Part 1: Start Smart — Your First 6 Steps
              </h4>
              <p>Follow these six quick-start actions to launch your VibeStack™ Pro journey:</p>

              <Row>
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-success">
                    <Card.Body>
                      <Badge bg="success" className="mb-2" style={{borderRadius: '50px'}}>Step 1</Badge>
                      <h6>Accept Your Invitation & Complete Your Profile</h6>
                      <p className="small mb-0">Set up your account and make sure your profile is complete so you can access all features.</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-success">
                    <Card.Body>
                      <Badge bg="success" className="mb-2" style={{borderRadius: '50px'}}>Step 2</Badge>
                      <h6>Create or Open a Project or Report</h6>
                      <p className="small mb-0">Navigate to: Reports &gt; How to Use Tools to preview samples and video tutorials. 
                      Begin with a tool aligned to your current improvement focus.</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-success">
                    <Card.Body>
                      <Badge bg="success" className="mb-2" style={{borderRadius: '50px'}}>Step 3</Badge>
                      <h6>Read a Learning + Take a Quiz</h6>
                      <p className="small mb-0">Navigate to: Learnings. If you're unfamiliar with a tool or report, 
                      review the related learning content and take the corresponding quiz to earn Coins.</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-success">
                    <Card.Body>
                      <Badge bg="success" className="mb-2" style={{borderRadius: '50px'}}>Step 4</Badge>
                      <h6>Create Your First Action Item</h6>
                      <p className="small mb-0">Use the Action Items tool to document a specific improvement goal. 
                      You can assign tasks, invite team members, and track progress over time.</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-success">
                    <Card.Body>
                      <Badge bg="success" className="mb-2" style={{borderRadius: '50px'}}>Step 5</Badge>
                      <h6>Engage with Your Project & Reports</h6>
                      <p className="small mb-0">Work within your active project. Revisit relevant learnings and 
                      continue using reports to gather insights and drive action.</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-3">
                  <Card className="h-100 border-success">
                    <Card.Body>
                      <Badge bg="success" className="mb-2" style={{borderRadius: '50px'}}>Step 6</Badge>
                      <h6>Contribute to the VibeStack™ Development Team</h6>
                      <p className="small mb-0">Use the Feedback tool, Bug List, or contact your Admin to report issues or suggest future enhancements.</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h4 className="mt-4 mb-3">
                <FontAwesomeIcon icon={faChartLine} className="me-2" />
                ⬆️ Part 2: Level Up — Steps to Deepen Growth
              </h4>
              <p>Now that you're started, here's how to maximize your impact with VibeStack™ Pro:</p>

              <Card className="mb-3 border-warning">
                <Card.Header className="bg-warning text-dark">
                  <h6 className="mb-0">
                    <Badge bg="success" className="me-2" style={{borderRadius: '50px'}}>7</Badge>
                    <FontAwesomeIcon icon={faBrain} className="me-2" />
                    Ask the LF Mentor AI for Targeted Support
                  </h6>
                </Card.Header>
                <Card.Body>
                  <p>LF Mentor is your personal continuous improvement coach. It references organizational data and a curated Lean knowledge base.</p>
                  <p><strong>Ask things like:</strong></p>
                  
                  <Row>
                    <Col md={6} className="mb-3">
                      <Card className="bg-light">
                        <Card.Body>
                          <h6>📊 Problem-Solving & Data Questions</h6>
                          <ul className="small mb-0">
                            <li>"Which VibeStack™ tool should I start with if I only have return rate data and customer complaints?"</li>
                            <li>"What's the fastest way to visualize defects by shift and operator?"</li>
                            <li>"Can you help me build a quick Impact Map based on these 3 root causes?"</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Card className="bg-light">
                        <Card.Body>
                          <h6>🧠 Project Coaching & Decision-Making</h6>
                          <ul className="small mb-0">
                            <li>"How do I know if I should run a Kaizen Event or use PDCA instead?"</li>
                            <li>"Can you give me an A3-style summary based on our team meeting notes?"</li>
                            <li>"Which tools help me prioritize problems when everything feels urgent?"</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Card className="bg-light">
                        <Card.Body>
                          <h6>👥 Team & Communication Challenges</h6>
                          <ul className="small mb-0">
                            <li>"How do I explain standard work without sounding controlling?"</li>
                            <li>"My team doesn't believe the data — how do I get buy-in?"</li>
                            <li>"What's a good way to share our results so leadership actually cares?"</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Card className="bg-light">
                        <Card.Body>
                          <h6>🚀 Applied Learning & Growth</h6>
                          <ul className="small mb-0">
                            <li>"I finished the quiz — how do I apply it in real work?"</li>
                            <li>"Can I track my own improvement projects inside VibeStack™?"</li>
                            <li>"What tool should I use if I only have 30 minutes during a daily huddle?"</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <p className="text-muted small mb-0">The AI provides practical guidance based on your project goals, KPIs, and completed learnings.</p>
                </Card.Body>
              </Card>

              <Row>
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Body>
                      <h6>8. Turn KPIs Into Actions</h6>
                      <p className="small">Continue creating Action Items tied directly to your key performance indicators.</p>
                      <ul className="small mb-0">
                        <li>Break down KPIs into manageable tasks</li>
                        <li>Link them to reports and measurable improvements</li>
                        <li>Set timelines and track reflections</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Body>
                      <h6>9. Earn Coins & Redeem Rewards</h6>
                      <p className="small">Track your actions and earn Coins through:</p>
                      <ul className="small">
                        <li>Completing Projects</li>
                        <li>Completing Reports</li>
                        <li>Completing Quizzes at 100%</li>
                        <li>Engage the Learnings</li>
                        <li>Create and complete Action Items</li>
                        <li>Achieving KPIs</li>
                      </ul>
                      <p className="small mb-0">Redeem Coins for real-world rewards like books, swag, and coaching sessions.</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={12} className="mb-3">
                  <Card>
                    <Card.Body>
                      <h6>
                        <Badge bg="success" className="me-2" style={{borderRadius: '50px'}}>10</Badge>
                        Share Successes with the VibeStack™ Development Team
                      </h6>
                      <p className="small">Contribute to organizational learning by:</p>
                      <ul className="small mb-0">
                        <li>Sharing project outcomes</li>
                        <li>Highlighting effective practices</li>
                        <li>Recommending improvements for platform use</li>
                        <li>Beginning a new improvement cycle</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Coin Rewards Summary */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faCoins} className="me-2" />
                🪙 Coin Rewards Summary
              </h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Sample Coins Earned</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Project Completed</td><td>20 Coins</td></tr>
                  <tr><td>Report Completed</td><td>40–50 Coins</td></tr>
                  <tr><td>Action Item Created</td><td>20 Coins</td></tr>
                  <tr><td>Action Item Completed</td><td>60 Coins</td></tr>
                  <tr><td>KPI Goal Achieved</td><td>30 Coins</td></tr>
                  <tr><td>Quiz Score (100%)</td><td>50 Coins</td></tr>
                  <tr><td>Learning Activity (5+ min)</td><td>5 Coins per session</td></tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faGift} className="me-2" />
                🎁 Sample Rewards Setup
              </h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Coins</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Motivational Mug</td><td>400</td></tr>
                  <tr><td>Company Water Bottle</td><td>500</td></tr>
                  <tr><td>Golf Balls</td><td>600</td></tr>
                  <tr><td>T-Shirt</td><td>700</td></tr>
                  <tr><td>Notebook + Pen Set</td><td>800</td></tr>
                  <tr><td>Desk Plant</td><td>850</td></tr>
                  <tr><td>Book of Choice</td><td>1,000</td></tr>
                  <tr><td>Lunch & Learn Seat</td><td>1,200</td></tr>
                  <tr><td>Online Course Credit</td><td>1,500</td></tr>
                  <tr><td>1:1 Coaching Session</td><td>2,500</td></tr>
                  <tr><td>Recognition in Newsletter</td><td>300</td></tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Troubleshooting & FAQs */}
      <Row className="mb-4">
        <Col>
          <Card className="border-danger">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faTools} className="me-2" />
                🛠️ Part 3: User Troubleshooting & FAQs
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">🔐 Login & Access Issues</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="small mb-2"><strong>Didn't receive a login email?</strong></p>
                      <ul className="small mb-0">
                        <li>Check spam or promotions folder.</li>
                        <li>Confirm correct email used.</li>
                        <li>Contact your Admin</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-3">
                  <Card>
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">🏅 Rewards & Recognition</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="small mb-2"><strong>Coins not awarded or missing?</strong></p>
                      <ul className="small mb-2">
                        <li>Ensure the activity was completed and recorded.</li>
                        <li>Refresh the dashboard or sync data.</li>
                        <li>If the issue persists, contact your Admin.</li>
                      </ul>
                      <p className="small mb-2"><strong>Award not received after redemption?</strong></p>
                      <ul className="small mb-0">
                        <li>Contact the Admin to review the redemption record and resolve the issue.</li>
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Privacy Protection */}
      <Row className="mb-4">
        <Col>
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faShieldAlt} className="me-2" />
                🔒 Your Privacy is Protected
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Card className="h-100 bg-light">
                    <Card.Body>
                      <h6>Private Chats</h6>
                      <p className="small mb-0">Chats remain private unless shared by the user — AI interactions and coaching are confidential by default</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 bg-light">
                    <Card.Body>
                      <h6>Organizational Knowledge</h6>
                      <p className="small mb-0">Projects, Reports, and Action Items are accessible to all users and referenced by the AI to support learning and improvement</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 bg-light">
                    <Card.Body>
                      <h6>Admin Visibility</h6>
                      <p className="small mb-0">Admins see only anonymous usage trends — no personal content is shared without permission</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <p className="text-muted small mt-3 mb-0">
                This balance ensures VibeStack™ supports data-driven growth while protecting individual privacy and intellectual trust.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Ready to Run */}
      <Row className="mb-4">
        <Col>
          <Card className="border-success">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faRocket} className="me-2" />
                🚀 Ready to Run Smarter Processes?
              </h5>
            </Card.Header>
            <Card.Body>
              <p>
                Whether you're aiming to reduce defects, enhance standard work, simplify complex workflows, 
                or strengthen your leadership in continuous improvement — VibeStack™ Pro equips you with the tools, 
                insights (both technical and emotionally intelligent), and the flexibility to deliver smarter results at your own pace.
              </p>
              <p>
                From Projects and Reports to real-time AI coaching and actionable KPIs, it's your all-in-one platform 
                to build a culture of continuous improvement — step by step.
              </p>
              <p className="lead text-center my-4">
                <strong>Let's make every process smarter — together.</strong>
              </p>
              <Alert variant="info" className="text-center">
                {isOrgAdmin ? (
                  <>
                    <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                    Contact <a href="mailto:hello@vibestack.example">hello@vibestack.example</a> for any support or questions!
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faQuestionCircle} className="me-2" />
                    If you have questions, your Admin or the VibeStack™ Pro Development Team is ready to help. 
                    Let's improve together — one Action Item at a time.
                    <br/>
                    <strong>Contact your Admin for any support or questions!</strong>
                  </>
                )}
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default QuickGuide;