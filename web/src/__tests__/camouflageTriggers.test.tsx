import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import { MunicipalPrepaidCalculator } from '../components/MunicipalPrepaidCalculator';
import App from '../App';
import * as supabaseService from '../services/supabase';

// Mock Supabase service
vi.mock('../services/supabase', () => ({
  dispatchServerSos: vi.fn().mockResolvedValue({ success: true }),
  vaultIncident: vi.fn().mockResolvedValue({ success: true }),
  getOrCreateAnonymousSession: vi.fn().mockResolvedValue({
    access_token: 'mock-token',
    user: { id: 'test-anonymous-user' },
  }),
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInAnonymously: vi.fn().mockResolvedValue({ data: { session: { access_token: 'mock-token' } } })
    }
  }
}));

describe('Camouflage Secret Unlock & Duress Emergency Triggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Secret Safe Haven Unlock PIN (8426)', () => {
    it('triggers onUnlockSafeHaven when "8426" is entered as purchase amount', () => {
      const onUnlockSafeHaven = vi.fn();
      const onDuressTrigger = vi.fn();

      render(
        <MunicipalPrepaidCalculator
          onUnlockSafeHaven={onUnlockSafeHaven}
          onDuressTrigger={onDuressTrigger}
        />
      );

      const amountInput = screen.getByLabelText(/Purchase Amount/i);
      fireEvent.change(amountInput, { target: { value: '8426' } });

      const form = amountInput.closest('form');
      expect(form).not.toBeNull();
      fireEvent.submit(form!);

      expect(onUnlockSafeHaven).toHaveBeenCalledTimes(1);
      expect(onDuressTrigger).not.toHaveBeenCalled();
      // Should not display standard calculation results
      expect(screen.queryByText(/ESTIMATED UNITS/i)).not.toBeInTheDocument();
    });

    it('triggers onUnlockSafeHaven when meter number ends with "8426"', () => {
      const onUnlockSafeHaven = vi.fn();
      const onDuressTrigger = vi.fn();

      render(
        <MunicipalPrepaidCalculator
          onUnlockSafeHaven={onUnlockSafeHaven}
          onDuressTrigger={onDuressTrigger}
        />
      );

      const meterInput = screen.getByLabelText(/Prepaid Meter Number/i);
      fireEvent.change(meterInput, { target: { value: '04182948426' } });

      const form = meterInput.closest('form');
      fireEvent.submit(form!);

      expect(onUnlockSafeHaven).toHaveBeenCalledTimes(1);
      expect(onDuressTrigger).not.toHaveBeenCalled();
    });

    it('triggers onUnlockSafeHaven with covert 3-tap crest gesture within 800ms', () => {
      const onUnlockSafeHaven = vi.fn();
      const onDuressTrigger = vi.fn();

      render(
        <MunicipalPrepaidCalculator
          onUnlockSafeHaven={onUnlockSafeHaven}
          onDuressTrigger={onDuressTrigger}
        />
      );

      const crest = screen.getByTitle('Municipal Verification Shield');

      // Rapid 3 taps
      fireEvent.click(crest);
      fireEvent.click(crest);
      fireEvent.click(crest);

      expect(onUnlockSafeHaven).toHaveBeenCalledTimes(1);
    });

    it('resets tap count if taps are slower than 800ms apart', async () => {
      const onUnlockSafeHaven = vi.fn();
      const onDuressTrigger = vi.fn();

      vi.useFakeTimers();

      render(
        <MunicipalPrepaidCalculator
          onUnlockSafeHaven={onUnlockSafeHaven}
          onDuressTrigger={onDuressTrigger}
        />
      );

      const crest = screen.getByTitle('Municipal Verification Shield');

      // Tap 1
      fireEvent.click(crest);

      // Advance time by 1000ms (>800ms threshold)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Tap 2 (resets counter to 1)
      fireEvent.click(crest);

      expect(onUnlockSafeHaven).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Duress PIN (9999) - Silent Dispatch & Decoy Deception', () => {
    it('triggers silent SOS dispatch and displays realistic decoy STS token when PIN 9999 is submitted in amount', () => {
      const onUnlockSafeHaven = vi.fn();
      const onDuressTrigger = vi.fn();

      render(
        <MunicipalPrepaidCalculator
          onUnlockSafeHaven={onUnlockSafeHaven}
          onDuressTrigger={onDuressTrigger}
        />
      );

      const amountInput = screen.getByLabelText(/Purchase Amount/i);
      fireEvent.change(amountInput, { target: { value: '9999' } });

      const form = amountInput.closest('form');
      fireEvent.submit(form!);

      // Duress trigger must be called
      expect(onDuressTrigger).toHaveBeenCalledTimes(1);
      expect(onUnlockSafeHaven).not.toHaveBeenCalled();

      // Deception check: Displays realistic R200 electricity token so assailant sees nothing suspicious
      expect(screen.getByText(/ESTIMATED UNITS/i)).toBeInTheDocument();
      expect(screen.getByText('4819 0281 9481 0294 8812')).toBeInTheDocument();
      expect(screen.getByText('SAMPLE STS RECHARGE TOKEN')).toBeInTheDocument();

      // Error 30: KRN2 Rollover terminal modal is rendered immediately
      expect(screen.getByText(/STS DIAGNOSTIC — ERROR 30/i)).toBeInTheDocument();
      expect(screen.getByText(/TID_ROLLOVER_KRN2_EXPIRED/i)).toBeInTheDocument();
      expect(screen.getAllByText(/TRANSACTION HALTED/i).length).toBeGreaterThan(0);
    });

    it('triggers silent SOS dispatch and displays fake token when meter number ends with "9999"', () => {
      const onUnlockSafeHaven = vi.fn();
      const onDuressTrigger = vi.fn();

      render(
        <MunicipalPrepaidCalculator
          onUnlockSafeHaven={onUnlockSafeHaven}
          onDuressTrigger={onDuressTrigger}
        />
      );

      const meterInput = screen.getByLabelText(/Prepaid Meter Number/i);
      fireEvent.change(meterInput, { target: { value: '04182949999' } });

      const form = meterInput.closest('form');
      fireEvent.submit(form!);

      expect(onDuressTrigger).toHaveBeenCalledTimes(1);
      expect(screen.getByText('4819 0281 9481 0294 8812')).toBeInTheDocument();
      expect(screen.getByText(/STS DIAGNOSTIC — ERROR 30/i)).toBeInTheDocument();
      expect(screen.getByText(/TID_ROLLOVER_KRN2_EXPIRED/i)).toBeInTheDocument();
    });
  });

  describe('App Component Camouflage Integration & Evasion Controls', () => {
    it('starts in DECOY_CALCULATOR mode by default', () => {
      render(<App />);
      expect(screen.getByText('Prepaid Electricity Portal')).toBeInTheDocument();
      expect(screen.queryByText(/Safe Haven/i)).not.toBeInTheDocument();
    });

    it('switches to Safe Haven mode when unlocked with secret PIN 8426', () => {
      render(<App />);

      const amountInput = screen.getByLabelText(/Purchase Amount/i);
      fireEvent.change(amountInput, { target: { value: '8426' } });

      const form = amountInput.closest('form');
      fireEvent.submit(form!);

      // Now in Safe Haven mode
      expect(screen.getByText(/Safe Haven Active/i)).toBeInTheDocument();
      expect(screen.queryByText('Prepaid Electricity Portal')).not.toBeInTheDocument();
    });

    it('immediately reverts to Decoy mode when Panic Lock button is clicked', () => {
      render(<App />);

      // Unlock
      const amountInput = screen.getByLabelText(/Purchase Amount/i);
      fireEvent.change(amountInput, { target: { value: '8426' } });
      const form = amountInput.closest('form');
      fireEvent.submit(form!);
      expect(screen.getByText(/Safe Haven Active/i)).toBeInTheDocument();

      // Click Panic Hide
      const lockBtn = screen.getByRole('button', { name: /Panic Hide/i });
      fireEvent.click(lockBtn);

      // Decoy portal is restored
      expect(screen.getByText('Prepaid Electricity Portal')).toBeInTheDocument();
      expect(screen.queryByText(/Safe Haven Active/i)).not.toBeInTheDocument();
    });

    it('immediately reverts to Decoy mode on visibilitychange event (e.g. app switch or screen lock)', () => {
      render(<App />);

      // Unlock into Safe Haven
      const amountInput = screen.getByLabelText(/Purchase Amount/i);
      fireEvent.change(amountInput, { target: { value: '8426' } });
      fireEvent.submit(amountInput.closest('form')!);
      expect(screen.getByText(/Safe Haven Active/i)).toBeInTheDocument();

      // Simulate switching tabs/locking screen
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true
      });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(screen.getByText('Prepaid Electricity Portal')).toBeInTheDocument();
      expect(screen.queryByText(/Safe Haven Active/i)).not.toBeInTheDocument();
    });

    it('immediately reverts to Decoy mode on device orientation flip (phone placed face-down)', () => {
      render(<App />);

      // Unlock into Safe Haven
      const amountInput = screen.getByLabelText(/Purchase Amount/i);
      fireEvent.change(amountInput, { target: { value: '8426' } });
      fireEvent.submit(amountInput.closest('form')!);
      expect(screen.getByText(/Safe Haven Active/i)).toBeInTheDocument();

      // Simulate device flip face-down (beta > 160)
      act(() => {
        const orientationEvent = new Event('deviceorientation') as any;
        orientationEvent.beta = 175;
        window.dispatchEvent(orientationEvent);
      });

      expect(screen.getByText('Prepaid Electricity Portal')).toBeInTheDocument();
      expect(screen.queryByText(/Safe Haven Active/i)).not.toBeInTheDocument();
    });

    it('immediately reverts to Decoy mode on rapid root double-tap gesture within 350ms', () => {
      render(<App />);

      // Unlock into Safe Haven
      const amountInput = screen.getByLabelText(/Purchase Amount/i);
      fireEvent.change(amountInput, { target: { value: '8426' } });
      fireEvent.submit(amountInput.closest('form')!);
      expect(screen.getByText(/Safe Haven Active/i)).toBeInTheDocument();

      const rootContainer = screen.getByTestId('root-panic-container');

      const dateSpy = vi.spyOn(Date, 'now');
      let simulatedTime = 50000;
      dateSpy.mockImplementation(() => simulatedTime);

      // First tap
      fireEvent.click(rootContainer);
      expect(screen.getByText(/Safe Haven Active/i)).toBeInTheDocument();

      // Rapid second tap within 350ms (simulated 100ms later)
      simulatedTime += 100;
      fireEvent.click(rootContainer);

      // Decoy is restored instantly in 0ms
      expect(screen.getByText('Prepaid Electricity Portal')).toBeInTheDocument();
      expect(screen.queryByText(/Safe Haven Active/i)).not.toBeInTheDocument();

      dateSpy.mockRestore();
    });

    it('immediately reverts to Decoy mode on hardware Escape keydown event', () => {
      render(<App />);

      // Unlock into Safe Haven
      const amountInput = screen.getByLabelText(/Purchase Amount/i);
      fireEvent.change(amountInput, { target: { value: '8426' } });
      fireEvent.submit(amountInput.closest('form')!);
      expect(screen.getByText(/Safe Haven Active/i)).toBeInTheDocument();

      // Trigger Escape key
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(screen.getByText('Prepaid Electricity Portal')).toBeInTheDocument();
      expect(screen.queryByText(/Safe Haven Active/i)).not.toBeInTheDocument();
    });

    it('immediately reverts to Decoy mode on proximity sensor trigger (phone pressed facedown)', () => {
      render(<App />);

      // Unlock into Safe Haven
      const amountInput = screen.getByLabelText(/Purchase Amount/i);
      fireEvent.change(amountInput, { target: { value: '8426' } });
      fireEvent.submit(amountInput.closest('form')!);
      expect(screen.getByText(/Safe Haven Active/i)).toBeInTheDocument();

      // Simulate proximity near event
      act(() => {
        const proxEvent = new Event('userproximity') as any;
        proxEvent.near = true;
        window.dispatchEvent(proxEvent);
      });

      expect(screen.getByText('Prepaid Electricity Portal')).toBeInTheDocument();
      expect(screen.queryByText(/Safe Haven Active/i)).not.toBeInTheDocument();
    });

    it('dispatches silent duress beacon via dispatchServerSos when PIN 9999 is entered in App', async () => {
      render(<App />);

      const amountInput = screen.getByLabelText(/Purchase Amount/i);
      fireEvent.change(amountInput, { target: { value: '9999' } });
      fireEvent.submit(amountInput.closest('form')!);

      await waitFor(() => {
        expect(supabaseService.dispatchServerSos).toHaveBeenCalledWith(
          expect.objectContaining({
            isDuress: true,
            areaName: 'Duress Beacon (Prepaid Portal)',
            userId: 'test-anonymous-user',
            channels: expect.arrayContaining(['WHATSAPP', 'SMS', 'EMAIL', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK'])
          })
        );
      });
    });
  });
});
