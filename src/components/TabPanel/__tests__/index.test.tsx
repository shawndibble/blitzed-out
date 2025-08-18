import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TabPanel from '../index';

describe('TabPanel', () => {
  it('renders children when value matches index', () => {
    render(
      <TabPanel value={0} index={0}>
        <div>Test Content</div>
      </TabPanel>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('does not render children when value does not match index', () => {
    render(
      <TabPanel value={1} index={0}>
        <div>Test Content</div>
      </TabPanel>
    );

    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(
      <TabPanel value={0} index={0}>
        <div>Test Content</div>
      </TabPanel>
    );

    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('id', 'simple-tabpanel-0');
    expect(tabpanel).toHaveAttribute('aria-labelledby', 'simple-tab-0');
  });

  it('applies correct styles for mobile scrolling', () => {
    render(
      <TabPanel value={0} index={0}>
        <div>Test Content</div>
      </TabPanel>
    );

    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveStyle({ height: '100%', overflow: 'hidden' });
  });

  it('applies custom styles correctly', () => {
    const customStyles = { backgroundColor: 'red' };

    render(
      <TabPanel value={0} index={0} style={customStyles}>
        <div>Test Content</div>
      </TabPanel>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('hides content with hidden attribute when not active', () => {
    render(
      <TabPanel value={1} index={0}>
        <div>Test Content</div>
      </TabPanel>
    );

    const tabpanel = screen.getByRole('tabpanel', { hidden: true });
    expect(tabpanel).toHaveAttribute('hidden');
  });
});
