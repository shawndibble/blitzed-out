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

describe('FinishStep — solo room privacy cards', () => {
  it('shows the cards for solo and switches between PUBLIC and a private code', () => {
    let latest: Settings = {} as Settings;
    render(
      <Harness
        initial={{ gameMode: 'solo', room: 'PUBLIC', selectedActions: {} } as unknown as Settings}
        onChange={(f) => (latest = f)}
      />
    );

    fireEvent.click(screen.getByText('Private room'));
    expect(latest.room).not.toBe('PUBLIC');
    expect(latest.room).toHaveLength(5);
    expect(latest.roomRealtime).toBe(false);

    fireEvent.click(screen.getByText('Public room'));
    expect(latest.room).toBe('PUBLIC');
    expect(latest.roomRealtime).toBe(true);
  });

  it('keeps the same private room code when re-selecting private', () => {
    let latest: Settings = {} as Settings;
    render(
      <Harness
        initial={{ gameMode: 'solo', room: 'AB12C', selectedActions: {} } as unknown as Settings}
        onChange={(f) => (latest = f)}
      />
    );

    fireEvent.click(screen.getByText('Private room'));
    expect(latest.room).toBe('AB12C');
  });

  it('treats a missing room as public and can opt into private from there', () => {
    let latest: Settings = {} as Settings;
    render(
      <Harness
        initial={{ gameMode: 'solo', selectedActions: {} } as unknown as Settings}
        onChange={(f) => (latest = f)}
      />
    );

    // Undefined room renders as the public choice, not private
    const publicCard = screen.getByText('Public room').closest('.MuiCard-root');
    expect(publicCard?.textContent).toContain('selected');

    fireEvent.click(screen.getByText('Private room'));
    expect(latest.room).toHaveLength(5);
    expect(latest.roomRealtime).toBe(false);
  });

  it('hides the cards for non-solo modes', () => {
    render(
      <Harness
        initial={{ gameMode: 'online', room: 'AB12C', selectedActions: {} } as unknown as Settings}
        onChange={vi.fn()}
      />
    );

    expect(screen.queryByText('Private room')).toBeNull();
  });
});
