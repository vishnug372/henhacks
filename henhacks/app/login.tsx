import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>🤠</Text>
        </View>

        <Text style={styles.title}>HenHacks</Text>
        <Text style={styles.subtitle}>Trading Post</Text>
        <Text style={styles.tagline}>Howdy, partner. Sign in to start tradin'.</Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={login}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF8E7" />
          ) : (
            <Text style={styles.loginButtonText}>Login with Auth0</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By logging in you agree to our terms and trail code.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  badge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FDF1D6',
    borderWidth: 3,
    borderColor: '#C4A265',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#3B2A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#3B2A1A',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B6914',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: -8,
  },
  tagline: {
    fontSize: 15,
    color: '#5C4A32',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  loginButton: {
    backgroundColor: '#8B6914',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3B2A1A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFF8E7',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 12,
    color: '#A0896B',
    textAlign: 'center',
    marginTop: 8,
  },
});
