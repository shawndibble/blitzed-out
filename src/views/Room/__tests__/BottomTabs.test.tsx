import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCallPresenceStore } from '@/stores/callPresenceStore';
import BottomTabs from '../BottomTabs';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.count === undefined ? key : `${key}:${options.count}`,
  }),
}));

vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [{ hapticFeedback: false }, vi.fn()],
}));

function renderTabs() {
  return render(
    <BottomTabs tab1={<div>game</div>} tab2={<div>messages</div>} tab3={<div>video</div>} />
  );
}

function presenceAt(count: number) {
  useCallPresenceStore.setState({ count, loaded: true });
}

describe('BottomTabs video badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCallPresenceStore.setState({ count: 0, loaded: false });
  });

  test('shows no number when the call is empty', () => {
    renderTabs();

    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  test('shows the live count on the video tab', () => {
    presenceAt(2);
    renderTabs();

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  // The count must not be baked into the label, or it needs a plural form in
  // every locale file.
  test('leaves the tab label untranslated-by-count', () => {
    presenceAt(2);
    renderTabs();

    expect(screen.getByText('videoCall.title')).toBeInTheDocument();
  });

  test('names the count for screen readers', () => {
    presenceAt(3);
    renderTabs();

    expect(screen.getByRole('tab', { name: /videoCall\.onCall:3/ })).toBeInTheDocument();
  });

  // The video tab is optional; the badge must not force it into existence.
  test('renders no video tab when there is no video panel', () => {
    presenceAt(2);
    render(<BottomTabs tab1={<div>game</div>} tab2={<div>messages</div>} />);

    expect(screen.queryByText('videoCall.title')).not.toBeInTheDocument();
  });
});
