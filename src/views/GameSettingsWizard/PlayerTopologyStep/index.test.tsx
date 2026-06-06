import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlayerTopologyStep from './index';
import type { FormData } from '@/types';
import type { Settings } from '@/types/Settings';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

vi.mock('@/helpers/networkStatus', () => ({
  isOffline: () => false,
}));

type Form = FormData & Partial<Settings>;

function Harness({ initial, onChange }: { initial: Form; onChange: (f: Form) => void }) {
  const [formData, setFormData] = useState<Form>(initial);
  return (
    <PlayerTopologyStep
      formData={formData}
      setFormData={(update) => {
        setFormData((prev) => {
          const next = typeof update === 'function' ? (update as (p: Form) => Form)(prev) : update;
          onChange(next);
          return next;
        });
      }}
      nextStep={vi.fn()}
    />
  );
}

describe('PlayerTopologyStep — solo private room sync', () => {
  it('syncs formData.room when "Play privately" is toggled after selecting Solo', () => {
    let latest: Form = {} as Form;
    render(
      <Harness initial={{ gameMode: '' } as unknown as Form} onChange={(f) => (latest = f)} />
    );

    // 1. Click Solo card (private unchecked) → PUBLIC, realtime true
    fireEvent.click(screen.getByText('Solo'));
    expect(latest.room).toBe('PUBLIC');
    expect(latest.roomRealtime).toBe(true);

    // 2. Check "Play privately" → private code, realtime false
    fireEvent.click(screen.getByLabelText('Play privately'));
    expect(latest.room).not.toBe('PUBLIC');
    expect(latest.room).toHaveLength(5);
    expect(latest.roomRealtime).toBe(false);

    // 3. Uncheck → back to PUBLIC, realtime true
    fireEvent.click(screen.getByLabelText('Play privately'));
    expect(latest.room).toBe('PUBLIC');
    expect(latest.roomRealtime).toBe(true);
  });
});
