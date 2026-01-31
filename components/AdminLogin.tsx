import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { TeamProfile } from '../types';

export const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAdminLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setFeedback(null);

        try {
            // Query for the admin user specifically
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .eq('name', 'Admin')
                .eq('password', password)
                .eq('role', 'admin')
                .maybeSingle();

            if (data) {
                const profile: TeamProfile = {
                    id: data.id,
                    name: data.name,
                    points: data.points,
                    starsFound: data.stars_found,
                    role: data.role,
                    solvedIndices: data.solved_indices,
                    attempts: data.attempts,
                    forgetPasswordClicked: data.forget_password_clicked
                };

                localStorage.setItem('hth_profile', JSON.stringify(profile));
                setFeedback({ type: 'success', message: "Command Link Established. Accessing Terminal..." });

                setTimeout(() => {
                    navigate('/admin', { replace: true });
                }, 1500);
            } else {
                setFeedback({ type: 'error', message: "Access Denied. Invalid Authorization Key." });
            }
        } catch (err) {
            console.error("Admin login error:", err);
            setFeedback({ type: 'error', message: "System Error. Connection failed." });
        } finally {
            setIsLoading(false);
        }
    }, [password, navigate]);

    return (
        <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-black">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-black"></div>
            </div>

            <div className="relative z-10 glass-panel w-[88%] max-w-sm p-10 rounded-[3rem] animate-in zoom-in duration-700 border-white/5">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                        <span className="text-2xl text-indigo-400">◈</span>
                    </div>
                    <h1 className="text-2xl font-cinzel font-bold text-white tracking-wider uppercase">System Command</h1>
                    <p className="text-[9px] font-garamond text-slate-400 mt-2 uppercase tracking-widest">Administrator Authorization Required</p>
                </div>

                <form className="space-y-6" onSubmit={handleAdminLogin}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-cinzel text-indigo-300 tracking-[0.2em] uppercase ml-1">Access Key</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-slate-100 text-center focus:outline-none focus:border-indigo-500/50 transition-all font-inter tracking-[0.4em]"
                        />
                    </div>

                    <button
                        disabled={isLoading}
                        className={`w-full py-4 bg-indigo-600/40 hover:bg-indigo-500/60 text-white rounded-2xl font-cinzel font-bold tracking-wider-custom transition-all shadow-xl text-[11px] uppercase border border-indigo-500/30 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? "Verifying..." : "Establish Link"}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="text-[9px] font-cinzel text-slate-500 hover:text-slate-300 transition-colors tracking-widest uppercase"
                        >
                            Return to Surface
                        </button>
                    </div>
                </form>

                {feedback && (
                    <div className={`mt-6 text-center text-[10px] font-cinzel tracking-wider-custom animate-pulse ${feedback.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {feedback.message}
                    </div>
                )}
            </div>

            <div className="fixed bottom-6 w-full text-center pointer-events-none opacity-30">
                <p className="text-[7px] font-cinzel tracking-[0.5em] text-indigo-500 uppercase">Secure Command Protocol v2.0</p>
            </div>
        </div>
    );
};
