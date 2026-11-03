import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MunicipalPrepaidCalculator } from '../components/MunicipalPrepaidCalculator';

describe('Municipal Prepaid Electricity Calculator (Decoy Math & Utilities)', () => {
  const defaultProps = {
    onUnlockSafeHaven: vi.fn(),
    onDuressTrigger: vi.fn()
  };

  it('renders default form fields and initial values properly', () => {
    render(<MunicipalPrepaidCalculator {...defaultProps} />);

    expect(screen.getByText('Prepaid Electricity Portal')).toBeInTheDocument();
    expect(screen.getByText('STS-6 Ready')).toBeInTheDocument();
    expect(screen.getByLabelText(/Municipality \/ Supply Authority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prepaid Meter Number/i)).toHaveValue('04182948192');
    expect(screen.getByLabelText(/Purchase Amount/i)).toHaveValue('200');
  });

  it('calculates kWh units, 15% VAT, and net electricity accurately for default R200 purchase', () => {
    render(<MunicipalPrepaidCalculator {...defaultProps} />);

    // Click calculate
    const calculateBtn = screen.getByRole('button', { name: /Calculate Units & Generate Token/i });
    fireEvent.click(calculateBtn);

    // With no location permission, the neutral national fallback is Eskom Direct at 2.22.
    // Amount = 200
    // VAT = (200 * 0.15) / 1.15 = 26.086956... -> R26.09
    // Net = 200 - 26.086956... = 173.91304... -> R173.91
    // Units = 173.91304... / 2.22 = 78.339... -> 78.3 kWh
    expect(screen.getByText('78.3')).toBeInTheDocument();
    expect(screen.getByText('R26.09')).toBeInTheDocument();
    expect(screen.getByText('R173.91')).toBeInTheDocument();
    expect(screen.getByText('R2.22 / kWh')).toBeInTheDocument();
  });

  it('generates standard 20-digit STS recharge token formatted in 5 blocks of 4 digits', () => {
    render(<MunicipalPrepaidCalculator {...defaultProps} />);

    const calculateBtn = screen.getByRole('button', { name: /Calculate Units & Generate Token/i });
    fireEvent.click(calculateBtn);

    const tokenHeading = screen.getByText('SAMPLE STS RECHARGE TOKEN');
    expect(tokenHeading).toBeInTheDocument();

    const tokenElement = tokenHeading.nextElementSibling;
    expect(tokenElement).not.toBeNull();
    const tokenText = tokenElement?.textContent?.trim() || '';

    // Must be 5 blocks of 4 digits separated by spaces: "XXXX XXXX XXXX XXXX XXXX"
    expect(tokenText).toMatch(/^\d{4} \d{4} \d{4} \d{4} \d{4}$/);
    const digitsOnly = tokenText.replace(/\s/g, '');
    expect(digitsOnly).toHaveLength(20);
  });

  it('updates calculation dynamically when switching municipalities', () => {
    render(<MunicipalPrepaidCalculator {...defaultProps} />);

    // Switch from the neutral Eskom fallback to City Power (rate: 2.45).
    const select = screen.getByLabelText(/Municipality \/ Supply Authority/i);
    fireEvent.change(select, { target: { value: 'City Power (Johannesburg)' } });

    const calculateBtn = screen.getByRole('button', { name: /Calculate Units & Generate Token/i });
    fireEvent.click(calculateBtn);

    // Amount = 200, Net = 173.91304...
    // Units = 173.91304... / 2.45 = 70.9849... -> 71.0 kWh
    expect(screen.getByText('71.0')).toBeInTheDocument();
    expect(screen.getByText('R2.45 / kWh')).toBeInTheDocument();
  });

  it('updates amount when clicking preset buttons (R50, R100, R200, R500)', () => {
    render(<MunicipalPrepaidCalculator {...defaultProps} />);

    const amountInput = screen.getByLabelText(/Purchase Amount/i);

    const btn50 = screen.getByRole('button', { name: 'R50' });
    fireEvent.click(btn50);
    expect(amountInput).toHaveValue('50');

    const btn500 = screen.getByRole('button', { name: 'R500' });
    fireEvent.click(btn500);
    expect(amountInput).toHaveValue('500');

    // Calculate with R500
    // Amount = 500
    // VAT = (500 * 0.15) / 1.15 = 65.21739... -> R65.22
    // Net = 500 - 65.21739... = 434.7826... -> R434.78
    // Units (neutral Eskom fallback 2.22) = 434.7826... / 2.22 = 195.848... -> 195.8 kWh
    const calculateBtn = screen.getByRole('button', { name: /Calculate Units & Generate Token/i });
    fireEvent.click(calculateBtn);

    expect(screen.getByText('195.8')).toBeInTheDocument();
    expect(screen.getByText('R65.22')).toBeInTheDocument();
    expect(screen.getByText('R434.78')).toBeInTheDocument();
  });

  it('supports all 6 major South African electricity supply authorities', () => {
    render(<MunicipalPrepaidCalculator {...defaultProps} />);
    const select = screen.getByLabelText(/Municipality \/ Supply Authority/i);

    const expectedAuthorities = [
      'City Power (Johannesburg)',
      'City of Cape Town',
      'eThekwini Electricity (Durban)',
      'City of Tshwane (Pretoria)',
      'Eskom Direct Residential',
      'Mangaung Metro (Bloemfontein)'
    ];

    expectedAuthorities.forEach((name) => {
      expect(screen.getByRole('option', { name })).toBeInTheDocument();
    });
  });

  it('does not calculate or show results when amount is invalid or zero', () => {
    render(<MunicipalPrepaidCalculator {...defaultProps} />);

    const amountInput = screen.getByLabelText(/Purchase Amount/i);
    fireEvent.change(amountInput, { target: { value: '0' } });

    const calculateBtn = screen.getByRole('button', { name: /Calculate Units & Generate Token/i });
    fireEvent.click(calculateBtn);

    expect(screen.queryByText(/ESTIMATED UNITS/i)).not.toBeInTheDocument();
  });

  it('keeps the right-hand municipal cards closed by default and opens the full meter directory', () => {
    render(<MunicipalPrepaidCalculator {...defaultProps} />);

    const sidebarToggle = screen.getByRole('button', { name: /Open municipal information cards/i });
    expect(sidebarToggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(sidebarToggle);

    fireEvent.click(screen.getByRole('button', { name: /Full Meter Diagnostics Directory/i }));
    expect(screen.getByText(/National Prepaid Meter TID Rollover Verification/i)).toBeInTheDocument();
  });

  it('opens and closes the Consumer Portal modal with the 2468 numerical trigger', () => {
    render(<MunicipalPrepaidCalculator {...defaultProps} />);

    ['2', '4', '6', '8'].forEach((key) => fireEvent.keyDown(window, { key }));
    expect(screen.getByTestId('consumer-portal-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Close consumer portal modal/i }));
    expect(screen.queryByTestId('consumer-portal-modal')).not.toBeInTheDocument();
  });
});
