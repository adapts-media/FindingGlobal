import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Bot, ArrowLeft, HelpCircle } from "lucide-react";

interface QAItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

const FAQ_DATA: QAItem[] = [
  {
    id: "what-is",
    question: "What is Finding Global?",
    answer: "Finding Global is a premium B2B marketplace platform designed to connect clients with the best marketing, creative, branding, technology, and consulting agencies globally.",
    tags: ["what", "about", "finding global", "platform", "website", "what is"]
  },
  {
    id: "matching",
    question: "How does the agency matching engine work?",
    answer: "When you submit a project brief, our matching engine calculates a compatibility score (0-100) based on:\n\n• **Service Overlap (50%)**: matching your needs to agency services.\n• **Budget Fit (25%)**: comparing your budget with their minimums.\n• **Location Proximity (15%)**: finding regional partners.\n• **Industry Experience (10%)**: matching relevant portfolio experience.\n\nWe then connect you with the top 5-10 compatible partners.",
    tags: ["matching", "match", "engine", "algorithm", "score", "how it works", "find"]
  },
  {
    id: "free-client",
    question: "Is Finding Global free for clients?",
    answer: "Yes, it is **100% free**! Clients looking for agencies can post projects, browse the verified directory, and receive matched agency proposals without any cost, fees, or commitments.",
    tags: ["free", "cost", "price", "client", "charge", "payment", "fee"]
  },
  {
    id: "agency-join",
    question: "How do agencies get verified?",
    answer: "Agencies must register and complete a comprehensive 4-step onboarding flow (setup basics, input recognitions, select services, and showcase portfolio). Afterwards, our administration team manually reviews and verifies each profile before it goes live to maintain directory quality.",
    tags: ["agency", "join", "verify", "onboarding", "register", "approval", "get verified"]
  },
  {
    id: "regions",
    question: "Which regions/countries does the platform cover?",
    answer: "We cover agencies globally, with a strong focus on key international business hubs across North America, Europe, Asia, and the Middle East.",
    tags: ["regions", "countries", "global", "international", "world"]
  },
  {
    id: "speed",
    question: "How fast will I get matched?",
    answer: "Typically, you will receive your curated shortlist of matched agencies and initial proposals within **24 hours** of submitting your project brief.",
    tags: ["fast", "speed", "time", "how long", "duration", "matched"]
  },
  {
    id: "signal-detection",
    question: "What is Signal Detection?",
    answer: "Signal Detection is an advanced feature for agencies. It tracks intent signals on our marketplace (e.g., profile visitors, high-intent searches) and scores them (hot, warm, cold). This lets agencies know which companies are looking for their services in real-time.",
    tags: ["signal", "detection", "intent", "visitors", "track", "hot", "leads"]
  },
  {
    id: "plans",
    question: "What plans are available for agencies?",
    answer: "We offer two tier options:\n\n• **Free**: Basic profile presence with limited lead unlocks.\n• **FindingGlobal+**: Priority matchmaking, premium promoted placements, full Signal Detection, CRM integration, and access to more leads.",
    tags: ["plans", "subscription", "price", "agency cost", "tiers", "free", "findingglobal+", "pricing"]
  },
  {
    id: "industries",
    question: "What industries do you cover?",
    answer: "Our agencies cover a wide variety of industries including Technology, Healthcare, E-commerce, Real Estate, Finance, Education, Retail, and more. When submitting a brief, you can specify your exact industry to find the most relevant partners.",
    tags: ["industry", "industries", "sectors", "verticals", "cover", "which industries"]
  },
  {
    id: "submit-brief",
    question: "How do I submit a project brief?",
    answer: "Simply click on the 'I'm looking for an agency' button on our homepage. You'll be guided through a short, 3-minute questionnaire where you can specify your project goals, budget, timeline, and required services. Once submitted, our engine will instantly match you with top agencies.",
    tags: ["submit", "brief", "project", "start", "create", "how to submit"]
  },
  {
    id: "direct-contact",
    question: "Can I contact an agency directly without submitting a brief?",
    answer: "Yes! You can browse our global agency directory, view detailed profiles, portfolios, and reviews, and use the 'Contact Agency' feature to send them a direct message about your project.",
    tags: ["contact", "direct", "message", "without brief", "browse", "directory"]
  },
  {
    id: "cancel-plan",
    question: "Can an agency cancel their subscription plan?",
    answer: "Yes, agencies can upgrade, downgrade, or cancel their subscription plan at any time from their agency dashboard settings. There are no long-term lock-in contracts.",
    tags: ["cancel", "subscription", "plan", "downgrade", "stop", "billing"]
  },
  {
    id: "reviews",
    question: "Are the agency reviews real?",
    answer: "Absolutely. We enforce a strict verification process for all reviews. Agencies can only receive reviews from clients they have actively worked with on completed projects, ensuring 100% authenticity and trust.",
    tags: ["reviews", "real", "authentic", "fake", "trust", "verified"]
  }
];

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  suggestions?: string[]; // FAQ IDs to suggest
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I'm FindingGlobal Bot, your Finding Global assistant. How can I help you find the perfect agency or grow your business today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Format markdown helper (supports bold and bullet lists)
  const formatMessageText = (text: string) => {
    const lines = text.split("\n");

    const renderedLines = lines.map((line, i) => {
      const isBullet = line.trim().startsWith("• ");
      let content = isBullet ? line.trim().substring(2) : line;

      // Handle bold **text**
      const parts = content.split("**");
      const renderedParts = parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <strong key={index} className="font-extrabold text-obsidian dark:text-white">
              {part}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={i} className="ml-4 list-disc mt-1 text-[13px] leading-relaxed text-steel-dark dark:text-gray-300">
            {renderedParts}
          </li>
        );
      }

      return (
        <p key={i} className={i > 0 ? "mt-2 text-[13px] leading-relaxed" : "text-[13px] leading-relaxed"}>
          {renderedParts}
        </p>
      );
    });

    return <div className="space-y-1">{renderedLines}</div>;
  };

  const handleFAQClick = (faq: QAItem) => {
    // Add user message
    const userMsgId = Math.random().toString();
    const newMessages: Message[] = [
      ...messages,
      {
        id: userMsgId,
        text: faq.question,
        sender: "user",
        timestamp: new Date(),
      },
    ];
    setMessages(newMessages);
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);

      // Select 3 random other questions as suggestions
      const otherFAQs = FAQ_DATA.filter(f => f.id !== faq.id);
      const shuffled = [...otherFAQs].sort(() => 0.5 - Math.random());
      const suggestions = shuffled.slice(0, 3).map(f => f.id);

      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          text: faq.answer,
          sender: "bot",
          timestamp: new Date(),
          suggestions,
        },
      ]);
    }, 800);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const query = inputText.trim();
    setInputText("");

    // Add user message
    const userMsgId = Math.random().toString();
    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        text: query,
        sender: "user",
        timestamp: new Date(),
      },
    ]);
    setIsTyping(true);

    // Simulate search and reply
    setTimeout(() => {
      setIsTyping(false);

      // Search logic
      const normalizedQuery = query.toLowerCase();
      let bestMatch: QAItem | null = null;
      let highestScore = 0;

      for (const faq of FAQ_DATA) {
        let score = 0;

        // Exact match check
        if (faq.question.toLowerCase().includes(normalizedQuery)) {
          score += 10;
        }

        const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
        for (const word of queryWords) {
          if (faq.question.toLowerCase().includes(word)) {
            score += 3;
          }
          for (const tag of faq.tags) {
            if (tag.includes(word) || word.includes(tag)) {
              score += 2;
            }
          }
          if (faq.answer.toLowerCase().includes(word)) {
            score += 1;
          }
        }

        if (score > highestScore) {
          highestScore = score;
          bestMatch = faq;
        }
      }

      if (highestScore >= 2 && bestMatch) {
        // Show matching answer
        const matchId = bestMatch.id;
        const otherFAQs = FAQ_DATA.filter(f => f.id !== matchId);
        const shuffled = [...otherFAQs].sort(() => 0.5 - Math.random());
        const suggestions = shuffled.slice(0, 3).map(f => f.id);

        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            text: bestMatch!.answer,
            sender: "bot",
            timestamp: new Date(),
            suggestions,
          },
        ]);
      } else {
        // Default fall-back
        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            text: "I couldn't find a precise match for that question. I can only answer questions related to Finding Global. Try selecting one of the topics below or ask about: free, matching engine, verification, covered regions, or agency pricing.",
            sender: "bot",
            timestamp: new Date(),
            suggestions: FAQ_DATA.slice(0, 4).map(f => f.id),
          },
        ]);
      }
    }, 850);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const showAllTopics = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          text: "Here are all the topics I can help you with. Click one to learn more:",
          sender: "bot",
          timestamp: new Date(),
          suggestions: FAQ_DATA.map(f => f.id),
        },
      ]);
    }, 400);
  };

  // Find remaining questions that the user can ask at the very start
  const initialFAQIds = FAQ_DATA.map(f => f.id);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <div className="relative flex flex-col items-end">
          {showTooltip && (
            <div className="mb-4 relative rounded-xl bg-white px-4 pb-3 pt-8 shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-border/40 w-max max-w-[220px] animate-fade-in origin-bottom-right z-10 dark:bg-card mt-6">
              {/* Overlapping Avatars */}
              <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 items-center">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Support" className="relative z-0 h-10 w-10 rounded-full border-[3px] border-white object-cover dark:border-card" />
                <img src="https://randomuser.me/api/portraits/men/46.jpg" alt="Support" className="relative z-10 -ml-3 h-12 w-12 rounded-full border-[3px] border-white object-cover dark:border-card shadow-sm" />
                <img src="https://randomuser.me/api/portraits/men/97.jpg" alt="Support" className="relative z-0 -ml-3 h-10 w-10 rounded-full border-[3px] border-white object-cover dark:border-card" />
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="absolute top-2 right-2 rounded-full p-1 text-steel-dark hover:bg-surface hover:text-obsidian transition-colors dark:hover:text-white"
                aria-label="Close tooltip"
              >
                <X className="size-3.5" strokeWidth={2} />
              </button>
              <p className="text-[13px] font-semibold text-obsidian dark:text-gray-100 pr-5 leading-relaxed tracking-tight">
                Not sure where to start?<br />
                We can help.
              </p>
              {/* Tail pointing down */}
              <div className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-border/40 bg-white dark:bg-card"></div>
            </div>
          )}
          <button
            onClick={() => {
              setIsOpen(true);
              setShowTooltip(false);
            }}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-hyperblue text-white shadow-xl hover:bg-hyperblue/90 hover:scale-105 active:scale-95 transition-all duration-300 animate-bounce-subtle focus:outline-none"
            title="Ask FindingGlobal Bot"
          >
            {/* Notification pulse ring */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white"></span>
            </span>
            <MessageSquare className="size-6 group-hover:rotate-6 transition-transform" />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex h-[540px] w-[370px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-border/80 bg-card text-foreground shadow-elevated animate-fade-in focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-card rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="flex w-12 h-9 items-center justify-center rounded-xl bg-white border border-border/50 overflow-hidden shrink-0 p-1">
                <img
                  src="/minimallogo"
                  alt="Finding Global Logo"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-obsidian dark:text-white leading-none">FindingGlobal Bot AI</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                </div>
                <span className="text-[10px] font-semibold text-steel-dark dark:text-gray-400 mt-0.5">Finding Global Guide</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-steel hover:bg-surface-muted hover:text-obsidian dark:hover:text-white transition-colors"
              title="Close chat"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-surface-muted/30">
            {messages.map((msg, index) => {
              const isBot = msg.sender === "bot";
              return (
                <div key={msg.id} className="space-y-2.5">
                  <div className={`flex items-start gap-2.5 ${isBot ? "" : "flex-row-reverse"}`}>
                    {isBot && (
                      <div className="flex w-9 h-7 shrink-0 items-center justify-center rounded-lg bg-white border border-border/40 overflow-hidden shadow-2xs p-0.5">
                        <img
                          src="/minimallogo"
                          alt="FindingGlobal Bot"
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${isBot
                          ? "bg-card border border-border/60 text-obsidian dark:text-gray-100 rounded-tl-sm"
                          : "bg-hyperblue text-white rounded-tr-sm font-medium"
                        }`}
                    >
                      {isBot ? formatMessageText(msg.text) : <p className="text-[13px] leading-relaxed">{msg.text}</p>}
                    </div>
                  </div>

                  {/* Render Q&A suggestion chips below bot messages */}
                  {isBot && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="pl-9 pr-4 space-y-1.5 animate-fade-in">
                      <div className="text-[10px] font-bold text-steel uppercase tracking-wider mb-1 flex items-center gap-1">
                        <HelpCircle className="size-3" /> Suggested Topics:
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {msg.suggestions.map(id => {
                          const faq = FAQ_DATA.find(f => f.id === id);
                          if (!faq) return null;
                          return (
                            <button
                              key={id}
                              onClick={() => handleFAQClick(faq)}
                              className="text-left w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-semibold text-obsidian dark:text-gray-200 hover:border-hyperblue hover:bg-hyperblue/5 active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
                            >
                              {faq.question}
                            </button>
                          );
                        })}
                        {msg.suggestions.length < FAQ_DATA.length && (
                          <button
                            onClick={showAllTopics}
                            className="text-left w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-hyperblue hover:underline cursor-pointer"
                          >
                            <ArrowLeft className="size-3 rotate-90" /> See all questions
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Render initial FAQ list only for the very first welcome message */}
                  {isBot && msg.id === "welcome" && (
                    <div className="pl-9 pr-4 space-y-1.5 animate-fade-in">
                      <div className="text-[10px] font-bold text-steel uppercase tracking-wider mb-1 flex items-center gap-1">
                        <HelpCircle className="size-3" /> Select a topic to start:
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {FAQ_DATA.slice(0, 4).map(faq => (
                          <button
                            key={faq.id}
                            onClick={() => handleFAQClick(faq)}
                            className="text-left w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-semibold text-obsidian dark:text-gray-200 hover:border-hyperblue hover:bg-hyperblue/5 active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
                          >
                            {faq.question}
                          </button>
                        ))}
                        <button
                          onClick={showAllTopics}
                          className="text-left w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-hyperblue hover:underline cursor-pointer"
                        >
                          Show all topics ({FAQ_DATA.length})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2.5 animate-pulse">
                <div className="flex w-9 h-7 shrink-0 items-center justify-center rounded-lg bg-white border border-border/40 overflow-hidden shadow-2xs p-0.5">
                  <img
                    src="/minimallogo"
                    alt="FindingGlobal Bot"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 bg-card border border-border/60">
                  <div className="flex items-center gap-1 h-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-steel animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-steel animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-steel animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border/70 p-3 bg-card rounded-b-2xl">
            <div className="flex items-center gap-2 bg-surface-muted rounded-xl border border-border/60 px-3 py-1.5 focus-within:border-steel focus-within:ring-2 focus-within:ring-hyperblue/5 transition-all">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Finding Global..."
                className="flex-1 border-none bg-transparent py-1 text-sm font-medium text-obsidian dark:text-white placeholder-steel outline-none min-w-0"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 ${inputText.trim()
                    ? "bg-hyperblue text-white shadow-md hover:bg-hyperblue/90 cursor-pointer"
                    : "bg-surface text-steel cursor-not-allowed border border-border/30"
                  }`}
                title="Send message"
              >
                <Send className="size-3.5" />
              </button>
            </div>
            <div className="text-center text-[9px] font-semibold text-steel mt-2">
              FindingGlobal Bot answers using curated FAQ data
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
