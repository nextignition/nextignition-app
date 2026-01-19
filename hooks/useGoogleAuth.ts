import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Complete OAuth flow in browser
WebBrowser.maybeCompleteAuthSession();

export interface GoogleTokenStatus {
  isConnected: boolean;
  isValid: boolean;
  expiresAt: string | null;
}

export function useGoogleAuth() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<GoogleTokenStatus>({
    isConnected: false,
    isValid: false,
    expiresAt: null,
  });
  const checkingRef = useRef(false);

  // Check if user has Google tokens
  const checkGoogleConnection = useCallback(async () => {
    if (!user?.id) {
      setTokenStatus({ isConnected: false, isValid: false, expiresAt: null });
      setChecking(false);
      return;
    }

    if (checkingRef.current) {
      return;
    }

    checkingRef.current = true;
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('user_google_tokens')
        .select('expires_at')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setTokenStatus({ isConnected: false, isValid: false, expiresAt: null });
        return;
      }

      const expiresAt = new Date(data.expires_at);
      const isValid = expiresAt > new Date();

      setTokenStatus({
        isConnected: true,
        isValid,
        expiresAt: data.expires_at,
      });
    } catch (err) {
      console.error('Error checking Google connection:', err);
      setTokenStatus({ isConnected: false, isValid: false, expiresAt: null });
    } finally {
      setChecking(false);
      checkingRef.current = false;
    }
  }, [user?.id]);

  // Refresh token if expired
  const refreshToken = useCallback(async () => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('refresh-google-token', {
        body: {},
      });

      if (error) {
        throw new Error(error.message || 'Failed to refresh token');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to refresh token');
      }

      // Recheck connection status
      await checkGoogleConnection();

      return { success: true };
    } catch (err: any) {
      console.error('Error refreshing token:', err);
      return { success: false, error: err.message || 'Failed to refresh token' };
    } finally {
      setLoading(false);
    }
  }, [user, checkGoogleConnection]);

  // Initiate Google OAuth flow
  const connectGoogle = useCallback(async () => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    try {
      // Get OAuth URL from edge function (which has access to client_id from Supabase secrets)
      const { data: session } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      // Determine redirect URI based on platform
      // IMPORTANT: Google Cloud Console only accepts HTTP/HTTPS URLs, not custom schemes like exp://
      // CRITICAL: The redirect URI MUST EXACTLY match what's configured in Google Cloud Console
      let redirectUri = '';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.location?.origin) {
          // Use the exact current origin + /google-callback path
          redirectUri = `${window.location.origin}/google-callback`;
          console.log('🌐 Web Platform Detected');
          console.log('📍 Current URL:', window.location.href);
          console.log('📍 Origin:', window.location.origin);
          console.log('🔗 Redirect URI:', redirectUri);
          console.log('⚠️  CRITICAL: This EXACT URI must be added to Google Cloud Console:');
          console.log('   ', redirectUri);
        } else {
          throw new Error('Unable to determine redirect URI. Please check your configuration.');
        }
      } else {
        // For mobile/Expo, use HTTP localhost (Google accepts this)
        // This works for Expo development and can be accessed via WebBrowser
        // For production, you'd use your actual domain
        redirectUri = 'http://localhost:8081/google-callback';
        console.log('📱 Mobile/Expo Platform Detected');
        console.log('🔗 Redirect URI:', redirectUri);
        console.log('⚠️  CRITICAL: Add this EXACT URI to Google Cloud Console:');
        console.log('   ', redirectUri);
      }

      if (!redirectUri) {
        throw new Error('Unable to determine redirect URI. Please check your configuration.');
      }

      // Get OAuth URL from edge function (this function has access to GOOGLE_OAUTH_CLIENT_ID)
      const { data: initiateData, error: initiateError } = await supabase.functions.invoke('google-oauth-initiate', {
        body: {
          redirect_uri: redirectUri,
        },
      });

      if (initiateError) {
        console.error('Initiate error:', initiateError);
        throw new Error(initiateError.message || 'Failed to initiate OAuth flow. Please check your Google OAuth configuration in Supabase.');
      }

      if (!initiateData || !initiateData.success || !initiateData.authUrl) {
        const errorMsg = initiateData?.error || 'Failed to get OAuth URL. Please check that GOOGLE_OAUTH_CLIENT_ID is set in Supabase Edge Function secrets.';
        console.error('Initiate data error:', initiateData);
        throw new Error(errorMsg);
      }

      const authUrl = initiateData.authUrl;
      const finalRedirectUri = initiateData.redirectUri || redirectUri;
      
      // Log debug info if available
      if (initiateData.debug) {
        console.log('📋 Debug Info from Edge Function:');
        console.log('   Redirect URI:', initiateData.debug.redirectUri);
        console.log('   Client ID Configured:', initiateData.debug.clientIdConfigured);
        console.log('   Instructions:', initiateData.debug.instructions);
      }

      // Validate that authUrl contains client_id
      if (!authUrl.includes('client_id=') || authUrl.includes('client_id=&')) {
        throw new Error('OAuth URL is missing client_id. Please set GOOGLE_OAUTH_CLIENT_ID in Supabase Edge Function secrets.');
      }

      // Open in browser
      if (Platform.OS === 'web') {
        // For web, redirect directly
        if (typeof window !== 'undefined') {
          window.location.href = authUrl;
        }
        return { success: true, message: 'Redirecting to Google...' };
      } else {
        // For mobile/Expo, use WebBrowser with HTTP redirect URI
        // The redirect will go to http://localhost:8081/google-callback
        // which Expo can intercept and route to our app
        const result = await WebBrowser.openAuthSessionAsync(authUrl, finalRedirectUri);
        
        if (result.type === 'success' && result.url) {
          // Extract code from URL
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          
          if (!code) {
            throw new Error('No authorization code received');
          }

          // Exchange code for tokens via edge function
          const { data: callbackData, error: callbackError } = await supabase.functions.invoke('google-oauth-callback', {
            body: {
              code,
              redirect_uri: finalRedirectUri,
            },
          });

          if (callbackError) {
            throw new Error(callbackError.message || 'Failed to connect Google');
          }

          if (!callbackData.success) {
            throw new Error(callbackData.error || 'Failed to connect Google');
          }

          // Recheck connection
          await checkGoogleConnection();

          return { success: true, message: 'Google Calendar connected successfully!' };
        } else if (result.type === 'cancel') {
          return { success: false, error: 'OAuth flow cancelled by user' };
        } else {
          return { success: false, error: 'OAuth flow failed. Please try again.' };
        }
      }
    } catch (err: any) {
      console.error('Error connecting Google:', err);
      return { success: false, error: err.message || 'Failed to connect Google' };
    } finally {
      setLoading(false);
    }
  }, [user, checkGoogleConnection]);

  // Get valid access token (refresh if needed)
  const getAccessToken = useCallback(async () => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Check current token
      const { data: tokenData, error: fetchError } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError || !tokenData) {
        return { success: false, error: 'Google not connected' };
      }

      // Check if token is expired (with 5 minute buffer)
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      const buffer = 5 * 60 * 1000; // 5 minutes

      if (expiresAt.getTime() - now.getTime() < buffer) {
        // Token expired or expiring soon, refresh it
        const refreshResult = await refreshToken();
        if (!refreshResult.success) {
          return { success: false, error: refreshResult.error || 'Failed to refresh token' };
        }

        // Get refreshed token
        const { data: refreshedToken, error: refreshedError } = await supabase
          .from('user_google_tokens')
          .select('access_token')
          .eq('user_id', user.id)
          .single();

        if (refreshedError || !refreshedToken) {
          return { success: false, error: 'Failed to get refreshed token' };
        }

        return { success: true, accessToken: refreshedToken.access_token };
      }

      return { success: true, accessToken: tokenData.access_token };
    } catch (err: any) {
      console.error('Error getting access token:', err);
      return { success: false, error: err.message || 'Failed to get access token' };
    }
  }, [user?.id, refreshToken]);

  return {
    tokenStatus,
    checking,
    loading,
    connectGoogle,
    refreshToken,
    getAccessToken,
    checkGoogleConnection,
  };
}

