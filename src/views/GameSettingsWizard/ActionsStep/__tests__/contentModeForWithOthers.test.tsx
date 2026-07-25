import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ActionsStep from '../index';
import type { FormData } from '@/types';
import type { Settings } from '@/types/Settings';

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: any) => <span>{i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en' },
  }),
}));

vi.mock('@mui/icons-material', () => ({
  ArrowBack: () => <span />,
  Explore: () => <span />,
}));

vi.mock('@/stores/customGroups', () => ({
  getCustomGroups: vi.fn().mockResolvedValue([]),
}));

vi.mock('../PresetSelector', () => ({
  default: () => null,
}));

vi.mock('@/views/CustomTileDialog/PackDirectory', () => ({
  default: ({ gameMode }: { gameMode: string }) => (
    <div data-testid="pack-directory-game-mode">{gameMode}</div>
  ),
}));

const actionsList = {
  teasing: {
    label: 'Teasing',
    type: 'foreplay',
    actions: {},
    intensities: { 1: 'Mild', 2: 'Medium' },
  },
};

const baseFormData: FormData & Partial<Settings> = {
  room: 'testroom',
  gameMode: 'online',
  soloPlay: false,
  boardUpdated: false,
  selectedActions: {},
};

describe('ActionsStep content mode (With Others: online + soloPlay:false)', () => {
  it("browses the local-bundle pack directory, matching actionType's own derivation", () => {
    render(
      <ActionsStep
        formData={baseFormData}
        setFormData={vi.fn()}
        nextStep={vi.fn()}
        prevStep={vi.fn()}
        actionsList={actionsList as any}
      />
    );

    fireEvent.click(screen.getByText('explorePacks'));

    expect(screen.getByTestId('pack-directory-game-mode')).toHaveTextContent('local');
  });
});
