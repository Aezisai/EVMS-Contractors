import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const mockData = [
  { month: 'Jan', bcws: 10000, bcwp: 10000, acwp: 9000 },
  { month: 'Feb', bcws: 25000, bcwp: 22000, acwp: 23000 },
  { month: 'Mar', bcws: 45000, bcwp: 38000, acwp: 40000 },
  { month: 'Apr', bcws: 70000, bcwp: 60000, acwp: 65000 },
  { month: 'May', bcws: 100000, bcwp: 95000, acwp: 98000 },
];

export const SCurveChart: React.FC = () => {
  return (
    <div className="glass-card tour-scurve">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Cumulative S-Curve</h2>
        <span className="tooltip-container" style={{ fontSize: '0.9rem' }}>
          What am I looking at?
          <span className="tooltip-text" style={{ right: 0, left: 'auto', marginLeft: 0 }}>
            <strong>S-Curve Visualization</strong><br/>
            This chart tracks the cumulative project performance over time.<br/><br/>
            - <strong>Blue:</strong> What you planned to accomplish.<br/>
            - <strong>Green:</strong> What you actually accomplished.<br/>
            - <strong>Red:</strong> What you actually spent.
          </span>
        </span>
      </div>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBcws" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBcwp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAcwp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" tickFormatter={(val) => `$${val/1000}k`} />
            <Tooltip 
              formatter={(value: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)}
              contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend />
            <Area type="monotone" dataKey="bcws" name="Planned (BCWS)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBcws)" />
            <Area type="monotone" dataKey="bcwp" name="Earned (BCWP)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBcwp)" />
            <Area type="monotone" dataKey="acwp" name="Actual Cost (ACWP)" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorAcwp)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
