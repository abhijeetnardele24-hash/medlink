import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { 
  Calendar, RefreshCw, Clock, Video, User, CheckCircle, 
  AlertCircle, TrendingUp, Users, Activity, FileSignature, 
  MessageSquare, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { Appointment } from '../types';

// Mock data for mini-charts to give it an enterprise feel
const mockEarningsData = [
  { day: 'Mon', value: 1200 }, { day: 'Tue', value: 1800 }, 
  { day: 'Wed', value: 1500 }, { day: 'Thu', value: 2400 }, 
  { day: 'Fri', value: 2100 }, { day: 'Sat', value: 800 }, 
  { day: 'Sun', value: 3000 }
];

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAppointments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await api.get('/appointments');
      if (response.data) {
        setAppointments(response.data.data || []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch appointments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleAction = async (id: string, action: string, version: number) => {
    try {
      await api.patch(`/appointments/${id}`, { action, version });
      fetchAppointments(true);
    } catch (err) {
      console.error(err);
      setError('Failed to update appointment.');
    }
  };

  const upcomingAppointments = appointments
    .filter(a => a.status === 'confirmed' || a.status === 'in_progress')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    
  const requests = appointments.filter(a => a.status === 'requested');
  const uniquePatients = new Set(appointments.map(a => a.patient?.id)).size;
  const firstName = user?.displayName?.split(' ')[0] || 'Doctor';

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="p-8 max-w-[1400px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            Welcome back, Dr. {firstName} <span className="text-2xl animate-wave">👋</span>
          </h1>
          <p className="text-gray-500 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchAppointments(true)} 
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-teal-600 transition-all shadow-sm"
            disabled={refreshing}
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button 
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm shadow-teal-600/20 transition-all"
            onClick={() => navigate('/availability')}
          >
            <Calendar size={18} /> Manage Schedule
          </button>
        </div>
      </motion.div>

      {profile?.verificationStatus === 'pending_verification' && (
        <motion.div variants={itemVariants} className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 shadow-sm">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600 mt-0.5">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900">Pending Verification</h3>
            <p className="text-amber-700 mt-1">Your account is currently under review by our administration team. You won't be visible to patients until approved.</p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div variants={itemVariants} className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> {error}
        </motion.div>
      )}

      {/* Enterprise Stats Strip */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Pending Requests', value: requests.length, icon: <AlertCircle size={20} />, color: 'bg-amber-100 text-amber-600', trend: '+2 since yesterday' },
          { label: 'Upcoming Today', value: upcomingAppointments.length, icon: <Clock size={20} />, color: 'bg-teal-100 text-teal-600', trend: 'Next in 45 mins' },
          { label: 'Total Patients', value: uniquePatients, icon: <Users size={20} />, color: 'bg-blue-100 text-blue-600', trend: '+12% this month' },
          { label: 'Weekly Earnings', value: '₹12.8k', icon: <TrendingUp size={20} />, color: 'bg-emerald-100 text-emerald-600', isChart: true },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-teal-200 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                {stat.icon}
              </div>
              {!stat.isChart && <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">{stat.trend}</span>}
            </div>
            <div>
              <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-gray-500">{stat.label}</div>
            </div>
            
            {stat.isChart && (
              <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockEarningsData}>
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Daily Agenda Timeline */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          
          {/* Active / Instant Action Card */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-bold tracking-wider text-sm uppercase">Active Sandbox</span>
              </div>
              <h2 className="text-3xl font-black mb-2">Telehealth Video Suite</h2>
              <p className="text-gray-400 max-w-lg mb-8 leading-relaxed">
                Launch a secure, HIPAA-compliant virtual room instantly. Features local recording, AI transcription, and a real-time whiteboard.
              </p>
              <button
                onClick={() => navigate(`/consultation/instant-${Date.now().toString(36)}`)}
                className="bg-white text-gray-900 hover:bg-gray-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
              >
                <Video size={20} className="text-teal-600" /> Start Instant Meeting
              </button>
            </div>
          </div>

          {/* Timeline View */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-teal-600" /> Today's Agenda
              </h2>
              <button className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
                View Calendar <ArrowRight size={16} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Your schedule is clear</h3>
                <p className="text-gray-500 mt-2 max-w-sm mx-auto">You have no upcoming appointments for today. Enjoy your free time or open more availability slots.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
                {upcomingAppointments.map((appt, idx) => {
                  const time = new Date(appt.scheduledAt);
                  const isNext = idx === 0; // Highlight the very next appointment
                  
                  return (
                    <div key={appt.id} className="relative pl-8 group">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isNext ? 'bg-teal-500 shadow-teal-500/30' : 'bg-gray-300 group-hover:bg-teal-400'} transition-colors`}></div>
                      
                      <div className={`p-5 rounded-2xl border transition-all ${isNext ? 'bg-teal-50/50 border-teal-100 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-sm font-bold ${isNext ? 'text-teal-700' : 'text-gray-900'}`}>
                                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                                {appt.concernCategory?.replace(/_/g, ' ') || 'General'}
                              </span>
                            </div>
                            <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                              {appt.patient?.fullName || 'Unknown Patient'}
                            </h4>
                            <p className="text-gray-500 text-sm mt-1">Confirmed • Video Consultation</p>
                          </div>
                          
                          <button
                            className={`shrink-0 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors ${
                              isNext 
                                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20' 
                                : 'bg-gray-50 hover:bg-teal-50 text-gray-700 hover:text-teal-700'
                            }`}
                            onClick={() => navigate(`/consultation/${appt.id}`)}
                          >
                            <Video size={18} /> {isNext ? 'Join Now' : 'View Room'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Task Queue & Triage */}
        <motion.div variants={itemVariants} className="space-y-8">
          
          {/* Incoming Requests Triage */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={20} /> Needs Triage
              </h3>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md">{requests.length}</span>
            </div>
            
            {!loading && requests.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No pending requests.</p>
            ) : (
              <div className="space-y-4">
                {requests.slice(0, 3).map(appt => (
                  <div key={appt.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-900 text-sm">{appt.patient?.fullName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(appt.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-1">{appt.concernCategory?.replace(/_/g, ' ')}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(appt.id, 'confirm', appt.version)} className="flex-1 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors">
                        Accept
                      </button>
                      <button onClick={() => handleAction(appt.id, 'reject', appt.version)} className="flex-1 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
                {requests.length > 3 && (
                  <button className="w-full py-2 text-sm text-teal-600 font-medium hover:text-teal-700">
                    View all {requests.length} requests
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Tasks (Mock Enterprise Workflow) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Action Items</h3>
            <div className="space-y-3">
              <div className="p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors flex items-start gap-3 border border-transparent hover:border-gray-100">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0">
                  <FileSignature size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Sign Prescriptions</h4>
                  <p className="text-xs text-gray-500 mt-0.5">3 pending pharmacy orders require your digital signature.</p>
                </div>
              </div>
              <div className="p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors flex items-start gap-3 border border-transparent hover:border-gray-100">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Patient Messages</h4>
                  <p className="text-xs text-gray-500 mt-0.5">2 unread follow-up messages from yesterday's patients.</p>
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
};
