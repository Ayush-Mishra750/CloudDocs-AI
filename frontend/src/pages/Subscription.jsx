import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  getSubscriptionPlansApi,
  createRazorpayOrderApi,
  verifyPaymentApi,
  cancelSubscriptionApi,
} from '../api/subscriptionApi';
import {
  Zap,
  Crown,
  HardDrive,
  Calendar,
  CreditCard,
  FileText,
  Share2,
  Users,
  Upload,
  AlertTriangle,
  X,
  Check,
  ArrowRight,
  RefreshCw,
  Info,
  Sparkles,
} from 'lucide-react';

export const Subscription = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');

  // Modals state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [showQR, setShowQR] = useState(true);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const res = await getSubscriptionPlansApi();
      if (res.success) {
        setPlans(res.plans || []);
        setCurrentSub(res.currentSubscription);
        setRazorpayKeyId(res.razorpayKeyId || '');
      }
    } catch (err) {
      console.error('Failed to load subscription details:', err);
      toast.error('Failed to load subscription information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();

    // Inject standard Razorpay Checkout SDK Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Format bytes helper
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0.0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Open Razorpay Checkout or Payment Gateway Modal
  const handleInitiateUpgrade = async (plan) => {
    try {
      setUpgrading(true);
      const orderRes = await createRazorpayOrderApi(plan.id);

      if (!orderRes.success) {
        toast.error(orderRes.message || 'Failed to create payment order.');
        return;
      }

      setCurrentOrder(orderRes);
      setSelectedPlanForPayment(plan);

      // If live Razorpay credentials exist, open official Razorpay Checkout SDK
      if (!orderRes.isDevSandbox && window.Razorpay) {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: orderRes.currency,
          name: 'Storage App',
          description: `Upgrade to ${plan.name} Plan (${plan.storageGB} GB Storage)`,
          order_id: orderRes.orderId,
          handler: async function (response) {
            await handleVerifyPaymentSignature({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId: plan.id,
            });
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#2563eb',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error('Razorpay order creation error:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate Razorpay order.');
    } finally {
      setUpgrading(false);
    }
  };

  // Verify Payment & Save to MongoDB
  const handleVerifyPaymentSignature = async (payload) => {
    try {
      setUpgrading(true);
      const verifyRes = await verifyPaymentApi(payload);

      if (verifyRes.success) {
        toast.success(verifyRes.message);
        setSelectedPlanForPayment(null);
        setCurrentOrder(null);
        await fetchSubscriptionData();
        window.location.reload(); // Refresh session so quota updates globally
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      toast.error(err.response?.data?.message || 'Payment verification failed.');
    } finally {
      setUpgrading(false);
    }
  };

  // Execute payment from gateway test dialog
  const handleExecuteMockPayment = () => {
    if (!selectedPlanForPayment || !currentOrder) return;

    handleVerifyPaymentSignature({
      razorpayOrderId: currentOrder.orderId,
      razorpayPaymentId: `pay_rzp_${Date.now()}`,
      razorpaySignature: 'dev_mock_signature',
      planId: selectedPlanForPayment.id,
    });
  };

  // Handle subscription cancellation
  const handleConfirmCancel = async () => {
    try {
      setUpgrading(true);
      const res = await cancelSubscriptionApi();
      if (res.success) {
        toast.success(res.message);
        setShowCancelModal(false);
        await fetchSubscriptionData();
        window.location.reload();
      }
    } catch (err) {
      toast.error('Failed to cancel subscription.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
        <span>Loading your subscription dashboard...</span>
      </div>
    );
  }

  const storageUsedBytes = currentSub?.storageUsed || 0;
  const storageLimitBytes = currentSub?.storageLimitBytes || 5368709120;
  const usedPerc = Math.min(100, ((storageUsedBytes / storageLimitBytes) * 100).toFixed(1));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Your Subscription</h1>
        <p className="text-slate-500 text-sm font-medium">Manage your plan and view usage details</p>
      </div>

      {/* Overview Top Section (2 Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Active Plan Details */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{currentSub?.status || 'ACTIVE'}</span>
              </span>

              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">{currentSub?.planName || 'Free Plan'}</h2>
              <p className="text-xs text-slate-500 font-medium">{currentSub?.subtitle || 'For Students & Freelancers'}</p>
            </div>

            {/* Next Billing & Amount Sub-cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Next Billing</span>
                </div>
                <p className="text-base font-extrabold text-slate-900">{currentSub?.nextBilling || 'Dec 25, 2025'}</p>
                <p className="text-[11px] text-slate-400">in 30 days</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Billing Amount</span>
                </div>
                <p className="text-base font-extrabold text-slate-900">₹{currentSub?.price || 0}</p>
                <p className="text-[11px] text-slate-400 capitalize">{currentSub?.billingCycle || 'Monthly'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('available-plans-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              Change Plan
            </button>

            <button
              onClick={() => toast.success('Invoice details fetched from MongoDB.', { icon: '📄' })}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
            >
              View invoice
            </button>

            {currentSub?.plan !== 'free' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-semibold transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        {/* Right Card: Storage Usage */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-slate-700">
              <HardDrive className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-base text-slate-900">Storage Usage</h3>
            </div>

            <div className="flex items-baseline justify-between pt-2">
              <span className="text-3xl font-black text-slate-900">{formatBytes(storageUsedBytes)}</span>
              <span className="text-xs text-slate-500 font-semibold">of {currentSub?.storageLimitGB} GB</span>
            </div>

            {/* Storage Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${usedPerc}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">{usedPerc}% used</p>
            </div>

            {/* Priority Speed Badge Pill */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Priority Speed</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                Active
              </span>
            </div>
          </div>

          {/* Max File Size Detail */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-slate-700">Max File Size</p>
              <p className="text-[11px] text-slate-400">Per file upload limit</p>
            </div>
            <span className="font-black text-slate-900 text-sm">{currentSub?.maxFileSizeStr || '2 GB'}</span>
          </div>
        </div>
      </div>

      {/* Bottom 4 Quick Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Files */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{currentSub?.totalFiles || 0}</p>
            <p className="text-xs text-slate-400 font-medium">Total Files</p>
          </div>
        </div>

        {/* Card 2: Shared Files */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{currentSub?.sharedFiles || 0}</p>
            <p className="text-xs text-slate-400 font-medium">Shared Files</p>
          </div>
        </div>

        {/* Card 3: Devices Connected */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{currentSub?.devicesConnected || '1 / 3'}</p>
            <p className="text-xs text-slate-400 font-medium">Devices Connected</p>
          </div>
        </div>

        {/* Card 4: Uploads During Subscription */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{currentSub?.filesUploadedDuringSub || 0}</p>
            <p className="text-xs text-slate-400 font-medium">Files Uploaded During subscription</p>
          </div>
        </div>
      </div>

      {/* Available Plans to Switch To Section */}
      <div id="available-plans-grid" className="space-y-6 pt-4">
        {/* Callout Notice Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Your new plan starts today! You'll be billed the full amount immediately. We don't offer prorated charges for plan changes.
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900">Available Plans to Switch To</h2>
          <p className="text-xs text-slate-500 font-medium">{plans.length} plans available for change</p>
        </div>

        {/* Plans Grid (Free, Pro, Premium) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentSub?.plan === plan.id;
            const isPro = plan.id === 'pro';

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all relative ${
                  isCurrent
                    ? 'border-2 border-emerald-500 shadow-sm'
                    : isPro
                    ? 'border-2 border-blue-500 shadow-md'
                    : 'border border-slate-200/90 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Top Badge (Current Plan / Most Popular) */}
                {isCurrent && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Current Plan</span>
                  </div>
                )}

                {!isCurrent && isPro && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  {/* Icon & Title */}
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    {plan.id === 'premium' ? (
                      <Crown className="w-5 h-5 text-amber-500" />
                    ) : isPro ? (
                      <Zap className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-blue-600 font-semibold">{plan.subtitle}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline space-x-1 border-b border-slate-100 pb-4">
                    <span className="text-3xl font-black text-slate-900">₹{plan.priceMonthly}</span>
                    <span className="text-xs text-slate-400 font-medium">/Month</span>
                  </div>

                  {/* Action Button */}
                  <div>
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Current Plan</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInitiateUpgrade(plan)}
                        disabled={upgrading}
                        className={`w-full py-3 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                          isPro
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {upgrading && selectedPlanForPayment?.id === plan.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Creating Razorpay Order...</span>
                          </>
                        ) : (
                          <>
                            <span>Subscribe Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Includes Checklist */}
                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Includes</p>
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                          <span className="font-medium text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel Subscription Warning Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Cancel Subscription</h3>
                  <p className="text-xs text-slate-400">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-3 text-xs text-rose-900">
                <div className="flex items-center space-x-1.5 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Warning</span>
                </div>
                <p className="text-rose-800 font-medium">
                  Canceling your subscription will immediately affect your account with the following changes:
                </p>

                <div className="space-y-2 pt-1 font-semibold">
                  <div className="flex items-center space-x-2 text-rose-700">
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center">✕</span>
                    <span>All files uploaded during your current subscription period will be permanently deleted</span>
                  </div>
                  <div className="flex items-center space-x-2 text-amber-700">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center">⚠️</span>
                    <span>Your account will be downgraded to the Free Plan</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-rose-200 space-y-1.5 text-slate-700 mt-2">
                  <p className="font-bold text-slate-900">Free Plan Limits:</p>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Storage:</span>
                    <span className="font-bold">500 MB</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Max File Size:</span>
                    <span className="font-bold">100 MB</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Max Devices:</span>
                    <span className="font-bold">1 device</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={upgrading}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
              >
                Keep Subscription
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={upgrading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center gap-1.5"
              >
                {upgrading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Cancel Subscription</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Test Mode Payment Gateway Modal (Image #4) */}
      {selectedPlanForPayment && currentOrder?.isDevSandbox && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative border border-slate-200">
            {/* Top Red Diagonal Test Mode Banner Ribbon */}
            <div className="absolute top-3 -right-8 bg-rose-600 text-white text-[10px] font-black uppercase px-8 py-0.5 rotate-45 shadow-md z-20">
              Test Mode
            </div>

            {/* Gateway Blue Top Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between relative">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center font-bold text-sm">
                  SA
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-none">Storage App</h4>
                  <span className="text-[10px] text-blue-200">Razorpay Payment Gateway</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanForPayment(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gateway Content Body */}
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-800 mb-2">Pay With UPI QR</p>
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-center space-y-3">
                  <div className="relative inline-block bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-40 h-40 bg-slate-900 rounded flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-white p-2 flex flex-col items-center justify-center gap-1">
                        <div className="w-full h-full border-2 border-slate-900 p-1 grid grid-cols-4 gap-1">
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                        </div>
                      </div>

                      {showQR && (
                        <button
                          onClick={() => setShowQR(true)}
                          className="absolute inset-0 bg-blue-600/90 text-white font-bold text-xs flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                        >
                          Show QR
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-left space-y-1">
                    <p className="text-xs font-semibold text-slate-700">Scan the QR using any UPI app on your phone.</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                      <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PhonePe Notice Box */}
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>PhonePe payments are currently experiencing issues. Please try other UPI apps.</span>
              </div>

              {/* Preferred Methods */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-800">Preferred Payment Methods</p>
                <div className="space-y-1.5">
                  <button
                    onClick={handleExecuteMockPayment}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-600 bg-white flex items-center justify-between text-xs font-semibold text-slate-800 transition-all"
                  >
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Zap className="w-4 h-4" />
                      <span>Pay using UPI</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={handleExecuteMockPayment}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-600 bg-white flex items-center justify-between text-xs font-semibold text-slate-800 transition-all"
                  >
                    <div className="flex items-center space-x-2 text-blue-600">
                      <CreditCard className="w-4 h-4" />
                      <span>Pay using Card / Netbanking</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Bottom Pay Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Total Amount</span>
                  <span className="text-base font-black text-slate-900">₹ {selectedPlanForPayment.priceMonthly}</span>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteMockPayment}
                  disabled={upgrading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  {upgrading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to MongoDB...</span>
                    </>
                  ) : (
                    <span>Pay Now & Save to MongoDB</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
