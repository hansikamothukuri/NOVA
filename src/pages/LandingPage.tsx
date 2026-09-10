import React from 'react';
import { Link } from 'react-router-dom';
import {
  Kanban,
  CheckCircle2,
  Users,
  BarChart3,
  Shield,
  ArrowRight,
  Sparkles,
  Layers,
  Zap,
  Clock,
  Database,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Kanban className="w-6 h-6 text-orange-400" />,
      title: 'Project Management',
      description: 'Organize high-velocity roadmaps with custom milestones, start/due dates, and live completion tracking.',
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
      title: 'Kanban Task Board',
      description: 'Interactive columns for Todo, In Progress, Review, and Completed with instant status drag-and-drop.',
    },
    {
      icon: <Users className="w-6 h-6 text-cyan-400" />,
      title: 'Team Collaboration',
      description: 'Invite members by registered email, assign tasks with explicit role-based access control (Owner vs Member).',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-amber-400" />,
      title: 'Real-time Metrics',
      description: 'Dynamically calculate completion percentage directly from MySQL relational database records.',
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-400" />,
      title: 'Enterprise Security',
      description: 'Bcrypt password hashing, secure JWT authentication tokens, and strict backend authorization middleware.',
    },
    {
      icon: <Database className="w-6 h-6 text-rose-400" />,
      title: 'MySQL Relational Schema',
      description: 'Normalized database structure with foreign keys, cascading deletions, indexes, and parameterized queries.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Create',
      description: 'Set up your project repository, define milestones, and establish clear deadlines.',
    },
    {
      num: '02',
      title: 'Collaborate',
      description: 'Add registered team members, assign targeted tasks, and manage roles seamlessly.',
    },
    {
      num: '03',
      title: 'Deliver',
      description: 'Track real-time progress on Kanban boards and ship production milestones on schedule.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-800/80">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-orange-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-amber-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Full-Stack Project Management Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight sm:leading-none mb-6">
            Plan. Collaborate.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300">
              Deliver.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            NOVA empowers modern software engineering teams to manage projects, assign granular tasks,
            collaborate with zero friction, and deliver high-impact results backed by a relational MySQL database.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            {isAuthenticated ? (
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" fullWidth icon={<ArrowRight className="w-5 h-5" />}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" fullWidth icon={<ArrowRight className="w-5 h-5" />}>
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" fullWidth>
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Quick Demo Credentials Banner */}
          <div className="mt-12 p-4 max-w-xl mx-auto rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="text-slate-200">Demo User:</strong> alex@nova.dev / <strong className="text-slate-200">Password:</strong> password123
              </span>
            </div>
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-semibold underline shrink-0">
              Auto-login &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4">
            Everything your team needs to ship faster
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            A complete suite of project and task orchestration features built with professional architectural standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-orange-950/20"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-5">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">How NOVA Works</h2>
            <p className="text-sm sm:text-base text-slate-400">
              A streamlined 3-step workflow designed for clarity, focus, and velocity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <span className="text-3xl font-extrabold text-orange-500/40 mb-4 block font-mono">
                    {step.num}
                  </span>
                  <h3 className="text-xl font-bold text-slate-100 mb-3">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-orange-950/40 to-slate-900 border border-orange-500/20 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to elevate your team's workflow?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
              Start managing real projects, tasks, and team members with complete full-stack power today.
            </p>
            <div className="flex justify-center">
              <Link to="/register">
                <Button variant="primary" size="lg" icon={<Sparkles className="w-5 h-5" />}>
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-slate-200">NOVA</span>
            <span>— Plan. Collaborate. Deliver.</span>
          </div>

          <div className="flex items-center gap-6">
            <span>MySQL Relational Database</span>
            <span>JWT Auth</span>
            <span>Express REST API</span>
            <span>React + Vite</span>
          </div>

          <div>&copy; {new Date().getFullYear()} NOVA. Full Stack Intern Assignment.</div>
        </div>
      </footer>
    </div>
  );
};
