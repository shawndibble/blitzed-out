import { SubmitDependencies, submitGameSettings } from '@/services/gameSettingsOrchestrator';

import type { Settings } from '@/types/Settings';
import { useCallback, useState } from 'react';
import { useGameSettingsWiring } from './useGameSettingsWiring';

export interface GameSettingsSubmitResult {
  submit: (formData: Settings, actionsList: any) => Promise<void>;
  isSubmitting: boolean;
  error: Error | null;
}

export default function useSubmitGameSettings(
  overrideDeps?: Partial<SubmitDependencies>
): GameSettingsSubmitResult {
  const { ctx, deps } = useGameSettingsWiring();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (formData: Settings, actionsList: any): Promise<void> => {
      setIsSubmitting(true);
      setError(null);

      try {
        await submitGameSettings(formData, actionsList, ctx, { ...deps, ...overrideDeps });
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Submission failed');
        setError(e);
        throw e;
      } finally {
        setIsSubmitting(false);
      }
    },
    [ctx, deps, overrideDeps]
  );

  return { submit, isSubmitting, error };
}
