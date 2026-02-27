import { render, screen, fireEvent, act } from '@testing-library/react';
import BetaBanner from '@/components/BetaBanner';

describe('BetaBanner', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
    // Reset CSS variable before each test
    document.documentElement.style.removeProperty('--beta-banner-height');
  });

  it('renders banner by default', async () => {
    await act(async () => {
      render(<BetaBanner />);
    });
    expect(screen.getByTestId('betaBanner')).toBeInTheDocument();
  });

  it('displays the beta service message', async () => {
    await act(async () => {
      render(<BetaBanner />);
    });
    expect(screen.getByTestId('betaBannerMessage')).toHaveTextContent(
      '현재 베타 서비스 운영 중입니다.'
    );
  });

  it('renders a close button', async () => {
    await act(async () => {
      render(<BetaBanner />);
    });
    expect(screen.getByTestId('betaBannerClose')).toBeInTheDocument();
  });

  it('hides banner after close button click', async () => {
    await act(async () => {
      render(<BetaBanner />);
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('betaBannerClose'));
    });
    expect(screen.queryByTestId('betaBanner')).not.toBeInTheDocument();
  });

  it('sets betaBannerDismissed in localStorage on close', async () => {
    await act(async () => {
      render(<BetaBanner />);
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('betaBannerClose'));
    });
    expect(localStorage.getItem('betaBannerDismissed')).toBe('true');
  });

  it('does not render if betaBannerDismissed is set in localStorage', async () => {
    localStorage.setItem('betaBannerDismissed', 'true');
    await act(async () => {
      render(<BetaBanner />);
    });
    expect(screen.queryByTestId('betaBanner')).not.toBeInTheDocument();
  });

  it('sets --beta-banner-height CSS variable to 44px when visible', async () => {
    await act(async () => {
      render(<BetaBanner />);
    });
    expect(
      document.documentElement.style.getPropertyValue('--beta-banner-height')
    ).toBe('44px');
  });

  it('sets --beta-banner-height CSS variable to 0px when dismissed', async () => {
    await act(async () => {
      render(<BetaBanner />);
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('betaBannerClose'));
    });
    expect(
      document.documentElement.style.getPropertyValue('--beta-banner-height')
    ).toBe('0px');
  });
});
