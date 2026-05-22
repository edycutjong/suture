'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, type RefObject } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Activity,
  Cpu,
  Layers,
  Shield,
  Sparkles,
  Terminal,
  Wrench,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function LandingPage() {
  const [simulationStep, setSimulationStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const simulatorRef = useRef<HTMLElement>(null);
  const hasAutoStarted = useRef(false);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const startSimulation = () => {
    if (isSimulating) return;
    clearAllTimeouts();
    setIsSimulating(true);
    setSimulationStep(1);

    const t1 = setTimeout(() => setSimulationStep(2), 2000);
    const t2 = setTimeout(() => setSimulationStep(3), 4000);
    const t3 = setTimeout(() => setSimulationStep(4), 6000);
    const t4 = setTimeout(() => {
      setIsSimulating(false);
    }, 7500);

    timeoutsRef.current = [t1, t2, t3, t4];
  };

  const resetSimulation = () => {
    clearAllTimeouts();
    setSimulationStep(0);
    setIsSimulating(false);
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  useEffect(() => {
    const el = simulatorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAutoStarted.current) {
          hasAutoStarted.current = true;
          setIsSimulating(true);
          setSimulationStep(1);
          const t1 = setTimeout(() => setSimulationStep(2), 2000);
          const t2 = setTimeout(() => setSimulationStep(3), 4000);
          const t3 = setTimeout(() => setSimulationStep(4), 6000);
          const t4 = setTimeout(() => setIsSimulating(false), 7500);
          timeoutsRef.current = [t1, t2, t3, t4];
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#f1f5f9] overflow-x-hidden flex flex-col relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className="border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/icon.svg" alt="Suture Logo" className="w-8 h-8 transition-transform group-hover:scale-105" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-heading text-base leading-none tracking-widest text-[#f1f5f9]">SUTURE</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono leading-none">
                  v1.0.0
                </span>
              </div>
              <span className="text-[9px] text-slate-400 tracking-wider font-heading mt-1 opacity-80 group-hover:text-cyan-400 transition-colors">
                AUTONOMOUS PIPELINE HEALING
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/edycutjong/suture"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors hidden sm:block"
            >
              GitHub
            </a>
            <Link
              href="/pitch"
              className="text-xs text-slate-400 hover:text-purple-400 transition-colors hidden sm:block"
            >
              Pitch Deck
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-1.5 rounded-lg btn-cyber-outline-animated text-xs font-heading flex items-center gap-1.5"
            >
              Launch Console <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 text-xs mb-6 animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fivetran Partner Track · Google Cloud Rapid Agent 2026</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-heading tracking-tight max-w-4xl bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent leading-[1.15]">
          Your pipelines <span className="text-cyan-400 glow-text">heal themselves</span> before you wake up.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          An autonomous AI agent that intercepts Fivetran sync failures, reasons through schema drift using Gemini 3 Pro, patches mappings via Fivetran REST APIs, and restores system health in under 60 seconds.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3 rounded-xl btn-cyber-animated font-heading text-sm font-bold flex items-center justify-center gap-2 group"
          >
            Launch Command Center
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            onClick={() => {
              const el = document.getElementById('demo-simulator');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-900 border border-white/10 text-slate-300 font-heading text-sm hover:bg-slate-800 hover:text-white transition-all"
          >
            Watch Demo
          </button>
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────── */}
      <div className="border-y border-white/5 bg-slate-950/60 py-7 w-full relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-black font-heading text-cyan-400">&lt;60s</p>
            <p className="text-[11px] text-slate-500 mt-1.5 tracking-widest uppercase">Mean Time to Heal</p>
          </div>
          <div>
            <p className="text-3xl font-black font-heading text-white">7</p>
            <p className="text-[11px] text-slate-500 mt-1.5 tracking-widest uppercase">Fivetran API Methods</p>
          </div>
          <div>
            <p className="text-3xl font-black font-heading text-purple-400">94%</p>
            <p className="text-[11px] text-slate-500 mt-1.5 tracking-widest uppercase">AI Mapping Confidence</p>
          </div>
          <div>
            <p className="text-3xl font-black font-heading text-green-400">0</p>
            <p className="text-[11px] text-slate-500 mt-1.5 tracking-widest uppercase">Human Interventions</p>
          </div>
        </div>
      </div>

      {/* ── Key Features ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 w-full relative z-10">
        <div className="text-center mb-12">
          <h2 className="font-heading text-xs text-cyan-400 tracking-widest">
            ENGINEERING MATRIX
          </h2>
          <p className="text-2xl font-bold mt-2">Zero-Touch Pipeline Healing Architecture</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 flex flex-col h-full border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-xl hover:border-cyan-500/30 transition-all group">
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-fit mb-4 group-hover:bg-cyan-500/20 transition-all">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading text-white mb-2">Instant Detection</h3>
            <p className="text-sm text-slate-400 flex-1 leading-relaxed">
              Sub-second ingestion of Fivetran failure webhooks. The agent immediately triggers a diagnostics lifecycle.
            </p>
          </div>

          <div className="glass-card p-6 flex flex-col h-full border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-xl hover:border-purple-500/30 transition-all group">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit mb-4 group-hover:bg-purple-500/20 transition-all">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading text-white mb-2">Gemini 3 Reasoner</h3>
            <p className="text-sm text-slate-400 flex-1 leading-relaxed">
              Analyzes schema differences semantically. Translates renamed or modified columns with high confidence.
            </p>
          </div>

          <div className="glass-card p-6 flex flex-col h-full border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-xl hover:border-amber-500/30 transition-all group">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit mb-4 group-hover:bg-amber-500/20 transition-all">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading text-white mb-2">Auto-Patching</h3>
            <p className="text-sm text-slate-400 flex-1 leading-relaxed">
              Mutates source schema states autonomously via Fivetran REST APIs, bypassing human intervention or delays.
            </p>
          </div>

          <div className="glass-card p-6 flex flex-col h-full border border-white/5 bg-slate-900/40 backdrop-blur-md rounded-xl hover:border-green-500/30 transition-all group">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 w-fit mb-4 group-hover:bg-green-500/20 transition-all">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading text-white mb-2">Observability</h3>
            <p className="text-sm text-slate-400 flex-1 leading-relaxed">
              Full trace spans sent directly to Arize Phoenix. Track every agent action, prompts, and REST payloads in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* ── Interactive Simulator ──────────────────────────────── */}
      <section
        id="demo-simulator"
        ref={simulatorRef as RefObject<HTMLElement>}
        className="max-w-5xl mx-auto px-6 py-16 w-full relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="font-heading text-xs text-cyan-400 tracking-widest">
            SIMULATE HEALING LOOP
          </h2>
          <p className="text-2xl font-bold mt-2">Watch the AI Agent Self-Heal in Real Time</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 bg-[#0f1629]/90 backdrop-blur-xl relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Simulator Visualizer */}
          <div className="md:col-span-7 flex flex-col justify-between min-h-[360px] border border-white/5 bg-slate-950/60 rounded-xl p-6 relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="text-[10px] font-heading tracking-wider text-slate-400">
                  PIPELINE SIMULATOR
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400/80">connector_sf_001</span>
            </div>

            {/* Stepper Display */}
            <div className="my-8 flex flex-col justify-center items-center gap-6 relative">
              {simulationStep === 0 && (
                <div className="text-center animate-slide-up">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/40 text-green-400 flex items-center justify-center mx-auto mb-4 glow-healthy">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="font-heading text-sm text-white">Pipeline Healthy</p>
                  <p className="text-xs text-slate-400 mt-1">Fivetran Sync active & aligned</p>
                </div>
              )}

              {simulationStep === 1 && (
                <div className="text-center animate-slide-up">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-4 glow-broken">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <p className="font-heading text-sm text-red-400">Schema Drift Detected!</p>
                  <p className="text-xs text-slate-400 mt-1">Source column &apos;revenue&apos; renamed to &apos;annual_revenue&apos;</p>
                </div>
              )}

              {simulationStep === 2 && (
                <div className="text-center animate-slide-up">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto mb-4 animate-spin">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <p className="font-heading text-sm text-purple-400">Gemini Reasoning...</p>
                  <p className="text-xs text-slate-400 mt-1">Mapping &apos;annual_revenue&apos; (source) → &apos;revenue&apos; (target) | Confidence: 0.94</p>
                </div>
              )}

              {simulationStep === 3 && (
                <div className="text-center animate-slide-up">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Wrench className="w-8 h-8" />
                  </div>
                  <p className="font-heading text-sm text-amber-400">Applying API Patch</p>
                  <p className="text-xs text-slate-400 mt-1">Sending PATCH request to Fivetran Schema mutation endpoint</p>
                </div>
              )}

              {simulationStep === 4 && (
                <div className="text-center animate-slide-up">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/40 text-green-400 flex items-center justify-center mx-auto mb-4 glow-healthy">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="font-heading text-sm text-green-400">Pipeline Restored!</p>
                  <p className="text-xs text-slate-400 mt-1">Fivetran Sync succeeded in 840ms. Status: healthy</p>
                </div>
              )}
            </div>

            {/* Step Progress */}
            <div className="flex gap-2 justify-center mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    simulationStep >= step ? 'w-8 bg-cyan-400' : 'w-4 bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-auto">
              <button
                onClick={resetSimulation}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
                disabled={simulationStep === 0}
              >
                Reset
              </button>
              <button
                onClick={startSimulation}
                disabled={isSimulating}
                className="px-4 py-1.5 rounded bg-cyan-500 text-slate-950 font-heading text-xs hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 transition-all font-bold"
              >
                {isSimulating ? 'HEALING...' : 'TRIGGER SCHEMA DRIFT'}
              </button>
            </div>
          </div>

          {/* Simulator Console Output */}
          <div className="md:col-span-5 flex flex-col min-h-[360px] border border-white/5 bg-[#070a13] rounded-xl p-4 relative font-mono text-xs text-slate-300 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <span className="flex items-center gap-1.5 text-slate-400 font-heading text-[10px]">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>AGENT LOGSPAN</span>
              </span>
              <span className="text-[10px] text-slate-500">Live Telemetry</span>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto leading-relaxed">
              <div>
                <span className="text-slate-500">[12:00:00]</span> <span className="text-green-400">INFO</span> Agent initialized. Subscribed to connector_sf_001.
              </div>

              {simulationStep >= 1 && (
                <div className="animate-slide-right">
                  <span className="text-slate-500">[12:00:02]</span> <span className="text-red-400">ALERT</span> Sync failed. Error details: Schema mismatch at source table &apos;Opportunity&apos;.
                </div>
              )}

              {simulationStep >= 2 && (
                <div className="animate-slide-right">
                  <span className="text-slate-500">[12:00:04]</span> <span className="text-purple-400">PROMPT</span> Invoking Gemini 3 reasoning with schemas.
                  <br />
                  <span className="text-slate-500">[12:00:05]</span> <span className="text-purple-400">RESOLVE</span> Rename mapped: annual_revenue (source) -&gt; revenue (dest) | Confidence: 94%
                </div>
              )}

              {simulationStep >= 3 && (
                <div className="animate-slide-right">
                  <span className="text-slate-500">[12:00:06]</span> <span className="text-amber-400">MUTATE</span> Patch payload built. Modifying schema configuration on Fivetran connector.
                </div>
              )}

              {simulationStep >= 4 && (
                <div className="animate-slide-right">
                  <span className="text-slate-500">[12:00:08]</span> <span className="text-green-400">SUCCESS</span> Fivetran sync forced. Reconciliation check passed. Pipeline returned to HEALTHY.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Architecture Section ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-16 w-full relative z-10 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <h2 className="font-heading text-xs text-cyan-400 tracking-widest">
              SEMANTIC RESOLUTION
            </h2>
            <h3 className="text-3xl font-bold mt-2 leading-tight">
              Driven by Gemini 3 Semantic Intelligence
            </h3>
            <div className="mt-6 space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                <span className="font-heading text-[10px] text-red-400 shrink-0 mt-0.5 opacity-70">01</span>
                <div>
                  <span className="font-heading text-xs text-red-400">DETECT</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Fivetran webhook received in &lt;10ms, incident opened</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <span className="font-heading text-[10px] text-amber-400 shrink-0 mt-0.5 opacity-70">02</span>
                <div>
                  <span className="font-heading text-xs text-amber-400">DIAGNOSE</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Source vs destination schemas diffed via Fivetran API</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
                <span className="font-heading text-[10px] text-purple-400 shrink-0 mt-0.5 opacity-70">03</span>
                <div>
                  <span className="font-heading text-xs text-purple-400">MAP</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Gemini 3 Pro reasons column renames semantically</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                <span className="font-heading text-[10px] text-cyan-400 shrink-0 mt-0.5 opacity-70">04</span>
                <div>
                  <span className="font-heading text-xs text-cyan-400">PATCH</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">PATCH /connectors/{'{id}'}/schemas applied autonomously</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                <span className="font-heading text-[10px] text-green-400 shrink-0 mt-0.5 opacity-70">05</span>
                <div>
                  <span className="font-heading text-xs text-green-400">VERIFY</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Force re-sync, poll until HEALTHY confirmed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 border border-white/5 bg-slate-900/30 rounded-2xl p-6 relative">
            <div className="absolute top-2 right-4 flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
            </div>

            <div className="font-mono text-xs space-y-3">
              <div className="text-slate-500">{"// Gemini 3 Structured Output schema resolution payload"}</div>
              <div className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-[#a855f7] border border-white/5">
                <pre>{`[
  {
    "source_column": "annual_revenue",
    "destination_column": "revenue",
    "confidence": 0.94,
    "reasoning": "Dropped column 'revenue' matched to newly added 'annual_revenue'. Types match (FLOAT). Mapped as rename."
  }
]`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sponsors & Integrations ────────────────────────────── */}
      <section className="py-16 border-t border-white/5 bg-slate-950/40 relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-[10px] font-heading tracking-widest text-cyan-400">
              OFFICIAL SPONSORS & INTEGRATIONS
            </p>
            <h3 className="text-xl font-bold mt-2 text-white">Powering Autonomous Pipeline Healing</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Google Cloud */}
            <div className="glass-card p-5 flex items-center gap-4 border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-xl hover:border-cyan-500/30 hover:bg-slate-900/40 transition-all group">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all flex items-center justify-center w-12 h-12 shrink-0">
                <img src="/icon-google-cloud.svg" alt="Google Cloud" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h4 className="font-heading text-xs text-white tracking-wider">Google Cloud</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Gemini 3 Reasoning Engine & Cloud Run Hosting</p>
              </div>
            </div>

            {/* Fivetran */}
            <div className="glass-card p-5 flex items-center gap-4 border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-xl hover:border-cyan-500/30 hover:bg-slate-900/40 transition-all group">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all flex items-center justify-center w-12 h-12 shrink-0">
                <img src="/icon-fivetran.svg" alt="Fivetran" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h4 className="font-heading text-xs text-white tracking-wider">Fivetran</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">REST APIs & Custom Connector Management</p>
              </div>
            </div>

            {/* Arize Phoenix */}
            <div className="glass-card p-5 flex items-center gap-4 border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-xl hover:border-cyan-500/30 hover:bg-slate-900/40 transition-all group">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all flex items-center justify-center w-12 h-12 shrink-0">
                <img src="/icon-arize-phoenix.svg" alt="Arize Phoenix" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h4 className="font-heading text-xs text-white tracking-wider">Arize Phoenix</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Agent Tracing, Spans, & Evals Platform</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final Call to Action ───────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-heading font-black mb-4">
          Self-Heal Your Infrastructure Today
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed mb-8">
          Ensure zero downtime for down-stream analysts and ML pipelines. Let Suture monitor, diagnose, and repair schemas autonomously.
        </p>
        <Link
          href="/dashboard"
          className="mx-auto w-full sm:w-auto px-8 py-3 rounded-xl btn-cyber-animated font-heading text-sm font-bold flex items-center justify-center gap-2 group"
        >
          Open Command Console
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 mt-auto bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="Suture Logo" className="w-6 h-6" />
            <span className="font-heading text-xs tracking-wider text-slate-400">
              SUTURE &copy; 2026
            </span>
          </div>
          <div className="text-[10px] text-slate-500 text-center sm:text-right">
            Google Cloud Rapid Agent Hackathon · Fivetran API partner track
          </div>
        </div>
      </footer>
    </div>
  );
}
