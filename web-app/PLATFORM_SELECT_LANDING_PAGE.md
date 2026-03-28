# Platform Select Landing Page Documentation

## Overview
This document captures the complete content and design of the Platform Select (TryLandingPage) component that was previously available at `/trylandingpage` route.

## Page Structure

### 1. Hero Section
- **Background**: Linear gradient from #1e3a8a to #3730a3
- **Title**: "Transform Your Organization with FITT™ Methodology"
  - "Transform Your Organization with" - white text
  - "FITT™" - gradient text (yellow: #fbbf24 to #f59e0b)
  - "Methodology" - white text
- **Subtitle**: "Choose your path to excellence through continuous improvement and transformational leadership"
- **Decorative Pattern**: SVG dots pattern overlay with 0.4 opacity

### 2. Dynamic FITT Logo Component
- **Position**: Fixed at top-right (20px, 20px)
- **Style**: 
  - Background: rgba(255, 255, 255, 0.95) with blur backdrop
  - Border radius: 12px
  - Padding: 12px 18px
  - Box shadow: 0 8px 32px rgba(0, 0, 0, 0.1)
  - Font: 24px bold, #009688 color, 2px letter spacing

### 3. Main Content - Two Platform Cards

#### VibeStack™ Pro Card (Left)
**Header Section:**
- Logo: `VibeStack_pro.png`
- Badge: "Continuous Improvement" (gradient background #1e3a8a to #3730a3)

**Content:**
- **Name**: VibeStack™ Pro
- **Tagline**: "Your comprehensive toolkit for operational excellence"
- **Description**: "Empower your teams with 21+ proven lean tools, AI-powered insights, and real-time collaboration to eliminate waste, improve quality, and drive sustainable growth."

**Features Grid (2x2):**
1. Data-Driven Insights (icon: faChartLine)
2. 21+ Lean Tools (icon: faCogs)
3. AI-Powered Guidance (icon: faLightbulb)
4. Team Collaboration (icon: faUsers)

**Action Buttons:**
- Primary: "Start Your Journey" - Green gradient (#047857 to #059669)
  - Action: Navigate to '/'
- Secondary: "Preview Tools" - White with border
  - Action: Navigate to '/preview/list'

**AI Mentor Section:**
- Icon: faRocket
- Title: "AI-Powered Mentor"
- Subtitle: "Get instant guidance and insights"
- Button: "Start AI Chat" - Navigate to '/chatbot'

**Quick Links:**
- "Learn More" - https://VibeStack.com
- "Go to VibeStack" - Navigate to '/'

#### LeadershipFITT™ Card (Right)
**Header Section:**
- Logo: `leaderFitt.png`
- Badge: "Leadership Excellence"

**Content:**
- **Name**: LeadershipFITT™
- **Tagline**: "Transform leaders, transform organizations"
- **Description**: "Develop exceptional leaders with our comprehensive framework that combines lean principles, behavioral insights, and AI-powered coaching to drive engagement and organizational transformation."

**Features Grid (2x2):**
1. Strategic Focus (icon: faBullseye)
2. Team Engagement (icon: faHandshake)
3. Performance Tracking (icon: faClipboardCheck)
4. Change Leadership (icon: faExchangeAlt)

**Action Buttons:**
- Primary: "Start Your Journey" - Red gradient (#dc2626 to #b91c1c)
  - Action: Open https://leadershipfitt.com
- Secondary: "Explore Platform" - White with border
  - Action: Open https://leadershipfitt.com

**AI Mentor Section:**
- Icon: faUserTie
- Title: "Leadership AI Coach"
- Subtitle: "Personalized leadership development"
- Button: "Start AI Chat" - Open https://leadershipfitt.com/chat

**Quick Links:**
- "Learn More" - https://leadershipfitt.com
- "AI Coach" - https://leadershipfitt.com/chat

### 4. Dynamic FITT Framework Section
**Background**: Gradient from #f8fafc to #f1f5f9

**Content:**
- **Title**: "The FITT™ Framework"
- **Subtitle**: "Four core principles that drive organizational excellence"

**Animation:**
- Large FITT letters that highlight one at a time
- Cycling words below: Focus → Involve → Track → Transform
- Animation cycle: 2.5 seconds per word with 300ms transition
- Active letter scales to 1.2x and changes color to #1e3a8a

**Display:**
- Letters: 5rem font, 2rem letter spacing, font-weight 900
- Active state includes shadow effect
- Bottom text: "Focus • Involve • Track • Transform"

### 5. Footer
- Background: #1e293b
- Text: "© 2025 FITT™ Methodology. Empowering organizations worldwide."
- Color: White with 0.8 opacity

## CSS Styling Details

### Color Palette
- **Primary Blue**: #1e3a8a, #3730a3
- **VibeStack Green**: #047857, #059669
- **LeadershipFITT Red**: #dc2626, #b91c1c
- **Background Gradient**: #f5f7fa to #c3cfe2
- **Text Colors**: 
  - Primary: #1a202c
  - Secondary: #4a5568
  - Muted: #718096

### Typography
- **Hero Title**: 3.2rem, weight 800
- **Platform Names**: 1.8rem, weight 800
- **Body Text**: 1rem, line-height 1.8
- **Font Family**: System fonts stack

### Card Design
- **Border Radius**: 20px
- **Shadow**: 0 10px 40px rgba(0,0,0,0.1)
- **Hover Effect**: translateY(-5px) with increased shadow
- **Transition**: all 0.3s ease

### Responsive Breakpoints
- **Desktop**: Full layout with side-by-side cards
- **Tablet (< 992px)**: Reduced font sizes, stacked cards
- **Mobile (< 768px)**: 
  - Single column layout
  - Features grid becomes 1 column
  - Reduced FITT letter size (2.5rem)
  - Adjusted spacing and padding

### Animation Effects
- **Fade In Up**: Cards animate on load with 0.6s duration
- **FITT Letter Cycling**: 2.5s per word with smooth transitions
- **Hover States**: All interactive elements have hover effects
- **Button Hover**: translateY(-2px) with shadow enhancement

## Required Assets
1. `/src/assets/VibeStack_pro.png` - VibeStack Pro logo
2. `/src/assets/leaderFitt.png` - LeadershipFITT logo

## Dependencies
- React Bootstrap (Container, Row, Col, Card, Button)
- FontAwesome icons
- React Router (useNavigate)

## Route Configuration
The component was accessible at `/trylandingpage` route in AppRouter.js

## Implementation Notes
- The component uses React hooks (useState, useEffect) for animation
- DynamicFITT is a separate shared component
- All external links open in new tabs
- Internal navigation uses React Router's navigate function
- The page has a full-height design with scroll support
- Gradient backgrounds are used extensively for visual appeal

## Removal Instructions
To fully remove this component from the project:
1. Delete `/src/components/screens/PlatformSelect.js`
2. Delete `/src/components/screens/PlatformSelect.css`
3. Remove the route from `/src/AppRouter.js`
4. Remove any imports of PlatformSelect in other files
5. Keep the DynamicFITT component if used elsewhere