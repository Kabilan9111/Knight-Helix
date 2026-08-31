import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileAuth } from '../context/MobileAuthContext';
import { 
  ShieldCheck, HardHat, Crown, User, Lock, Phone, 
  ArrowRight, Loader2, AlertTriangle, CheckCircle2, UserPlus
} from 'lucide-react';

export default function MobileLogin() {
  const { loginAdmin, loginWorker, registerWorker } = useMobileAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState('QUICK'); // 'QUICK', 'ADMIN', 'WORKER', 'REGISTER'
  const [adminCreds, setAdminCreds] = useState({ username: 'admin', password: 'admin123' });
  const [workerCreds, setWorkerCreds] = useState({ fullName: 'Arun Kumar', mobileNumber: '9999999901' });
  const [registerForm, setRegisterForm] = useState({ fullName: '', age: '', gender: 'Male', mobileNumber: '' });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickLogin = async (role) => {
    setLoading(true);
    setError('');
    try {
      if (role === 'ADMIN') {
        await loginAdmin('admin', 'admin123');
      } else if (role === 'WORKER') {
        await loginWorker('Arun Kumar', '9999999901');
      } else if (role === 'OWNER') {
        await loginAdmin('owner', 'owner123');
      }
      navigate('/mobile');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginAdmin(adminCreds.username, adminCreds.password);
      navigate('/mobile');
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginWorker(workerCreds.fullName, workerCreds.mobileNumber);
      navigate('/mobile');
    } catch (err) {
      setError(err.message || 'Worker not found. Check details or register.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await registerWorker(registerForm);
      navigate('/mobile');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between p-5 font-sans">
      
      {/* Brand Header */}
      <div className="pt-6 text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-2xl mx-auto shadow-xl shadow-blue-500/25">
          SC
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">SANCHALAN</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Project Execution Intelligence • Mobile Edition</p>
        </div>
      </div>

      {/* Auth Card */}
      <div className="my-auto py-6 space-y-4 max-w-sm mx-auto w-full">
        
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-200 rounded-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="grid grid-cols-3 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-[11px] font-bold">
          <button
            onClick={() => { setAuthMode('QUICK'); setError(''); }}
            className={`py-2 rounded-xl transition-all ${
              authMode === 'QUICK' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            1-Tap Demo
          </button>
          <button
            onClick={() => { setAuthMode('ADMIN'); setError(''); }}
            className={`py-2 rounded-xl transition-all ${
              authMode === 'ADMIN' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            Site Eng.
          </button>
          <button
            onClick={() => { setAuthMode('WORKER'); setError(''); }}
            className={`py-2 rounded-xl transition-all ${
              authMode === 'WORKER' || authMode === 'REGISTER' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            Supervisor
          </button>
        </div>

        {/* QUICK 1-TAP DEMO LOGIN */}
        {authMode === 'QUICK' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="text-xs text-center text-slate-400 font-medium">
              Select a project persona for instant access:
            </div>

            <button
              onClick={() => handleQuickLogin('ADMIN')}
              disabled={loading}
              className="w-full p-4 bg-slate-900 border border-emerald-500/40 hover:border-emerald-400/80 active:scale-95 rounded-2xl flex items-center justify-between text-left shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="text-sm font-black text-white group-hover:text-emerald-300">Site Engineer</div>
                  <div className="text-[10px] text-slate-400">Review queue & field verifications</div>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-white" />
            </button>

            <button
              onClick={() => handleQuickLogin('WORKER')}
              disabled={loading}
              className="w-full p-4 bg-slate-900 border border-amber-500/40 hover:border-amber-400/80 active:scale-95 rounded-2xl flex items-center justify-between text-left shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <HardHat size={22} />
                </div>
                <div>
                  <div className="text-sm font-black text-white group-hover:text-amber-300">Field Supervisor</div>
                  <div className="text-[10px] text-slate-400">Arun Kumar • Assigned tasks & GPS walk</div>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-white" />
            </button>

            <button
              onClick={() => handleQuickLogin('OWNER')}
              disabled={loading}
              className="w-full p-4 bg-slate-900 border border-purple-500/40 hover:border-purple-400/80 active:scale-95 rounded-2xl flex items-center justify-between text-left shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Crown size={22} />
                </div>
                <div>
                  <div className="text-sm font-black text-white group-hover:text-purple-300">Executive Owner</div>
                  <div className="text-[10px] text-slate-400">Portfolio & executive intelligence</div>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-white" />
            </button>
          </div>
        )}

        {/* ADMIN CREDENTIALS LOGIN */}
        {authMode === 'ADMIN' && (
          <form onSubmit={handleAdminSubmit} className="space-y-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl animate-in fade-in duration-150">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Site Engineer / Admin Sign In
            </h3>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={adminCreds.username}
                  onChange={(e) => setAdminCreds({ ...adminCreds, username: e.target.value })}
                  placeholder="admin"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password"
                  value={adminCreds.password}
                  onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2.5 rounded-xl outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Sign In as Engineer'}
            </button>
          </form>
        )}

        {/* WORKER LOGIN */}
        {authMode === 'WORKER' && (
          <form onSubmit={handleWorkerSubmit} className="space-y-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Supervisor Sign In
              </h3>
              <button
                type="button"
                onClick={() => setAuthMode('REGISTER')}
                className="text-[10px] text-blue-400 font-bold hover:underline"
              >
                + Register New
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Full Name</label>
              <input 
                type="text"
                value={workerCreds.fullName}
                onChange={(e) => setWorkerCreds({ ...workerCreds, fullName: e.target.value })}
                placeholder="Arun Kumar"
                required
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mobile Number</label>
              <input 
                type="tel"
                value={workerCreds.mobileNumber}
                onChange={(e) => setWorkerCreds({ ...workerCreds, mobileNumber: e.target.value })}
                placeholder="9999999901"
                required
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2.5 rounded-xl outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Sign In as Supervisor'}
            </button>
          </form>
        )}

        {/* WORKER REGISTRATION */}
        {authMode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                New Supervisor Registration
              </h3>
              <button
                type="button"
                onClick={() => setAuthMode('WORKER')}
                className="text-[10px] text-blue-400 font-bold hover:underline"
              >
                Existing Login
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Full Name</label>
              <input 
                type="text"
                value={registerForm.fullName}
                onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Age</label>
                <input 
                  type="number"
                  value={registerForm.age}
                  onChange={(e) => setRegisterForm({ ...registerForm, age: e.target.value })}
                  placeholder="30"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Gender</label>
                <select
                  value={registerForm.gender}
                  onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2 py-2 rounded-xl outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mobile Number</label>
              <input 
                type="tel"
                value={registerForm.mobileNumber}
                onChange={(e) => setRegisterForm({ ...registerForm, mobileNumber: e.target.value })}
                placeholder="e.g. 9876543210"
                required
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Register & Enter Site'}
            </button>
          </form>
        )}

      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-slate-500 font-medium">
        SANCHALAN Mobile Execution Engine v2.0 • Offline Ready
      </div>

    </div>
  );
}
