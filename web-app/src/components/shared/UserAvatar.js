import React, { useState, useEffect } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { getUserAvatarByEmail, getUserAvatarByUserSub } from '../../utils/userAvatarService';
import { useOrganization } from '../../contexts/OrganizationContext';
import { getUserByEmail, getUserByCognitoID } from '../../utils/userSync';
import { Storage } from 'aws-amplify';

/**
 * A reusable avatar component that fetches and displays user avatars
 * @param {Object} props Component props
 * @param {string} props.email User's email (optional if userSub is provided)
 * @param {string} props.userSub User's sub ID (optional if email is provided)
 * @param {string} props.organizationID Organization ID (optional if context is available)
 * @param {number} props.size Avatar size in pixels (default: 30)
 * @param {string} props.customColor Background color for initials fallback (default: #00897b)
 * @param {boolean} props.isOwner Whether to show an owner badge
 * @param {string} props.tooltipLabel Custom tooltip label (defaults to email)
 * @param {string} props.className Additional CSS classes
 * @param {Object} props.style Additional inline styles
 * @param {boolean} props.squareStyle Whether to display the avatar as a square with rounded corners instead of a circle
 */
const UserAvatar = ({
  email,
  userSub,
  organizationID: propOrgId,
  size = 30,
  customColor = '#00897b',
  isOwner = false,
  tooltipLabel,
  className = '',
  style = {},
  squareStyle = false
}) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const { activeOrganization } = useOrganization();
  const organizationID = propOrgId || activeOrganization?.id;

  useEffect(() => {
    const fetchUserDataAndAvatar = async () => {
      if (!email && !userSub) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setAvatarUrl(null); // Reset avatar URL on new fetch
      
      try {
        // 1. Fetch user data from the database
        let user = null;
        if (userSub) {
          user = await getUserByCognitoID(userSub);
        }
        if (!user && email) {
          user = await getUserByEmail(email);
        }
        setUserData(user);
        
        // 2. If user data contains profileImageKey, generate a fresh signed URL
        if (user && user.profileImageKey) {
          try {
            const signedURL = await Storage.get(user.profileImageKey, {
              level: 'public',
              validateObjectExistence: true,
              expires: 60 * 15 // 15-minute expiry
            });
            setAvatarUrl(signedURL);
          } catch (storageError) {
            console.error('Error generating signed URL from key:', user.profileImageKey, storageError);
            // If Storage.get fails, avatarUrl remains null, leading to initials fallback
          }
        } else {
          // 3. If no image key in DB, fall back to avatar service (for Cognito attributes, etc.)
          let fallbackUrl = null;
          if (email && organizationID) {
            fallbackUrl = await getUserAvatarByEmail(email, organizationID);
          } else if (userSub && organizationID) {
            fallbackUrl = await getUserAvatarByUserSub(userSub, organizationID);
          }
          setAvatarUrl(fallbackUrl);
        }
      } catch (error) {
        console.error('Error fetching user data/avatar:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserDataAndAvatar();
  }, [email, userSub, organizationID]);

  const getInitials = (emailStr) => {
    if (!emailStr) return "U"; // Default to "U" for unknown
    const [name] = emailStr.split('@');
    const words = name.split(/[._-]/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: squareStyle ? '8px' : '50%',
    backgroundColor: customColor,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.4,
    fontWeight: 'bold',
    marginRight: '4px',
    cursor: 'pointer',
    border: '2px solid white',
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  const ownerBadgeStyle = isOwner ? {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: size * 0.5,
    height: size * 0.5,
    borderRadius: squareStyle ? '4px' : '50%',
    backgroundColor: '#FFEB3B',
    border: '1px solid #FFC107',
    zIndex: 2
  } : {};

  const renderAvatar = () => {
    if (loading) {
      return (
        <div className="spinner-grow spinner-grow-sm text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      );
    }
    
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={email || userSub || 'User'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      );
    }
    
    if (email?.startsWith('+')) {
      // This is for "more users" indicator
      return email;
    }
    
    if (userSub || email) {
      return getInitials(email);
    }
    
    return <FontAwesomeIcon icon={faUserCircle} size={size > 40 ? "2x" : "1x"} />;
  };

  // Get display name from user data or fallback to email/sub
  const getDisplayName = () => {
    if (userData && userData.firstName && userData.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    
    return tooltipLabel || email || userSub || 'User';
  };

  const tooltipContent = isOwner ? `Owner: ${getDisplayName()}` : getDisplayName();

  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id={`tooltip-${email || userSub || 'user'}`}>{tooltipContent}</Tooltip>}
    >
      <div style={avatarStyle} className={className}>
        {renderAvatar()}
        {isOwner && <div style={ownerBadgeStyle}></div>}
      </div>
    </OverlayTrigger>
  );
};

export default UserAvatar; 