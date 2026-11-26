'use client';

import React, { useState, useEffect } from 'react';
import { Order, Transaction, Complaint, User, Advertisement } from '../types';
import { apiRequest } from '../lib/api';
import {
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  Bike,
  Package,
  Receipt,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  SlidersHorizontal,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const [activeAdminTab, setActiveAdminTab] = useState<'metrics' | 'orders' | 'priceAlerts' | 'ledger' | 'partners' | 'complaints' | 'ads'>('metrics');
  const [overview, setOverview] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New Ad form state
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdDesc, setNewAdDesc] = useState('');
  const [newAdImage, setNewAdImage] = useState('');
  const [newAdLink, setNewAdLink] = useState('');
  const [newAdBadge, setNewAdBadge] = useState('');
  const [newAdCategory, setNewAdCategory] = useState<'FURNITURE' | 'HOUSEHOLD' | 'LOCAL_SHOP' | 'PROMOTION'>('LOCAL_SHOP');
  const [newAdType, setNewAdType] = useState<'BANNER' | 'COMPACT'>('BANNER');
  const [isCreatingAd, setIsCreatingAd] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [ovRes, ordRes, alertRes, ledgRes, partRes, compRes, adsRes] = await Promise.all([
        apiRequest('/admin/overview').catch(() => null),
        apiRequest('/orders').catch(() => ({ orders: [] })),
        apiRequest('/admin/price-alerts').catch(() => ({ alerts: [] })),
        apiRequest('/admin/financial-ledger').catch(() => null),
        apiRequest('/admin/partners').catch(() => ({ partners: [] })),
        apiRequest('/admin/complaints').catch(() => ({ complaints: [] })),
        apiRequest('/advertisements?all=true').catch(() => ({ advertisements: [] })),
      ]);

      if (ovRes) setOverview(ovRes);
      setOrders(ordRes.orders || []);
      setPriceAlerts(alertRes.alerts || []);
      if (ledgRes) setLedger(ledgRes);
      setPartners(partRes.partners || []);
      setComplaints(compRes.complaints || []);
      setAdvertisements(adsRes.advertisements || []);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle || !newAdDesc) return;
    setIsCreatingAd(true);
    try {
      await apiRequest('/advertisements', {
        method: 'POST',
        body: JSON.stringify({
          title: newAdTitle,
          description: newAdDesc,
          imageUrl: newAdImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
          linkUrl: newAdLink || '#',
          badge: newAdBadge || '⭐ Local Promotion',
          category: newAdCategory,
          type: newAdType,
        }),
      });
      setNewAdTitle('');
      setNewAdDesc('');
      setNewAdImage('');
      setNewAdLink('');
      setNewAdBadge('');
      fetchAdminData();
    } catch (err) {
      console.error('Failed to create ad', err);
    } finally {
      setIsCreatingAd(false);
    }
  };

  const handleToggleAd = async (id: string) => {
    try {
      await apiRequest(`/advertisements/${id}/toggle`, {
        method: 'PATCH',
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      await apiRequest(`/advertisements/${id}`, {
        method: 'DELETE',
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResolvePriceAlert = async (orderId: string, dismiss: boolean) => {
    try {
      await apiRequest(`/admin/price-alerts/${orderId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({
          auditNotes: 'Verified with daily wholesale mandi rates sheet',
          dismissFlag: dismiss,
        }),
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePartnerVerification = async (partnerId: string) => {
    try {
      await apiRequest(`/admin/partners/${partnerId}/toggle-verification`, {
        method: 'PATCH',
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    try {
      await apiRequest(`/admin/complaints/${complaintId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'RESOLVED',
          resolutionNotes: 'Customer contacted and explained seasonal mandi rate variation. Settled.',
        }),
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 md:pb-8">
      {/* Admin Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">Platform Operations & Fraud Control</h2>
              <span className="bg-purple-400 text-purple-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                Admin
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-0.5">
              Live monitoring of dynamic pricing, partner commissions, and financial settlements
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="py-2 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex border-b border-[#E8E1D7] bg-white rounded-2xl px-3 pt-2 gap-2 overflow-x-auto shadow-sm">
        {[
          { id: 'metrics', label: 'Overview Metrics' },
          { id: 'priceAlerts', label: `Price Audits & Fraud (${priceAlerts.length})` },
          { id: 'orders', label: `All Orders (${orders.length})` },
          { id: 'ledger', label: 'Financial Ledger' },
          { id: 'partners', label: `Partners (${partners.length})` },
          { id: 'complaints', label: `Disputes (${complaints.length})` },
          { id: 'ads', label: `Advertisements (${advertisements.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminTab(tab.id as any)}
            className={`py-3 px-4 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
              activeAdminTab === tab.id
                ? 'border-purple-600 text-purple-900 bg-purple-50/50 rounded-t-xl'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: METRICS */}
      {activeAdminTab === 'metrics' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Gross Merchandise Value (GMV)
              </span>
              <span className="text-2xl font-black text-neutral-900 block mt-1">
                ₹{overview.metrics?.totalGMV}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">Total Platform Volume</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Platform Commission Earned
              </span>
              <span className="text-2xl font-black text-purple-700 block mt-1">
                ₹{overview.metrics?.totalCommissionEarned}
              </span>
              <span className="text-[10px] text-neutral-500">25% share of delivery fees</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Active Partners Online
              </span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">
                {overview.metrics?.activePartnersOnline} / {overview.metrics?.totalPartners}
              </span>
              <span className="text-[10px] text-neutral-500">Ready for dispatch</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Flagged Price Spikes
              </span>
              <span className="text-2xl font-black text-rose-600 block mt-1">
                {overview.metrics?.flaggedPriceAlertsCount} Alerts
              </span>
              <span className="text-[10px] text-rose-500 font-bold">Needs auditor review</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRICE AUDITS & FRAUD WATCH */}
      {activeAdminTab === 'priceAlerts' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-snug">
            🛡️ <strong>Dynamic Pricing Audit Module:</strong> The system automatically flags any order where the delivery partner inputs actual mandi prices that vary by more than 20% from estimated rates. Review partner purchase slips, shop receipts, and historical data.
          </div>

          {priceAlerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 bg-white rounded-3xl border border-neutral-200">
              No flagged price anomalies. All orders within normal market deviation limits.
            </div>
          ) : (
            <div className="space-y-4">
              {priceAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-5 rounded-3xl bg-white border-2 border-rose-200 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-neutral-900">
                          Order #{alert.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[10px] font-extrabold">
                          Price Spike Flagged
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        Customer: {alert.customer?.name} ({alert.customer?.phone}) · Rider: {alert.partner?.name}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-neutral-400 block font-semibold">Variance</span>
                      <span className="text-sm font-black text-rose-600">
                        ₹{alert.estimatedProductTotal} ➔ ₹{alert.actualProductTotal} (+{Math.round(((alert.actualProductTotal - alert.estimatedProductTotal) / (alert.estimatedProductTotal || 1)) * 100)}%)
                      </span>
                    </div>
                  </div>

                  {/* Partner Explanation Note */}
                  <div className="p-3 rounded-xl bg-neutral-50 border text-xs text-neutral-700">
                    <strong className="block text-neutral-900 mb-0.5">Partner Reported Reason:</strong>
                    "{alert.priceChangeReason || 'Market rates updated'}"
                  </div>

                  {/* Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {alert.items.map((it) => (
                      <div key={it.id} className="p-2.5 rounded-xl bg-neutral-50 border flex justify-between">
                        <div>
                          <span className="font-bold text-neutral-900 block">{it.name}</span>
                          <span className="text-[10px] text-neutral-500">{it.quantity} {it.unit}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-400 block">Est: ₹{it.estimatedPrice}</span>
                          <span className="font-bold text-neutral-900">Act: ₹{it.actualPrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Purchase Slip Viewer */}
                  {alert.purchaseProofUrl && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                        <Receipt className="w-4 h-4 text-purple-600" />
                        <span>Mandi Purchase Slip Verified by Partner</span>
                      </div>
                      <button
                        onClick={() => setSelectedProofUrl(alert.purchaseProofUrl || null)}
                        className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Bill Photo
                      </button>
                    </div>
                  )}

                  {/* Resolution Controls */}
                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleResolvePriceAlert(alert.id, true)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Approve Price Variance (Dismiss Flag)
                    </button>
                    <button
                      onClick={() => handleResolvePriceAlert(alert.id, false)}
                      className="py-2 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs"
                    >
                      Keep Flagged for Investigation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALL ORDERS STREAM */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-4">
          <div className="border border-[#E8E1D7] rounded-3xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#E8E1D7] text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Order #</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Partner</th>
                    <th className="p-3.5">Service</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Product Cost</th>
                    <th className="p-3.5">Delivery Fee</th>
                    <th className="p-3.5">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-neutral-900">{ord.orderNumber}</td>
                      <td className="p-3.5 font-medium">{ord.customer?.name}</td>
                      <td className="p-3.5 font-medium">{ord.partner?.name || 'Unassigned'}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-semibold">
                          {ord.serviceType}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 text-[10px] font-extrabold uppercase">
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3.5">₹{ord.actualProductTotal}</td>
                      <td className="p-3.5">₹{ord.deliveryFee}</td>
                      <td className="p-3.5 font-bold text-neutral-900">₹{ord.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL LEDGER */}
      {activeAdminTab === 'ledger' && ledger && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D7]">
              <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                Platform Commissions
              </span>
              <span className="text-xl font-black text-purple-700 block mt-1">
                ₹{ledger.summary?.platformCommissions}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D7]">
              <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                Partner Earnings Disbursed
              </span>
              <span className="text-xl font-black text-emerald-700 block mt-1">
                ₹{ledger.summary?.partnerEarnings}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D7]">
              <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                Product Cost Reimbursements
              </span>
              <span className="text-xl font-black text-neutral-800 block mt-1">
                ₹{ledger.summary?.productReimbursements}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E8E1D7]">
              <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                COD Collections
              </span>
              <span className="text-xl font-black text-amber-700 block mt-1">
                ₹{ledger.summary?.codCollections}
              </span>
            </div>
          </div>

          <div className="border border-[#E8E1D7] rounded-3xl overflow-hidden bg-white shadow-sm">
            <div className="p-3.5 bg-[#FAF7F2] border-b text-xs font-bold text-neutral-800">
              Audit Transaction Stream
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Beneficiary</th>
                    <th className="p-3">Reference / Order</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {ledger.transactions?.map((t: Transaction) => (
                    <tr key={t.id} className="hover:bg-neutral-50">
                      <td className="p-3 text-neutral-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-bold text-neutral-900">{t.type}</td>
                      <td className="p-3 font-extrabold text-brand-700">₹{t.amount}</td>
                      <td className="p-3">{t.user?.name || 'Platform'}</td>
                      <td className="p-3 text-neutral-500">{t.order?.orderNumber || t.referenceId || '-'}</td>
                      <td className="p-3 text-neutral-500">{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PARTNER KYC & MANAGEMENT */}
      {activeAdminTab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p) => (
            <div key={p.id} className="p-5 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">{p.name}</h4>
                  <p className="text-xs text-neutral-500">{p.phone} · {p.email}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    p.isVerified ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {p.isVerified ? 'KYC Verified' : 'Pending Verification'}
                </span>
              </div>

              <div className="text-xs text-neutral-600 space-y-1">
                <div>Vehicle: <strong className="text-neutral-800">{p.vehicleType}</strong></div>
                <div>Rating: <strong className="text-emerald-700">★ {p.rating}</strong> ({p.totalRatings} ratings)</div>
                <div>Wallet Balance: <strong className="text-neutral-800">₹{p.walletBalance}</strong></div>
                <div>Status: <span className={p.isAvailable ? 'text-emerald-600 font-bold' : 'text-neutral-400'}>{p.isAvailable ? 'Online' : 'Offline'}</span></div>
              </div>

              <button
                onClick={() => handleTogglePartnerVerification(p.id)}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                  p.isVerified
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {p.isVerified ? 'Revoke KYC Approval' : 'Approve KYC & Onboard'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 6: COMPLAINTS & DISPUTES */}
      {activeAdminTab === 'complaints' && (
        <div className="space-y-4">
          {complaints.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 bg-white rounded-3xl border border-neutral-200">
              No customer complaints filed.
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div key={c.id} className="p-5 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">{c.subject}</h4>
                      <p className="text-xs text-neutral-500">
                        Complainant: {c.complainant?.name} ({c.complainant?.phone}) · Order #{c.order?.orderNumber}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        c.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 bg-neutral-50 p-3 rounded-xl border">
                    "{c.description}"
                  </p>

                  {c.resolutionNotes && (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <strong>Resolution:</strong> {c.resolutionNotes}
                    </p>
                  )}

                  {c.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolveComplaint(c.id)}
                      className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
                    >
                      Mark Resolved & Close Dispute
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: ADVERTISEMENTS MANAGEMENT */}
      {activeAdminTab === 'ads' && (
        <div className="space-y-6">
          {/* Create New Advertisement Form */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-neutral-900">
                  Create Local Marketplace Advertisement
                </h3>
                <p className="text-xs text-neutral-500">
                  Promote local shops, furniture offers, and household utility services on the Hybrid AI Order page.
                </p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                Dynamic Ads
              </span>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block mb-1">Ad Title</label>
                  <input
                    type="text"
                    value={newAdTitle}
                    onChange={(e) => setNewAdTitle(e.target.value)}
                    placeholder="e.g. Royal Heritage Teak Wood Furniture"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block mb-1">Promotional Badge Tag</label>
                  <input
                    type="text"
                    value={newAdBadge}
                    onChange={(e) => setNewAdBadge(e.target.value)}
                    placeholder="e.g. 🛋️ Festive Furniture Offer"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block mb-1">Category</label>
                  <select
                    value={newAdCategory}
                    onChange={(e: any) => setNewAdCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-purple-600 bg-white"
                  >
                    <option value="FURNITURE">FURNITURE</option>
                    <option value="HOUSEHOLD">HOUSEHOLD</option>
                    <option value="LOCAL_SHOP">LOCAL_SHOP</option>
                    <option value="PROMOTION">PROMOTION</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block mb-1">Placement Type</label>
                  <select
                    value={newAdType}
                    onChange={(e: any) => setNewAdType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-purple-600 bg-white"
                  >
                    <option value="BANNER">BANNER (Promotional Banner Below Input)</option>
                    <option value="COMPACT">COMPACT (4-Corner Compact Placement)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-neutral-600 block mb-1">Short Description</label>
                  <input
                    type="text"
                    value={newAdDesc}
                    onChange={(e) => setNewAdDesc(e.target.value)}
                    placeholder="e.g. Flat 35% Off on handmade wooden dining sets, coffee tables, and study desks."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newAdImage}
                    onChange={(e) => setNewAdImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block mb-1">Clickable Action Link</label>
                  <input
                    type="text"
                    value={newAdLink}
                    onChange={(e) => setNewAdLink(e.target.value)}
                    placeholder="https://example.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isCreatingAd}
                  className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingAd ? 'Publishing...' : 'Publish Advertisement'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Advertisements List */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">
              Live Advertisements ({advertisements.length})
            </h4>

            {advertisements.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 bg-white rounded-3xl border">
                No advertisements created yet. Use the form above to publish local promotions.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advertisements.map((ad) => (
                  <div
                    key={ad.id}
                    className="p-4 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="flex gap-3">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="w-20 h-20 rounded-2xl object-cover border border-neutral-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-800">
                            {ad.type}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-bold">
                            {ad.category}
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-neutral-900 mt-1 truncate">
                          {ad.title}
                        </h5>
                        <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">
                          {ad.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                      <button
                        onClick={() => handleToggleAd(ad.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-colors ${
                          ad.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        }`}
                      >
                        {ad.isActive ? '● Active' : '○ Inactive'}
                      </button>

                      <div className="flex items-center gap-2">
                        {ad.linkUrl && (
                          <a
                            href={ad.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-neutral-400 hover:text-neutral-700"
                            title="Visit Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                          title="Delete Ad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bill Photo Preview Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-4 overflow-hidden space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-xs font-bold text-neutral-800">Mandi Slip / Vendor Receipt</span>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-900"
              >
                Close
              </button>
            </div>
            <img src={selectedProofUrl} alt="Proof" className="w-full rounded-2xl object-cover max-h-96" />
          </div>
        </div>
      )}
    </div>
  );
};
