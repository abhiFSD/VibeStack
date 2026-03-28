import { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';

export const useCurrentUser = () => {
  const [userSub, setUserSub] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setUserSub(user.attributes.sub);
        setUserEmail(user.attributes.email);
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initUser();
  }, []);

  return { userSub, userEmail, isLoading };
};