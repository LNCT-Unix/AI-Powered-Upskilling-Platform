import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Send,
  RotateCcw,
  Sparkles,
  BrainCircuit,
  Network,
  GraduationCap,
  GitPullRequest,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  Minimize2,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { ASSIGNED_QUESTIONS, INTENT_KEYWORDS } from '../../data/chatbotQuestions';
import './LandingChatbot.css';

const ICON_MAP = {
  BrainCircuit,
  Network,
  GraduationCap,
  GitPullRequest,
  Briefcase,
  CheckCircle2,
};

const getNowTime = () => {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function LandingChatbot({ initialOpen = false }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showQuestionsDrawer, setShowQuestionsDrawer] = useState(false);

  const initialWelcome = {
    id: 'welcome-msg',
    sender: 'bot',
    text: `👋 **Welcome to octoByte!** I'm **Octo**, your AI learning assistant.\n\nI can help you understand how our adaptive diagnostic tests work, explore the 56-skill graph, learn about personalized roadmaps, project verification, and career matching.\n\nChoose any of the **6 assigned questions** below or ask me anything!`,
    isWelcome: true,
    showQuestions: true,
    timestamp: getNowTime(),
    feedback: null,
  };

  const [messages, setMessages] = useState([initialWelcome]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle assigned question selection
  const handleSelectQuestion = useCallback((q) => {
    setShowQuestionsDrawer(false);

    const userMsgId = 'usr-' + Date.now();
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: q.question,
      timestamp: getNowTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate natural AI thinking delay
    setTimeout(() => {
      const botMsgId = 'bot-' + Date.now();
      const botMsg = {
        id: botMsgId,
        sender: 'bot',
        text: q.answer,
        actions: q.actions,
        category: q.tag,
        timestamp: getNowTime(),
        feedback: null,
        relatedQuestionId: q.id,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  }, []);

  // Listen for global open chat events from Landing Page sections
  useEffect(() => {
    const handleOpenEvent = (e) => {
      setIsOpen(true);
      setShowTeaser(false);
      if (e.detail?.questionId) {
        const found = ASSIGNED_QUESTIONS.find((item) => item.id === e.detail.questionId);
        if (found) {
          setTimeout(() => handleSelectQuestion(found), 150);
        }
      }
    };

    window.addEventListener('octobyte:open-chat', handleOpenEvent);
    return () => window.removeEventListener('octobyte:open-chat', handleOpenEvent);
  }, [handleSelectQuestion]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  // Handle custom typed user input
  const handleSendMessage = (e) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text,
      timestamp: getNowTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let matchedCustom = null;

      // 1. Direct match with assigned questions
      let matchedQuestion = ASSIGNED_QUESTIONS.find(
        (q) =>
          lower.includes(q.shortTitle.toLowerCase()) ||
          lower.includes(q.tag.toLowerCase()) ||
          q.question.toLowerCase().includes(lower)
      );

      // 2. Keyword match
      if (!matchedQuestion) {
        for (const item of INTENT_KEYWORDS) {
          if (item.keywords.some((kw) => lower.includes(kw))) {
            if (item.questionId) {
              matchedQuestion = ASSIGNED_QUESTIONS.find((q) => q.id === item.questionId);
              break;
            } else if (item.customResponse) {
              matchedCustom = item.customResponse;
              break;
            }
          }
        }
      }

      let botResponse = {};
      if (matchedQuestion) {
        botResponse = {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: matchedQuestion.answer,
          actions: matchedQuestion.actions,
          category: matchedQuestion.tag,
          timestamp: getNowTime(),
          feedback: null,
          relatedQuestionId: matchedQuestion.id,
        };
      } else if (matchedCustom) {
        botResponse = {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: matchedCustom.answer,
          actions: matchedCustom.actions,
          timestamp: getNowTime(),
          feedback: null,
        };
      } else {
        // Fallback response with the 6 assigned questions
        botResponse = {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: `I specialize in explaining **octoByte's learning platform**, including our adaptive CAT testing, 56-skill DAG, AI roadmap generation, GitHub project verification, and career matching.\n\nHere are the **6 core questions** that can help you explore:`,
          actions: [
            { label: 'Explore Platform Features', anchor: '#features' },
            { label: 'Start Free Account', route: '/signup', primary: true }
          ],
          showQuestions: true,
          timestamp: getNowTime(),
          feedback: null,
        };
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 650);
  };

  // Reset conversation to initial state
  const handleReset = () => {
    setMessages([
      {
        ...initialWelcome,
        id: 'welcome-' + Date.now(),
        timestamp: getNowTime(),
      },
    ]);
    setShowQuestionsDrawer(false);
  };

  // Copy text to clipboard
  const handleCopy = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Feedback thumb reaction
  const handleFeedback = (msgId, thumb) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, feedback: m.feedback === thumb ? null : thumb } : m
      )
    );
  };

  // Action CTA click handler
  const handleActionClick = (action) => {
    if (action.route) {
      navigate(action.route);
    } else if (action.anchor) {
      const el = document.querySelector(action.anchor);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Format markdown-like bold, lists, and code
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-[#2F2A3E]">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
          const cleanLine = isBullet ? line.replace(/^[•-]\s*/, '') : line;

          // Parse bold (**text**) and code (`code`)
          const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-[#1E192D]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code
                  key={pIdx}
                  className="rounded bg-[#EFEAFC] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#6244E8]"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="text-[#7C5CFA] font-bold text-sm leading-none mt-1">•</span>
                <span className="flex-1">{parts}</span>
              </div>
            );
          }

          return <p key={idx}>{parts}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* ── Floating Launcher in Bottom Right ──────────────────── */}
      <aside
        aria-label="octoByte AI Chatbot"
        className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-50 flex flex-col items-end"
      >
        {/* Teaser Tooltip Bubble (Dismissable, only when chat is closed) */}
        {!isOpen && showTeaser && (
          <div className="octo-teaser-bob mb-3 relative flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md px-4 py-2.5 border border-[#E8E0CC] shadow-xl text-slate-800 max-w-[280px]">
            <span className="text-xl">🐙</span>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold text-[#2F2A3E] leading-tight">Got questions?</p>
              <p className="text-[11px] text-[#6E6880] leading-tight">
                Ask Octo about our CAT tests &amp; roadmaps!
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTeaser(false);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition cursor-pointer"
              aria-label="Dismiss greeting"
            >
              <X size={13} />
            </button>
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-[#E8E0CC] rotate-45" />
          </div>
        )}

        {/* Floating Toggle Button */}
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-expanded={isOpen}
            aria-label="Open octoByte AI Assistant"
            className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#7C5CFA] to-[#6244E8] px-4 py-3 sm:px-5 sm:py-3.5 text-white font-bold text-sm octo-launcher-shadow octo-pulse-ring transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <img
                src="/octobyte-logo.png"
                alt="Octo Mascot"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow"
              />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
              </span>
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                Ask Octo AI
                <Sparkles size={13} className="text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
              </span>
              <span className="text-[10px] text-white/80 font-medium mt-0.5">
                Quick Questions
              </span>
            </div>
          </button>
        )}

        {/* ── Chat Modal Window ─────────────────────────────────── */}
        {isOpen && (
          <section
            aria-label="octoByte AI Chat Dialog"
            className={`flex flex-col bg-[#FFFDF7] border border-[#E8E0CC] rounded-3xl octo-chatbot-shadow overflow-hidden transition-all duration-300 ${
              isExpanded
                ? 'w-[94vw] max-w-[640px] h-[85vh] max-h-[760px]'
                : 'w-[94vw] max-w-[430px] h-[82vh] max-h-[620px]'
            } fixed bottom-4 right-3 sm:bottom-6 sm:right-6`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-[#7C5CFA] via-[#6F4EE8] to-[#5D3CD6] text-white select-none shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md p-1 border border-white/20">
                  <img
                    src="/octobyte-logo.png"
                    alt="Octo"
                    className="w-full h-full object-contain drop-shadow"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#6F4EE8] rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm sm:text-base tracking-tight leading-none text-white">
                      Octo AI Assistant
                    </h3>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9.5px] font-bold text-amber-200">
                      Landing Guide
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 font-medium leading-tight mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />
                    Online &middot; Answers with CAT &amp; DAG accuracy
                  </p>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleReset}
                  title="Restart Conversation"
                  aria-label="Restart Conversation"
                  className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Collapse size' : 'Expand size'}
                  aria-label={isExpanded ? 'Collapse size' : 'Expand size'}
                  className="hidden sm:block p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Chat"
                  aria-label="Close Chat"
                  className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick-Access Assigned Questions Pill Bar */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F7F3E8] border-b border-[#E8E0CC] overflow-x-auto octo-chip-scroll shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6E6880] shrink-0 pl-1">
                Assigned:
              </span>
              {ASSIGNED_QUESTIONS.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleSelectQuestion(q)}
                  disabled={isTyping}
                  className="shrink-0 text-left rounded-full bg-white border border-[#E8E0CC] px-2.5 py-1 text-[11px] font-semibold text-[#2F2A3E] hover:border-[#7C5CFA] hover:text-[#7C5CFA] hover:bg-[#EFEAFC]/50 transition cursor-pointer disabled:opacity-50"
                >
                  {q.shortTitle}
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 octo-chat-scroll bg-[#FFFDF7]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`octo-msg-in flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Sender Tag & Timestamp */}
                  <div className="flex items-center gap-1.5 px-1 mb-1 text-[10px] text-[#8D8471] font-medium">
                    {msg.sender === 'bot' ? (
                      <>
                        <span className="font-bold text-[#7C5CFA]">Octo</span>
                        {msg.category && (
                          <span className="rounded-full bg-[#EFEAFC] text-[#6244E8] px-1.5 py-0.2 text-[9px] font-bold">
                            {msg.category}
                          </span>
                        )}
                        <span>&bull;</span>
                        <span>{msg.timestamp}</span>
                      </>
                    ) : (
                      <>
                        <span>You</span>
                        <span>&bull;</span>
                        <span>{msg.timestamp}</span>
                      </>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative max-w-[88%] sm:max-w-[84%] rounded-2xl p-3.5 shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-[#7C5CFA] to-[#6244E8] text-white rounded-tr-xs'
                        : 'bg-[#F9F6EE] border border-[#E8E0CC] text-[#2F2A3E] rounded-tl-xs'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className="text-xs sm:text-sm font-medium leading-relaxed">{msg.text}</p>
                    ) : (
                      <div className="space-y-3">
                        {renderFormattedText(msg.text)}

                        {/* Interactive CTAs */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="pt-2 border-t border-[#E8E0CC]/70 flex flex-wrap gap-2">
                            {msg.actions.map((act, aIdx) => (
                              <button
                                key={aIdx}
                                type="button"
                                onClick={() => handleActionClick(act)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                                  act.primary
                                    ? 'bg-[#7C5CFA] text-white hover:bg-[#6244E8]'
                                    : 'bg-white border border-[#E8E0CC] text-[#2F2A3E] hover:bg-slate-50'
                                }`}
                              >
                                <span>{act.label}</span>
                                <ArrowRight size={12} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 6 Assigned Questions Grid (Rendered inside Welcome message or Fallback) */}
                  {msg.showQuestions && (
                    <div className="mt-3 w-full space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#6E6880] px-1 flex items-center gap-1">
                        <HelpCircle size={12} className="text-[#7C5CFA]" />
                        Select one of 6 Assigned Questions:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {ASSIGNED_QUESTIONS.map((q, idx) => {
                          const IconComponent = ICON_MAP[q.icon] || HelpCircle;
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => handleSelectQuestion(q)}
                              disabled={isTyping}
                              className="group text-left flex items-start gap-3 rounded-2xl border border-[#E8E0CC] bg-white p-3 hover:border-[#7C5CFA] hover:bg-[#FAF8F2] hover:shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
                            >
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EFEAFC] text-[#7C5CFA] group-hover:bg-[#7C5CFA] group-hover:text-white transition-colors">
                                <IconComponent size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF9838]">
                                    Q{idx + 1} &middot; {q.badge}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-[#2F2A3E] group-hover:text-[#6244E8] transition-colors leading-tight">
                                  {q.question}
                                </p>
                              </div>
                              <ChevronRight
                                size={15}
                                className="text-slate-400 group-hover:text-[#7C5CFA] group-hover:translate-x-0.5 transition-all mt-1"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Feedback and Copy Footer for Bot Messages */}
                  {msg.sender === 'bot' && !msg.isWelcome && (
                    <div className="flex items-center gap-3 px-1 mt-1 text-[11px] text-[#8D8471]">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="flex items-center gap-1 hover:text-[#2F2A3E] transition cursor-pointer"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5 ml-2">
                        <span>Helpful?</span>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 'up')}
                          className={`p-1 rounded-md transition cursor-pointer ${
                            msg.feedback === 'up'
                              ? 'text-emerald-600 font-bold bg-emerald-50'
                              : 'hover:text-[#2F2A3E]'
                          }`}
                          title="Helpful"
                          aria-label="Thumbs up"
                        >
                          <ThumbsUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 'down')}
                          className={`p-1 rounded-md transition cursor-pointer ${
                            msg.feedback === 'down'
                              ? 'text-rose-600 font-bold bg-rose-50'
                              : 'hover:text-[#2F2A3E]'
                          }`}
                          title="Not helpful"
                          aria-label="Thumbs down"
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator bubble */}
              {isTyping && (
                <div className="octo-msg-in flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#EFEAFC] text-[#7C5CFA]">
                    <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl bg-[#F9F6EE] border border-[#E8E0CC] px-4 py-3 shadow-xs">
                    <span className="text-xs font-semibold text-[#6E6880] mr-1">Octo is thinking</span>
                    <span className="octo-dot-1 h-1.5 w-1.5 rounded-full bg-[#7C5CFA]" />
                    <span className="octo-dot-2 h-1.5 w-1.5 rounded-full bg-[#7C5CFA]" />
                    <span className="octo-dot-3 h-1.5 w-1.5 rounded-full bg-[#7C5CFA]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Follow-up Questions Drawer (Toggleable) */}
            {showQuestionsDrawer && (
              <div className="px-4 py-3 bg-[#F7F3E8] border-t border-[#E8E0CC] max-h-48 overflow-y-auto octo-chat-scroll space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-[#6E6880] uppercase tracking-wide">
                    Choose from 6 Assigned Questions
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQuestionsDrawer(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                {ASSIGNED_QUESTIONS.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSelectQuestion(q)}
                    className="w-full text-left rounded-xl bg-white border border-[#E8E0CC] p-2 text-xs font-medium text-[#2F2A3E] hover:border-[#7C5CFA] hover:text-[#7C5CFA] transition cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate pr-2">{q.question}</span>
                    <ChevronRight size={13} className="shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar Form */}
            <footer className="p-3 bg-white border-t border-[#E8E0CC] shrink-0">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionsDrawer(!showQuestionsDrawer)}
                  title="View Assigned Questions"
                  aria-label="Toggle Assigned Questions drawer"
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    showQuestionsDrawer
                      ? 'bg-[#EFEAFC] border-[#7C5CFA] text-[#6244E8]'
                      : 'bg-[#FAF8F2] border-[#E8E0CC] text-[#6E6880] hover:text-[#2F2A3E]'
                  }`}
                >
                  <HelpCircle size={17} />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question or select from assigned..."
                  aria-label="Type your message"
                  className="flex-1 rounded-2xl bg-[#FAF8F2] border border-[#E8E0CC] px-4 py-2.5 text-xs sm:text-sm text-[#2F2A3E] placeholder-[#8D8471] focus:outline-none focus:border-[#7C5CFA] focus:ring-2 focus:ring-[#7C5CFA]/20 transition"
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  aria-label="Send message"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7C5CFA] text-white hover:bg-[#6244E8] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm cursor-pointer shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
              <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-[#8D8471]">
                <span>Click ? for 6 preset questions</span>
                <span>Powered by octoByte IRT &amp; AI</span>
              </div>
            </footer>
          </section>
        )}
      </aside>
    </>
  );
}
