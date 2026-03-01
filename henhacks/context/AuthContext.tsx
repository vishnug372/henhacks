import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID } from '../lib/auth0';
import { upsertUser } from '../lib/firebase';

WebBrowser.maybeCompleteAuthSession();

// ─── Types ──────────────────────────────────────────────────────
export interface Auth0User {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextValue {
  user: Auth0User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

// ─── Discovery ──────────────────────────────────────────────────
const discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/v2/logout`,
};

// ─── Context ────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: false,
  login: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Provider ───────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Auth0User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'exp' });
  console.log('Auth0 redirect URI:', redirectUri);

  const [, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      scopes: ['openid', 'profile', 'email'],
      extraParams: {
        audience: `https://${AUTH0_DOMAIN}/userinfo`,
      },
    },
    discovery
  );

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      fetchUserInfo(access_token);
    }
  }, [response]);

  const fetchUserInfo = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile: Auth0User = await res.json();
      setUser(profile);
      await upsertUser(profile);
    } catch (e) {
      console.error('Failed to fetch Auth0 user info:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
