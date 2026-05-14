import React from 'react';

// Mock data matching our EVMS engine output
const mockMetrics = {
  totalBCWS: 100000,
  totalBCWP: 95000,
  totalACWP: 98000,
  bac: 200000,
};

export const DashboardSummary: React.FC = () => {
  const { totalBCWS, totalBCWP, totalACWP, bac } = mockMetrics;
  
  // Calculate Variances
  const sv = totalBCWP - totalBCWS;
  const cv = totalBCWP - totalACWP;
  
  // Calculate Indices
  const spi = totalBCWP / totalBCWS;
  const cpi = totalBCWP / totalACWP;
  
  // Calculate Estimates
  const eac = bac / cpi;

  // Formatting helpers
  const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(val));
  
  const getScheduleHealth = () => {
    if (spi >= 1.0) return { text: "Ahead of Schedule", color: "var(--success-color)", desc: `Ahead by ${formatMoney(sv)}` };
    if (spi >= 0.9) return { text: "Slightly Behind", color: "var(--warning-color)", desc: `Behind by ${formatMoney(sv)}` };
    return { text: "Critical Delay", color: "var(--danger-color)", desc: `Behind by ${formatMoney(sv)}` };
  };

  const getCostHealth = () => {
    if (cpi >= 1.0) return { text: "Under Budget", color: "var(--success-color)", desc: `Savings of ${formatMoney(cv)}` };
    if (cpi >= 0.9) return { text: "Slightly Over Budget", color: "var(--warning-color)", desc: `Over by ${formatMoney(cv)}` };
    return { text: "Critical Overrun", color: "var(--danger-color)", desc: `Over by ${formatMoney(cv)}` };
  };

  const schedule = getScheduleHealth();
  const cost = getCostHealth();

  return (
    <div className="summary-grid tour-summary">
      <div className="glass-card" style={{ borderTop: `4px solid ${schedule.color}` }}>
        <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>Schedule Health</h3>
        <div className="summary-stat" style={{ color: schedule.color }}>{schedule.text}</div>
        <div className="summary-desc">{schedule.desc}</div>
        <div style={{ marginTop: '1rem' }}>
          <span className="tooltip-container">
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>SPI: {spi.toFixed(2)}</span>
            <span className="tooltip-text">
              <strong>Schedule Performance Index (SPI)</strong><br/>
              A measure of schedule efficiency. Values greater than 1.0 mean you are completing work faster than planned.
            </span>
          </span>
        </div>
      </div>

      <div className="glass-card" style={{ borderTop: `4px solid ${cost.color}` }}>
        <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>Cost Health</h3>
        <div className="summary-stat" style={{ color: cost.color }}>{cost.text}</div>
        <div className="summary-desc">{cost.desc}</div>
        <div style={{ marginTop: '1rem' }}>
          <span className="tooltip-container">
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>CPI: {cpi.toFixed(2)}</span>
            <span className="tooltip-text">
              <strong>Cost Performance Index (CPI)</strong><br/>
              A measure of cost efficiency. Values greater than 1.0 mean you are spending less than budgeted for the work completed.
            </span>
          </span>
        </div>
      </div>

      <div className="glass-card" style={{ borderTop: '4px solid var(--primary-color)' }}>
        <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>Projected Final Cost</h3>
        <div className="summary-stat">{formatMoney(eac)}</div>
        <div className="summary-desc">Original Budget: {formatMoney(bac)}</div>
        <div style={{ marginTop: '1rem' }}>
          <span className="tooltip-container">
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>EAC vs BAC</span>
            <span className="tooltip-text">
              <strong>Estimate at Completion (EAC)</strong><br/>
              Based on your current spending efficiency (CPI), this is what the total project is projected to cost.
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
