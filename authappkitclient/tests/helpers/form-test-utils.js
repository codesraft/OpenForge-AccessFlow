import { fireEvent, screen } from '@testing-library/react';

// Types into a field found by its label, the way a person would.
export function fillIn(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

export function clickButton(name) {
  fireEvent.click(screen.getByRole('button', { name }));
}