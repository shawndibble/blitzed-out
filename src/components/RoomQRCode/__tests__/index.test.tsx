import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoomQRCode from '../index';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        scanToJoin: 'Scan to join',
      };
      return translations[key] || key;
    },
  }),
}));

describe('RoomQRCode', () => {
  it('renders QR code with correct URL', () => {
    const roomCode = 'ABC123';
    render(<RoomQRCode roomCode={roomCode} />);

    const qrCode = screen.getByRole('img', { name: 'Scan to join' });
    expect(qrCode).toBeInTheDocument();
  });

  it('renders aria-label for accessibility', () => {
    render(<RoomQRCode roomCode="TEST99" />);

    const qrCode = screen.getByRole('img');
    expect(qrCode).toHaveAttribute('aria-label', 'Scan to join');
  });

  it('renders label text below QR code', () => {
    render(<RoomQRCode roomCode="XYZ789" />);

    expect(screen.getByText('Scan to join')).toBeInTheDocument();
  });

  it('returns null when roomCode is empty', () => {
    const { container } = render(<RoomQRCode roomCode="" />);

    expect(container.firstChild).toBeNull();
  });

  it('renders SVG element for QR code', () => {
    const { container } = render(<RoomQRCode roomCode="SVG01" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
