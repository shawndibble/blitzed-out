import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, waitFor } from '@/test-utils';

import DirectMediaHandler from '../index';

describe('DirectMediaHandler', () => {
  beforeEach(() => {
    // Clear any previous DOM state
    document.body.innerHTML = '';
  });

  describe('Component rendering', () => {
    it('renders without crashing with valid URL', () => {
      const url = 'https://example.com/video.mp4';
      render(<DirectMediaHandler url={url} />);

      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('returns null when url is null', () => {
      const { container } = render(<DirectMediaHandler url={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when url is empty string', () => {
      const { container } = render(<DirectMediaHandler url="" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Video rendering', () => {
    it('renders video element initially', () => {
      const videoUrl = 'https://example.com/video.mp4';
      render(<DirectMediaHandler url={videoUrl} />);

      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', videoUrl);
      expect(video).toHaveAttribute('autoplay');
      expect(video).toHaveAttribute('loop');
      expect(video).toHaveProperty('muted', true);
      expect(video).toHaveAttribute('playsinline');
      expect(video).toHaveClass('video-background');
      expect(video).toHaveAttribute('preload', 'auto');
      expect(video).toHaveAttribute('crossorigin', 'anonymous');
      expect(video).toHaveAttribute('controls');
    });

    it('resets to video when URL prop changes', () => {
      const initialUrl = 'https://example.com/video1.mp4';
      const { rerender } = render(<DirectMediaHandler url={initialUrl} />);

      // Trigger video error to switch to image mode
      const video = document.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }

      // Change URL
      const newUrl = 'https://example.com/video2.mp4';
      rerender(<DirectMediaHandler url={newUrl} />);

      // Should be back to video mode with new URL
      const newVideo = document.querySelector('video');
      expect(newVideo).toBeInTheDocument();
      expect(newVideo).toHaveAttribute('src', newUrl);
    });
  });

  describe('Video error handling', () => {
    it('falls back to image when video fails to load (Imgur)', async () => {
      const imgurUrl = 'https://i.imgur.com/abc123.mp4';
      render(<DirectMediaHandler url={imgurUrl} />);

      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();

      // Simulate video error
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const imageBackground = document.querySelector('.image-background');
        expect(imageBackground).toBeInTheDocument();
        expect(imageBackground).toHaveStyle(
          'background-image: url(https://i.imgur.com/abc123.jpg)'
        );
      });

      // Video should no longer be visible
      expect(document.querySelector('video')).not.toBeInTheDocument();
    });

    it('falls back to image when video fails to load (generic URL)', async () => {
      const genericUrl = 'https://example.com/media.mp4';
      render(<DirectMediaHandler url={genericUrl} />);

      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();

      // Simulate video error
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const imageBackground = document.querySelector('.image-background');
        expect(imageBackground).toBeInTheDocument();
        expect(imageBackground).toHaveStyle('background-image: url(https://example.com/media.jpg)');
      });
    });

    it('handles video error with query parameters', async () => {
      const urlWithParams = 'https://example.com/media.mp4?token=abc123';
      render(<DirectMediaHandler url={urlWithParams} />);

      const video = document.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const imageBackground = document.querySelector('.image-background');
        expect(imageBackground).toHaveStyle('background-image: url(https://example.com/media.jpg)');
      });
    });

    it('handles different video extensions (webm, ogg, mov)', async () => {
      const extensions = ['webm', 'ogg', 'mov'];

      for (const ext of extensions) {
        const videoUrl = `https://example.com/media.${ext}`;
        const { unmount } = render(<DirectMediaHandler url={videoUrl} />);

        const video = document.querySelector('video');
        if (video) {
          fireEvent.error(video);
        }

        await waitFor(() => {
          const imageBackground = document.querySelector('.image-background');
          expect(imageBackground).toHaveStyle(
            'background-image: url(https://example.com/media.jpg)'
          );
        });

        unmount();
      }
    });
  });

  describe('Image error handling', () => {
    it('tries different image formats when image fails (Imgur)', async () => {
      const imgurUrl = 'https://i.imgur.com/abc123.mp4';
      render(<DirectMediaHandler url={imgurUrl} />);

      const video = document.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const hiddenImg = document.querySelector('img[style*="display: none"]');
        expect(hiddenImg).toBeInTheDocument();
      });

      // Simulate image error to trigger format fallback
      const hiddenImg = document.querySelector('img[style*="display: none"]');
      if (hiddenImg) {
        fireEvent.error(hiddenImg);
      }

      await waitFor(() => {
        const imageBackground = document.querySelector('.image-background');
        expect(imageBackground).toHaveStyle(
          'background-image: url(https://i.imgur.com/abc123.png)'
        );
      });
    });

    it('tries different image formats when image fails (generic URL)', async () => {
      const genericUrl = 'https://example.com/media.mp4';
      render(<DirectMediaHandler url={genericUrl} />);

      const video = document.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const hiddenImg = document.querySelector('img[style*="display: none"]');
        expect(hiddenImg).toBeInTheDocument();
      });

      // Simulate image error to trigger format fallback
      const hiddenImg = document.querySelector('img[style*="display: none"]');
      if (hiddenImg) {
        fireEvent.error(hiddenImg);
      }

      await waitFor(() => {
        const imageBackground = document.querySelector('.image-background');
        expect(imageBackground).toHaveStyle('background-image: url(https://example.com/media.png)');
      });
    });

    it('cycles through all image formats for Imgur', async () => {
      const imgurUrl = 'https://i.imgur.com/abc123.mp4';
      render(<DirectMediaHandler url={imgurUrl} />);

      // Start with video error
      const video = document.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const hiddenImg = document.querySelector('img[style*="display: none"]');
        expect(hiddenImg).toBeInTheDocument();
      });

      // Test cycling through formats: jpg -> png -> gif -> jpeg -> webp
      const expectedFormats = ['png', 'gif', 'jpeg', 'webp'];

      for (const format of expectedFormats) {
        const hiddenImg = document.querySelector('img[style*="display: none"]');
        if (hiddenImg) {
          fireEvent.error(hiddenImg);
        }

        await waitFor(() => {
          const imageBackground = document.querySelector('.image-background');
          expect(imageBackground).toHaveStyle(
            `background-image: url(https://i.imgur.com/abc123.${format})`
          );
        });
      }
    });

    it('cycles through all image formats for generic URLs', async () => {
      const genericUrl = 'https://example.com/media.mp4';
      render(<DirectMediaHandler url={genericUrl} />);

      // Start with video error
      const video = document.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const hiddenImg = document.querySelector('img[style*="display: none"]');
        expect(hiddenImg).toBeInTheDocument();
      });

      // Test cycling through formats: jpg -> png -> gif -> jpeg -> webp
      const expectedFormats = ['png', 'gif', 'jpeg', 'webp'];

      for (const format of expectedFormats) {
        const hiddenImg = document.querySelector('img[style*="display: none"]');
        if (hiddenImg) {
          fireEvent.error(hiddenImg);
        }

        await waitFor(() => {
          const imageBackground = document.querySelector('.image-background');
          expect(imageBackground).toHaveStyle(
            `background-image: url(https://example.com/media.${format})`
          );
        });
      }
    });
  });

  describe('Image background rendering', () => {
    it('renders image background with correct styles', async () => {
      const videoUrl = 'https://example.com/media.mp4';
      render(<DirectMediaHandler url={videoUrl} />);

      const video = document.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const imageBackground = document.querySelector('.image-background');
        expect(imageBackground).toBeInTheDocument();
        expect(imageBackground).toHaveStyle({
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: '0px',
          left: '0px',
        });
      });
    });

    it('renders hidden img element for error handling', async () => {
      const videoUrl = 'https://example.com/media.mp4';
      render(<DirectMediaHandler url={videoUrl} />);

      const video = document.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const hiddenImg = document.querySelector('img[style*="display: none"]');
        expect(hiddenImg).toBeInTheDocument();
        expect(hiddenImg).toHaveStyle('display: none');
        expect(hiddenImg).toHaveAttribute('alt', '');
      });
    });
  });

  describe('URL parsing error handling', () => {
    it('handles malformed URLs gracefully for video errors', async () => {
      const malformedUrl = 'not-a-valid-url';
      render(<DirectMediaHandler url={malformedUrl} />);

      const video = document.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const imageBackground = document.querySelector('.image-background');
        expect(imageBackground).toBeInTheDocument();
        // Should fallback to generic .jpg extension
        expect(imageBackground).toHaveStyle('background-image: url(not-a-valid-url.jpg)');
      });
    });

    it('handles malformed URLs gracefully for image errors', async () => {
      const malformedUrl = 'not-a-valid-url';
      render(<DirectMediaHandler url={malformedUrl} />);

      const video = document.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const hiddenImg = document.querySelector('img[style*="display: none"]');
        expect(hiddenImg).toBeInTheDocument();
      });

      const hiddenImg = document.querySelector('img[style*="display: none"]');
      if (hiddenImg) {
        fireEvent.error(hiddenImg);
      }

      await waitFor(() => {
        const imageBackground = document.querySelector('.image-background');
        expect(imageBackground).toBeInTheDocument();
        // Should try next format
        expect(imageBackground).toHaveStyle('background-image: url(not-a-valid-url.png)');
      });
    });
  });

  describe('Accessibility', () => {
    it('video has appropriate attributes for accessibility', () => {
      const videoUrl = 'https://example.com/video.mp4';
      render(<DirectMediaHandler url={videoUrl} />);

      const video = document.querySelector('video');
      expect(video).toHaveProperty('muted', true); // Important for autoplay accessibility
      expect(video).toHaveAttribute('playsinline'); // Mobile accessibility
      expect(video).toHaveAttribute('controls'); // User control
    });

    it('hidden image has empty alt text', async () => {
      const videoUrl = 'https://example.com/media.mp4';
      render(<DirectMediaHandler url={videoUrl} />);

      const video = document.querySelector('video');
      if (video) {
        fireEvent.error(video);
      }

      await waitFor(() => {
        const hiddenImg = document.querySelector('img[style*="display: none"]');
        expect(hiddenImg).toHaveAttribute('alt', '');
      });
    });
  });
});
