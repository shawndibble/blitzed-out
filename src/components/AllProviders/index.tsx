import { ProvidersProps } from '@/types/app';
import { MigrationProvider } from '@/context/migration';
import { ScheduleProvider } from '@/context/schedule';
import { ThemeProvider } from '@/context/theme';
import MuiProviders from '@/components/MuiProviders';

/**
 * Consolidated providers component to reduce Suspense boundary nesting
 * This helps fix iOS Safari module loading issues by reducing import waterfalls
 */
export default function AllProviders({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <MigrationProvider>
        <ScheduleProvider>
          <MuiProviders>{children}</MuiProviders>
        </ScheduleProvider>
      </MigrationProvider>
    </ThemeProvider>
  );
}
