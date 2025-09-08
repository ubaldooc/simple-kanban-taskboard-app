import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the main title of the board', () => {
  render(<App />);
  const titleElement = screen.getByText(/Gemini Task Board/i);
  expect(titleElement).toBeInTheDocument();
});
