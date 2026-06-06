import React from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function SearchAndFilters({ searchQuery, setSearchQuery, filterType, setFilterType, filterStatus, setFilterStatus, filterDateRange, setFilterDateRange }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search forms, messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none appearance-none">
            <option value="all">All Types</option>
            <option value="contact">Contact</option>
            <option value="newsletter">Newsletter</option>
            <option value="booking">Booking</option>
            <option value="survey">Survey</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none">
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none">
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </select>
      </div>
    </div>
  );
}
