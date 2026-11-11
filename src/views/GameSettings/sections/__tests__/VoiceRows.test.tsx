import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VoiceRows from '../VoiceRows';
import { findNeuralVoice } from '@/services/neuralVoices';
import { Settings } from '@/types/Settings';

vi.mock('@/services/neuralTts', () => ({ preloadNeural: vi.fn() }));
const speakMock = vi.hoisted(() => vi.fn());
const gpu = vi.hoisted(() => ({ usable: true }));
vi.mock('@/services/gpuSupport', () => ({
  webgpuUsable: () => Promise.resolve(gpu.usable),
  webgpuKnownResult: () => undefined,
}));
vi.mock('@/hooks/useTTS', () => ({ useTTS: () => ({ speak: speakMock }) }));

function Harness({ initial }: { initial: Partial<Settings> }): React.JSX.Element {
  const [formData, setFormData] = useState(initial as Settings);
  return (
    <>
      <VoiceRows
        formData={formData}
        setFormData={setFormData}
        onVoiceChange={() => {}}
        onPitchChange={() => {}}
      />
      <output data-testid="voice">{formData.voicePreference}</output>
    </>
  );
}

const rowsReady = (): Promise<HTMLElement[]> => screen.findAllByRole('combobox');

describe('VoiceRows (neural voices)', () => {
  afterEach(() => {
    gpu.usable = true;
  });

  it('replaces an old browser voice with a default Fast male voice', async () => {
    render(<Harness initial={{ voicePreference: 'Google US English' }} />);
    await rowsReady();
    const voice = findNeuralVoice(screen.getByTestId('voice').textContent ?? '');
    expect(voice).toMatchObject({ engine: 'piper', gender: 'male', language: 'en' });
  });

  it('switches to a female voice in the same accent when Female is chosen', async () => {
    render(<Harness initial={{ voicePreference: 'piper:en_GB-alan-medium' }} />);
    await rowsReady();
    fireEvent.click(screen.getByRole('button', { name: /female/i }));
    const voice = findNeuralVoice(screen.getByTestId('voice').textContent ?? '');
    expect(voice).toMatchObject({ gender: 'female', region: 'GB' });
  });

  it('groups voices under Fast and HD headings', async () => {
    render(<Harness initial={{ voicePreference: 'piper:en_US-ryan-medium' }} />);
    fireEvent.mouseDown((await rowsReady()).at(-1) as HTMLElement);
    const list = within(screen.getByRole('listbox'));
    expect(list.getByText(/voiceGroupFast|^fast$/i)).toBeInTheDocument();
    expect(list.getByText(/voiceGroupHd|^hd$/i)).toBeInTheDocument();
    // between Fast and HD
    expect(screen.getByRole('listbox').querySelector('hr, [role="separator"]')).not.toBeNull();
  });

  it('shows the gender picker for English, which has both', async () => {
    render(<Harness initial={{ voicePreference: 'piper:en_US-ryan-medium' }} />);
    await rowsReady();
    expect(screen.getByRole('button', { name: /female/i })).toBeInTheDocument();
  });

  it('hides HD voices when there is no usable GPU', async () => {
    gpu.usable = false;
    render(<Harness initial={{ voicePreference: 'piper:en_US-ryan-medium' }} />);
    fireEvent.mouseDown((await rowsReady()).at(-1) as HTMLElement);
    const list = within(screen.getByRole('listbox'));
    expect(list.getByText(/voiceGroupFast|^fast$/i)).toBeInTheDocument();
    expect(list.queryByText(/voiceGroupHd|^hd$/i)).not.toBeInTheDocument();
  });

  it('moves a saved HD voice to a Fast one when HD is unavailable', async () => {
    gpu.usable = false;
    render(<Harness initial={{ voicePreference: 'kokoro:am_michael' }} />);
    await rowsReady();
    await waitFor(() => {
      const voice = findNeuralVoice(screen.getByTestId('voice').textContent ?? '');
      expect(voice).toMatchObject({ engine: 'piper' });
    });
  });

  it('keeps a saved HD voice when a GPU is available', async () => {
    render(<Harness initial={{ voicePreference: 'kokoro:am_michael' }} />);
    await rowsReady();
    expect(screen.getByTestId('voice').textContent).toBe('kokoro:am_michael');
  });

  it('narrates sample playback so a slow first setup does not look broken', async () => {
    let finish: () => void = () => {};
    speakMock.mockImplementation((_text: string, options: { onStage: (stage: string) => void }) => {
      options.onStage('setup');
      return new Promise<void>((resolve) => {
        finish = resolve;
      });
    });
    render(<Harness initial={{ voicePreference: 'piper:en_US-ryan-medium' }} />);
    await rowsReady();

    fireEvent.click(screen.getByRole('button', { name: /sample/i }));
    expect(await screen.findByText(/voiceStageSetup|Initial voice setup/)).toBeInTheDocument();

    await act(async () => finish());
    expect(await screen.findByText(/voiceStagePlayed|^Played$/)).toBeInTheDocument();
  });

  it('shows the voice as read-only text when an accent leaves only one', async () => {
    // ABA is the only male Arabic-accented voice.
    render(<Harness initial={{ voicePreference: 'piper:en_US-l2arctic-medium#21' }} />);
    await rowsReady();
    expect(screen.getByText('ABA')).toBeInTheDocument();
    // Only the accent select remains; the voice has nothing to choose.
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });
});
