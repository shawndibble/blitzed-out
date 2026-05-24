import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PickActions from '../index';
import { Settings } from '@/types/Settings';

vi.mock('i18next', () => ({ t: vi.fn((key: string) => key) }));
vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));
vi.mock('@/views/GameSettingsWizard/ActionsStep/IntensityTitle', () => ({
  default: () => <div data-testid="intensity-title" />,
}));
vi.mock('@/components/MultiSelectIntensity', () => ({
  default: ({ actionName }: { actionName: string }) => (
    <div data-testid={`intensity-${actionName}`} />
  ),
}));

vi.mock('@/components/MultiSelect', () => ({
  default: ({
    options,
    values,
  }: {
    options: { value: string; label: string }[];
    values: string[];
  }) => (
    <div
      data-testid="multi-select"
      data-option-count={options.length}
      data-values={values.join(',')}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </div>
  ),
}));

// Local bundle content — foreplay/sex/solo/consumption types
const localActionsList = {
  kissing: { label: 'Kissing', type: 'foreplay', intensities: { 1: 'Light', 2: 'Medium' } },
  stripping: { label: 'Stripping', type: 'foreplay', intensities: { 1: 'Light', 2: 'Medium' } },
  footPlay: { label: 'Foot Play', type: 'foreplay', intensities: { 1: 'Mild' } },
  spanking: { label: 'Spanking', type: 'sex', intensities: { 1: 'Light', 2: 'Medium' } },
  humiliation: { label: 'Humiliation', type: 'sex', intensities: { 1: 'Mild' } },
  bating: { label: 'Bating', type: 'solo', intensities: { 1: 'Light' } },
  alcohol: { label: 'Alcohol', type: 'consumption', intensities: { 1: 'Sip' } },
};

// Online solo bundle — solo/consumption types only
const onlineActionsList = {
  bating: { label: 'Bating', type: 'solo', intensities: { 1: 'Light', 2: 'Medium' } },
  bodyWorship: { label: 'Body Worship', type: 'solo', intensities: { 1: 'Light', 2: 'Medium' } },
  confessions: { label: 'Confessions', type: 'solo', intensities: { 1: 'Mild' } },
  alcohol: { label: 'Alcohol', type: 'consumption', intensities: { 1: 'Sip' } },
};

const makeOptions = (list: Record<string, { label: string; type: string }>) => (action: string) =>
  Object.entries(list)
    .filter(([, v]) => v.type === action)
    .map(([k, v]) => ({ value: k, label: v.label }));

describe('PickActions - solo modes', () => {
  const mockSetFormData = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('shows solo options for gameMode=solo', () => {
    const formData: Settings = {
      gameMode: 'solo',
      soloPlay: true,
      isNaked: false,
      room: 'PUBLIC',
      selectedActions: {},
      boardUpdated: false,
    } as Settings;

    render(
      <PickActions
        formData={formData}
        setFormData={mockSetFormData}
        options={makeOptions(onlineActionsList)}
        actionsList={onlineActionsList}
      />
    );

    const multiSelect = screen.getByTestId('multi-select');
    expect(Number(multiSelect.getAttribute('data-option-count'))).toBe(3); // bating, bodyWorship, confessions
  });

  it('shows solo options for online soloPlay=true', () => {
    const formData: Settings = {
      gameMode: 'online',
      soloPlay: true,
      isNaked: false,
      room: 'PUBLIC',
      selectedActions: {},
      boardUpdated: false,
    } as Settings;

    render(
      <PickActions
        formData={formData}
        setFormData={mockSetFormData}
        options={makeOptions(onlineActionsList)}
        actionsList={onlineActionsList}
      />
    );

    const multiSelect = screen.getByTestId('multi-select');
    expect(Number(multiSelect.getAttribute('data-option-count'))).toBe(3);
  });
});

describe('PickActions - group-play modes (local content)', () => {
  const mockSetFormData = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('shows foreplay options for online group-play clothed (soloPlay=false, isNaked=false)', () => {
    const formData: Settings = {
      gameMode: 'online',
      soloPlay: false,
      isNaked: false,
      room: 'PRIVATE',
      selectedActions: {},
      boardUpdated: false,
    } as Settings;

    render(
      <PickActions
        formData={formData}
        setFormData={mockSetFormData}
        options={makeOptions(localActionsList)}
        actionsList={localActionsList}
      />
    );

    const multiSelect = screen.getByTestId('multi-select');
    expect(Number(multiSelect.getAttribute('data-option-count'))).toBe(3); // kissing, stripping, footPlay
  });

  it('shows sex options for online group-play naked (soloPlay=false, isNaked=true)', () => {
    const formData: Settings = {
      gameMode: 'online',
      soloPlay: false,
      isNaked: true,
      room: 'PRIVATE',
      selectedActions: {},
      boardUpdated: false,
    } as Settings;

    render(
      <PickActions
        formData={formData}
        setFormData={mockSetFormData}
        options={makeOptions(localActionsList)}
        actionsList={localActionsList}
      />
    );

    const multiSelect = screen.getByTestId('multi-select');
    expect(Number(multiSelect.getAttribute('data-option-count'))).toBe(2); // spanking, humiliation
  });

  it('shows foreplay options for local shared-device clothed (gameMode=local, isNaked=false)', () => {
    const formData: Settings = {
      gameMode: 'local',
      soloPlay: false,
      isNaked: false,
      room: 'PRIVATE',
      selectedActions: {},
      boardUpdated: false,
    } as Settings;

    render(
      <PickActions
        formData={formData}
        setFormData={mockSetFormData}
        options={makeOptions(localActionsList)}
        actionsList={localActionsList}
      />
    );

    const multiSelect = screen.getByTestId('multi-select');
    expect(Number(multiSelect.getAttribute('data-option-count'))).toBe(3); // kissing, stripping, footPlay
  });

  it('shows sex options for local shared-device naked (gameMode=local, isNaked=true)', () => {
    const formData: Settings = {
      gameMode: 'local',
      soloPlay: false,
      isNaked: true,
      room: 'PRIVATE',
      selectedActions: {},
      boardUpdated: false,
    } as Settings;

    render(
      <PickActions
        formData={formData}
        setFormData={mockSetFormData}
        options={makeOptions(localActionsList)}
        actionsList={localActionsList}
      />
    );

    const multiSelect = screen.getByTestId('multi-select');
    expect(Number(multiSelect.getAttribute('data-option-count'))).toBe(2); // spanking, humiliation
  });
});
