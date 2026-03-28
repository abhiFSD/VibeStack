import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Home from '../screens/Home';
import Assessment from '../screens/AssessmentHistory/AssessmentHistory';
import Learnings from '../screens/Learnings';
import ProfileScreen from '../screens/ProfileScreen';
import TakeAssessment from '../screens/TakeAssessment';
import AssessmentDetails from '../screens/AssessmentHistory/AssessmentDetails';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Assessment') {
            iconName = 'clipboard-text';
          } else if (route.name === 'Learnings') {
            iconName = 'school';
          }

          return <IconButton icon={iconName} size={size} color={color} />;
        },
        headerRight: () => (
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <IconButton icon="account" size={24} />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Assessment" component={Assessment} />
      <Tab.Screen name="Learnings" component={Learnings} />
    </Tab.Navigator>
  );
}

export default function BottomTabNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Main" 
        component={TabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TakeAssessment" 
        component={TakeAssessment} 
        options={{ headerTitle: 'Take Assessment' }}
      />
      <Stack.Screen 
        name="AssessmentDetails" 
        component={AssessmentDetails}
        options={{ title: 'Assessment Details' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}