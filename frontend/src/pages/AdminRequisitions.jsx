import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Copy, Edit, Eye, CheckCircle, XCircle, Search, RefreshCw, Briefcase, FileText, AlertCircle, Trash2 } from 'lucide-react';
import { requisitionService } from '../services/api';

export default function AdminRequisitions() {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('All');
  
  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const [formData, setFormData] = useState({
    job_title: '',
    department: 'Engineering',
    location: '',
    employment_type: 'Full-time',
    experience_range: '',
    openings: 1,
    hiring_manager: '',
    max_salary_budget: '',
    hiring_target_date: '',
    job_description: '',
    status: 'Published'
  });

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const data = await requisitionService.getAdminList();
      setRequisitions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      company_name: 'TalentBridge',
      job_title: '',
      department: 'Engineering',
      location: 'Hyderabad',
      employment_type: 'Full-time',
      experience_range: '0-1 Years (Fresher)',
      openings: 1,
      hiring_manager: 'HR Recruiting Team',
      max_salary_budget: '',
      hiring_target_date: '',
      job_description: '',
      status: 'Published'
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (req) => {
    setEditingId(req.id);
    setFormData({
      company_name: req.company_name || 'TalentBridge',
      job_title: req.job_title,
      department: req.department,
      location: req.location,
      employment_type: req.employment_type,
      experience_range: req.experience_range,
      openings: req.openings,
      hiring_manager: req.hiring_manager || 'HR Recruiting Team',
      max_salary_budget: req.max_salary_budget || '',
      hiring_target_date: req.hiring_target_date || '',
      job_description: req.job_description,
      status: req.status
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleSaveRequisition = async (statusOverride = null) => {
    setModalLoading(true);
    setModalError(null);

    // Strict validation: Ensure Company Name, Job Title, Salary Budget, Department, Location, Experience, and Job Description are entered
    if (
      !formData.company_name?.trim() ||
      !formData.job_title?.trim() ||
      !formData.department?.trim() ||
      !formData.location?.trim() ||
      !formData.employment_type?.trim() ||
      !formData.experience_range?.trim() ||
      !formData.max_salary_budget?.trim() ||
      !formData.job_description?.trim()
    ) {
      setModalError('⚠️ Please enter all required details (Company Name, Job Title/Role, Maximum Salary Budget, Department, Location, Employment Type, Experience Range, and Job Description) before submitting!');
      setModalLoading(false);
      return;
    }

    const payload = {
      ...formData,
      company_name: formData.company_name.trim(),
      job_title: formData.job_title.trim(),
      hiring_manager: formData.hiring_manager?.trim() || 'HR Recruiting Team',
      status: statusOverride || formData.status
    };

    try {
      if (editingId) {
        await requisitionService.update(editingId, payload);
      } else {
        await requisitionService.create(payload);
      }
      setShowModal(false);
      fetchRequisitions();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setModalError(detail);
      } else if (Array.isArray(detail)) {
        setModalError(detail.map(d => `${d.loc?.[d.loc?.length - 1] || 'Field'}: ${d.msg}`).join(', '));
      } else {
        setModalError('Failed to save requisition. Please check form fields.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await requisitionService.clone(id);
      fetchRequisitions();
    } catch (err) {
      alert('Failed to clone requisition.');
    }
  };

  const handleStatusToggle = async (id, newStatus) => {
    try {
      // Get existing requisition and update only status
      const existing = requisitions.find(r => r.id === id);
      if (existing) {
        await requisitionService.update(id, { ...existing, status: newStatus });
      }
      fetchRequisitions();
    } catch (err) {
      alert('Failed to change status.');
    }
  };

  const filtered = requisitions.filter(r => {
    const matchesSearch = r.job_title.toLowerCase().includes(search.toLowerCase()) || r.requisition_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusTab === 'All' || r.status === statusTab;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
              System Admin Console
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Job Requisitions Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create, edit, publish, or clone job openings. Manage requisition visibility across the public site.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Job Requisition
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {['All', 'Published', 'Draft', 'Closed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusTab === tab ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search requisitions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Requisitions Grid Table */}
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading requisitions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-md mx-auto">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No requisitions found</h3>
            <p className="text-xs text-slate-500 mt-1">Create a new job requisition to begin sourcing candidates.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">Requisition ID</th>
                    <th className="py-3.5 px-4">Job Title</th>
                    <th className="py-3.5 px-4">Department & Location</th>
                    <th className="py-3.5 px-4">Openings</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Applications</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-blue-600">{r.requisition_id}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{r.job_title}</td>
                      <td className="py-4 px-4 text-slate-600">
                        <span>{r.department}</span> • <span className="text-slate-400">{r.location}</span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800">{r.openings}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          r.status === 'Published' ? 'badge-published' : r.status === 'Draft' ? 'badge-draft' : 'badge-closed'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Link
                          to={`/admin/applications?req_id=${r.id}`}
                          className="inline-flex items-center gap-1.5 font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> {r.application_count} Candidate(s)
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(r)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Requisition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(r.id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Duplicate Requisition (Clone)"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequisition(r.id, r.job_title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Job Requisition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {r.status === 'Published' ? (
                          <button
                            onClick={() => handleStatusToggle(r.id, 'Closed')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(r.id, 'Published')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                          >
                            Publish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create / Edit Modal matching Wireframe 8.7 & Page 14 */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Edit Job Requisition' : 'Create New Job Requisition'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-5">
                
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g. TalentBridge / Google / Infosys"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Job Title / Role *</label>
                    <input
                      type="text"
                      required
                      value={formData.job_title}
                      onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                      placeholder="e.g. Full Stack Developer"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Number of Openings *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.openings}
                      onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Department Radio Options */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Department *</label>
                  <div className="flex flex-wrap gap-2">
                    {['Engineering', 'Product & Design', 'Human Resources', 'Sales & Marketing', 'Customer Support', 'Finance & Operations', 'Quality Assurance'].map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setFormData({ ...formData, department: dept })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          formData.department === dept
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Radio Options */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Location *</label>
                  <div className="flex flex-wrap gap-2">
                    {['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi NCR', 'Chennai', 'Pune', 'Remote'].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setFormData({ ...formData, location: loc })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          formData.location === loc
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Employment Type Radio Options */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Employment Type *</label>
                  <div className="flex flex-wrap gap-2">
                    {['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, employment_type: type })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          formData.employment_type === type
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Range Radio Options */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Experience Range *</label>
                  <div className="flex flex-wrap gap-2">
                    {['0-1 Years (Fresher)', '1-3 Years', '3-5 Years', '5-8 Years', '8+ Years'].map((exp) => (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => setFormData({ ...formData, experience_range: exp })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          formData.experience_range === exp
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Salary Budget in ₹ Rupees */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Maximum Salary Budget (in ₹ Rupees) *</label>
                  <input
                    type="text"
                    required
                    value={formData.max_salary_budget}
                    onChange={(e) => setFormData({ ...formData, max_salary_budget: e.target.value })}
                    placeholder="e.g. ₹ 6,00,000 - ₹ 12,00,000 PA or ₹ 50,000 / month"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Job Description & Responsibilities *</label>
                  <textarea
                    rows={5}
                    required
                    value={formData.job_description}
                    onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                    placeholder="Enter detailed responsibilities, key requirements, and company culture overview..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none resize-y"
                  />
                </div>

              </div>

              {/* Action Buttons matching Wireframe 8.7 */}
              <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveRequisition('Draft')}
                  disabled={modalLoading}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveRequisition('Published')}
                  disabled={modalLoading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                  Publish Requisition
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
