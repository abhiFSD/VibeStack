import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuthenticator } from '@aws-amplify/ui-react-native';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const { signUp } = useAuthenticator();

  const handleSignUp = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await signUp({
        username,
        password,
        attributes: { 
          email: username, 
          name: 'Default Name'
        } 
      });
      navigation.navigate('SignIn');
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error.message || 'An error occurred during sign up');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        secureTextEntry
        onChangeText={setConfirmPassword}
        style={styles.input}
        mode="outlined"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button mode="contained" onPress={handleSignUp} style={styles.button}>
        Sign Up
      </Button>
      <Text
        onPress={() => navigation.navigate('SignIn')}
        style={styles.link}
      >
        Already have an account? Sign In
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... existing styles ...
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default SignUp;