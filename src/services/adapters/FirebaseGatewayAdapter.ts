import type { User } from '@/types';
import type { Settings } from '@/types/Settings';
import type { FirebaseGatewayPort } from '../ports/FirebaseGatewayPort';
import { handleUser, sendRoomSettingsMessage } from '@/services/roomSettingsService';
import sendGameSettingsMessage from '@/services/gameSettingsMessage';

export function makeFirebaseGatewayAdapter(
  user: User | null,
  updateAuthUser: (displayName: string) => Promise<User | null>
): FirebaseGatewayPort {
  return {
    updateUser: (displayName: string) => handleUser(user, displayName, updateAuthUser),
    sendRoomSettings: (formData: Settings, updatedUser: User) =>
      sendRoomSettingsMessage(formData, updatedUser),
    sendGameSettings: (opts) => sendGameSettingsMessage(opts).then(() => undefined),
  };
}
