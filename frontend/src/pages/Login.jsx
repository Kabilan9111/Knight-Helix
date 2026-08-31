import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { 
  ShieldCheck, Globe, User, Lock, Eye, ArrowRight, RefreshCw, 
  Calendar, HardHat, FileCheck, BarChart3, CheckCircle2, Activity,
  MapPin, UserPlus, Fingerprint
} from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('ADMIN'); // 'ADMIN' or 'WORKER'
  const [workerMode, setWorkerMode] = useState(null); // 'NEW' or 'EXISTING' or null
  const [formData, setFormData] = useState({ 
    email_mobile: '', password: '',
    fullName: '', age: '', gender: '', mobileNumber: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const socket = useSocket();

  const handleSetup = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/setup`, { method: 'POST' });
      alert('System initialized. Admin credentials check backend/.env');
    } catch(err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_mobile: formData.email_mobile, password: formData.password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      localStorage.setItem('sanchalan_token', data.token);
      localStorage.setItem('sanchalan_user', JSON.stringify(data.user));
      
      if (socket) socket.emit('join_admin_room');
      
      setTimeout(() => {
        setIsLoading(false);
        if (data.user.role === 'OWNER') {
          navigate('/owner/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      }, 500);
      
    } catch(err) {
      setIsLoading(false);
      setError(err.message);
    }
  };

  const handleWorkerAuth = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const endpoint = workerMode === 'NEW' ? '/api/auth/worker/register' : '/api/auth/worker/login';
      
      const payload = workerMode === 'NEW' 
        ? { fullName: formData.fullName, age: formData.age, gender: formData.gender, mobileNumber: formData.mobileNumber }
        : { fullName: formData.fullName, mobileNumber: formData.mobileNumber };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      localStorage.setItem('sanchalan_token', data.token);
      localStorage.setItem('sanchalan_user', JSON.stringify(data.user));
      
      if (socket) socket.emit('join_worker_room', data.user.workerId);
      
      setTimeout(() => {
        setIsLoading(false);
        navigate('/worker/dashboard');
      }, 500);
      
    } catch(err) {
      setIsLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#030308] text-white font-sans overflow-hidden">
      
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[60%] relative flex-col justify-between p-12 overflow-hidden border-r border-[#1a1a2e]">
        
        {/* Background Image & Overlays */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=2000&auto=format&fit=crop" 
            alt="Industrial Facility" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030308] via-[#030308]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[#3b0764]/20 mix-blend-color"></div>
          
          {/* Network Nodes overlay (simulated) */}
          <div className="absolute right-[20%] top-[30%]">
            <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_15px_#c084fc] relative">
              <div className="absolute -inset-1 rounded-full border border-purple-400/50 animate-ping"></div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#080B12]/80 backdrop-blur border border-purple-500/30 px-2 py-1 rounded text-[10px] text-purple-200 whitespace-nowrap">
                <MapPin size={10} /> Site A - Block 1
              </div>
            </div>
            <div className="absolute top-1 right-1 w-px h-32 bg-purple-500/30 transform rotate-45 origin-top-right"></div>
          </div>

          <div className="absolute right-[30%] top-[55%]">
            <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_15px_#c084fc] relative">
              <div className="absolute -inset-1 rounded-full border border-purple-400/50 animate-ping" style={{animationDelay: '1s'}}></div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#080B12]/80 backdrop-blur border border-purple-500/30 px-2 py-1 rounded text-[10px] text-purple-200 whitespace-nowrap">
                <MapPin size={10} /> Site B - Block 2
              </div>
            </div>
          </div>

          <div className="absolute right-[15%] bottom-[35%]">
            <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_15px_#c084fc] relative">
              <div className="absolute -inset-1 rounded-full border border-purple-400/50 animate-ping" style={{animationDelay: '2s'}}></div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#080B12]/80 backdrop-blur border border-purple-500/30 px-2 py-1 rounded text-[10px] text-purple-200 whitespace-nowrap">
                <MapPin size={10} /> Site C - Block 3
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between max-w-2xl">
          
          <div>
            {/* Logo */}
            <div className="flex items-center gap-4 mb-16">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_10px_rgba(124,58,237,0.5)]">
                <path d="M20 2L3 11.5V28.5L20 38L37 28.5V11.5L20 2Z" fill="#7C3AED"/>
                <path d="M20 7L9 13V27L20 33L31 27V13L20 7Z" fill="#030308"/>
                <path d="M25 15L15 15L15 20L25 20L25 25L15 25" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <h1 className="text-3xl font-bold tracking-wide leading-none mb-1">SANCHALAN</h1>
                <p className="text-[10px] text-purple-400 font-semibold tracking-widest uppercase">AI-Driven Execution Intelligence</p>
              </div>
            </div>

            {/* Hero Text */}
            <h2 className="text-[42px] font-bold leading-[1.1] mb-6">
              Execution intelligence<br/>
              for complex<br/>
              <span className="text-[#8b5cf6]">infrastructure.</span>
            </h2>
            <p className="text-[#94a3b8] text-base leading-relaxed max-w-md mb-12">
              Connect planning, field execution, evidence gathering, location intelligence, and AI-driven risk analysis in real time.
            </p>

            {/* Feature List */}
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Plan</h3>
                  <p className="text-xs text-[#94a3b8]">Integrate schedules and project baselines</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <HardHat size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Execute</h3>
                  <p className="text-xs text-[#94a3b8]">Track field execution and task progress</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <FileCheck size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Capture</h3>
                  <p className="text-xs text-[#94a3b8]">Collect evidence with location & time</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Analyze</h3>
                  <p className="text-xs text-[#94a3b8]">AI-driven risk and delay intelligence</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Act</h3>
                  <p className="text-xs text-[#94a3b8]">Proactive insights for better decisions</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            {/* Stats Bar */}
            <div className="flex items-center gap-8 bg-[#080B12]/60 backdrop-blur-md border border-[#1e1e38] p-5 rounded-2xl w-max mb-6">
              <div className="flex items-center gap-3">
                <div className="text-purple-400"><CheckCircle2 size={24} /></div>
                <div>
                  <div className="text-lg font-bold">128+</div>
                  <div className="text-[10px] text-[#94a3b8]">Active Projects</div>
                </div>
              </div>
              <div className="w-px h-8 bg-[#1e1e38]"></div>
              <div className="flex items-center gap-3">
                <div className="text-purple-400"><Calendar size={24} /></div>
                <div>
                  <div className="text-lg font-bold">3420+</div>
                  <div className="text-[10px] text-[#94a3b8]">Tasks Executing</div>
                </div>
              </div>
              <div className="w-px h-8 bg-[#1e1e38]"></div>
              <div className="flex items-center gap-3">
                <div className="text-purple-400"><User size={24} /></div>
                <div>
                  <div className="text-lg font-bold">850+</div>
                  <div className="text-[10px] text-[#94a3b8]">Field Workers</div>
                </div>
              </div>
              <div className="w-px h-8 bg-[#1e1e38]"></div>
              <div className="flex items-center gap-3">
                <div className="text-purple-400"><Activity size={24} /></div>
                <div>
                  <div className="text-lg font-bold">98.7%</div>
                  <div className="text-[10px] text-[#94a3b8]">On-Time Progress</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-[#64748b]">
              © 2026 SANCHALAN. All rights reserved.
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[40%] bg-[#0B0F19] flex flex-col p-8 lg:p-12 overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex justify-between items-start mb-16">
          <div className="flex gap-3">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-purple-400">Secure Workspace</div>
              <div className="text-[11px] text-[#64748b]">Your data is encrypted and protected</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#94a3b8] cursor-pointer hover:text-white transition-colors">
            <Globe size={14} /> EN <span className="text-[10px]">▼</span>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full pb-10">
          
          <div className="mb-8">
            <h2 className="text-[32px] font-bold mb-2">Welcome back</h2>
            <p className="text-[#94a3b8]">Sign in to your SANCHALAN workspace</p>
          </div>
          
          {/* Segmented Control */}
          <div className="flex p-1 bg-[#101522] border border-[#1e1e38] rounded-xl mb-4">
            <button 
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${role === 'OWNER' ? 'bg-[#1C1C35] text-white shadow-md border border-[#2a2a4a]' : 'text-[#64748b] hover:text-white'}`}
              onClick={() => { setRole('OWNER'); setWorkerMode(null); setError(''); }}
            >
              <Globe size={16} className={role === 'OWNER' ? 'text-purple-400' : ''} /> Owner
            </button>
            <button 
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${role === 'ADMIN' ? 'bg-[#1C1C35] text-white shadow-md border border-[#2a2a4a]' : 'text-[#64748b] hover:text-white'}`}
              onClick={() => { setRole('ADMIN'); setWorkerMode(null); setError(''); }}
            >
              <ShieldCheck size={16} className={role === 'ADMIN' ? 'text-purple-400' : ''} /> Site Engineer
            </button>
            <button 
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${role === 'WORKER' ? 'bg-[#1C1C35] text-white shadow-md border border-[#2a2a4a]' : 'text-[#64748b] hover:text-white'}`}
              onClick={() => { setRole('WORKER'); setError(''); }}
            >
              <HardHat size={16} className={role === 'WORKER' ? 'text-purple-400' : ''} /> Supervisor
            </button>
          </div>

          {/* Open Mobile App Quick Link */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/mobile/login')}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 hover:from-blue-800/60 hover:to-indigo-800/60 border border-blue-500/40 rounded-xl text-xs font-bold text-blue-300 flex items-center justify-between shadow-sm transition-all"
            >
              <span className="flex items-center gap-2">📱 <span>Switch to <strong>SANCHALAN Mobile App</strong></span></span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">PWA Edition →</span>
            </button>
          </div>

          {error && (
            <div className="p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {/* ADMIN & OWNER FORM */}
          {(role === 'ADMIN' || role === 'OWNER') && (
            <form onSubmit={handleAdminAuth} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm text-[#e2e8f0] mb-2">Username or Email</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
                  <input 
                    name="email_mobile" 
                    className="w-full bg-[#080B12] border border-[#1e1e38] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    required 
                    value={formData.email_mobile}
                    onChange={handleChange} 
                    placeholder="Enter your username or email" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#e2e8f0] mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="password" 
                    className="w-full bg-[#080B12] border border-[#1e1e38] rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    required 
                    value={formData.password}
                    onChange={handleChange} 
                    placeholder="Enter your password" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-1 mb-2">
                <a href="#" className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors">Forgot password?</a>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#6D28D9] to-[#4C1D95] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white py-3.5 rounded-xl font-medium shadow-[0_4px_15px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2 transition-all">
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>Sign In <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          )}

          {/* WORKER FLOW */}
          {role === 'WORKER' && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {!workerMode && (
                <>
                  <div className="text-center mb-2">
                    <h3 className="text-lg font-semibold mb-1">Are you a new worker?</h3>
                    <p className="text-sm text-[#94a3b8]">Select an option to access your tasks.</p>
                  </div>
                  <div className="flex flex-col gap-4 mt-2">
                    <button 
                      onClick={() => { setWorkerMode('NEW'); setError(''); }}
                      className="group flex items-center gap-4 p-5 bg-[#080B12] border border-[#1e1e38] hover:border-purple-500/50 rounded-xl transition-all hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] text-left"
                    >
                      <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                        <UserPlus size={24} />
                      </div>
                      <div>
                        <div className="font-semibold text-white mb-1">First Time Worker</div>
                        <div className="text-xs text-[#94a3b8]">Register using your mobile number</div>
                      </div>
                      <ArrowRight size={18} className="ml-auto text-[#64748b] group-hover:text-purple-400 transition-colors" />
                    </button>

                    <button 
                      onClick={() => { setWorkerMode('EXISTING'); setError(''); }}
                      className="group flex items-center gap-4 p-5 bg-[#080B12] border border-[#1e1e38] hover:border-purple-500/50 rounded-xl transition-all hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] text-left"
                    >
                      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                        <Fingerprint size={24} />
                      </div>
                      <div>
                        <div className="font-semibold text-white mb-1">Existing Worker</div>
                        <div className="text-xs text-[#94a3b8]">Log in with your registered details</div>
                      </div>
                      <ArrowRight size={18} className="ml-auto text-[#64748b] group-hover:text-blue-400 transition-colors" />
                    </button>
                  </div>
                </>
              )}

              {workerMode && (
                <form onSubmit={handleWorkerAuth} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <button 
                      type="button" 
                      onClick={() => setWorkerMode(null)}
                      className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      ← Back
                    </button>
                    <span className="text-sm text-[#94a3b8]">|</span>
                    <h3 className="text-sm font-semibold">{workerMode === 'NEW' ? 'First Time Registration' : 'Existing Worker Login'}</h3>
                  </div>

                  <div>
                    <label className="block text-sm text-[#e2e8f0] mb-2">Full Name</label>
                    <input 
                      name="fullName" 
                      className="w-full bg-[#080B12] border border-[#1e1e38] rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                      required 
                      value={formData.fullName}
                      onChange={handleChange} 
                      placeholder="e.g. Ramesh Singh" 
                    />
                  </div>

                  {workerMode === 'NEW' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#e2e8f0] mb-2">Age</label>
                        <input 
                          type="number"
                          name="age" 
                          min="18"
                          max="99"
                          className="w-full bg-[#080B12] border border-[#1e1e38] rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                          required 
                          value={formData.age}
                          onChange={handleChange} 
                          placeholder="e.g. 35" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#e2e8f0] mb-2">Gender</label>
                        <select 
                          name="gender" 
                          className="w-full bg-[#080B12] border border-[#1e1e38] rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
                          required 
                          value={formData.gender}
                          onChange={handleChange} 
                        >
                          <option value="" disabled>Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-[#e2e8f0] mb-2">Mobile Number</label>
                    <input 
                      name="mobileNumber" 
                      type="tel"
                      className="w-full bg-[#080B12] border border-[#1e1e38] rounded-xl px-4 py-3.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                      required 
                      value={formData.mobileNumber}
                      onChange={handleChange} 
                      placeholder="e.g. 9876543210" 
                    />
                  </div>

                  <button type="submit" disabled={isLoading} className="w-full mt-4 bg-gradient-to-r from-[#6D28D9] to-[#4C1D95] hover:from-[#7C3AED] hover:to-[#5B21B6] text-white py-3.5 rounded-xl font-medium shadow-[0_4px_15px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2 transition-all">
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>Continue <ArrowRight size={18} /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {(role === 'ADMIN' || role === 'OWNER') && (
            <>
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-[#1e1e38]"></div>
                <span className="text-xs text-[#64748b] uppercase">or</span>
                <div className="flex-1 h-px bg-[#1e1e38]"></div>
              </div>

              <button onClick={handleSetup} className="w-full bg-[#080B12] border border-[#1e1e38] hover:border-[#2a2a4a] hover:bg-[#101522] text-[#94a3b8] hover:text-white py-3.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                <RefreshCw size={16} /> Initialize System Database
              </button>
            </>
          )}
          
        </div>

        {/* Footer */}
        <div className="mt-auto text-center pt-8 border-t border-[#1e1e38]/50">
           <div className="inline-flex items-center gap-2 text-xs text-[#64748b]">
             <ShieldCheck size={14} /> Secured by end-to-end encryption
           </div>
        </div>

      </div>
    </div>
  );
}
