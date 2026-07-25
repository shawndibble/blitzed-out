import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
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

vi.mock('@/stores/customGroups', () => ({
  getCustomGroups: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/views/CustomTileDialog/PackDirectory', () => ({
  default: () => null,
}));

vi.mock('../PresetSelector', () => ({
  default: () => null,
}));

vi.mock('@mui/icons-material', () => ({
  ArrowBack: () => <span data-testid="arrow-back-icon" />,
  Explore: () => <span data-testid="explore-icon" />,
}));

const actionsList = {
  teasing: {
    label: 'Teasing',
    type: 'foreplay',
    actions: {},
    intensities: { 1: 'Mild', 2: 'Medium', 3: 'Spicy', 4: 'Filthy' },
  },
};

function Harness() {
  const [formData, setFormData] = useState<FormData & Partial<Settings>>({
    room: 'testroom',
    gameMode: 'local',
    boardUpdated: false,
    selectedActions: {
      teasing: { type: 'foreplay', levels: [1] },
    },
  });

  return (
    <ActionsStep
      formData={formData}
      setFormData={setFormData}
      nextStep={vi.fn()}
      prevStep={vi.fn()}
      actionsList={actionsList as any}
    />
  );
}

describe('ActionsStep spice dial retuning', () => {
  it('retunes an already-selected chip (resumed/default state) when the dial changes', () => {
    render(<Harness />);

    expect(screen.getByText('Teasing · 1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('spice.filthy'));

    expect(screen.getByText('Teasing · 1–4')).toBeInTheDocument();
  });
});
