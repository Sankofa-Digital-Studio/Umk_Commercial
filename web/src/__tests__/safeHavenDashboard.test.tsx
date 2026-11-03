import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { SafeHavenDashboard } from '../components/SafeHavenDashboard';
import * as supabaseService from '../services/supabase';

vi.mock('../services/supabase', () => ({
  dispatchServerSos: vi.fn().mockResolvedValue({ success: true, beaconId: 'beacon-123' }),
  vaultIncident: vi.fn().mockResolvedValue({
    success: true,
    sha256Checksum: 'a1b2c3d4e5f678901234567890abcdef',
    message: 'Encrypted locally'
  }),
  getOrCreateAnonymousSession: vi.fn().mockResolvedValue({ access_token: 'mock-session-token' }),
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInAnonymously: vi.fn().mockResolvedValue({ data: { session: { access_token: 'mock-token' } } })
    }
  }
}));

vi.mock('../services/liveBeaconService', () => ({
  loadActiveSosBeacon: vi.fn(() => new Promise(() => {})),
  buildEphemeralResponderLink: vi.fn().mockReturnValue(null),
}));

describe('SafeHavenDashboard Component', () => {
  const mockOnPanicLock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, Safe Haven badge, and Panic Hide button', () => {
    render(<SafeHavenDashboard onPanicLock={mockOnPanicLock} />);

    expect(screen.getByText('UMKHUSELI')).toBeInTheDocument();
    expect(screen.getByText(/Safe Haven Active/i)).toBeInTheDocument();

    const panicBtn = screen.getByRole('button', { name: /Panic Hide/i });
    expect(panicBtn).toBeInTheDocument();

    fireEvent.click(panicBtn);
    expect(mockOnPanicLock).toHaveBeenCalledTimes(1);
  });

  describe('SOS Emergency Tab', () => {
    it('displays the primary SOS view and keeps supporting lifelines closed by default', () => {
      render(<SafeHavenDashboard onPanicLock={mockOnPanicLock} />);

      expect(screen.getByText(/EMERGENCY DISTRESS BEACON/i)).toBeInTheDocument();
      expect(screen.getByText(/HOLD SOS/i)).toBeInTheDocument();

      const lifelinesToggle = screen.getByRole('button', { name: /Direct Emergency Lifelines/i });
      expect(lifelinesToggle).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(lifelinesToggle);
      expect(screen.getByText('National GBV Command Centre')).toBeInTheDocument();
      expect(screen.getByText('SAPS Emergency Services')).toBeInTheDocument();
      expect(screen.getByText('Childline South Africa')).toBeInTheDocument();
    });

    it('opens toll-free lifelines inside Safe Haven before launching the phone dialler', () => {
      render(<SafeHavenDashboard onPanicLock={mockOnPanicLock} />);

      fireEvent.click(screen.getByRole('button', { name: /Direct Emergency Lifelines/i }));
      fireEvent.click(screen.getByText('National GBV Command Centre').closest('div')!);

      expect(screen.getByText(/In-app lifeline contact/i)).toBeInTheDocument();
      expect(screen.getAllByText('0800428428').length).toBeGreaterThan(0);
      expect(screen.getByText(/Safe Haven Active/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Open phone dialler/i })).toHaveAttribute('href', 'tel:0800428428');
    });

    it('arms SOS and allows canceling before countdown finishes', () => {
      vi.useFakeTimers();
      render(<SafeHavenDashboard onPanicLock={mockOnPanicLock} />);

      const holdSosBtn = screen.getByRole('button', { name: /HOLD SOS/i });
      fireEvent.click(holdSosBtn);

      // Should show countdown
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel Distress Signal/i })).toBeInTheDocument();

      // Tick 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('2')).toBeInTheDocument();

      // Cancel
      const cancelBtn = screen.getByRole('button', { name: /Cancel Distress Signal/i });
      fireEvent.click(cancelBtn);

      // Returned to Hold SOS
      expect(screen.getByText(/HOLD SOS/i)).toBeInTheDocument();
      expect(supabaseService.dispatchServerSos).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Thuthuzela Care Centres (TCC) Tab', () => {
    it('switches to Centres tab and filters centres by province', () => {
      render(<SafeHavenDashboard onPanicLock={mockOnPanicLock} />);

      const centresTabBtn = screen.getByRole('button', { name: /Centres/i });
      fireEvent.click(centresTabBtn);

      expect(screen.getByText(/Select Province/i)).toBeInTheDocument();
      // Should show centres from all provinces initially
      expect(screen.getByText('Chris Hani Baragwanath TCC')).toBeInTheDocument();
      expect(screen.getByText('Karl Bremer TCC')).toBeInTheDocument();

      // Filter by Western Cape
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Western Cape' } });

      expect(screen.getByText('Karl Bremer TCC')).toBeInTheDocument();
      expect(screen.getByText('Heideveld TCC')).toBeInTheDocument();
      expect(screen.queryByText('Chris Hani Baragwanath TCC')).not.toBeInTheDocument();
    });

    it('filters centres by text search query', () => {
      render(<SafeHavenDashboard onPanicLock={mockOnPanicLock} />);

      const centresTabBtn = screen.getByRole('button', { name: /Centres/i });
      fireEvent.click(centresTabBtn);

      const searchInput = screen.getByPlaceholderText(/Search hospital or town/i);
      fireEvent.change(searchInput, { target: { value: 'Durban' } });

      expect(screen.getByText('King Edward VIII TCC')).toBeInTheDocument();
      expect(screen.queryByText('Karl Bremer TCC')).not.toBeInTheDocument();
    });
  });

  describe('Legal Evidence Vault Tab', () => {
    it('requires PIN 8426 or 1234 to unlock the domestic violence incident vault', () => {
      render(<SafeHavenDashboard onPanicLock={mockOnPanicLock} />);

      const vaultTabBtn = screen.getByRole('button', { name: /Vault/i });
      fireEvent.click(vaultTabBtn);

      expect(screen.getByText(/Encrypted Vault Protected/i)).toBeInTheDocument();

      // Try wrong PIN
      const pinInput = screen.getByPlaceholderText(/Enter 4-Digit PIN/i);
      fireEvent.change(pinInput, { target: { value: '0000' } });
      const unlockBtn = screen.getByRole('button', { name: /Unlock Vault/i });
      fireEvent.click(unlockBtn);

      expect(screen.getByText(/Invalid credentials. Try again./i)).toBeInTheDocument();

      // Try correct PIN 8426
      fireEvent.change(pinInput, { target: { value: '8426' } });
      fireEvent.click(unlockBtn);

      // Now unlocked
      expect(screen.getByText('Vault Decrypted (AES-256-GCM)')).toBeInTheDocument();
      expect(screen.getByText(/Log New Incident/i)).toBeInTheDocument();
    });

    it('vaults encrypted incident and scrubs sensitive local inputs', async () => {
      render(<SafeHavenDashboard onPanicLock={mockOnPanicLock} />);

      // Navigate and unlock
      fireEvent.click(screen.getByRole('button', { name: /Vault/i }));
      const pinInput = screen.getByPlaceholderText(/Enter 4-Digit PIN/i);
      fireEvent.change(pinInput, { target: { value: '8426' } });
      fireEvent.click(screen.getByRole('button', { name: /Unlock Vault/i }));

      // Fill incident form
      const perpetratorInput = screen.getByPlaceholderText(/e\.g\. Spouse, Ex-partner/i);
      fireEvent.change(perpetratorInput, { target: { value: 'Known Individual' } });

      const locationInput = screen.getByPlaceholderText(/Shared home kitchen/i);
      fireEvent.change(locationInput, { target: { value: 'Soweto, Gauteng' } });

      const narrativeInput = screen.getByPlaceholderText(/Describe what occurred in your own words/i);
      fireEvent.change(narrativeInput, { target: { value: 'Physical assault incident in living room.' } });

      const saveBtn = screen.getByRole('button', { name: /Encrypt & Vault in Cloud/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(supabaseService.vaultIncident).toHaveBeenCalledWith(
          expect.objectContaining({
            perpetrator: 'Known Individual',
            locationDescription: 'Soweto, Gauteng',
            description: 'Physical assault incident in living room.'
          })
        );
      });

      // Feedback message shows scrub confirmation
      await waitFor(() => {
        expect(screen.getByText(/Incident encrypted and vaulted securely/i)).toBeInTheDocument();
      });

      // Local inputs were zeroed
      expect(narrativeInput).toHaveValue('');
      expect(perpetratorInput).toHaveValue('');
      expect(locationInput).toHaveValue('');
    });
  });
});
