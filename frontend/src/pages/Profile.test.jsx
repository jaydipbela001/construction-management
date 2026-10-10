import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';

const mocks = vi.hoisted(() => ({
  updateAdmin: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ admin: { name: 'Site Lead', email: 'lead@example.com' }, updateAdmin: mocks.updateAdmin }),
}));

vi.mock('../hooks/useToast', () => ({
  useToast: () => mocks.toast,
}));

vi.mock('../services/authService', () => ({
  default: {
    updateProfile: mocks.updateProfile,
    changePassword: mocks.changePassword,
  },
}));

function renderProfile() {
  return render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>
  );
}

describe('Profile', () => {
  it('prefills the form with the current admin details', () => {
    renderProfile();
    expect(screen.getByLabelText(/Name/)).toHaveValue('Site Lead');
    expect(screen.getByLabelText(/Email/)).toHaveValue('lead@example.com');
    expect(screen.getByRole('heading', { name: 'Change password' })).toBeInTheDocument();
  });

  it('saves profile changes and updates auth context', async () => {
    const user = userEvent.setup();
    mocks.updateProfile.mockResolvedValueOnce({
      name: 'Site Manager',
      email: 'lead@example.com',
    });

    renderProfile();
    const nameInput = screen.getByLabelText(/Name/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Site Manager');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(mocks.updateProfile).toHaveBeenCalledWith({
      name: 'Site Manager',
      email: 'lead@example.com',
    });
    expect(mocks.toast.success).toHaveBeenCalled();
    expect(mocks.updateAdmin).toHaveBeenCalledWith({
      name: 'Site Manager',
      email: 'lead@example.com',
    });
  });

  it('validates the password form before submitting', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.type(screen.getByLabelText(/Current password/), 'oldpass1');
    await user.type(screen.getByLabelText(/New password/), 'newpass1');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });
});