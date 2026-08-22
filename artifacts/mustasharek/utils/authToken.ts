import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/contexts/AuthContext";

const JWT_KEY = "mustasharek_jwt_v1";

export async function getUsableAuthToken(_user: User | null, forceRefresh = false): Promise<string | null> {
  if (forceRefresh) {
    await AsyncStorage.removeItem(JWT_KEY).catch(() => {});
    return null;
  }
  return AsyncStorage.getItem(JWT_KEY).catch(() => null);
}
