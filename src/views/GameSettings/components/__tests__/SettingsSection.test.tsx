import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import SettingsSection from '../SettingsSection';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SettingsSection', () => {
  it('renders children directly, always open — no accordion gate', () => {
    render(
      <SettingsSection id="section-test" scope="room" title="Test Section">
        <div data-testid="section-content">content</div>
      </SettingsSection>
    );
    expect(screen.getByTestId('section-content')).toBeInTheDocument();
  });

  it('has no expand/collapse control', () => {
    render(
      <SettingsSection id="section-test" scope="room" title="Test Section">
        <div>content</div>
      </SettingsSection>
    );
    expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
  });

  it('accepts scrollOffsetExtra without disrupting normal rendering (defaults to 0 when omitted)', () => {
    const { container } = render(
      <SettingsSection id="section-test" scope="room" title="Test Section" scrollOffsetExtra={72}>
        <div data-testid="section-content">content</div>
      </SettingsSection>
    );
    expect(container.querySelector('#section-test')).toBeInTheDocument();
    expect(screen.getByTestId('section-content')).toBeInTheDocument();
  });

  it('renders the scope chip, title, summary, and action', () => {
    render(
      <SettingsSection
        id="section-test"
        scope="board"
        title="Actions"
        summary="3 enabled"
        action={<button type="button">Add</button>}
      >
        <div>content</div>
      </SettingsSection>
    );
    expect(screen.getByText('scopeBoard')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('3 enabled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});
