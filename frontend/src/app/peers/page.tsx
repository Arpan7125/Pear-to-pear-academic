'use client';

import { useEffect, useState } from 'react';
import * as api from '@/lib/api';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import StatCard from '@/components/StatCard';
import { motion } from 'framer-motion';
import { Radio, Users, Wifi, ArrowUpDown } from 'lucide-react';

interface Peer {
  id: string;
  user_id: string;
  username: string;
  status: string;
  reputation: number;
  classification: string;
  shared_resources: number;
  ip_address: string;
}

const statusColor: Record<string, string> = {
  online: 'var(--accent)',
  offline: 'var(--text-tertiary)',
  connecting: 'var(--warning)',
  transferring: '#118ab2',
};

export default function PeersPage() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPeers().then(setPeers).catch(console.error).finally(() => setLoading(false));
  }, []);

  const online = peers.filter(p => p.status === 'online').length;
  const transferring = peers.filter(p => p.status === 'transferring').length;

  if (loading) return <div className="space-y-6"><LoadingSkeleton type="stat" count={3} /><LoadingSkeleton type="card" count={5} /></div>;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 mb-1">
          <Radio size={18} style={{ color: 'var(--accent)' }} />
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Peers</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active nodes in the P2P network</p>
      </motion.div>

      {/* Mini stats */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
        <StatCard title="Total Peers" value={peers.length} icon={<Users size={20} strokeWidth={1.8} />} accent="var(--accent)" />
        <StatCard title="Online Now" value={online} icon={<Wifi size={20} strokeWidth={1.8} />} accent="var(--accent)" />
        <StatCard title="Transferring" value={transferring} icon={<ArrowUpDown size={20} strokeWidth={1.8} />} accent="#118ab2" />
      </motion.div>

      {/* Visual network map */}
      <motion.div
        className="card relative overflow-hidden"
        style={{ minHeight: '260px' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Radio size={14} style={{ color: 'var(--violet)' }} />
          Network Topology
        </h3>
        <div className="flex flex-wrap gap-4 justify-center py-4">
          {peers.map((p, i) => (
            <motion.div
              key={p.id}
              className="peer-node"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.1, y: -4 }}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                     style={{ background: `color-mix(in srgb, ${statusColor[p.status] || statusColor.offline} 18%, transparent)`, color: statusColor[p.status] || statusColor.offline }}>
                  {p.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="status-dot absolute -bottom-0.5 -right-0.5" style={{ background: statusColor[p.status] || statusColor.offline, boxShadow: `0 0 8px ${statusColor[p.status] || statusColor.offline}` }} />
              </div>
              <p className="text-[.7rem] mt-1.5 text-center truncate max-w-[80px]" style={{ color: 'var(--text-secondary)' }}>{p.username}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Peers table */}
      <motion.div
        className="card overflow-x-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium pb-3" style={{ color: 'var(--text-tertiary)' }}>Peer</th>
              <th className="text-left text-xs font-medium pb-3" style={{ color: 'var(--text-tertiary)' }}>Status</th>
              <th className="text-left text-xs font-medium pb-3" style={{ color: 'var(--text-tertiary)' }}>Classification</th>
              <th className="text-right text-xs font-medium pb-3" style={{ color: 'var(--text-tertiary)' }}>Reputation</th>
              <th className="text-right text-xs font-medium pb-3" style={{ color: 'var(--text-tertiary)' }}>Shared</th>
              <th className="text-right text-xs font-medium pb-3" style={{ color: 'var(--text-tertiary)' }}>Address</th>
            </tr>
          </thead>
          <tbody>
            {peers.map((p, i) => (
              <motion.tr
                key={p.id}
                className="border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
              >
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[.68rem] font-bold"
                         style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.username}</span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor[p.status] || statusColor.offline, boxShadow: `0 0 6px ${statusColor[p.status] || 'transparent'}` }} />
                    <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{p.status}</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[.68rem] font-semibold ${
                    p.classification === 'Contributor' ? 'badge-contributor' :
                    p.classification === 'Leecher' ? 'badge-leecher' : 'badge-neutral'
                  }`}>{p.classification}</span>
                </td>
                <td className="py-3 text-right font-mono text-sm" style={{ color: 'var(--accent)' }}>{p.reputation}</td>
                <td className="py-3 text-right text-sm" style={{ color: 'var(--text-secondary)' }}>{p.shared_resources}</td>
                <td className="py-3 text-right font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{p.ip_address}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
