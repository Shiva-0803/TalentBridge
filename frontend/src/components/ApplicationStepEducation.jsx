import React from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';

export default function ApplicationStepEducation({ records, onChange, onNext, onBack }) {

  const handleAdd = () => {
    onChange([
      ...records,
      {
        degree: '',
        specialization: '',
        institution: '',
        year_of_passing: '',
        grade: '',
        education_level: "Bachelor's"
      }
    ]);
  };

  const handleRemove = (index) => {
    if (records.length === 1) return; // keep at least one
    const updated = records.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...records];
    updated[index][field] = value;
    onChange(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
            <GraduationCap className="w-4 h-4 text-blue-600" /> Educational Qualifications
          </h3>
          <p className="text-xs text-slate-500">
            Add one or more educational records starting with your highest degree.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-lg border border-blue-200 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Education
        </button>
      </div>

      <div className="space-y-4">
        {records.map((rec, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Education #{index + 1}
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Education Level *</label>
                <select
                  required
                  value={rec.education_level || "Bachelor's"}
                  onChange={(e) => handleItemChange(index, 'education_level', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="Doctorate">Doctorate</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Degree / Qualification *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech, MBA, M.Sc."
                  value={rec.degree || ''}
                  onChange={(e) => handleItemChange(index, 'degree', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Institution / University *</label>
                <input
                  type="text"
                  required
                  placeholder="University / College Name"
                  value={rec.institution || ''}
                  onChange={(e) => handleItemChange(index, 'institution', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science, Finance"
                  value={rec.specialization || ''}
                  onChange={(e) => handleItemChange(index, 'specialization', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Year of Passing *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2022"
                  min="1970"
                  max="2030"
                  value={rec.year_of_passing || ''}
                  onChange={(e) => handleItemChange(index, 'year_of_passing', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Grade / CGPA / %</label>
                <input
                  type="text"
                  placeholder="e.g. 8.5 CGPA or 82%"
                  value={rec.grade || ''}
                  onChange={(e) => handleItemChange(index, 'grade', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

            </div>

          </div>
        ))}
      </div>

      {/* Navigation Footer */}
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
