import { useTranslation } from 'react-i18next';

/**
 * Simple, elegant loading screen that matches the instant HTML loading screen
 * Uses pure CSS to avoid MUI loading issues and ensure consistent styling
 */
export default function AppSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(
          135deg,
          rgba(15, 23, 42, 0.9) 0%,
          rgba(30, 41, 59, 0.95) 20%,
          rgba(51, 65, 85, 0.9) 40%,
          rgba(30, 41, 59, 0.95) 60%,
          rgba(15, 23, 42, 0.9) 80%,
          rgba(2, 6, 23, 0.95) 100%
        )`,
        zIndex: 9999,
        fontFamily:
          "'Roboto Fallback', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Loading spinner - matches HTML version exactly */}
      <div
        style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderLeft: '4px solid #0abde3',
          borderRadius: '50%',
          animation: 'app-skeleton-spin 1.4s linear infinite',
          marginBottom: '24px',
        }}
      />

      {/* Loading text - matches HTML version exactly with responsive clamp sizing */}
      <div
        style={{
          fontSize: 'clamp(1.25rem, 4vw, 3rem)',
          fontWeight: 600,
          letterSpacing: '-0.025em',
          color: '#0abde3',
          textAlign: 'center',
          fontFamily:
            "'Roboto Fallback', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        }}
      >
        {t('loading')}...
      </div>
    </div>
  );
}
