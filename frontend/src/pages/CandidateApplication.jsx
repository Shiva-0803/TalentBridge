import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requisitionService, applicationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, GraduationCap, Briefcase, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

import ApplicationStepBio from '../components/ApplicationStepBio';
import ApplicationStepEducation from '../components/ApplicationStepEducation';
import ApplicationStepExperience from '../components/ApplicationStepExperience';
import ApplicationStepResume from '../components/ApplicationStepResume';

export default function CandidateApplication() {
  const { reqId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [error, setError] = useState(null);

  // Step state (1 to 4)
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Bio-Data
  const [bioData, setBioData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    mobile: user?.profile?.mobile || '',
    gender: user?.profile?.gender || '',
    dob: user?.profile?.dob || '',
    current_location: user?.profile?.current_location || '',
    current_company: user?.profile?.current_company || '',
    notice_period: user?.profile?.notice_period || '',
    current_address: user?.profile?.current_address || ''
  });

  // Step 2: Education (Repeatable list)
  const [educationRecords, setEducationRecords] = useState([
    {
      degree: 'B.Tech Computer Science',
      specialization: 'Software Engineering',
      institution: 'State Technological University',
      year_of_passing: '2021',
      grade: '8.4 CGPA',
      education_level: "Bachelor's"
    }
  ]);

  // Step 3: Work Experience (Repeatable list or Fresher)
  const [isFresher, setIsFresher] = useState(false);
  const [experienceRecords, setExperienceRecords] = useState([
    {
      is_fresher: false,
      employer: 'TechCorp Solutions',
      job_title: 'Software Engineer',
      start_date: '2021-07',
      end_date: '',
      currently_working: true,
      key_responsibilities: 'Engineered backend microservices in Python and SQL database architecture.',
      years_calculated: 3.0
    }
  ]);

  // Step 4: Resume & Attachments
  const [resumeFile, setResumeFile] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [dataAccuracyConsent, setDataAccuracyConsent] = useState(true);
  const [privacyConsent, setPrivacyConsent] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await requisitionService.getPublicRequisitionDetail(reqId);
        setJob(data);
      } catch (err) {
        setError('Job opening not found or no longer accepting applications.');
      } finally {
        setLoadingJob(false);
      }
    };
    fetchJob();
  }, [reqId]);

  const handleBioDataChange = (field, value) => {
    setBioData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('requisition_id', job.id);
      formData.append('bio_data', JSON.stringify(bioData));
      formData.append('education', JSON.stringify(educationRecords));
      
      const processedExp = isFresher ? [{ is_fresher: true }] : experienceRecords;
      formData.append('work_experience', JSON.stringify(processedExp));
      
      if (coverNote) formData.append('cover_note', coverNote);
      formData.append('data_accuracy_consent', dataAccuracyConsent);
      formData.append('privacy_policy_consent', privacyConsent);
      formData.append('resume_file', resumeFile);

      const response = await applicationService.submitApplication(formData);

      // Navigate to confirmation screen matching Wireframe 8.6
      navigate('/confirmation', {
        state: {
          application_code: response.application_code,
          submitted_at: response.submitted_at,
          status: response.status,
          job_title: job.job_title,
          requisition_id: job.requisition_id
        }
      });

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit application. Please check your data.');
      setSubmitting(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium">Preparing application form...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Application Unavailable</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            Return to Job Listings
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Bio-Data', icon: User },
    { num: 2, title: 'Education', icon: GraduationCap },
    { num: 3, title: 'Work Experience', icon: Briefcase },
    { num: 4, title: 'Resume & Submit', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded">
                Application Form
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                Applying for: {job.job_title}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Requisition ID: {job.requisition_id} • {job.department} • {job.location}
              </p>
            </div>
          </div>

          {/* 4-Step Progress Indicator matching Wireframe 8.4 */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between relative">
              
              {/* Connecting line behind steps */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 transition-all duration-300 z-0"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />

              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.num;
                const isActive = currentStep === step.num;

                return (
                  <div key={step.num} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`step-circle transition-all ${
                        isCompleted
                          ? 'completed'
                          : isActive
                          ? 'active'
                          : 'inactive'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-2 hidden sm:block ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}

            </div>
          </div>

        </div>
      </div>

      {/* Step Form Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
          {currentStep === 1 && (
            <ApplicationStepBio
              data={bioData}
              onChange={handleBioDataChange}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <ApplicationStepEducation
              records={educationRecords}
              onChange={setEducationRecords}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <ApplicationStepExperience
              records={experienceRecords}
              isFresher={isFresher}
              onFresherToggle={setIsFresher}
              onChange={setExperienceRecords}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <ApplicationStepResume
              resumeFile={resumeFile}
              setResumeFile={setResumeFile}
              coverNote={coverNote}
              setCoverNote={setCoverNote}
              dataAccuracyConsent={dataAccuracyConsent}
              setDataAccuracyConsent={setDataAccuracyConsent}
              privacyConsent={privacyConsent}
              setPrivacyConsent={setPrivacyConsent}
              onSubmit={handleFinalSubmit}
              onBack={() => setCurrentStep(3)}
              submitting={submitting}
            />
          )}
        </div>

      </div>

    </div>
  );
}
