import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { geminiService } from '../services/geminiService';
import { voiceAssistant } from '../services/voiceService';
import {
  CommitteeMember,
  CommitteeContribution,
  CommitteeLoan,
  CommitteeExpense,
  CommitteeTransaction,
  CommitteeAuditLog,
  CommitteeSummary,
  ExpenseCategory,
  CommitteeRole
} from '../types';
import {
  Landmark,
  Users,
  CreditCard,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Calendar,
  FileText,
  Sparkles,
  Mic,
  MicOff,
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Eye,
  Trash2,
  Printer,
  RefreshCw,
  X,
  Shield,
  Award,
  Check,
  Edit,
  DollarSign,
  Receipt,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Send
} from 'lucide-react';

type SubTab =
  | 'DASHBOARD'
  | 'MEMBERS'
  | 'FUND'
  | 'LOANS'
  | 'EXPENSES'
  | 'LEDGER'
  | 'AI_ASSISTANT'
  | 'AUDIT';

interface CommitteeScreenProps {
  onBack?: () => void;
}

export const CommitteeScreen: React.FC<CommitteeScreenProps> = ({ onBack }) => {
  const { isKannada, language } = useLanguage();
  const { currentUser } = useAuth();

  const isRealAdmin = currentUser && ['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role);
  // View as admin toggle (for authorized admins)
  const [isAdminView, setIsAdminView] = useState<boolean>(true);
  const activeIsAdmin = isRealAdmin ? isAdminView : false;

  const [activeTab, setActiveTab] = useState<SubTab>('DASHBOARD');

  // Database states
  const [summary, setSummary] = useState<CommitteeSummary>(() => dbService.getCommitteeSummary());
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [contributions, setContributions] = useState<CommitteeContribution[]>([]);
  const [loans, setLoans] = useState<CommitteeLoan[]>([]);
  const [expenses, setExpenses] = useState<CommitteeExpense[]>([]);
  const [transactions, setTransactions] = useState<CommitteeTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<CommitteeAuditLog[]>([]);

  // Subscriptions
  useEffect(() => {
    const unsubM = dbService.subscribeCommitteeMembers((data) => {
      setMembers(data);
      setSummary(dbService.getCommitteeSummary());
    });
    const unsubC = dbService.subscribeCommitteeContributions((data) => {
      setContributions(data);
      setSummary(dbService.getCommitteeSummary());
    });
    const unsubL = dbService.subscribeCommitteeLoans((data) => {
      setLoans(data);
      setSummary(dbService.getCommitteeSummary());
    });
    const unsubE = dbService.subscribeCommitteeExpenses((data) => {
      setExpenses(data);
      setSummary(dbService.getCommitteeSummary());
    });
    const unsubT = dbService.subscribeCommitteeTransactions((data) => {
      setTransactions(data);
    });
    const unsubA = dbService.subscribeCommitteeAuditLogs((data) => {
      setAuditLogs(data);
    });

    return () => {
      unsubM();
      unsubC();
      unsubL();
      unsubE();
      unsubT();
      unsubA();
    };
  }, []);

  // Filter / Search states
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Modals state
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [selectedContributionForPayment, setSelectedContributionForPayment] = useState<CommitteeContribution | null>(null);
  const [isCreateLoanModalOpen, setIsCreateLoanModalOpen] = useState(false);
  const [isRepayLoanModalOpen, setIsRepayLoanModalOpen] = useState(false);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<CommitteeLoan | null>(null);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [selectedStatementMember, setSelectedStatementMember] = useState<CommitteeMember | null>(null);

  // Form inputs
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    name_kn: '',
    phone: '',
    address: 'Muttagundi Village',
    role: 'MEMBER' as CommitteeRole
  });

  const [paymentForm, setPaymentForm] = useState({
    memberId: '',
    month: '2026-09',
    amount: 1000,
    referenceId: '',
    notes: 'Paid on time',
    receiptUrl: ''
  });

  const [loanForm, setLoanForm] = useState({
    memberId: '',
    principalAmount: 25000,
    interestRatePercent: 2,
    tenureMonths: 6,
    purpose: 'Crop cultivation & agriculture'
  });

  const [repaymentForm, setRepaymentForm] = useState({
    amount: 5000,
    referenceId: '',
    notes: 'Monthly loan installment'
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'TEMPLE' as ExpenseCategory,
    category_kn: 'ದೇವಸ್ಥಾನ ಅಭಿವೃದ್ಧಿ',
    amount: 2500,
    date: new Date().toISOString().split('T')[0],
    description: '',
    paid_by: 'Treasurer',
    receipt_url: ''
  });

  // AI Assistant states
  const [aiQuery, setAiQuery] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; time: string }>>([
    {
      role: 'ai',
      text: isKannada
        ? 'ನಮಸ್ಕಾರ! ನಾನು ಎಂಟಿಜಿ ಸಮಿತಿ AI ಆರ್ಥಿಕ ಸಹಾಯಕ. ನಿಧಿ, ಸಾಲಗಳ ಬಾಕಿ, ಬಡ್ಡಿ ಲೆಕ್ಕಾಚಾರ ಅಥವಾ ಕಮೆಂಟ್‌ಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ.'
        : 'Hello! I am the MTG Committee Financial AI Assistant. Ask me anything about village funds, active loans, interest calculations, or member dues.',
      time: 'Just now'
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiListening, setIsAiListening] = useState(false);
  const [aiInsightsText, setAiInsightsText] = useState<string>('');
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  // Receipt Scanner states
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scannedReceiptData, setScannedReceiptData] = useState<{
    amount: number;
    date: string;
    vendor: string;
    description: string;
    receipt_number: string;
    category: ExpenseCategory;
  } | null>(null);

  // Report Generator modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [generatedReportText, setGeneratedReportText] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Current logged in member identification
  const currentMemberRecord = members.find((m) => {
    if (currentUser?.uid && m.user_id === currentUser.uid) return true;
    if (currentUser?.phone && m.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')) return true;
    if (currentUser?.name && m.name.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    return false;
  });

  // Auto-generate fresh AI insights on tab open
  useEffect(() => {
    if (activeTab === 'AI_ASSISTANT' && !aiInsightsText) {
      handleGenerateInsights();
    }
  }, [activeTab]);

  const handleGenerateInsights = async () => {
    setIsInsightsLoading(true);
    try {
      const res = await geminiService.generateCommitteeInsights(language);
      setAiInsightsText(res);
    } catch {
      setAiInsightsText(isKannada ? 'ಮಾಹಿತಿ ಸಂಗ್ರಹಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ.' : 'Failed to generate insights.');
    } finally {
      setIsInsightsLoading(false);
    }
  };

  const handleSendAiMessage = async (textToSend?: string) => {
    const q = (textToSend || aiQuery).trim();
    if (!q) return;

    const userMsg = { role: 'user' as const, text: q, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setAiChatMessages((prev) => [...prev, userMsg]);
    setAiQuery('');
    setIsAiLoading(true);

    try {
      const res = await geminiService.askCommitteeAI(q, currentUser, language);
      const answer = isKannada ? res.answer_kn : res.answer_en;
      const aiMsg = { role: 'ai' as const, text: answer, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setAiChatMessages((prev) => [...prev, aiMsg]);

      // Voice read aloud if microphone was used
      if (isAiListening) {
        voiceAssistant.speak(answer, language);
      }
    } catch (err: any) {
      const errorMsg = isKannada ? 'ಕ್ಷಮಿಸಿ, ಜೆಮಿನಿ ಸಂಪರ್ಕದಲ್ಲಿ ತೊಂದರೆಯಾಗಿದೆ.' : 'Sorry, Gemini connection error. Please try again.';
      setAiChatMessages((prev) => [...prev, { role: 'ai' as const, text: errorMsg, time: 'Now' }]);
    } finally {
      setIsAiLoading(false);
      setIsAiListening(false);
    }
  };

  const stopVoiceRef = useRef<(() => void) | null>(null);

  const handleVoiceInput = () => {
    if (isAiListening) {
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
        stopVoiceRef.current = null;
      }
      setIsAiListening(false);
      return;
    }

    setIsAiListening(true);
    stopVoiceRef.current = voiceAssistant.listen(
      language,
      (transcript: string) => {
        setIsAiListening(false);
        stopVoiceRef.current = null;
        if (transcript) {
          handleSendAiMessage(transcript);
        }
      },
      (error: any) => {
        setIsAiListening(false);
        stopVoiceRef.current = null;
        console.warn('Voice error:', error);
      }
    );
  };

  // Receipt Image Upload & Gemini Vision OCR
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setReceiptImage(dataUrl);
      setIsScanningReceipt(true);
      try {
        const extracted = await geminiService.analyzeReceiptImage(dataUrl, file.type);
        setScannedReceiptData(extracted);
      } catch (err) {
        alert(isKannada ? 'ರಸೀದಿ ಸ್ಕ್ಯಾನ್ ಮಾಡುವಲ್ಲಿ ದೋಷ.' : 'Failed to scan receipt image.');
      } finally {
        setIsScanningReceipt(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Confirmed Scanned Receipt
  const handleConfirmScannedReceipt = async () => {
    if (!scannedReceiptData) return;
    try {
      await dbService.addExpense(
        {
          category: scannedReceiptData.category,
          category_kn: getCategoryKn(scannedReceiptData.category),
          amount: scannedReceiptData.amount,
          date: scannedReceiptData.date,
          description: `${scannedReceiptData.vendor}: ${scannedReceiptData.description} (Bill #${scannedReceiptData.receipt_number})`,
          paid_by: currentUser?.name || 'Treasurer',
          receipt_url: receiptImage || undefined,
          created_by: currentUser?.name || 'Admin'
        },
        currentUser?.uid || 'admin',
        currentUser?.name || 'Admin'
      );
      alert(isKannada ? '✅ ರಸೀದಿ ಪರಿಶೀಲಿಸಿ ವೆಚ್ಚವಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ!' : '✅ Receipt confirmed & saved as expense successfully!');
      setReceiptImage(null);
      setScannedReceiptData(null);
      setActiveTab('EXPENSES');
    } catch (err: any) {
      alert(err.message || 'Failed to save expense');
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setIsReportModalOpen(true);
    try {
      const report = await geminiService.generateCommitteeReport(selectedMonth, undefined, undefined, language);
      setGeneratedReportText(report);
    } catch {
      setGeneratedReportText(isKannada ? 'ವರದಿ ರಚಿಸುವಲ್ಲಿ ದೋಷ.' : 'Failed to generate report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getCategoryKn = (cat: ExpenseCategory): string => {
    switch (cat) {
      case 'TEMPLE': return 'ದೇವಸ್ಥಾನ ಅಭಿವೃದ್ಧಿ';
      case 'ELECTRICITY': return 'ವಿದ್ಯುತ್ & ಬೀದಿದೀಪ';
      case 'FESTIVAL': return 'ಗ್ರಾಮ ಹಬ್ಬ & ಸಾಂಸ್ಕೃತಿಕ';
      case 'WATER_SANITATION': return 'ಕುಡಿಯುವ ನೀರು & ನೈರ್ಮಲ್ಯ';
      case 'ADMINISTRATION': return 'ಆಡಳಿತ & ಸಭೆ ಖರ್ಚು';
      case 'SPORTS': return 'ಕ್ರೀಡಾ ಪ್ರೋತ್ಸಾಹ';
      default: return 'ಇತರ ಸಾಮಾನ್ಯ ವೆಚ್ಚ';
    }
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    if (memberRoleFilter !== 'ALL' && m.role !== memberRoleFilter) return false;
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q) || (m.name_kn && m.name_kn.toLowerCase().includes(q));
      const matchPhone = m.phone.includes(q);
      if (!matchName && !matchPhone) return false;
    }
    return true;
  });

  // Filtered ledger transactions
  const filteredTransactions = transactions.filter((t) => {
    if (ledgerTypeFilter !== 'ALL' && t.type !== ledgerTypeFilter) return false;
    if (ledgerSearch.trim()) {
      const q = ledgerSearch.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q) || t.type_kn.toLowerCase().includes(q);
      const matchMember = t.member_name ? t.member_name.toLowerCase().includes(q) : false;
      const matchRef = t.reference_id ? t.reference_id.toLowerCase().includes(q) : false;
      if (!matchDesc && !matchMember && !matchRef) return false;
    }
    return true;
  });

  return (
    <div className="container" style={{ padding: '24px 16px 80px', maxWidth: '1080px' }}>
      {/* 🏛️ MODULE BANNER & HEADER */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    padding: '8px',
                    color: '#CBD5E1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '4px'
                  }}
                  title={isKannada ? 'ಹಿಂದಕ್ಕೆ' : 'Back'}
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  padding: '8px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Landmark size={24} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                    {isKannada ? '🏛️ ಎಂಟಿಜಿ ಸಮಿತಿ' : '🏛️ MTG COMMITTEE'}
                  </h1>
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid #F59E0B',
                      color: '#FEF08A',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={11} /> GEMINI AI
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#CBD5E1', margin: '2px 0 0', fontWeight: 600 }}>
                  {isKannada
                    ? 'ನಿಧಿ • ಸಾಲಗಳು • ಬಡ್ಡಿ ಲೆಕ್ಕಾಚಾರ • ಸದಸ್ಯರು • ಜೆಮಿನಿ ಆರ್ಥಿಕ AI'
                    : 'Fund • Loans • Interest • Members • Gemini Financial AI'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Badges / Admin Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {isRealAdmin && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  padding: '4px 6px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAdminView(true)}
                  style={{
                    background: isAdminView ? '#10B981' : 'transparent',
                    color: isAdminView ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  👑 {isKannada ? 'ಅಡ್ಮಿನ್ ವ್ಯೂ' : 'Admin View'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminView(false)}
                  style={{
                    background: !isAdminView ? '#3B82F6' : 'transparent',
                    color: !isAdminView ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  👤 {isKannada ? 'ಸದಸ್ಯರ ವ್ಯೂ' : 'Member View'}
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveTab('AI_ASSISTANT')}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '8px 16px',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Sparkles size={15} />
              <span>{isKannada ? '✨ Ask MTG AI' : '✨ Ask MTG AI'}</span>
            </button>

            {activeIsAdmin && (
              <button
                onClick={handleGenerateReport}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 14px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FileText size={15} />
                <span>{isKannada ? 'ಆರ್ಥಿಕ ವರದಿ' : 'AI Report'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Member View Notification Banner if logged-in resident */}
        {!activeIsAdmin && currentMemberRecord && (
          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} color="#60A5FA" />
              <span style={{ fontSize: '0.82rem', color: '#BFDBFE' }}>
                {isKannada ? 'ಸ್ವಾಗತ' : 'Welcome'}, <strong>{currentMemberRecord.name}</strong> ({currentMemberRecord.role_kn || currentMemberRecord.role}) • {isKannada ? 'ಒಟ್ಟು ಕೊಡುಗೆ' : 'Total Contributed'}: <strong>₹{currentMemberRecord.total_contributed.toLocaleString()}</strong>
              </span>
            </div>
            <button
              onClick={() => setSelectedStatementMember(currentMemberRecord)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {isKannada ? 'ನನ್ನ ಲೆಕ್ಕಪತ್ರ ನೋಡಿ' : 'My Statement'} →
            </button>
          </div>
        )}
      </div>

      {/* 💰 TOP 6 FINANCIAL SUMMARY CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '14px',
          marginBottom: '24px'
        }}
      >
        {/* Card 1: Available Balance */}
        <div
          className="glass-card card-3d"
          style={{
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.08) 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.4)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#86EFAC', fontWeight: 700 }}>
              {isKannada ? '💵 ಲಭ್ಯವಿರುವ ನಿಧಿ ಬಾಕಿ' : '💵 Available Balance'}
            </span>
            <DollarSign size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            ₹{summary.availableBalance.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {isKannada ? 'ಬ್ಯಾಂಕ್ & ನಗದು ಲಭ್ಯ' : 'Net Cash & Bank'}
          </span>
        </div>

        {/* Card 2: Total Fund Collected */}
        <div
          className="glass-card card-3d"
          style={{ padding: '16px', border: '1px solid var(--glass-border)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isKannada ? '💰 ಒಟ್ಟು ನಿಧಿ ಸಂಗ್ರಹ' : '💰 Total Fund'}
            </span>
            <Users size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38BDF8' }}>
            ₹{summary.totalFundCollected.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {summary.activeMembersCount} {isKannada ? 'ಸಕ್ರಿಯ ಸದಸ್ಯರು' : 'Active Members'}
          </span>
        </div>

        {/* Card 3: Active Loans */}
        <div
          className="glass-card card-3d"
          style={{ padding: '16px', border: '1px solid var(--glass-border)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isKannada ? '🏦 ಸಕ್ರಿಯ ಸಾಲಗಳು' : '🏦 Active Loans'}
            </span>
            <CreditCard size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FBBF24' }}>
            {summary.activeLoansCount}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {isKannada ? 'ಸದಸ್ಯರ ಮೈಕ್ರೋ ಸಾಲಗಳು' : 'Member Micro-Loans'}
          </span>
        </div>

        {/* Card 4: Outstanding Loan Amount */}
        <div
          className="glass-card card-3d"
          style={{ padding: '16px', border: '1px solid var(--glass-border)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isKannada ? '💳 ಬಾಕಿ ಸಾಲ ಮೊತ್ತ' : '💳 Outstanding'}
            </span>
            <Clock size={16} color="#EC4899" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#F472B6' }}>
            ₹{summary.outstandingLoanAmount.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {isKannada ? 'ಅಸಲು + ಬಡ್ಡಿ ಬಾಕಿ' : 'Principal + Interest'}
          </span>
        </div>

        {/* Card 5: Interest Earned */}
        <div
          className="glass-card card-3d"
          style={{ padding: '16px', border: '1px solid var(--glass-border)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isKannada ? '📈 ಗಳಿಸಿದ ಬಡ್ಡಿ' : '📈 Interest Earned'}
            </span>
            <TrendingUp size={16} color="#A855F7" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#C084FC' }}>
            ₹{summary.interestEarned.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {isKannada ? '2% ಮಾಸಿಕ ಬಡ್ಡಿ ನಿವ್ವಳ' : '2%/mo Simple Interest'}
          </span>
        </div>

        {/* Card 6: Total Expenses */}
        <div
          className="glass-card card-3d"
          style={{ padding: '16px', border: '1px solid var(--glass-border)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isKannada ? '💸 ಒಟ್ಟು ವೆಚ್ಚಗಳು' : '💸 Total Expenses'}
            </span>
            <ArrowDownRight size={16} color="#EF4444" />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#F87171' }}>
            ₹{summary.totalExpenses.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {expenses.length} {isKannada ? 'ದಾಖಲಾದ ವೆಚ್ಚಗಳು' : 'Expenses Vouched'}
          </span>
        </div>
      </div>

      {/* 🧭 NAVIGATION TABS */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--glass-border)',
          scrollbarWidth: 'none'
        }}
      >
        {[
          { id: 'DASHBOARD', label_en: 'Dashboard', label_kn: 'ಅವಲೋಕನ', icon: Landmark },
          { id: 'MEMBERS', label_en: 'Members', label_kn: 'ಸದಸ್ಯರು', icon: Users, badge: members.length },
          { id: 'FUND', label_en: 'Monthly Fund', label_kn: 'ಮಾಸಿಕ ನಿಧಿ', icon: DollarSign, badge: summary.pendingContributionsCount > 0 ? `${summary.pendingContributionsCount} Due` : undefined },
          { id: 'LOANS', label_en: 'Loans & Interest', label_kn: 'ಸಾಲಗಳು & ಬಡ್ಡಿ', icon: CreditCard, badge: summary.activeLoansCount },
          { id: 'EXPENSES', label_en: 'Expenses', label_kn: 'ವೆಚ್ಚಗಳು', icon: ArrowDownRight },
          { id: 'LEDGER', label_en: 'Ledger', label_kn: 'ಲೆಡ್ಜರ್', icon: FileText },
          { id: 'AI_ASSISTANT', label_en: 'Ask MTG AI', label_kn: 'ಜೆಮಿನಿ AI', icon: Sparkles, special: true },
          { id: 'AUDIT', label_en: 'Audit Logs', label_kn: 'ಆಡಿಟ್ ಲಾಗ್', icon: Shield }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SubTab)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: isActive
                  ? '1.5px solid #10B981'
                  : tab.special
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid var(--glass-border)',
                background: isActive
                  ? 'rgba(16, 185, 129, 0.18)'
                  : tab.special
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(255,255,255,0.03)',
                color: isActive ? '#34D399' : tab.special ? '#FEF08A' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} color={isActive ? '#34D399' : tab.special ? '#F59E0B' : 'currentColor'} />
              <span>{isKannada ? tab.label_kn : tab.label_en}</span>
              {tab.badge && (
                <span
                  style={{
                    background: tab.id === 'FUND' && summary.pendingContributionsCount > 0 ? '#EF4444' : 'rgba(255,255,255,0.12)',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.68rem',
                    fontWeight: 800
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 📊 TAB 1: DASHBOARD OVERVIEW                             */}
      {/* ======================================================== */}
      {activeTab === 'DASHBOARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Collection Progress Strip */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? '📅 ಪ್ರಸ್ತುತ ತಿಂಗಳ ನಿಧಿ ಸಂಗ್ರಹ ಪ್ರಗತಿ (ಸೆಪ್ಟೆಂಬರ್ ೨೦೨೬)' : '📅 Current Month Collection Progress (September 2026)'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isKannada
                    ? `ಗುರಿ: ₹${summary.monthlyTarget.toLocaleString()} • ಸಂಗ್ರಹವಾಗಿದೆ: ₹${(summary.monthlyTarget - summary.pendingContributionsAmount).toLocaleString()} • ಬಾಕಿ: ₹${summary.pendingContributionsAmount.toLocaleString()}`
                    : `Target: ₹${summary.monthlyTarget.toLocaleString()} • Collected: ₹${(summary.monthlyTarget - summary.pendingContributionsAmount).toLocaleString()} • Pending: ₹${summary.pendingContributionsAmount.toLocaleString()}`}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  color: summary.pendingContributionsCount === 0 ? '#10B981' : '#F59E0B'
                }}
              >
                {summary.monthlyTarget > 0 ? Math.round(((summary.monthlyTarget - summary.pendingContributionsAmount) / summary.monthlyTarget) * 100) : 100}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${summary.monthlyTarget > 0 ? Math.min(100, Math.round(((summary.monthlyTarget - summary.pendingContributionsAmount) / summary.monthlyTarget) * 100)) : 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                  borderRadius: '5px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>

          {/* Quick Actions Grid for Admins */}
          {activeIsAdmin && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}
            >
              <button
                onClick={() => {
                  setSelectedContributionForPayment(null);
                  setIsRecordPaymentModalOpen(true);
                }}
                className="btn-primary"
                style={{ justifyContent: 'center', height: '46px', fontSize: '0.85rem' }}
              >
                <Plus size={16} />
                <span>{isKannada ? 'ನಿಧಿ ಪಾವತಿ ದಾಖಲಿಸಿ' : 'Record Member Fund'}</span>
              </button>

              <button
                onClick={() => setIsCreateLoanModalOpen(true)}
                className="btn-gold"
                style={{ justifyContent: 'center', height: '46px', fontSize: '0.85rem' }}
              >
                <CreditCard size={16} />
                <span>{isKannada ? 'ಹೊಸ ಸಾಲ ನೀಡಿ' : 'Issue New Loan'}</span>
              </button>

              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="btn-secondary"
                style={{ justifyContent: 'center', height: '46px', fontSize: '0.85rem' }}
              >
                <ArrowDownRight size={16} />
                <span>{isKannada ? 'ಹೊಸ ವೆಚ್ಚ ದಾಖಲಿಸಿ' : 'Record Expense'}</span>
              </button>

              <button
                onClick={() => setActiveTab('AI_ASSISTANT')}
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1.5px solid #F59E0B',
                  color: '#FEF08A',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Camera size={16} />
                <span>{isKannada ? '📸 ರಸೀದಿ ಸ್ಕ್ಯಾನ್' : '📸 AI Receipt Scan'}</span>
              </button>
            </div>
          )}

          {/* Pending Dues Warning Alert */}
          {summary.pendingContributionsCount > 0 && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color="#EF4444" />
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FCA5A5', margin: 0 }}>
                    {isKannada ? 'ಬಾಕಿ ನಿಧಿ ಸಂಗ್ರಹ ಸೂಚನೆ' : 'Pending Contributions Alert'}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#CBD5E1', margin: '2px 0 0' }}>
                    {isKannada
                      ? `ಈ ತಿಂಗಳು ${summary.pendingContributionsCount} ಸದಸ್ಯರ ₹${summary.pendingContributionsAmount.toLocaleString()} ಮಾಸಿಕ ನಿಧಿ ಪಾವತಿಯಾಗಬೇಕಿದೆ.`
                      : `${summary.pendingContributionsCount} members have pending contributions of ₹${summary.pendingContributionsAmount.toLocaleString()} this month.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('FUND')}
                style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {isKannada ? 'ಬಾಕಿ ಪಟ್ಟಿ ನೋಡಿ' : 'View Pending'} →
              </button>
            </div>
          )}

          {/* Visual Financial Charts Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Chart 1: Expense Distribution */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ArrowDownRight size={18} color="#F87171" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? 'ವೆಚ್ಚಗಳ ವಿಭಾಗವಾರು ಹಂಚಿಕೆ' : 'Expense Category Breakdown'}
                </h4>
              </div>

              {expenses.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No expenses recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {expenses.slice(0, 5).map((exp) => (
                    <div key={exp.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                        <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{isKannada ? exp.category_kn : exp.category}</span>
                        <strong style={{ color: '#F87171' }}>₹{exp.amount.toLocaleString()}</strong>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, Math.round((exp.amount / Math.max(1, summary.totalExpenses)) * 100))}%`,
                            height: '100%',
                            background: '#EF4444',
                            borderRadius: '3px'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chart 2: Active Loan Portfolio */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <CreditCard size={18} color="#FBBF24" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? 'ಸಾಲಗಳ ಸ್ಥಿತಿ & ಮರುಪಾವತಿ' : 'Active Loan Status'}
                </h4>
              </div>

              {loans.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No loans issued yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {loans.slice(0, 4).map((l) => (
                    <div
                      key={l.id}
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>{l.member_name}</strong>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: l.status === 'FULLY_PAID' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: l.status === 'FULLY_PAID' ? '#34D399' : '#FBBF24',
                            fontWeight: 700
                          }}
                        >
                          {l.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span>{l.loan_number} • {l.purpose}</span>
                        <span>{isKannada ? 'ಬಾಕಿ' : 'Rem'}: ₹{(l.remaining_principal + l.remaining_interest).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Ledger Activity */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#10B981" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? 'ಇತ್ತೀಚಿನ ಆರ್ಥಿಕ ಚಟುವಟಿಕೆಗಳು' : 'Recent Financial Transactions'}
                </h4>
              </div>
              <button
                onClick={() => setActiveTab('LEDGER')}
                style={{ background: 'none', border: 'none', color: '#10B981', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                {isKannada ? 'ಪೂರ್ಣ ಲೆಡ್ಜರ್' : 'View Full Ledger'} →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: t.direction === 'IN' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: t.direction === 'IN' ? '#10B981' : '#EF4444'
                      }}
                    >
                      {t.direction === 'IN' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                        {isKannada ? t.type_kn : t.type.replace('_', ' ')}
                      </h5>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {t.date} • {t.description}
                      </span>
                    </div>
                  </div>

                  <strong
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: t.direction === 'IN' ? '#34D399' : '#F87171'
                    }}
                  >
                    {t.direction === 'IN' ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 👥 TAB 2: MEMBERS DIRECTORY                              */}
      {/* ======================================================== */}
      {activeTab === 'MEMBERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Members Filter & Add Button Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  flex: 1
                }}
              >
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={isKannada ? 'ಸದಸ್ಯರ ಹೆಸರು ಅಥವಾ ಫೋನ್ ಹುಡುಕಿ...' : 'Search member by name or phone...'}
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '0.85rem', width: '100%', outline: 'none' }}
                />
              </div>

              <select
                value={memberRoleFilter}
                onChange={(e) => setMemberRoleFilter(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              >
                <option value="ALL" style={{ background: '#0F172A' }}>{isKannada ? 'ಎಲ್ಲಾ ಹುದ್ದೆಗಳು' : 'All Roles'}</option>
                <option value="PRESIDENT" style={{ background: '#0F172A' }}>President / ಅಧ್ಯಕ್ಷರು</option>
                <option value="VICE_PRESIDENT" style={{ background: '#0F172A' }}>Vice President / ಉಪಾಧ್ಯಕ್ಷರು</option>
                <option value="SECRETARY" style={{ background: '#0F172A' }}>Secretary / ಕಾರ್ಯದರ್ಶಿ</option>
                <option value="TREASURER" style={{ background: '#0F172A' }}>Treasurer / ಖಜಾಂಚಿ</option>
                <option value="DIRECTOR" style={{ background: '#0F172A' }}>Director / ನಿರ್ದೇಶಕರು</option>
                <option value="MEMBER" style={{ background: '#0F172A' }}>Member / ಸದಸ್ಯರು</option>
              </select>
            </div>

            {activeIsAdmin && (
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="btn-primary"
                style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} />
                <span>{isKannada ? 'ಹೊಸ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ' : 'Add Member'}</span>
              </button>
            )}
          </div>

          {/* Members Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredMembers.map((m) => (
              <div
                key={m.id}
                className="glass-card card-3d"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={m.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`}
                    alt={m.name}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--accent-emerald)',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                        {isKannada && m.name_kn ? m.name_kn : m.name}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: m.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: m.status === 'ACTIVE' ? '#34D399' : '#F87171',
                          fontWeight: 700
                        }}
                      >
                        {m.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>
                      {isKannada && m.role_kn ? m.role_kn : m.role}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      📞 {activeIsAdmin || m.id === currentMemberRecord?.id ? m.phone : m.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2')}
                    </span>
                  </div>
                </div>

                {/* Financial Summary Strip for Member */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.03)',
                    textAlign: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isKannada ? 'ಒಟ್ಟು ನಿಧಿ' : 'Total Fund'}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: '#10B981' }}>
                      ₹{m.total_contributed.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isKannada ? 'ಸಾಲ' : 'Loans'}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: '#F59E0B' }}>
                      {m.active_loans_count}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isKannada ? 'ಬಾಕಿ' : 'Outstanding'}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: m.outstanding_loan_balance > 0 ? '#EF4444' : '#94A3B8' }}>
                      ₹{m.outstanding_loan_balance.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Member action buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedStatementMember(m)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-emerald)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={13} />
                    <span>{isKannada ? 'ಲೆಕ್ಕಪತ್ರ ನೋಡಿ' : 'Statement'}</span>
                  </button>

                  {activeIsAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          await dbService.toggleMemberStatus(m.id, currentUser?.uid || 'admin', currentUser?.name || 'Admin');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: m.status === 'ACTIVE' ? '#F87171' : '#34D399',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {m.status === 'ACTIVE' ? (isKannada ? 'ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ' : 'Deactivate') : (isKannada ? 'ಸಕ್ರಿಯಗೊಳಿಸಿ' : 'Activate')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 💰 TAB 3: MONTHLY FUND MANAGEMENT                        */}
      {/* ======================================================== */}
      {activeTab === 'FUND' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Month Selector Bar */}
          <div
            className="glass-card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} color="#10B981" />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? 'ಮಾಸಿಕ ವಂತಿಗೆ ಪರಿಶೀಲನೆ' : 'Monthly Contribution Tracker'}
                </h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {isKannada ? 'ಪ್ರತಿ ಸದಸ್ಯರಿಗೆ ಮಾಸಿಕ ನಿಗದಿಪಡಿಸಿದ ವಂತಿಗೆ: ₹1,000' : 'Mandatory Monthly Contribution: ₹1,000 per member'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              >
                <option value="2026-09" style={{ background: '#0F172A' }}>September 2026 (ಸೆಪ್ಟೆಂಬರ್ ೨೦೨೬)</option>
                <option value="2026-08" style={{ background: '#0F172A' }}>August 2026 (ಆಗಸ್ಟ್ ೨೦೨೬)</option>
                <option value="2026-07" style={{ background: '#0F172A' }}>July 2026 (ಜುಲೈ ೨೦೨೬)</option>
              </select>

              {activeIsAdmin && (
                <button
                  onClick={() => {
                    setSelectedContributionForPayment(null);
                    setIsRecordPaymentModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                >
                  <Plus size={14} />
                  <span>{isKannada ? 'ಪಾವತಿ ದಾಖಲಿಸಿ' : 'Record Payment'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Members Monthly Contribution Status Table */}
          <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ಸದಸ್ಯರು' : 'Member'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ತಿಂಗಳು' : 'Month'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ನಿಗದಿ' : 'Target'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ಪಾವತಿಸಿದ ಮೊತ್ತ' : 'Paid'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ಸ್ಥಿತಿ' : 'Status'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ರೆಫರೆನ್ಸ್ / ದಿನಾಂಕ' : 'Ref / Date'}</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>{isKannada ? 'ಕ್ರಮ' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((mem) => {
                  const contrib = contributions.find((c) => c.member_id === mem.id && c.month === selectedMonth);
                  const isPaid = contrib && contrib.status === 'PAID';

                  return (
                    <tr
                      key={mem.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#10B981',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem'
                            }}
                          >
                            {mem.name.charAt(0)}
                          </div>
                          <div>
                            <strong style={{ color: '#FFFFFF', display: 'block' }}>{mem.name}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{mem.role}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{selectedMonth}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>₹1,000</td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: isPaid ? '#10B981' : '#F87171' }}>
                        ₹{contrib ? contrib.amount_paid.toLocaleString() : 0}
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isPaid ? '#34D399' : '#F87171',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          {isPaid ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {isPaid ? (isKannada ? 'ಪಾವತಿಸಲಾಗಿದೆ (Paid)' : 'Paid') : (isKannada ? 'ಬಾಕಿ (Pending)' : 'Pending')}
                        </span>
                      </td>

                      <td style={{ padding: '12px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {contrib && isPaid ? `${contrib.reference_id || 'Cash'} (${contrib.payment_date})` : '—'}
                      </td>

                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        {activeIsAdmin && !isPaid && (
                          <button
                            onClick={() => {
                              setSelectedContributionForPayment(contrib || null);
                              setPaymentForm((prev) => ({ ...prev, memberId: mem.id, month: selectedMonth, amount: 1000 }));
                              setIsRecordPaymentModalOpen(true);
                            }}
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                          >
                            {isKannada ? 'ಸ್ವೀಕರಿಸಿ' : 'Collect'}
                          </button>
                        )}
                        {isPaid && (
                          <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
                            {isKannada ? 'ದಾಖಲಾಗಿದೆ ✓' : 'Recorded ✓'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🏦 TAB 4: LOANS & INTEREST MANAGEMENT                     */}
      {/* ======================================================== */}
      {activeTab === 'LOANS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header & Issue Loan CTA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? 'ಸದಸ್ಯರ ಸಾಲ & ಪಾರದರ್ಶಕ ಬಡ್ಡಿ ನಿರ್ವಹಣೆ' : 'Member Loans & Transparent Interest'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {isKannada
                  ? 'ತಿಂಗಳಿಗೆ 2% ಸರಳ ಬಡ್ಡಿ • ಸಕಾಲಿಕ ಕಂತು ಮರುಪಾವತಿ • ಅಪ್ಲಿಕೇಶನ್ ಅಧಿಕೃತ ಲೆಕ್ಕಾಚಾರ'
                  : '2% monthly simple interest • Verified application formula • Repayment ledger'}
              </p>
            </div>

            {activeIsAdmin && (
              <button
                onClick={() => setIsCreateLoanModalOpen(true)}
                className="btn-gold"
                style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} />
                <span>{isKannada ? 'ಹೊಸ ಸಾಲ ಮಂಜೂರು ಮಾಡಿ' : 'Issue New Loan'}</span>
              </button>
            )}
          </div>

          {/* Active Loans Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="glass-card card-3d"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: loan.status === 'FULLY_PAID' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 800 }}>
                      {loan.loan_number}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '2px 0', color: '#FFFFFF' }}>
                      {loan.member_name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {loan.purpose}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: loan.status === 'FULLY_PAID' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: loan.status === 'FULLY_PAID' ? '#34D399' : '#FBBF24'
                    }}
                  >
                    {loan.status}
                  </span>
                </div>

                {/* Financial breakdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isKannada ? 'ಮಂಜೂರಾದ ಅಸಲು' : 'Principal Amount'}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>
                      ₹{loan.principal_amount.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isKannada ? 'ಬಡ್ಡಿ ದರ' : 'Interest Rate'}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: '#F59E0B' }}>
                      {loan.interest_rate_percent}% / {isKannada ? 'ತಿಂಗಳಿಗೆ' : 'mo'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isKannada ? 'ಪಾವತಿಸಿದ ಮೊತ್ತ' : 'Amount Repaid'}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: '#10B981' }}>
                      ₹{loan.amount_paid.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isKannada ? 'ಉಳಿದ ಬಾಕಿ' : 'Remaining Balance'}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: (loan.remaining_principal + loan.remaining_interest) > 0 ? '#EF4444' : '#10B981' }}>
                      ₹{(loan.remaining_principal + loan.remaining_interest).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>{isKannada ? 'ಗಡುವು ದಿನಾಂಕ' : 'Due Date'}: {loan.due_date}</span>
                  <span>{loan.repayments?.length || 0} {isKannada ? 'ಕಂತುಗಳು ಪಾವತಿ' : 'installments'}</span>
                </div>

                {/* Repayment Action */}
                {activeIsAdmin && loan.status !== 'FULLY_PAID' && (
                  <button
                    onClick={() => {
                      setSelectedLoanForRepay(loan);
                      setRepaymentForm((prev) => ({ ...prev, amount: loan.monthly_due_amount || 5000 }));
                      setIsRepayLoanModalOpen(true);
                    }}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
                  >
                    <span>{isKannada ? 'ಕಂತು ಮರುಪಾವತಿ ದಾಖಲಿಸಿ' : 'Record Repayment'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Transparent Interest Formula Card */}
          <div
            className="glass-card"
            style={{
              padding: '16px 20px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)'
            }}
          >
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FEF08A', margin: '0 0 6px' }}>
              💡 {isKannada ? 'ಪಾರದರ್ಶಕ ಬಡ್ಡಿ ಲೆಕ್ಕಾಚಾರ ನಿಯಮಾವಳಿ:' : 'Transparent Interest Calculation Formula:'}
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#E2E8F0', margin: 0, lineHeight: 1.6 }}>
              {isKannada
                ? 'ಸಮಿತಿಯ ಸಾಲಗಳಿಗೆ ಮಾಸಿಕ 2% ಸರಳ ಬಡ್ಡಿ (Simple Monthly Interest) ಅನ್ವಯವಾಗುತ್ತದೆ. ಸೂತ್ರ: ಒಟ್ಟು ಬಡ್ಡಿ = ಅಸಲು × 2% × ಸಾಲದ ಅವಧಿ (ತಿಂಗಳುಗಳಲ್ಲಿ). ಉದಾಹರಣೆಗೆ ₹50,000 ಸಾಲಕ್ಕೆ ತಿಂಗಳಿಗೆ ₹1,000 ರಂತೆ 6 ತಿಂಗಳಿಗೆ ಒಟ್ಟು ಬಡ್ಡಿ ₹6,000 ಆಗಿರುತ್ತದೆ.'
                : 'Committee loans apply a standard 2% simple monthly interest. Formula: Total Interest = Principal × 2% × Tenure (Months). Example: For ₹50,000 over 6 months, monthly interest is ₹1,000, total interest is ₹6,000.'}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 💸 TAB 5: EXPENSE MANAGEMENT                             */}
      {/* ======================================================== */}
      {activeTab === 'EXPENSES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? 'ಸಮಿತಿ ವೆಚ್ಚಗಳು & ರಸೀದಿಗಳು' : 'Committee Expenses & Vouchers'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {isKannada ? `ಒಟ್ಟು ವೆಚ್ಚ: ₹${summary.totalExpenses.toLocaleString()}` : `Total Expenses: ₹${summary.totalExpenses.toLocaleString()}`}
              </p>
            </div>

            {activeIsAdmin && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setIsAddExpenseModalOpen(true)}
                  className="btn-primary"
                  style={{ fontSize: '0.82rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} />
                  <span>{isKannada ? 'ವೆಚ್ಚ ದಾಖಲಿಸಿ' : 'Add Expense'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Expenses List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="glass-card card-3d"
                style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#F87171',
                      fontWeight: 700
                    }}
                  >
                    {isKannada ? exp.category_kn : exp.category}
                  </span>
                  <strong style={{ fontSize: '1.15rem', fontWeight: 900, color: '#F87171' }}>
                    ₹{exp.amount.toLocaleString()}
                  </strong>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#FFFFFF', margin: 0, fontWeight: 600 }}>
                  {exp.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>📅 {exp.date}</span>
                  <span>👤 {isKannada ? 'ಪಾವತಿಸಿದವರು' : 'Paid by'}: {exp.paid_by}</span>
                </div>

                {exp.receipt_url && (
                  <div style={{ marginTop: '4px' }}>
                    <a
                      href={exp.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.72rem', color: '#38BDF8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Receipt size={12} /> {isKannada ? 'ರಸೀದಿ ಫೋಟೋ ವೀಕ್ಷಿಸಿ' : 'View Receipt Proof'}
                    </a>
                  </div>
                )}

                {activeIsAdmin && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(isKannada ? 'ಈ ವೆಚ್ಚವನ್ನು ರದ್ದುಗೊಳಿಸಲು ಖಚಿತವೇ?' : 'Delete this expense?')) {
                          await dbService.deleteExpense(exp.id, currentUser?.uid || 'admin', currentUser?.name || 'Admin');
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={12} />
                      <span>{isKannada ? 'ಅಳಿಸಿ' : 'Delete'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📜 TAB 6: TRANSACTION LEDGER                             */}
      {/* ======================================================== */}
      {activeTab === 'LEDGER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Ledger Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  flex: 1
                }}
              >
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={isKannada ? 'ವಿವರ, ಸದಸ್ಯ ಅಥವಾ ರೆಫರೆನ್ಸ್ ಹುಡುಕಿ...' : 'Search ledger by description or reference...'}
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '0.85rem', width: '100%', outline: 'none' }}
                />
              </div>

              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              >
                <option value="ALL" style={{ background: '#0F172A' }}>{isKannada ? 'ಎಲ್ಲಾ ವಹಿವಾಟುಗಳು' : 'All Transactions'}</option>
                <option value="FUND_CONTRIBUTION" style={{ background: '#0F172A' }}>Fund Contribution / ವಂತಿಗೆ</option>
                <option value="LOAN_ISSUED" style={{ background: '#0F172A' }}>Loan Issued / ಸಾಲ ಮಂಜೂರು</option>
                <option value="LOAN_REPAYMENT" style={{ background: '#0F172A' }}>Loan Repayment / ಸಾಲ ಮರುಪಾವತಿ</option>
                <option value="INTEREST_PAYMENT" style={{ background: '#0F172A' }}>Interest / ಬಡ್ಡಿ</option>
                <option value="EXPENSE" style={{ background: '#0F172A' }}>Expense / ವೆಚ್ಚ</option>
              </select>
            </div>
          </div>

          {/* Complete Ledger Table */}
          <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ದಿನಾಂಕ & ಸಮಯ' : 'Date & Time'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ವಹಿವಾಟು ಪ್ರಕಾರ' : 'Type'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ಸದಸ್ಯರು' : 'Member'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ವಿವರ' : 'Description'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ರೆಫರೆನ್ಸ್' : 'Reference'}</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>{isKannada ? 'ಮೊತ್ತ' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr
                    key={t.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.82rem' }}
                  >
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>
                      {t.date} <span style={{ fontSize: '0.7rem' }}>{t.time}</span>
                    </td>

                    <td style={{ padding: '12px 10px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: t.direction === 'IN' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: t.direction === 'IN' ? '#34D399' : '#F87171',
                          fontWeight: 700
                        }}
                      >
                        {isKannada ? t.type_kn : t.type.replace('_', ' ')}
                      </span>
                    </td>

                    <td style={{ padding: '12px 10px', fontWeight: 600, color: '#FFFFFF' }}>
                      {t.member_name || '—'}
                    </td>

                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                      {t.description}
                    </td>

                    <td style={{ padding: '12px 10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {t.reference_id || '—'}
                    </td>

                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', color: t.direction === 'IN' ? '#34D399' : '#F87171' }}>
                      {t.direction === 'IN' ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🤖 TAB 7: GEMINI AI ASSISTANT & RECEIPT SCANNER           */}
      {/* ======================================================== */}
      {activeTab === 'AI_ASSISTANT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* AI Insights Card */}
          <div
            className="glass-card"
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#F59E0B" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FEF08A' }}>
                  {isKannada ? '✨ ಜೆಮಿನಿ ಆರ್ಥಿಕ ಮುನ್ನೋಟ (AI Insights)' : '✨ Gemini Financial Insights'}
                </h3>
              </div>
              <button
                onClick={handleGenerateInsights}
                disabled={isInsightsLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#F59E0B',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={12} className={isInsightsLoading ? 'spin' : ''} />
                <span>{isKannada ? 'ನವೀಕರಿಸಿ' : 'Refresh'}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#E2E8F0', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {isInsightsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B' }}>
                  <RefreshCw size={14} className="spin" />
                  <span>{isKannada ? 'ಜೆಮಿನಿ ಲೈವ್ ವಿಶ್ಲೇಷಣೆ ಮಾಡುತ್ತಿದೆ...' : 'Gemini analyzing live database...'}</span>
                </div>
              ) : (
                aiInsightsText || (isKannada ? 'ಆರ್ಥಿಕ ಮುನ್ನೋಟ ಸಿದ್ಧವಾಗಿದೆ.' : 'Financial insights ready.')
              )}
            </div>
          </div>

          {/* AI Receipt Scanner Section (Admin Confirmed Flow) */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Camera size={18} color="#38BDF8" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? '📸 AI ರಸೀದಿ ಸ್ಕ್ಯಾನರ್ (Gemini Vision OCR)' : '📸 AI Receipt Scanner (Gemini Vision OCR)'}
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
              {isKannada
                ? 'ರಸೀದಿ ಅಥವಾ ಬಿಲ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ಜೆಮಿನಿ AI ಮೊತ್ತ, ದಿನಾಂಕ, ಅಂಗಡಿ ಹಾಗೂ ವಿವರವನ್ನು ಹೊರತೆಗೆಯುತ್ತದೆ. ಪರಿಶೀಲಿಸಿದ ನಂತರವೇ ದತ್ತಾಂಶ ಸೇವ್ ಆಗುತ್ತದೆ.'
                : 'Upload an expense receipt or bill image. Gemini Vision extracts amount, vendor, date, and description. You review and confirm before anything is saved.'}
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <label
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1.5px dashed rgba(56, 189, 248, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  minWidth: '200px'
                }}
              >
                <Camera size={24} color="#38BDF8" style={{ marginBottom: '6px' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38BDF8' }}>
                  {isScanningReceipt ? (isKannada ? 'ಸ್ಕ್ಯಾನ್ ಆಗುತ್ತಿದೆ...' : 'Scanning...') : (isKannada ? 'ರಸೀದಿ ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ' : 'Upload Receipt Photo')}
                </span>
                <input type="file" accept="image/*" onChange={handleReceiptUpload} style={{ display: 'none' }} />
              </label>

              {/* Scanned & Editable Review Form */}
              {scannedReceiptData && (
                <div
                  style={{
                    flex: 1,
                    minWidth: '280px',
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38BDF8' }}>
                      ✓ {isKannada ? 'ಜೆಮಿನಿ ಗುರುತಿಸಿದ ವಿವರಗಳು (ಪರಿಶೀಲಿಸಿ):' : 'Gemini Extracted Data (Review & Confirm):'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setScannedReceiptData(null)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                        {isKannada ? 'ಮೊತ್ತ (₹)' : 'Amount (₹)'}
                      </label>
                      <input
                        type="number"
                        value={scannedReceiptData.amount}
                        onChange={(e) => setScannedReceiptData({ ...scannedReceiptData, amount: Number(e.target.value) })}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                        {isKannada ? 'ದಿನಾಂಕ' : 'Date'}
                      </label>
                      <input
                        type="date"
                        value={scannedReceiptData.date}
                        onChange={(e) => setScannedReceiptData({ ...scannedReceiptData, date: e.target.value })}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isKannada ? 'ಅಂಗಡಿ / ವ್ಯಕ್ತಿ ಹೆಸರು' : 'Vendor / Person'}
                    </label>
                    <input
                      type="text"
                      value={scannedReceiptData.vendor}
                      onChange={(e) => setScannedReceiptData({ ...scannedReceiptData, vendor: e.target.value })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isKannada ? 'ವಿವರ' : 'Description'}
                    </label>
                    <input
                      type="text"
                      value={scannedReceiptData.description}
                      onChange={(e) => setScannedReceiptData({ ...scannedReceiptData, description: e.target.value })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button
                    onClick={handleConfirmScannedReceipt}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '6px', fontSize: '0.82rem' }}
                  >
                    <Check size={14} />
                    <span>{isKannada ? 'ಪರಿಶೀಲಿಸಿ ವೆಚ್ಚವಾಗಿ ಸೇವ್ ಮಾಡಿ' : 'Confirm & Save as Expense'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Chat with Gemini AI */}
          <div
            className="glass-card"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              height: '520px',
              maxHeight: '75vh'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="#10B981" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? 'ಜೆಮಿನಿ AI ಜೊತೆ ಚಾಟ್ & ಧ್ವನಿ ಸಂಭಾಷಣೆ' : 'Chat & Voice with Gemini AI'}
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
                ● {isKannada ? 'ಸುರಕ್ಷಿತ ದತ್ತಾಂಶ ಸಂಯೋಜಿತ' : 'Secure Database Linked'}
              </span>
            </div>

            {/* Quick suggested prompt buttons */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
              {[
                isKannada ? 'ಈ ತಿಂಗಳು fund ಯಾರು ಕಟ್ಟಿಲ್ಲ?' : 'Who has pending fund this month?',
                isKannada ? 'ನನ್ನ loan balance ಎಷ್ಟು?' : 'What is my loan balance?',
                isKannada ? 'ಈ ತಿಂಗಳ ಒಟ್ಟು ಖರ್ಚು ಎಷ್ಟು?' : 'What are total expenses?',
                isKannada ? '₹50,000 ಸಾಲಕ್ಕೆ 2% ಬಡ್ಡಿ ಎಷ್ಟು?' : 'How is 2% interest calculated for ₹50,000?'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendAiMessage(suggestion)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--glass-border)',
                    color: '#E2E8F0',
                    borderRadius: '14px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Chat conversation area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingRight: '6px'
              }}
            >
              {aiChatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  <div
                    style={{
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255,255,255,0.06)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                      color: '#FFFFFF',
                      borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.time}
                  </span>
                </div>
              ))}
              {isAiLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '0.8rem' }}>
                  <Sparkles size={14} className="spin" />
                  <span>{isKannada ? 'ಜೆಮಿನಿ ಯೋಚಿಸುತ್ತಿದೆ...' : 'Gemini thinking...'}</span>
                </div>
              )}
            </div>

            {/* Chat Input & Mic Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid var(--glass-border)'
              }}
            >
              {/* Kannada Voice Mic Button */}
              <button
                type="button"
                onClick={handleVoiceInput}
                style={{
                  background: isAiListening ? '#EF4444' : 'rgba(255,255,255,0.06)',
                  border: isAiListening ? 'none' : '1px solid var(--glass-border)',
                  color: isAiListening ? '#FFFFFF' : '#10B981',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title={isKannada ? 'ಧ್ವನಿ ಮೂಲಕ ಪ್ರಶ್ನೆ ಕೇಳಿ' : 'Ask with Kannada Voice'}
              >
                {isAiListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <input
                type="text"
                placeholder={isKannada ? 'ಸಮಿತಿ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ (ಕನ್ನಡ / English)...' : 'Ask about fund, loans, balances in Kannada or English...'}
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-full)',
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />

              <button
                type="button"
                onClick={() => handleSendAiMessage()}
                disabled={!aiQuery.trim()}
                style={{
                  background: aiQuery.trim() ? '#10B981' : 'rgba(255,255,255,0.06)',
                  color: aiQuery.trim() ? '#FFFFFF' : '#64748B',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: aiQuery.trim() ? 'pointer' : 'not-allowed',
                  flexShrink: 0
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📑 TAB 8: AUDIT LOGS                                     */}
      {/* ======================================================== */}
      {activeTab === 'AUDIT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
              {isKannada ? 'ಪಾರದರ್ಶಕ ಲೆಕ್ಕಪರಿಶೋಧನೆ ಲಾಗ್ (Audit Trail)' : 'Transparent Audit Trail'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {isKannada
                ? 'ಪ್ರತಿಯೊಂದು ಸಾಲ, ವೆಚ್ಚ, ನಿಧಿ ಪಾವತಿ ಮತ್ತು ಸದಸ್ಯರ ಬದಲಾವಣೆಗಳ ಅಧಿಕೃತ ದಾಖಲೆ'
                : 'Immutable record of every financial and membership change with timestamp and actor.'}
            </p>
          </div>

          <div className="glass-card" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ಸಮಯ' : 'Timestamp'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ಕ್ರಮ' : 'Action'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ನಿರ್ವಾಹಕರು' : 'Actor'}</th>
                  <th style={{ padding: '10px' }}>{isKannada ? 'ವಿವರ' : 'Details'}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.8rem' }}>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                      {log.timestamp.split('T')[0]} {log.timestamp.split('T')[1]?.substring(0, 5)}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: '#38BDF8',
                          fontWeight: 700
                        }}
                      >
                        {isKannada ? log.action_kn : log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600, color: '#FFFFFF' }}>{log.actor_name}</td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                      {log.details || log.new_value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📦 MODALS: ADD MEMBER, PAY CONTRIBUTION, ISSUE LOAN, ETC.*/}
      {/* ======================================================== */}

      {/* 1. Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddMemberModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? 'ಹೊಸ ಸಮಿತಿ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ' : 'Add New Committee Member'}
              </h3>
              <button onClick={() => setIsAddMemberModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newMemberForm.name || !newMemberForm.phone) return;
                try {
                  await dbService.addCommitteeMember(
                    {
                      name: newMemberForm.name,
                      name_kn: newMemberForm.name_kn || newMemberForm.name,
                      phone: newMemberForm.phone,
                      address: newMemberForm.address,
                      joining_date: new Date().toISOString().split('T')[0],
                      role: newMemberForm.role,
                      role_kn: newMemberForm.role === 'PRESIDENT' ? 'ಅಧ್ಯಕ್ಷರು' : newMemberForm.role === 'TREASURER' ? 'ಖಜಾಂಚಿ' : 'ಸದಸ್ಯರು',
                      status: 'ACTIVE'
                    },
                    currentUser?.uid || 'admin',
                    currentUser?.name || 'Admin'
                  );
                  alert(isKannada ? 'ಸದಸ್ಯರನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ' : 'Member added successfully');
                  setIsAddMemberModalOpen(false);
                  setNewMemberForm({ name: '', name_kn: '', phone: '', address: 'Muttagundi Village', role: 'MEMBER' });
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಸದಸ್ಯರ ಹೆಸರು (ಇಂಗ್ಲಿಷ್)' : 'Member Name (English)'} *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಸದಸ್ಯರ ಹೆಸರು (ಕನ್ನಡ)' : 'Member Name (Kannada)'}
                </label>
                <input
                  type="text"
                  value={newMemberForm.name_kn}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name_kn: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : 'Phone Number'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 9845XXXXXX"
                  value={newMemberForm.phone}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಸಮಿತಿ ಹುದ್ದೆ' : 'Committee Role'}
                </label>
                <select
                  value={newMemberForm.role}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value as CommitteeRole })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                >
                  <option value="MEMBER">Member (ಸದಸ್ಯರು)</option>
                  <option value="DIRECTOR">Director (ನಿರ್ದೇಶಕರು)</option>
                  <option value="TREASURER">Treasurer (ಖಜಾಂಚಿ)</option>
                  <option value="SECRETARY">Secretary (ಕಾರ್ಯದರ್ಶಿ)</option>
                  <option value="VICE_PRESIDENT">Vice President (ಉಪಾಧ್ಯಕ್ಷರು)</option>
                  <option value="PRESIDENT">President (ಅಧ್ಯಕ್ಷರು)</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                <span>{isKannada ? 'ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ' : 'Save Member'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Record Contribution Payment Modal */}
      {isRecordPaymentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRecordPaymentModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? 'ಮಾಸಿಕ ನಿಧಿ ಪಾವತಿ ದಾಖಲಿಸಿ' : 'Record Member Fund Payment'}
              </h3>
              <button onClick={() => setIsRecordPaymentModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!paymentForm.memberId) return;
                try {
                  await dbService.recordContributionPayment(
                    {
                      contributionId: selectedContributionForPayment?.id,
                      memberId: paymentForm.memberId,
                      month: paymentForm.month,
                      amount: paymentForm.amount,
                      referenceId: paymentForm.referenceId || 'UPI-' + Date.now().toString().substring(7),
                      notes: paymentForm.notes,
                      receiptUrl: paymentForm.receiptUrl || undefined,
                      collectedBy: currentUser?.name || 'Treasurer'
                    },
                    currentUser?.uid || 'admin',
                    currentUser?.name || 'Admin'
                  );
                  alert(isKannada ? 'ವಂತಿಗೆ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ!' : 'Contribution recorded successfully!');
                  setIsRecordPaymentModalOpen(false);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select Member'} *
                </label>
                <select
                  required
                  value={paymentForm.memberId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, memberId: e.target.value })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                >
                  <option value="">{isKannada ? '-- ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ --' : '-- Select Member --'}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ತಿಂಗಳು' : 'Month'}
                  </label>
                  <input
                    type="text"
                    value={paymentForm.month}
                    onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಮೊತ್ತ (₹)' : 'Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ರೆಫರೆನ್ಸ್ / ಯುಪಿಐ ಐಡಿ' : 'Reference / UPI ID'}
                </label>
                <input
                  type="text"
                  placeholder="UPI-MTG-XXXX or CASH"
                  value={paymentForm.referenceId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceId: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                <span>{isKannada ? 'ಪಾವತಿ ಖಚಿತಪಡಿಸಿ' : 'Confirm Payment'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Issue Loan Modal */}
      {isCreateLoanModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateLoanModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? 'ಸದಸ್ಯರಿಗೆ ಸಾಲ ಮಂಜೂರು ಮಾಡಿ' : 'Issue Loan to Member'}
              </h3>
              <button onClick={() => setIsCreateLoanModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!loanForm.memberId) return;
                try {
                  await dbService.createLoan(
                    {
                      memberId: loanForm.memberId,
                      principalAmount: loanForm.principalAmount,
                      interestRatePercent: loanForm.interestRatePercent,
                      tenureMonths: loanForm.tenureMonths,
                      purpose: loanForm.purpose
                    },
                    currentUser?.uid || 'admin',
                    currentUser?.name || 'Admin'
                  );
                  alert(isKannada ? 'ಸಾಲ ಯಶಸ್ವಿಯಾಗಿ ಮಂಜೂರಾಗಿದೆ!' : 'Loan issued successfully!');
                  setIsCreateLoanModalOpen(false);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಸಾಲ ಪಡೆಯುವ ಸದಸ್ಯರು' : 'Member'} *
                </label>
                <select
                  required
                  value={loanForm.memberId}
                  onChange={(e) => setLoanForm({ ...loanForm, memberId: e.target.value })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                >
                  <option value="">{isKannada ? '-- ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ --' : '-- Select Member --'}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಅಸಲು ಮೊತ್ತ (₹)' : 'Principal (₹)'}
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={loanForm.principalAmount}
                    onChange={(e) => setLoanForm({ ...loanForm, principalAmount: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಅವಧಿ (ತಿಂಗಳುಗಳಲ್ಲಿ)' : 'Tenure (Months)'}
                  </label>
                  <input
                    type="number"
                    value={loanForm.tenureMonths}
                    onChange={(e) => setLoanForm({ ...loanForm, tenureMonths: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಬಡ್ಡಿ ದರ (% ಪ್ರತಿ ತಿಂಗಳಿಗೆ)' : 'Monthly Interest Rate (%)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={loanForm.interestRatePercent}
                  onChange={(e) => setLoanForm({ ...loanForm, interestRatePercent: Number(e.target.value) })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              {/* Verified calculation preview */}
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  fontSize: '0.78rem',
                  color: '#FEF08A'
                }}
              >
                <div>{isKannada ? 'ಒಟ್ಟು ಬಡ್ಡಿ' : 'Total Interest'}: ₹{(loanForm.principalAmount * (loanForm.interestRatePercent / 100) * loanForm.tenureMonths).toLocaleString()}</div>
                <div>{isKannada ? 'ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ' : 'Total Repayable'}: ₹{(loanForm.principalAmount + (loanForm.principalAmount * (loanForm.interestRatePercent / 100) * loanForm.tenureMonths)).toLocaleString()}</div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಸಾಲದ ಉದ್ದೇಶ' : 'Purpose'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Drip irrigation, dairy cow, seeds"
                  value={loanForm.purpose}
                  onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <button type="submit" className="btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                <span>{isKannada ? 'ಸಾಲ ಮಂಜೂರು ಮಾಡಿ' : 'Issue Loan'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Record Loan Repayment Modal */}
      {isRepayLoanModalOpen && selectedLoanForRepay && (
        <div className="modal-overlay" onClick={() => setIsRepayLoanModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? 'ಸಾಲದ ಕಂತು ಮರುಪಾವತಿ ದಾಖಲಿಸಿ' : 'Record Loan Repayment'}
              </h3>
              <button onClick={() => setIsRepayLoanModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginBottom: '12px' }}>
              {isKannada ? 'ಸದಸ್ಯರು' : 'Member'}: <strong>{selectedLoanForRepay.member_name}</strong> • {selectedLoanForRepay.loan_number}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isKannada ? 'ಉಳಿದ ಅಸಲು' : 'Remaining Principal'}: ₹{selectedLoanForRepay.remaining_principal.toLocaleString()} • {isKannada ? 'ಬಾಕಿ ಬಡ್ಡಿ' : 'Interest'}: ₹{selectedLoanForRepay.remaining_interest.toLocaleString()}
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await dbService.recordLoanRepayment(
                    {
                      loanId: selectedLoanForRepay.id,
                      amount: repaymentForm.amount,
                      referenceId: repaymentForm.referenceId,
                      notes: repaymentForm.notes,
                      receivedBy: currentUser?.name || 'Treasurer'
                    },
                    currentUser?.uid || 'admin',
                    currentUser?.name || 'Admin'
                  );
                  alert(isKannada ? 'ಕಂತು ಯಶಸ್ವಿಯಾಗಿ ಜಮೆಯಾಗಿದೆ!' : 'Repayment recorded successfully!');
                  setIsRepayLoanModalOpen(false);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಮರುಪಾವತಿ ಮೊತ್ತ (₹)' : 'Repayment Amount (₹)'}
                </label>
                <input
                  type="number"
                  required
                  value={repaymentForm.amount}
                  onChange={(e) => setRepaymentForm({ ...repaymentForm, amount: Number(e.target.value) })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ರೆಫರೆನ್ಸ್ / ರಶೀದಿ ಐಡಿ' : 'Reference / Receipt ID'}
                </label>
                <input
                  type="text"
                  placeholder="REP-XXXX or UPI"
                  value={repaymentForm.referenceId}
                  onChange={(e) => setRepaymentForm({ ...repaymentForm, referenceId: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                <span>{isKannada ? 'ಕಂತು ಜಮೆ ಮಾಡಿ' : 'Confirm Repayment'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Expense Modal */}
      {isAddExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddExpenseModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {isKannada ? 'ಸಮಿತಿ ವೆಚ್ಚ ದಾಖಲಿಸಿ' : 'Record Committee Expense'}
              </h3>
              <button onClick={() => setIsAddExpenseModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!expenseForm.amount || !expenseForm.description) return;
                try {
                  await dbService.addExpense(
                    {
                      category: expenseForm.category,
                      category_kn: getCategoryKn(expenseForm.category),
                      amount: expenseForm.amount,
                      date: expenseForm.date,
                      description: expenseForm.description,
                      paid_by: expenseForm.paid_by,
                      receipt_url: expenseForm.receipt_url || undefined,
                      created_by: currentUser?.name || 'Admin'
                    },
                    currentUser?.uid || 'admin',
                    currentUser?.name || 'Admin'
                  );
                  alert(isKannada ? 'ವೆಚ್ಚ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ!' : 'Expense recorded successfully!');
                  setIsAddExpenseModalOpen(false);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವೆಚ್ಚದ ವರ್ಗ' : 'Category'}
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                >
                  <option value="TEMPLE">Temple / ದೇವಸ್ಥಾನ ಅಭಿವೃದ್ಧಿ</option>
                  <option value="ELECTRICITY">Electricity & Streetlights / ವಿದ್ಯುತ್ & ಬೀದಿದೀಪ</option>
                  <option value="FESTIVAL">Festivals & Culture / ಗ್ರಾಮ ಹಬ್ಬ & ಸಂಭ್ರಮ</option>
                  <option value="WATER_SANITATION">Water & Sanitation / ಕುಡಿಯುವ ನೀರು & ನೈರ್ಮಲ್ಯ</option>
                  <option value="SPORTS">Sports / ಕ್ರೀಡಾ ಪ್ರೋತ್ಸಾಹ</option>
                  <option value="ADMINISTRATION">Administration / ಆಡಳಿತ & ಸಭೆ ಖರ್ಚು</option>
                  <option value="MISCELLANEOUS">Miscellaneous / ಇತರ ವೆಚ್ಚ</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಮೊತ್ತ (₹)' : 'Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ದಿನಾಂಕ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವೆಚ್ಚದ ವಿವರ' : 'Description'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Streetlight LED bulb replacement on Main Street"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                <span>{isKannada ? 'ವೆಚ್ಚ ಉಳಿಸಿ' : 'Save Expense'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Member Statement Modal */}
      {selectedStatementMember && (
        <div className="modal-overlay" onClick={() => setSelectedStatementMember(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? 'ಸದಸ್ಯರ ಆರ್ಥಿಕ ವಿವರ' : 'Member Financial Statement'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                  {selectedStatementMember.name} • {selectedStatementMember.role}
                </span>
              </div>
              <button onClick={() => setSelectedStatementMember(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{isKannada ? 'ಒಟ್ಟು ವಂತಿಗೆ' : 'Total Contributed'}</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10B981' }}>₹{selectedStatementMember.total_contributed.toLocaleString()}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{isKannada ? 'ಸಕ್ರಿಯ ಸಾಲ' : 'Active Loans'}</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F59E0B' }}>{selectedStatementMember.active_loans_count}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{isKannada ? 'ಬಾಕಿ ಮೊತ್ತ' : 'Outstanding'}</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: selectedStatementMember.outstanding_loan_balance > 0 ? '#EF4444' : '#94A3B8' }}>
                  ₹{selectedStatementMember.outstanding_loan_balance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Individual member transactions */}
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#FFFFFF' }}>
              {isKannada ? 'ವಹಿವಾಟು ವಿವರಗಳು' : 'Transaction History'}
            </h4>
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions
                .filter((t) => t.member_id === selectedStatementMember.id)
                .map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.02)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#FFFFFF', display: 'block' }}>{isKannada ? t.type_kn : t.type}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.date} • {t.description}</span>
                    </div>
                    <strong style={{ color: t.direction === 'IN' ? '#10B981' : '#F87171' }}>
                      {t.direction === 'IN' ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </strong>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. Formal Printable Report Modal */}
      {isReportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsReportModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#10B981" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? 'ಅಧಿಕೃತ ಆರ್ಥಿಕ ವರದಿ' : 'Official Financial Audit Report'}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--glass-border)',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Printer size={13} />
                  <span>{isKannada ? 'ಪ್ರಿಂಟ್' : 'Print'}</span>
                </button>
                <button onClick={() => setIsReportModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--glass-border)',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                lineHeight: 1.6,
                color: '#E2E8F0',
                whiteSpace: 'pre-line'
              }}
            >
              {isGeneratingReport ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981' }}>
                  <RefreshCw size={16} className="spin" />
                  <span>{isKannada ? 'ವರದಿ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...' : 'Compiling verified report...'}</span>
                </div>
              ) : (
                generatedReportText
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
