import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, CheckCircle2, AlertCircle, Clock, Zap, ShieldCheck, Globe, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, any> = {
  Zap,
  Globe,
  Activity,
  Wifi,
  ShieldCheck,
  Clock
};

export default function StatusPage() {
  const [services, setServices] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const [svcRes, incRes] = await Promise.all([
        supabase.from('system_services').select('*').order('priority', { ascending: false }),
        supabase.from('system_incidents').select('*').order('incident_date', { ascending: false }).limit(5)
      ]);

      if (svcRes.error) throw svcRes.error;
      if (incRes.error) throw incRes.error;

      setServices(svcRes.data || []);
      setIncidents(incRes.data || []);
    } catch (err) {
      console.error('Error fetching health data:', err);
    } finally {
      setLoading(false);
    }
  };

  const coreSystems = services.filter(s => s.type === 'core' || s.type === 'gateway');
  const regionalNodes = [
    { id: "us-east", name: "USA East (NY)", status: "Operational", load: "24%", flag: "🇺🇸" },
    { id: "us-west", name: "USA West (CA)", status: "Operational", load: "18%", flag: "🇺🇸" },
    { id: "eu-central", name: "Europe (Frankfurt)", status: "Operational", load: "31%", flag: "🇪🇺" },
    { id: "asia-east", name: "Asia (Singapore)", status: "Operational", load: "42%", flag: "🇸🇬" },
  ];

  const overallStatus = services.every(s => s.status === 'Operational') ? 'All Systems Operational' : 'Partial System Issues';
  const overallColor = services.every(s => s.status === 'Operational') ? 'text-green-500' : 'text-amber-500';

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Status Section */}
      <div className="relative rounded-[2.5rem] bg-card border border-border p-10 lg:p-14 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-green-500/[0.03] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-14">
          <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center animate-pulse">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <div className="text-center md:text-left">
            <h1 className={`text-3xl lg:text-5xl font-black ${overallColor} tracking-tight mb-3`}>{overallStatus}</h1>
            <p className="text-muted-foreground font-semibold text-lg flex items-center justify-center md:justify-start gap-2">
              Updated <span className="text-foreground">Just now</span> • Monitoring <span className="text-foreground">{services.length} core services</span>
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={fetchHealthData}
            disabled={loading}
            className="md:ml-auto h-14 px-10 rounded-xl font-black bg-secondary border border-border text-foreground hover:bg-secondary/80 transition-all"
          >
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-card border border-border rounded-[2rem] animate-pulse" />)
        ) : coreSystems.map((system, i) => {
          const Icon = iconMap[system.icon] || Activity;
          const statusColor = system.status === 'Operational' ? 'text-green-500' : 'text-amber-500';
          const bgClassName = system.status === 'Operational' ? 'bg-green-500/10' : 'bg-amber-500/10';

          return (
            <motion.div 
              key={system.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-8 rounded-[2rem] bg-card border border-border shadow-huge hover:border-primary/20 transition-all group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl ${bgClassName} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${statusColor}`} />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-sm tracking-tight">{system.name}</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>{system.status}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-lg border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Uptime</span>
                  <span className="text-xs font-black text-foreground font-mono">{system.uptime}</span>
                </div>
                <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-lg border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Latency</span>
                  <span className="text-xs font-black text-foreground font-mono">{system.latency}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Regional Nodes */}
      <div className="space-y-6">
         <div className="flex items-center gap-4 mb-2">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            <h2 className="text-2xl font-black text-foreground tracking-tight">Regional Node Clusters</h2>
         </div>
         <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regionalNodes.map((region) => (
              <div key={region.id} className="p-6 rounded-2xl bg-card border border-border flex items-center justify-between group hover:bg-secondary/20 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{region.flag}</span>
                  <div>
                    <h4 className="text-xs font-black text-foreground tracking-tight">{region.name}</h4>
                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Load: {region.load}</span>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-glow" />
              </div>
            ))}
         </div>
      </div>

      {/* Uptime History Chart Wrapper */}
      <div className="bg-card border border-border rounded-[2.5rem] p-10">
         <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">Infrastructure Pulse</h2>
              <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-widest">Global system performance across last 30 days</p>
            </div>
            <Activity className="w-8 h-8 text-primary opacity-20" />
         </div>
         <div className="flex gap-1 h-12">
            {Array.from({ length: 90 }).map((_, i) => {
              const height = 40 + Math.random() * 60;
              const isEvent = Math.random() > 0.96;
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-full transition-all duration-500 overflow-hidden relative group/bar`} 
                  style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                >
                   <div className={`absolute inset-0 ${isEvent ? 'bg-amber-400 opacity-60' : 'bg-green-500 opacity-20 group-hover/bar:opacity-50'}`} />
                   {isEvent && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-amber-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">Latency Spike</div>
                   )}
                </div>
              );
            })}
         </div>
         <div className="flex justify-between mt-4">
           <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">90 Days Ago</span>
           <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Today</span>
         </div>
      </div>

      {/* Incident History */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-foreground tracking-tight ml-4 flex items-center gap-3">
          <Clock className="w-6 h-6 text-primary" /> Incident History
        </h2>
        <div className="space-y-4">
           {loading ? (
             [1, 2].map(i => <div key={i} className="h-24 bg-card border border-border rounded-3xl animate-pulse" />)
           ) : incidents.map((incident, i) => (
             <motion.div 
              key={incident.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="p-8 rounded-3xl bg-card border border-border hover:bg-secondary/20 transition-all flex flex-col sm:flex-row gap-6 items-start"
             >
                <div className="w-24 shrink-0 text-[10px] font-black text-muted-foreground uppercase tracking-tighter pt-1 opacity-50">
                  {new Date(incident.incident_date).toLocaleDateString()}
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                     <h4 className="text-lg font-black text-foreground tracking-tight">{incident.title}</h4>
                     <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                       incident.status === 'Completed' || incident.status === 'Resolved' || incident.status === 'Operational' 
                         ? 'bg-green-500/10 text-green-500' 
                         : 'bg-blue-500/10 text-blue-500'
                     }`}>
                       {incident.status}
                     </span>
                   </div>
                   <p className="text-sm font-semibold text-muted-foreground leading-relaxed">{incident.description}</p>
                </div>
             </motion.div>
           ))}
        </div>
      </div>

      {/* Subscribe Section */}
      <div className="py-20 bg-[#D4AF37]/5 rounded-[2.5rem] border border-[#D4AF37]/20 relative overflow-hidden text-center px-6 mt-12">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#D4AF37]/[0.05] rounded-full blur-[80px]" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-black text-foreground mb-4">Stay informed on system updates</h2>
          <p className="text-muted-foreground font-semibold mb-8">Receive real-time email notifications regarding scheduled maintenance and system status changes.</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              className="flex-1 h-12 px-6 rounded-xl bg-background border border-border text-sm font-bold outline-none focus:border-[#D4AF37]/50"
              placeholder="Enter your email address..."
            />
            <Button className="h-12 px-8 rounded-xl font-black bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white shadow-glow">Subscribe</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
