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

function Harness({
  initial,
  onChange,
  nextStep = vi.fn(),
}: {
  initial: Form;
  onChange: (f: Form) => void;
  nextStep?: (count?: number) => void;
}) {
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
      nextStep={nextStep}
    />
  );
}

describe('PlayerTopologyStep — one-tap topology cards', () => {
  it('Solo tap defaults to the PUBLIC room and skips the room step', () => {
    let latest: Form = {} as Form;
    const nextStep = vi.fn();
    render(
      <Harness
        initial={{ gameMode: '' } as unknown as Form}
        onChange={(f) => (latest = f)}
        nextStep={nextStep}
      />
    );

    fireEvent.click(screen.getByText('Solo'));
    expect(latest.room).toBe('PUBLIC');
    expect(latest.roomRealtime).toBe(true);
    expect(latest.soloPlay).toBe(true);
    // Solo auto-advances past the room/local-players screen
    expect(nextStep).toHaveBeenCalledWith(2);
  });

  it('Solo tap preserves an existing private solo room', () => {
    let latest: Form = {} as Form;
    render(
      <Harness
        initial={{ gameMode: 'solo', room: 'AB12C' } as unknown as Form}
        onChange={(f) => (latest = f)}
      />
    );

    fireEvent.click(screen.getByText('Solo'));
    expect(latest.room).toBe('AB12C');
    expect(latest.roomRealtime).toBe(false);
  });

  it('Shared Device tap generates a room code and advances one step', () => {
    let latest: Form = {} as Form;
    const nextStep = vi.fn();
    render(
      <Harness
        initial={{ gameMode: '' } as unknown as Form}
        onChange={(f) => (latest = f)}
        nextStep={nextStep}
      />
    );

    fireEvent.click(screen.getByText('Shared Device'));
    expect(latest.gameMode).toBe('local');
    expect(latest.room).toHaveLength(5);
    expect(nextStep).toHaveBeenCalledWith();
  });

  it('Individual Devices tap generates a room code and advances one step', () => {
    let latest: Form = {} as Form;
    const nextStep = vi.fn();
    render(
      <Harness
        initial={{ gameMode: '' } as unknown as Form}
        onChange={(f) => (latest = f)}
        nextStep={nextStep}
      />
    );

    fireEvent.click(screen.getByText('Individual Devices'));
    expect(latest.gameMode).toBe('online');
    expect(latest.room).toHaveLength(5);
    expect(nextStep).toHaveBeenCalledWith();
  });
});
