import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { GameState, Star, Riddle, Score, TeamProfile, VerificationRequest, GameConfig } from './types';
import { STARS, SECTION_1_RIDDLES, SECTION_2_RIDDLES, SECTION_3_RIDDLES, INITIAL_TEAMS } from './constants';
import { StarMap } from './components/StarMap';
import { RiddlePanel } from './components/RiddlePanel';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';

import { supabase } from './lib/supabase';

const SECTION_GUIDELINES = {
  1: [
    "All challenges in this section focus on celestial objects visible in the night sky.",
    "After providing a correct answer, use your binoculars to identify the celestial object.",
    "Questions with a 🔭 emoji require an additional telescope pointing challenge for bonus points.",
    "The answer box will automatically lock if you provide the correct answer on your first try.",
    "Be careful: you only have 2 attempts per question before the input box is permanently locked."
  ],
  2: [
    "Answers in this section are celestial objects, though they may not be visible in the current sky.",
    "No binocular or telescope pointing is required for the challenges in this section.",
    "Input boxes will automatically lock upon entering a correct answer on the first attempt.",
    "You have a limit of 2 attempts per question; the box locks after two unsuccessful tries.",
    "Alignment must be verified through the star map interface where applicable."
  ],
  3: [
    "Questions must be solved sequentially; you can only proceed to the next after solving the current one.",
    "Answers are related to the field of astronomy but are not limited to specific celestial objects.",
    "Binocular and telescope pointing are not required for this final set of challenges.",
    "You have infinitely many attempts for every question in this section—take your time."
  ]
} as const;

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [gameState, setGameState] = useState<GameState | undefined>(undefined);
  const [profile, setProfile] = useState<TeamProfile | null | undefined>(undefined);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const [showPointingPrompt, setShowPointingPrompt] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>({ sections_1_2_unlocked: false, section_3_unlocked: false });
  const [forgotPasswordWarning, setForgotPasswordWarning] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showTabletDiscovery, setShowTabletDiscovery] = useState(false);
  const [showCompletionPage, setShowCompletionPage] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    console.log("Hydrating state from localStorage...");
    const savedProfile = localStorage.getItem('hth_profile');
    const savedGameState = localStorage.getItem('hth_gameState');

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        console.log("Found profile in storage:", parsed.name, parsed.role);
        setProfile(parsed);
      } catch (e) {
        console.error("Failed to parse saved profile", e);
        localStorage.removeItem('hth_profile');
        setProfile(null);
      }
    } else {
      console.log("No profile found in storage");
      setProfile(null);
    }

    if (savedGameState) {
      console.log("Found gameState in storage:", savedGameState);
      setGameState(savedGameState as GameState);
    } else {
      console.log("No gameState found, default to LOGIN");
      setGameState(GameState.LOGIN);
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    // Only save if we have finished hydrating
    if (profile !== undefined) {
      if (profile) {
        console.log("Storage: Saving profile for", profile.name);
        localStorage.setItem('hth_profile', JSON.stringify(profile));
      } else {
        console.log("Storage: Removing profile");
        localStorage.removeItem('hth_profile');
      }
    }
  }, [profile]);

  useEffect(() => {
    if (gameState !== undefined) {
      console.log("Storage: Saving gameState:", gameState);
      localStorage.setItem('hth_gameState', gameState);
    }
  }, [gameState]);

  // Global protection listeners
  useEffect(() => {
    const preventAction = (e: Event) => e.preventDefault();

    document.addEventListener('contextmenu', preventAction);
    document.addEventListener('selectstart', preventAction);
    document.addEventListener('dragstart', preventAction);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', preventAction);
      document.removeEventListener('selectstart', preventAction);
      document.removeEventListener('dragstart', preventAction);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const urls = [
      "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjlpNGczOHg1NDJ0aTQxOG9saXc3Znh1bHpvMjA4bXR1NjN6N2ZhaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PkKzNQjwPy7GvxZbfe/giphy.gif",
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWg1bGdzYjcyc29ob3Q3cGkxb3lqNGVua3F4ZHp6eG1oMjV6YTBoZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/RHIKETUlUINYvV7CAO/giphy.gif"
    ];
    Promise.all(urls.map(url => new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = resolve;
    }))).then(() => setIsLoaded(true));

    const fetchConfig = async () => {
      const { data } = await supabase.from('game_config').select('*').eq('id', 1).single();
      if (data) setGameConfig(data);
    };

    fetchConfig();

    const configSubscription = supabase
      .channel('game_config_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_config' }, (payload) => {
        setGameConfig(payload.new as GameConfig);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(configSubscription);
    };
  }, []);

  // Real-time Team Sync
  useEffect(() => {
    if (!profile?.name) return;

    // Sanitize team name for channel (alphanumeric only)
    const channelName = `team_sync_${profile.name.replace(/[^a-z0-9]/gi, '_')}`;

    const teamSubscription = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'teams',
        filter: `name=eq.${profile.name}`
      }, (payload) => {
        console.log("Sync: Received remote update for team", profile.name);
        const newData = payload.new as any;
        setProfile(prev => {
          if (!prev) return prev;
          // Only update if data is actually different to avoid unnecessary re-renders
          return {
            ...prev,
            points: newData.points,
            starsFound: newData.stars_found,
            solvedIndices: newData.solved_indices,
            attempts: newData.attempts,
            tabletDiscovered: newData.tablet_discovered,
            forgetPasswordClicked: newData.forget_password_clicked
          };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(teamSubscription);
    };
  }, [profile?.name]);

  const handleLogin = useCallback(async (name: string, pass: string) => {
    const trimmedName = name.trim();

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('name', trimmedName)
      .eq('password', pass)
      .maybeSingle();

    if (data) {
      setProfile({
        id: data.id,
        name: data.name,
        points: data.points,
        starsFound: data.stars_found,
        role: data.role,
        solvedIndices: data.solved_indices,
        attempts: data.attempts,
        forgetPasswordClicked: data.forget_password_clicked,
        tabletDiscovered: data.tablet_discovered
      });

      setGameState(GameState.MENU);
    } else {
      setFeedback({ type: 'error', message: "Access Denied. Check credentials." });
      setTimeout(() => setFeedback(null), 3000);
    }
  }, [navigate]);


  const handleRegister = useCallback(async (name: string, pass: string, confirmPass: string) => {
    if (pass !== confirmPass) {
      setFeedback({ type: 'error', message: "Passwords do not match." });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const pinRegex = /^[a-zA-Z0-9]{4,10}$/;
    if (!pinRegex.test(pass)) {
      setFeedback({ type: 'error', message: "PIN must be 4-10 alphanumeric characters." });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFeedback({ type: 'error', message: "All fields are required." });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const { data: existing } = await supabase
      .from('teams')
      .select('id')
      .eq('name', trimmedName)
      .maybeSingle();

    if (existing) {
      setFeedback({ type: 'error', message: "Team name already claimed." });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const { error } = await supabase.from('teams').insert([{
      name: trimmedName,
      password: pass,
      role: 'user',
      points: 0,
      stars_found: 0,
      solved_indices: [],
      attempts: {},
      members: ""
    }]);

    if (error) {
      console.error(error);
      setFeedback({ type: 'error', message: "Registration failed. Try again." });
    } else {
      setFeedback({ type: 'success', message: "Profile Established. Log In to proceed." });
      setTimeout(() => {
        setFeedback(null);
        setGameState(GameState.LOGIN);
      }, 2000);
    }
  }, []);

  const handleForgotPassword = useCallback(async (teamName: string) => {
    if (!teamName) {
      setFeedback({ type: 'error', message: "Please enter your team name." });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const { data: team } = await supabase.from('teams').select('*').eq('name', teamName).maybeSingle();

    if (!team) {
      setFeedback({ type: 'error', message: "Team not found." });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (team.forget_password_clicked) {
      setFeedback({ type: 'error', message: "Warning already issued. Contact Admin personally." });
      setTimeout(() => setFeedback(null), 5000);
      return;
    }

    setForgotPasswordWarning(true);
  }, []);

  const confirmForgotPassword = async (teamName: string) => {
    await supabase.from('teams').update({ forget_password_clicked: true }).eq('name', teamName);
    setForgotPasswordWarning(false);
    setFeedback({ type: 'error', message: "The admin won't be responsible if you cannot login later." });
    setTimeout(() => setFeedback(null), 5000);
  };

  const selectSection = useCallback((num: number) => {
    // Permission check
    const sec1Solved = profile?.solvedIndices?.filter(i => i >= 0 && i < 100).length || 0;
    const sec2Solved = profile?.solvedIndices?.filter(i => i >= 100 && i < 200).length || 0;
    const isNaturallyUnlocked = sec1Solved >= SECTION_1_RIDDLES.length && sec2Solved >= SECTION_2_RIDDLES.length;
    const isUnlocked = num <= 2 || gameConfig.section_3_unlocked || isNaturallyUnlocked;

    if (!isUnlocked) {
      setFeedback({ type: 'error', message: "This path remains veiled." });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (num > 3) {
      setFeedback({ type: 'error', message: "Horizon Connection Pending." });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setProfile(prev => prev ? ({ ...prev, currentSection: num, solvedIndices: prev.solvedIndices || [], attempts: prev.attempts || {} }) : null);
    setGameState(GameState.START);
  }, [profile?.solvedIndices, gameConfig.section_3_unlocked]);

  const activeRiddles = useMemo(() => {
    if (profile?.currentSection === 3) return SECTION_3_RIDDLES;
    if (profile?.currentSection === 2) return SECTION_2_RIDDLES;
    return SECTION_1_RIDDLES;
  }, [profile?.currentSection]);

  const handleSolveSubmit = useCallback((index: number, answer: string) => {
    if (!profile) return;
    const currentSection = profile.currentSection || 1;
    const attemptKey = `${currentSection}-${index}`;
    const currentAttempts = (profile.attempts?.[attemptKey] || 0);

    if (currentSection !== 3 && currentAttempts >= 2) return;

    const riddle = activeRiddles[index];
    const globalIndex = index + (currentSection - 1) * 100;

    // 1. Prevent Redundant Solves
    if (profile.solvedIndices?.includes(globalIndex)) {
      setFeedback({ type: 'success', message: "This star is already aligned." });
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    const isCorrect = riddle.acceptedAnswers?.some(ans => answer.trim().toLowerCase() === ans.toLowerCase());
    const newAttempts = currentAttempts + 1;

    // 2. Database Logging for ALL sections
    supabase.from('verification_requests').insert([{
      team_name: profile.name,
      star_name: riddle.targetStarId,
      submitted_answer: answer,
      timestamp: new Date().toISOString(),
      status: currentSection === 1 ? 'pending' : (isCorrect ? 'auto-verified' : 'rejected'),
      type: 'submission',
      section: currentSection
    }]).then(({ error }) => error && console.error(error));

    // Calculate new state locally
    const updatedAttempts = currentSection === 3 ? (profile.attempts || {}) : { ...(profile.attempts || {}), [attemptKey]: newAttempts };
    const isNewSolve = isCorrect && !profile.solvedIndices?.includes(globalIndex);

    let updatedPoints = profile.points;
    let newSolvedIndices = [...(profile.solvedIndices || [])];
    let updatedStarsFound = profile.starsFound;

    if (isNewSolve) {
      newSolvedIndices.push(globalIndex);
      updatedPoints += (currentSection === 3 ? 200 : currentSection === 2 ? 150 : 100);
      updatedStarsFound += 1;
    }

    const updatedProfile: TeamProfile = {
      ...profile,
      attempts: updatedAttempts,
      solvedIndices: newSolvedIndices,
      points: updatedPoints,
      starsFound: updatedStarsFound,
      tabletDiscovered: profile.tabletDiscovered || (currentSection === 3 && index === 2 && isCorrect)
    };

    // 3. Update Local State (Side-effect free)
    setProfile(updatedProfile);

    // 4. Sync to Supabase (Async Side Effect)
    supabase.from('teams').update({
      attempts: updatedAttempts,
      points: updatedPoints,
      stars_found: updatedStarsFound,
      solved_indices: newSolvedIndices,
      tablet_discovered: updatedProfile.tabletDiscovered
    }).eq('name', profile.name).then(({ error }) => error && console.error("Sync error:", error));

    // 5. Trigger UI Effects
    if (isNewSolve) {
      if (currentSection === 3 && index === 2) {
        setTimeout(() => setShowTabletDiscovery(true), 2000);
      }
      if (currentSection === 3 && index === 5) {
        setTimeout(() => setShowCompletionPage(true), 1500);
      }
      if (currentSection === 1 && newSolvedIndices.filter(i => i < 100).length === 3 && !profile.hasRequestedPointing) {
        setTimeout(() => setShowPointingPrompt(true), 2500);
      }
    }

    if (currentSection >= 2) {
      if (isCorrect) {
        setFeedback({ type: 'success', message: "Alignment Successful" });
      } else {
        setFeedback({ type: 'error', message: "Alignment Unsuccessful" });
      }
      setTimeout(() => setFeedback(null), 2000);
    }
  }, [activeRiddles, profile]);

  const handleRequestPointing = useCallback((starId: string) => {
    const star = STARS.find(s => s.id === starId);
    if (!star || !profile) return;

    supabase.from('verification_requests').insert([{
      team_name: profile.name,
      star_name: star.name,
      timestamp: new Date().toISOString(),
      status: 'pending',
      type: 'pointing'
    }]).then(({ error }) => error && console.error(error));

    setProfile(prev => prev ? ({ ...prev, hasRequestedPointing: true }) : null);
    setFeedback({ type: 'success', message: "Pointing Signal Dispatched" });
    setTimeout(() => setFeedback(null), 3000);
  }, [profile]);

  const loginBackground = useMemo(() => (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZjlpNGczOHg1NDJ0aTQxOG9saXc3Znh1bHpvMjA4bXR1NjN6N2ZhaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PkKzNQjwPy7GvxZbfe/giphy.gif" className="w-full h-full object-cover opacity-40 blur-[1px] scale-110 img-fade-in" alt="" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/90"></div>
    </div>
  ), []);

  const menuBackground = useMemo(() => (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWg1bGdzYjcyc29ob3Q3cGkxb3lqNGVua3F4ZHp6eG1oMjV6YTBoZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/RHIKETUlUINYvV7CAO/giphy.gif" className="w-full h-full object-cover opacity-30 blur-[2px] scale-105 img-fade-in" alt="" />
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"></div>
    </div>
  ), []);

  const handleDownloadTablet = useCallback(async () => {
    const imageUrl = "https://i.ibb.co/GQTyVjfy/Whats-App-Image-2026-01-31-at-16-11-23.jpg";
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = "discovered_tablet.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to direct link if fetch fails
      window.open(imageUrl, '_blank');
    }
  }, []);

  const renderPlayerView = () => {
    if (gameState === GameState.LOGIN || gameState === GameState.REGISTER) {
      const isRegister = gameState === GameState.REGISTER;

      return (
        <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-black">
          {loginBackground}
          <div className="relative z-10 glass-panel w-[88%] max-w-sm md:max-w-md lg:max-w-xl p-6 md:p-10 rounded-[3.5rem] animate-in zoom-in duration-1000 border-white/5">
            <h1 className="text-[26px] sm:text-[34px] md:text-[48px] lg:text-[54px] font-cinzel font-bold text-center text-white mb-5 tracking-wider-custom drop-shadow-2xl leading-tight uppercase">Hunting the Heavens</h1>
            {isRegister && (
              <p className="text-sm font-garamond text-center text-slate-300 mb-6 tracking-wide drop-shadow-lg uppercase">Establish Secret Key</p>
            )}
            {!isRegister && <div className="h-3" />}
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const name = (f.elements.namedItem('teamName') as HTMLInputElement).value;
              const pass = (f.elements.namedItem('password') as HTMLInputElement).value;
              if (isRegister) {
                const confirmPass = (f.elements.namedItem('confirmPassword') as HTMLInputElement).value;
                handleRegister(name, pass, confirmPass);
              } else {
                handleLogin(name, pass);
              }
            }}>
              <input name="teamName" required placeholder="TEAM NAME" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-3.5 text-slate-100 text-center focus:outline-none focus:border-indigo-500/50 transition-all font-cinzel tracking-wide-custom text-[11px] uppercase" />
              <input name="password" type="password" required placeholder={isRegister ? "SET SECRET KEY (4-10 CHARS)" : "SECRET KEY"} className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-3.5 text-slate-100 text-center focus:outline-none focus:border-indigo-500/50 transition-all font-cinzel tracking-wide-custom text-[11px]" />
              {isRegister && (
                <input name="confirmPassword" type="password" required placeholder="CONFIRM SECRET KEY" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-3.5 text-slate-100 text-center focus:outline-none focus:border-indigo-500/50 transition-all font-cinzel tracking-wide-custom text-[11px]" />
              )}
              <button className="w-full py-3.5 bg-indigo-600/60 hover:bg-indigo-500 text-white rounded-2xl font-cinzel font-bold tracking-wider-custom transition-all shadow-2xl text-[11px] uppercase">
                {isRegister ? "Register Profile" : "Establish Link"}
              </button>
              {!isRegister && (
                <div className="text-center">
                  <button type="button" onClick={() => {
                    const name = (document.getElementsByName('teamName')[0] as HTMLInputElement).value;
                    handleForgotPassword(name);
                  }} className="text-[9px] font-garamond text-slate-500 hover:text-slate-300 transition-colors tracking-wide uppercase">
                    Forgot Secret Key?
                  </button>
                </div>
              )}
              <div className="text-center pt-2">
                <button type="button" onClick={() => setGameState(isRegister ? GameState.LOGIN : GameState.REGISTER)} className="text-[11px] font-garamond text-slate-300 hover:text-white transition-colors tracking-wide underline underline-offset-8 decoration-slate-800 uppercase font-bold">
                  {isRegister ? "ALREADY REGISTERED? LOG IN" : "REGISTER NEW TEAM"}
                </button>
              </div>
            </form>
            {feedback && <div className={`mt-5 text-center text-[10px] font-cinzel tracking-wider-custom animate-pulse ${feedback.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>{feedback.message}</div>}
          </div>
        </div>
      );
    }

    if (gameState === GameState.MENU) {
      return (
        <div className="relative w-screen h-screen bg-slate-950 overflow-y-auto custom-scrollbar">
          {menuBackground}
          <StarMap transparent={true} />
          <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-between py-10 px-4 md:px-10 text-center">
            <div className="w-full max-w-5xl space-y-8 md:space-y-12 animate-in fade-in slide-in-from-top duration-1000">
              <div className="space-y-3">
                <h1 className="text-[26px] sm:text-[34px] md:text-[50px] font-cinzel text-indigo-100 tracking-wider-custom drop-shadow-[0_0_30px_rgba(99,102,241,0.3)] uppercase font-bold">Select Your Path</h1>
                <div className="flex items-center justify-center gap-4 text-xs md:text-sm font-cinzel text-indigo-200 tracking-wider-custom uppercase">
                  <span className="opacity-80">TEAM NAME</span>
                  <span className="text-xl text-indigo-400/90 leading-none select-none">|</span>
                  <span className="font-bold">{profile?.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 w-full">
                {[1, 2, 3].map((id) => {
                  const sec1Solved = profile?.solvedIndices?.filter(i => i >= 0 && i < 100).length || 0;
                  const sec2Solved = profile?.solvedIndices?.filter(i => i >= 100 && i < 200).length || 0;
                  const isNaturallyUnlocked = sec1Solved >= SECTION_1_RIDDLES.length && sec2Solved >= SECTION_2_RIDDLES.length;
                  const isUnlocked = id <= 2 || gameConfig.section_3_unlocked || isNaturallyUnlocked;

                  return (
                    <button key={id} onClick={() => isUnlocked && selectSection(id)} disabled={!isUnlocked} className={`glass-panel-menu p-6 md:p-10 rounded-[3rem] transition-all duration-700 hover:-translate-y-2 group ${isUnlocked ? 'border-white/20' : 'opacity-20 grayscale cursor-not-allowed'}`}>
                      <div className={`text-2xl md:text-4xl mb-4 transition-transform group-hover:rotate-45 duration-700 ${isUnlocked ? 'text-white' : 'text-slate-600'}`}>◈</div>
                      <h3 className="text-base md:text-xl font-cinzel text-slate-100 mb-1.5 tracking-wide-custom font-bold">
                        {id === 1 ? "Labyrinth of Daedalus" : id === 2 ? "Visions Unknown" : "Across the Archives"}
                      </h3>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider-custom font-bold">SECTION 0{id} {!isUnlocked ? '• LOCKED' : ''}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pt-8 pb-4 animate-in fade-in duration-1000 delay-700">
              <button onClick={() => {
                setProfile(null);
                setGameState(GameState.LOGIN);
                localStorage.removeItem('hth_profile');
                localStorage.removeItem('hth_gameState');
              }} className="text-[11px] font-cinzel text-slate-400 hover:text-white transition-all tracking-wider-custom uppercase underline underline-offset-8 decoration-slate-800 hover:decoration-slate-400 font-bold px-10 py-4 bg-white/5 md:bg-transparent rounded-full md:rounded-none">Sever Connection</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
        <div className="pdf-bg animate-celestial-drift pointer-events-none">
          <StarMap transparent={true} />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-orange-950/20 to-transparent blur-3xl"></div>
        </div>
        <div className="fixed top-0 left-0 right-0 z-[60] h-16 flex items-center px-6 md:px-10 pointer-events-none">
          <div className="pointer-events-auto cursor-pointer flex items-center gap-3 glass-panel px-4 py-2 rounded-full hover:bg-white/5 transition-all" onClick={() => setGameState(GameState.MENU)}>
            <div className="w-7 h-7 rounded-full bg-indigo-600/80 flex items-center justify-center font-cinzel text-[10px] text-white">◈</div>
            <span className="text-[9px] font-cinzel tracking-wider-custom text-indigo-100 uppercase font-bold">RETURN</span>
          </div>
        </div>

        {gameState === GameState.START ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 text-center">
            <div className="relative z-10 glass-panel w-[88%] max-w-xl p-10 md:p-14 rounded-[4.5rem] animate-in zoom-in duration-1000 border-white/20">
              <h2 className="text-[9px] font-cinzel tracking-wider-custom text-slate-400 mb-4 uppercase">HTH Section 0{profile?.currentSection}</h2>
              <h1 className="text-[26px] sm:text-[34px] md:text-[54px] font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-slate-50 to-slate-400 mb-6 tracking-wide-custom drop-shadow-2xl font-bold uppercase leading-tight">
                {profile?.currentSection === 3 ? "Across the Archives" : profile?.currentSection === 2 ? "Visions Unknown" : "Labyrinth of Daedalus"}
              </h1>
              <div className="mb-10">
                <button
                  onClick={() => setShowGuidelines(true)}
                  className="group relative px-8 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-2xl transition-all duration-300"
                >
                  <span className="text-[10px] font-cinzel tracking-[0.3em] text-indigo-200 uppercase font-bold">Initiation Protocol</span>
                  <div className="mt-1 text-[8px] font-garamond text-indigo-300/60 uppercase tracking-widest group-hover:text-indigo-300 transition-colors">View Section Guidelines</div>
                </button>
              </div>
              <button onClick={() => setGameState(GameState.PLAYING)} className="px-14 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-cinzel tracking-wider-custom transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] active:scale-95 text-xs font-bold uppercase">ASCEND</button>
            </div>

            {showGuidelines && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-6 animate-in fade-in duration-300">
                <div className="glass-panel w-[88%] max-w-lg p-8 md:p-12 rounded-[3.5rem] relative animate-in zoom-in slide-in-from-bottom-8 duration-500 border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                  <button
                    onClick={() => setShowGuidelines(false)}
                    className="absolute top-8 right-8 w-10 h-10 rounded-2xl bg-white/5 hover:bg-rose-500/20 flex items-center justify-center transition-all border border-white/10 group"
                  >
                    <span className="text-2xl text-slate-400 group-hover:text-rose-400 transition-colors">×</span>
                  </button>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[10px] font-cinzel text-indigo-400 tracking-[0.4em] uppercase font-bold mb-2">Protocol Reference</h3>
                      <h2 className="text-2xl font-cinzel text-white tracking-wider uppercase font-bold">Guidelines: Section 0{profile?.currentSection}</h2>
                    </div>

                    <div className="max-h-[45vh] overflow-y-auto pr-4 visible-scrollbar py-2">
                      <ul className="space-y-5">
                        {(SECTION_GUIDELINES[profile?.currentSection as keyof typeof SECTION_GUIDELINES] || []).map((rule, i) => (
                          <li key={i} className="flex gap-4 animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0 animate-pulse" />
                            <p className="text-sm md:text-base font-garamond text-slate-300 leading-relaxed font-bold italic">
                              {rule}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => setShowGuidelines(false)}
                      className="w-full py-4 bg-indigo-600/30 hover:bg-indigo-600/50 text-white rounded-2xl font-cinzel text-[11px] tracking-[0.3em] uppercase transition-all border border-indigo-500/30 font-bold active:scale-[0.98]"
                    >
                      Acknowledge & Proceed
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <RiddlePanel
            riddles={activeRiddles}
            gameState={gameState}
            onNext={() => { }}
            starsFoundCount={profile?.starsFound || 0}
            onSignalAdmin={() => { }}
            isSectionOne={profile?.currentSection === 1}
            onSolveSubmit={handleSolveSubmit}
            tabletDiscovered={!!profile?.tabletDiscovered}
            onDownloadTablet={handleDownloadTablet}
            solvedIndices={profile?.solvedIndices?.filter(i => {
              const sec = profile.currentSection || 1;
              return i >= (sec - 1) * 100 && i < sec * 100;
            }).map(i => i % 100) || []}
            attempts={profile?.attempts || {}}
            currentSection={profile?.currentSection || 1}
          />
        )}

        {showPointingPrompt && profile?.currentSection === 1 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
            <div className="glass-panel w-[88%] max-w-md p-6 md:p-10 rounded-[3.5rem] text-center border-white/20 animate-in zoom-in duration-500">
              <h3 className="text-xl font-cinzel text-white mb-4 tracking-wide-custom font-bold uppercase">Telescope Link Available</h3>
              <p className="text-slate-300 font-garamond mb-6 text-base leading-relaxed">Your alignments have reached a resonant frequency. Select a star for pointing verification.</p>
              <div className="space-y-2">
                {profile?.solvedIndices?.map(idx => {
                  const starId = SECTION_1_RIDDLES[idx].targetStarId;
                  const starName = STARS.find(s => s.id === starId)?.name;
                  return (
                    <button key={idx} onClick={() => handleRequestPointing(starId)} className="w-full py-4 border border-white/5 hover:border-white/50 rounded-2xl bg-white/5 transition-all text-[11px] font-cinzel tracking-wider-custom hover:bg-white/10 text-slate-50 uppercase font-bold">POINT AT {starName?.toUpperCase()}</button>
                  );
                })}
              </div>
              <button onClick={() => setShowPointingPrompt(false)} className="mt-5 text-[10px] font-cinzel tracking-wider-custom text-slate-500 hover:text-white transition-all uppercase font-bold">Wait for later</button>
            </div>
          </div>
        )}
        {forgotPasswordWarning && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="glass-panel w-[88%] max-w-sm p-8 rounded-[3rem] text-center border-rose-500/20 animate-in zoom-in duration-300">
              <h3 className="text-lg font-cinzel text-rose-400 mb-4 tracking-wider uppercase font-bold">Security Warning</h3>
              <p className="text-slate-300 font-garamond mb-6 text-sm leading-relaxed">
                You can only request password assistance ONCE. The admin will NOT be responsible if you cannot login later. Proceed?
              </p>
              <div className="flex gap-4">
                <button onClick={() => setForgotPasswordWarning(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-cinzel text-[10px] tracking-widest uppercase transition-all">Cancel</button>
                <button onClick={() => { const name = (document.getElementsByName('teamName')[0] as HTMLInputElement).value; confirmForgotPassword(name); }} className="flex-1 py-3 bg-rose-600/40 hover:bg-rose-500 text-white rounded-2xl font-cinzel text-[10px] tracking-widest uppercase transition-all shadow-lg font-bold">I Understand</button>
              </div>
            </div>
          </div>
        )}

        {feedback && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-2.5 rounded-full glass-panel animate-in slide-in-from-bottom duration-500 shadow-2xl ${feedback.type === 'error' ? 'border-rose-500/30 text-rose-200' : 'border-emerald-500/30 text-emerald-200'}`}>
            <p className="font-cinzel text-[10px] tracking-wider-custom uppercase font-bold">{feedback.message}</p>
          </div>
        )}

        {showTabletDiscovery && (
          <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-6 animate-in fade-in duration-1000">
            <div className="relative z-10 glass-panel w-[92%] max-w-2xl p-8 md:p-14 rounded-[4.5rem] text-center border-white/20 animate-in zoom-in slide-in-from-bottom-12 duration-1000">
              <h2 className="text-[10px] font-cinzel tracking-[0.4em] text-indigo-400 mb-6 uppercase font-bold">New Artifact Uncovered</h2>
              <div className="w-full h-48 md:h-80 rounded-3xl overflow-hidden border border-white/10 mb-8 bg-black/40">
                <img src="https://i.ibb.co/GQTyVjfy/Whats-App-Image-2026-01-31-at-16-11-23.jpg" alt="Discovered Tablet" className="w-full h-full object-contain" />
              </div>
              <p className="text-xl md:text-3xl font-garamond text-indigo-100 mb-10 italic">"A random tablet has been discovered."</p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                  onClick={handleDownloadTablet}
                  className="px-10 py-4 bg-indigo-600/40 hover:bg-indigo-500/60 text-white rounded-2xl font-cinzel text-[11px] tracking-widest uppercase transition-all shadow-xl font-bold border border-indigo-500/30"
                >
                  Add to Inventory
                </button>
                <button
                  onClick={() => setShowTabletDiscovery(false)}
                  className="px-10 py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-cinzel text-[11px] tracking-widest uppercase transition-all font-bold border border-white/10"
                >
                  Continue Exploration
                </button>
              </div>
            </div>
          </div>
        )}

        {showCompletionPage && (
          <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-6 animate-in fade-in duration-[2000ms]">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse delay-700" />
            </div>

            <div className="relative z-10 glass-panel w-full max-w-2xl p-10 md:p-20 rounded-[5rem] text-center border-indigo-500/20 shadow-[0_0_100px_rgba(99,102,241,0.1)] animate-in zoom-in slide-in-from-bottom-20 duration-[1500ms]">
              <div className="inline-block px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 mb-10">
                <h2 className="text-[11px] font-cinzel tracking-[0.5em] text-indigo-300 uppercase font-bold">Voyage Complete</h2>
              </div>

              <div className="space-y-8 mb-16">
                <p className="text-xl md:text-2xl font-garamond text-slate-100 leading-relaxed italic">
                  "The physicist finds his peace within on a new planet starting new beginning. The lone voyager suffices his goal filing his desire and fulfilling his sole."
                </p>

                <div className="w-24 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent mx-auto" />

                <p className="text-2xl md:text-4xl font-cinzel text-indigo-500 tracking-wider">
                  Congratulations
                </p>
                <p className="text-sm font-cinzel text-slate-400 tracking-[0.2em] uppercase">
                  On completing Hunting the Heavens 2026
                </p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <a
                  href="https://chat.whatsapp.com/Hl9lHdMK2BbJNtanXMkgCO"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-3xl font-cinzel text-xs tracking-[0.3em] uppercase transition-all border border-emerald-500/30 hover:scale-105 active:scale-95 shadow-2xl"
                >
                  <svg className="w-5 h-5 fill-emerald-400" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.412c-1.935 0-3.83-.518-5.494-1.498L3.02 21l.635-3.522c-1.085-1.666-1.658-3.613-1.658-5.61 0-5.86 4.764-10.627 10.63-10.627 2.844 0 5.518 1.107 7.527 3.117s3.114 4.683 3.114 7.51c0 5.862-4.764 10.628-10.627 10.628" />
                  </svg>
                  Join the Archives
                </a>
                <span className="text-[10px] font-cinzel text-slate-500 tracking-widest uppercase opacity-60">Success Unlocked</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/" element={profile === undefined ? <div className="h-screen w-screen bg-black" /> : renderPlayerView()} />
      <Route path="/admin/login" element={<AdminLogin onLoginSuccess={(p) => setProfile(p)} />} />
      <Route path="/admin" element={
        profile === undefined ? (
          <div className="h-screen w-screen bg-black" />
        ) : profile?.role === 'admin' ? (
          <AdminDashboard onClose={() => {
            console.log("Auth: Admin logging out...");
            setProfile(null);
            setGameState(GameState.LOGIN);
            localStorage.removeItem('hth_profile');
            localStorage.removeItem('hth_gameState');
            navigate('/admin/login', { replace: true });
          }} />
        ) : (
          <Navigate to="/admin/login" replace />
        )
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;