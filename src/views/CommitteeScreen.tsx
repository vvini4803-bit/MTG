import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, isSuperAdminEmail } from '../context/AuthContext';
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
  CommitteeRole,
  ContributionStatus,
  LoanStatus
} from '../types';
import {
  Crown,
  Landmark,
  Users,
  CreditCard,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Calendar,
  FileText,
  Sparkles,
  Mic,
  MicOff,
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  Printer,
  RefreshCw,
  X,
  Shield,
  Check,
  Edit,
  DollarSign,
  Receipt,
  MessageSquare,
  ArrowLeft,
  Send
} from 'lucide-react';

type SubTab =
  | 'DASHBOARD'
  | 'MY_STATEMENT'
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

  const [activeTab, setActiveTab] = useState<SubTab>('DASHBOARD');

  // Database states
  const [hasAdmin, setHasAdmin] = useState<boolean>(() => dbService.hasCommitteeAdmin());
  const [summary, setSummary] = useState<CommitteeSummary>(() => dbService.getCommitteeSummary());
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [contributions, setContributions] = useState<CommitteeContribution[]>([]);
  const [loans, setLoans] = useState<CommitteeLoan[]>([]);
  const [expenses, setExpenses] = useState<CommitteeExpense[]>([]);
  const [transactions, setTransactions] = useState<CommitteeTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<CommitteeAuditLog[]>([]);

  // Subscriptions with real-time updates
  useEffect(() => {
    const unsubM = dbService.subscribeCommitteeMembers((data) => {
      setMembers(data);
      setHasAdmin(dbService.hasCommitteeAdmin());
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

  // Current logged in member identification & 3-Role Resolution
  const isSuperAdminUser = currentUser ? (isSuperAdminEmail(currentUser.email, currentUser.name) || currentUser.role === 'SUPER_ADMIN') : false;

  const currentMemberRecord = members.find((m) => {
    if (currentUser?.uid && m.user_id === currentUser.uid) return true;
    if (currentUser?.phone && m.phone && m.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')) return true;
    if (currentUser?.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) return true;
    return false;
  });

  // Role resolution:
  // - If user is in committee_members table: their recorded role (ADMIN, VICE_ADMIN, MEMBER).
  // - If user is super admin and there is no admin registered yet: can act as setup ADMIN.
  // - Otherwise: strictly MEMBER.
  const userRole: CommitteeRole = currentMemberRecord
    ? currentMemberRecord.role
    : (isSuperAdminUser && !hasAdmin ? 'ADMIN' : 'MEMBER');

  const isAdmin = userRole === 'ADMIN';
  const isViceAdmin = userRole === 'VICE_ADMIN';
  const _isMember = userRole === 'MEMBER';
  const canManage = isAdmin || isViceAdmin;

  // View toggle for Admin to test member perspective
  const [previewAsMember, setPreviewAsMember] = useState<boolean>(false);
  const activeIsAdmin = isAdmin && !previewAsMember;
  const activeCanManage = canManage && !previewAsMember;

  // Current year-month (dynamic, never hardcoded)
  const currentYearMonth = new Date().toISOString().substring(0, 7);

  // Filter / Search states
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Modals state
  const [isFirstAdminModalOpen, setIsFirstAdminModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<CommitteeMember | null>(null);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [selectedContributionForPayment, setSelectedContributionForPayment] = useState<CommitteeContribution | null>(null);
  const [isCreateLoanModalOpen, setIsCreateLoanModalOpen] = useState(false);
  const [isRepayLoanModalOpen, setIsRepayLoanModalOpen] = useState(false);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<CommitteeLoan | null>(null);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [selectedStatementMember, setSelectedStatementMember] = useState<CommitteeMember | null>(null);

  // Edit states for Admin & Vice Admin
  const [selectedContributionForEdit, setSelectedContributionForEdit] = useState<CommitteeContribution | null>(null);
  const [editContributionForm, setEditContributionForm] = useState({
    amount_paid: 1000,
    status: 'PAID' as ContributionStatus,
    payment_date: '',
    reference_id: '',
    notes: ''
  });

  const [selectedLoanForEdit, setSelectedLoanForEdit] = useState<CommitteeLoan | null>(null);
  const [editLoanForm, setEditLoanForm] = useState({
    status: 'ACTIVE' as LoanStatus,
    principal_amount: 0,
    remaining_principal: 0,
    remaining_interest: 0,
    tenure_months: 6,
    purpose: '',
    due_date: ''
  });

  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState<CommitteeExpense | null>(null);
  const [editExpenseForm, setEditExpenseForm] = useState({
    category: 'TEMPLE' as ExpenseCategory,
    category_kn: 'ದೇವಸ್ಥಾನ ಅಭಿವೃದ್ಧಿ',
    amount: 0,
    date: '',
    description: '',
    paid_by: ''
  });

  const [updateNotificationToast, setUpdateNotificationToast] = useState<{ msg_en: string; msg_kn: string } | null>(null);

  // Form inputs
  const [firstAdminForm, setFirstAdminForm] = useState({
    name: currentUser?.name || '',
    name_kn: '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    address: 'Muttagundi Village'
  });

  const [editMemberForm, setEditMemberForm] = useState({
    name: '',
    name_kn: '',
    phone: '',
    address: '',
    role: 'MEMBER' as CommitteeRole,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    name_kn: '',
    phone: '',
    address: 'Muttagundi Village',
    role: 'MEMBER' as CommitteeRole
  });

  const [paymentForm, setPaymentForm] = useState({
    memberId: '',
    month: currentYearMonth,
    amount: 1000,
    referenceId: '',
    notes: 'Monthly contribution',
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

  // Auto-generate fresh AI insights on tab open
  useEffect(() => {
    if (activeTab === 'AI_ASSISTANT' && !aiInsightsText) {
      handleGenerateInsights();
    }
  }, [activeTab, aiInsightsText]);

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

          {/* Quick Action Badges & Role Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Display exact Committee Role Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.75rem',
                fontWeight: 800,
                background: isAdmin
                  ? 'rgba(245, 158, 11, 0.2)'
                  : isViceAdmin
                  ? 'rgba(59, 130, 246, 0.2)'
                  : 'rgba(16, 185, 129, 0.2)',
                border: isAdmin
                  ? '1px solid #F59E0B'
                  : isViceAdmin
                  ? '1px solid #3B82F6'
                  : '1px solid #10B981',
                color: isAdmin ? '#FEF08A' : isViceAdmin ? '#93C5FD' : '#86EFAC'
              }}
            >
              {isAdmin ? (
                <>
                  <Crown size={14} color="#F59E0B" />
                  <span>👑 ADMIN (ಮುಖ್ಯ ಅಡ್ಮಿನ್)</span>
                </>
              ) : isViceAdmin ? (
                <>
                  <Shield size={14} color="#3B82F6" />
                  <span>🛡️ VICE ADMIN (ಉಪ ಅಡ್ಮಿನ್)</span>
                </>
              ) : (
                <>
                  <Users size={14} color="#10B981" />
                  <span>👤 MEMBER (ಸದಸ್ಯರು)</span>
                </>
              )}
            </div>

            {/* Admin and Vice Admin view toggle for previewing normal member perspective */}
            {canManage && (
              <div
                style={{
                  background: 'rgba(6, 78, 59, 0.4)',
                  padding: '3px 4px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  border: '1.5px solid #10B981'
                }}
              >
                <button
                  type="button"
                  onClick={() => setPreviewAsMember(false)}
                  style={{
                    background: !previewAsMember ? '#10B981' : 'transparent',
                    color: !previewAsMember ? '#FFFFFF' : '#6EE7B7',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '4px 10px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: !previewAsMember ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none'
                  }}
                >
                  {isAdmin ? '👑 Admin View' : '🛡️ Manager View'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAsMember(true)}
                  style={{
                    background: previewAsMember ? '#10B981' : 'transparent',
                    color: previewAsMember ? '#FFFFFF' : '#6EE7B7',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '4px 10px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: previewAsMember ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none'
                  }}
                >
                  👤 Member View
                </button>
              </div>
            )}

            {!hasAdmin && (
              <button
                onClick={() => setIsFirstAdminModalOpen(true)}
                className="btn-gold"
                style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Crown size={15} />
                <span>{isKannada ? 'ಮೊದಲ ಅಡ್ಮಿನ್ ಸ್ಥಾಪಿಸಿ' : 'Setup First Admin'}</span>
              </button>
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

            {activeCanManage && (
              <button
                onClick={handleGenerateReport}
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 14px',
                  minHeight: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1.5px solid #10B981',
                  color: '#34D399',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <FileText size={15} />
                <span>{isKannada ? 'ಆರ್ಥಿಕ ವರದಿ' : 'AI Report'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Member View Notification Banner if logged-in resident */}
        {!activeCanManage && currentMemberRecord && (
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
              onClick={() => setActiveTab('MY_STATEMENT')}
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

        {/* First Admin Setup Card if no admin account exists yet */}
        {!hasAdmin && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.12) 100%)',
              border: '1.5px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Crown size={28} color="#F59E0B" />
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FEF08A', margin: 0 }}>
                  {isKannada ? '👑 ಮೊದಲ ಸಮಿತಿ ಅಡ್ಮಿನ್ ಖಾತೆ ಸ್ಥಾಪನೆ ಅಗತ್ಯ' : '👑 Setup Initial Committee Admin Account'}
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#CBD5E1', margin: '3px 0 0' }}>
                  {isKannada
                    ? 'ಸಮಿತಿಯಲ್ಲಿ ಮುಖ್ಯ ಅಡ್ಮಿನ್ ಇಲ್ಲ. ಸಮಿತಿ ಅಧಿಕೃತ ಕಾರ್ಯಗಳನ್ನು ಆರಂಭಿಸಲು ಮೊದಲ ಅಡ್ಮಿನ್ ಖಾತೆಯನ್ನು ಸ್ಥಾಪಿಸಿ.'
                    : 'No Committee Admin exists yet. Establish the first authorized Admin account to manage village funds and roles.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFirstAdminModalOpen(true)}
              className="btn-gold"
              style={{ padding: '8px 18px', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Crown size={15} />
              <span>{isKannada ? '+ ಮೊದಲ ಅಡ್ಮಿನ್ ಸ್ಥಾಪಿಸಿ' : '+ Setup First Admin'}</span>
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
        {activeCanManage ? (
          <>
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
                {isKannada ? 'ಅಸಲು ಬಾಕಿ' : 'Principal Outstanding'}
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
          </>
        ) : (
          <>
            {/* Member Private Scoped Financial Cards */}
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
                  {isKannada ? '💵 ಸಮಿತಿ ಒಟ್ಟು ನಿಧಿ' : '💵 Committee Fund'}
                </span>
                <DollarSign size={16} color="#10B981" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF' }}>
                ₹{summary.availableBalance.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {isKannada ? 'ಗ್ರಾಮ ಸಮಿತಿ ಲಭ್ಯ ನಿಧಿ' : 'Public Village Balance'}
              </span>
            </div>

            <div className="glass-card card-3d" style={{ padding: '16px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {isKannada ? '💰 ನನ್ನ ಒಟ್ಟು ವಂತಿಗೆ' : '💰 My Contributions'}
                </span>
                <Users size={16} color="#3B82F6" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38BDF8' }}>
                ₹{(currentMemberRecord?.total_contributed || 0).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {isKannada ? 'ನನ್ನ ದಾಖಲಾದ ಪಾವತಿ' : 'Verified Paid by Me'}
              </span>
            </div>

            <div className="glass-card card-3d" style={{ padding: '16px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {isKannada ? '🏦 ನನ್ನ ಸಕ್ರಿಯ ಸಾಲಗಳು' : '🏦 My Active Loans'}
                </span>
                <CreditCard size={16} color="#F59E0B" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FBBF24' }}>
                {currentMemberRecord?.active_loans_count || 0}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {isKannada ? 'ನನ್ನ ಖಾತೆಯ ಸಾಲ' : 'My Personal Loans'}
              </span>
            </div>

            <div className="glass-card card-3d" style={{ padding: '16px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {isKannada ? '💳 ನನ್ನ ಬಾಕಿ ಸಾಲ' : '💳 My Outstanding'}
                </span>
                <Clock size={16} color="#EC4899" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#F472B6' }}>
                ₹{(currentMemberRecord?.outstanding_loan_balance || 0).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {isKannada ? 'ನಾನು ಮರುಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ' : 'Remaining Payable'}
              </span>
            </div>

            <div className="glass-card card-3d" style={{ padding: '16px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {isKannada ? '📈 ನನ್ನ ಸಾಲ ಮರುಪಾವತಿ' : '📈 My Repayments'}
                </span>
                <TrendingUp size={16} color="#A855F7" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#C084FC' }}>
                ₹{loans.filter((l) => l.member_id === currentMemberRecord?.id).reduce((s, l) => s + (l.amount_paid || 0), 0).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {isKannada ? 'ಪಾವತಿಸಿದ ಕಂತು ಮೊತ್ತ' : 'Principal Repaid'}
              </span>
            </div>

            <div className="glass-card card-3d" style={{ padding: '16px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {isKannada ? '🏛️ ಸಮಿತಿ ಸ್ಥಿತಿ' : '🏛️ Committee'}
                </span>
                <CheckCircle2 size={16} color="#10B981" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#34D399' }}>
                {summary.activeMembersCount}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {isKannada ? 'ಸಕ್ರಿಯ ಸದಸ್ಯರು' : 'Active Members'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 🔔 FLOATING UPDATE NOTIFICATION TOAST */}
      {updateNotificationToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 0 16px rgba(16, 185, 129, 0.5)',
            border: '1.5px solid #34D399',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 800,
            fontSize: '0.86rem',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <CheckCircle2 size={18} color="#FFFFFF" />
          <span>{isKannada ? updateNotificationToast.msg_kn : updateNotificationToast.msg_en}</span>
        </div>
      )}

      {/* 📢 LIVE COMMITTEE UPDATES BANNER (Notified & Visible to Everyone) */}
      {auditLogs.length > 0 && (
        <div
          className="glass-card"
          style={{
            marginBottom: '16px',
            padding: '12px 18px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
            border: '1.5px solid #10B981',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#10B981',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
                flexShrink: 0
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isKannada ? '📢 ಇತ್ತೀಚಿನ ಅಧಿಕೃತ ಸಮಿತಿ ನವೀಕರಣ' : '📢 Live Committee Update • Notified to Everyone'}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.25)',
                    color: '#A7F3D0',
                    fontWeight: 800,
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {auditLogs[0].actor_role === 'ADMIN' ? '👑 Admin' : auditLogs[0].actor_role === 'VICE_ADMIN' ? '🛡️ Vice Admin' : '👤 Management'} {auditLogs[0].actor_name}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#E2E8F0', margin: '3px 0 0', fontWeight: 600 }}>
                {isKannada ? auditLogs[0].action_kn : auditLogs[0].action}: {auditLogs[0].new_value || auditLogs[0].details || 'Updated'}
              </p>
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#6EE7B7', fontWeight: 700 }}>
            🕒 {new Date(auditLogs[0].timestamp).toLocaleDateString(isKannada ? 'kn-IN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* 🧭 NAVIGATION TABS (Strictly Role-Authorized) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
          scrollbarWidth: 'none'
        }}
      >
        {[
          { id: 'DASHBOARD' as SubTab, label_en: 'Dashboard', label_kn: 'ಅವಲೋಕನ', icon: Landmark },
          { id: 'MY_STATEMENT' as SubTab, label_en: 'My Statement', label_kn: 'ನನ್ನ ಲೆಕ್ಕಪತ್ರ', icon: Eye },
          ...(activeCanManage
            ? [
                { id: 'MEMBERS' as SubTab, label_en: 'Members', label_kn: 'ಸದಸ್ಯರು', icon: Users, badge: members.length > 0 ? members.length : undefined },
                { id: 'FUND' as SubTab, label_en: 'Monthly Fund', label_kn: 'ಮಾಸಿಕ ನಿಧಿ', icon: DollarSign, badge: summary.pendingContributionsCount > 0 ? `${summary.pendingContributionsCount} Due` : undefined },
                { id: 'LOANS' as SubTab, label_en: 'Loans & Interest', label_kn: 'ಸಾಲಗಳು & ಬಡ್ಡಿ', icon: CreditCard, badge: summary.activeLoansCount > 0 ? summary.activeLoansCount : undefined },
                { id: 'EXPENSES' as SubTab, label_en: 'Expenses', label_kn: 'ವೆಚ್ಚಗಳು', icon: ArrowDownRight },
                { id: 'LEDGER' as SubTab, label_en: 'Ledger', label_kn: 'ಲೆಡ್ಜರ್', icon: FileText }
              ]
            : []),
          { id: 'AI_ASSISTANT' as SubTab, label_en: 'Ask MTG AI', label_kn: 'ಜೆಮಿನಿ AI', icon: Sparkles, special: true },
          ...(activeCanManage
            ? [
                { id: 'AUDIT' as SubTab, label_en: 'Audit Logs', label_kn: 'ಆಡಿಟ್ ಲಾಗ್', icon: Shield }
              ]
            : [])
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
                  ? '1.5px solid #34D399'
                  : tab.special
                  ? '1.5px solid rgba(245, 158, 11, 0.5)'
                  : '1.5px solid rgba(16, 185, 129, 0.35)',
                background: isActive
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : tab.special
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(16, 185, 129, 0.08)',
                color: isActive ? '#FFFFFF' : tab.special ? '#FEF08A' : '#6EE7B7',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 4px 14px rgba(16, 185, 129, 0.45)' : 'none'
              }}
            >
              <Icon size={15} color={isActive ? '#FFFFFF' : tab.special ? '#F59E0B' : '#34D399'} />
              <span>{isKannada ? tab.label_kn : tab.label_en}</span>
              {tab.badge && (
                <span
                  style={{
                    background: tab.id === 'FUND' && summary.pendingContributionsCount > 0 ? '#EF4444' : 'rgba(16, 185, 129, 0.3)',
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
          {/* Professional Empty State when no committee records exist */}
          {members.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                margin: '8px 0',
                border: '1.5px dashed rgba(16, 185, 129, 0.4)',
                borderRadius: '16px'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <Landmark size={32} color="#10B981" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px' }}>
                {isKannada ? '🏛️ ಎಂಟಿಜಿ ಸಮಿತಿ' : '🏛️ MTG COMMITTEE'}
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#94A3B8', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                {activeCanManage
                  ? (isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ದಾಖಲೆಗಳನ್ನು ಇನ್ನೂ ಸೇರಿಸಲಾಗಿಲ್ಲ.' : 'No committee records have been added yet.')
                  : (isKannada ? 'ನಿಮ್ಮ ಸಮಿತಿ ಮಾಹಿತಿ ಲಭ್ಯವಾದ ತಕ್ಷಣ ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆ.' : 'Your committee information will appear here once it is available.')}
              </p>
              {activeCanManage && (
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    margin: '0 auto'
                  }}
                >
                  <Plus size={18} />
                  <span>{isKannada ? '+ ಮೊದಲ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ' : '+ Add First Member'}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Collection Progress Strip */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                      {isKannada
                        ? `📅 ಪ್ರಸ್ತುತ ತಿಂಗಳ ನಿಧಿ ಸಂಗ್ರಹ ಪ್ರಗತಿ (${new Date().toLocaleDateString('kn-IN', { month: 'long', year: 'numeric' })})`
                        : `📅 Current Month Collection Progress (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`}
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

              {/* Quick Actions Grid for Admins and Vice Admins */}
              {activeCanManage && (
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
              {summary.pendingContributionsCount > 0 && activeCanManage && (
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
                    <div style={{ padding: '28px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                      {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
                    </div>
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
                    <div style={{ padding: '28px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                      {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
                    </div>
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
                  {activeCanManage && (
                    <button
                      onClick={() => setActiveTab('LEDGER')}
                      style={{ background: 'none', border: 'none', color: '#10B981', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      {isKannada ? 'ಪೂರ್ಣ ಲೆಡ್ಜರ್' : 'View Full Ledger'} →
                    </button>
                  )}
                </div>

                {transactions.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
                  </div>
                ) : (
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
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 👤 TAB: MY STATEMENT (INDIVIDUAL MEMBER ACCOUNT)         */}
      {/* ======================================================== */}
      {activeTab === 'MY_STATEMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!currentMemberRecord ? (
            <div
              className="glass-card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                margin: '8px 0',
                border: '1.5px dashed rgba(59, 130, 246, 0.4)',
                borderRadius: '16px'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              >
                <Users size={32} color="#3B82F6" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
                {isKannada ? 'ನನ್ನ ಸಮಿತಿ ಲೆಕ್ಕಪತ್ರ' : 'My Committee Statement'}
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#94A3B8', maxWidth: '440px', margin: '0 auto 14px', lineHeight: 1.5 }}>
                {isKannada
                  ? 'ನಿಮ್ಮ ಸಮಿತಿ ಮಾಹಿತಿ ಲಭ್ಯವಾದ ತಕ್ಷಣ ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತದೆ.'
                  : 'Your committee information will appear here once it is available.'}
              </p>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                {isKannada
                  ? 'ನಿಮ್ಮ ಖಾತೆಗೆ ಸದಸ್ಯತ್ವ ಜೋಡಿಸಲು ದಯವಿಟ್ಟು ಸಮಿತಿ ಅಡ್ಮಿನ್ ಅವರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
                  : 'Contact the Committee Admin to register or link your member profile.'}
              </span>
            </div>
          ) : (
            <>
              {/* Member Profile Banner */}
              <div
                className="glass-card"
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
                  border: '1.5px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={currentMemberRecord.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentMemberRecord.name)}`}
                    alt={currentMemberRecord.name}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #3B82F6'
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                        {isKannada && currentMemberRecord.name_kn ? currentMemberRecord.name_kn : currentMemberRecord.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: currentMemberRecord.role === 'ADMIN'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : currentMemberRecord.role === 'VICE_ADMIN'
                            ? 'rgba(59, 130, 246, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                          color: currentMemberRecord.role === 'ADMIN'
                            ? '#FEF08A'
                            : currentMemberRecord.role === 'VICE_ADMIN'
                            ? '#93C5FD'
                            : '#86EFAC',
                          border: '1px solid currentColor'
                        }}
                      >
                        {currentMemberRecord.role === 'ADMIN'
                          ? '👑 ADMIN'
                          : currentMemberRecord.role === 'VICE_ADMIN'
                          ? '🛡️ VICE ADMIN'
                          : '👤 MEMBER'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      📞 {currentMemberRecord.phone} • 📍 {currentMemberRecord.address} • 📅 {isKannada ? 'ಸೇರ್ಪಡೆ ದಿನಾಂಕ' : 'Joined'}: {currentMemberRecord.joining_date}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setActiveTab('AI_ASSISTANT')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10B981',
                      color: '#86EFAC',
                      borderRadius: 'var(--radius-md)',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={14} />
                    <span>{isKannada ? 'ನನ್ನ ಖಾತೆ ಬಗ್ಗೆ ಕೇಳಿ' : 'Ask AI About My Dues'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Summary Metric Cards for Member */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}
              >
                <div className="glass-card" style={{ padding: '16px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                    {isKannada ? '💰 ನನ್ನ ಒಟ್ಟು ನಿಧಿ ವಂತಿಗೆ' : '💰 Total Contributed'}
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34D399', margin: '4px 0 2px' }}>
                    ₹{currentMemberRecord.total_contributed.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#10B981' }}>{isKannada ? 'ದೃಢೀಕರಿಸಿದ ಪಾವತಿ' : 'Verified Paid'}</span>
                </div>

                <div className="glass-card" style={{ padding: '16px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                    {isKannada ? '🏦 ಸಕ್ರಿಯ ಸಾಲಗಳು' : '🏦 Active Loans'}
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FBBF24', margin: '4px 0 2px' }}>
                    {currentMemberRecord.active_loans_count}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#F59E0B' }}>{isKannada ? 'ಮೈಕ್ರೋ ಸಾಲಗಳು' : 'Personal Micro-Loans'}</span>
                </div>

                <div className="glass-card" style={{ padding: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                    {isKannada ? '💳 ಸಾಲದ ಬಾಕಿ ಮೊತ್ತ' : '💳 Outstanding Balance'}
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F87171', margin: '4px 0 2px' }}>
                    ₹{currentMemberRecord.outstanding_loan_balance.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: currentMemberRecord.outstanding_loan_balance > 0 ? '#EF4444' : '#10B981' }}>
                    {currentMemberRecord.outstanding_loan_balance > 0 ? (isKannada ? 'ಮರುಪಾವತಿ ಬಾಕಿ' : 'Payable') : (isKannada ? 'ಯಾವುದೇ ಬಾಕಿ ಇಲ್ಲ' : 'No Balance')}
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '16px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                    {isKannada ? '📈 ಪಾವತಿಸಿದ ಕಂತುಗಳು' : '📈 Total Repayments'}
                  </span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#C084FC', margin: '4px 0 2px' }}>
                    ₹{loans.filter((l) => l.member_id === currentMemberRecord.id).reduce((s, l) => s + (l.amount_paid || 0), 0).toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#A855F7' }}>{isKannada ? 'ಅಸಲು ಮರುಪಾವತಿ' : 'Principal Paid Back'}</span>
                </div>
              </div>

              {/* Monthly Contribution Tracker for this member */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Calendar size={18} color="#10B981" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>
                    {isKannada ? 'ನನ್ನ ಮಾಸಿಕ ವಂತಿಗೆ ಇತಿಹಾಸ' : 'My Monthly Contribution History'}
                  </h4>
                </div>

                {contributions.filter((c) => c.member_id === currentMemberRecord.id).length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          <th style={{ padding: '8px 10px' }}>{isKannada ? 'ತಿಂಗಳು' : 'Month'}</th>
                          <th style={{ padding: '8px 10px' }}>{isKannada ? 'ನಿಗದಿ' : 'Target'}</th>
                          <th style={{ padding: '8px 10px' }}>{isKannada ? 'ಪಾವತಿಸಿದ ಮೊತ್ತ' : 'Paid'}</th>
                          <th style={{ padding: '8px 10px' }}>{isKannada ? 'ಸ್ಥಿತಿ' : 'Status'}</th>
                          <th style={{ padding: '8px 10px' }}>{isKannada ? 'ದಿನಾಂಕ & ರೆಫರೆನ್ಸ್' : 'Date & Ref'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contributions
                          .filter((c) => c.member_id === currentMemberRecord.id)
                          .map((contrib) => (
                            <tr key={contrib.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.82rem' }}>
                              <td style={{ padding: '10px', color: '#FFFFFF', fontWeight: 600 }}>{contrib.month}</td>
                              <td style={{ padding: '10px', color: 'var(--text-muted)' }}>₹{contrib.expected_amount.toLocaleString()}</td>
                              <td style={{ padding: '10px', fontWeight: 700, color: contrib.status === 'PAID' ? '#10B981' : '#F87171' }}>
                                ₹{contrib.amount_paid.toLocaleString()}
                              </td>
                              <td style={{ padding: '10px' }}>
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: contrib.status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: contrib.status === 'PAID' ? '#34D399' : '#F87171',
                                    fontWeight: 700
                                  }}
                                >
                                  {contrib.status === 'PAID' ? (isKannada ? 'ಪಾವತಿಸಲಾಗಿದೆ ✓' : 'PAID') : (isKannada ? 'ಬಾಕಿ' : 'PENDING')}
                                </span>
                              </td>
                              <td style={{ padding: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {contrib.payment_date ? `${contrib.payment_date} (${contrib.reference_id || 'Cash'})` : '—'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* My Personal Loans */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <CreditCard size={18} color="#F59E0B" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>
                    {isKannada ? 'ನನ್ನ ಸಾಲಗಳು & ಮರುಪಾವತಿ ವಿವರ' : 'My Loans & Repayment Details'}
                  </h4>
                </div>

                {loans.filter((l) => l.member_id === currentMemberRecord.id).length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {loans
                      .filter((l) => l.member_id === currentMemberRecord.id)
                      .map((l) => (
                        <div
                          key={l.id}
                          style={{
                            padding: '16px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#FFFFFF' }}>{l.loan_number}</strong>
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
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
                            {l.purpose} • {l.interest_rate_percent}% {isKannada ? 'ಮಾಸಿಕ ಸರಳ ಬಡ್ಡಿ' : 'monthly interest'}
                          </span>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>{isKannada ? 'ಅಸಲು ಮೊತ್ತ' : 'Principal'}</span>
                              <strong style={{ color: '#FFFFFF' }}>₹{l.principal_amount.toLocaleString()}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>{isKannada ? 'ಪಾವತಿಸಿದ ಮೊತ್ತ' : 'Repaid'}</span>
                              <strong style={{ color: '#10B981' }}>₹{l.amount_paid.toLocaleString()}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>{isKannada ? 'ಉಳಿದ ಅಸಲು' : 'Principal Due'}</span>
                              <strong style={{ color: '#F87171' }}>₹{l.remaining_principal.toLocaleString()}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>{isKannada ? 'ಉಳಿದ ಬಡ್ಡಿ' : 'Interest Due'}</span>
                              <strong style={{ color: '#F87171' }}>₹{l.remaining_interest.toLocaleString()}</strong>
                            </div>
                          </div>
                          <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {isKannada ? 'ಗಡುವು ದಿನಾಂಕ' : 'Due Date'}: {l.due_date}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* My Payment Receipts & Transaction Log */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Receipt size={18} color="#38BDF8" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>
                    {isKannada ? 'ನನ್ನ ರಸೀದಿಗಳು & ಪಾವತಿ ವಿವರಗಳು' : 'My Receipts & Verified Transactions'}
                  </h4>
                </div>

                {transactions.filter((t) => t.member_id === currentMemberRecord.id).length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                    {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {transactions
                      .filter((t) => t.member_id === currentMemberRecord.id)
                      .map((t) => (
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
                          <div>
                            <strong style={{ fontSize: '0.85rem', color: '#FFFFFF', display: 'block' }}>
                              {isKannada ? t.type_kn : t.type.replace('_', ' ')}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              📅 {t.date} • {t.description} • {t.reference_id ? `Ref: ${t.reference_id}` : ''}
                            </span>
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
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 👥 TAB 2: MEMBERS DIRECTORY (Strict 3-Role Access)       */}
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

              {/* Exact 3 Roles Filter: ALL, ADMIN, VICE_ADMIN, MEMBER */}
              <select
                value={memberRoleFilter}
                onChange={(e) => setMemberRoleFilter(e.target.value)}
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1.5px solid #10B981',
                  color: '#34D399',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? 'ಎಲ್ಲಾ ಹುದ್ದೆಗಳು (All Roles)' : 'All Roles'}</option>
                <option value="ADMIN" style={{ background: '#064E3B', color: '#6EE7B7' }}>👑 Admin (ಮುಖ್ಯ ಅಡ್ಮಿನ್)</option>
                <option value="VICE_ADMIN" style={{ background: '#064E3B', color: '#6EE7B7' }}>🛡️ Vice Admin (ಉಪ ಅಡ್ಮಿನ್)</option>
                <option value="MEMBER" style={{ background: '#064E3B', color: '#6EE7B7' }}>👤 Member (ಸದಸ್ಯರು)</option>
              </select>
            </div>

            {activeCanManage && (
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

          {/* Members Cards Grid or Zero State */}
          {filteredMembers.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '0.9rem',
                border: '1px dashed var(--glass-border)',
                borderRadius: '12px'
              }}
            >
              {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
            </div>
          ) : (
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
                        border: m.role === 'ADMIN' ? '2px solid #F59E0B' : m.role === 'VICE_ADMIN' ? '2px solid #3B82F6' : '2px solid #10B981',
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
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: m.role === 'ADMIN' ? '#FEF08A' : m.role === 'VICE_ADMIN' ? '#93C5FD' : '#86EFAC',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          marginTop: '2px'
                        }}
                      >
                        {m.role === 'ADMIN' ? '👑 ADMIN' : m.role === 'VICE_ADMIN' ? '🛡️ VICE ADMIN' : '👤 MEMBER'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                        📞 {activeCanManage || m.id === currentMemberRecord?.id ? m.phone : m.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2')}
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
                      <span>{isKannada ? 'ಲೆಕ್ಕಪತ್ರ' : 'Statement'}</span>
                    </button>

                    {activeCanManage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Edit Button: Vice Admin cannot edit Admin */}
                        {(activeIsAdmin || m.role !== 'ADMIN') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMemberForEdit(m);
                              setEditMemberForm({
                                name: m.name,
                                name_kn: m.name_kn || '',
                                phone: m.phone,
                                address: m.address || 'Muttagundi Village',
                                role: m.role,
                                status: m.status
                              });
                            }}
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1.5px solid #10B981',
                              color: '#34D399',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Edit size={11} />
                            <span>{isKannada ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                          </button>
                        )}

                        {activeCanManage && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await dbService.toggleMemberStatus(m.id, currentUser?.uid || 'admin', currentUser?.name || 'Admin', userRole);
                              } catch (err: any) {
                                alert(err.message);
                              }
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
                            {m.status === 'ACTIVE' ? (isKannada ? 'ನಿಷ್ಕ್ರಿಯ' : 'Deactivate') : (isKannada ? 'ಸಕ್ರಿಯ' : 'Activate')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              {/* Dynamic 6 Months List */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1.5px solid #10B981',
                  color: '#34D399',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {Array.from({ length: 6 }, (_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  const ym = d.toISOString().substring(0, 7);
                  const label = d.toLocaleDateString(isKannada ? 'kn-IN' : 'en-US', { month: 'long', year: 'numeric' });
                  return (
                    <option key={ym} value={ym} style={{ background: '#064E3B', color: '#6EE7B7' }}>
                      {label}
                    </option>
                  );
                })}
              </select>

              {activeCanManage && (
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

          {/* Members Monthly Contribution Status Table or Zero State */}
          {members.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '0.9rem',
                border: '1px dashed var(--glass-border)',
                borderRadius: '12px'
              }}
            >
              {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
            </div>
          ) : (
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
                          {activeCanManage ? (
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              {contrib && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedContributionForEdit(contrib);
                                    setEditContributionForm({
                                      amount_paid: contrib.amount_paid,
                                      status: contrib.status,
                                      payment_date: contrib.payment_date || new Date().toISOString().substring(0, 10),
                                      reference_id: contrib.reference_id || '',
                                      notes: contrib.notes || ''
                                    });
                                  }}
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    border: '1.5px solid #10B981',
                                    color: '#34D399',
                                    padding: '3px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <Edit size={11} />
                                  <span>{isKannada ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                                </button>
                              )}
                              {!isPaid ? (
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
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
                                  {isKannada ? 'ದಾಖಲಾಗಿದೆ ✓' : 'Paid ✓'}
                                </span>
                              )}
                            </div>
                          ) : (
                            isPaid && (
                              <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
                                {isKannada ? 'ದಾಖಲಾಗಿದೆ ✓' : 'Recorded ✓'}
                              </span>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

            {activeCanManage && (
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

          {/* Active Loans Grid or Zero State */}
          {loans.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '0.9rem',
                border: '1px dashed var(--glass-border)',
                borderRadius: '12px'
              }}
            >
              {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
            </div>
          ) : (
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

                  {/* Actions for Admin & Vice Admin */}
                  {activeCanManage && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLoanForEdit(loan);
                          setEditLoanForm({
                            status: loan.status,
                            principal_amount: loan.principal_amount,
                            remaining_principal: loan.remaining_principal,
                            remaining_interest: loan.remaining_interest,
                            tenure_months: loan.tenure_months,
                            due_date: loan.due_date || '',
                            purpose: loan.purpose || ''
                          });
                        }}
                        style={{
                          flex: 1,
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1.5px solid #10B981',
                          color: '#34D399',
                          padding: '7px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit size={12} />
                        <span>{isKannada ? 'ಸಾಲ ತಿದ್ದುಪಡಿ' : 'Edit Loan'}</span>
                      </button>

                      {loan.status !== 'FULLY_PAID' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLoanForRepay(loan);
                            setRepaymentForm((prev) => ({ ...prev, amount: loan.monthly_due_amount || 5000 }));
                            setIsRepayLoanModalOpen(true);
                          }}
                          className="btn-primary"
                          style={{ flex: 1.2, justifyContent: 'center', fontSize: '0.78rem', padding: '7px 10px' }}
                        >
                          <span>{isKannada ? 'ಮರುಪಾವತಿ ದಾಖಲಿಸಿ' : 'Record Repayment'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

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

            {activeCanManage && (
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

          {/* Expenses List or Zero State */}
          {expenses.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '0.9rem',
                border: '1px dashed var(--glass-border)',
                borderRadius: '12px'
              }}
            >
              {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
            </div>
          ) : (
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

                  {activeCanManage && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExpenseForEdit(exp);
                          setEditExpenseForm({
                            category: exp.category,
                            category_kn: exp.category_kn || '',
                            amount: exp.amount,
                            description: exp.description,
                            date: exp.date,
                            paid_by: exp.paid_by
                          });
                        }}
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1.5px solid #10B981',
                          color: '#34D399',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit size={12} />
                        <span>{isKannada ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(isKannada ? 'ಈ ವೆಚ್ಚವನ್ನು ರದ್ದುಗೊಳಿಸಲು ಖಚಿತವೇ?' : 'Delete this expense?')) {
                            await dbService.deleteExpense(exp.id, currentUser?.uid || 'admin', currentUser?.name || 'Admin', userRole);
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
          )}
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
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1.5px solid #10B981',
                  color: '#34D399',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? 'ಎಲ್ಲಾ ವಹಿವಾಟುಗಳು' : 'All Transactions'}</option>
                <option value="FUND_CONTRIBUTION" style={{ background: '#064E3B', color: '#6EE7B7' }}>Fund Contribution / ವಂತಿಗೆ</option>
                <option value="LOAN_ISSUED" style={{ background: '#064E3B', color: '#6EE7B7' }}>Loan Issued / ಸಾಲ ಮಂಜೂರು</option>
                <option value="LOAN_REPAYMENT" style={{ background: '#064E3B', color: '#6EE7B7' }}>Loan Repayment / ಸಾಲ ಮರುಪಾವತಿ</option>
                <option value="INTEREST_PAYMENT" style={{ background: '#064E3B', color: '#6EE7B7' }}>Interest / ಬಡ್ಡಿ</option>
                <option value="EXPENSE" style={{ background: '#064E3B', color: '#6EE7B7' }}>Expense / ವೆಚ್ಚ</option>
              </select>
            </div>
          </div>

          {/* Complete Ledger Table or Zero State */}
          {filteredTransactions.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '0.9rem',
                border: '1px dashed var(--glass-border)',
                borderRadius: '12px'
              }}
            >
              {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
            </div>
          ) : (
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
          )}
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

          {auditLogs.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '0.9rem',
                border: '1px dashed var(--glass-border)',
                borderRadius: '12px'
              }}
            >
              {isKannada ? 'ಯಾವುದೇ ಸಮಿತಿ ಡೇಟಾ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ.' : 'No committee data available yet.'}
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 📦 MODALS: FIRST ADMIN, EDIT MEMBER, ADD MEMBER, ETC.    */}
      {/* ======================================================== */}

      {/* 0. First Admin Setup Modal */}
      {isFirstAdminModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFirstAdminModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={22} color="#F59E0B" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FEF08A' }}>
                  {isKannada ? 'ಮೊದಲ ಸಮಿತಿ ಅಡ್ಮಿನ್ ಸ್ಥಾಪನೆ' : 'Setup Initial Committee Admin'}
                </h3>
              </div>
              <button onClick={() => setIsFirstAdminModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '16px' }}>
              {isKannada
                ? 'ಸಮಿತಿಯ ಮೊದಲ ಅಧಿಕೃತ ಅಡ್ಮಿನ್ ಖಾತೆಯನ್ನು ಸ್ಥಾಪಿಸಿ. ಒಮ್ಮೆ ಅಡ್ಮಿನ್ ರಚನೆಯಾದ ನಂತರ ಮಾತ್ರ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಲು, ಹುದ್ದೆಗಳನ್ನು ನಿಯೋಜಿಸಲು ಮತ್ತು ನಿಧಿ ನಿರ್ವಹಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತದೆ.'
                : 'Establish the initial authorized Admin account for the MTG Committee. Only Admin can assign roles and manage village funds.'}
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!firstAdminForm.name || !firstAdminForm.phone) return;
                try {
                  await dbService.setupFirstAdmin({
                    name: firstAdminForm.name,
                    name_kn: firstAdminForm.name_kn || firstAdminForm.name,
                    phone: firstAdminForm.phone,
                    email: firstAdminForm.email || undefined,
                    address: firstAdminForm.address,
                    userId: currentUser?.uid
                  });
                  alert(isKannada ? '👑 ಮೊದಲ ಸಮಿತಿ ಅಡ್ಮಿನ್ ಯಶಸ್ವಿಯಾಗಿ ಸ್ಥಾಪನೆಯಾಗಿದೆ!' : '👑 Initial Committee Admin established successfully!');
                  setIsFirstAdminModalOpen(false);
                  setHasAdmin(true);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಅಡ್ಮಿನ್ ಹೆಸರು (ಇಂಗ್ಲಿಷ್)' : 'Admin Full Name (English)'} *
                </label>
                <input
                  type="text"
                  required
                  value={firstAdminForm.name}
                  onChange={(e) => setFirstAdminForm({ ...firstAdminForm, name: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಅಡ್ಮಿನ್ ಹೆಸರು (ಕನ್ನಡ)' : 'Admin Name (Kannada)'}
                </label>
                <input
                  type="text"
                  value={firstAdminForm.name_kn}
                  onChange={(e) => setFirstAdminForm({ ...firstAdminForm, name_kn: e.target.value })}
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
                  value={firstAdminForm.phone}
                  onChange={(e) => setFirstAdminForm({ ...firstAdminForm, phone: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಇಮೇಲ್ (ಐಚ್ಛಿಕ)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={firstAdminForm.email}
                  onChange={(e) => setFirstAdminForm({ ...firstAdminForm, email: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವಿಳಾಸ' : 'Address'}
                </label>
                <input
                  type="text"
                  value={firstAdminForm.address}
                  onChange={(e) => setFirstAdminForm({ ...firstAdminForm, address: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <button type="submit" className="btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                <Crown size={16} />
                <span>{isKannada ? 'ಅಡ್ಮಿನ್ ಖಾತೆ ಸೃಷ್ಟಿಸಿ' : 'Create Admin Account'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member & Role Assignment Modal */}
      {selectedMemberForEdit && (
        <div className="modal-overlay" onClick={() => setSelectedMemberForEdit(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={18} color="#3B82F6" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? 'ಸದಸ್ಯರ ವಿವರ & ಹುದ್ದೆ ಬದಲಾವಣೆ' : 'Edit Member & Role Assignment'}
                </h3>
              </div>
              <button onClick={() => setSelectedMemberForEdit(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await dbService.updateCommitteeMember(
                    selectedMemberForEdit.id,
                    {
                      name: editMemberForm.name,
                      name_kn: editMemberForm.name_kn || editMemberForm.name,
                      phone: editMemberForm.phone,
                      address: editMemberForm.address,
                      role: editMemberForm.role,
                      status: editMemberForm.status
                    },
                    currentUser?.uid || 'admin',
                    currentUser?.name || 'Admin',
                    userRole
                  );
                  alert(isKannada ? 'ಸದಸ್ಯರ ವಿವರ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!' : 'Member updated successfully!');
                  setSelectedMemberForEdit(null);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಹೆಸರು (ಇಂಗ್ಲಿಷ್)' : 'Name (English)'} *
                </label>
                <input
                  type="text"
                  required
                  value={editMemberForm.name}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, name: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಹೆಸರು (ಕನ್ನಡ)' : 'Name (Kannada)'}
                </label>
                <input
                  type="text"
                  value={editMemberForm.name_kn}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, name_kn: e.target.value })}
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
                  value={editMemberForm.phone}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, phone: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವಿಳಾಸ' : 'Address'}
                </label>
                <input
                  type="text"
                  value={editMemberForm.address}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, address: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              {/* Committee Role Selector (Only Admin can change roles) */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಸಮಿತಿ ಹುದ್ದೆ (Role)' : 'Committee Role'}
                </label>
                <select
                  disabled={!activeIsAdmin}
                  value={editMemberForm.role}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, role: e.target.value as CommitteeRole })}
                  style={{
                    width: '100%',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1.5px solid #10B981',
                    color: '#34D399',
                    fontWeight: 700,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    opacity: !activeIsAdmin ? 0.6 : 1,
                    outline: 'none',
                    cursor: activeIsAdmin ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="MEMBER" style={{ background: '#064E3B', color: '#6EE7B7' }}>👤 MEMBER (ಸದಸ್ಯರು)</option>
                  <option value="VICE_ADMIN" style={{ background: '#064E3B', color: '#6EE7B7' }}>🛡️ VICE ADMIN (ಉಪ ಅಡ್ಮಿನ್)</option>
                  <option value="ADMIN" style={{ background: '#064E3B', color: '#6EE7B7' }}>👑 ADMIN (ಮುಖ್ಯ ಅಡ್ಮಿನ್)</option>
                </select>
                {!activeIsAdmin && (
                  <span style={{ fontSize: '0.68rem', color: '#F59E0B', marginTop: '2px', display: 'block' }}>
                    {isKannada ? 'ಕೇವಲ ಮುಖ್ಯ ಅಡ್ಮಿನ್ ಮಾತ್ರ ಹುದ್ದೆ ಬದಲಾಯಿಸಬಹುದು.' : 'Only Admin can change roles.'}
                  </span>
                )}
              </div>

              {/* Status Selector (Admin and Vice Admin) */}
              {activeCanManage && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಸ್ಥಿತಿ (Status)' : 'Status'}
                  </label>
                  <select
                    value={editMemberForm.status}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    style={{
                      width: '100%',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1.5px solid #10B981',
                      color: '#34D399',
                      fontWeight: 700,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ACTIVE" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? 'ಸಕ್ರಿಯ (ACTIVE)' : 'ACTIVE'}</option>
                    <option value="INACTIVE" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? 'ನಿಷ್ಕ್ರಿಯ (INACTIVE)' : 'INACTIVE'}</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <span>{isKannada ? 'ಉಳಿಸಿ' : 'Save Changes'}</span>
                </button>

                {activeCanManage && selectedMemberForEdit.role !== 'ADMIN' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(isKannada ? 'ಈ ಸದಸ್ಯರನ್ನು ಸಮಿತಿಯಿಂದ ತೆಗೆದುಹಾಕಲು ಖಚಿತವೇ?' : 'Are you sure you want to remove this member?')) {
                        try {
                          await dbService.deleteCommitteeMember(
                            selectedMemberForEdit.id,
                            currentUser?.uid || 'admin',
                            currentUser?.name || 'Admin',
                            userRole
                          );
                          alert(isKannada ? 'ಸದಸ್ಯರನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ.' : 'Member removed.');
                          setSelectedMemberForEdit(null);
                        } catch (err: any) {
                          alert(err.message);
                        }
                      }
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#F87171',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isKannada ? 'ತೆಗೆದುಹಾಕಿ' : 'Remove'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

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
                  const roleKn = newMemberForm.role === 'ADMIN' ? 'ಅಡ್ಮಿನ್ (ಮುಖ್ಯಸ್ಥರು)' : newMemberForm.role === 'VICE_ADMIN' ? 'ಉಪ ಅಡ್ಮಿನ್' : 'ಸದಸ್ಯರು';
                  await dbService.addCommitteeMember(
                    {
                      name: newMemberForm.name,
                      name_kn: newMemberForm.name_kn || newMemberForm.name,
                      phone: newMemberForm.phone,
                      address: newMemberForm.address,
                      joining_date: new Date().toISOString().split('T')[0],
                      role: newMemberForm.role,
                      role_kn: roleKn,
                      status: 'ACTIVE'
                    },
                    currentUser?.uid || 'admin',
                    currentUser?.name || 'Admin',
                    userRole
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
                  style={{ width: '100%', background: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid #10B981', color: '#34D399', fontWeight: 700, padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="MEMBER" style={{ background: '#064E3B', color: '#6EE7B7' }}>👤 Member (ಸದಸ್ಯರು)</option>
                  <option value="VICE_ADMIN" style={{ background: '#064E3B', color: '#6EE7B7' }}>🛡️ Vice Admin (ಉಪ ಅಡ್ಮಿನ್)</option>
                  {activeIsAdmin && <option value="ADMIN" style={{ background: '#064E3B', color: '#6EE7B7' }}>👑 Admin (ಮುಖ್ಯ ಅಡ್ಮಿನ್)</option>}
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
                  style={{ width: '100%', background: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid #10B981', color: '#34D399', fontWeight: 700, padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? '-- ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ --' : '-- Select Member --'}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} style={{ background: '#064E3B', color: '#6EE7B7' }}>{m.name} ({m.phone})</option>
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
                  style={{ width: '100%', background: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid #10B981', color: '#34D399', fontWeight: 700, padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? '-- ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ --' : '-- Select Member --'}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} style={{ background: '#064E3B', color: '#6EE7B7' }}>{m.name} ({m.phone})</option>
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
                  style={{ width: '100%', background: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid #10B981', color: '#34D399', fontWeight: 700, padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="TEMPLE" style={{ background: '#064E3B', color: '#6EE7B7' }}>Temple / ದೇವಸ್ಥಾನ ಅಭಿವೃದ್ಧಿ</option>
                  <option value="ELECTRICITY" style={{ background: '#064E3B', color: '#6EE7B7' }}>Electricity & Streetlights / ವಿದ್ಯುತ್ & ಬೀದಿದೀಪ</option>
                  <option value="FESTIVAL" style={{ background: '#064E3B', color: '#6EE7B7' }}>Festivals & Culture / ಗ್ರಾಮ ಹಬ್ಬ & ಸಂಭ್ರಮ</option>
                  <option value="WATER_SANITATION" style={{ background: '#064E3B', color: '#6EE7B7' }}>Water & Sanitation / ಕುಡಿಯುವ ನೀರು & ನೈರ್ಮಲ್ಯ</option>
                  <option value="SPORTS" style={{ background: '#064E3B', color: '#6EE7B7' }}>Sports / ಕ್ರೀಡಾ ಪ್ರೋತ್ಸಾಹ</option>
                  <option value="ADMINISTRATION" style={{ background: '#064E3B', color: '#6EE7B7' }}>Administration / ಆಡಳಿತ & ಸಭೆ ಖರ್ಚು</option>
                  <option value="MISCELLANEOUS" style={{ background: '#064E3B', color: '#6EE7B7' }}>Miscellaneous / ಇತರ ವೆಚ್ಚ</option>
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

      {/* 5A. Edit Contribution Modal (Admin & Vice Admin) */}
      {selectedContributionForEdit && (
        <div className="modal-overlay" onClick={() => setSelectedContributionForEdit(null)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#34D399' }}>
                  {isKannada ? 'ವಂತಿಗೆ ವಿವರ ತಿದ್ದುಪಡಿ' : 'Edit Member Contribution'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedContributionForEdit.member_name} • {selectedContributionForEdit.month}
                </span>
              </div>
              <button onClick={() => setSelectedContributionForEdit(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await dbService.updateCommitteeContribution(
                    selectedContributionForEdit.id,
                    editContributionForm,
                    currentUser?.uid || 'admin',
                    currentUser?.name || 'Admin',
                    userRole
                  );
                  setUpdateNotificationToast({
                    msg_en: `${selectedContributionForEdit.member_name}'s contribution for ${selectedContributionForEdit.month} has been updated.`,
                    msg_kn: `${selectedContributionForEdit.member_name} ಅವರ ${selectedContributionForEdit.month} ತಿಂಗಳ ವಂತಿಗೆ ನವೀಕರಿಸಲಾಗಿದೆ.`
                  });
                  setTimeout(() => setUpdateNotificationToast(null), 5000);
                  alert(isKannada ? 'ವಂತಿಗೆ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ! ಎಲ್ಲರಿಗೂ ಅಧಿಸೂಚನೆ ರವಾನೆಯಾಗಿದೆ.' : 'Contribution updated successfully! Notified to everyone.');
                  setSelectedContributionForEdit(null);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಪಾವತಿಸಿದ ಮೊತ್ತ (₹)' : 'Amount Paid (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    value={editContributionForm.amount_paid}
                    onChange={(e) => setEditContributionForm({ ...editContributionForm, amount_paid: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಸ್ಥಿತಿ (Status)' : 'Status'} *
                  </label>
                  <select
                    value={editContributionForm.status}
                    onChange={(e) => setEditContributionForm({ ...editContributionForm, status: e.target.value as ContributionStatus })}
                    style={{ width: '100%', background: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid #10B981', color: '#34D399', fontWeight: 700, padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="PAID" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? 'ಪಾವತಿಸಲಾಗಿದೆ (PAID)' : 'PAID'}</option>
                    <option value="PENDING" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? 'ಬಾಕಿ (PENDING)' : 'PENDING'}</option>
                    <option value="PARTIAL" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? 'ಭಾಗಶಃ (PARTIAL)' : 'PARTIAL'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಪಾವತಿ ದಿನಾಂಕ' : 'Payment Date'}
                </label>
                <input
                  type="date"
                  value={editContributionForm.payment_date}
                  onChange={(e) => setEditContributionForm({ ...editContributionForm, payment_date: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ರೆಫರೆನ್ಸ್ / ಯುಪಿಐ ಐಡಿ' : 'Reference / UPI ID'}
                </label>
                <input
                  type="text"
                  placeholder="UPI-MTG-XXXX or CASH"
                  value={editContributionForm.reference_id}
                  onChange={(e) => setEditContributionForm({ ...editContributionForm, reference_id: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಟಿಪ್ಪಣಿಗಳು' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  value={editContributionForm.notes}
                  onChange={(e) => setEditContributionForm({ ...editContributionForm, notes: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                <CheckCircle2 size={15} />
                <span>{isKannada ? 'ನವೀಕರಿಸಿ ಮತ್ತು ಎಲ್ಲರಿಗೂ ಪ್ರಕಟಿಸಿ' : 'Update & Notify Everyone'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5B. Edit Loan Modal (Admin & Vice Admin) */}
      {selectedLoanForEdit && (
        <div className="modal-overlay" onClick={() => setSelectedLoanForEdit(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#34D399' }}>
                  {isKannada ? 'ಸಾಲದ ವಿವರ ತಿದ್ದುಪಡಿ' : 'Edit Loan Details'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedLoanForEdit.member_name} • {selectedLoanForEdit.loan_number}
                </span>
              </div>
              <button onClick={() => setSelectedLoanForEdit(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await dbService.updateCommitteeLoan(
                    selectedLoanForEdit.id,
                    editLoanForm,
                    currentUser?.uid || 'admin',
                    currentUser?.name || 'Admin',
                    userRole
                  );
                  setUpdateNotificationToast({
                    msg_en: `${selectedLoanForEdit.member_name}'s loan #${selectedLoanForEdit.loan_number} has been updated.`,
                    msg_kn: `${selectedLoanForEdit.member_name} ಅವರ ಸಾಲದ ಮಾಹಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ.`
                  });
                  setTimeout(() => setUpdateNotificationToast(null), 5000);
                  alert(isKannada ? 'ಸಾಲದ ವಿವರಗಳು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ! ಎಲ್ಲರಿಗೂ ಅಧಿಸೂಚನೆ ರವಾನೆಯಾಗಿದೆ.' : 'Loan details updated successfully! Notified to everyone.');
                  setSelectedLoanForEdit(null);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಸಾಲದ ಸ್ಥಿತಿ (Loan Status)' : 'Loan Status'} *
                </label>
                <select
                  value={editLoanForm.status}
                  onChange={(e) => setEditLoanForm({ ...editLoanForm, status: e.target.value as LoanStatus })}
                  style={{ width: '100%', background: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid #10B981', color: '#34D399', fontWeight: 700, padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="ACTIVE" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? 'ಸಕ್ರಿಯ (ACTIVE)' : 'ACTIVE'}</option>
                  <option value="PARTIALLY_PAID" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? 'ಭಾಗಶಃ ಪಾವತಿ (PARTIALLY_PAID)' : 'PARTIALLY_PAID'}</option>
                  <option value="FULLY_PAID" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? 'ಪೂರ್ಣ ಪಾವತಿ (FULLY_PAID)' : 'FULLY_PAID'}</option>
                  <option value="OVERDUE" style={{ background: '#064E3B', color: '#6EE7B7' }}>{isKannada ? 'ಅವಧಿ ಮೀರಿದ (OVERDUE)' : 'OVERDUE'}</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಮಂಜೂರಾದ ಅಸಲು (₹)' : 'Principal Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    value={editLoanForm.principal_amount}
                    onChange={(e) => setEditLoanForm({ ...editLoanForm, principal_amount: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಉಳಿದ ಅಸಲು ಬಾಕಿ (₹)' : 'Remaining Principal (₹)'}
                  </label>
                  <input
                    type="number"
                    value={editLoanForm.remaining_principal}
                    onChange={(e) => setEditLoanForm({ ...editLoanForm, remaining_principal: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಉಳಿದ ಬಡ್ಡಿ ಬಾಕಿ (₹)' : 'Remaining Interest (₹)'}
                  </label>
                  <input
                    type="number"
                    value={editLoanForm.remaining_interest}
                    onChange={(e) => setEditLoanForm({ ...editLoanForm, remaining_interest: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಅವಧಿ (ತಿಂಗಳುಗಳಲ್ಲಿ)' : 'Tenure (Months)'}
                  </label>
                  <input
                    type="number"
                    value={editLoanForm.tenure_months}
                    onChange={(e) => setEditLoanForm({ ...editLoanForm, tenure_months: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಗಡುವು ದಿನಾಂಕ' : 'Due Date'}
                </label>
                <input
                  type="date"
                  value={editLoanForm.due_date}
                  onChange={(e) => setEditLoanForm({ ...editLoanForm, due_date: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಸಾಲದ ಉದ್ದೇಶ' : 'Purpose'}
                </label>
                <input
                  type="text"
                  value={editLoanForm.purpose}
                  onChange={(e) => setEditLoanForm({ ...editLoanForm, purpose: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                <CheckCircle2 size={15} />
                <span>{isKannada ? 'ನವೀಕರಿಸಿ ಮತ್ತು ಎಲ್ಲರಿಗೂ ಪ್ರಕಟಿಸಿ' : 'Update & Notify Everyone'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5C. Edit Expense Modal (Admin & Vice Admin) */}
      {selectedExpenseForEdit && (
        <div className="modal-overlay" onClick={() => setSelectedExpenseForEdit(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#34D399' }}>
                  {isKannada ? 'ವೆಚ್ಚ ತಿದ್ದುಪಡಿ' : 'Edit Committee Expense'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedExpenseForEdit.category} • ₹{selectedExpenseForEdit.amount.toLocaleString()}
                </span>
              </div>
              <button onClick={() => setSelectedExpenseForEdit(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await dbService.updateCommitteeExpense(
                    selectedExpenseForEdit.id,
                    editExpenseForm,
                    currentUser?.uid || 'admin',
                    currentUser?.name || 'Admin',
                    userRole
                  );
                  setUpdateNotificationToast({
                    msg_en: `Expense updated: ${editExpenseForm.description} (₹${editExpenseForm.amount}).`,
                    msg_kn: `${editExpenseForm.description} - ₹${editExpenseForm.amount} ವೆಚ್ಚ ನವೀಕರಿಸಲಾಗಿದೆ.`
                  });
                  setTimeout(() => setUpdateNotificationToast(null), 5000);
                  alert(isKannada ? 'ವೆಚ್ಚ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ! ಎಲ್ಲರಿಗೂ ಅಧಿಸೂಚನೆ ರವಾನೆಯಾಗಿದೆ.' : 'Expense updated successfully! Notified to everyone.');
                  setSelectedExpenseForEdit(null);
                } catch (err: any) {
                  alert(err.message);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವೆಚ್ಚದ ವರ್ಗ' : 'Category'} *
                </label>
                <select
                  value={editExpenseForm.category}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, category: e.target.value as ExpenseCategory })}
                  style={{ width: '100%', background: 'rgba(16, 185, 129, 0.12)', border: '1.5px solid #10B981', color: '#34D399', fontWeight: 700, padding: '8px 12px', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="TEMPLE" style={{ background: '#064E3B', color: '#6EE7B7' }}>Temple / ದೇವಸ್ಥಾನ ಅಭಿವೃದ್ಧಿ</option>
                  <option value="ELECTRICITY" style={{ background: '#064E3B', color: '#6EE7B7' }}>Electricity & Streetlights / ವಿದ್ಯುತ್ & ಬೀದಿದೀಪ</option>
                  <option value="FESTIVAL" style={{ background: '#064E3B', color: '#6EE7B7' }}>Festivals & Culture / ಗ್ರಾಮ ಹಬ್ಬ & ಸಂಭ್ರಮ</option>
                  <option value="WATER_SANITATION" style={{ background: '#064E3B', color: '#6EE7B7' }}>Water & Sanitation / ಕುಡಿಯುವ ನೀರು & ನೈರ್ಮಲ್ಯ</option>
                  <option value="SPORTS" style={{ background: '#064E3B', color: '#6EE7B7' }}>Sports / ಕ್ರೀಡಾ ಪ್ರೋತ್ಸಾಹ</option>
                  <option value="ADMINISTRATION" style={{ background: '#064E3B', color: '#6EE7B7' }}>Administration / ಆಡಳಿತ & ಸಭೆ ಖರ್ಚು</option>
                  <option value="MISCELLANEOUS" style={{ background: '#064E3B', color: '#6EE7B7' }}>Miscellaneous / ಇತರ ವೆಚ್ಚ</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಮೊತ್ತ (₹)' : 'Amount (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    value={editExpenseForm.amount}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ದಿನಾಂಕ' : 'Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={editExpenseForm.date}
                    onChange={(e) => setEditExpenseForm({ ...editExpenseForm, date: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಪಾವತಿಸಿದವರು' : 'Paid By'}
                </label>
                <input
                  type="text"
                  value={editExpenseForm.paid_by}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, paid_by: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವೆಚ್ಚದ ವಿವರ' : 'Description'} *
                </label>
                <input
                  type="text"
                  required
                  value={editExpenseForm.description}
                  onChange={(e) => setEditExpenseForm({ ...editExpenseForm, description: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                <CheckCircle2 size={15} />
                <span>{isKannada ? 'ನವೀಕರಿಸಿ ಮತ್ತು ಎಲ್ಲರಿಗೂ ಪ್ರಕಟಿಸಿ' : 'Update & Notify Everyone'}</span>
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
