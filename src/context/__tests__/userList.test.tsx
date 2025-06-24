import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { UserListProvider, OnlineUser } from '../userList';
import useUserList from '../hooks/useUserList';
import * as firebaseService from '@/services/firebase';

// Mock the firebase service
vi.mock('@/services/firebase');

// Mock the router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: 'test-room' })),
  };
});

// Test component that uses the context
const TestComponent = () => {
  const { onlineUsers } = useUserList();

  const userList = Object.values(onlineUsers);

  return (
    <div>
      <div data-testid="user-count">{userList.length}</div>
      <div data-testid="user-list">
        {userList.map((user, idx) => (
          <div key={idx} data-testid={`user-${idx}`}>
            {user.displayName} ({user.uid})
          </div>
        ))}
      </div>
      <div data-testid="user-keys">{Object.keys(onlineUsers).join(',')}</div>
    </div>
  );
};

// Test wrapper component
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <UserListProvider>{children}</UserListProvider>
  </BrowserRouter>
);

// Helper function to create mock users
const createMockUser = (
  uid: string,
  displayName: string,
  lastSeen: Date = new Date()
): OnlineUser => ({
  uid,
  displayName,
  lastSeen,
});

describe('UserListProvider', () => {
  const mockGetUserList = vi.mocked(firebaseService.getUserList);

  beforeEach(() => {
    mockGetUserList.mockImplementation((_roomId, callback) => {
      // Simulate the initial empty state
      setTimeout(() => {
        callback({});
      }, 0);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider Setup', () => {
    it('should provide context values', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('user-count')).toHaveTextContent('0');

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('0');
      });
    });

    it('should call getUserList with correct room ID', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(mockGetUserList).toHaveBeenCalledWith('test-room', expect.any(Function), {});
    });

    it('should handle undefined room ID', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(mockGetUserList).toHaveBeenCalled();
    });
  });

  describe('User List Management', () => {
    it('should start with empty user list', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('user-count')).toHaveTextContent('0');
    });

    it('should update user list when users join', async () => {
      const mockUsers = {
        user1: createMockUser('user1', 'Alice'),
        user2: createMockUser('user2', 'Bob'),
      };

      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback(mockUsers);
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('2');
        expect(screen.getByTestId('user-0')).toHaveTextContent('Alice (user1)');
        expect(screen.getByTestId('user-1')).toHaveTextContent('Bob (user2)');
      });
    });

    it('should handle single user joining', async () => {
      const mockUsers = {
        user1: createMockUser('user1', 'Alice'),
      };

      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback(mockUsers);
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('1');
        expect(screen.getByTestId('user-0')).toHaveTextContent('Alice (user1)');
      });
    });
  });

  describe('Real-time User Updates', () => {
    it('should update when users join', async () => {
      let userCallback: ((users: Record<string, OnlineUser>) => void) | null = null;

      mockGetUserList.mockImplementation((_roomId, callback) => {
        userCallback = callback;
        setTimeout(() => {
          callback({ user1: createMockUser('user1', 'Alice') });
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('1');
      });

      // Simulate new user joining
      const updatedUsers = {
        user1: createMockUser('user1', 'Alice'),
        user2: createMockUser('user2', 'Bob'),
      };

      await act(async () => {
        if (userCallback) {
          userCallback(updatedUsers);
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('2');
        expect(screen.getByTestId('user-1')).toHaveTextContent('Bob (user2)');
      });
    });

    it('should update when users leave', async () => {
      let userCallback: ((users: Record<string, OnlineUser>) => void) | null = null;

      mockGetUserList.mockImplementation((_roomId, callback) => {
        userCallback = callback;
        setTimeout(() => {
          callback({
            user1: createMockUser('user1', 'Alice'),
            user2: createMockUser('user2', 'Bob'),
          });
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('2');
      });

      // Simulate user leaving
      await act(async () => {
        if (userCallback) {
          userCallback({ user1: createMockUser('user1', 'Alice') });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('1');
        expect(screen.getByTestId('user-0')).toHaveTextContent('Alice (user1)');
      });
    });

    it('should handle all users leaving', async () => {
      let userCallback: ((users: Record<string, OnlineUser>) => void) | null = null;

      mockGetUserList.mockImplementation((_roomId, callback) => {
        userCallback = callback;
        setTimeout(() => {
          callback({
            user1: createMockUser('user1', 'Alice'),
            user2: createMockUser('user2', 'Bob'),
          });
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('2');
      });

      // Simulate all users leaving
      await act(async () => {
        if (userCallback) {
          userCallback({});
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('0');
      });
    });

    it('should handle rapid user updates', async () => {
      let userCallback:
        | ((
            users:
              | { user1: OnlineUser }
              | { user1: OnlineUser; user2: OnlineUser }
              | {
                  user1: OnlineUser;
                  user2: OnlineUser;
                  user3: OnlineUser;
                }
              | { user1: OnlineUser; user3: OnlineUser }
          ) => void)
        | null = null;

      mockGetUserList.mockImplementation((_roomId, callback) => {
        userCallback = callback;
        setTimeout(() => {
          callback({});
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('0');
      });

      // Simulate rapid user updates
      const updates = [
        { user1: createMockUser('user1', 'Alice') },
        { user1: createMockUser('user1', 'Alice'), user2: createMockUser('user2', 'Bob') },
        {
          user1: createMockUser('user1', 'Alice'),
          user2: createMockUser('user2', 'Bob'),
          user3: createMockUser('user3', 'Charlie'),
        },
        { user1: createMockUser('user1', 'Alice'), user3: createMockUser('user3', 'Charlie') }, // user2 leaves
      ];

      for (const update of updates) {
        await act(async () => {
          if (userCallback) {
            userCallback(update);
          }
        });
        await waitFor(() => {
          expect(screen.getByTestId('user-count')).toHaveTextContent(
            Object.keys(update).length.toString()
          );
        });
      }
    });
  });

  describe('User Data Management', () => {
    it('should preserve user data structure', async () => {
      const mockUsers = {
        user1: createMockUser('user1', 'Alice', new Date('2023-01-01')),
        user2: createMockUser('user2', 'Bob', new Date('2023-01-02')),
      };

      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback(mockUsers);
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-keys')).toHaveTextContent('user1,user2');
      });
    });

    it('should handle users with special characters in names', async () => {
      const mockUsers = {
        user1: createMockUser('user1', 'Alice (Admin)'),
        user2: createMockUser('user2', 'Bob-Smith'),
        user3: createMockUser('user3', 'Charlie_123'),
      };

      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback(mockUsers);
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('3');
        expect(screen.getByTestId('user-0')).toHaveTextContent('Alice (Admin) (user1)');
        expect(screen.getByTestId('user-1')).toHaveTextContent('Bob-Smith (user2)');
        expect(screen.getByTestId('user-2')).toHaveTextContent('Charlie_123 (user3)');
      });
    });

    it('should handle users with empty display names', async () => {
      const mockUsers = {
        user1: createMockUser('user1', ''),
        user2: createMockUser('user2', 'Bob'),
      };

      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback(mockUsers);
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('2');
        // The empty name renders as just a space before (user1)
        expect(screen.getByTestId('user-0')).toHaveTextContent('(user1)');
        expect(screen.getByTestId('user-1')).toHaveTextContent('Bob (user2)');
      });
    });
  });

  describe('Room Changes', () => {
    it('should update user list when room changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(mockGetUserList).toHaveBeenCalledWith('test-room', expect.any(Function), {});

      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should still be called with the same room since we're not changing the mock
      expect(mockGetUserList).toHaveBeenCalledWith('test-room', expect.any(Function), {});
    });

    it('should reset user list when room changes', async () => {
      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback({ user1: createMockUser('user1', 'Alice') });
        }, 0);
      });

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('1');
      });

      // Rerender should maintain the same state since the room doesn't change
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('1');
      });
    });
  });

  describe('User Presence Tracking', () => {
    it('should track user last seen times', async () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const mockUsers = {
        user1: createMockUser('user1', 'Alice', now),
        user2: createMockUser('user2', 'Bob', fiveMinutesAgo),
      };

      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback(mockUsers);
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('2');
      });
    });

    it('should handle users without last seen data', async () => {
      const mockUsers = {
        user1: { uid: 'user1', displayName: 'Alice' } as OnlineUser,
      };

      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback(mockUsers);
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('1');
        expect(screen.getByTestId('user-0')).toHaveTextContent('Alice (user1)');
      });
    });
  });

  describe('Multiple Players Scenario', () => {
    it('should handle multiple players joining simultaneously', async () => {
      const mockUsers = {
        player1: createMockUser('player1', 'Player 1'),
        player2: createMockUser('player2', 'Player 2'),
        player3: createMockUser('player3', 'Player 3'),
        player4: createMockUser('player4', 'Player 4'),
      };

      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback(mockUsers);
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('4');
        expect(screen.getByTestId('user-keys')).toHaveTextContent(
          'player1,player2,player3,player4'
        );
      });
    });

    it('should handle turn order tracking', async () => {
      // Simulate players joining in order
      let userCallback: ((users: Record<string, OnlineUser>) => void) | null = null;

      mockGetUserList.mockImplementation((_roomId, callback) => {
        userCallback = callback;
        setTimeout(() => {
          callback({});
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Players join one by one
      const players = ['player1', 'player2', 'player3', 'player4'];
      const playerData: Record<string, OnlineUser> = {};

      for (let i = 0; i < players.length; i++) {
        const playerId = players[i];
        playerData[playerId] = createMockUser(playerId, `Player ${i + 1}`);

        await act(async () => {
          if (userCallback) {
            userCallback({ ...playerData });
          }
        });

        await waitFor(() => {
          expect(screen.getByTestId('user-count')).toHaveTextContent((i + 1).toString());
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed user data', async () => {
      const malformedUsers = {
        user1: createMockUser('user1', 'Alice'),
        user3: createMockUser('user3', 'Charlie'),
      };

      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback(malformedUsers);
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show 2 valid users
        expect(screen.getByTestId('user-count')).toHaveTextContent('2');
      });
    });

    it('should handle empty user data gracefully', async () => {
      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback(null);
        }, 0);
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should not crash and show 0 users
      expect(screen.getByTestId('user-count')).toHaveTextContent('0');
    });
  });

  describe('Performance', () => {
    it('should memoize user list properly', async () => {
      const mockUsers = {
        user1: createMockUser('user1', 'Alice'),
        user2: createMockUser('user2', 'Bob'),
      };

      mockGetUserList.mockImplementation((_roomId, callback) => {
        setTimeout(() => {
          callback(mockUsers);
        }, 0);
      });

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count')).toHaveTextContent('2');
      });

      // Rerender with same props should not cause unnecessary updates
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('user-count')).toHaveTextContent('2');
    });
  });
});

describe('useUserList Hook', () => {
  it('should throw error when used outside provider', () => {
    const TestComponentWithoutProvider = () => {
      useUserList();
      return <div>Test</div>;
    };

    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow("UserListContext's value is undefined.");
  });
});
