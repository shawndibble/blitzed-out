import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GenderSelector from '../index';

// Mock react-i18next for this component
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'localPlayers.form.genderLabel': 'Anatomy',
        'localPlayers.gender.male': 'Male',
        'localPlayers.gender.female': 'Female',
        'localPlayers.gender.nonBinary': 'Non-Binary',
      };
      return translations[key] || key;
    },
  }),
}));

describe('GenderSelector', () => {
  it('should render successfully with required props', () => {
    const mockOnChange = vi.fn();
    const { container } = render(<GenderSelector onGenderChange={mockOnChange} />);

    expect(container.querySelector('[role="combobox"]')).toBeInTheDocument();
    expect(screen.getAllByText('Anatomy').length).toBeGreaterThan(0);
  });

  it('should render with custom label', () => {
    const mockOnChange = vi.fn();
    render(<GenderSelector onGenderChange={mockOnChange} label="Custom Label" />);

    expect(screen.getAllByText('Custom Label').length).toBeGreaterThan(0);
  });

  it('should render with default selected gender', () => {
    const mockOnChange = vi.fn();
    const { container } = render(<GenderSelector onGenderChange={mockOnChange} />);

    // Component should render successfully
    expect(container.querySelector('[role="combobox"]')).toBeInTheDocument();
  });

  it('should accept selectedGender prop without errors', () => {
    const mockOnChange = vi.fn();

    // Test with each gender option
    const { rerender } = render(
      <GenderSelector selectedGender="male" onGenderChange={mockOnChange} />
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    rerender(<GenderSelector selectedGender="female" onGenderChange={mockOnChange} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    rerender(<GenderSelector selectedGender="non-binary" onGenderChange={mockOnChange} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const mockOnChange = vi.fn();
    render(<GenderSelector onGenderChange={mockOnChange} disabled={true} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-disabled', 'true');
  });

  it('should not be disabled by default', () => {
    const mockOnChange = vi.fn();
    render(<GenderSelector onGenderChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    expect(select).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('should render form control element', () => {
    const mockOnChange = vi.fn();
    const { container } = render(<GenderSelector onGenderChange={mockOnChange} />);

    // Check that FormControl is rendered
    const formControl = container.querySelector('.MuiFormControl-root');
    expect(formControl).toBeInTheDocument();
  });
});
