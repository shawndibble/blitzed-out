import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CALL_QUALITY_WARNING_PARTICIPANTS, MAX_CALL_PARTICIPANTS } from '@/config/webrtc';
import { useCallPresenceStore } from '@/stores/callPresenceStore';
import CallCapacityAlert from '../CallCapacityAlert';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/** Put the passive presence store at a given count, as a live snapshot would. */
function presenceAt(count: number) {
  useCallPresenceStore.setState({ count, capacityCount: count, loaded: true });
}

/** Everyone still holds a slot, but some have dropped off the badge's window. */
function presenceSplit(count: number, capacityCount: number) {
  useCallPresenceStore.setState({ count, capacityCount, loaded: true });
}

describe('CallCapacityAlert', () => {
  beforeEach(() => {
    useCallPresenceStore.setState({ count: 0, capacityCount: 0, loaded: false });
  });

  test('says nothing below the warning threshold', () => {
    presenceAt(CALL_QUALITY_WARNING_PARTICIPANTS - 1);
    render(<CallCapacityAlert />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('warns about quality once the call gets crowded', () => {
    presenceAt(CALL_QUALITY_WARNING_PARTICIPANTS);
    render(<CallCapacityAlert />);

    expect(screen.getByText('videoCall.capacity.warning')).toBeInTheDocument();
  });

  test('escalates to full at the cap', () => {
    presenceAt(MAX_CALL_PARTICIPANTS);
    render(<CallCapacityAlert />);

    expect(screen.getByText('videoCall.capacity.full')).toBeInTheDocument();
    expect(screen.queryByText('videoCall.capacity.warning')).not.toBeInTheDocument();
  });

  // The one case a store-driven alert would get wrong: a refused joiner never
  // finishes `initialize`, so `videoCallStore` has nothing to render from.
  test('shows the full message to someone who was refused entry', () => {
    presenceAt(MAX_CALL_PARTICIPANTS);
    render(<CallCapacityAlert />);

    expect(screen.getByText('videoCall.capacity.full')).toBeInTheDocument();
  });

  // The message has to agree with whatever refuses the join. Reading the badge's
  // count instead leaves a refused joiner with a blank panel and no explanation.
  test('says full when only the mesh still sees the slots', () => {
    presenceSplit(2, MAX_CALL_PARTICIPANTS);
    render(<CallCapacityAlert />);

    expect(screen.getByText('videoCall.capacity.full')).toBeInTheDocument();
  });

  test('warns on crowding the badge has not caught up to', () => {
    presenceSplit(1, CALL_QUALITY_WARNING_PARTICIPANTS);
    render(<CallCapacityAlert />);

    expect(screen.getByText('videoCall.capacity.warning')).toBeInTheDocument();
  });

  // Ghosts inflating the roster past the cap must not turn the message back into
  // a mere warning.
  test('stays full if the roster somehow exceeds the cap', () => {
    presenceAt(MAX_CALL_PARTICIPANTS + 2);
    render(<CallCapacityAlert />);

    expect(screen.getByText('videoCall.capacity.full')).toBeInTheDocument();
  });
});
