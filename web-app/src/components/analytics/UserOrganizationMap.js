import React, { useState, useEffect, useCallback } from 'react';
import { Card, Container, Spinner } from 'react-bootstrap';
import { GoogleMap, useLoadScript, InfoWindow } from '@react-google-maps/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding } from '@fortawesome/free-solid-svg-icons';

const markerStyles = {
  backgroundColor: '#dc3545',
  border: '2px solid #ffffff',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
};

const containerStyle = {
  width: '100%',
  height: '500px',
  position: 'relative',
  overflow: 'hidden'
};

const defaultCenter = {
  lat: 20,
  lng: 0
};

// Define libraries array as a static constant
const GOOGLE_MAPS_LIBRARIES = ['places', 'marker'];

const mapOptions = {
  styles: [
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [{ visibility: "simplified" }]
    }
  ],
  minZoom: 2,
  maxZoom: 15,
  mapTypeControl: false,
  fullscreenControl: false,
  streetViewControl: false,
  zoomControl: true,
  zoomControlOptions: {
    position: 3 // RIGHT_TOP
  },
  gestureHandling: 'cooperative',
  restriction: {
    latLngBounds: {
      north: 85,
      south: -85,
      west: -180,
      east: 180
    },
    strictBounds: true
  },
  clickableIcons: false,
  mapId: process.env.REACT_APP_GOOGLE_MAPS_ID
};

const UserOrganizationMap = ({ organizations, selectedLocation, selectedUser }) => {
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [map, setMap] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [markers, setMarkers] = useState([]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  // Create markers when map and organizations are loaded
  useEffect(() => {
    if (isLoaded && window.google && organizations.length > 0 && map) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      const newMarkers = organizations.map(org => {
        if (!org.location) return null;

        const coordinates = parseCoordinates(org.location);
        if (!coordinates) return null;

        const markerElement = document.createElement('div');
        markerElement.className = 'custom-marker';
        Object.assign(markerElement.style, markerStyles);

        // Check if AdvancedMarkerElement is available
        const AdvancedMarkerElement = window.google.maps.marker?.AdvancedMarkerElement;
        
        if (!AdvancedMarkerElement) {
          console.warn('AdvancedMarkerElement not available, falling back to standard marker');
          return new window.google.maps.Marker({
            position: coordinates,
            map: map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#dc3545',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 10,
            }
          });
        }

        const marker = new AdvancedMarkerElement({
          map,
          position: coordinates,
          content: markerElement,
          title: org.name
        });

        marker.addListener('click', () => {
          setSelectedOrg({ ...org, coordinates });
        });

        return marker;
      }).filter(marker => marker !== null);

      setMarkers(newMarkers);
      
      // Create bounds from all organization markers and fit the map
      if (organizations.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        let hasValidCoordinates = false;
        
        organizations.forEach(org => {
          if (org.location) {
            const coordinates = parseCoordinates(org.location);
            if (coordinates) {
              bounds.extend(coordinates);
              hasValidCoordinates = true;
            }
          }
        });
        
        if (hasValidCoordinates) {
          map.fitBounds(bounds);
          
          // Add a small padding to the bounds
          const padding = { 
            top: 50, 
            right: 50, 
            bottom: 50, 
            left: 50 
          };
          
          // Apply padding to the bounds
          const boundsWithPadding = map.getBounds();
          if (boundsWithPadding) {
            map.fitBounds(boundsWithPadding, padding);
          }
          
          // If there's only one marker, zoom in a bit more
          if (organizations.length === 1) {
            map.setZoom(10);
          }
        }
      }
    }
  }, [isLoaded, map, organizations]);

  // Rescale map when organizations change
  useEffect(() => {
    if (map && isLoaded && window.google && organizations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoordinates = false;
      
      organizations.forEach(org => {
        if (org.location) {
          const coordinates = parseCoordinates(org.location);
          if (coordinates) {
            bounds.extend(coordinates);
            hasValidCoordinates = true;
          }
        }
      });
      
      if (hasValidCoordinates) {
        // Add padding to the bounds
        const padding = { 
          top: 50, 
          right: 50, 
          bottom: 50, 
          left: 50 
        };
        
        map.fitBounds(bounds, padding);
        
        // Set appropriate zoom level based on number of organizations
        setTimeout(() => {
          const currentZoom = map.getZoom();
          if (organizations.length === 1) {
            map.setZoom(10);
          } else if (organizations.length <= 3) {
            map.setZoom(Math.min(currentZoom, 4));
          } else {
            map.setZoom(Math.min(currentZoom, 2));
          }
        }, 100);
      } else {
        // If no valid coordinates, reset to default view
        map.setCenter(defaultCenter);
        map.setZoom(2);
      }
    }
  }, [map, isLoaded, organizations, selectedLocation, selectedUser]);

  // Clean up markers on unmount
  useEffect(() => {
    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, [markers]);

  const onLoad = useCallback((map) => {
    setMap(map);
    // Initial map setup is now handled in the useEffect hooks
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const parseCoordinates = (locationString) => {
    if (!locationString) return null;
    try {
      const [lat, lng] = locationString.split(',').map(coord => {
        const num = parseFloat(coord.trim());
        return isNaN(num) ? null : num;
      });
      
      // Validate coordinates
      if (lat === null || lng === null) return null;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
      
      return { lat, lng };
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return null;
    }
  };

  return (
    <Container fluid className="p-0">
      <Card className="shadow-sm border-0 rounded-0">
        <Card.Header className="bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faBuilding} className="text-primary me-2" />
              <h5 className="mb-0">
                {selectedLocation !== 'all' && selectedUser === 'all' 
                  ? `Organizations in ${selectedLocation}` 
                  : selectedUser !== 'all' && selectedLocation === 'all'
                  ? 'Your Organizations'
                  : selectedLocation !== 'all' && selectedUser !== 'all'
                  ? `Organizations in ${selectedLocation} (Filtered by User)`
                  : 'All Your Organizations Overview'}
              </h5>
            </div>
            <small className="text-muted">
              {organizations.length} Organizations
            </small>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={defaultCenter}
              zoom={2}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={mapOptions}
            >
              {selectedOrg && selectedOrg.coordinates && (
                <InfoWindow
                  position={selectedOrg.coordinates}
                  onCloseClick={() => setSelectedOrg(null)}
                  options={{
                    pixelOffset: new window.google.maps.Size(0, -10),
                    disableAutoPan: false,
                    maxWidth: 300
                  }}
                >
                  <div className="p-2" style={{ minWidth: '200px', maxWidth: '300px' }}>
                    <h6 className="mb-2">{selectedOrg.name}</h6>
                    {selectedOrg.contactEmail && (
                      <p className="mb-2 small">
                        <strong>Email:</strong> {selectedOrg.contactEmail}
                      </p>
                    )}
                    {selectedOrg.contactPhone && (
                      <p className="mb-2 small">
                        <strong>Phone:</strong> {selectedOrg.contactPhone}
                      </p>
                    )}
                    {selectedOrg.location && (
                      <p className="mb-0 small">
                        <strong>Location:</strong> {selectedOrg.location}
                      </p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : loadError ? (
            <div className="alert alert-danger m-0">
              Error loading Google Maps: {loadError.message}
            </div>
          ) : (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UserOrganizationMap; 