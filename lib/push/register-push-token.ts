import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

const PUSH_TOKEN_STORAGE_KEY = 'barberq.current-device-push-token';
const UNIQUE_VIOLATION_ERROR_CODE = '23505';

async function getStoredPushToken() {
  const pushToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);

  if (pushToken == null || pushToken.length === 0) {
    return null;
  }

  return pushToken;
}

async function clearStoredPushToken() {
  await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
}

function getProjectId() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;

  if (typeof projectId !== 'string' || projectId.length === 0) {
    return null;
  }

  return projectId;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: 'Default',
    sound: 'default',
  });
}

async function getGrantedPermissionStatus() {
  const existingPermissions = await Notifications.getPermissionsAsync();

  if (existingPermissions.status === 'granted') {
    return existingPermissions.status;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return requestedPermissions.status;
}

async function deleteStoredPushTokenRow(userId: string, pushToken: string) {
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('expo_push_token', pushToken);

  if (error != null) {
    throw error;
  }
}

export async function registerPushToken(userId: string) {
  if (!Device.isDevice) {
    return null;
  }

  const projectId = getProjectId();

  if (projectId == null) {
    console.warn('Skipping push registration because EAS project ID is missing.');
    return null;
  }

  await ensureAndroidChannel();

  const permissionStatus = await getGrantedPermissionStatus();

  if (permissionStatus !== 'granted') {
    return null;
  }

  const previousPushToken = await getStoredPushToken();
  const pushTokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const currentPushToken = pushTokenResponse.data.trim();

  if (currentPushToken.length === 0) {
    return null;
  }

  if (previousPushToken != null && previousPushToken !== currentPushToken) {
    await deleteStoredPushTokenRow(userId, previousPushToken);
  }

  const { error } = await supabase.from('push_tokens').insert({
    expo_push_token: currentPushToken,
    user_id: userId,
  });

  if (error != null && error.code !== UNIQUE_VIOLATION_ERROR_CODE) {
    throw error;
  }

  await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, currentPushToken);

  return currentPushToken;
}

export async function unregisterPushToken(userId: string) {
  const pushToken = await getStoredPushToken();

  if (pushToken == null) {
    return;
  }

  await deleteStoredPushTokenRow(userId, pushToken);
  await clearStoredPushToken();
}

export async function clearStoredPushTokenForSession() {
  await clearStoredPushToken();
}
