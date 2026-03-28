import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react-native';
import awsconfig from './src/aws-exports';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';

Amplify.configure(awsconfig);

function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Authenticator.Provider>
          <Authenticator>
            <BottomTabNavigator />
          </Authenticator>
        </Authenticator.Provider>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default App;