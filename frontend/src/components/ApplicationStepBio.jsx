import React from 'react';
import { User, Mail, Phone, Calendar, MapPin, Building, Clock, Home } from 'lucide-react';

export default function ApplicationStepBio({ data, onChange, onNext }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-blue-600" /> Bio-Data & Personal Information
        </h3>
        <p className="text-xs text-slate-500">
          Please verify your personal details. Mandatory fields are marked with an asterisk (*).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">First Name *</label>
          <input
            type="text"
            required
            value={data.first_name || ''}
            onChange={(e) => onChange('first_name', e.target.value)}
            placeholder="First Name"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Last Name *</label>
          <input
            type="text"
            required
            value={data.last_name || ''}
            onChange={(e) => onChange('last_name', e.target.value)}
            placeholder="Last Name"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address *</label>
          <input
            type="email"
            required
            value={data.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="Email"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Number *</label>
          <input
            type="text"
            required
            value={data.mobile || ''}
            onChange={(e) => onChange('mobile', e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Gender *</label>
          <select
            required
            value={data.gender || ''}
            onChange={(e) => onChange('gender', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Date of Birth *</label>
          <input
            type="date"
            required
            value={data.dob || ''}
            onChange={(e) => onChange('dob', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Current Location *</label>
          <input
            type="text"
            required
            value={data.current_location || ''}
            onChange={(e) => onChange('current_location', e.target.value)}
            placeholder="City, State/Country"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Notice Period *</label>
          <select
            required
            value={data.notice_period || ''}
            onChange={(e) => onChange('notice_period', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="">Select Notice Period</option>
            <option value="Immediate">Immediate</option>
            <option value="15 days">15 days</option>
            <option value="30 days">30 days</option>
            <option value="60 days">60 days</option>
            <option value="90+ days">90+ days</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-700 block mb-1">Current Company</label>
          <input
            type="text"
            value={data.current_company || ''}
            onChange={(e) => onChange('current_company', e.target.value)}
            placeholder="N/A if candidate is a fresher"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-700 block mb-1">Current Address *</label>
          <textarea
            rows={2}
            required
            value={data.current_address || ''}
            onChange={(e) => onChange('current_address', e.target.value)}
            placeholder="Street, City, State, PIN/ZIP"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />
        </div>

      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
        >
          Save & Continue →
        </button>
      </div>

    </form>
  );
}
