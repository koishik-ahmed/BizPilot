import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function DashboardCalendar({ orders = [], onSelectDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Calculate days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  // Build map of orders by date string YYYY-MM-DD
  const ordersByDate = {};
  orders.forEach((o) => {
    if (!o.created_at) return;
    const dateKey = o.created_at.slice(0, 10);
    if (!ordersByDate[dateKey]) ordersByDate[dateKey] = [];
    ordersByDate[dateKey].push(o);
  });

  const getDayKey = (day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDayOrders = ordersByDate[selectedKey] || [];
  const selectedDayTotal = selectedDayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between h-full">
      <div>
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">
                {monthNames[month]} {year}
              </h3>
              <p className="text-[10px] text-slate-400">Merchant Activity Calendar</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-surface-canvas p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={prevMonth}
              className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white transition"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setCurrentDate(now);
                setSelectedDate(now);
              }}
              className="px-2 py-0.5 text-[10px] font-bold text-brand-700 hover:bg-white rounded transition"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white transition"
              aria-label="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 text-center mb-1">
          {daysOfWeek.map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-slate-400 py-1 uppercase">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Previous month padding days */}
          {[...Array(firstDayIndex)].map((_, i) => {
            const dayNum = prevMonthTotalDays - firstDayIndex + i + 1;
            return (
              <div key={`prev-${i}`} className="py-1.5 text-[11px] font-medium text-slate-300">
                {dayNum}
              </div>
            );
          })}

          {/* Current month days */}
          {[...Array(totalDays)].map((_, i) => {
            const day = i + 1;
            const dayKey = getDayKey(day);
            const dayOrders = ordersByDate[dayKey] || [];
            const hasOrders = dayOrders.length > 0;
            const today = isToday(day);
            const selected = isSelected(day);

            let dayStyle = 'text-slate-700 hover:bg-slate-100';
            if (today) {
              dayStyle = 'bg-brand-600 text-white font-black shadow-md shadow-brand-600/30';
            } else if (selected) {
              dayStyle = 'bg-brand-100 text-brand-900 font-bold border border-brand-300';
            }

            return (
              <button
                key={`curr-${day}`}
                type="button"
                onClick={() => {
                  const clicked = new Date(year, month, day);
                  setSelectedDate(clicked);
                  if (onSelectDate) onSelectDate(clicked);
                }}
                className={`relative py-1.5 rounded-xl text-xs transition flex flex-col items-center justify-center ${dayStyle}`}
              >
                <span>{day}</span>
                {hasOrders && !today && (
                  <span className="w-1 h-1 rounded-full bg-brand-600 mt-0.5"></span>
                )}
                {hasOrders && today && (
                  <span className="w-1 h-1 rounded-full bg-white mt-0.5"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Order Snapshot */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-600">
            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div>
          {selectedDayOrders.length > 0 ? (
            <span className="font-bold text-[11px] text-brand-700">
              {selectedDayOrders.length} order{selectedDayOrders.length > 1 ? 's' : ''} ({formatCurrency(selectedDayTotal)})
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">No orders logged</span>
          )}
        </div>
      </div>
    </div>
  );
}

