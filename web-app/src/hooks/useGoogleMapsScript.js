import { useLoadScript } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES = ['places', 'marker'];

export const useGoogleMapsScript = () => {
  return useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES
  });
};

export default useGoogleMapsScript; 