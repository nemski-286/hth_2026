import React, { useState, useMemo } from 'react';
import { VerificationRequest, GameConfig } from '../types';
import { supabase } from '../lib/supabase';
import { SECTION_1_RIDDLES } from '../constants';

interface AdminDashboardProps {
  onClose: () => void;
}

type AdminTab = 'controls' | 'feed' | 'teams' | 'history';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('controls');
  const [config, setConfig] = React.useState<GameConfig>({ sections_1_2_unlocked: false, section_3_unlocked: false });
  const [teams, setTeams] = useState<any[]>([]);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);

  React.useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('game_config').select('*').eq('id', 1).single();
      if (data) setConfig(data);
    };

    const fetchTeams = async () => {
      const { data } = await supabase.from('teams').select('*').order('points', { ascending: false });
      if (data) setTeams(data);
    };

    const fetchRequests = async () => {
      const { data } = await supabase.from('verification_requests').select('*').order('timestamp', { ascending: false });
      if (data) setRequests(data);
    };

    fetchConfig();
    fetchTeams();
    fetchRequests();

    // Subscribe to new requests
    const requestSub = supabase
      .channel('admin_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    // Subscribe to team updates for real-time leaderboard
    const teamSub = supabase
      .channel('admin_teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(requestSub);
      supabase.removeChannel(teamSub);
    };
  }, []);

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    // Update request status
    await supabase.from('verification_requests').update({ status: action }).eq('id', requestId);

    if (action === 'approve') {
      // 1. Fetch LATEST team data to avoid race conditions (overwrite prevention)
      const { data: latestTeam, error: fetchError } = await supabase
        .from('teams')
        .select('*')
        .eq('name', req.teamName)
        .single();

      if (latestTeam && !fetchError) {
        let updatedPoints = latestTeam.points;
        let updatedStars = latestTeam.stars_found;
        let updatedSolved = [...(latestTeam.solved_indices || [])];

        if (req.type === 'pointing') {
          updatedPoints += 200;
        } else if (req.type === 'submission') {
          // Resolve index for Section 1
          if (req.section === 1) {
            const riddleIndex = SECTION_1_RIDDLES.findIndex(r => r.targetStarId === req.starName);
            if (riddleIndex !== -1 && !updatedSolved.includes(riddleIndex)) {
              updatedSolved.push(riddleIndex);
              updatedPoints += 100;
              updatedStars += 1;
            }
          } else {
            // Section 2/3 are usually auto-verified, but we handle them here just in case
            updatedPoints += (req.section === 3 ? 200 : req.section === 2 ? 150 : 100);
            updatedStars += 1;
          }
        }

        // 2. Push Atomic Update
        await supabase.from('teams').update({
          points: updatedPoints,
          stars_found: updatedStars,
          solved_indices: updatedSolved
        }).eq('name', req.teamName);

        // Refresh teams list
        const { data: allTeams } = await supabase.from('teams').select('*').order('points', { ascending: false });
        if (allTeams) setTeams(allTeams);
      }
    }

    // Refresh requests
    const { data } = await supabase.from('verification_requests').select('*').order('timestamp', { ascending: false });
    if (data) setRequests(data);
  };

  const toggleSection = async (section: '1_2' | '3') => {
    const field = section === '1_2' ? 'sections_1_2_unlocked' : 'section_3_unlocked';
    const newVal = !config[field as keyof GameConfig];
    const { error } = await supabase.from('game_config').update({ [field]: newVal }).eq('id', 1);
    if (!error) setConfig(prev => ({ ...prev, [field]: newVal }));
  };

  const pendingRequests = useMemo(() => requests.filter(r => r.status === 'pending'), [requests]);
  const processedRequests = useMemo(() => requests.filter(r => r.status !== 'pending'), [requests]);

  const totalApproved = useMemo(() => requests.filter(r => r.status === 'approved').length, [requests]);

  const renderStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[
        { label: 'PENDING', value: pendingRequests.length, color: 'text-amber-400' },
        { label: 'APPROVED', value: totalApproved, color: 'text-emerald-400' },
        { label: 'TEAMS', value: teams.length - 1, color: 'text-indigo-400' }, // Exclude admin
        { label: 'SECURE', value: 'LIVE', color: 'text-slate-500 animate-pulse' }
      ].map((stat, i) => (
        <div key={i} className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl text-center">
          <p className="text-[7px] font-cinzel tracking-widest text-slate-500 uppercase mb-1">{stat.label}</p>
          <p className={`text-lg font-cinzel ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col md:flex-row font-inter overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-56 bg-black/40 border-r border-white/5 flex flex-col p-6 md:p-7 shrink-0">
        <div className="mb-10">
          <h1 className="text-lg font-cinzel text-indigo-400 tracking-wider">COMMAND</h1>
          <p className="text-slate-600 text-[8px] uppercase tracking-widest">Celestial Oversight</p>
        </div>



        <nav className="flex flex-row md:flex-col gap-2 md:gap-3.5 overflow-x-auto md:overflow-visible pb-3 md:pb-0">
          {[
            { id: 'controls', label: 'System Controls', icon: '⚙️' },
            { id: 'feed', label: 'Live Feed', icon: '◈' },
            { id: 'teams', label: 'Team Roster', icon: '◎' },
            { id: 'history', label: 'Chronicle', icon: '🕰' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[9px] font-cinzel tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
            >
              <span>{tab.icon}</span> {tab.label}
              {tab.id === 'feed' && pendingRequests.length > 0 && (
                <span className="ml-auto w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[7px] flex items-center justify-center font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-2xl text-[8px] font-cinzel tracking-widest uppercase transition-all border border-white/5 hover:border-rose-500/20"
          >
            Exit Terminal
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-5 md:p-10 lg:p-14 custom-scrollbar">
        <div className="max-w-3xl mx-auto w-full">
          {renderStats()}

          {activeTab === 'controls' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
              <div>
                <h2 className="text-[12px] font-cinzel tracking-[0.3em] text-indigo-300 uppercase mb-6">System Management</h2>
                <p className="text-slate-500 text-[10px] font-garamond uppercase tracking-widest mb-10 leading-relaxed max-w-lg">
                  Deploy global overrides to synchronize the cosmic alignment. Unlocking sections grants immediate access to all active explorers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-8 rounded-[3rem] border transition-all duration-500 ${config.sections_1_2_unlocked ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'bg-white/[0.02] border-white/5'}`}>
                  <div className="mb-6">
                    <h3 className={`text-xl font-cinzel tracking-wider uppercase ${config.sections_1_2_unlocked ? 'text-emerald-400' : 'text-slate-300'}`}>Labyrinth & Visions</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Sections 01 & 02</p>
                  </div>
                  <button
                    onClick={() => toggleSection('1_2')}
                    className={`w-full py-4 rounded-2xl text-[10px] font-cinzel font-bold tracking-[0.2em] uppercase transition-all shadow-xl ${config.sections_1_2_unlocked
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
                  >
                    {config.sections_1_2_unlocked ? 'SECURE SECTIONS' : 'UNLOCK SECTIONS'}
                  </button>
                </div>

                <div className={`p-8 rounded-[3rem] border transition-all duration-500 ${config.section_3_unlocked ? 'bg-indigo-500/5 border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)]' : 'bg-white/[0.02] border-white/5'}`}>
                  <div className="mb-6">
                    <h3 className={`text-xl font-cinzel tracking-wider uppercase ${config.section_3_unlocked ? 'text-indigo-400' : 'text-slate-300'}`}>Across Archives</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Section 03</p>
                  </div>
                  <button
                    onClick={() => toggleSection('3')}
                    className={`w-full py-4 rounded-2xl text-[10px] font-cinzel font-bold tracking-[0.2em] uppercase transition-all shadow-xl ${config.section_3_unlocked
                      ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-indigo-500/20'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
                  >
                    {config.section_3_unlocked ? 'SECURE ARCHIVES' : 'UNLOCK ARCHIVES'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom duration-500">
              <h2 className="text-[12px] font-cinzel tracking-[0.3em] text-indigo-300 uppercase mb-6">Pending Verifications</h2>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
                  <p className="text-slate-600 font-cinzel text-xs tracking-widest uppercase">The cosmic currents are silent.</p>
                </div>
              ) : (
                pendingRequests.map(req => (
                  <div key={req.id} className="bg-white/[0.03] border border-white/5 p-5 md:p-7 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-5 hover:bg-white/[0.05] transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-[7px] font-bold uppercase tracking-widest border ${req.type === 'pointing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          req.type === 'submission' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                          {req.type === 'pointing' ? '🔭 POINT' : req.type === 'submission' ? '📝 ANSWER' : '🌟 DISCO'}
                        </span>
                        <span className="text-slate-600 text-[8px] uppercase tracking-tighter">{new Date(req.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <h3 className="text-lg font-cinzel text-white uppercase tracking-wider">{req.teamName}</h3>
                      <p className="text-slate-500 text-[9px] mt-1 uppercase tracking-widest">Subject: <span className="text-white">{req.starName}</span></p>
                      {req.submittedAnswer && (
                        <div className="mt-5 p-4 bg-black/40 rounded-2xl border border-white/10 group">
                          <p className="text-[7px] uppercase tracking-[0.3em] text-slate-600 mb-1.5 font-cinzel">Transmission Received</p>
                          <p className="text-indigo-100 font-cinzel tracking-widest text-base group-hover:text-white transition-colors">"{req.submittedAnswer}"</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2.5 shrink-0">
                      <button
                        onClick={() => handleAction(req.id, 'reject')}
                        className="p-3.5 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 transition-all text-[8px] font-cinzel tracking-widest uppercase"
                      >
                        REJECT
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'approve')}
                        className="px-6 py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 transition-all text-[8px] font-cinzel tracking-widest uppercase shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                      >
                        VERIFY
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom duration-500">
              <h2 className="text-[12px] font-cinzel tracking-[0.3em] text-indigo-300 uppercase mb-6">System Roster</h2>
              <div className="grid gap-2.5">
                {teams.filter(t => t.role !== 'admin').map((team, idx) => {
                  const totalAttempts = Object.values(team.attempts || {}).reduce((sum: any, val: any) => sum + val, 0);
                  return (
                    <div key={idx} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-cinzel text-white tracking-widest uppercase font-bold truncate">{team.name}</p>
                        <p className="text-[7px] text-slate-500 uppercase tracking-widest mt-1">Total Attempts: {totalAttempts}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-indigo-400 font-cinzel text-lg">{team.points} PTS</p>
                        <p className="text-[7px] text-slate-700 uppercase tracking-widest">Stars: {team.stars_found}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-500">
              <h2 className="text-[12px] font-cinzel tracking-[0.3em] text-indigo-300 uppercase mb-6">Action Chronicle</h2>
              {processedRequests.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-[3rem]">
                  <p className="text-slate-600 font-cinzel text-xs tracking-widest uppercase">The archives are empty.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {[...processedRequests].reverse().map(req => (
                    <div key={req.id} className="bg-white/[0.01] border border-white/5 px-5 py-3 rounded-xl flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-5">
                        <span className={`text-[9px] font-cinzel tracking-widest ${req.status === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {req.status.toUpperCase()}
                        </span>
                        <p className="text-[10px] text-slate-300 uppercase tracking-widest font-cinzel">{req.teamName} • {req.starName}</p>
                      </div>
                      <span className="text-[7px] text-slate-700 font-inter">{new Date(req.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-5 right-5 pointer-events-none opacity-20 hidden md:block">
        <p className="text-[7px] font-cinzel tracking-[0.6em] text-indigo-500 uppercase">HTH_V2_ENCRYPTED_LINK</p>
      </div>
    </div>
  );
};