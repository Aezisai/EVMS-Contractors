import React from 'react';

// Mock data matching the engine calculations
const mockReportData = [
  { wbs: '1.1 Design', bcws: 15000, bcwp: 15000, acwp: 14000, sv: 0, cv: 1000, spi: 1.0, cpi: 1.07 },
  { wbs: '1.2 Engineering', bcws: 45000, bcwp: 40000, acwp: 42000, sv: -5000, cv: -2000, spi: 0.89, cpi: 0.95 },
  { wbs: '1.3 Manufacturing', bcws: 40000, bcwp: 40000, acwp: 42000, sv: 0, cv: -2000, spi: 1.0, cpi: 0.95 },
];

export const IPMRReport: React.FC = () => {
  const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const getBadgeClass = (val: number) => {
    if (val >= 1.0) return 'badge badge-success';
    if (val >= 0.9) return 'badge badge-warning';
    return 'badge badge-danger';
  };

  return (
    <div className="glass-card tour-ipmr" style={{ marginTop: '2rem' }}>
      <h2>IPMR Format 1: WBS Breakdown</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="premium-table">
          <thead>
            <tr>
              <th>WBS Element</th>
              <th>
                <span className="tooltip-container tooltip-bottom">
                  BCWS
                  <span className="tooltip-text"><strong>Planned Value (BCWS)</strong><br/>Budgeted Cost for Work Scheduled. The approved budget for work planned.</span>
                </span>
              </th>
              <th>
                <span className="tooltip-container tooltip-bottom">
                  BCWP
                  <span className="tooltip-text"><strong>Earned Value (BCWP)</strong><br/>Budgeted Cost for Work Performed. The value of work actually completed.</span>
                </span>
              </th>
              <th>
                <span className="tooltip-container tooltip-bottom">
                  ACWP
                  <span className="tooltip-text"><strong>Actual Cost (ACWP)</strong><br/>Actual Cost of Work Performed. The true cost incurred to complete the work.</span>
                </span>
              </th>
              <th>
                <span className="tooltip-container tooltip-bottom">
                  SV
                  <span className="tooltip-text"><strong>Schedule Variance (SV)</strong><br/>BCWP minus BCWS. A positive value indicates you are ahead of schedule.</span>
                </span>
              </th>
              <th>
                <span className="tooltip-container tooltip-bottom">
                  CV
                  <span className="tooltip-text"><strong>Cost Variance (CV)</strong><br/>BCWP minus ACWP. A positive value indicates you are under budget.</span>
                </span>
              </th>
              <th>
                <span className="tooltip-container tooltip-bottom">
                  SPI
                  <span className="tooltip-text" style={{ right: '-50px', left: 'auto', marginLeft: 0 }}><strong>Schedule Performance Index (SPI)</strong><br/>BCWP divided by BCWS. Values &gt; 1.0 are favorable.</span>
                </span>
              </th>
              <th>
                <span className="tooltip-container tooltip-bottom">
                  CPI
                  <span className="tooltip-text" style={{ right: 0, left: 'auto', marginLeft: 0 }}><strong>Cost Performance Index (CPI)</strong><br/>BCWP divided by ACWP. Values &gt; 1.0 are favorable.</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {mockReportData.map((row, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 500 }}>{row.wbs}</td>
                <td>{formatMoney(row.bcws)}</td>
                <td>{formatMoney(row.bcwp)}</td>
                <td>{formatMoney(row.acwp)}</td>
                <td style={{ color: row.sv < 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                  {formatMoney(row.sv)}
                </td>
                <td style={{ color: row.cv < 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                  {formatMoney(row.cv)}
                </td>
                <td><span className={getBadgeClass(row.spi)}>{row.spi.toFixed(2)}</span></td>
                <td><span className={getBadgeClass(row.cpi)}>{row.cpi.toFixed(2)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
