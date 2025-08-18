import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BottomTabs from '../index';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('BottomTabs', () => {
  const mockTab1 = <div>Game Board Content</div>;
  const mockTab2 = <div>Messages Content</div>;

  it('renders both tabs', () => {
    render(<BottomTabs tab1={mockTab1} tab2={mockTab2} />);

    expect(screen.getByRole('tab', { name: 'game' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'messages' })).toBeInTheDocument();
  });

  it('shows first tab content by default', () => {
    render(<BottomTabs tab1={mockTab1} tab2={mockTab2} />);

    expect(screen.getByText('Game Board Content')).toBeInTheDocument();
    expect(screen.queryByText('Messages Content')).not.toBeInTheDocument();
  });

  it('switches to second tab when clicked', () => {
    render(<BottomTabs tab1={mockTab1} tab2={mockTab2} />);

    fireEvent.click(screen.getByRole('tab', { name: 'messages' }));

    expect(screen.getByText('Messages Content')).toBeInTheDocument();
    expect(screen.queryByText('Game Board Content')).not.toBeInTheDocument();
  });

  it('switches back to first tab when clicked', () => {
    render(<BottomTabs tab1={mockTab1} tab2={mockTab2} />);

    // Switch to second tab
    fireEvent.click(screen.getByRole('tab', { name: 'messages' }));
    expect(screen.getByText('Messages Content')).toBeInTheDocument();

    // Switch back to first tab
    fireEvent.click(screen.getByRole('tab', { name: 'game' }));
    expect(screen.getByText('Game Board Content')).toBeInTheDocument();
    expect(screen.queryByText('Messages Content')).not.toBeInTheDocument();
  });

  it('has proper mobile layout structure', () => {
    render(<BottomTabs tab1={mockTab1} tab2={mockTab2} />);

    // Check that AppBar is positioned at bottom
    const appBar = screen.getByRole('tablist').closest('[class*="MuiAppBar"]');
    expect(appBar).toBeInTheDocument();

    // Check that main container exists
    const container = screen.getByText('Game Board Content').closest('div');
    expect(container).toBeInTheDocument();
  });

  it('applies correct accessibility properties', () => {
    render(<BottomTabs tab1={mockTab1} tab2={mockTab2} />);

    const gameTab = screen.getByRole('tab', { name: 'game' });
    const messagesTab = screen.getByRole('tab', { name: 'messages' });

    expect(gameTab).toHaveAttribute('aria-selected', 'true');
    expect(messagesTab).toHaveAttribute('aria-selected', 'false');

    // Check tab panels have correct IDs
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'simple-tabpanel-0');
  });

  it('maintains tab state correctly', () => {
    render(<BottomTabs tab1={mockTab1} tab2={mockTab2} />);

    const gameTab = screen.getByRole('tab', { name: 'game' });
    const messagesTab = screen.getByRole('tab', { name: 'messages' });

    // Initially game tab is selected
    expect(gameTab).toHaveAttribute('aria-selected', 'true');
    expect(messagesTab).toHaveAttribute('aria-selected', 'false');

    // Switch to messages tab
    fireEvent.click(messagesTab);
    expect(gameTab).toHaveAttribute('aria-selected', 'false');
    expect(messagesTab).toHaveAttribute('aria-selected', 'true');
  });
});
