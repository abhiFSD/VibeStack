import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Button, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthenticator } from '@aws-amplify/ui-react-native';

const SignIn = () => {
  console.log('SignIn component rendering');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const { signIn } = useAuthenticator();

  const handleSignIn = async () => {
    setError('');
    try {
      await signIn({ username, password });
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message || 'An error occurred during sign in');
    }
  };

  console.log('Before return statement');
  return (
    <View style={styles.container}>
      {console.log('Inside return statement')}
      <Text style={styles.debugText}>Debug: SignIn Component</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button title="Sign In" onPress={handleSignIn} />
      <Text
        onPress={() => navigation.navigate('SignUp')}
        style={styles.link}
      >
        Don't have an account? Sign Up
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  debugText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    color: '#6200ee',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default SignIn;