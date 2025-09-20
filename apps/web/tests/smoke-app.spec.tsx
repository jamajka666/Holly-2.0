import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App smoke test', () => {
  it('renders app root', () => {
    render(<App />);
    expect(screen.getByTestId('app-root')).toBeInTheDocument();
  });
});
