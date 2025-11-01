import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@/test-utils';

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

    it('applies default-background class when no custom background is set', () => {
      render(<RoomBackground />);
      const container = screen.getByRole('presentation');
      expect(container).toHaveClass('main-container', 'default-background');
    });

    it('does not apply default-background class when image background is set', () => {
      const imageUrl = 'https://example.com/image.jpg';
      render(<RoomBackground url={imageUrl} isVideo={false} />);
      const container = screen.getByRole('presentation');
      expect(container).toHaveClass('main-container');
      expect(container).not.toHaveClass('default-background');
    });

    it('does not apply default-background class when video background is set', () => {
      const videoUrl = 'https://example.com/video.mp4';
      render(<RoomBackground url={videoUrl} isVideo={true} />);
      const container = screen.getByRole('presentation');
      expect(container).toHaveClass('main-container');
      expect(container).not.toHaveClass('default-background');
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

    it('applies default gradient background when url is null', () => {
      render(<RoomBackground url={null} isVideo={false} />);

      const container = screen.getByRole('presentation');
      expect(container).toHaveClass('default-background');
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
      expect(iframe).toHaveAttribute(
        'allow',
        'autoplay; fullscreen; encrypted-media; picture-in-picture'
      );
      // Border style test removed as not needed
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

      // @ts-expect-error DOM querySelector returns Element | null, Jest expects HTMLElement
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

      // @ts-expect-error DOM querySelector returns Element | null, Jest expects HTMLElement
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

  describe('DirectMediaHandler functionality', () => {
    it('starts with video attempt for direct URLs', () => {
      const videoUrl = 'https://example.com/video.mp4';
      render(<RoomBackground url={videoUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', videoUrl);
    });

    it('falls back to image when video fails to load (Imgur)', async () => {
      const imgurUrl = 'https://i.imgur.com/abc123.mp4';
      render(<RoomBackground url={imgurUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      expect(video).toBeInTheDocument();

      // Simulate video error
      fireEvent.error(video!);

      await waitFor(() => {
        const imageBackground = screen.getByRole('presentation').querySelector('.image-background');
        expect(imageBackground).toBeInTheDocument();
        expect(imageBackground).toHaveStyle(
          'background-image: url(https://i.imgur.com/abc123.jpg)'
        );
      });

      // Video should no longer be visible
      expect(screen.queryByRole('presentation')?.querySelector('video')).not.toBeInTheDocument();
    });

    it('falls back to image when video fails to load (generic URL)', async () => {
      const genericUrl = 'https://example.com/media.mp4';
      render(<RoomBackground url={genericUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      expect(video).toBeInTheDocument();

      // Simulate video error
      fireEvent.error(video!);

      await waitFor(() => {
        const imageBackground = screen.getByRole('presentation').querySelector('.image-background');
        expect(imageBackground).toBeInTheDocument();
        expect(imageBackground).toHaveStyle('background-image: url(https://example.com/media.jpg)');
      });
    });

    it('tries different image formats when image fails (Imgur)', async () => {
      const imgurUrl = 'https://i.imgur.com/abc123.mp4';
      render(<RoomBackground url={imgurUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      fireEvent.error(video!);

      await waitFor(() => {
        const imageBackground = screen.getByRole('presentation').querySelector('.image-background');
        expect(imageBackground).toBeInTheDocument();
      });

      // Simulate image error to trigger format fallback
      const hiddenImg = screen
        .getByRole('presentation')
        .querySelector('img[style*="display: none"]');
      expect(hiddenImg).toBeInTheDocument();

      fireEvent.error(hiddenImg!);

      await waitFor(() => {
        const imageBackground = screen.getByRole('presentation').querySelector('.image-background');
        expect(imageBackground).toHaveStyle(
          'background-image: url(https://i.imgur.com/abc123.png)'
        );
      });
    });

    it('tries different image formats when image fails (generic URL)', async () => {
      const genericUrl = 'https://example.com/media.mp4';
      render(<RoomBackground url={genericUrl} isVideo={true} />);

      const video = screen.getByRole('presentation').querySelector('video');
      fireEvent.error(video!);

      await waitFor(() => {
        const imageBackground = screen.getByRole('presentation').querySelector('.image-background');
        expect(imageBackground).toBeInTheDocument();
      });

      // Simulate image error to trigger format fallback
      const hiddenImg = screen
        .getByRole('presentation')
        .querySelector('img[style*="display: none"]');
      fireEvent.error(hiddenImg!);

      await waitFor(() => {
        const imageBackground = screen.getByRole('presentation').querySelector('.image-background');
        expect(imageBackground).toHaveStyle('background-image: url(https://example.com/media.png)');
      });
    });
  });

  describe('Color/Gray background detection', () => {
    it('shows default background for color URLs', () => {
      render(<RoomBackground url="/images/color" isVideo={false} />);
      const container = screen.getByRole('presentation');
      expect(container).toHaveClass('default-background');
    });

    it('shows default background for gray URLs', () => {
      render(<RoomBackground url="/images/gray" isVideo={false} />);
      const container = screen.getByRole('presentation');
      expect(container).toHaveClass('default-background');
    });

    it('shows default background for simple "color" string', () => {
      render(<RoomBackground url="color" isVideo={false} />);
      const container = screen.getByRole('presentation');
      expect(container).toHaveClass('default-background');
    });

    it('shows default background for simple "gray" string', () => {
      render(<RoomBackground url="gray" isVideo={false} />);
      const container = screen.getByRole('presentation');
      expect(container).toHaveClass('default-background');
    });

    it('does not show default background for real image URLs', () => {
      render(<RoomBackground url="https://example.com/image.jpg" isVideo={false} />);
      const container = screen.getByRole('presentation');
      expect(container).not.toHaveClass('default-background');
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
      // @ts-expect-error DOM querySelector returns Element | null, Jest expects HTMLElement
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
