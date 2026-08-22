import React from 'react';
import { Briefcase, Plus, Trash2 } from 'lucide-react';

export default function ApplicationStepExperience({ records, isFresher, onFresherToggle, onChange, onNext, onBack }) {

  const handleAdd = () => {
    onChange([
      ...records,
      {
        is_fresher: false,
        employer: '',
        job_title: '',
        start_date: '',
        end_date: '',
        currently_working: false,
        key_responsibilities: '',
        years_calculated: 0
      }
    ]);
  };

  const handleRemove = (index) => {
    if (records.length === 1) return;
    const updated = records.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...records];
    updated[index][field] = value;

    // Calculate years if start_date and end_date/current present
    if (field === 'start_date' || field === 'end_date' || field === 'currently_working') {
      const item = updated[index];
      if (item.start_date) {
        const start = new Date(item.start_date);
        const end = item.currently_working ? new Date() : (item.end_date ? new Date(item.end_date) : new Date());
        const diffYears = Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 365.25));
        item.years_calculated = Math.round(diffYears * 10) / 10;
      }
    }

    onChange(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-blue-600" /> Work Experience Details
          </h3>
          <p className="text-xs text-slate-500">
            Add your professional work history or select Fresher if you have no prior experience.
          </p>
        </div>

        {/* Fresher Checkbox Toggle */}
        <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-xl cursor-pointer shadow-xs select-none">
          <input
            type="checkbox"
            checked={isFresher}
            onChange={(e) => onFresherToggle(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <span className="text-xs font-bold text-slate-700">Fresher / No Experience</span>
        </label>
      </div>

      {!isFresher ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-lg border border-blue-200 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Work Experience
            </button>
          </div>

          {records.map((rec, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Experience #{index + 1} {rec.years_calculated > 0 && `(~${rec.years_calculated} yrs)`}
                </span>
                {records.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Employer / Company Name *</label>
                  <input
                    type="text"
                    required={!isFresher}
                    placeholder="Company Name"
                    value={rec.employer || ''}
                    onChange={(e) => handleItemChange(index, 'employer', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Job Title / Designation *</label>
                  <input
                    type="text"
                    required={!isFresher}
                    placeholder="e.g. Software Engineer"
                    value={rec.job_title || ''}
                    onChange={(e) => handleItemChange(index, 'job_title', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="month"
                    value={rec.start_date || ''}
                    onChange={(e) => handleItemChange(index, 'start_date', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="month"
                    disabled={rec.currently_working}
                    value={rec.currently_working ? '' : (rec.end_date || '')}
                    onChange={(e) => handleItemChange(index, 'end_date', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <label className="inline-flex items-center gap-1.5 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rec.currently_working || false}
                      onChange={(e) => handleItemChange(index, 'currently_working', e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                    />
                    <span className="text-[11px] text-slate-600">Currently working here</span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Key Responsibilities (Max 1000 characters)</label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    placeholder="Brief description of key achievements and technical responsibilities..."
                    value={rec.key_responsibilities || ''}
                    onChange={(e) => handleItemChange(index, 'key_responsibilities', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>

              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-800">
          <p className="text-xs font-semibold">
            You have marked yourself as a <span className="font-bold">Fresher</span>. Work experience entries are skipped.
          </p>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
        >
          ← Back
        </button>

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
