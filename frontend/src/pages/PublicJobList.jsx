import React, { useState, useEffect } from 'react';
import { Search, Briefcase, Sparkles, RefreshCw, Layers, ShieldCheck, Zap, Calendar, Filter } from 'lucide-react';
import { requisitionService } from '../services/api';
import JobCard from '../components/JobCard';
import ShareModal from '../components/ShareModal';

export default function PublicJobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedLoc, setSelectedLoc] = useState('All');
  const [selectedExp, setSelectedExp] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All'); // 'All', '24h', '7d', '30d'

  const [filters, setFilters] = useState({ departments: ['All'], locations: ['All'], experiences: ['All'] });
  const [shareModalJob, setShareModalJob] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await requisitionService.getPublicList({
        search,
        department: selectedDept,
        location: selectedLoc,
        experience: selectedExp
      });
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const opts = await requisitionService.getPublicFilters();
      setFilters(opts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedDept, selectedLoc, selectedExp]);

  // Filter jobs by Date Posted
  const filteredJobs = jobs.filter((job) => {
    if (selectedDateFilter === 'All') return true;
    const dateStr = job.posted_at || job.created_at;
    if (!dateStr) return true;
    
    const postedDate = new Date(dateStr);
    const now = new Date();
    const diffHours = (now - postedDate) / (1000 * 60 * 60);

    if (selectedDateFilter === '24h') return diffHours <= 24;
    if (selectedDateFilter === '7d') return diffHours <= 24 * 7;
    if (selectedDateFilter === '30d') return diffHours <= 24 * 30;
    return true;
  });

  const hasActiveFilters = search || selectedDept !== 'All' || selectedLoc !== 'All' || selectedExp !== 'All' || selectedDateFilter !== 'All';

  const resetAllFilters = () => {
    setSearch('');
    setSelectedDept('All');
    setSelectedLoc('All');
    setSelectedExp('All');
    setSelectedDateFilter('All');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24">
      
      {/* Enterprise Portal Hero Banner */}
      <div className="relative bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 shadow-xl overflow-hidden border-b border-slate-800">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-blue-400" /> TalentBridge Enterprise Career Portal
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight gradient-hero-title leading-tight">
            Discover Verified Opportunities
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Browse corporate requisitions, apply securely with email OTP verification, and track application status in real-time.
          </p>

          {/* Key Metric Badges */}
          <div className="pt-2 flex flex-wrap justify-center items-center gap-4 text-xs text-slate-300 font-semibold">
            <div className="flex items-center gap-2 bg-slate-800/70 px-3.5 py-1.5 rounded-full border border-slate-700/60">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Direct Employer Openings
            </div>
            <div className="flex items-center gap-2 bg-slate-800/70 px-3.5 py-1.5 rounded-full border border-slate-700/60">
              <Zap className="w-4 h-4 text-amber-400" /> Passwordless OTP Access
            </div>
            <div className="flex items-center gap-2 bg-slate-800/70 px-3.5 py-1.5 rounded-full border border-slate-700/60">
              <Layers className="w-4 h-4 text-blue-400" /> Real-Time Notifications
            </div>
          </div>

          {/* Integrated Search & Filter Controls */}
          <div className="mt-8 bg-white/95 rounded-2xl p-4 shadow-2xl border border-slate-200/90 max-w-5xl mx-auto text-slate-800 backdrop-blur-xl">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              
              {/* Keyword Search */}
              <div className="sm:col-span-4 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title, department, skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Department Filter */}
              <div className="sm:col-span-2">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">All Depts</option>
                  {filters.departments.filter(d => d !== 'All').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div className="sm:col-span-2">
                <select
                  value={selectedLoc}
                  onChange={(e) => setSelectedLoc(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">All Locations</option>
                  {filters.locations.filter(l => l !== 'All').map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Experience Filter */}
              <div className="sm:col-span-2">
                <select
                  value={selectedExp}
                  onChange={(e) => setSelectedExp(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">All Experience</option>
                  {Array.from(new Set(['Fresher (0-1 year)', ...filters.experiences.filter(ex => ex !== 'All')])).sort((a, b) => {
                    if (a.toLowerCase().includes('fresher')) return -1;
                    if (b.toLowerCase().includes('fresher')) return 1;
                    return a.localeCompare(b);
                  }).map(ex => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>

              {/* Date Posted Filter */}
              <div className="sm:col-span-2">
                <select
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">Date: All Time</option>
                  <option value="24h">Past 24 Hours</option>
                  <option value="7d">Past 7 Days</option>
                  <option value="30d">Past 30 Days</option>
                </select>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Main Jobs Listing Section - Structured List View */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Results Bar */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-200/80 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Open Requisitions ({filteredJobs.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Showing verified job openings in structured list view</p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl border border-blue-200 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center text-slate-500">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading open requisitions...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-premium max-w-lg mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No matching positions found</h3>
            <p className="text-xs text-slate-500">Try broadening your search term or resetting active filters.</p>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="mt-2 text-xs font-bold text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          /* List View Container */
          <div className="flex flex-col space-y-3.5">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onShare={(jobToShare) => setShareModalJob(jobToShare)}
              />
            ))}
          </div>
        )}

      </div>

      <ShareModal
        isOpen={!!shareModalJob}
        onClose={() => setShareModalJob(null)}
        job={shareModalJob}
      />

    </div>
  );
}
