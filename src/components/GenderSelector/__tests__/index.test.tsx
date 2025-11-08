import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GenderSelector from '../index';
import type { PlayerGender } from '@/types/localPlayers';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'localPlayers.form.genderLabel': 'Gender (Optional)',
        'localPlayers.gender.male': 'Male',
        'localPlayers.gender.female': 'Female',
        'localPlayers.gender.nonBinary': 'Non-Binary',
        'localPlayers.gender.preferNotSay': 'Prefer Not to Say',
        'localPlayers.gender.maleDescription': 'Uses male anatomy terms in actions',
        'localPlayers.gender.femaleDescription': 'Uses female anatomy terms in actions',
        'localPlayers.gender.nonBinaryDescription': 'Uses neutral anatomy terms in actions',
        'localPlayers.gender.preferNotSayDescription': 'Uses neutral terms (default)',
        'localPlayers.gender.whyWeAsk':
          'Gender helps personalize action text with appropriate anatomy terms. This is completely optional and only affects how actions are worded.',
      };
      return translations[key] || key;
    },
  }),
}));

describe('GenderSelector', () => {
  it('should render with default gender', () => {
    const mockOnChange = vi.fn();
    render(<GenderSelector onGenderChange={mockOnChange} />);

    // Should show gender label
    expect(screen.getByText('Gender (Optional)')).toBeInTheDocument();
  });

  it('should render with selected gender', () => {
    const mockOnChange = vi.fn();
    render(<GenderSelector selectedGender="female" onGenderChange={mockOnChange} />);

    // The component should be rendered (we can't easily check the selected value in MUI Select without opening it)
    expect(screen.getByText('Gender (Optional)')).toBeInTheDocument();
  });

  it('should call onGenderChange when selection changes', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(<GenderSelector selectedGender="prefer-not-say" onGenderChange={mockOnChange} />);

    // Click on the select to open dropdown
    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Click on male option
    const maleOption = await screen.findByText('Male');
    await user.click(maleOption);

    // Should have called onChange with 'male'
    expect(mockOnChange).toHaveBeenCalledWith('male');
  });

  it('should display all gender options', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(<GenderSelector onGenderChange={mockOnChange} />);

    // Open the dropdown
    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Should show all 4 gender options
    expect(await screen.findByText('Male')).toBeInTheDocument();
    expect(await screen.findByText('Female')).toBeInTheDocument();
    expect(await screen.findByText('Non-Binary')).toBeInTheDocument();
    expect(await screen.findByText('Prefer Not to Say')).toBeInTheDocument();
  });

  it('should display gender descriptions', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(<GenderSelector onGenderChange={mockOnChange} />);

    // Open the dropdown
    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    // Should show descriptions for each option
    expect(await screen.findByText('Uses male anatomy terms in actions')).toBeInTheDocument();
    expect(await screen.findByText('Uses female anatomy terms in actions')).toBeInTheDocument();
    expect(await screen.findByText('Uses neutral anatomy terms in actions')).toBeInTheDocument();
    expect(await screen.findByText('Uses neutral terms (default)')).toBeInTheDocument();
  });

  it('should show info tooltip when showInfoTooltip is true', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(<GenderSelector onGenderChange={mockOnChange} showInfoTooltip={true} />);

    // Should have an info icon button
    const infoButton = screen.getByRole('button');
    expect(infoButton).toBeInTheDocument();

    // Hover over info button to show tooltip
    await user.hover(infoButton);

    // Tooltip text should appear (may need to wait for it)
    const tooltipText = await screen.findByText(
      'Gender helps personalize action text with appropriate anatomy terms. This is completely optional and only affects how actions are worded.'
    );
    expect(tooltipText).toBeInTheDocument();
  });

  it('should not show info tooltip when showInfoTooltip is false', () => {
    const mockOnChange = vi.fn();

    render(<GenderSelector onGenderChange={mockOnChange} showInfoTooltip={false} />);

    // Should not have any buttons (no info icon)
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('should be disabled when disabled prop is true', () => {
    const mockOnChange = vi.fn();

    render(<GenderSelector onGenderChange={mockOnChange} disabled={true} />);

    // The select should be disabled
    const selectButton = screen.getByRole('combobox');
    expect(selectButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('should use custom label when provided', () => {
    const mockOnChange = vi.fn();

    render(<GenderSelector onGenderChange={mockOnChange} label="Custom Gender Label" />);

    // Should show custom label
    expect(screen.getByText('Custom Gender Label')).toBeInTheDocument();
  });

  it('should handle all gender values correctly', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    const genders: PlayerGender[] = ['male', 'female', 'non-binary', 'prefer-not-say'];

    for (const gender of genders) {
      mockOnChange.mockClear();

      const { unmount } = render(
        <GenderSelector selectedGender="prefer-not-say" onGenderChange={mockOnChange} />
      );

      // Open dropdown
      const selectButton = screen.getByRole('combobox');
      await user.click(selectButton);

      // Click on the gender option
      const genderLabels: Record<PlayerGender, string> = {
        male: 'Male',
        female: 'Female',
        'non-binary': 'Non-Binary',
        'prefer-not-say': 'Prefer Not to Say',
      };

      const option = await screen.findByText(genderLabels[gender]);
      await user.click(option);

      // Should have called onChange with correct gender
      expect(mockOnChange).toHaveBeenCalledWith(gender);

      unmount();
    }
  });
});
