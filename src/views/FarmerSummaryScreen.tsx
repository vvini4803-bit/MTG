import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { farmerService } from '../services/farmerService';
import {
  FarmerCrop,
  FarmerIncome,
  FarmerExpense,
  FarmerFamilyMember,
  FarmerEducationExpense,
  FarmerFamilyExpense,
  FarmerMedicalExpense,
  FarmerLoan,
  FarmerSaving,
  FarmerYearSummary,
  IncomeCategory,
  GeneralExpenseCategory,
  FamilyRelationship,
  FamilyExpenseCategory,
  LenderType,
  SavingsCategory,
  LandUnit,
  ProductionUnit
} from '../types/farmer';
import {
  Wheat,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  GraduationCap,
  HeartPulse,
  Landmark,
  PiggyBank,
  BarChart3,
  Download,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Radio,
  FileSpreadsheet,
  Mic,
  ShieldCheck,
  Building,
  Home as HomeIcon,
  Tag
} from 'lucide-react';

interface FarmerSummaryScreenProps {
  onBack: () => void;
}

type FarmerTab =
  | 'overview'
  | 'crops'
  | 'income'
  | 'expenses'
  | 'family'
  | 'education'
  | 'family_exp'
  | 'medical'
  | 'loans'
  | 'savings'
  | 'charts'
  | 'compare';

export const FarmerSummaryScreen: React.FC<FarmerSummaryScreenProps> = ({ onBack }) => {
  const { isKannada } = useLanguage();
  const { currentUser } = useAuth();

  // Active Year State
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2025, 2024, 2023]);
  const [activeTab, setActiveTab] = useState<FarmerTab>('overview');

  // Year Comparison State
  const [compareYear1, setCompareYear1] = useState<number>(2025);
  const [compareYear2, setCompareYear2] = useState<number>(2026);
  const [compareData, setCompareData] = useState<any>(null);

  // Data Collections
  const [summary, setSummary] = useState<FarmerYearSummary>(() =>
    currentUser ? farmerService.getCachedSummary(currentUser.uid, 2026) : {
      year: 2026,
      total_income: 0,
      crop_expenses: 0,
      family_expenses: 0,
      education_expenses: 0,
      medical_expenses: 0,
      loan_payments: 0,
      other_expenses: 0,
      net_profit_loss: 0,
      updated_at: new Date().toISOString()
    }
  );

  const [crops, setCrops] = useState<FarmerCrop[]>([]);
  const [incomes, setIncomes] = useState<FarmerIncome[]>([]);
  const [expenses, setExpenses] = useState<FarmerExpense[]>([]);
  const [family, setFamily] = useState<FarmerFamilyMember[]>([]);
  const [education, setEducation] = useState<FarmerEducationExpense[]>([]);
  const [familyExpenses, setFamilyExpenses] = useState<FarmerFamilyExpense[]>([]);
  const [medical, setMedical] = useState<FarmerMedicalExpense[]>([]);
  const [loans, setLoans] = useState<FarmerLoan[]>([]);
  const [savings, setSavings] = useState<FarmerSaving[]>([]);

  // Modals
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState<string>('2027');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [familyExpModalOpen, setFamilyExpModalOpen] = useState(false);
  const [medicalModalOpen, setMedicalModalOpen] = useState(false);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [savingModalOpen, setSavingModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Form States
  const [cropForm, setCropForm] = useState<Partial<FarmerCrop>>({
    crop_name: '',
    variety: '',
    season: 'Kharif',
    land_area: 1,
    land_unit: 'Acres',
    planting_date: new Date().toISOString().split('T')[0],
    harvest_date: '',
    expected_production: 0,
    actual_production: 0,
    production_unit: 'Quintals',
    selling_price: 0,
    total_income: 0,
    expense_seeds: 0,
    expense_fertilizer: 0,
    expense_pesticides: 0,
    expense_labour: 0,
    expense_irrigation: 0,
    expense_electricity: 0,
    expense_tractor: 0,
    expense_machinery: 0,
    expense_transport: 0,
    expense_other: 0
  });

  const [incomeForm, setIncomeForm] = useState<Partial<FarmerIncome>>({
    source: '',
    category: 'Crop',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [expenseForm, setExpenseForm] = useState<Partial<FarmerExpense>>({
    expense_name: '',
    category: 'Fertilizer',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [familyForm, setFamilyForm] = useState<Partial<FarmerFamilyMember>>({
    name: '',
    relationship: 'Father',
    age: 30,
    gender: 'Male',
    occupation: '',
    education: '',
    phone: '',
    notes: ''
  });

  const [educationForm, setEducationForm] = useState<Partial<FarmerEducationExpense>>({
    student_name: '',
    relationship: 'Son',
    school_college: '',
    class_course: '',
    academic_year: '2025-26',
    fee_tuition: 0,
    fee_hostel: 0,
    fee_books: 0,
    fee_uniform: 0,
    fee_transport: 0,
    fee_exam: 0,
    fee_other: 0,
    notes: ''
  });

  const [familyExpForm, setFamilyExpForm] = useState<Partial<FarmerFamilyExpense>>({
    expense_name: '',
    category: 'Food',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [medicalForm, setMedicalForm] = useState<Partial<FarmerMedicalExpense>>({
    family_member: '',
    expense_type: 'Doctor & Medicines',
    hospital_clinic: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [loanForm, setLoanForm] = useState<Partial<FarmerLoan>>({
    loan_name: '',
    purpose: 'Crop Cultivation',
    lender_type: 'Bank',
    original_amount: 0,
    interest_rate: 7,
    amount_paid: 0,
    monthly_payment: 0,
    start_date: new Date().toISOString().split('T')[0],
    status: 'Active',
    notes: ''
  });

  const [savingForm, setSavingForm] = useState<Partial<FarmerSaving>>({
    type: 'Savings Account',
    category: 'Bank',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Load Years & Subscriptions
  useEffect(() => {
    if (!currentUser) return;
    farmerService.getAvailableYears(currentUser.uid).then((years) => {
      setAvailableYears(years);
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    const unsubC = farmerService.subscribeCrops(uid, selectedYear, (data) => {
      setCrops(data);
      refreshSummary(uid, selectedYear);
    });
    const unsubI = farmerService.subscribeIncome(uid, selectedYear, (data) => {
      setIncomes(data);
      refreshSummary(uid, selectedYear);
    });
    const unsubE = farmerService.subscribeExpenses(uid, selectedYear, (data) => {
      setExpenses(data);
      refreshSummary(uid, selectedYear);
    });
    const unsubF = farmerService.subscribeFamily(uid, selectedYear, setFamily);
    const unsubEd = farmerService.subscribeEducation(uid, selectedYear, (data) => {
      setEducation(data);
      refreshSummary(uid, selectedYear);
    });
    const unsubFE = farmerService.subscribeFamilyExpenses(uid, selectedYear, (data) => {
      setFamilyExpenses(data);
      refreshSummary(uid, selectedYear);
    });
    const unsubM = farmerService.subscribeMedical(uid, selectedYear, (data) => {
      setMedical(data);
      refreshSummary(uid, selectedYear);
    });
    const unsubL = farmerService.subscribeLoans(uid, selectedYear, (data) => {
      setLoans(data);
      refreshSummary(uid, selectedYear);
    });
    const unsubS = farmerService.subscribeSavings(uid, selectedYear, setSavings);

    return () => {
      unsubC();
      unsubI();
      unsubE();
      unsubF();
      unsubEd();
      unsubFE();
      unsubM();
      unsubL();
      unsubS();
    };
  }, [currentUser, selectedYear]);

  const refreshSummary = async (uid: string, year: number) => {
    const s = await farmerService.recalculateYearSummary(uid, year);
    setSummary(s);
  };

  const handleAddYear = async () => {
    const y = parseInt(newYearInput, 10);
    if (!y || y < 1990 || y > 2100 || !currentUser) return;
    const updated = await farmerService.addYear(currentUser.uid, y);
    setAvailableYears(updated);
    setSelectedYear(y);
    setIsAddYearOpen(false);
  };

  // Compare Years handler
  const handleRunComparison = async () => {
    if (!currentUser) return;
    const res = await farmerService.compareYears(currentUser.uid, compareYear1, compareYear2);
    setCompareData(res);
  };

  // Export Data Handler
  const handleExportData = async () => {
    if (!currentUser) return;
    const { json, csv } = await farmerService.exportUserData(currentUser.uid);

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MTG_Farmer_Records_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete All Data Handler
  const handleDeleteAll = async () => {
    if (!currentUser) return;
    await farmerService.deleteAllUserData(currentUser.uid);
    setDeleteConfirmOpen(false);
    refreshSummary(currentUser.uid, selectedYear);
  };

  // Login Gate
  if (!currentUser) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#F8FAFC' }}>
        <div style={{
          maxWidth: '460px',
          margin: '40px auto',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '24px',
          padding: '36px 24px',
          backdropFilter: 'blur(16px)'
        }}>
          <Wheat size={52} color="#10B981" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            {isKannada ? '🌾 ಖಾಸಗಿ ರೈತ & ಕುಟುಂಬ ವಿವರಗಳು' : '🌾 My Farmer & Family Summary'}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
            {isKannada
              ? 'ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ. ಇದು ಸಂಪೂರ್ಣವಾಗಿ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮತ್ತು ಖಾಸಗಿ ಡಿಜಿಟಲ್ ಕೃಷಿ & ಕುಟುಂಬ ಖಾತೆಯಾಗಿದೆ.'
              : 'Please sign in to view your private digital farming, financial and family records. Only you can view your data.'}
          </p>
          <button
            onClick={onBack}
            style={{
              background: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 28px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ← {isKannada ? 'ಹಿಂದಕ್ಕೆ' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '12px 16px 90px', color: '#F8FAFC' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ← {isKannada ? 'ಹಿಂದಕ್ಕೆ' : 'Back'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wheat size={22} color="#10B981" />
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              {isKannada ? '🌾 ನನ್ನ ಕೃಷಿ & ಕುಟುಂಬ ಸಾರಾಂಶ' : '🌾 MY FARMER SUMMARY'}
            </h1>
          </div>
        </div>

        {/* Year Selector & Live AI trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Year Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '2px 8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{isKannada ? 'ವರ್ಷ:' : 'Year:'}</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                background: 'none',
                border: 'none',
                color: '#10B981',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {availableYears.map((y) => (
                <option key={y} value={y} style={{ background: '#0F172A', color: '#FFFFFF' }}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddYearOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#CBD5E1',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + {isKannada ? 'ವರ್ಷ ಸೇರಿಸಿ' : 'Add Year'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '10px',
        marginBottom: '16px'
      }}>
        {[
          { id: 'overview', label: isKannada ? '📊 ಸಾರಾಂಶ' : '📊 Summary' },
          { id: 'crops', label: isKannada ? '🌱 ಬೆಳೆಗಳು' : '🌱 Crops' },
          { id: 'income', label: isKannada ? '💰 ಆದಾಯ' : '💰 Income' },
          { id: 'expenses', label: isKannada ? '💸 ಕೃಷಿ ವೆಚ್ಚ' : '💸 Expenses' },
          { id: 'family', label: isKannada ? '👨‍👩‍👧 ಕುಟುಂಬ' : '👨‍👩‍👧 Family' },
          { id: 'education', label: isKannada ? '🎓 ಶಿಕ್ಷಣ' : '🎓 Education' },
          { id: 'family_exp', label: isKannada ? '🏠 ಮನೆ ವೆಚ್ಚ' : '🏠 Household' },
          { id: 'medical', label: isKannada ? '🏥 ಚಿಕಿತ್ಸೆ' : '🏥 Medical' },
          { id: 'loans', label: isKannada ? '🏦 ಸಾಲಗಳು' : '🏦 Loans' },
          { id: 'savings', label: isKannada ? '💵 ಉಳಿತಾಯ' : '💵 Savings' },
          { id: 'charts', label: isKannada ? '📈 ಚಾರ್ಟ್‌ಗಳು' : '📈 Charts' },
          { id: 'compare', label: isKannada ? '📅 ವರ್ಷ ಹೋಲಿಕೆ' : '📅 Compare' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FarmerTab)}
            style={{
              background: activeTab === tab.id ? '#10B981' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === tab.id ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: activeTab === tab.id ? 800 : 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 1. OVERVIEW DASHBOARD                                     */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div>
          {/* NET PROFIT / LOSS HERO CARD */}
          <div style={{
            background: summary.net_profit_loss >= 0
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: `1.5px solid ${summary.net_profit_loss >= 0 ? '#10B981' : '#EF4444'}`,
            borderRadius: '20px',
            padding: '20px 24px',
            marginBottom: '20px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: summary.net_profit_loss >= 0 ? '#34D399' : '#FCA5A5',
                letterSpacing: '0.04em',
                marginBottom: '4px'
              }}>
                📈 {isKannada ? `${selectedYear} ನಿವ್ವಳ ಲಾಭ / ನಷ್ಟ (NET PROFIT / LOSS)` : `${selectedYear} NET PROFIT / LOSS`}
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: summary.net_profit_loss >= 0 ? '#10B981' : '#EF4444'
              }}>
                {summary.net_profit_loss >= 0 ? '+' : ''}₹{summary.net_profit_loss.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                {isKannada ? 'ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಲೆಕ್ಕ ಹಾಕಲಾಗಿದೆ (Auto-calculated)' : 'Automatically calculated from all records'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('crops')}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🌱 {isKannada ? 'ಬೆಳೆಗಳು' : 'Crops'}
              </button>
              <button
                onClick={() => setActiveTab('income')}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + {isKannada ? 'ಆದಾಯ' : 'Income'}
              </button>
            </div>
          </div>

          {/* FINANCIAL SUMMARY BREAKDOWN TILES */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            {/* Total Income */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>
                💰 {isKannada ? 'ಒಟ್ಟು ಆದಾಯ (Total Income)' : 'Total Income'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '6px 0' }}>
                ₹{summary.total_income.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {incomes.length} {isKannada ? 'ಮೂಲಗಳು' : 'sources'} + {crops.length} {isKannada ? 'ಬೆಳೆಗಳು' : 'crops'}
              </div>
            </div>

            {/* Farm/Crop Expenses */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '16px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 700 }}>
                🌱 {isKannada ? 'ಕೃಷಿ & ಬೆಳೆ ವೆಚ್ಚ (Farm Expenses)' : 'Farm/Crop Expenses'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '6px 0' }}>
                ₹{summary.crop_expenses.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {isKannada ? 'ಗೊಬ್ಬರ, ಕೂಲಿ, ಟ್ರ್ಯಾಕ್ಟರ್, ಬೀಜ' : 'Fertilizer, labour, seeds, etc.'}
              </div>
            </div>

            {/* Family Expenses */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '16px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 700 }}>
                👨‍👩‍👧 {isKannada ? 'ಕುಟುಂಬದ ವೆಚ್ಚ (Family Expenses)' : 'Family Expenses'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '6px 0' }}>
                ₹{summary.family_expenses.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {isKannada ? 'ಆಹಾರ, ಬಟ್ಟೆ, ಪ್ರಯಾಣ, ಮನೆ' : 'Food, clothing, house upkeep'}
              </div>
            </div>

            {/* Education */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '16px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#C084FC', fontWeight: 700 }}>
                🎓 {isKannada ? 'ಶಿಕ್ಷಣ ವೆಚ್ಚ (Education)' : 'Education'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '6px 0' }}>
                ₹{summary.education_expenses.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {education.length} {isKannada ? 'ವಿದ್ಯಾರ್ಥಿಗಳು' : 'students registered'}
              </div>
            </div>

            {/* Medical */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '16px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#F472B6', fontWeight: 700 }}>
                🏥 {isKannada ? 'ವೈದ್ಯಕೀಯ ವೆಚ್ಚ (Medical)' : 'Medical'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '6px 0' }}>
                ₹{summary.medical_expenses.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {medical.length} {isKannada ? 'ದಾಖಲೆಗಳು' : 'medical records'}
              </div>
            </div>

            {/* Loans */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#F87171', fontWeight: 700 }}>
                🏦 {isKannada ? 'ಸಾಲ ಪಾವತಿ (Loan Payments)' : 'Loan Payments'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '6px 0' }}>
                ₹{summary.loan_payments.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {loans.filter((l) => l.status === 'Active').length} {isKannada ? 'ಸಕ್ರಿಯ ಸಾಲಗಳು' : 'active loans'}
              </div>
            </div>

            {/* Other Expenses */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '16px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>
                💵 {isKannada ? 'ಇತರೆ ವೆಚ್ಚಗಳು (Other Expenses)' : 'Other Expenses'}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', margin: '6px 0' }}>
                ₹{summary.other_expenses.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {isKannada ? 'ಇತರೆ ಎಲ್ಲಾ ಖರ್ಚುಗಳು' : 'Miscellaneous expenditures'}
              </div>
            </div>
          </div>

          {/* CROPS SUMMARY TEASER */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wheat size={20} color="#10B981" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                  {isKannada ? `🌱 ${selectedYear} ವರ್ಷದ ಬೆಳೆಗಳು` : `🌱 ${selectedYear} Crops`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setCropForm({
                    crop_name: '',
                    variety: '',
                    season: 'Kharif',
                    land_area: 1,
                    land_unit: 'Acres',
                    planting_date: new Date().toISOString().split('T')[0],
                    harvest_date: '',
                    expected_production: 0,
                    actual_production: 0,
                    production_unit: 'Quintals',
                    selling_price: 0,
                    total_income: 0,
                    expense_seeds: 0,
                    expense_fertilizer: 0,
                    expense_pesticides: 0,
                    expense_labour: 0,
                    expense_irrigation: 0,
                    expense_electricity: 0,
                    expense_tractor: 0,
                    expense_machinery: 0,
                    expense_transport: 0,
                    expense_other: 0
                  });
                  setCropModalOpen(true);
                }}
                style={{
                  background: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + {isKannada ? 'ಹೊಸ ಬೆಳೆ ಸೇರಿಸಿ' : 'Add Crop'}
              </button>
            </div>

            {crops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '0.85rem' }}>
                {isKannada ? 'ಯಾವುದೇ ಬೆಳೆಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ. ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ಸೇರಿಸಿ.' : 'No crops added for this year yet.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {crops.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '14px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
                        🌱 {c.crop_name} {c.variety ? `(${c.variety})` : ''}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: c.profit_loss >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: c.profit_loss >= 0 ? '#34D399' : '#FCA5A5'
                      }}>
                        {c.profit_loss >= 0 ? 'PROFIT' : 'LOSS'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>
                      <span>{isKannada ? 'ಆದಾಯ' : 'Income'}:</span>
                      <strong style={{ color: '#10B981' }}>₹{c.total_income.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>
                      <span>{isKannada ? 'ವೆಚ್ಚ' : 'Expense'}:</span>
                      <strong style={{ color: '#F59E0B' }}>₹{c.total_expense.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span>{c.profit_loss >= 0 ? (isKannada ? 'ಲಾಭ' : 'Profit') : (isKannada ? 'ನಷ್ಟ' : 'Loss')}:</span>
                      <strong style={{ color: c.profit_loss >= 0 ? '#10B981' : '#EF4444' }}>
                        {c.profit_loss >= 0 ? '+' : ''}₹{c.profit_loss.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* EXPORT & DATA MANAGEMENT BAR */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
                📁 {isKannada ? 'ನನ್ನ ದಾಖಲೆಗಳ ನಿರ್ವಹಣೆ' : 'My Data Management'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                {isKannada ? 'ದಾಖಲೆಗಳನ್ನು ಎಕ್ಸೆಲ್/CSV ರೂಪದಲ್ಲಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಸುರಕ್ಷಿತವಾಗಿ ನಿರ್ವಹಿಸಿ' : 'Export your private records or clear data'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleExportData}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#93C5FD',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={15} />
                <span>{isKannada ? 'ಡೇಟಾ ಡೌನ್‌ಲೋಡ್ (CSV)' : 'Export My Data'}</span>
              </button>

              <button
                onClick={() => setDeleteConfirmOpen(true)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#FCA5A5',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={15} />
                <span>{isKannada ? 'ದಾಖಲೆ ಅಳಿಸಿ' : 'Delete Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CROPS MANAGEMENT TAB                                   */}
      {/* ========================================================= */}
      {activeTab === 'crops' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                🌱 {isKannada ? `${selectedYear} ಬೆಳೆ ನಿರ್ವಹಣೆ` : `${selectedYear} Crop Management`}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '2px 0 0 0' }}>
                {isKannada ? 'ಪ್ರತಿಯೊಂದು ಬೆಳೆಯ ವೆಚ್ಚ ಮತ್ತು ನಿವ್ವಳ ಲಾಭವನ್ನು ನೋಡಿ' : 'Track yield, detailed expenses and crop-level profit'}
              </p>
            </div>
            <button
              onClick={() => {
                setCropForm({
                  crop_name: '',
                  variety: '',
                  season: 'Kharif',
                  land_area: 1,
                  land_unit: 'Acres',
                  planting_date: new Date().toISOString().split('T')[0],
                  harvest_date: '',
                  expected_production: 0,
                  actual_production: 0,
                  production_unit: 'Quintals',
                  selling_price: 0,
                  total_income: 0,
                  expense_seeds: 0,
                  expense_fertilizer: 0,
                  expense_pesticides: 0,
                  expense_labour: 0,
                  expense_irrigation: 0,
                  expense_electricity: 0,
                  expense_tractor: 0,
                  expense_machinery: 0,
                  expense_transport: 0,
                  expense_other: 0
                });
                setCropModalOpen(true);
              }}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + {isKannada ? 'ಬೆಳೆ ಸೇರಿಸಿ' : 'Add Crop'}
            </button>
          </div>

          {crops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <Wheat size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div>{isKannada ? 'ಯಾವುದೇ ಬೆಳೆಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ' : 'No crops added yet.'}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {crops.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>
                        🌱 {c.crop_name} {c.variety ? `— ${c.variety}` : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {isKannada ? 'ಪ್ರದೇಶ' : 'Area'}: {c.land_area} {c.land_unit} • {c.season} • {isKannada ? 'ಉತ್ಪಾದನೆ' : 'Yield'}: {c.actual_production} {c.production_unit}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: c.profit_loss >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: c.profit_loss >= 0 ? '#34D399' : '#FCA5A5'
                      }}>
                        {c.profit_loss >= 0 ? 'PROFIT' : 'LOSS'}
                      </span>
                      <button
                        onClick={() => {
                          setCropForm(c);
                          setCropModalOpen(true);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: 'none',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => currentUser && farmerService.deleteCrop(currentUser.uid, selectedYear, c.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: 'none',
                          color: '#EF4444',
                          borderRadius: '8px',
                          padding: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Income & Expense Breakdown */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    marginBottom: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{isKannada ? 'ಆದಾಯ (Income)' : 'Income'}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10B981' }}>₹{c.total_income.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{isKannada ? 'ವೆಚ್ಚ (Expense)' : 'Expense'}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F59E0B' }}>₹{c.total_expense.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{c.profit_loss >= 0 ? (isKannada ? 'ಲಾಭ (Profit)' : 'Profit') : (isKannada ? 'ನಷ್ಟ (Loss)' : 'Loss')}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: c.profit_loss >= 0 ? '#10B981' : '#EF4444' }}>
                        {c.profit_loss >= 0 ? '+' : ''}₹{c.profit_loss.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Expenses breakdown tags */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.72rem', color: '#94A3B8' }}>
                    {c.expense_fertilizer > 0 && <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>ಗೊಬ್ಬರ: ₹{c.expense_fertilizer}</span>}
                    {c.expense_labour > 0 && <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>ಕೂಲಿ: ₹{c.expense_labour}</span>}
                    {c.expense_seeds > 0 && <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>ಬೀಜ: ₹{c.expense_seeds}</span>}
                    {c.expense_pesticides > 0 && <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>ಔಷಧಿ: ₹{c.expense_pesticides}</span>}
                    {c.expense_tractor > 0 && <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>ಟ್ರ್ಯಾಕ್ಟರ್: ₹{c.expense_tractor}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. INCOME TAB                                             */}
      {/* ========================================================= */}
      {activeTab === 'income' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                💰 {isKannada ? `${selectedYear} ಆದಾಯದ ವಿವರಗಳು` : `${selectedYear} Income Records`}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 700 }}>
                {isKannada ? 'ಒಟ್ಟು ಆದಾಯ' : 'Total Income'}: ₹{summary.total_income.toLocaleString('en-IN')}
              </div>
            </div>
            <button
              onClick={() => {
                setIncomeForm({
                  source: '',
                  category: 'Dairy',
                  amount: 0,
                  date: new Date().toISOString().split('T')[0],
                  notes: ''
                });
                setIncomeModalOpen(true);
              }}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + {isKannada ? 'ಆದಾಯ ಸೇರಿಸಿ' : 'Add Income'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {incomes.map((it) => (
              <div
                key={it.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>{it.source}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{it.category} • {it.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10B981' }}>
                    +₹{it.amount.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => currentUser && farmerService.deleteIncome(currentUser.uid, selectedYear, it.id)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. EXPENSES TAB                                           */}
      {/* ========================================================= */}
      {activeTab === 'expenses' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                💸 {isKannada ? `${selectedYear} ಕೃಷಿ & ಸಾಮಾನ್ಯ ವೆಚ್ಚಗಳು` : `${selectedYear} Expenses`}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#FBBF24', fontWeight: 700 }}>
                {isKannada ? 'ಒಟ್ಟು ಕೃಷಿ ವೆಚ್ಚ' : 'Farm Expenses'}: ₹{summary.crop_expenses.toLocaleString('en-IN')}
              </div>
            </div>
            <button
              onClick={() => {
                setExpenseForm({
                  expense_name: '',
                  category: 'Fertilizer',
                  amount: 0,
                  date: new Date().toISOString().split('T')[0],
                  notes: ''
                });
                setExpenseModalOpen(true);
              }}
              style={{
                background: '#F59E0B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + {isKannada ? 'ವೆಚ್ಚ ಸೇರಿಸಿ' : 'Add Expense'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {expenses.map((e) => (
              <div
                key={e.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>{e.expense_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{e.category} • {e.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F87171' }}>
                    -₹{e.amount.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => currentUser && farmerService.deleteExpense(currentUser.uid, selectedYear, e.id)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. FAMILY TAB (Strictly Private)                          */}
      {/* ========================================================= */}
      {activeTab === 'family' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                👨‍👩‍👧 {isKannada ? 'ನನ್ನ ಕುಟುಂಬ (ಖಾಸಗಿ)' : 'My Family (Private)'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '2px 0 0 0' }}>
                {isKannada ? 'ಈ ವಿವರಗಳು ಸಂಪೂರ್ಣ ಖಾಸಗಿಯಾಗಿದ್ದು ಯಾವುದೇ ಸಾರ್ವಜನಿಕ ಪಟ್ಟಿಯಲ್ಲಿ ಕಾಣಿಸುವುದಿಲ್ಲ' : 'Strictly confidential family records'}
              </p>
            </div>
            <button
              onClick={() => {
                setFamilyForm({
                  name: '',
                  relationship: 'Son',
                  age: 18,
                  gender: 'Male',
                  occupation: 'Student',
                  education: '',
                  phone: '',
                  notes: ''
                });
                setFamilyModalOpen(true);
              }}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + {isKannada ? 'ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ' : 'Add Member'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {family.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>{m.name}</div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {m.relationship}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '4px' }}>
                  {isKannada ? 'ವಯಸ್ಸು' : 'Age'}: {m.age} • {m.gender}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>
                  {isKannada ? 'ಉದ್ಯೋಗ' : 'Occupation'}: {m.occupation || 'N/A'}
                </div>
                {m.education && (
                  <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '4px' }}>
                    {isKannada ? 'ವಿದ್ಯಾರ್ಹತೆ' : 'Education'}: {m.education}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    onClick={() => currentUser && farmerService.deleteFamilyMember(currentUser.uid, selectedYear, m.id)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. EDUCATION TAB                                          */}
      {/* ========================================================= */}
      {activeTab === 'education' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                🎓 {isKannada ? `${selectedYear} ಶಿಕ್ಷಣ ವೆಚ್ಚಗಳು` : `${selectedYear} Education Expenses`}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#C084FC', fontWeight: 700 }}>
                {isKannada ? 'ಒಟ್ಟು ಶಿಕ್ಷಣ ವೆಚ್ಚ' : 'Total Education Fees'}: ₹{summary.education_expenses.toLocaleString('en-IN')}
              </div>
            </div>
            <button
              onClick={() => {
                setEducationForm({
                  student_name: '',
                  relationship: 'Son',
                  school_college: '',
                  class_course: '',
                  academic_year: `${selectedYear-1}-${selectedYear.toString().slice(-2)}`,
                  fee_tuition: 0,
                  fee_hostel: 0,
                  fee_books: 0,
                  fee_uniform: 0,
                  fee_transport: 0,
                  fee_exam: 0,
                  fee_other: 0,
                  notes: ''
                });
                setEducationModalOpen(true);
              }}
              style={{
                background: '#A855F7',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + {isKannada ? 'ಶಿಕ್ಷಣ ವೆಚ್ಚ ಸೇರಿಸಿ' : 'Add Education Expense'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {education.map((ed) => (
              <div
                key={ed.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                      🎓 {ed.student_name} ({ed.relationship})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {ed.class_course} • {ed.school_college} • {ed.academic_year}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#C084FC' }}>
                      ₹{ed.total_expense.toLocaleString('en-IN')}
                    </div>
                    <button
                      onClick={() => currentUser && farmerService.deleteEducation(currentUser.uid, selectedYear, ed.id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.72rem', color: '#CBD5E1' }}>
                  {ed.fee_tuition > 0 && <span>ಕಾಲೇಜ್/ಶಾಲೆ ಫೀಸ್: ₹{ed.fee_tuition}</span>}
                  {ed.fee_hostel > 0 && <span>ಹಾಸ್ಟೆಲ್: ₹{ed.fee_hostel}</span>}
                  {ed.fee_books > 0 && <span>ಪುಸ್ತಕಗಳು: ₹{ed.fee_books}</span>}
                  {ed.fee_transport > 0 && <span>ಬಸ್/ವಾಹನ: ₹{ed.fee_transport}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. HOUSEHOLD FAMILY EXPENSES TAB                          */}
      {/* ========================================================= */}
      {activeTab === 'family_exp' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                🏠 {isKannada ? `${selectedYear} ಮನೆ ವೆಚ್ಚಗಳು` : `${selectedYear} Household Expenses`}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#60A5FA', fontWeight: 700 }}>
                {isKannada ? 'ಒಟ್ಟು ಮನೆ ವೆಚ್ಚ' : 'Total Household'}: ₹{summary.family_expenses.toLocaleString('en-IN')}
              </div>
            </div>
            <button
              onClick={() => {
                setFamilyExpForm({
                  expense_name: '',
                  category: 'Food',
                  amount: 0,
                  date: new Date().toISOString().split('T')[0],
                  notes: ''
                });
                setFamilyExpModalOpen(true);
              }}
              style={{
                background: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + {isKannada ? 'ಮನೆ ವೆಚ್ಚ ಸೇರಿಸಿ' : 'Add Expense'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {familyExpenses.map((fe) => (
              <div
                key={fe.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>{fe.expense_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{fe.category} • {fe.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F87171' }}>
                    -₹{fe.amount.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => currentUser && farmerService.deleteFamilyExpense(currentUser.uid, selectedYear, fe.id)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. MEDICAL TAB                                            */}
      {/* ========================================================= */}
      {activeTab === 'medical' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                🏥 {isKannada ? `${selectedYear} ವೈದ್ಯಕೀಯ & ಆಸ್ಪತ್ರೆ ವೆಚ್ಚ` : `${selectedYear} Medical Expenses`}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#F472B6', fontWeight: 700 }}>
                {isKannada ? 'ಒಟ್ಟು ವೈದ್ಯಕೀಯ ವೆಚ್ಚ' : 'Total Medical'}: ₹{summary.medical_expenses.toLocaleString('en-IN')}
              </div>
            </div>
            <button
              onClick={() => {
                setMedicalForm({
                  family_member: '',
                  expense_type: 'Doctor & Medicines',
                  hospital_clinic: '',
                  amount: 0,
                  date: new Date().toISOString().split('T')[0],
                  notes: ''
                });
                setMedicalModalOpen(true);
              }}
              style={{
                background: '#EC4899',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + {isKannada ? 'ಚಿಕಿತ್ಸಾ ವೆಚ್ಚ ಸೇರಿಸಿ' : 'Add Medical Expense'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {medical.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>
                    {m.family_member} — {m.expense_type}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{m.hospital_clinic} • {m.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F472B6' }}>
                    -₹{m.amount.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => currentUser && farmerService.deleteMedical(currentUser.uid, selectedYear, m.id)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. LOANS TAB                                              */}
      {/* ========================================================= */}
      {activeTab === 'loans' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                🏦 {isKannada ? `${selectedYear} ಸಾಲ ಮತ್ತು ಬಾಕಿ ವಿವರಗಳು` : `${selectedYear} Loans & Debts`}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#F87171', fontWeight: 700 }}>
                {isKannada ? 'ಈ ವರ್ಷ ಪಾವತಿಸಿದ ಸಾಲ' : 'Loan Payments This Year'}: ₹{summary.loan_payments.toLocaleString('en-IN')}
              </div>
            </div>
            <button
              onClick={() => {
                setLoanForm({
                  loan_name: '',
                  purpose: 'Crop Cultivation',
                  lender_type: 'Bank',
                  original_amount: 0,
                  interest_rate: 7,
                  amount_paid: 0,
                  monthly_payment: 0,
                  start_date: new Date().toISOString().split('T')[0],
                  status: 'Active',
                  notes: ''
                });
                setLoanModalOpen(true);
              }}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + {isKannada ? 'ಸಾಲ ಸೇರಿಸಿ' : 'Add Loan'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loans.map((l) => (
              <div
                key={l.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                      🏦 {l.loan_name} ({l.lender_type})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{l.purpose} • {l.interest_rate}% p.a.</div>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: l.status === 'Active' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: l.status === 'Active' ? '#FCA5A5' : '#34D399'
                  }}>
                    {l.status}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '10px 14px',
                  borderRadius: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{isKannada ? 'ಮೂಲ ಸಾಲ' : 'Total Loan'}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>₹{l.original_amount.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{isKannada ? 'ಪಾವತಿಸಿದ ಹಣ' : 'Paid'}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10B981' }}>₹{l.amount_paid.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{isKannada ? 'ಬಾಕಿ ಮೊತ್ತ' : 'Remaining'}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#EF4444' }}>₹{l.remaining_amount.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    onClick={() => currentUser && farmerService.deleteLoan(currentUser.uid, selectedYear, l.id)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. SAVINGS TAB                                           */}
      {/* ========================================================= */}
      {activeTab === 'savings' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                💵 {isKannada ? `${selectedYear} ಉಳಿತಾಯ ಮತ್ತು ಠೇವಣಿ` : `${selectedYear} Savings`}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 700 }}>
                {isKannada ? 'ಒಟ್ಟು ಉಳಿತಾಯ' : 'Total Savings'}: ₹{savings.reduce((s, v) => s + (Number(v.amount) || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>
            <button
              onClick={() => {
                setSavingForm({
                  type: 'Bank Savings',
                  category: 'Bank',
                  amount: 0,
                  date: new Date().toISOString().split('T')[0],
                  notes: ''
                });
                setSavingModalOpen(true);
              }}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + {isKannada ? 'ಉಳಿತಾಯ ಸೇರಿಸಿ' : 'Add Savings'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savings.map((s) => (
              <div
                key={s.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F8FAFC' }}>{s.type}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{s.category} • {s.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34D399' }}>
                    ₹{s.amount.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => currentUser && farmerService.deleteSaving(currentUser.uid, selectedYear, s.id)}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 11. REPORTS & CHARTS TAB                                  */}
      {/* ========================================================= */}
      {activeTab === 'charts' && (
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>
            📊 {isKannada ? `${selectedYear} ಹಣಕಾಸು ಮತ್ತು ಬೆಳೆ ವಿಶ್ಲೇಷಣೆ` : `${selectedYear} Financial Charts & Reports`}
          </h2>

          {/* Visual Income vs Expenses Bar */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '18px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
              {isKannada ? 'ಆದಾಯ vs ಒಟ್ಟು ವೆಚ್ಚಗಳು' : 'Income vs Total Outflows'}
            </div>
            {(() => {
              const totalOutflows = summary.crop_expenses + summary.family_expenses + summary.education_expenses + summary.medical_expenses + summary.other_expenses;
              const maxVal = Math.max(summary.total_income, totalOutflows, 1);
              const incPct = Math.round((summary.total_income / maxVal) * 100);
              const outPct = Math.round((totalOutflows / maxVal) * 100);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: '#10B981' }}>{isKannada ? 'ಆದಾಯ (Income)' : 'Income'}</span>
                      <strong style={{ color: '#10B981' }}>₹{summary.total_income.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '12px', overflow: 'hidden' }}>
                      <div style={{ width: `${incPct}%`, background: '#10B981', height: '100%', borderRadius: '6px' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: '#EF4444' }}>{isKannada ? 'ಒಟ್ಟು ವೆಚ್ಚ (Expenses)' : 'Outflows'}</span>
                      <strong style={{ color: '#EF4444' }}>₹{totalOutflows.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '12px', overflow: 'hidden' }}>
                      <div style={{ width: `${outPct}%`, background: '#EF4444', height: '100%', borderRadius: '6px' }} />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Expense Distribution Visual */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '18px'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>
              {isKannada ? 'ವೆಚ್ಚಗಳ ವಿಂಗಡಣೆ (Expense Distribution)' : 'Expense Breakdown'}
            </div>
            {[
              { label: isKannada ? 'ಕೃಷಿ ವೆಚ್ಚ' : 'Farming', amount: summary.crop_expenses, color: '#F59E0B' },
              { label: isKannada ? 'ಮನೆ/ಕುಟುಂಬ' : 'Family', amount: summary.family_expenses, color: '#3B82F6' },
              { label: isKannada ? 'ಶಿಕ್ಷಣ' : 'Education', amount: summary.education_expenses, color: '#A855F7' },
              { label: isKannada ? 'ವೈದ್ಯಕೀಯ' : 'Medical', amount: summary.medical_expenses, color: '#EC4899' },
              { label: isKannada ? 'ಸಾಲ ಪಾವತಿ' : 'Loans', amount: summary.loan_payments, color: '#EF4444' },
              { label: isKannada ? 'ಇತರೆ' : 'Other', amount: summary.other_expenses, color: '#94A3B8' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.82rem', color: item.color }}>• {item.label}</span>
                <strong style={{ fontSize: '0.85rem' }}>₹{item.amount.toLocaleString('en-IN')}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 12. COMPARE YEARS TAB                                     */}
      {/* ========================================================= */}
      {activeTab === 'compare' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              📅 {isKannada ? 'ವರ್ಷಗಳ ಹೋಲಿಕೆ (Compare Years)' : 'Year-over-Year Comparison'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '2px 0 0 0' }}>
              {isKannada ? 'ನಿಮ್ಮ ಯಾವುದೇ ಎರಡು ವರ್ಷಗಳ ಆದಾಯ ಮತ್ತು ಲಾಭವನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ' : 'Compare income and profit across your farming years'}
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginRight: '6px' }}>{isKannada ? 'ವರ್ಷ 1:' : 'Year 1:'}</span>
              <select
                value={compareYear1}
                onChange={(e) => setCompareYear1(Number(e.target.value))}
                style={{ background: '#0F172A', color: '#10B981', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '8px' }}
              >
                {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginRight: '6px' }}>{isKannada ? 'ವರ್ಷ 2:' : 'Year 2:'}</span>
              <select
                value={compareYear2}
                onChange={(e) => setCompareYear2(Number(e.target.value))}
                style={{ background: '#0F172A', color: '#10B981', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '8px' }}
              >
                {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <button
              onClick={handleRunComparison}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 18px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {isKannada ? 'ಹೋಲಿಕೆ ಮಾಡಿ' : 'Compare'}
            </button>
          </div>

          {compareData && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8', margin: '0 0 8px 0' }}>{compareYear1}</h3>
                  <div style={{ fontSize: '0.82rem', marginBottom: '4px' }}>ಆದಾಯ: <strong>{compareData[compareYear1]?.income}</strong></div>
                  <div style={{ fontSize: '0.82rem', marginBottom: '4px' }}>ವೆಚ್ಚ: <strong>{compareData[compareYear1]?.expenses}</strong></div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10B981' }}>ಲಾಭ: {compareData[compareYear1]?.profit}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38BDF8', margin: '0 0 8px 0' }}>{compareYear2}</h3>
                  <div style={{ fontSize: '0.82rem', marginBottom: '4px' }}>ಆದಾಯ: <strong>{compareData[compareYear2]?.income}</strong></div>
                  <div style={{ fontSize: '0.82rem', marginBottom: '4px' }}>ವೆಚ್ಚ: <strong>{compareData[compareYear2]?.expenses}</strong></div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10B981' }}>ಲಾಭ: {compareData[compareYear2]?.profit}</div>
                </div>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '0.85rem'
              }}>
                <div>📊 <strong>ಲಾಭದ ವ್ಯತ್ಯಾಸ (Profit Difference):</strong> {compareData.comparison?.profitDifference}</div>
                <div>💰 <strong>ಆದಾಯದ ವ್ಯತ್ಯಾಸ (Income Difference):</strong> {compareData.comparison?.incomeDifference}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD NEW YEAR                                       */}
      {/* ========================================================= */}
      {isAddYearOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '360px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 14px 0' }}>
              + {isKannada ? 'ಹೊಸ ವರ್ಷ ಸೇರಿಸಿ' : 'Add New Year'}
            </h3>
            <input
              type="number"
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              placeholder="e.g. 2027"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#FFFFFF',
                fontSize: '1rem',
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsAddYearOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', padding: '8px 14px', cursor: 'pointer' }}
              >
                {isKannada ? 'ರದ್ದು' : 'Cancel'}
              </button>
              <button
                onClick={handleAddYear}
                style={{ background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}
              >
                {isKannada ? 'ಸೇರಿಸಿ' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT CROP                                    */}
      {/* ========================================================= */}
      {cropModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px 0' }}>
              🌱 {isKannada ? 'ಬೆಳೆ ವಿವರಗಳು (Crop Details)' : 'Crop Details'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಬೆಳೆಯ ಹೆಸರು' : 'Crop Name'} *
                </label>
                <input
                  type="text"
                  value={cropForm.crop_name || ''}
                  onChange={(e) => setCropForm({ ...cropForm, crop_name: e.target.value })}
                  placeholder="e.g. Pomegranate, Ragi, Arecanut"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ತಳಿ (Variety)' : 'Variety'}
                  </label>
                  <input
                    type="text"
                    value={cropForm.variety || ''}
                    onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
                    placeholder="e.g. Bhagwa"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಹಂಗಾಮು (Season)' : 'Season'}
                  </label>
                  <select
                    value={cropForm.season || 'Kharif'}
                    onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                  >
                    <option value="Kharif">Kharif (ಮುಂಗಾರು)</option>
                    <option value="Rabi">Rabi (ಹಿಂಗಾರು)</option>
                    <option value="Summer">Summer (ಬೇಸಿಗೆ)</option>
                    <option value="Annual">Annual (ವಾರ್ಷಿಕ)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ' : 'Land Area'}
                  </label>
                  <input
                    type="number"
                    value={cropForm.land_area || 1}
                    onChange={(e) => setCropForm({ ...cropForm, land_area: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಘಟಕ' : 'Unit'}
                  </label>
                  <select
                    value={cropForm.land_unit || 'Acres'}
                    onChange={(e) => setCropForm({ ...cropForm, land_unit: e.target.value as LandUnit })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                  >
                    <option value="Acres">Acres (ಎಕರೆ)</option>
                    <option value="Guntas">Guntas (ಗುಂಟೆ)</option>
                    <option value="Cents">Cents (ಸೆಂಟ್ಸ್)</option>
                    <option value="Hectares">Hectares (ಹೆಕ್ಟೇರ್)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಒಟ್ಟು ಆದಾಯ (₹)' : 'Total Crop Income (₹)'}
                  </label>
                  <input
                    type="number"
                    value={cropForm.total_income || 0}
                    onChange={(e) => setCropForm({ ...cropForm, total_income: Number(e.target.value) })}
                    placeholder="250000"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '10px', padding: '8px 12px', color: '#10B981', fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ವಾಸ್ತವ ಉತ್ಪಾದನೆ' : 'Actual Production'}
                  </label>
                  <input
                    type="number"
                    value={cropForm.actual_production || 0}
                    onChange={(e) => setCropForm({ ...cropForm, actual_production: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                  />
                </div>
              </div>

              {/* Detailed Crop Expenses */}
              <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FBBF24', display: 'block', marginBottom: '8px' }}>
                  💸 {isKannada ? 'ಬೆಳೆ ವೆಚ್ಚಗಳ ವಿವರ (Crop Expenses)' : 'Crop Expenses Breakdown (₹)'}
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ಬೀಜ (Seeds)</label>
                    <input
                      type="number"
                      value={cropForm.expense_seeds || 0}
                      onChange={(e) => setCropForm({ ...cropForm, expense_seeds: Number(e.target.value) })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ಗೊಬ್ಬರ (Fertilizer)</label>
                    <input
                      type="number"
                      value={cropForm.expense_fertilizer || 0}
                      onChange={(e) => setCropForm({ ...cropForm, expense_fertilizer: Number(e.target.value) })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ಔಷಧಿ (Pesticides)</label>
                    <input
                      type="number"
                      value={cropForm.expense_pesticides || 0}
                      onChange={(e) => setCropForm({ ...cropForm, expense_pesticides: Number(e.target.value) })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ಕೂಲಿ (Labour)</label>
                    <input
                      type="number"
                      value={cropForm.expense_labour || 0}
                      onChange={(e) => setCropForm({ ...cropForm, expense_labour: Number(e.target.value) })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ನೀರಾವರಿ (Irrigation)</label>
                    <input
                      type="number"
                      value={cropForm.expense_irrigation || 0}
                      onChange={(e) => setCropForm({ ...cropForm, expense_irrigation: Number(e.target.value) })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', color: '#FFFFFF' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ಟ್ರ್ಯಾಕ್ಟರ್ (Tractor)</label>
                    <input
                      type="number"
                      value={cropForm.expense_tractor || 0}
                      onChange={(e) => setCropForm({ ...cropForm, expense_tractor: Number(e.target.value) })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', color: '#FFFFFF' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setCropModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', padding: '8px 14px', cursor: 'pointer' }}
              >
                {isKannada ? 'ರದ್ದು' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (!cropForm.crop_name || !currentUser) return;
                  const finalCrop: FarmerCrop = {
                    id: cropForm.id || `crop_${Date.now()}`,
                    year: selectedYear,
                    crop_name: cropForm.crop_name,
                    variety: cropForm.variety || '',
                    season: cropForm.season || 'Kharif',
                    land_area: Number(cropForm.land_area) || 1,
                    land_unit: cropForm.land_unit || 'Acres',
                    planting_date: cropForm.planting_date || '',
                    harvest_date: cropForm.harvest_date || '',
                    expected_production: Number(cropForm.expected_production) || 0,
                    actual_production: Number(cropForm.actual_production) || 0,
                    production_unit: cropForm.production_unit || 'Quintals',
                    selling_price: Number(cropForm.selling_price) || 0,
                    total_income: Number(cropForm.total_income) || 0,
                    expense_seeds: Number(cropForm.expense_seeds) || 0,
                    expense_fertilizer: Number(cropForm.expense_fertilizer) || 0,
                    expense_pesticides: Number(cropForm.expense_pesticides) || 0,
                    expense_labour: Number(cropForm.expense_labour) || 0,
                    expense_irrigation: Number(cropForm.expense_irrigation) || 0,
                    expense_electricity: Number(cropForm.expense_electricity) || 0,
                    expense_tractor: Number(cropForm.expense_tractor) || 0,
                    expense_machinery: Number(cropForm.expense_machinery) || 0,
                    expense_transport: Number(cropForm.expense_transport) || 0,
                    expense_other: Number(cropForm.expense_other) || 0,
                    total_expense: 0,
                    profit_loss: 0,
                    created_at: cropForm.created_at || new Date().toISOString()
                  };
                  await farmerService.saveCrop(currentUser.uid, finalCrop);
                  setCropModalOpen(false);
                }}
                style={{ background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
              >
                {isKannada ? 'ಉಳಿಸಿ (Save)' : 'Save Crop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD INCOME                                         */}
      {/* ========================================================= */}
      {incomeModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px 0' }}>
              💰 {isKannada ? 'ಆದಾಯ ಸೇರಿಸಿ' : 'Add Income'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಆದಾಯದ ಮೂಲ (Source)' : 'Income Source'}
                </label>
                <input
                  type="text"
                  value={incomeForm.source || ''}
                  onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  placeholder="e.g. Milk Society, Dairy, Shop"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವಿಭಾಗ (Category)' : 'Category'}
                </label>
                <select
                  value={incomeForm.category || 'Crop'}
                  onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value as IncomeCategory })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                >
                  <option value="Crop">Crop (ಬೆಳೆ ಮಾರಾಟ)</option>
                  <option value="Dairy">Dairy (ಹೈನುಗಾರಿಕೆ)</option>
                  <option value="Milk">Milk (ಹಾಲು ಸೊಸೈಟಿ)</option>
                  <option value="Livestock">Livestock (ಕುರಿ/ಕೋಳಿ/ದನ)</option>
                  <option value="Poultry">Poultry (ಕೋಳಿ ಸಾಕಣೆ)</option>
                  <option value="Business">Business (ವ್ಯಾಪಾರ)</option>
                  <option value="Salary">Salary (ವೇತನ)</option>
                  <option value="Daily work">Daily work (ದೈನಂದಿನ ಕೂಲಿ)</option>
                  <option value="Rental">Rental (ಬಾಡಿಗೆ)</option>
                  <option value="Government assistance/subsidy">Govt Subsidy (ಸಹಾಯಧನ)</option>
                  <option value="Other">Other (ಇತರೆ)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಮೊತ್ತ (Amount ₹)' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  value={incomeForm.amount || 0}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: Number(e.target.value) })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '10px', padding: '8px 12px', color: '#10B981', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ದಿನಾಂಕ (Date)' : 'Date'}
                </label>
                <input
                  type="date"
                  value={incomeForm.date || ''}
                  onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setIncomeModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', padding: '8px 14px', cursor: 'pointer' }}
              >
                {isKannada ? 'ರದ್ದು' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (!incomeForm.source || !currentUser) return;
                  await farmerService.saveIncome(currentUser.uid, {
                    id: incomeForm.id || `inc_${Date.now()}`,
                    year: selectedYear,
                    source: incomeForm.source,
                    category: incomeForm.category || 'Crop',
                    amount: Number(incomeForm.amount) || 0,
                    date: incomeForm.date || new Date().toISOString().split('T')[0],
                    notes: incomeForm.notes || '',
                    created_at: new Date().toISOString()
                  });
                  setIncomeModalOpen(false);
                }}
                style={{ background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
              >
                {isKannada ? 'ಉಳಿಸಿ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD EXPENSE                                        */}
      {/* ========================================================= */}
      {expenseModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px 0' }}>
              💸 {isKannada ? 'ವೆಚ್ಚ ಸೇರಿಸಿ' : 'Add Expense'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವೆಚ್ಚದ ವಿವರ (Expense Name)' : 'Expense Name'}
                </label>
                <input
                  type="text"
                  value={expenseForm.expense_name || ''}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_name: e.target.value })}
                  placeholder="e.g. DAP Fertilizer, Tractor Diesel"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವಿಭಾಗ (Category)' : 'Category'}
                </label>
                <select
                  value={expenseForm.category || 'Fertilizer'}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as GeneralExpenseCategory })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                >
                  <option value="Fertilizer">Fertilizer (ರಸಗೊಬ್ಬರ)</option>
                  <option value="Pesticides">Pesticides (ಕೀಟನಾಶಕ)</option>
                  <option value="Seeds">Seeds (ಬೀಜ)</option>
                  <option value="Labour">Labour (ಕೂಲಿ)</option>
                  <option value="Irrigation">Irrigation (ನೀರಾವರಿ)</option>
                  <option value="Electricity">Electricity (ವಿದ್ಯುತ್)</option>
                  <option value="Tractor">Tractor (ಟ್ರ್ಯಾಕ್ಟರ್)</option>
                  <option value="Machinery">Machinery (ಯಂತ್ರೋಪಕರಣ)</option>
                  <option value="Transport">Transport (ಸಾರಿಗೆ)</option>
                  <option value="House">House (ಮನೆ)</option>
                  <option value="Food">Food (ಆಹಾರ)</option>
                  <option value="Travel">Travel (ಪ್ರಯಾಣ)</option>
                  <option value="Clothing">Clothing (ಬಟ್ಟೆ)</option>
                  <option value="Festival">Festival (ಹಬ್ಬ)</option>
                  <option value="Emergency">Emergency (ತುರ್ತು)</option>
                  <option value="Other">Other (ಇತರೆ)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಮೊತ್ತ (Amount ₹)' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  value={expenseForm.amount || 0}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '10px', padding: '8px 12px', color: '#FBBF24', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ದಿನಾಂಕ (Date)' : 'Date'}
                </label>
                <input
                  type="date"
                  value={expenseForm.date || ''}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setExpenseModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', padding: '8px 14px', cursor: 'pointer' }}
              >
                {isKannada ? 'ರದ್ದು' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (!expenseForm.expense_name || !currentUser) return;
                  await farmerService.saveExpense(currentUser.uid, {
                    id: expenseForm.id || `exp_${Date.now()}`,
                    year: selectedYear,
                    expense_name: expenseForm.expense_name,
                    category: expenseForm.category || 'Fertilizer',
                    amount: Number(expenseForm.amount) || 0,
                    date: expenseForm.date || new Date().toISOString().split('T')[0],
                    notes: expenseForm.notes || '',
                    created_at: new Date().toISOString()
                  });
                  setExpenseModalOpen(false);
                }}
                style={{ background: '#F59E0B', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
              >
                {isKannada ? 'ಉಳಿಸಿ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD FAMILY MEMBER                                  */}
      {/* ========================================================= */}
      {familyModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '440px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px 0' }}>
              👨‍👩‍👧 {isKannada ? 'ಕುಟುಂಬದ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ' : 'Add Family Member'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಹೆಸರು' : 'Name'} *
                </label>
                <input
                  type="text"
                  value={familyForm.name || ''}
                  onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಸಂಬಂಧ (Relationship)' : 'Relationship'}
                  </label>
                  <select
                    value={familyForm.relationship || 'Father'}
                    onChange={(e) => setFamilyForm({ ...familyForm, relationship: e.target.value as FamilyRelationship })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                  >
                    <option value="Father">Father (ತಂದೆ)</option>
                    <option value="Mother">Mother (ತಾಯಿ)</option>
                    <option value="Husband/Wife">Husband/Wife (ಪತಿ/ಪತ್ನಿ)</option>
                    <option value="Son">Son (ಮಗ)</option>
                    <option value="Daughter">Daughter (ಮಗಳು)</option>
                    <option value="Brother">Brother (ಸಹೋದರ)</option>
                    <option value="Sister">Sister (ಸಹೋದರಿ)</option>
                    <option value="Grandfather">Grandfather (ಅಜ್ಜ)</option>
                    <option value="Grandmother">Grandmother (ಅಜ್ಜಿ)</option>
                    <option value="Other">Other (ಇತರೆ)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ವಯಸ್ಸು (Age)' : 'Age'}
                  </label>
                  <input
                    type="number"
                    value={familyForm.age || 20}
                    onChange={(e) => setFamilyForm({ ...familyForm, age: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಉದ್ಯೋಗ (Occupation)' : 'Occupation'}
                </label>
                <input
                  type="text"
                  value={familyForm.occupation || ''}
                  onChange={(e) => setFamilyForm({ ...familyForm, occupation: e.target.value })}
                  placeholder="e.g. Farming, Teacher, Student"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವಿದ್ಯಾರ್ಹತೆ (Education)' : 'Education'}
                </label>
                <input
                  type="text"
                  value={familyForm.education || ''}
                  onChange={(e) => setFamilyForm({ ...familyForm, education: e.target.value })}
                  placeholder="e.g. B.Sc Agriculture, PUC"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setFamilyModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', padding: '8px 14px', cursor: 'pointer' }}
              >
                {isKannada ? 'ರದ್ದು' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (!familyForm.name || !currentUser) return;
                  await farmerService.saveFamilyMember(currentUser.uid, selectedYear, {
                    id: familyForm.id || `fam_${Date.now()}`,
                    name: familyForm.name,
                    relationship: familyForm.relationship || 'Father',
                    age: Number(familyForm.age) || 0,
                    gender: familyForm.gender || 'Male',
                    occupation: familyForm.occupation || '',
                    education: familyForm.education || '',
                    phone: familyForm.phone || '',
                    notes: familyForm.notes || '',
                    created_at: new Date().toISOString()
                  });
                  setFamilyModalOpen(false);
                }}
                style={{ background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
              >
                {isKannada ? 'ಉಳಿಸಿ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD EDUCATION                                      */}
      {/* ========================================================= */}
      {educationModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px 0' }}>
              🎓 {isKannada ? 'ಶಿಕ್ಷಣ ವೆಚ್ಚ ಸೇರಿಸಿ' : 'Add Education Expense'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು' : 'Student Name'} *
                </label>
                <input
                  type="text"
                  value={educationForm.student_name || ''}
                  onChange={(e) => setEducationForm({ ...educationForm, student_name: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಶಾಲೆ/ಕಾಲೇಜ್' : 'School/College'}
                  </label>
                  <input
                    type="text"
                    value={educationForm.school_college || ''}
                    onChange={(e) => setEducationForm({ ...educationForm, school_college: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ತರಗತಿ/ಕೋರ್ಸ್' : 'Class/Course'}
                  </label>
                  <input
                    type="text"
                    value={educationForm.class_course || ''}
                    onChange={(e) => setEducationForm({ ...educationForm, class_course: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ಕಾಲೇಜ್ ಫೀಸ್ (Tuition Fee ₹)</label>
                  <input
                    type="number"
                    value={educationForm.fee_tuition || 0}
                    onChange={(e) => setEducationForm({ ...educationForm, fee_tuition: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', color: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ಹಾಸ್ಟೆಲ್ ಫೀಸ್ (Hostel ₹)</label>
                  <input
                    type="number"
                    value={educationForm.fee_hostel || 0}
                    onChange={(e) => setEducationForm({ ...educationForm, fee_hostel: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', color: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ಪುಸ್ತಕಗಳು (Books ₹)</label>
                  <input
                    type="number"
                    value={educationForm.fee_books || 0}
                    onChange={(e) => setEducationForm({ ...educationForm, fee_books: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', color: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ಸಾರಿಗೆ/ಬಸ್ (Transport ₹)</label>
                  <input
                    type="number"
                    value={educationForm.fee_transport || 0}
                    onChange={(e) => setEducationForm({ ...educationForm, fee_transport: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 10px', color: '#FFFFFF' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setEducationModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', padding: '8px 14px', cursor: 'pointer' }}
              >
                {isKannada ? 'ರದ್ದು' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (!educationForm.student_name || !currentUser) return;
                  await farmerService.saveEducation(currentUser.uid, {
                    id: educationForm.id || `edu_${Date.now()}`,
                    year: selectedYear,
                    student_name: educationForm.student_name,
                    relationship: educationForm.relationship || 'Son',
                    school_college: educationForm.school_college || '',
                    class_course: educationForm.class_course || '',
                    academic_year: educationForm.academic_year || `${selectedYear}`,
                    fee_tuition: Number(educationForm.fee_tuition) || 0,
                    fee_hostel: Number(educationForm.fee_hostel) || 0,
                    fee_books: Number(educationForm.fee_books) || 0,
                    fee_uniform: Number(educationForm.fee_uniform) || 0,
                    fee_transport: Number(educationForm.fee_transport) || 0,
                    fee_exam: Number(educationForm.fee_exam) || 0,
                    fee_other: Number(educationForm.fee_other) || 0,
                    total_expense: 0,
                    created_at: new Date().toISOString()
                  });
                  setEducationModalOpen(false);
                }}
                style={{ background: '#A855F7', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
              >
                {isKannada ? 'ಉಳಿಸಿ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD HOUSEHOLD EXPENSE                              */}
      {/* ========================================================= */}
      {familyExpModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px 0' }}>
              🏠 {isKannada ? 'ಮನೆ ವೆಚ್ಚ ಸೇರಿಸಿ' : 'Add Household Expense'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವೆಚ್ಚದ ಹೆಸರು' : 'Expense Name'}
                </label>
                <input
                  type="text"
                  value={familyExpForm.expense_name || ''}
                  onChange={(e) => setFamilyExpForm({ ...familyExpForm, expense_name: e.target.value })}
                  placeholder="e.g. Grocery, Electricity Bill"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವಿಭಾಗ (Category)' : 'Category'}
                </label>
                <select
                  value={familyExpForm.category || 'Food'}
                  onChange={(e) => setFamilyExpForm({ ...familyExpForm, category: e.target.value as FamilyExpenseCategory })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                >
                  <option value="Food">Food (ದವಸ ಧಾನ್ಯ & ಆಹಾರ)</option>
                  <option value="Electricity">Electricity (ವಿದ್ಯುತ್ ಬಿಲ್)</option>
                  <option value="Water">Water (ನೀರು)</option>
                  <option value="Gas">Gas (ಗ್ಯಾಸ್ ಸಿಲಿಂಡರ್)</option>
                  <option value="House maintenance">Maintenance (ಮನೆ ದುರಸ್ತಿ)</option>
                  <option value="Clothing">Clothing (ಬಟ್ಟೆ)</option>
                  <option value="Travel">Travel (ಪ್ರಯಾಣ)</option>
                  <option value="Festivals">Festivals (ಹಬ್ಬ ಹರಿದಿನ)</option>
                  <option value="Marriage">Marriage (ಮದುವೆ ಶುಭಕಾರ್ಯ)</option>
                  <option value="Emergency">Emergency (ತುರ್ತು ವೆಚ್ಚ)</option>
                  <option value="Other">Other (ಇತರೆ)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಮೊತ್ತ (Amount ₹)' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  value={familyExpForm.amount || 0}
                  onChange={(e) => setFamilyExpForm({ ...familyExpForm, amount: Number(e.target.value) })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '10px', padding: '8px 12px', color: '#60A5FA', fontWeight: 800 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setFamilyExpModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', padding: '8px 14px', cursor: 'pointer' }}
              >
                {isKannada ? 'ರದ್ದು' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (!familyExpForm.expense_name || !currentUser) return;
                  await farmerService.saveFamilyExpense(currentUser.uid, {
                    id: familyExpForm.id || `fe_${Date.now()}`,
                    year: selectedYear,
                    expense_name: familyExpForm.expense_name,
                    category: familyExpForm.category || 'Food',
                    amount: Number(familyExpForm.amount) || 0,
                    date: familyExpForm.date || new Date().toISOString().split('T')[0],
                    notes: '',
                    created_at: new Date().toISOString()
                  });
                  setFamilyExpModalOpen(false);
                }}
                style={{ background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
              >
                {isKannada ? 'ಉಳಿಸಿ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD MEDICAL                                        */}
      {/* ========================================================= */}
      {medicalModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(236, 72, 153, 0.4)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px 0' }}>
              🏥 {isKannada ? 'ವೈದ್ಯಕೀಯ ವೆಚ್ಚ ಸೇರಿಸಿ' : 'Add Medical Expense'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಕುಟುಂಬದ ಸದಸ್ಯರ ಹೆಸರು' : 'Family Member'}
                </label>
                <input
                  type="text"
                  value={medicalForm.family_member || ''}
                  onChange={(e) => setMedicalForm({ ...medicalForm, family_member: e.target.value })}
                  placeholder="e.g. Father, Mother"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಆಸ್ಪತ್ರೆ/ಕ್ಲಿನಿಕ್' : 'Hospital / Clinic'}
                </label>
                <input
                  type="text"
                  value={medicalForm.hospital_clinic || ''}
                  onChange={(e) => setMedicalForm({ ...medicalForm, hospital_clinic: e.target.value })}
                  placeholder="e.g. Hosadurga Govt Hospital"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಮೊತ್ತ (Amount ₹)' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  value={medicalForm.amount || 0}
                  onChange={(e) => setMedicalForm({ ...medicalForm, amount: Number(e.target.value) })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(236, 72, 153, 0.4)', borderRadius: '10px', padding: '8px 12px', color: '#F472B6', fontWeight: 800 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setMedicalModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', padding: '8px 14px', cursor: 'pointer' }}
              >
                {isKannada ? 'ರದ್ದು' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (!medicalForm.family_member || !currentUser) return;
                  await farmerService.saveMedical(currentUser.uid, {
                    id: medicalForm.id || `med_${Date.now()}`,
                    year: selectedYear,
                    family_member: medicalForm.family_member,
                    expense_type: medicalForm.expense_type || 'Doctor & Medicines',
                    hospital_clinic: medicalForm.hospital_clinic || '',
                    amount: Number(medicalForm.amount) || 0,
                    date: medicalForm.date || new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString()
                  });
                  setMedicalModalOpen(false);
                }}
                style={{ background: '#EC4899', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
              >
                {isKannada ? 'ಉಳಿಸಿ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD LOAN                                           */}
      {/* ========================================================= */}
      {loanModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '440px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px 0' }}>
              🏦 {isKannada ? 'ಸಾಲ ಸೇರಿಸಿ' : 'Add Loan'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಸಾಲದ ಹೆಸರು (Loan Name)' : 'Loan Name'}
                </label>
                <input
                  type="text"
                  value={loanForm.loan_name || ''}
                  onChange={(e) => setLoanForm({ ...loanForm, loan_name: e.target.value })}
                  placeholder="e.g. Canara Bank Crop Loan"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಸಾಲ ನೀಡಿದವರು (Lender)' : 'Lender Type'}
                  </label>
                  <select
                    value={loanForm.lender_type || 'Bank'}
                    onChange={(e) => setLoanForm({ ...loanForm, lender_type: e.target.value as LenderType })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                  >
                    <option value="Bank">Bank (ಬ್ಯಾಂಕ್)</option>
                    <option value="Cooperative">Cooperative (ಸಹಕಾರ ಸಂಘ)</option>
                    <option value="Private">Private (ಖಾಸಗಿ)</option>
                    <option value="SHG/Stree Shakthi">SHG (ಸ್ತ್ರೀಶಕ್ತಿ ಸಂಘ)</option>
                    <option value="Friend/Relative">Friend/Relative (ಸ್ನೇಹಿತರು)</option>
                    <option value="Other">Other (ಇತರೆ)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಬಡ್ಡಿದರ % (Interest Rate)' : 'Interest Rate %'}
                  </label>
                  <input
                    type="number"
                    value={loanForm.interest_rate || 7}
                    onChange={(e) => setLoanForm({ ...loanForm, interest_rate: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಮೂಲ ಮೊತ್ತ (Original ₹)' : 'Original Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    value={loanForm.original_amount || 0}
                    onChange={(e) => setLoanForm({ ...loanForm, original_amount: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', padding: '8px 12px', color: '#F87171', fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಪಾವತಿಸಿದ ಹಣ (Paid ₹)' : 'Amount Paid (₹)'}
                  </label>
                  <input
                    type="number"
                    value={loanForm.amount_paid || 0}
                    onChange={(e) => setLoanForm({ ...loanForm, amount_paid: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '10px', padding: '8px 12px', color: '#10B981', fontWeight: 800 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setLoanModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', padding: '8px 14px', cursor: 'pointer' }}
              >
                {isKannada ? 'ರದ್ದು' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (!loanForm.loan_name || !currentUser) return;
                  await farmerService.saveLoan(currentUser.uid, {
                    id: loanForm.id || `loan_${Date.now()}`,
                    year: selectedYear,
                    loan_name: loanForm.loan_name,
                    purpose: loanForm.purpose || 'Farming',
                    lender_type: loanForm.lender_type || 'Bank',
                    original_amount: Number(loanForm.original_amount) || 0,
                    interest_rate: Number(loanForm.interest_rate) || 0,
                    amount_paid: Number(loanForm.amount_paid) || 0,
                    remaining_amount: 0,
                    monthly_payment: Number(loanForm.monthly_payment) || 0,
                    interest_paid: 0,
                    start_date: loanForm.start_date || new Date().toISOString().split('T')[0],
                    end_date: loanForm.end_date || '',
                    status: loanForm.status || 'Active',
                    created_at: new Date().toISOString()
                  });
                  setLoanModalOpen(false);
                }}
                style={{ background: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
              >
                {isKannada ? 'ಉಳಿಸಿ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD SAVINGS                                        */}
      {/* ========================================================= */}
      {savingModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            color: '#FFFFFF'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px 0' }}>
              💵 {isKannada ? 'ಉಳಿತಾಯ ಸೇರಿಸಿ' : 'Add Savings'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವಿವರ' : 'Description / Account'}
                </label>
                <input
                  type="text"
                  value={savingForm.type || ''}
                  onChange={(e) => setSavingForm({ ...savingForm, type: e.target.value })}
                  placeholder="e.g. Post Office RD, Bank FD"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ವಿಭಾಗ (Category)' : 'Category'}
                </label>
                <select
                  value={savingForm.category || 'Bank'}
                  onChange={(e) => setSavingForm({ ...savingForm, category: e.target.value as SavingsCategory })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', color: '#FFFFFF' }}
                >
                  <option value="Bank">Bank (ಬ್ಯಾಂಕ್)</option>
                  <option value="Cash">Cash (ನಗದು)</option>
                  <option value="Post Office">Post Office (ಅಂಚೆ ಕಚೇರಿ)</option>
                  <option value="Other">Other (ಇತರೆ)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  {isKannada ? 'ಮೊತ್ತ (Amount ₹)' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  value={savingForm.amount || 0}
                  onChange={(e) => setSavingForm({ ...savingForm, amount: Number(e.target.value) })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '10px', padding: '8px 12px', color: '#10B981', fontWeight: 800 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setSavingModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', padding: '8px 14px', cursor: 'pointer' }}
              >
                {isKannada ? 'ರದ್ದು' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (!savingForm.type || !currentUser) return;
                  await farmerService.saveSaving(currentUser.uid, {
                    id: savingForm.id || `sav_${Date.now()}`,
                    year: selectedYear,
                    type: savingForm.type,
                    category: savingForm.category || 'Bank',
                    amount: Number(savingForm.amount) || 0,
                    date: savingForm.date || new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString()
                  });
                  setSavingModalOpen(false);
                }}
                style={{ background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '8px 20px', fontWeight: 800, cursor: 'pointer' }}
              >
                {isKannada ? 'ಉಳಿಸಿ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CONFIRMATION                                */}
      {/* ========================================================= */}
      {deleteConfirmOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid #EF4444',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '380px',
            color: '#FFFFFF',
            textAlign: 'center'
          }}>
            <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px 0' }}>
              {isKannada ? 'ಖಚಿತಪಡಿಸಿ: ದಾಖಲೆಗಳನ್ನು ಅಳಿಸುವುದೇ?' : 'Confirm Data Deletion'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', lineHeight: 1.4, margin: '0 0 20px 0' }}>
              {isKannada
                ? 'ನಿಮ್ಮ ಖಾಸಗಿ ಕೃಷಿ, ಆದಾಯ ಮತ್ತು ಕುಟುಂಬದ ಎಲ್ಲಾ ದಾಖಲೆಗಳು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲ್ಪಡುತ್ತವೆ. ಇದನ್ನು ರದ್ದುಗೊಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.'
                : 'All your private farming, income and family records will be permanently erased. This action cannot be undone.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFFFFF', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}
              >
                {isKannada ? 'ಬೇಡ (Cancel)' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteAll}
                style={{ background: '#EF4444', border: 'none', color: '#FFFFFF', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800 }}
              >
                {isKannada ? 'ಹೌದು, ಅಳಿಸಿ (Delete)' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
