import React, { useState } from 'react';
import { AlumniMember } from '../types';

interface StatisticsPanelProps {
  members: AlumniMember[];
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ members }) => {
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'program' | 'year' | 'state'>('status');

  const activeMembers = members.filter(m => m.status === 'Active' || m.status === 'Inactive');

  // Distribution helpers
  const getStatusDistribution = () => {
    const counts = { Active: 0, Inactive: 0 };
    members.forEach(m => {
      if (m.status === 'Active') counts.Active++;
      else if (m.status === 'Inactive') counts.Inactive++;
    });
    return counts;
  };

  const getProgramDistribution = () => {
    const counts: Record<string, number> = {};
    activeMembers.forEach(m => {
      const p = String(m.program || 'Lain-lain').trim();
      counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  };

  const getYearDistribution = () => {
    const counts: Record<string, number> = {};
    activeMembers.forEach(m => {
      const y = String(m.tahunLulusan || 'Lain-lain').trim();
      counts[y] = (counts[y] || 0) + 1;
    });
    return counts;
  };

  const getStateDistribution = () => {
    const counts: Record<string, number> = {};
    activeMembers.forEach(m => {
      const s = String(m.negeri || '').trim() || 'Sabah';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  };

  const statusData = getStatusDistribution();
  const programData = getProgramDistribution();
  const yearData = getYearDistribution();
  const stateData = getStateDistribution();

  const colors = ['#1d4ed8', '#f97316', '#10b981', '#8b5cf6', '#64748b', '#ec4899', '#f59e0b', '#06b6d4'];

  // SVG Chart: Draw Pie Chart slices
  const renderPieChart = (data: Record<string, number>, sliceColors: string[]) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return <div className="text-slate-400 font-bold text-center py-6">Tiada data untuk dipaparkan.</div>;

    let accumulatedAngle = 0;
    const slices = Object.entries(data).map(([label, val], idx) => {
      const percentage = val / total;
      const angle = percentage * 360;
      
      // Calculate coordinates for SVG path arc
      const radStart = (accumulatedAngle - 90) * (Math.PI / 180);
      const radEnd = (accumulatedAngle + angle - 90) * (Math.PI / 180);
      
      accumulatedAngle += angle;

      const r = 80;
      const cx = 100;
      const cy = 100;
      
      const x1 = cx + r * Math.cos(radStart);
      const y1 = cy + r * Math.sin(radStart);
      const x2 = cx + r * Math.cos(radEnd);
      const y2 = cy + r * Math.sin(radEnd);

      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = angle === 360 
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return (
        <path
          key={label}
          d={pathData}
          fill={sliceColors[idx % sliceColors.length]}
          className="hover:opacity-90 transition-all cursor-pointer"
        >
          <title>{`${label}: ${val} (${(percentage * 100).toFixed(0)}%)`}</title>
        </path>
      );
    });

    return (
      <div className="flex flex-col md:flex-row items-center justify-around gap-6">
        <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-xs">
          {slices}
        </svg>
        
        {/* Legends */}
        <div className="space-y-2 max-w-xs w-full">
          {Object.entries(data).map(([label, val], idx) => (
            <div key={label} className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sliceColors[idx % sliceColors.length] }}></span>
                <span className="truncate max-w-[150px]">{label}</span>
              </div>
              <span className="font-bold text-slate-800">{val} ({((val/total)*100).toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // SVG Chart: Draw Bar Chart bars
  const renderBarChart = (data: Record<string, number>) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const maxVal = values.length > 0 ? Math.max(...values) : 5;
    const total = values.reduce((a, b) => a + b, 0);

    if (total === 0) return <div className="text-slate-400 font-bold text-center py-6">Tiada data untuk dipaparkan.</div>;

    const chartHeight = 150;
    const barWidth = 35;
    const gap = 15;
    const chartWidth = keys.length * (barWidth + gap) + 40;

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[400px] flex flex-col items-center py-6">
          <svg width={chartWidth} height={chartHeight + 40} className="font-sans">
            {/* Draw grid lines */}
            <line x1="30" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth="1" />
            <line x1="30" y1="20" x2={chartWidth} y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1={chartHeight / 2 + 10} x2={chartWidth} y2={chartHeight / 2 + 10} stroke="#f1f5f9" strokeWidth="1" />

            {/* Bars */}
            {keys.map((key, idx) => {
              const val = data[key] || 0;
              const barHeight = maxVal > 0 ? (val / maxVal) * (chartHeight - 30) : 0;
              const x = 40 + idx * (barWidth + gap);
              const y = chartHeight - barHeight;

              return (
                <g key={key} className="group cursor-pointer">
                  {/* Hover tooltip hint */}
                  <title>{`${key}: ${val} ahli`}</title>
                  {/* Bar rect */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="#1d4ed8"
                    rx="4"
                    className="hover:fill-blue-800 transition-all"
                  />
                  {/* Text value on top of bar */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="text-[10px] font-bold text-slate-700"
                  >
                    {val}
                  </text>
                  {/* Label x-axis */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 18}
                    textAnchor="middle"
                    className="text-[9px] font-bold text-slate-500 fill-slate-500"
                  >
                    {key}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex flex-wrap border border-slate-800 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl gap-1 max-w-xl mx-auto shadow-2xs">
        <button
          onClick={() => setActiveSubTab('status')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
            activeSubTab === 'status' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Status
        </button>
        <button
          onClick={() => setActiveSubTab('program')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
            activeSubTab === 'program' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Program Pengajian
        </button>
        <button
          onClick={() => setActiveSubTab('year')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
            activeSubTab === 'year' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tahun Graduasi
        </button>
        <button
          onClick={() => setActiveSubTab('state')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
            activeSubTab === 'state' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Negeri Kediaman
        </button>
      </div>

      {/* Render Chart Panel Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs max-w-xl mx-auto">
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-6">
          {activeSubTab === 'status' && 'Statistik Status Keahlian'}
          {activeSubTab === 'program' && 'Statistik Program Pengajian'}
          {activeSubTab === 'year' && 'Statistik Tahun Lulusan Alumni'}
          {activeSubTab === 'state' && 'Statistik Negeri Kediaman Semasa'}
        </h3>

        {activeSubTab === 'status' && renderPieChart(statusData, ['#10b981', '#64748b', '#f59e0b'])}
        {activeSubTab === 'program' && renderPieChart(programData, colors)}
        {activeSubTab === 'year' && renderBarChart(yearData)}
        {activeSubTab === 'state' && renderPieChart(stateData, colors)}
      </div>
    </div>
  );
};
