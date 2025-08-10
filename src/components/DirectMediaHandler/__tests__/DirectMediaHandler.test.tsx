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

  describe('Media Type Detection', () => {
    it('should detect modern image formats as images', () => {
      // Test AVIF format
      const avifUrl = 'https://example.com/image.avif';
      const { container: avifContainer } = render(<DirectMediaHandler url={avifUrl} />);
      expect(avifContainer.querySelector('.image-background')).toBeInTheDocument();
      expect(avifContainer.querySelector('video')).not.toBeInTheDocument();

      // Test HEIF format
      const heifUrl = 'https://example.com/image.heif';
      const { container: heifContainer } = render(<DirectMediaHandler url={heifUrl} />);
      expect(heifContainer.querySelector('.image-background')).toBeInTheDocument();
      expect(heifContainer.querySelector('video')).not.toBeInTheDocument();

      // Test HEIC format
      const heicUrl = 'https://example.com/image.heic';
      const { container: heicContainer } = render(<DirectMediaHandler url={heicUrl} />);
      expect(heicContainer.querySelector('.image-background')).toBeInTheDocument();
      expect(heicContainer.querySelector('video')).not.toBeInTheDocument();

      // Test JFIF format
      const jfifUrl = 'https://example.com/image.jfif';
      const { container: jfifContainer } = render(<DirectMediaHandler url={jfifUrl} />);
      expect(jfifContainer.querySelector('.image-background')).toBeInTheDocument();
      expect(jfifContainer.querySelector('video')).not.toBeInTheDocument();
    });

    it('should detect TIFF formats as images', () => {
      // Test TIFF format
      const tiffUrl = 'https://example.com/image.tiff';
      const { container: tiffContainer } = render(<DirectMediaHandler url={tiffUrl} />);
      expect(tiffContainer.querySelector('.image-background')).toBeInTheDocument();
      expect(tiffContainer.querySelector('video')).not.toBeInTheDocument();

      // Test TIF format (short extension)
      const tifUrl = 'https://example.com/image.tif';
      const { container: tifContainer } = render(<DirectMediaHandler url={tifUrl} />);
      expect(tifContainer.querySelector('.image-background')).toBeInTheDocument();
      expect(tifContainer.querySelector('video')).not.toBeInTheDocument();
    });

    it('should handle image formats with query parameters', () => {
      const avifUrlWithQuery = 'https://example.com/image.avif?v=1.0&size=large';
      const { container } = render(<DirectMediaHandler url={avifUrlWithQuery} />);
      expect(container.querySelector('.image-background')).toBeInTheDocument();
      expect(container.querySelector('video')).not.toBeInTheDocument();
    });

    it('should handle image formats with case insensitivity', () => {
      const upperCaseUrl = 'https://example.com/image.AVIF';
      const { container: upperContainer } = render(<DirectMediaHandler url={upperCaseUrl} />);
      expect(upperContainer.querySelector('.image-background')).toBeInTheDocument();
      expect(upperContainer.querySelector('video')).not.toBeInTheDocument();

      const mixedCaseUrl = 'https://example.com/image.HeIc';
      const { container: mixedContainer } = render(<DirectMediaHandler url={mixedCaseUrl} />);
      expect(mixedContainer.querySelector('.image-background')).toBeInTheDocument();
      expect(mixedContainer.querySelector('video')).not.toBeInTheDocument();
    });

    it('should still detect existing formats as images', () => {
      const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

      formats.forEach((format) => {
        const url = `https://example.com/image.${format}`;
        const { container } = render(<DirectMediaHandler url={url} />);
        expect(container.querySelector('.image-background')).toBeInTheDocument();
        expect(container.querySelector('video')).not.toBeInTheDocument();
      });
    });

    it('should detect unknown extensions as video by default', () => {
      const videoUrl = 'https://example.com/video.mp4';
      const { container: mp4Container } = render(<DirectMediaHandler url={videoUrl} />);
      expect(mp4Container.querySelector('video')).toBeInTheDocument();
      expect(mp4Container.querySelector('.image-background')).not.toBeInTheDocument();

      const unknownUrl = 'https://example.com/media.xyz';
      const { container: unknownContainer } = render(<DirectMediaHandler url={unknownUrl} />);
      expect(unknownContainer.querySelector('video')).toBeInTheDocument();
      expect(unknownContainer.querySelector('.image-background')).not.toBeInTheDocument();
    });
  });
});
