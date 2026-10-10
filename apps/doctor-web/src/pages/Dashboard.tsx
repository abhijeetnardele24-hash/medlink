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
import toast from 'react-hot-toast';
import { useAppointments } from '../hooks/useAppointments';
import { useDashboardNetwork } from '../hooks/useDashboardNetwork';
import { DashboardSkeleton } from '../components/Skeleton';

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const {
    appointments,
    unreadMessages,
    loading,
    refreshing,
    error,
    fetchAppointments,
    handleAction
  } = useAppointments();

  const { networkStates } = useDashboardNetwork();

  const isSameLocalDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const upcomingAppointments = appointments
    .filter(a => (a.status === 'confirmed' || a.status === 'in_progress') && isSameLocalDate(a.scheduledAt))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    
  const requests = appointments.filter(a => a.status === 'requested');
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const uniquePatients = new Set(appointments.map(a => a.patient?.id)).size;
  const doctorName = profile?.fullName || user?.displayName || 'Doctor';

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

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
          <h1 className="text-3xl font-bold text-navy-900 mb-1 flex items-center gap-2">
            Welcome back, Dr. {doctorName} <span className="text-2xl animate-wave">👋</span>
          </h1>
          <p className="text-slate-500 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchAppointments(true)} 
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-slate-50 hover:text-brand-600 transition-all shadow-sm"
            disabled={refreshing}
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button 
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 shadow-soft text-white rounded-xl font-semibold shadow-sm shadow-teal-600/20 transition-all"
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
          { label: 'Pending Requests', value: requests.length, icon: <AlertCircle size={20} />, color: 'bg-amber-100 text-amber-600' },
          { label: 'Upcoming Today', value: upcomingAppointments.length, icon: <Clock size={20} />, color: 'bg-teal-100 text-brand-600' },
          { label: 'Total Patients', value: uniquePatients, icon: <Users size={20} />, color: 'bg-blue-100 text-blue-600' },
          { label: 'Completed Consultations', value: completedCount, icon: <CheckCircle size={20} />, color: 'bg-emerald-100 text-emerald-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card relative overflow-hidden group hover:border-teal-200 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-navy-900 mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Daily Agenda Timeline */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          


          {/* Timeline View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                <Calendar className="text-brand-600" /> Today's Agenda
              </h2>
              <button className="text-sm font-medium text-brand-600 flex items-center gap-1 px-4 py-2 bg-brand-50 hover:bg-teal-100 rounded-lg transition-colors">
                View Calendar <ArrowRight size={16} />
              </button>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-navy-900">Your schedule is clear</h3>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">You have no upcoming appointments for today. Enjoy your free time or open more availability slots.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
                {upcomingAppointments.map((appt, idx) => {
                  const time = new Date(appt.scheduledAt);
                  const isNext = idx === 0; // Highlight the very next appointment
                  
                  return (
                    <div key={appt.id} className="relative pl-8 group">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isNext ? 'bg-brand-500 shadow-teal-500/30' : 'bg-gray-300 group-hover:bg-teal-400'} transition-colors`}></div>
                      
                      <div className={`p-6 rounded-2xl border transition-all flex flex-col ${isNext ? 'bg-brand-50/50 border-teal-100 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                          Upcoming Consultation
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-bold text-xl text-navy-900 mb-1">
                            {appt.patient?.fullName || 'Unknown Patient'}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-700 font-medium mb-3">
                          <Calendar size={16} className="text-brand-600" />
                          {time.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="text-slate-500">Status:</span>
                            <span className="text-brand-600 font-bold flex items-center gap-1">
                              <CheckCircle size={14} /> {appt.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          {networkStates[appt.id] && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${
                              networkStates[appt.id] === 'audio-only' 
                                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {networkStates[appt.id] === 'audio-only' ? (
                                <>
                                  <AlertCircle size={12} /> Patient on Audio (Poor Network)
                                </>
                              ) : (
                                <>
                                  <Video size={12} /> Patient on Video
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            isNext 
                              ? 'bg-brand-600 hover:bg-brand-700 shadow-soft text-white shadow-md shadow-teal-600/20' 
                              : 'bg-gray-900 hover:bg-black text-white'
                          }`}
                          onClick={() => navigate(`/consultation/${appt.id}${appt.preferredMode === 'async_chat' ? '?mode=async' : ''}`)}
                        >
                          {appt.preferredMode === 'async_chat' ? <Activity size={18} /> : <Video size={18} />} 
                          {appt.preferredMode === 'async_chat' ? 'Open Chat' : 'Join Consultation'}
                        </button>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={20} /> Needs Triage
              </h3>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-md">{requests.length}</span>
            </div>
            
            {!loading && requests.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No pending requests.</p>
            ) : (
              <div className="space-y-4">
                {requests.slice(0, 3).map(appt => (
                  <div key={appt.id} className="p-4 bg-slate-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-navy-900 text-sm">{appt.patient?.fullName}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(appt.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-1">{appt.concernCategory?.replace(/_/g, ' ')}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(appt.id, 'confirm', appt.version)} className="flex-1 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors">
                        Accept
                      </button>
                      <button onClick={() => handleAction(appt.id, 'reject', appt.version)} className="flex-1 py-1.5 bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
                {requests.length > 3 && (
                  <button className="w-full py-2 text-sm text-brand-600 font-medium hover:text-teal-700">
                    View all {requests.length} requests
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Tasks (Mock Enterprise Workflow) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
            <h3 className="text-lg font-bold text-navy-900 mb-6">Action Items</h3>
            <div className="space-y-3">

              <div 
                className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-start gap-3 border border-transparent hover:border-gray-100"
                onClick={() => {
                  if (unreadMessages.length > 0) {
                    navigate(`/consultation/${(unreadMessages[0] as any).encounterId}`);
                  }
                }}
              >
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0 relative">
                  <MessageSquare size={18} />
                  {unreadMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-900">Patient Messages</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {unreadMessages.length > 0 
                      ? `${unreadMessages.length} unread follow-up message(s) from recent patients.`
                      : "No unread messages. You're all caught up."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
};

