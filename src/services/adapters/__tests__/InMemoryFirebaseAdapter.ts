import { vi } from 'vitest';
import type { User } from '@/types';
import type { FirebaseGatewayPort } from '../../ports/FirebaseGatewayPort';

export function makeInMemoryFirebaseAdapter(cannedUser: User | null = null): FirebaseGatewayPort & {
  updateUser: ReturnType<typeof vi.fn>;
  sendRoomSettings: ReturnType<typeof vi.fn>;
  sendGameSettings: ReturnType<typeof vi.fn>;
} {
  return {
    updateUser: vi.fn().mockResolvedValue(cannedUser),
    sendRoomSettings: vi.fn().mockResolvedValue(undefined),
    sendGameSettings: vi.fn().mockResolvedValue(undefined),
  };
}
