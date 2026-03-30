import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
  }),
}));

import GameGuide from '../index';

describe('GameGuide (HowItWorks)', () => {
  it('renders the how it works title', () => {
    render(<GameGuide />);
    expect(screen.getByText('howItWorksTitle')).toBeInTheDocument();
  });

  it('renders all 3 step titles', () => {
    render(<GameGuide />);
    expect(screen.getByText('howItWorksStep1Title')).toBeInTheDocument();
    expect(screen.getByText('howItWorksStep2Title')).toBeInTheDocument();
    expect(screen.getByText('howItWorksStep3Title')).toBeInTheDocument();
  });

  it('renders all 3 step descriptions', () => {
    render(<GameGuide />);
    expect(screen.getByText('howItWorksStep1Desc')).toBeInTheDocument();
    expect(screen.getByText('howItWorksStep2Desc')).toBeInTheDocument();
    expect(screen.getByText('howItWorksStep3Desc')).toBeInTheDocument();
  });

  it('renders 3 clickable screenshot images with alt text', () => {
    render(<GameGuide />);
    const images = screen.getAllByRole('button');
    const imgButtons = images.filter((el) => el.tagName === 'IMG');
    expect(imgButtons).toHaveLength(3);
    expect(imgButtons[0]).toHaveAttribute('alt', 'howItWorksStep1Alt');
    expect(imgButtons[1]).toHaveAttribute('alt', 'howItWorksStep2Alt');
    expect(imgButtons[2]).toHaveAttribute('alt', 'howItWorksStep3Alt');
  });

  it('renders step numbers 1, 2, 3', () => {
    render(<GameGuide />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
