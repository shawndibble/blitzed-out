import type { User } from '@/types';
import type { Settings } from '@/types/Settings';
import type { TileExport } from '@/types/gameBoard';
import type { CustomTilePull } from '@/types/customTiles';

export interface SendGameSettingsOpts {
  title: string;
  formData: Settings;
  user: User;
  actionsList: any;
  tiles: TileExport[];
  customTiles?: CustomTilePull[];
}

/**
 * Port for all network writes that reach Firebase.
 * Decision-driving read state (messages, dedup window) stays in SubmitContext.
 */
export interface FirebaseGatewayPort {
  updateUser(displayName: string): Promise<User | null>;
  sendRoomSettings(formData: Settings, user: User): Promise<void>;
  sendGameSettings(opts: SendGameSettingsOpts): Promise<void>;
}
