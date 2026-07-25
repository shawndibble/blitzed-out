import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';

import JumpNav, { JumpNavEntry } from '../JumpNav';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockIsMobile = vi.fn();
vi.mock('@/hooks/useBreakpoint', () => ({ default: () => mockIsMobile() }));

let observerCallback: IntersectionObserverCallback = () => {};
const observe = vi.fn();
const disconnect = vi.fn();

class FakeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }
  observe = observe;
  disconnect = disconnect;
  unobserve = vi.fn();
}

const ENTRIES: JumpNavEntry[] = [
  { id: 'section-a', labelKey: 'labelA', scope: 'room' },
  { id: 'section-b', labelKey: 'labelB', scope: 'board' },
];

function fireIntersecting(id: string): void {
  const target = document.getElementById(id) as Element;
  act(() => {
    observerCallback(
      [
        {
          isIntersecting: true,
          target,
          boundingClientRect: { top: 0 },
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver
    );
  });
}

describe('JumpNav', () => {
  beforeEach(() => {
    observe.mockClear();
    disconnect.mockClear();
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    // jsdom doesn't implement scrollIntoView.
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('scroll-spies on mobile too — the active chip updates from intersection, not just from tapping', () => {
    mockIsMobile.mockReturnValue(true);
    const { container } = render(
      <div>
        <div id="section-a" />
        <div id="section-b" />
        <JumpNav entries={ENTRIES} onNavigate={vi.fn()} />
      </div>
    );

    expect(observe).toHaveBeenCalledTimes(2);

    fireIntersecting('section-b');

    const chips = container.querySelectorAll('.MuiChip-root');
    expect(chips[0]).toHaveClass('MuiChip-outlined');
    expect(chips[1]).toHaveClass('MuiChip-filled');
  });

  it('scrolls the active chip into view horizontally when it becomes active off-screen', () => {
    mockIsMobile.mockReturnValue(true);
    const scrollIntoView = HTMLElement.prototype.scrollIntoView as ReturnType<typeof vi.fn>;

    render(
      <div>
        <div id="section-a" />
        <div id="section-b" />
        <JumpNav entries={ENTRIES} onNavigate={vi.fn()} />
      </div>
    );

    fireIntersecting('section-b');

    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ inline: 'nearest', block: 'nearest' })
    );
  });

  it('still scroll-spies on desktop', () => {
    mockIsMobile.mockReturnValue(false);
    render(
      <div>
        <div id="section-a" />
        <div id="section-b" />
        <JumpNav entries={ENTRIES} onNavigate={vi.fn()} />
      </div>
    );

    fireIntersecting('section-b');

    expect(document.querySelector('.Mui-selected')?.textContent).toBe('labelB');
  });
});
