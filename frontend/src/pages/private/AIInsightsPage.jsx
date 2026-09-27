import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Package,
  Boxes,
  ArrowRight,
  Info,
  CheckCircle2,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AIInsightsPage() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await authFetch('/api/ai/insights');
        const data = await res.json();
        if (data.success) {
          setInsights(data.insights);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-16 rounded-3xl text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" />
        <p className="text-xs font-semibold text-slate-500">Calculating predictive models & velocity curves...</p>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      {/* 21 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">AI Decision Support</h1>
            <span className="p-1.5 rounded-xl bg-brand-50 text-brand-600">
              <Sparkles className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data-driven sales forecasting, stock depletion risks, and high-impact merchant suggestions.
          </p>
        </div>

        {/* 21.6 AI UX Requirement Mandatory Label Notice */}
        <div className="max-w-md p-3 bg-brand-50/60 rounded-2xl border border-brand-100 flex items-start gap-2.5 text-[11px] text-brand-800">
          <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <span>
            {insights.labelNotice || 'Predictions and projections are estimates based on your sales patterns and available data.'}
          </span>
        </div>
      </div>

      {/* 21.2 Revenue Prediction Card & 21.1 Sales Trend Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Forecast (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-base text-slate-900">Projected Next-Month Revenue</h3>
            </div>
            {/* 21.6 Explicit Tag */}
            <span className="px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 text-[10px] font-extrabold uppercase tracking-wider">
              {insights.revenueForecast.label}
            </span>
          </div>

          <div className="p-5 bg-surface-canvas rounded-2xl border border-slate-100 flex items-baseline justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Estimated Trajectory</p>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-700 mt-1">
                ${insights.revenueForecast.predictedNextMonth.toLocaleString()}.00
              </h2>
            </div>
            <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {insights.revenueForecast.growthRate} Projected
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Confidence:</span>
              <span>{insights.revenueForecast.confidenceInterval}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-800 shrink-0">Historical Basis:</span>
              <span className="text-slate-500 leading-relaxed">{insights.revenueForecast.basis}</span>
            </div>
          </div>
        </div>

        {/* 21.1 Sales Trend Card (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-slate-900">Peak Velocity Patterns</h3>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase">
                {insights.salesTrend.label}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{insights.salesTrend.summary}</p>
          </div>

          <div className="p-4 bg-surface-canvas rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Highest Converting Window:</span>
              <span className="font-bold text-slate-800">{insights.salesTrend.bestDay}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 text-slate-600">
              <strong className="text-slate-800">Suggestion: </strong>
              <span>{insights.salesTrend.recommendedAction}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 21.3 Stock Depletion Predictions */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">Stock Run-Out Forecast</h3>
            <p className="text-xs text-slate-400">Products forecasted to reach zero before standard replenishment</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-coral-50 text-coral-600 text-[10px] font-extrabold uppercase">
            Estimated Predictions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.stockPredictions.map((stock) => (
            <div
              key={stock.id}
              className="p-4 rounded-2xl bg-coral-50/40 border border-coral-200/60 flex items-center justify-between gap-4"
            >
              <div>
                <span className="text-[10px] font-bold text-coral-600 uppercase tracking-wider">{stock.label}</span>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{stock.productName}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Remaining: <strong className="text-coral-600">{stock.currentStock} units</strong> • Depletion in {stock.predictedDepletionDays}
                </p>
              </div>

              {/* Action button leading to Inventory */}
              <Link
                to={stock.actionLink}
                className="px-4 py-2 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs shadow-sm transition whitespace-nowrap"
              >
                {stock.actionText}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 21.5 Actionable Business Suggestions */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">Actionable Suggestions</h3>
          <p className="text-xs text-slate-400">Directly executable operational recommendations with deep links</p>
        </div>

        <div className="space-y-3">
          {insights.businessSuggestions.map((sug) => (
            <div
              key={sug.id}
              className="p-4 rounded-2xl bg-surface-canvas border border-slate-200/70 hover:border-brand-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <h4 className="font-bold text-xs text-slate-900">{sug.recommendation}</h4>
                </div>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">{sug.reason}</p>
                <p className="text-[11px] text-slate-400 pl-6 font-mono">{sug.context}</p>
              </div>

              <Link
                to={sug.actionLink}
                className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm shrink-0"
              >
                <span>{sug.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

