import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, Terminal, Network, Eye, Code,
  Mail, ChevronDown, ExternalLink,
  Server, Fingerprint, Radio, Bug, Database, AlertTriangle,
  CheckCircle, GraduationCap, MapPin, Calendar,
  FileText, Trophy, Users, Target, Award
} from 'lucide-react';
import MatrixRain from './components/MatrixRain';
import TerminalText from './components/TerminalText';
import SkillBar from './components/SkillBar';
import ProjectCard from './components/ProjectCard';
import CertificationBadge from './components/CertificationBadge';

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [_typingComplete, _setTypingComplete] = useState(false);
  const { scrollYProgress } = useScroll();
  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const sections = ['home', 'about', 'skills', 'projects', 'education', 'contact'];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      sections.forEach(section => {
        const el = document.getElementById(section);
        if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) {
          setActiveSection(section);
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
      {/* Matrix Rain Background */}
      <MatrixRain />

      {/* Scanline Effect */}
      <div className="scanline" />

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-cyan)] z-50"
        style={{ width: progressBarWidth }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-[var(--accent-green)]" />
              <span className="font-mono text-lg font-bold text-[var(--accent-green)]">
                CK_<span className="text-[var(--text-primary)]">SEC</span>
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => scrollTo(section)}
                  className={`px-4 py-2 rounded-md font-mono text-sm transition-all ${
                    activeSection === section
                      ? 'text-[var(--accent-green)] bg-[var(--accent-green)]/10'
                      : 'text-[var(--text-secondary)] hover:text-[var(--accent-green)]'
                  }`}
                >
                  <span className="text-[var(--accent-green)]">$</span> {section}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-[var(--accent-green)]"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Terminal className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-secondary)]"
            >
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => scrollTo(section)}
                  className="block w-full px-4 py-3 text-left font-mono text-sm text-[var(--text-secondary)] hover:text-[var(--accent-green)] hover:bg-[var(--accent-green)]/5"
                >
                  <span className="text-[var(--accent-green)]">$</span> {section}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center relative pt-16">
        <div className="absolute inset-0 hex-pattern opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="font-mono text-[var(--accent-green)] mb-4 text-sm">
                <TerminalText text="initializing_secure_connection..." delay={0} />
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                <span className="text-[var(--text-primary)]">Christian</span>
                <br />
                <span className="text-[var(--accent-green)] text-glow-green">Kent</span>
              </h1>
              <div className="font-mono text-lg text-[var(--accent-cyan)] mb-4">
                <TerminalText text="Cybersecurity Specialist | Digital Forensics | Network Analyst" delay={500} />
              </div>
              <p className="text-[var(--text-secondary)] text-lg mb-8 max-w-xl">
                EKU Digital Forensics & Cybersecurity student (Graduating Fall 2026). 
                Born and raised in Louisville, KY. CCDC competitor, Splunk team member, 
                and future network analyst passionate about defending against cyber threats.
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 text-center">
                  <Trophy className="w-5 h-5 text-[var(--accent-yellow)] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[var(--accent-green)]">CCDC</div>
                  <div className="text-xs text-[var(--text-muted)]">Competitor</div>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 text-center">
                  <Users className="w-5 h-5 text-[var(--accent-cyan)] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[var(--accent-green)]">Splunk</div>
                  <div className="text-xs text-[var(--text-muted)]">Team Member</div>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 text-center">
                  <Target className="w-5 h-5 text-[var(--accent-red)] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[var(--accent-green)]">Network</div>
                  <div className="text-xs text-[var(--text-muted)]">Analyst Goal</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => scrollTo('projects')}
                  className="px-6 py-3 bg-[var(--accent-green)] text-[var(--bg-primary)] font-mono font-bold rounded-md hover:bg-[var(--accent-green)]/90 transition-all animate-pulse-glow"
                >
                  View Projects
                </button>
                <button
                  onClick={() => scrollTo('contact')}
                  className="px-6 py-3 border border-[var(--accent-green)] text-[var(--accent-green)] font-mono rounded-md hover:bg-[var(--accent-green)]/10 transition-all"
                >
                  Contact Me
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="terminal-window p-6 pt-10">
                <div className="absolute top-2 left-4 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--accent-red)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--accent-yellow)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--accent-green)]" />
                </div>
                <div className="font-mono text-sm space-y-2">
                  <div className="text-[var(--text-muted)]">$ whoami</div>
                  <div className="text-[var(--accent-green)]">christian_kent</div>
                  <div className="text-[var(--text-muted)]">$ location</div>
                  <div className="text-[var(--text-primary)]">Louisville, KY</div>
                  <div className="text-[var(--text-muted)]">$ status</div>
                  <div className="text-[var(--accent-cyan)]">Seeking Network Analyst Opportunities</div>
                  <div className="text-[var(--text-muted)]">$ education</div>
                  <div className="text-[var(--text-primary)]">BS Digital Forensics & Cybersecurity - EKU</div>
                  <div className="text-[var(--text-muted)]">$ achievements</div>
                  <div className="flex flex-wrap gap-2">
                    {['CCDC Regional Competitor', 'Splunk Team', 'Dean\'s List', 'Cyber Defense Club'].map((skill) => (
                      <span key={skill} className="px-2 py-1 bg-[var(--accent-green)]/10 text-[var(--accent-green)] text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="text-[var(--text-muted)]">$ <span className="typing-cursor" /></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-[var(--accent-green)]" />
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="font-mono text-[var(--accent-green)] text-sm mb-2">$ cat about.txt</div>
            <h2 className="text-4xl font-bold text-[var(--text-primary)]">About Me</h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="terminal-window p-6">
                <div className="font-mono text-sm space-y-4 text-[var(--text-secondary)]">
                  <p>
                    Born and raised in Louisville, Kentucky, I've always been fascinated by technology 
                    and problem-solving. My dual interests in law enforcement and computer science 
                    converged into a passion for cybersecurity.
                  </p>
                  <p>
                    At Eastern Kentucky University, I'm majoring in Digital Forensics and Cybersecurity 
                    with a minor in Computer Electronics Technology. I compete in the Collegiate Cyber 
                    Defense Competition (CCDC) where I've gained real-world skills in defending networks 
                    against cyber threats at the regional level.
                  </p>
                  <p>
                    I'm also a member of Team "Splunk," collaborating with fellow students to analyze 
                    data and improve security practices. My goal is to become a network analyst, protecting 
                    systems, monitoring network activity, and responding to emerging security threats.
                  </p>
                </div>
              </div>

              {/* EKU Student Spotlight Feature */}
              <div className="bg-gradient-to-r from-[var(--accent-green)]/10 to-[var(--accent-cyan)]/10 border border-[var(--accent-green)]/30 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Award className="w-8 h-8 text-[var(--accent-yellow)] flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                      EKU Student Spotlight
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      Featured by Eastern Kentucky University for excellence in cybersecurity 
                      studies and competitive achievements.
                    </p>
                    <a 
                      href="https://www.eku.edu/newsletter/student-spotlight-mr-christian-kent/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[var(--accent-green)] hover:text-[var(--accent-cyan)] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Read Full Story
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: MapPin, label: 'Location', value: 'Louisville, KY' },
                  { icon: GraduationCap, label: 'Degree', value: 'BS Digital Forensics & Cybersecurity' },
                  { icon: Calendar, label: 'Graduation', value: 'Fall 2026' },
                  { icon: Shield, label: 'Focus', value: 'Network Analysis' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)]">
                    <item.icon className="w-5 h-5 text-[var(--accent-green)]" />
                    <div>
                      <div className="text-xs text-[var(--text-muted)] font-mono">{item.label}</div>
                      <div className="text-sm text-[var(--text-primary)]">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="font-mono text-[var(--accent-cyan)] text-sm mb-4">$ ls certifications/</h3>
              <CertificationBadge
                name="CompTIA Security+"
                status="In Progress"
                icon={Lock}
                color="yellow"
              />
              <CertificationBadge
                name="CompTIA Network+"
                status="Planned"
                icon={Network}
                color="red"
              />
              <CertificationBadge
                name="CEH - Certified Ethical Hacker"
                status="Target 2027"
                icon={Eye}
                color="cyan"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-24 bg-[var(--bg-secondary)] relative">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="font-mono text-[var(--accent-green)] text-sm mb-2">$ nmap --skills</div>
            <h2 className="text-4xl font-bold text-[var(--text-primary)]">Technical Skills</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                category: 'Penetration Testing',
                icon: Bug,
                skills: [
                  { name: 'Kali Linux', level: 85 },
                  { name: 'Metasploit', level: 75 },
                  { name: 'Burp Suite', level: 70 },
                  { name: 'Nmap/Nessus', level: 90 },
                ]
              },
              {
                category: 'Network Security',
                icon: Network,
                skills: [
                  { name: 'TCP/IP', level: 90 },
                  { name: 'Wireshark', level: 85 },
                  { name: 'Firewall Config', level: 75 },
                  { name: 'VPN/IDS/IPS', level: 70 },
                ]
              },
              {
                category: 'Digital Forensics',
                icon: Fingerprint,
                skills: [
                  { name: 'Autopsy', level: 80 },
                  { name: 'Volatility', level: 70 },
                  { name: 'Sleuth Kit', level: 75 },
                  { name: 'Evidence Handling', level: 85 },
                ]
              },
              {
                category: 'Programming',
                icon: Code,
                skills: [
                  { name: 'Python', level: 85 },
                  { name: 'Bash/Shell', level: 80 },
                  { name: 'SQL', level: 75 },
                  { name: 'PowerShell', level: 65 },
                ]
              },
              {
                category: 'Systems & Cloud',
                icon: Server,
                skills: [
                  { name: 'Linux Admin', level: 85 },
                  { name: 'Windows Server', level: 70 },
                  { name: 'AWS Basics', level: 60 },
                  { name: 'Docker', level: 65 },
                ]
              },
              {
                category: 'Security Operations',
                icon: AlertTriangle,
                skills: [
                  { name: 'SIEM (Splunk)', level: 70 },
                  { name: 'Incident Response', level: 75 },
                  { name: 'Threat Hunting', level: 65 },
                  { name: 'Log Analysis', level: 80 },
                ]
              },
            ].map((group) => (
              <motion.div
                key={group.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-[var(--bg-card)] rounded-lg p-6 border border-[var(--border-color)] card-hover"
              >
                <div className="flex items-center gap-3 mb-6">
                  <group.icon className="w-6 h-6 text-[var(--accent-green)]" />
                  <h3 className="font-mono text-[var(--accent-cyan)]">{group.category}</h3>
                </div>
                <div className="space-y-4">
                  {group.skills.map((skill) => (
                    <SkillBar key={skill.name} name={skill.name} level={skill.level} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="font-mono text-[var(--accent-green)] text-sm mb-2">$ ls -la projects/</div>
            <h2 className="text-4xl font-bold text-[var(--text-primary)]">Projects</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Network Vulnerability Scanner',
                description: 'Automated vulnerability assessment tool built with Python and Nmap. Scans networks, identifies open ports, and generates detailed security reports.',
                tags: ['Python', 'Nmap', 'Security', 'Automation'],
                icon: Network,
                github: '#',
                demo: '#',
                status: 'completed'
              },
              {
                title: 'Digital Forensics Toolkit',
                description: 'Collection of forensic analysis scripts for file recovery, metadata extraction, and timeline analysis. Integrates with Autopsy and Sleuth Kit.',
                tags: ['Python', 'Forensics', 'Autopsy', 'Evidence'],
                icon: Fingerprint,
                github: '#',
                demo: '#',
                status: 'completed'
              },
              {
                title: 'SIEM Log Analyzer',
                description: 'Custom SIEM dashboard for parsing and visualizing security logs. Features real-time alerting and threat correlation.',
                tags: ['Python', 'Splunk', 'SIEM', 'Analytics'],
                icon: Database,
                github: '#',
                demo: '#',
                status: 'in-progress'
              },
              {
                title: 'Malware Analysis Sandbox',
                description: 'Isolated environment for dynamic malware analysis. Monitors system calls, network traffic, and file system changes.',
                tags: ['Malware', 'Sandbox', 'Reverse Engineering', 'VM'],
                icon: Bug,
                github: '#',
                demo: '#',
                status: 'in-progress'
              },
              {
                title: 'Password Security Auditor',
                description: 'Tool for auditing password policies and testing password strength. Includes hash cracking capabilities and policy recommendations.',
                tags: ['Security', 'Passwords', 'Hashing', 'Audit'],
                icon: Lock,
                github: '#',
                demo: '#',
                status: 'completed'
              },
              {
                title: 'Wireless Security Assessment',
                description: 'Comprehensive WiFi security testing suite. Detects rogue access points, tests encryption strength, and analyzes wireless traffic.',
                tags: ['Wireless', 'WiFi', 'Aircrack', 'Network'],
                icon: Radio,
                github: '#',
                demo: '#',
                status: 'planned'
              },
            ].map((project) => (
              <ProjectCard key={project.title} {...project} status={project.status as 'completed' | 'in-progress' | 'planned'} />
            ))}
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section id="education" className="py-24 bg-[var(--bg-secondary)] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="font-mono text-[var(--accent-green)] text-sm mb-2">$ cat education.log</div>
            <h2 className="text-4xl font-bold text-[var(--text-primary)]">Education</h2>
          </motion.div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="terminal-window p-6 pt-10"
            >
              <div className="absolute top-2 left-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--accent-red)]" />
                <div className="w-3 h-3 rounded-full bg-[var(--accent-yellow)]" />
                <div className="w-3 h-3 rounded-full bg-[var(--accent-green)]" />
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[var(--accent-green)]/10 rounded-lg">
                  <GraduationCap className="w-8 h-8 text-[var(--accent-green)]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                    Bachelor of Science in Digital Forensics & Cybersecurity
                  </h3>
                  <p className="text-[var(--accent-cyan)] font-mono mb-2">
                    Eastern Kentucky University (EKU)
                  </p>
                  <p className="text-[var(--text-secondary)] text-sm mb-4">
                    Richmond, KY • Expected Graduation: Fall 2026
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--text-muted)] font-mono">Key Coursework:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Network Security',
                        'Digital Forensics',
                        'Ethical Hacking',
                        'Incident Response',
                        'Malware Analysis',
                        'Cryptography',
                        'Cyber Law',
                        'Risk Management',
                      ].map((course) => (
                        <span
                          key={course}
                          className="px-3 py-1 bg-[var(--bg-primary)] text-[var(--accent-green)] text-xs rounded-full border border-[var(--border-color)]"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-[var(--bg-card)] rounded-lg p-6 border border-[var(--border-color)]"
              >
                <h3 className="font-mono text-[var(--accent-cyan)] mb-4">$ ls achievements/</h3>
                <ul className="space-y-3">
                  {[
                    'Dean\'s List - Multiple Semesters',
                    'Cyber Defense Club Member',
                    'CTF Competition Participant',
                    'Cybersecurity Scholarship Recipient',
                  ].map((achievement) => (
                    <li key={achievement} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle className="w-4 h-4 text-[var(--accent-green)]" />
                      {achievement}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-[var(--bg-card)] rounded-lg p-6 border border-[var(--border-color)]"
              >
                <h3 className="font-mono text-[var(--accent-cyan)] mb-4">$ ls labs/</h3>
                <ul className="space-y-3">
                  {[
                    'Penetration Testing Lab Environment',
                    'Digital Forensics Workstation',
                    'Network Security Simulation Lab',
                    'Malware Analysis Sandbox',
                  ].map((lab) => (
                    <li key={lab} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Terminal className="w-4 h-4 text-[var(--accent-green)]" />
                      {lab}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 relative">
        <div className="absolute inset-0 hex-pattern opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="font-mono text-[var(--accent-green)] text-sm mb-2">$ ping contact</div>
            <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Let's Connect</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              I'm actively seeking cybersecurity opportunities for Fall 2026. 
              Whether you're hiring, mentoring, or just want to talk security—let's connect.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Mail,
                label: 'Email',
                value: 'christian.kent@email.com',
                href: 'mailto:christian.kent@email.com',
                color: 'green'
              },
              {
                icon: Network,
                label: 'LinkedIn',
                value: 'linkedin.com/in/christiankent',
                href: '#',
                color: 'cyan'
              },
              {
                icon: Code,
                label: 'GitHub',
                value: 'github.com/christiankent',
                href: '#',
                color: 'green'
              },
              {
                icon: FileText,
                label: 'Resume',
                value: 'Download PDF',
                href: '#',
                color: 'cyan'
              },
            ].map((contact) => (
              <motion.a
                key={contact.label}
                href={contact.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group bg-[var(--bg-card)] rounded-lg p-6 border border-[var(--border-color)] hover:border-[var(--accent-green)] transition-all text-center card-hover"
              >
                <contact.icon className={`w-8 h-8 mx-auto mb-3 ${
                  contact.color === 'green' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-cyan)]'
                }`} />
                <div className="font-mono text-sm text-[var(--text-muted)] mb-1">{contact.label}</div>
                <div className="text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-green)] transition-colors">
                  {contact.value}
                </div>
              </motion.a>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-green)]/10 rounded-full border border-[var(--accent-green)]/30">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
              <span className="font-mono text-sm text-[var(--accent-green)]">
                Status: Open to Opportunities
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--accent-green)]" />
              <span className="font-mono text-sm text-[var(--text-muted)]">
                Christian Kent © 2026
              </span>
            </div>
            <div className="font-mono text-xs text-[var(--text-muted)]">
              Secured with <span className="text-[var(--accent-green)]">&lt;passion&gt;</span> and <span className="text-[var(--accent-cyan)]">&lt;caffeine&gt;</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
