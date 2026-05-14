import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, IndianRupee, Plus, Fingerprint, Activity, Wallet, CheckCircle2, X, AlertCircle } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

const SOCKET_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3001/api';

// ─── Custom Toast System ───────────────────────────────────────────────────────

let toastId = 0;

function useToasts() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'success', title, sub }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, title, sub }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, dismiss };
}

const TOAST_ICONS = {
  success: <CheckCircle2 className="w-4 h-4" />,
  info:    <Wallet className="w-4 h-4" />,
  user:    <Fingerprint className="w-4 h-4" />,
  error:   <AlertCircle className="w-4 h-4" />,
};

const TOAST_COLORS = {
  success: 'bg-emerald-50 text-emerald-600',
  info:    'bg-blue-50 text-blue-500',
  user:    'bg-brand-50 text-brand-500',
  error:   'bg-red-50 text-red-500',
};

const TOAST_BAR = {
  success: 'bg-emerald-400',
  info:    'bg-blue-400',
  user:    'bg-brand-500',
  error:   'bg-red-400',
};

function ToastItem({ toast, onDismiss }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="relative flex items-start gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-lg shadow-slate-200/60 overflow-hidden w-80"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${TOAST_COLORS[toast.type]}`}>
        {TOAST_ICONS[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-snug">{toast.title}</p>
        {toast.sub && <p className="text-xs text-slate-400 mt-0.5 font-mono">{toast.sub}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="w-5 h-5 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0 mt-0.5"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-[2px] ${TOAST_BAR[toast.type]}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 3.5, ease: 'linear' }}
      />
    </motion.div>
  );
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-6 left-6 z-50 flex flex-col gap-2 items-start">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

function App() {
  const [vendorBalance, setVendorBalance] = useState(0);
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [topUpModal, setTopUpModal] = useState({ isOpen: false, userId: null, amount: '' });
  const [paymentFlash, setPaymentFlash] = useState(false);
  const { toasts, addToast, dismiss } = useToasts();

  const triggerPaymentFlash = () => {
    setPaymentFlash(true);
    setTimeout(() => setPaymentFlash(false), 800);
  };

  const fetchVendorBalance = async () => {
    try {
      const res = await fetch(`${API_URL}/vendor-balance`);
      const data = await res.json();
      if (data.success) setVendorBalance(data.balance);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchVendorBalance();
    fetchUsers();

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('payment_received', (data) => {
      setVendorBalance(data.vendorBalance);
      setUsers(prev => prev.map(u =>
        u.fingerprintId === data.userId ? { ...u, balance: data.userBalance } : u
      ));
      triggerPaymentFlash();
      addToast({
        type: 'success',
        title: 'Payment received',
        sub: `User ${data.userId} paid ₹${data.amount}`,
      });
    });

    newSocket.on('funds_added', (data) => {
      setUsers(prev => prev.map(u =>
        u.fingerprintId === data.userId ? { ...u, balance: data.userBalance } : u
      ));
      addToast({
        type: 'info',
        title: 'Funds added',
        sub: `User ${data.userId} topped up ₹${data.amount}`,
      });
    });

    newSocket.on('user_created', () => {
      fetchUsers();
      addToast({ type: 'user', title: 'New user registered', sub: 'Fingerprint enrolled' });
    });

    return () => newSocket.close();
  }, []);

  const handleTopUp = async (e) => {
    e.preventDefault();
    if (!topUpModal.amount || isNaN(topUpModal.amount)) return;
    try {
      const res = await fetch(`${API_URL}/add-funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: topUpModal.userId, amount: Number(topUpModal.amount) }),
      });
      const data = await res.json();
      if (data.success) {
        setTopUpModal({ isOpen: false, userId: null, amount: '' });
      } else {
        addToast({ type: 'error', title: 'Failed', sub: data.message });
      }
    } catch {
      addToast({ type: 'error', title: 'Network error', sub: 'Could not add funds' });
    }
  };

  // Staggered container variants
  const sidebarVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
  };

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex overflow-hidden selection:bg-brand-500/30">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Main Vendor Display */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_55%)] pointer-events-none" />

        {/* Payment flash ring */}
        <AnimatePresence>
          {paymentFlash && (
            <motion.div
              key="flash"
              initial={{ opacity: 0.6, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="absolute w-72 h-72 rounded-full border-2 border-emerald-400 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.1 }}
          className="flex items-center justify-center"
        >
          <AnimatedNumber value={vendorBalance} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-slate-400 text-sm mt-4 font-medium tracking-wide uppercase"
        >
          Vendor Balance
        </motion.p>
      </main>

      {/* Users Sidebar */}
      <motion.aside
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 26, delay: 0.15 }}
        className="w-[400px] border-l border-slate-200 bg-white/80 backdrop-blur-xl flex flex-col h-full relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="p-6 border-b border-slate-200 bg-slate-50/80"
        >
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <Users className="w-5 h-5 text-brand-500" />
            Registered Users
          </h2>
          <p className="text-slate-500 text-sm mt-1">Live hardware participants</p>
        </motion.div>

        <motion.div
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
        >
          <AnimatePresence mode="popLayout">
            {users.map(user => (
              <motion.div
                layout
                key={user.fingerprintId}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95, x: 20, transition: { duration: 0.2 } }}
                className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center"
                    >
                      <Fingerprint className="w-5 h-5 text-brand-500" />
                    </motion.div>
                    <div>
                      <p className="font-bold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400 font-mono">ID: {user.fingerprintId}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Balance</p>
                    <p className="font-mono text-lg font-bold text-emerald-600">₹{user.balance}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTopUpModal({ isOpen: true, userId: user.fingerprintId, amount: '' })}
                    className="p-2 rounded-lg bg-white hover:bg-brand-500 hover:text-white transition-all text-slate-400 shadow-sm border border-slate-200"
                    title="Top up balance"
                  >
                    <Plus className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}

            {users.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-zinc-500 py-10"
              >
                <Fingerprint className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No users registered yet.</p>
                <p className="text-sm mt-1">Scan fingerprint to begin.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.aside>

      {/* Top Up Modal */}
      <AnimatePresence>
        {topUpModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="bg-white border border-slate-200 rounded-3xl p-8 w-[400px] shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-1 text-slate-800">Top Up Account</h3>
              <p className="text-slate-500 text-sm mb-6">User ID: {topUpModal.userId}</p>

              <form onSubmit={handleTopUp}>
                <div className="relative mb-8">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IndianRupee className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    autoFocus
                    value={topUpModal.amount}
                    onChange={(e) => setTopUpModal({ ...topUpModal, amount: e.target.value })}
                    className="block w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-0 focus:border-brand-500 font-mono text-xl font-bold transition-colors"
                    placeholder="Amount"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setTopUpModal({ isOpen: false, userId: null, amount: '' })}
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-white transition-colors shadow-lg shadow-brand-500/30"
                  >
                    Add Funds
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;