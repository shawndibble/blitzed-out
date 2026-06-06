import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ContentWarning from '../index';
import { Settings } from '@/types/Settings';
import type { BoardContentWarnings } from '@/hooks/useBoardContentWarnings';

let mockWarnings: BoardContentWarnings = { missingGroups: [], lowContent: false };

vi.mock('@/hooks/useBoardContentWarnings', () => ({
  default: () => mockWarnings,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { groups?: string }) =>
      key === 'missingGroupsWarning' ? `Missing: ${opts?.groups}` : key,
  }),
}));

const formData = {} as Settings;
const actionsList = { teasing: { label: 'Teasing' } };

describe('ContentWarning', () => {
  it('renders nothing when the board is healthy', () => {
    mockWarnings = { missingGroups: [], lowContent: false };
    const { container } = render(<ContentWarning formData={formData} actionsList={actionsList} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists missing groups by their label', () => {
    mockWarnings = { missingGroups: ['teasing'], lowContent: false };
    render(<ContentWarning formData={formData} actionsList={actionsList} />);
    expect(screen.getByText('Missing: Teasing')).toBeInTheDocument();
  });

  it('falls back to the group key when no label exists', () => {
    mockWarnings = { missingGroups: ['unknownGroup'], lowContent: false };
    render(<ContentWarning formData={formData} actionsList={actionsList} />);
    expect(screen.getByText('Missing: unknownGroup')).toBeInTheDocument();
  });

  it('shows the sparse-board warning when content is low', () => {
    mockWarnings = { missingGroups: [], lowContent: true };
    render(<ContentWarning formData={formData} actionsList={actionsList} />);
    expect(screen.getByText('sparseBoardWarning')).toBeInTheDocument();
  });
});
