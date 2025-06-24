import { render, screen } from '@/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import RoomBackground from '../index';

describe('RoomBackground', () => {
  beforeEach(() => {
    // Clear any previous DOM state
    document.body.innerHTML = '';
  });

  describe('Component rendering', () => {
    it('renders without crashing', () => {
      render(<RoomBackground />);
      expect(screen.getByRole('presentation')).toBeInTheDocument();
    });

    it('renders with empty props', () => {
      render(<RoomBackground url={null} isVideo={null} />);
      expect(screen.getByRole('presentation')).toBeInTheDocument();
    });

    it('applies main-container class', () => {
      render(<RoomBackground />);
      const container = screen.getByRole('presentation');
      expect(container).toHaveClass('main-container');
    });
  });

  describe('Image background rendering', () => {
    it('renders image background when isVideo is false', () => {
      const imageUrl = 'https://example.com/image.jpg';
      render(<RoomBackground url={imageUrl} isVideo={false} />);

      const container = screen.getByRole('presentation');
      expect(container).toHaveStyle(`background-image: url(${imageUrl})`);
    });

    it('renders image background when isVideo is null and url is provided', () => {
      const imageUrl = 'https://example.com/background.png';
      render(<RoomBackground url={imageUrl} isVideo={null} />);

      const container = screen.getByRole('presentation');
      expect(container).toHaveStyle(`background-image: url(${imageUrl})`);
    });

    it('does not set background image when url is null', () => {
      render(<RoomBackground url={null} isVideo={false} />);

      const container = screen.getByRole('presentation');
      expect(container).toHaveStyle('background-image: none');
    });

    it('does not set background image when isVideo is true', () => {
      const imageUrl = 'https://example.com/image.jpg';
      render(<RoomBackground url={imageUrl} isVideo={true} />);

      const container = screen.getByRole('presentation');
      expect(container).toHaveStyle('background-image: none');
    });
  });

  describe('Video background rendering', () => {
    it('renders direct video file (mp4)', () => {
      const videoUrl = 'https://example.com/video.mp4';
      render(<RoomBackground url={videoUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', videoUrl);
      expect(video).toHaveAttribute('autoplay');
      expect(video).toHaveAttribute('loop');
      expect(video).toHaveProperty('muted', true);
      expect(video).toHaveAttribute('playsinline');
      expect(video).toHaveClass('video-background');
    });

    it('renders direct video file (webm)', () => {
      const videoUrl = 'https://example.com/video.webm';
      render(<RoomBackground url={videoUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', videoUrl);
    });

    it('renders direct video file (ogg)', () => {
      const videoUrl = 'https://example.com/video.ogg';
      render(<RoomBackground url={videoUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', videoUrl);
    });

    it('renders direct video file (mov)', () => {
      const videoUrl = 'https://example.com/video.mov';
      render(<RoomBackground url={videoUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', videoUrl);
    });

    it('renders direct video file with query parameters', () => {
      const videoUrl = 'https://example.com/video.mp4?token=abc123';
      render(<RoomBackground url={videoUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', videoUrl);
    });
  });

  describe('Iframe video rendering', () => {
    it('renders iframe for non-direct video URLs', () => {
      const embedUrl = 'https://www.youtube.com/embed/abc123';
      render(<RoomBackground url={embedUrl} isVideo={true} />);

      const iframe = screen.getByTitle('video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', embedUrl);
      expect(iframe).toHaveAttribute('width', '100%');
      expect(iframe).toHaveAttribute('height', '100%');
      expect(iframe).toHaveAttribute('allowfullscreen');
      expect(iframe).toHaveAttribute('allow', 'autoplay');
      expect(iframe).toHaveStyle('border: 0px');
    });

    it('renders iframe for Vimeo URLs', () => {
      const vimeoUrl = 'https://player.vimeo.com/video/123456';
      render(<RoomBackground url={vimeoUrl} isVideo={true} />);

      const iframe = screen.getByTitle('video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', vimeoUrl);
    });

    it('renders iframe for embed URLs without file extension', () => {
      const embedUrl = 'https://example.com/embed/video123';
      render(<RoomBackground url={embedUrl} isVideo={true} />);

      const iframe = screen.getByTitle('video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', embedUrl);
    });
  });

  describe('Edge cases and error handling', () => {
    it('handles empty string URL gracefully', () => {
      render(<RoomBackground url="" isVideo={true} />);

      const iframe = screen.getByTitle('video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).not.toHaveAttribute('src');
    });

    it('handles undefined URL gracefully', () => {
      render(<RoomBackground url={undefined} isVideo={true} />);

      const iframe = screen.getByTitle('video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).not.toHaveAttribute('src');
    });

    it('handles malformed video URLs', () => {
      const malformedUrl = 'not-a-valid-url';
      render(<RoomBackground url={malformedUrl} isVideo={true} />);

      const iframe = screen.getByTitle('video');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', malformedUrl);
    });

    it('handles very long URLs', () => {
      const longUrl = `https://example.com/${'a'.repeat(1000)}.mp4`;
      render(<RoomBackground url={longUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', longUrl);
    });
  });

  describe('Video detection logic', () => {
    it('detects mp4 files correctly', () => {
      const mp4Url = 'https://example.com/video.mp4';
      render(<RoomBackground url={mp4Url} isVideo={true} />);

      expect(screen.getByRole('presentation').querySelector('video')).toBeInTheDocument();
      expect(screen.queryByTitle('video')).not.toBeInTheDocument();
    });

    it('detects webm files correctly', () => {
      const webmUrl = 'https://example.com/video.webm';
      render(<RoomBackground url={webmUrl} isVideo={true} />);

      expect(screen.getByRole('presentation').querySelector('video')).toBeInTheDocument();
      expect(screen.queryByTitle('video')).not.toBeInTheDocument();
    });

    it('falls back to iframe for non-video file extensions', () => {
      const nonVideoUrl = 'https://example.com/video.html';
      render(<RoomBackground url={nonVideoUrl} isVideo={true} />);

      // @ts-ignore
      expect(screen.queryByRole('presentation').querySelector('video')).not.toBeInTheDocument();
      expect(screen.getByTitle('video')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has appropriate role for container', () => {
      render(<RoomBackground />);
      expect(screen.getByRole('presentation')).toBeInTheDocument();
    });

    it('iframe has proper title attribute', () => {
      const embedUrl = 'https://example.com/embed/video';
      render(<RoomBackground url={embedUrl} isVideo={true} />);

      const iframe = screen.getByTitle('video');
      expect(iframe).toHaveAttribute('title', 'video');
    });

    it('video has appropriate attributes for accessibility', () => {
      const videoUrl = 'https://example.com/video.mp4';
      render(<RoomBackground url={videoUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      expect(video).toHaveProperty('muted', true); // Important for autoplay accessibility
      expect(video).toHaveAttribute('playsinline'); // Mobile accessibility
    });
  });

  describe('Performance considerations', () => {
    it('does not render video elements when not needed', () => {
      render(<RoomBackground url="https://example.com/image.jpg" isVideo={false} />);

      // @ts-ignore
      expect(screen.queryByRole('presentation').querySelector('video')).not.toBeInTheDocument();
      expect(screen.queryByTitle('video')).not.toBeInTheDocument();
    });

    it('only renders one media element at a time', () => {
      const videoUrl = 'https://example.com/video.mp4';
      render(<RoomBackground url={videoUrl} isVideo={true} />);

      const videos = screen.getByRole('presentation').querySelectorAll('video');
      const iframes = screen.queryAllByTitle('video');

      expect(videos.length + iframes.length).toBe(1);
    });
  });

  describe('Component updates', () => {
    it('updates when URL changes', () => {
      const { rerender } = render(
        <RoomBackground url="https://example.com/video1.mp4" isVideo={true} />
      );

      let video = screen.getByRole('presentation').querySelector('video');
      expect(video).toHaveAttribute('src', 'https://example.com/video1.mp4');

      rerender(<RoomBackground url="https://example.com/video2.mp4" isVideo={true} />);

      video = screen.getByRole('presentation').querySelector('video');
      expect(video).toHaveAttribute('src', 'https://example.com/video2.mp4');
    });

    it('switches between video and image correctly', () => {
      const url = 'https://example.com/media.mp4';
      const { rerender } = render(<RoomBackground url={url} isVideo={true} />);

      // Should show video
      expect(screen.getByRole('presentation').querySelector('video')).toBeInTheDocument();

      rerender(<RoomBackground url={url} isVideo={false} />);

      // Should show image background
      // @ts-ignore
      expect(screen.queryByRole('presentation').querySelector('video')).not.toBeInTheDocument();
      expect(screen.getByRole('presentation')).toHaveStyle(`background-image: url(${url})`);
    });

    it('handles switching from iframe to direct video', () => {
      const { rerender } = render(
        <RoomBackground url="https://youtube.com/embed/abc" isVideo={true} />
      );

      expect(screen.getByTitle('video')).toBeInTheDocument();

      rerender(<RoomBackground url="https://example.com/video.mp4" isVideo={true} />);

      expect(screen.queryByTitle('video')).not.toBeInTheDocument();
      expect(screen.getByRole('presentation').querySelector('video')).toBeInTheDocument();
    });
  });
});
