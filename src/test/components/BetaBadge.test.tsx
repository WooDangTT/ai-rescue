import { render, screen } from '@testing-library/react';
import BetaBadge from '@/components/BetaBadge';

describe('BetaBadge', () => {
  it('renders the BETA badge', () => {
    render(<BetaBadge />);
    expect(screen.getByTestId('betaBadge')).toBeInTheDocument();
  });

  it('displays BETA text', () => {
    render(<BetaBadge />);
    expect(screen.getByTestId('betaBadge')).toHaveTextContent('BETA');
  });

  it('renders as a span element', () => {
    render(<BetaBadge />);
    const badge = screen.getByTestId('betaBadge');
    expect(badge.tagName.toLowerCase()).toBe('span');
  });

  it('has the beta-badge CSS class', () => {
    render(<BetaBadge />);
    const badge = screen.getByTestId('betaBadge');
    expect(badge).toHaveClass('beta-badge');
  });
});
