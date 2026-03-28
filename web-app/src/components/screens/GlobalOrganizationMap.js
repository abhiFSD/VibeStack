import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Container, Spinner } from 'react-bootstrap';
import { GoogleMap, useLoadScript, InfoWindow } from '@react-google-maps/api';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
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
  height: '400px',
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

const GlobalOrganizationMap = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const markerElement = document.createElement('div');
        markerElement.className = 'custom-marker';
        Object.assign(markerElement.style, markerStyles);

        // Check if AdvancedMarkerElement is available
        const AdvancedMarkerElement = window.google.maps.marker?.AdvancedMarkerElement;
        
        if (!AdvancedMarkerElement) {
          console.warn('AdvancedMarkerElement not available, falling back to standard marker');
          return new window.google.maps.Marker({
            position: org.coordinates,
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
          position: org.coordinates,
          content: markerElement,
          title: org.name
        });

        marker.addListener('click', () => {
          setSelectedOrg(org);
        });

        return marker;
      });

      setMarkers(newMarkers);
    }
  }, [isLoaded, map, organizations]);

  // Clean up markers on unmount
  useEffect(() => {
    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, [markers]);

  const onLoad = useCallback((map) => {
    setMap(map);
    
    // Create bounds from all organization markers
    if (organizations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add all organization coordinates to bounds
      organizations.forEach(org => {
        if (org.coordinates) {
          bounds.extend(org.coordinates);
          console.log(`Added to bounds: ${JSON.stringify(org.coordinates)}`);
        }
      });
      
      // If we only have one organization, add some padding around it
      if (organizations.length === 1) {
        const org = organizations[0];
        const lat = org.coordinates.lat;
        const lng = org.coordinates.lng;
        // Add points around the single point to create a small area
        bounds.extend({ lat: lat + 1, lng: lng + 1 });
        bounds.extend({ lat: lat - 1, lng: lng - 1 });
        console.log("Added padding for single organization view");
      }

      setBounds(bounds);
      
      // Fit the map to the bounds
      map.fitBounds(bounds);
      
      // If we have a small number of markers, set an appropriate zoom level
      if (organizations.length <= 3) {
        // Wait for bounds to be applied, then set a reasonable zoom level
        setTimeout(() => {
          const currentZoom = map.getZoom();
          if (currentZoom > 10) {
            map.setZoom(5); // Set a reasonable zoom level if it's too zoomed in
            console.log(`Adjusted zoom from ${currentZoom} to 5 for better view`);
          }
        }, 100);
      }
    } else {
      // Set default view for no organizations
      map.setCenter(defaultCenter);
      map.setZoom(2);
    }
  }, [organizations]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const parseCoordinates = (locationString) => {
    if (!locationString) return null;
    try {
      // Try to split by comma first
      let lat, lng;
      
      // Handle different formats of coordinates
      if (locationString.includes(',')) {
        [lat, lng] = locationString.split(',').map(coord => {
          const num = parseFloat(coord.trim());
          return isNaN(num) ? null : num;
        });
      } else if (locationString.includes(' ')) {
        // Try space-separated format
        [lat, lng] = locationString.split(' ').map(coord => {
          const num = parseFloat(coord.trim());
          return isNaN(num) ? null : num;
        });
      }
      
      // Validate coordinates
      if (lat === null || lng === null) {
        console.log(`Invalid coordinates parsed from "${locationString}": lat=${lat}, lng=${lng}`);
        return null;
      }
      
      // Swap coordinates if they seem reversed (lat must be between -90 and 90)
      if (lat > 90 || lat < -90) {
        console.log(`Coordinates may be reversed, attempting to swap: ${lat},${lng}`);
        // Try swapping
        if (lng >= -90 && lng <= 90 && lat >= -180 && lat <= 180) {
          const temp = lat;
          lat = lng;
          lng = temp;
          console.log(`Swapped coordinates: ${lat},${lng}`);
        } else {
          console.log(`Coordinates invalid even after swapping: ${lat},${lng}`);
          return null;
        }
      }
      
      // Final validation
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.log(`Coordinates out of range: ${lat},${lng}`);
        return null;
      }
      
      return { lat, lng };
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return null;
    }
  };

  const fetchOrganizations = async () => {
    try {
      const result = await API.graphql({
        query: queries.listOrganizations,
        variables: {
          filter: {
            _deleted: { ne: true }
          }
        }
      });
      
      const allOrgs = result.data.listOrganizations.items;
      console.log('Fetched all organizations:', allOrgs);
      
      // Count organizations with any location data
      const orgsWithAnyLocation = allOrgs.filter(org => org.location || org.coordinates);
      console.log(`Organizations with any location data: ${orgsWithAnyLocation.length}`);
      
      // Process organizations with location data
      const orgsWithLocation = orgsWithAnyLocation
        .map(org => {
          // First try to use coordinates field if available
          if (org.coordinates) {
            try {
              const [lat, lng] = org.coordinates.split(',').map(coord => parseFloat(coord.trim()));
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                console.log(`Valid coordinates from coordinates field for "${org.name}": ${lat},${lng}`);
                return {
                  ...org,
                  coordinates: { lat, lng }
                };
              } else {
                console.log(`Invalid coordinates in coordinates field for "${org.name}": ${org.coordinates}`);
              }
            } catch (error) {
              console.log(`Error parsing coordinates field for "${org.name}": ${error.message}`);
            }
          }
          
          // Fallback to parsing location field if needed
          if (org.location) {
            const coordinates = parseCoordinates(org.location);
            if (coordinates) {
              console.log(`Valid coordinates for "${org.name}" from location field: ${JSON.stringify(coordinates)}`);
              return {
                ...org,
                coordinates
              };
            } else {
              console.log(`Could not parse coordinates for "${org.name}" from location "${org.location}"`);
              return null;
            }
          }
          
          return null;
        })
        .filter(org => org !== null);

      console.log(`Found ${orgsWithLocation.length} organizations with valid coordinates out of ${allOrgs.length} total`);
      setOrganizations(orgsWithLocation);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Update bounds when organizations change
  useEffect(() => {
    if (map && organizations.length > 0) {
      const newBounds = new window.google.maps.LatLngBounds();
      
      // Add all coordinates to bounds
      organizations.forEach(org => {
        if (org.coordinates) {
          newBounds.extend(org.coordinates);
        }
      });
      
      // Add padding for single organization
      if (organizations.length === 1) {
        const org = organizations[0];
        const lat = org.coordinates.lat;
        const lng = org.coordinates.lng;
        newBounds.extend({ lat: lat + 1, lng: lng + 1 });
        newBounds.extend({ lat: lat - 1, lng: lng - 1 });
      }
      
      setBounds(newBounds);
      map.fitBounds(newBounds);
      
      // Adjust zoom for small number of organizations
      if (organizations.length <= 3) {
        setTimeout(() => {
          const currentZoom = map.getZoom();
          if (currentZoom > 10) {
            map.setZoom(5);
          }
        }, 100);
      }
    }
  }, [map, organizations]);

  return (
    <Container fluid className="p-0">
      <Card className="shadow-sm border-0 rounded-0">
        <Card.Header className="bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faBuilding} className="text-primary me-2" />
              <h5 className="mb-0">Global Organization Overview</h5>
            </div>
            <small className="text-muted">
              {organizations.length} {organizations.length === 1 ? 'Organization' : 'Organizations'} with location data
            </small>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoaded ? (
            <>
              {organizations.length === 0 && !loading && (
                <div className="alert alert-warning m-3">
                  <p className="mb-1">No organizations with valid location coordinates found.</p>
                  <p className="mb-0 small">To add location data to organizations:</p>
                  <ul className="small mb-0">
                    <li>Use the Organization Management page to set a location using Google Places</li>
                    <li>The system will automatically save both the address and coordinates</li>
                    <li>Coordinates must be in a valid format (latitude between -90 and 90, longitude between -180 and 180)</li>
                  </ul>
                </div>
              )}
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
                      maxWidth: 320
                    }}
                  >
                    <div className="p-2" style={{ minWidth: '220px', maxWidth: '320px' }}>
                      <h6 className="mb-1">{selectedOrg.name || 'Unnamed Organization'}</h6>
                      <div className="mb-2">
                        <small className="text-muted">ID: {selectedOrg.id?.substring(0, 8)}...</small>
                      </div>
                      
                      <div className="mb-2">
                        <strong className="d-block mb-1 small">Contact Info:</strong>
                        {selectedOrg.contactEmail && (
                          <p className="mb-1 small">
                            <strong>Email:</strong> {selectedOrg.contactEmail}
                          </p>
                        )}
                        {selectedOrg.contactPhone && (
                          <p className="mb-1 small">
                            <strong>Phone:</strong> {selectedOrg.contactPhone}
                          </p>
                        )}
                        {!selectedOrg.contactEmail && !selectedOrg.contactPhone && (
                          <p className="mb-1 small text-muted">No contact information available</p>
                        )}
                      </div>
                      
                      <div className="mb-2">
                        <strong className="d-block mb-1 small">Location:</strong>
                        {selectedOrg.city && selectedOrg.state && selectedOrg.country ? (
                          <p className="mb-1 small">
                            {[selectedOrg.city, selectedOrg.state, selectedOrg.country].filter(Boolean).join(', ')}
                          </p>
                        ) : selectedOrg.location ? (
                          <p className="mb-1 small">
                            {selectedOrg.location}
                          </p>
                        ) : (
                          <p className="mb-1 small text-muted">
                            No detailed location information
                          </p>
                        )}
                      </div>
                      
                      <div className="mb-0">
                        <strong className="d-block mb-1 small">Status:</strong>
                        <p className="mb-0 small">
                          <span className={`badge ${selectedOrg.isActive ? 'bg-success' : 'bg-danger'} me-1`}>
                            {selectedOrg.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {selectedOrg.isPaid && (
                            <span className="badge bg-warning text-dark me-1">Paid</span>
                          )}
                          {selectedOrg.type && (
                            <span className="badge bg-info me-1">{selectedOrg.type}</span>
                          )}
                        </p>
                      </div>
                      
                      {selectedOrg.createdAt && (
                        <div className="mt-2 pt-2 border-top">
                          <small className="text-muted">
                            Created: {new Date(selectedOrg.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </>
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

export default GlobalOrganizationMap; 