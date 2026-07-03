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

describe('PlayerTopologyStep — topology cards + Next', () => {
  it('Just Me selects PUBLIC solo; Next skips the room step', () => {
    let latest: Form = {} as Form;
    const nextStep = vi.fn();
    render(
      <Harness
        initial={{ gameMode: '' } as unknown as Form}
        onChange={(f) => (latest = f)}
        nextStep={nextStep}
      />
    );

    // Next is disabled until a topology is picked
    expect(screen.getByTestId('next')).toBeDisabled();

    fireEvent.click(screen.getByText('Just Me'));
    expect(latest.room).toBe('PUBLIC');
    expect(latest.roomRealtime).toBe(true);
    expect(latest.soloPlay).toBe(true);
    expect(nextStep).not.toHaveBeenCalled();
  });

  it('Next advances solo past the room/local-players screen', () => {
    const nextStep = vi.fn();
    render(
      <Harness
        initial={{ gameMode: 'solo', room: 'PUBLIC' } as unknown as Form}
        onChange={vi.fn()}
        nextStep={nextStep}
      />
    );

    fireEvent.click(screen.getByTestId('next'));
    expect(nextStep).toHaveBeenCalledWith(2);
  });

  it('Just Me preserves an existing private solo room', () => {
    let latest: Form = {} as Form;
    render(
      <Harness
        initial={{ gameMode: 'solo', room: 'AB12C' } as unknown as Form}
        onChange={(f) => (latest = f)}
      />
    );

    fireEvent.click(screen.getByText('Just Me'));
    expect(latest.room).toBe('AB12C');
    expect(latest.roomRealtime).toBe(false);
  });

  it('Pass & Play selects local mode with a room code; Next advances one step', () => {
    let latest: Form = {} as Form;
    const nextStep = vi.fn();
    render(
      <Harness
        initial={{ gameMode: '' } as unknown as Form}
        onChange={(f) => (latest = f)}
        nextStep={nextStep}
      />
    );

    fireEvent.click(screen.getByText('Pass & Play'));
    expect(latest.gameMode).toBe('local');
    expect(latest.room).toHaveLength(5);

    fireEvent.click(screen.getByTestId('next'));
    expect(nextStep).toHaveBeenCalledWith();
  });

  it('Party Room selects online mode with a room code', () => {
    let latest: Form = {} as Form;
    render(
      <Harness initial={{ gameMode: '' } as unknown as Form} onChange={(f) => (latest = f)} />
    );

    fireEvent.click(screen.getByText('Party Room'));
    expect(latest.gameMode).toBe('online');
    expect(latest.room).toHaveLength(5);
  });
});
