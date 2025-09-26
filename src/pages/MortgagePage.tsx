import React, { useState } from 'react';
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react';

export const MortgagePage: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanTerm, setLoanTerm] = useState('25');
  const [downPayment, setDownPayment] = useState('');

  const calculatePayment = () => {
    const principal = parseFloat(loanAmount) - parseFloat(downPayment || '0');
    const monthlyRate = parseFloat(interestRate) / 100 / 12;
    const numPayments = parseInt(loanTerm) * 12;

    if (principal > 0 && monthlyRate > 0 && numPayments > 0) {
      const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                            (Math.pow(1 + monthlyRate, numPayments) - 1);
      return monthlyPayment;
    }
    return 0;
  };

  const monthlyPayment = calculatePayment();

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Mortgage Calculator</h2>
        <p className="text-gray-600 text-sm">Calculate your monthly mortgage payments</p>
      </div>

      {/* Calculator Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Loan Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Home Price
            </label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="500,000"
              className="input"
            />
          </div>

          {/* Down Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Down Payment
            </label>
            <input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              placeholder="100,000"
              className="input"
            />
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Percent className="w-4 h-4 inline mr-1" />
              Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="5.25"
              className="input"
            />
          </div>

          {/* Loan Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Loan Term (years)
            </label>
            <select
              value={loanTerm}
              onChange={(e) => setLoanTerm(e.target.value)}
              className="input"
            >
              <option value="15">15 years</option>
              <option value="20">20 years</option>
              <option value="25">25 years</option>
              <option value="30">30 years</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {monthlyPayment > 0 && (
          <div className="mt-6 p-4 bg-coral-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Estimated Monthly Payment</p>
              <p className="text-3xl font-bold text-coral-600">
                ${monthlyPayment.toLocaleString('en-CA', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Principal</p>
                <p className="font-semibold">
                  ${(parseFloat(loanAmount) - parseFloat(downPayment || '0')).toLocaleString('en-CA')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Interest</p>
                <p className="font-semibold">
                  ${((monthlyPayment * parseInt(loanTerm) * 12) - (parseFloat(loanAmount) - parseFloat(downPayment || '0'))).toLocaleString('en-CA')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Cost</p>
                <p className="font-semibold">
                  ${(monthlyPayment * parseInt(loanTerm) * 12).toLocaleString('en-CA')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Canadian Mortgage Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Canadian Mortgage Information</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Minimum down payment: 5% for homes under $500,000</li>
          <li>• CMHC insurance required for down payments under 20%</li>
          <li>• Maximum amortization: 25 years for insured mortgages</li>
          <li>• Stress test rate applies to qualify for mortgage</li>
        </ul>
      </div>
    </div>
  );
};