import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FinishStep from './index';
import type { Settings } from '@/types/Settings';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'PUBLIC' }),
}));

vi.mock('@/hooks/useSubmitGameSettings', () => ({
  default: () => ({ submit: vi.fn(), isSubmitting: false }),
}));

function Harness({ initial, onChange }: { initial: Settings; onChange: (f: Settings) => void }) {
  const [formData, setFormData] = useState<Settings>(initial);
  return (
    <FinishStep
      formData={formData}
      setFormData={(next: Settings) => {
        onChange(next);
        setFormData(next);
      }}
      prevStep={vi.fn()}
      actionsList={{}}
    />
  );
}

describe('FinishStep — solo privacy toggle', () => {
  it('shows the toggle for solo and switches between PUBLIC and a private code', () => {
    let latest: Settings = {} as Settings;
    render(
      <Harness
        initial={{ gameMode: 'solo', room: 'PUBLIC', selectedActions: {} } as unknown as Settings}
        onChange={(f) => (latest = f)}
      />
    );

    const toggle = screen.getByLabelText('Play privately');

    fireEvent.click(toggle);
    expect(latest.room).not.toBe('PUBLIC');
    expect(latest.room).toHaveLength(5);
    expect(latest.roomRealtime).toBe(false);

    fireEvent.click(toggle);
    expect(latest.room).toBe('PUBLIC');
    expect(latest.roomRealtime).toBe(true);
  });

  it('hides the toggle for non-solo modes', () => {
    render(
      <Harness
        initial={{ gameMode: 'online', room: 'AB12C', selectedActions: {} } as unknown as Settings}
        onChange={vi.fn()}
      />
    );

    expect(screen.queryByLabelText('Play privately')).toBeNull();
  });
});
