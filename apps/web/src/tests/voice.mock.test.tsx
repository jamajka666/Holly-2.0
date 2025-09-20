import { render, fireEvent } from '@testing-library/react';
import VoiceButton from '../components/VoiceButton';

test('renders VoiceButton and toggles listening', () => {
  const { getByLabelText } = render(<VoiceButton />);
  const btn = getByLabelText('Press to talk');
  fireEvent.click(btn);
  fireEvent.click(btn);
});
