import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartArea, 
  faClipboardList, 
  faBookOpen,
  faUser,
  faPlayCircle,
  faTrophy,
  faStore,
  faBox,
  faRocket,
  faTableCellsLarge,
  faUserShield,
  faCog,
  faChevronRight,
  faSpinner,
  faExternalLinkAlt,
  faCheckCircle,
  faClock,
  faBug,
  faFileContract
} from '@fortawesome/free-solid-svg-icons';
import { faTrello as brandTrello } from '@fortawesome/free-brands-svg-icons';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useUser } from '../../contexts/UserContext';
import { useAdmin } from '../../contexts/AdminContext';
import AiIcon from '../../assets/Ai-icon.png';
import useSubmenuData from '../../hooks/useSubmenuData';
import TermsAndConditions from '../TermsAndConditions';

const MegaMenu = ({ 
  isVisible, 
  onMouseEnter, 
  onMouseLeave, 
  onMenuItemClick,
  hasAiChatAccess, 
  user, 
  activeOrganization,
  hasManagementAccess,
  isSuperAdmin
}) => {
  const location = useLocation();
  const { projects, reports, actionItems, loading, fetchSubmenuData, refreshData } = useSubmenuData();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [submenuData, setSubmenuData] = useState({ projects: [], reports: [], actionItems: [] });
  const [showTermsModal, setShowTermsModal] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Fetch submenu data when menu becomes visible (only if we don't have data)
  useEffect(() => {
    if (isVisible && activeOrganization?.id && !loading && 
        (projects.length === 0 && reports.length === 0 && actionItems.length === 0)) {
      fetchSubmenuData();
    }
  }, [isVisible, activeOrganization?.id, fetchSubmenuData, loading, projects.length, reports.length, actionItems.length]);

  // Update submenu data when projects/reports/actionItems change
  useEffect(() => {
    setSubmenuData({ projects, reports, actionItems });
  }, [projects, reports, actionItems]);

  // Add keyboard shortcut to force refresh (Ctrl+Shift+R when mega menu is visible)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isVisible && event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        console.log('MegaMenu: Manual refresh triggered via Ctrl+Shift+R');
        refreshData();
      }
    };

    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, refreshData]);

  const menuSections = [
    {
      title: "Main Navigation",
      items: [
        {
          path: "/dashboard",
          label: "Home",
          icon: faTableCellsLarge,
          description: "Dashboard overview and quick access"
        },
        {
          path: "/projects",
          label: "Projects",
          icon: faClipboardList,
          description: "Project management and tracking",
          hasSubmenu: true,
          submenuKey: "projects"
        },
        {
          path: "/reports",
          label: "Reports",
          icon: faChartArea,
          description: "Lean methodology reports and analytics",
          hasSubmenu: true,
          submenuKey: "reports"
        },
        {
          path: "/action-items",
          label: "Action Items",
          icon: brandTrello,
          description: "Task and action item management",
          hasSubmenu: true,
          submenuKey: "actionItems"
        },
        {
          path: "/learnings",
          label: "Learning",
          icon: faBookOpen,
          description: "Learning materials and educational content"
        }
      ]
    },
    {
      title: "User Tools",
      items: [
        {
          path: "/profile",
          label: "Profile",
          icon: faUser,
          description: "Manage your profile and preferences"
        },
        {
          path: "/awards",
          label: "Awards",
          icon: faTrophy,
          description: "View your achievements and progress"
        },
        {
          path: "/shop",
          label: "Shop",
          icon: faStore,
          description: "Browse and purchase rewards"
        },
        {
          path: "/inventory",
          label: "My Inventory",
          icon: faBox,
          description: "View your purchased items"
        },
        {
          path: "/tools",
          label: "Tools",
          icon: faPlayCircle,
          description: "Access lean methodology tools"
        },
        {
          path: "/issue-reporting",
          label: "Report Issues (Bugs)",
          icon: faBug,
          description: "Report issues and provide feedback"
        }
      ]
    }
  ];

  // Create highlighted footer section with important features (no title)
  const footerSection = {
    title: "", // Remove the heading
    isFooter: true,
    items: [
      {
        path: "/start-smart",
        label: "Start Smart",
        icon: faRocket,
        description: "Quick start tools and administrative functions",
        highlight: true,
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }
    ]
  };

  // Add AI Chat in the middle if user has access
  if (hasAiChatAccess) {
    footerSection.items.push({
      path: "/chatbot",
      label: "LF Mentor",
      icon: "custom-ai",
      description: "AI-powered assistance and guidance",
      highlight: true
    });
  }

  // Add Sample Reports at the end
  footerSection.items.push({
    path: "/preview/list",
    label: "Sample Reports",
    icon: faClipboardList,
    description: "Browse sample reports & Ai analysis examples",
    highlight: true,
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
  });

  // Add administration section
  const administrationItems = [];
  
  // Add management items if user has access
  if (activeOrganization && (hasManagementAccess(activeOrganization) || isSuperAdmin)) {
    if (isSuperAdmin) {
      administrationItems.push({
        path: "/super-admin",
        label: "Super Admin Console",
        icon: faUserShield,
        description: "System administration • Global oversight • Platform analytics • Security settings",
        highlight: true
      });
    }
    
    if (hasManagementAccess(activeOrganization)) {
      administrationItems.push({
        path: "/organization-management",
        label: "Manage Organization",
        icon: faCog,
        description: "Organization details • User management • Awards configuration • Team permissions"
      });
      administrationItems.push({
        path: "/learning-analytics",
        label: "Learning Analytics",
        icon: faChartArea,
        description: "Team progress tracking • Learning metrics • Performance analytics • Training insights"
      });
    }
  }
  
  // Add Terms & Conditions at the bottom for all users
  administrationItems.push({
    action: "showTerms",
    label: "Terms & Conditions", 
    icon: faFileContract,
    description: "View platform terms and conditions • Privacy policy • User agreements"
  });

  if (administrationItems.length > 0) {
    menuSections.push({
      title: "Administration",
      items: administrationItems
    });
  }

  // Add footer section at the end
  menuSections.push(footerSection);

  // Helper function to convert action item status integer to string
  const getActionItemStatusText = (status) => {
    const statusMap = {
      0: 'To Do',
      1: 'In Progress', 
      2: 'In Review',
      3: 'Done'
    };
    return statusMap[status] || 'To Do';
  };

  const getActionItemStatusClass = (status) => {
    const statusMap = {
      0: 'to_do',
      1: 'in_progress',
      2: 'in_review', 
      3: 'done'
    };
    return statusMap[status] || 'to_do';
  };

  const renderSubmenu = (submenuKey) => {
    const data = submenuData[submenuKey] || [];
    
    if (loading) {
      return (
        <div className="submenu-loading">
          <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
          Loading...
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="submenu-empty">
          <span>No {submenuKey} found</span>
        </div>
      );
    }

    return (
      <div className="submenu">
        <div className="submenu-header">
          <span>Latest {submenuKey.charAt(0).toUpperCase() + submenuKey.slice(1)}</span>
          <Link to={`/${submenuKey}`} className="view-all-link" onClick={onMenuItemClick}>
            <FontAwesomeIcon icon={faExternalLinkAlt} className="me-1" />
            View All
          </Link>
        </div>
        <div className="submenu-items">
          {data.slice(0, 10).map((item, index) => (
            <Link
              key={item.id || index}
              to={
                submenuKey === 'projects' 
                  ? `/project/${item.id}` 
                  : submenuKey === 'reports'
                  ? `/report/${item.id}`
                  : `/action-items?selected=${item.id}`
              }
              className="submenu-item"
              onClick={onMenuItemClick}
            >
              <div className="submenu-item-content">
                <div className="submenu-item-name">
                  {submenuKey === 'actionItems' ? item.title : item.name}
                </div>
                <div className="submenu-item-meta">
                  {submenuKey === 'projects' ? (
                    <span className={`status-badge ${item.status ? item.status.toLowerCase() : 'active'}`}>
                      {item.status || 'Active'}
                    </span>
                  ) : submenuKey === 'reports' ? (
                    <span className={`completion-badge ${item.completed ? 'completed' : 'pending'}`}>
                      <FontAwesomeIcon 
                        icon={item.completed ? faCheckCircle : faClock} 
                        className="me-1" 
                      />
                      {item.completed ? 'Completed' : 'In Progress'}
                    </span>
                  ) : (
                    // Action Items
                    <div className="action-item-meta">
                      <span className={`status-badge ${getActionItemStatusClass(item.status)}`}>
                        {getActionItemStatusText(item.status)}
                      </span>
                      {item.duedate && (
                        <span className="due-date upcoming">
                          <FontAwesomeIcon icon={faClock} className="me-1" />
                          {new Date(item.duedate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`mega-menu ${isVisible && !showTermsModal ? 'visible' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        zIndex: 9999, // Very high z-index to ensure it appears above everything
        ...(isVisible && !showTermsModal ? {} : { display: 'none' })
      }}
    >
      <div className="mega-menu-container">
        <div className="mega-menu-content">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={`menu-section ${section.isFooter ? 'footer-section' : ''}`}>
              {section.title && <h3 className={`section-title ${section.isFooter ? 'footer-title' : ''}`}>{section.title}</h3>}
              <div className={`menu-items ${section.isFooter ? 'footer-items' : ''}`}>
                {section.items.map((item, itemIndex) => {
                  const menuItemContent = (
                    <>
                      <div className="menu-item-icon">
                        {item.icon === "custom-ai" ? (
                          <img
                            src={AiIcon}
                            alt="AI Icon"
                            height="24"
                            width="24"
                            className="ai-icon"
                          />
                        ) : (
                          <FontAwesomeIcon icon={item.icon} />
                        )}
                      </div>
                      <div className="menu-item-content">
                        <div className="menu-item-label">{item.label}</div>
                        <div className="menu-item-description">{item.description}</div>
                      </div>
                    </>
                  );

                  return (
                    <div key={itemIndex} className="menu-item-wrapper">
                      {item.action ? (
                        <div
                          className={`menu-item ${item.highlight ? 'highlight-footer' : ''}`}
                          onClick={() => {
                            if (item.action === "showTerms") {
                              setShowTermsModal(true);
                            }
                            onMenuItemClick();
                          }}
                          onMouseEnter={() => item.hasSubmenu && setHoveredItem(item.submenuKey)}
                          onMouseLeave={() => setHoveredItem(null)}
                          style={{ cursor: 'pointer', ...(item.gradient ? { background: item.gradient } : {}) }}
                        >
                          {menuItemContent}
                        </div>
                      ) : (
                        <Link
                          to={item.path}
                          className={`menu-item ${isActive(item.path) ? 'active' : ''} ${item.highlight ? 'highlight-footer' : ''}`}
                          onClick={onMenuItemClick}
                          onMouseEnter={() => item.hasSubmenu && setHoveredItem(item.submenuKey)}
                          onMouseLeave={() => setHoveredItem(null)}
                          style={item.gradient ? { background: item.gradient } : {}}
                        >
                          {menuItemContent}
                        </Link>
                      )}
                    </div>
                  );
                })}
                
                {/* Handle submenu for items that have them */}
                {section.items.map((item, itemIndex) => (
                  item.hasSubmenu && hoveredItem === item.submenuKey && (
                    <div 
                      key={`submenu-${itemIndex}`}
                      className="submenu-container"
                      onMouseEnter={() => setHoveredItem(item.submenuKey)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {renderSubmenu(item.submenuKey)}
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <TermsAndConditions 
          onAccept={() => setShowTermsModal(false)}
          onClose={() => setShowTermsModal(false)}
          requireCheckbox={false}
          viewOnly={true}
        />
      )}

    </div>
  );
};

export default MegaMenu;