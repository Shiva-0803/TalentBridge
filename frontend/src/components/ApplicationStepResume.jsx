import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ApplicationStepResume({
  resumeFile,
  setResumeFile,
  coverNote,
  setCoverNote,
  dataAccuracyConsent,
  setDataAccuracyConsent,
  privacyConsent,
  setPrivacyConsent,
  onSubmit,
  onBack,
  submitting
}) {
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState(null);

  const handleFile = (file) => {
    setFileError(null);
    if (!file) return;

    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(ext)) {
      setFileError('Invalid file format. Please upload a PDF, DOC, or DOCX document.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds the maximum allowed limit of 5 MB.');
      return;
    }

    setResumeFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const isSubmitDisabled = !resumeFile || !dataAccuracyConsent || !privacyConsent || submitting;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
          <Upload className="w-4 h-4 text-blue-600" /> Mandatory Resume Upload & Declaration
        </h3>
        <p className="text-xs text-slate-500">
          Upload your latest resume (PDF/DOC/DOCX, max 5 MB). Submission is blocked until attached.
        </p>
      </div>

      {/* File Upload Zone matching Wireframe 8.5 */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-2">
          Resume File * <span className="text-slate-400 font-normal">(PDF, DOC, DOCX up to 5MB)</span>
        </label>

        {fileError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {!resumeFile ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              dragActive ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFile(e.target.files[0])}
              className="hidden"
              id="resume-upload-input"
            />
            <label htmlFor="resume-upload-input" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Drag & drop your resume here, or <span className="text-blue-600 underline">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Accepted formats: PDF, DOC, DOCX • Max size: 5 MB</p>
            </label>
          </div>
        ) : (
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{resumeFile.name}</p>
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" /> {(resumeFile.size / 1024).toFixed(1)} KB • Attached successfully
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setResumeFile(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors"
              title="Remove resume"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Optional Cover Note */}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          Cover Note / Message for Recruiter <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          placeholder="Add a short note introducing yourself or summarizing relevant accomplishments..."
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        />
      </div>

      {/* Mandatory Consent Checkboxes matching Wireframe 8.5 */}
      <div className="space-y-3 pt-3 border-t border-slate-100 bg-slate-50 p-4 rounded-xl">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            required
            checked={dataAccuracyConsent}
            onChange={(e) => setDataAccuracyConsent(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-700">
            I confirm that the details provided in this application are accurate to the best of my knowledge. *
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            required
            checked={privacyConsent}
            onChange={(e) => setPrivacyConsent(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-700">
            I agree to the Privacy Policy and Terms of Use for candidate data processing. *
          </span>
        </label>
      </div>

      {/* Submit Footer matching Wireframe 8.5 */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting Application...
            </>
          ) : (
            <>
              Submit Application <ShieldCheck className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

    </div>
  );
}
