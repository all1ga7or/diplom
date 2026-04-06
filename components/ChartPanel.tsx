'use client';
import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { ChartPoint } from '@/lib/types';

interface Props {
  fitnessData: ChartPoint[];
  buData: ChartPoint[];
  AData: ChartPoint[];
  BData: ChartPoint[];
  CData: ChartPoint[];
  uData: ChartPoint[];
  dimension: number;
}

const COLORS = ['#38bdf8','#10b981','#fbbf24','#f87171','#a78bfa','#fb923c'];
const CARD_BG    = '#0f172a';
const GRID_COLOR = '#1e293b';
const TEXT_COLOR = '#94a3b8';

const tooltipStyle = {
  backgroundColor: '#131d31',
  border: '1px solid #1e293b',
  borderRadius: 8,
  fontSize: 12,
  color: '#e5e7eb',
};

const EffectDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload || payload.effect === undefined) return null;
  const isPositive = payload.effect >= 0;
  return (
    <circle cx={cx} cy={cy} r={4} fill={isPositive ? '#10b981' : '#f87171'} stroke="none" />
  );
};

const tabs = [
  { key: 'bu',      label: 'Пристосованість' },
  { key: 'fitness', label: 'Цільова функція' },
  { key: 'effect',  label: 'Еко-ефект (%)' },
  { key: 'A',       label: 'Матриця A' },
  { key: 'B',       label: 'Вектор B' },
  { key: 'C',       label: 'Вектор C' },
  { key: 'u',       label: 'Вектор u' },
];

export default function ChartPanel({ fitnessData, buData, AData, BData, CData, uData, dimension }: Props) {
  const [activeTab, setActiveTab] = useState('bu');

  const matKeys = Array.from({ length: dimension }, (_, i) =>
    Array.from({ length: dimension }, (_, j) => `a${i+1}${j+1}`)
  ).flat();

  const vecKeys = (label: string) =>
    Array.from({ length: dimension }, (_, i) => `${label}${i+1}`);

  const renderChart = () => {
    switch (activeTab) {
      case 'bu':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={buData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke={TEXT_COLOR} tick={{ fontSize: 11 }} label={{ value: 'Крок t', position: 'insideBottom', offset: -2, fill: TEXT_COLOR, fontSize: 11 }} />
              <YAxis stroke={TEXT_COLOR} tick={{ fontSize: 11 }} width={55} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="adapted" name="Bu* (адаптований)" stroke="#38bdf8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="base" name="Bu₀ (базовий)" stroke="#f87171" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'fitness':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={fitnessData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke={TEXT_COLOR} tick={{ fontSize: 11 }} label={{ value: 'Крок t', position: 'insideBottom', offset: -2, fill: TEXT_COLOR, fontSize: 11 }} />
              <YAxis stroke={TEXT_COLOR} tick={{ fontSize: 11 }} width={55} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="fitness" name="f (цільова функція)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4, fill: '#38bdf8' }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'effect':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={buData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke={TEXT_COLOR} tick={{ fontSize: 11 }} label={{ value: 'Крок t', position: 'insideBottom', offset: -2, fill: TEXT_COLOR, fontSize: 11 }} />
              <YAxis stroke={TEXT_COLOR} tick={{ fontSize: 11 }} width={55} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="effect" name="Еко-ефект (%)" stroke="#eab308" strokeWidth={2} dot={<EffectDot />} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'A':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={AData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke={TEXT_COLOR} tick={{ fontSize: 11 }} />
              <YAxis stroke={TEXT_COLOR} tick={{ fontSize: 11 }} width={55} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {matKeys.map((k, idx) => (
                <Line key={k} type="monotone" dataKey={k} stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={1.5} dot={false} name={k} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'B':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={BData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke={TEXT_COLOR} tick={{ fontSize: 11 }} />
              <YAxis stroke={TEXT_COLOR} tick={{ fontSize: 11 }} width={55} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {vecKeys('b').map((k, idx) => (
                <Line key={k} type="monotone" dataKey={k} stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2} dot={false} name={k} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'C':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={CData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke={TEXT_COLOR} tick={{ fontSize: 11 }} />
              <YAxis stroke={TEXT_COLOR} tick={{ fontSize: 11 }} width={55} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {vecKeys('c').map((k, idx) => (
                <Line key={k} type="monotone" dataKey={k} stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2} dot={false} name={k} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'u':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={uData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="t" stroke={TEXT_COLOR} tick={{ fontSize: 11 }} />
              <YAxis stroke={TEXT_COLOR} tick={{ fontSize: 11 }} width={55} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {vecKeys('u').map((k, idx) => (
                <Line key={k} type="monotone" dataKey={k} stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2} dot={{ r: 3 }} name={k} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const hasData = fitnessData.length > 0;

  return (
    <div style={{ background: CARD_BG, border: '1px solid #1e293b', borderRadius: 12, padding: '16px' }}>
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {hasData ? renderChart() : (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#1e293b', fontSize: '0.85rem', flexDirection: 'column', gap: 8 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="1.5">
            <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
          </svg>
          <span style={{ color: '#334155' }}>Дані з&apos;являться після запуску симуляції</span>
        </div>
      )}
    </div>
  );
}
