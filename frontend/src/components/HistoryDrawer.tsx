'use client';

import React from 'react';
import { History, Trash2, ArrowUpRight } from 'lucide-react';
import { HistoryItem } from '../lib/types';
import { MathRenderer } from './MathRenderer';

interface HistoryDrawerProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  items,
  onSelect,
  onClear,
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <History className="w-4 h-4 text-indigo-400" />
          <span>Recent Computations ({items.length})</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
          title="Clear History"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="group p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="truncate max-w-[80%] space-y-1">
              <p className="text-xs font-mono text-slate-300 truncate">
                {item.problem_text}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="capitalize">{item.domain}</span>
                <span>•</span>
                <span>{item.steps_count} steps</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryDrawer;
