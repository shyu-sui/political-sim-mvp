// import React from 'react';
import type { Impact } from './lifeEventsLogic';

type Props = {
  date: string;
  title: string;
  desc: string;
  impact: Impact;
  delta?: { cons?: number; lib?: number; apa?: number };
};

export default function LifeEventCard({ date, title, desc, impact, delta }: Props) {
  return (
    <div className={`tl-item ${impact === 'good' ? 'good' : impact === 'bad' ? 'bad' : ''}`}>
      <div className="tl-icon" style={{ background: '#0ea5e9', color:'#fff' }}>🎯</div>
      <div className="tl-body">
        <div className="tl-headline">
          <span className="tl-date">{date}</span>
          <span className="tl-cat" style={{ color: '#0ea5e9' }}>人生</span>
          <span className="tl-badge" style={{ background: impact==='good'?'#38a169':impact==='bad'?'#e53e3e':'#718096' }}>
            {impact === 'good' ? '好影響' : impact === 'bad' ? '悪影響' : '中立'}
            {delta?.cons ? ` 保${delta.cons>0?'+':''}${delta.cons}` : ''}
            {delta?.lib  ? ` リ${delta.lib>0?'+':''}${delta.lib}`   : ''}
            {delta?.apa  ? ` 無${delta.apa>0?'+':''}${delta.apa}`   : ''}
          </span>
        </div>
        <div className="tl-title-row">{title}</div>
        <div className="tl-desc">{desc}</div>
      </div>
    </div>
  );
}