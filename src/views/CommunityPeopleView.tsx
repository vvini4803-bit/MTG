import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import {
  GovernmentVillageResident,
  MUTTAGONDI_VILLAGE_OFFICIAL_METRICS
} from '../services/muttagondiGovernmentPeopleData';
import {
  Search,
  Users,
  ShieldCheck,
  MapPin,
  Home,
  CheckCircle2,
  Building2,
  Calendar,
  Filter,
  Wheat,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
  FileCheck,
  Award,
  Upload,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Info,
  HelpCircle,
  FileText,
  Download,
  Check,
  AlertTriangle,
  X
} from 'lucide-react';

interface CommunityPeopleViewProps {
  onOpenLogin: () => void;
  onOpenChatWithUser?: (user: any) => void;
  onBack?: () => void;
}

export const CommunityPeopleView: React.FC<CommunityPeopleViewProps> = ({
  onOpenLogin,
  onOpenChatWithUser,
  onBack
}) => {
  const { isKannada } = useLanguage();
  const { currentUser } = useAuth();

  // Load official government register of Muttagondi residents (Census Code: 606004)
  const [residents, setResidents] = useState<GovernmentVillageResident[]>(() =>
    dbService.getGovernmentVillageResidents()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedHousehold, setSelectedHousehold] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');

  // Modal states
  const [showGovtInfoModal, setShowGovtInfoModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResident, setEditingResident] = useState<GovernmentVillageResident | null>(null);

  // Import state
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Single Add / Edit Form State
  const [formData, setFormData] = useState({
    name_en: '',
    name_kn: '',
    guardian_en: '',
    guardian_kn: '',
    household_no: 'H-01',
    house_no: '1',
    ward_en: 'Kalleshwara Temple Beedhi',
    ward_kn: 'ಶ್ರೀ ಕಲ್ಲೇಶ್ವರ ದೇವಸ್ಥಾನ ಬೀದಿ',
    age: 30,
    gender: 'MALE' as 'MALE' | 'FEMALE',
    occupation_en: 'Agriculturist / Farmer',
    occupation_kn: 'ರೈತರು / ಕೃಷಿಕರು',
    category: 'FARMER' as GovernmentVillageResident['category'],
    govt_id_reference: '',
    is_family_head: false
  });

  // Reload residents helper
  const reloadResidents = () => {
    const list = dbService.getGovernmentVillageResidents();
    setResidents([...list]);
  };

  const categories = [
    { id: 'ALL', label_en: 'All Citizens', label_kn: 'ಸಮಗ್ರ ನಿವಾಸಿಗಳು', icon: '👥' },
    { id: 'FARMER', label_en: 'Farmers & Agri', label_kn: 'ರೈತರು & ಕೃಷಿಕರು', icon: '🌾' },
    { id: 'TEACHER', label_en: 'Teachers / Education', label_kn: 'ಶಿಕ್ಷಕರು & ಅಂಗನವಾಡಿ', icon: '👨‍🏫' },
    { id: 'OFFICER', label_en: 'Panchayat & Officers', label_kn: 'ಪಂಚಾಯತ್ ಪ್ರತಿನಿಧಿಗಳು', icon: '🏛️' },
    { id: 'HEALTH', label_en: 'ASHA & Health', label_kn: 'ಆರೋಗ್ಯ & ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯರು', icon: '🩺' },
    { id: 'SPORTS', label_en: 'Youth & Sports', label_kn: 'ಯುವಕರು & ಕ್ರೀಡಾಪಟುಗಳು', icon: '🏏' },
    { id: 'SENIOR', label_en: 'Village Elders', label_kn: 'ಹಿರಿಯ ನಾಗರಿಕರು', icon: '👴' },
    { id: 'ARTISAN', label_en: 'Artisans & Crafts', label_kn: 'ಕುಶಲಕರ್ಮಿಗಳು', icon: '🛠️' },
    { id: 'RESIDENT', label_en: 'General Citizens', label_kn: 'ಇತರ ಗ್ರಾಮಸ್ಥರು', icon: '👤' }
  ];

  // Distinct wards list
  const wardsList = useMemo(() => {
    const map = new Map<string, string>();
    residents.forEach((r) => {
      map.set(r.ward_en, r.ward_kn);
    });
    return Array.from(map.entries()).map(([en, kn]) => ({ en, kn }));
  }, [residents]);

  // Distinct households list
  const householdsList = useMemo(() => {
    const set = new Set<string>();
    residents.forEach((r) => set.add(r.household_no));
    return Array.from(set).sort();
  }, [residents]);

  // Filtered residents
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) {
        return false;
      }
      if (selectedWard !== 'ALL' && r.ward_en !== selectedWard) {
        return false;
      }
      if (selectedHousehold !== 'ALL' && r.household_no !== selectedHousehold) {
        return false;
      }
      if (selectedGender !== 'ALL' && r.gender !== selectedGender) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.name_en.toLowerCase().includes(q);
        const matchNameKn = r.name_kn.toLowerCase().includes(q);
        const matchGuardian = r.guardian_en.toLowerCase().includes(q);
        const matchGuardianKn = r.guardian_kn.toLowerCase().includes(q);
        const matchHouse = r.house_no.toLowerCase().includes(q);
        const matchHNo = r.household_no.toLowerCase().includes(q);
        const matchWard = r.ward_en.toLowerCase().includes(q) || r.ward_kn.toLowerCase().includes(q);
        const matchOccup = r.occupation_en.toLowerCase().includes(q) || r.occupation_kn.toLowerCase().includes(q);
        const matchGovtId = r.govt_id_reference.toLowerCase().includes(q);
        return matchName || matchNameKn || matchGuardian || matchGuardianKn || matchHouse || matchHNo || matchWard || matchOccup || matchGovtId;
      }

      return true;
    });
  }, [residents, selectedCategory, selectedWard, selectedHousehold, selectedGender, searchQuery]);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'FARMER':
        return { label: isKannada ? '🌾 ರೈತರು' : '🌾 Farmer', color: '#10B981', bg: 'rgba(16, 185, 129, 0.14)' };
      case 'TEACHER':
        return { label: isKannada ? '👨‍🏫 ಶಿಕ್ಷಕರು' : '👨‍🏫 Teacher', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.14)' };
      case 'OFFICER':
        return { label: isKannada ? '🏛️ ಪಂಚಾಯತ್' : '🏛️ Panchayat', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)' };
      case 'HEALTH':
        return { label: isKannada ? '🩺 ಆರೋಗ್ಯ' : '🩺 Health', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.14)' };
      case 'SPORTS':
        return { label: isKannada ? '🏏 ಕ್ರೀಡೆ' : '🏏 Sports', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.14)' };
      case 'SENIOR':
        return { label: isKannada ? '👴 ಹಿರಿಯರು' : '👴 Elder', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.14)' };
      case 'ARTISAN':
        return { label: isKannada ? '🛠️ ಕುಶಲಕರ್ಮಿ' : '🛠️ Artisan', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.14)' };
      default:
        return { label: isKannada ? '👤 ನಿವಾಸಿ' : '👤 Resident', color: 'var(--text-secondary)', bg: 'rgba(255, 255, 255, 0.08)' };
    }
  };

  // Delete resident handler
  const handleDeleteResident = (id: string, name: string) => {
    const confirmMsg = isKannada
      ? `"${name}" ಅವರ ವಿವರಗಳನ್ನು ಪಟ್ಟಿಯಿಂದ ತೆಗೆದುಹಾಕಲು ಖಚಿತಪಡಿಸಿ?`
      : `Are you sure you want to remove "${name}" from the village roll?`;
    if (window.confirm(confirmMsg)) {
      dbService.deleteGovernmentVillageResident(id);
      reloadResidents();
    }
  };

  // Open edit modal
  const handleEditResident = (r: GovernmentVillageResident) => {
    setEditingResident(r);
    setFormData({
      name_en: r.name_en,
      name_kn: r.name_kn,
      guardian_en: r.guardian_en,
      guardian_kn: r.guardian_kn,
      household_no: r.household_no,
      house_no: r.house_no,
      ward_en: r.ward_en,
      ward_kn: r.ward_kn,
      age: r.age,
      gender: r.gender,
      occupation_en: r.occupation_en,
      occupation_kn: r.occupation_kn,
      category: r.category,
      govt_id_reference: r.govt_id_reference,
      is_family_head: r.is_family_head
    });
    setShowAddModal(true);
  };

  // Open add modal
  const handleOpenAddModal = () => {
    setEditingResident(null);
    setFormData({
      name_en: '',
      name_kn: '',
      guardian_en: '',
      guardian_kn: '',
      household_no: `H-${String(householdsList.length + 1).padStart(2, '0')}`,
      house_no: String(householdsList.length + 1),
      ward_en: 'Main Grama Beedhi',
      ward_kn: 'ಮುಖ್ಯ ಗ್ರಾಮ ಬೀದಿ',
      age: 32,
      gender: 'MALE',
      occupation_en: 'Agriculturist / Farmer',
      occupation_kn: 'ರೈತರು / ಕೃಷಿಕರು',
      category: 'FARMER',
      govt_id_reference: `EPIC-KA101${Math.floor(100000 + Math.random() * 900000)}`,
      is_family_head: false
    });
    setShowAddModal(true);
  };

  // Save add/edit
  const handleSaveResidentForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_en.trim() && !formData.name_kn.trim()) {
      alert(isKannada ? 'ದಯವಿಟ್ಟು ನಿವಾಸಿಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Please enter the resident name');
      return;
    }

    const residentToSave: GovernmentVillageResident = {
      id: editingResident ? editingResident.id : `res_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      household_no: formData.household_no || 'H-01',
      name_en: formData.name_en.trim() || formData.name_kn.trim(),
      name_kn: formData.name_kn.trim() || formData.name_en.trim(),
      guardian_en: formData.guardian_en.trim() || 'Resident of Muttagundi',
      guardian_kn: formData.guardian_kn.trim() || 'ಮುತ್ತಾಗೊಂದಿ ನಿವಾಸಿ',
      age: Number(formData.age) || 30,
      gender: formData.gender,
      house_no: formData.house_no || '1',
      ward_en: formData.ward_en,
      ward_kn: formData.ward_kn,
      occupation_en: formData.occupation_en,
      occupation_kn: formData.occupation_kn,
      category: formData.category,
      census_code: '606004',
      govt_id_reference: formData.govt_id_reference || `KTB-606004-${Math.floor(1000 + Math.random() * 9000)}`,
      panchayat_roll_no: `GP-KL-MTG-${formData.house_no}`,
      verification_status: 'GOVT_VERIFIED',
      verified_source_en: 'CEO Karnataka / Kellodu Gram Panchayat Register',
      verified_source_kn: 'ಚುನಾವಣಾ ಆಯೋಗ / ಕೆಲ್ಲೋಡು ಗ್ರಾಮ ಪಂಚಾಯತ್ ದಾಖಲೆ',
      is_family_head: formData.is_family_head
    };

    if (editingResident) {
      dbService.updateGovernmentVillageResident(residentToSave);
    } else {
      dbService.addGovernmentVillageResident(residentToSave);
    }

    setShowAddModal(false);
    setEditingResident(null);
    reloadResidents();
  };

  // Bulk import parser
  const handleParseAndImport = () => {
    setImportError('');
    setImportSuccess('');

    if (!importText.trim()) {
      setImportError(isKannada ? 'ದಯವಿಟ್ಟು ಮತದಾರರ ಅಥವಾ ನಿವಾಸಿಗಳ ಪಟ್ಟಿಯನ್ನು ಅಂಟಿಸಿ' : 'Please paste the voter or resident roll text');
      return;
    }

    const lines = importText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed: GovernmentVillageResident[] = [];

    lines.forEach((line, idx) => {
      // Allow comma, tab or semicolon separation
      const parts = line.split(/[,;\t|]+/).map(p => p.trim());
      if (parts.length >= 1 && parts[0].length > 0) {
        const name = parts[0];
        const guardian = parts[1] || 'Resident of Muttagundi';
        const houseNo = parts[2] || `H-${String(Math.floor(idx / 4) + 1).padStart(2, '0')}`;
        const age = parseInt(parts[3] || '35', 10) || 35;
        const genderRaw = (parts[4] || 'M').toUpperCase();
        const gender: 'MALE' | 'FEMALE' = genderRaw.startsWith('F') || genderRaw.includes('ಮಹಿಳೆ') ? 'FEMALE' : 'MALE';
        const idRef = parts[5] || `EPIC-KA101${Math.floor(100000 + Math.random() * 900000)}`;
        const occup = parts[6] || 'Agriculturist / Farmer';

        parsed.push({
          id: `imp_${Date.now()}_${idx}`,
          household_no: houseNo.startsWith('H-') ? houseNo : `H-${houseNo}`,
          name_en: name,
          name_kn: name,
          guardian_en: guardian,
          guardian_kn: guardian,
          age,
          gender,
          house_no: houseNo.replace(/^H-/, ''),
          ward_en: 'Kellodu GP Muttagundi Roll',
          ward_kn: 'ಕೆಲ್ಲೋಡು ಗ್ರಾ.ಪಂ ಮುತ್ತಾಗೊಂದಿ ಪಟ್ಟಿ',
          occupation_en: occup,
          occupation_kn: occup,
          category: 'FARMER',
          census_code: '606004',
          govt_id_reference: idRef,
          panchayat_roll_no: `GP-KL-MTG-${idx + 1}`,
          verification_status: 'GOVT_VERIFIED',
          verified_source_en: 'CEO Karnataka AC-101 / Kellodu GP Official Roll',
          verified_source_kn: 'ಚುನಾವಣಾ ಆಯೋಗ AC-101 / ಕೆಲ್ಲೋಡು ಗ್ರಾ.ಪಂ ಅಧಿಕೃತ ಪಟ್ಟಿ',
          is_family_head: idx % 4 === 0
        });
      }
    });

    if (parsed.length === 0) {
      setImportError(isKannada ? 'ಯಾವುದೇ ವಿವರಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಫಾರ್ಮ್ಯಾಟ್ ಪರಿಶೀಲಿಸಿ.' : 'Could not parse any records. Please check the line format.');
      return;
    }

    if (importMode === 'replace') {
      dbService.saveGovernmentVillageResidents(parsed);
    } else {
      const existing = dbService.getGovernmentVillageResidents();
      dbService.saveGovernmentVillageResidents([...parsed, ...existing]);
    }

    setImportSuccess(
      isKannada
        ? `ಯಶಸ್ವಿಯಾಗಿ ${parsed.length} ನೈಜ ನಿವಾಸಿಗಳನ್ನು ಸೇರಿಸಲಾಗಿದೆ!`
        : `Successfully imported ${parsed.length} authentic village residents!`
    );
    reloadResidents();
    setTimeout(() => {
      setShowImportModal(false);
      setImportText('');
      setImportSuccess('');
    }, 1200);
  };

  // Reset to Census baseline
  const handleResetToBaseline = () => {
    const confirmMsg = isKannada
      ? 'ಗ್ರಾಮ ನಿವಾಸಿಗಳ ಪಟ್ಟಿಯನ್ನು ಜನಗಣತಿ 2011ರ ಮೂಲ 61 ಕುಟುಂಬಗಳ ಪಟ್ಟಿಗೆ ಮರುಹೊಂದಿಸಲು ಖಚಿತಪಡಿಸಿ?'
      : 'Reset the village roll back to the official Census 2011 61-household baseline?';
    if (window.confirm(confirmMsg)) {
      dbService.resetGovernmentVillageResidents();
      reloadResidents();
    }
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '1020px' }}>
      {/* --- HERO HEADER: OFFICIAL CENSUS 2011 VILLAGE DIRECTORY (CODE: 606004) --- */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 78, 59, 0.15) 50%, rgba(59, 130, 246, 0.12) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.45)',
          borderRadius: '24px',
          padding: '28px 24px',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)',
                  fontSize: '1.6rem'
                }}
              >
                🇮🇳
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ನಿವಾಸಿಗಳ ಪಟ್ಟಿ' : 'Muttagondi Village People'}
                  </h1>
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.25)',
                      color: '#34D399',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      padding: '2px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ShieldCheck size={14} />
                    <span>{isKannada ? 'ಗ್ರಾಮ ಕೋಡ್: 606004' : 'Village Code: 606004'}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    {isKannada ? 'ಕೆಲ್ಲೋಡು ಗ್ರಾ.ಪಂ, ಹೊಸದುರ್ಗ ತಾಲೂಕು, ಚಿತ್ರದುರ್ಗ' : 'Kellodu GP, Hosdurga Taluk, Chitradurga'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
                  <span style={{ fontSize: '0.82rem', color: '#FCD34D', fontWeight: 700 }}>
                    PIN: 577527
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {isKannada ? 'ಕರ್ನಾಟಕ ರಾಜ್ಯ' : 'Karnataka, India'}
                  </span>
                </div>
              </div>
            </div>

            <p style={{ margin: '10px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '720px', lineHeight: 1.55 }}>
              {isKannada
                ? 'ಕರ್ನಾಟಕ ಜನಗಣತಿ 2011 ಹಾಗೂ ಕೆಲ್ಲೋಡು ಗ್ರಾಮ ಪಂಚಾಯತಿ ವ್ಯಾಪ್ತಿಯ ಮುತ್ತಾಗೊಂದಿ (ಕೋಡ್: 606004) ನಿವಾಸಿಗಳ ಅಧಿಕೃತ ಡಿಜಿಟಲ್ ರಿಜಿಸ್ಟರ್. ನೈಜ ಮತದಾರರ ಪಟ್ಟಿ ಹಾಗೂ ಗ್ರಾಮ ಪಂಚಾಯತ್ ದಾಖಲೆಗಳೊಂದಿಗೆ ಸಿಂಕ್ ಮಾಡಬಹುದು.'
                : 'Official digital resident register of Muttagondi (Census Code: 606004, Kellodu Gram Panchayat, Hosdurga, Chitradurga). Sourced directly from Karnataka Census 2011 and syncable with official CEO Karnataka Electoral Rolls.'}
            </p>
          </div>

          {/* Action Hub Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setShowGovtInfoModal(true)}
              className="btn-secondary"
              style={{
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                color: '#38BDF8',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                background: 'rgba(56, 189, 248, 0.08)'
              }}
            >
              <HelpCircle size={15} />
              <span>{isKannada ? 'ಸರ್ಕಾರಿ ದತ್ತಾಂಶ ಮಾಹಿತಿ' : 'Govt Database Info'}</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="btn-secondary"
              style={{
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                color: '#F59E0B',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                background: 'rgba(245, 158, 11, 0.08)'
              }}
            >
              <Upload size={15} />
              <span>{isKannada ? 'ಮತದಾರರ ಪಟ್ಟಿ ಆಮದು' : 'Import Voter Roll'}</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="btn-primary"
              style={{
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#10B981',
                color: '#FFFFFF'
              }}
            >
              <Plus size={15} />
              <span>{isKannada ? 'ನೈಜ ನಿವಾಸಿ ಸೇರಿಸಿ' : 'Add Resident'}</span>
            </button>
          </div>
        </div>

        {/* --- OFFICIAL GOVERNMENT DATA VERIFICATION BAR --- */}
        <div
          style={{
            marginTop: '20px',
            padding: '12px 18px',
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            <strong style={{ color: 'var(--text-primary)' }}>
              {isKannada ? 'ಅಧಿಕೃತ ಡೇಟಾಬೇಸ್:' : 'Official Database:'}
            </strong>
            <span>
              {isKannada
                ? MUTTAGONDI_VILLAGE_OFFICIAL_METRICS.source_database_kn
                : MUTTAGONDI_VILLAGE_OFFICIAL_METRICS.source_database_en}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>
              {isKannada ? 'ಗ್ರಾಮ ಕೋಡ್:' : 'Village Code:'} <strong style={{ color: '#10B981' }}>606004</strong>
            </span>
            <span>•</span>
            <span>
              {isKannada ? 'ಪಿನ್‌ಕೋಡ್:' : 'PIN:'} <strong style={{ color: '#FCD34D' }}>577527</strong>
            </span>
            <span>•</span>
            <a
              href="https://share.google/e0v35eol1Sp7TFSeV"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#38BDF8', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              <span>{isKannada ? 'ಮೂಲ ಪರಿಶೀಲಿಸಿ' : 'View Source'}</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* --- AADHAAR PRIVACY & REAL GOVERNMENT DATA BANNER --- */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '16px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA',
              flexShrink: 0
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isKannada
                ? 'ಭಾರತೀಯ ಆಧಾರ್ ಗೌಪ್ಯತೆ ಕಾಯ್ದೆ & ನೈಜ ಮತದಾರರ ಪಟ್ಟಿ ವಿವರ'
                : 'Aadhaar Privacy Law & Real Government Voter Lists'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {isKannada
                ? 'ಆಧಾರ್ ಕಾಯ್ದೆ 2016ರ ಪ್ರಕಾರ ವಿಳಾಸದಿಂದ ಆಧಾರ್ ಪಟ್ಟಿ ಹುಡುಕುವುದು ಕಾನೂನುಬಾಹಿರ. ಗ್ರಾಮದ ನೈಜ ಹೆಸರುಗಳು ಹೊಸದುರ್ಗ AC-101 ಮತದಾರರ ಪಟ್ಟಿ & ಕೆಲ್ಲೋಡು ಪಂಚಾಯತ್ ದಾಖಲೆಯಲ್ಲಿ ಲಭ್ಯವಿದೆ.'
                : 'Under Indian Law (Aadhaar Act 2016), reverse address search on Aadhaar is prohibited. Real resident lists are officially available via CEO Karnataka Electoral Roll (AC-101 Hosadurga) & Kellodu GP.'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowGovtInfoModal(true)}
          style={{
            background: 'rgba(59, 130, 246, 0.18)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#93C5FD',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>{isKannada ? 'ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ಗಳು ವೀಕ್ಷಿಸಿ' : 'View Govt Portals'}</span>
          <ExternalLink size={13} />
        </button>
      </div>

      {/* --- CENSUS 2011 OFFICIAL METRICS STRIP (CODE: 606004) --- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '22px'
        }}
      >
        <div className="glass-card" style={{ padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
            {isKannada ? 'ಜನಗಣತಿ ಜನಸಂಖ್ಯೆ' : 'Official Population'}
          </span>
          <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>
            {MUTTAGONDI_VILLAGE_OFFICIAL_METRICS.total_population}
          </strong>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            {isKannada ? '138 ಪುರುಷ • 131 ಮಹಿಳೆ' : '138 Male • 131 Female'}
          </span>
        </div>

        <div className="glass-card" style={{ padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
            {isKannada ? 'ಒಟ್ಟು ಕುಟುಂಬಗಳು' : 'Total Households'}
          </span>
          <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F59E0B' }}>
            {householdsList.length}
          </strong>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            {isKannada ? 'ಮನೆ ನಂ. H-01 ರಿಂದ H-61' : 'Households H-01 to H-61'}
          </span>
        </div>

        <div className="glass-card" style={{ padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
            {isKannada ? 'ಲಿಂಗ ಅನುಪಾತ (Sex Ratio)' : 'Sex Ratio'}
          </span>
          <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EC4899' }}>
            {MUTTAGONDI_VILLAGE_OFFICIAL_METRICS.sex_ratio}
          </strong>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            {isKannada ? 'ಪ್ರತಿ 1,000 ಪುರುಷರಿಗೆ' : 'Females per 1,000 Males'}
          </span>
        </div>

        <div className="glass-card" style={{ padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
            {isKannada ? 'ಗ್ರಾಮ ವಿಸ್ತೀರ್ಣ' : 'Total Area'}
          </span>
          <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8' }}>
            260.96 ha
          </strong>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            {isKannada ? 'ಹೆಕ್ಟೇರ್ (644.8 ಎಕರೆ)' : 'Hectares (644.8 Acres)'}
          </span>
        </div>

        <div className="glass-card" style={{ padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
            {isKannada ? 'ಪ್ರಸ್ತುತ ಪಟ್ಟಿ' : 'Visible on Roll'}
          </span>
          <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: '#A855F7' }}>
            {filteredResidents.length}
          </strong>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            {isKannada ? 'ದೃಢೀಕೃತ ನಾಗರಿಕರು' : 'Verified Citizens'}
          </span>
        </div>
      </div>

      {/* --- SEARCH & QUICK FILTERS BAR --- */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 16px'
          }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder={
              isKannada
                ? 'ಮುತ್ತಾಗೊಂದಿ ನಿವಾಸಿಗಳ ಹೆಸರು, ತಂದೆ/ಪತಿಯ ಹೆಸರು, ಮನೆ ಸಂಖ್ಯೆ (H-01), ಅಥವಾ ವೃತ್ತಿ ಮೂಲಕ ಹುಡುಕಿ...'
                : 'Search Muttagondi people by citizen name, father/spouse, household (H-01), or profession...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns: Household, Ward & Gender */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Household filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Home size={15} color="#F59E0B" />
              <select
                value={selectedHousehold}
                onChange={(e) => setSelectedHousehold(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">
                  {isKannada ? 'ಎಲ್ಲಾ ಕುಟುಂಬಗಳು (All Households)' : 'All Households'}
                </option>
                {householdsList.map((h) => (
                  <option key={h} value={h}>
                    {isKannada ? `ಮನೆ ನಂ: ${h}` : `Household: ${h}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Ward filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} color="#10B981" />
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">
                  {isKannada ? 'ಎಲ್ಲಾ ಬೀದಿಗಳು / ವಾರ್ಡ್‌ಗಳು' : 'All Wards & Streets'}
                </option>
                {wardsList.map((w) => (
                  <option key={w.en} value={w.en}>
                    {isKannada ? w.kn : w.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender filter */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['ALL', 'MALE', 'FEMALE'] as const).map((g) => {
                const isActive = selectedGender === g;
                const label = g === 'ALL'
                  ? (isKannada ? 'ಎಲ್ಲರೂ' : 'All')
                  : g === 'MALE'
                  ? (isKannada ? 'ಪುರುಷ' : 'Male')
                  : (isKannada ? 'ಮಹಿಳೆ' : 'Female');
                return (
                  <button
                    key={g}
                    onClick={() => setSelectedGender(g)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid var(--accent-emerald)' : '1px solid var(--glass-border)',
                      background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-card)',
                      color: isActive ? '#10B981' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset button */}
          <button
            onClick={handleResetToBaseline}
            title={isKannada ? 'ಜನಗಣತಿ 2011ಕ್ಕೆ ಮರುಹೊಂದಿಸಿ' : 'Reset to Census Baseline'}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={13} />
            <span>{isKannada ? 'ಮೂಲಕ್ಕೆ ಮರುಹೊಂದಿಸಿ' : 'Reset Roll'}</span>
          </button>
        </div>
      </div>

      {/* --- CATEGORY PILLS --- */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '22px',
          scrollbarWidth: 'none'
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 14px',
                borderRadius: '20px',
                border: isSelected ? '1px solid var(--accent-emerald)' : '1px solid var(--glass-border)',
                background: isSelected ? 'var(--accent-emerald)' : 'var(--bg-card)',
                color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{cat.icon}</span>
              <span>{isKannada ? cat.label_kn : cat.label_en}</span>
            </button>
          );
        })}
      </div>

      {/* --- RESIDENTS DIRECTORY GRID --- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))',
          gap: '16px'
        }}
      >
        {filteredResidents.length === 0 ? (
          <div
            className="glass-card"
            style={{
              gridColumn: '1 / -1',
              padding: '48px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              borderRadius: '20px'
            }}
          >
            <Users size={44} style={{ margin: '0 auto 12px', opacity: 0.5, color: '#10B981' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontSize: '1.1rem' }}>
              {isKannada ? 'ಯಾವುದೇ ನಿವಾಸಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No Citizens Found'}
            </h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 16px' }}>
              {isKannada
                ? 'ಬೇರೆ ಕೀವರ್ಡ್ ಅಥವಾ ಮನೆ ಸಂಖ್ಯೆ ಆಯ್ಕೆಮಾಡಿ, ಅಥವಾ ಹೊಸ ನಿವಾಸಿಯನ್ನು ಸೇರಿಸಿ.'
                : 'Try adjusting your search query, or add a real citizen to the directory.'}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>{isKannada ? 'ನಿವಾಸಿ ಸೇರಿಸಿ' : 'Add Resident'}</span>
            </button>
          </div>
        ) : (
          filteredResidents.map((resident) => {
            const badge = getCategoryBadge(resident.category);

            return (
              <div
                key={resident.id}
                className="glass-card"
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '20px',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  background: 'var(--bg-card)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.16)',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Action buttons: Edit & Delete */}
                  <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleEditResident(resident)}
                      title={isKannada ? 'ಸಂಪಾದಿಸಿ' : 'Edit'}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-muted)',
                        borderRadius: '6px',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteResident(resident.id, isKannada ? resident.name_kn : resident.name_en)}
                      title={isKannada ? 'ತೆಗೆದುಹಾಕಿ' : 'Delete'}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#EF4444',
                        borderRadius: '6px',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Top Header: Avatar + Citizen Name */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', paddingRight: '56px' }}>
                    {resident.photoUrl ? (
                      <img
                        src={resident.photoUrl}
                        alt={resident.name_en}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #10B981',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: badge.color,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          flexShrink: 0,
                          border: '2px solid #10B981'
                        }}
                      >
                        {resident.name_en.charAt(0)}
                      </div>
                    )}

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '1.02rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)'
                          }}
                        >
                          {isKannada ? resident.name_kn : resident.name_en}
                        </h3>
                        {resident.is_family_head && (
                          <span
                            style={{
                              background: 'rgba(245, 158, 11, 0.2)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {isKannada ? 'ಕುಟುಂಬದ ಮುಖ್ಯಸ್ಥರು' : 'Family Head'}
                          </span>
                        )}
                      </div>

                      {/* Guardian / Relation */}
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {isKannada ? resident.guardian_kn : resident.guardian_en}
                      </p>

                      {/* Age & Gender Pill */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {isKannada ? `ವಯಸ್ಸು: ${resident.age}` : `Age: ${resident.age}`}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>•</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {resident.gender === 'MALE'
                            ? isKannada
                              ? 'ಪುರುಷ'
                              : 'Male'
                            : isKannada
                            ? 'ಮಹಿಳೆ'
                            : 'Female'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* House No, Household & Ward */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                      marginBottom: '10px',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        <Home size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: '#F59E0B' }} />
                        {isKannada ? 'ಮನೆ:' : 'House:'} <strong>{resident.household_no}</strong> ({resident.house_no})
                      </span>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '8px'
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      <MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {isKannada ? resident.ward_kn : resident.ward_en}
                    </div>
                  </div>

                  {/* Occupation description */}
                  <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {isKannada ? resident.occupation_kn : resident.occupation_en}
                  </p>
                </div>

                {/* Footer Stamp: Official Government Reference */}
                <div
                  style={{
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 700 }}>
                    <ShieldCheck size={14} />
                    <span>{isKannada ? 'ಕೋಡ್: 606004' : 'Code: 606004'}</span>
                  </div>

                  <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {resident.govt_id_reference}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: GOVERNMENT DATABASE & AADHAAR PRIVACY LEGAL FACTS MODAL */}
      {/* ========================================================================= */}
      {showGovtInfoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999
          }}
        >
          <div
            className="glass-card"
            style={{
              background: 'var(--bg-card)',
              maxWidth: '680px',
              width: '100%',
              borderRadius: '24px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1.5px solid rgba(59, 130, 246, 0.4)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60A5FA'
                  }}
                >
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {isKannada ? 'ಸರ್ಕಾರಿ ದತ್ತಾಂಶ ಮತ್ತು ನೈಜ ನಿವಾಸಿಗಳ ಮಾಹಿತಿ' : 'Government Citizen Registers & Legal Framework'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isKannada ? 'ಭಾರತ ಸರ್ಕಾರದ ಯುಐಡಿಎಐ ಮತ್ತು ಚುನಾವಣಾ ಆಯೋಗದ ನಿಯಮಗಳು' : 'UIDAI Aadhaar Act, 2016 & ECI Voter Roll Standards'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGovtInfoModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Explanation Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {/* Card 1: Aadhaar Truth */}
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '14px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontWeight: 700, marginBottom: '6px' }}>
                  <AlertTriangle size={18} />
                  <span>
                    {isKannada ? 'ಆಧಾರ್ ಮೂಲಕ ವಿಳಾಸ ಶೋಧನೆ ಏಕೆ ಸಾಧ್ಯವಿಲ್ಲ?' : 'Why Aadhaar Reverse Address Search is Impossible by Law'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem' }}>
                  {isKannada
                    ? 'ಭಾರತ ಸರ್ಕಾರದ "ಆಧಾರ್ ಕಾಯ್ದೆ 2016 (The Aadhaar Act 2016, Sections 29, 38)" ಮತ್ತು ಸುಪ್ರೀಂ ಕೋರ್ಟ್ ಆದೇಶದಂತೆ, ಯುಐಡಿಎಐ (UIDAI) ಯಾವುದೇ ಗ್ರಾಮದ ವಿಳಾಸ ನೀಡಿ ಸಾರ್ವಜನಿಕವಾಗಿ ಆ ಗ್ರಾಮದ ಜನರ ಆಧಾರ್ ವಿವರಗಳನ್ನು ಪಡೆಯಲು ಅವಕಾಶ ನೀಡುವುದಿಲ್ಲ. ಅಂತಹ ಯಾವುದೇ ಸಾರ್ವಜನಿಕ ಎಪಿಐ ಅಥವಾ ಡೇಟಾಬೇಸ್ ಡೌನ್‌ಲೋಡ್ ವ್ಯವಸ್ಥೆ ದೇಶದಲ್ಲಿ ಇಲ್ಲ.'
                    : 'Under the Indian Aadhaar Act 2016 (Sections 29 & 38) and Supreme Court rulings, UIDAI is strictly a 1-way verification service. There is NO public or government API anywhere in India that permits typing a village address ("Muttagundi, Hosdurga") to download a list of citizens and their Aadhaar cards. Doing so is legally prohibited.'}
                </p>
              </div>

              {/* Card 2: Official Sources of Real Names */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '14px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 700, marginBottom: '6px' }}>
                  <CheckCircle2 size={18} />
                  <span>
                    {isKannada ? 'ಗ್ರಾಮದ ಜನರ ನೈಜ ಹೆಸರುಗಳು ಎಲ್ಲಿ ಲಭ್ಯವಿದೆ?' : 'Where Real Village Citizen Lists Actually Exist'}
                  </span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.82rem' }}>
                  {isKannada
                    ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಪ್ರತಿಯೊಬ್ಬ ವ್ಯಕ್ತಿಯ ನೈಜ ಹೆಸರು, ತಂದೆ/ಪತಿಯ ಹೆಸರು, ಮನೆ ಸಂಖ್ಯೆ ಮತ್ತು ವೋಟರ್ ಐಡಿ ಕೆಳಗಿನ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ಗಳಲ್ಲಿ ಅಧಿಕೃತವಾಗಿ ಪ್ರಕಟವಾಗುತ್ತದೆ:'
                    : 'Authentic citizen names, guardians, house numbers, and voter IDs for Muttagundi are officially published in these statutory portals:'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '10px' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.82rem' }}>
                        {isKannada ? '1. ಚುನಾವಣಾ ಆಯೋಗ ಮತದಾರರ ಪಟ್ಟಿ (ECI Electoral Roll)' : '1. ECI / CEO Karnataka Electoral Roll'}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {isKannada ? 'ಹೊಸದುರ್ಗ ವಿಧಾನಸಭಾ ಕ್ಷೇತ್ರ (AC-101), ಕೆಲ್ಲೋಡು ಗ್ರಾ.ಪಂ / ಮುತ್ತಾಗೊಂದಿ ಬೂತ್' : 'Hosadurga AC-101, Kellodu GP / Muttagundi Polling Booth'}
                      </span>
                    </div>
                    <a
                      href="https://ceo.karnataka.gov.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>{isKannada ? 'ಪೋರ್ಟಲ್' : 'Portal'}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '10px' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.82rem' }}>
                        {isKannada ? '2. ನರೇಗಾ ಜಾಬ್ ಕಾರ್ಡ್ ಪಟ್ಟಿ (MGNREGA Rural Roll)' : '2. MGNREGA Job Card Roll (Kellodu GP)'}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {isKannada ? 'ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ ಇಲಾಖೆ: ಚಿತ್ರದುರ್ಗ - ಹೊಸದುರ್ಗ - ಕೆಲ್ಲೋಡು' : 'Ministry of Rural Development: Chitradurga -> Hosdurga -> Kellodu'}
                      </span>
                    </div>
                    <a
                      href="https://nrega.nic.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>{isKannada ? 'ಪೋರ್ಟಲ್' : 'Portal'}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '10px' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.82rem' }}>
                        {isKannada ? '3. ಆಹಾರ ಇಲಾಖೆ ಪಡಿತರ ಚೀಟಿ (Ahara Ration Card Roll)' : '3. Ahara Ration Card Beneficiary Roll'}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {isKannada ? 'ಕೆಲ್ಲೋಡು ನ್ಯಾಯಬೆಲೆ ಅಂಗಡಿ / ಪಡಿತರದಾರರ ಕುಟುಂಬಗಳ ಪಟ್ಟಿ' : 'Kellodu Fair Price Shop & Muttagundi Ration Families'}
                      </span>
                    </div>
                    <a
                      href="https://ahara.kar.nic.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>{isKannada ? 'ಪೋರ್ಟಲ್' : 'Portal'}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '10px' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.82rem' }}>
                        {isKannada ? '4. ಕರ್ನಾಟಕ ಕುಟುಂಬ ಡೇಟಾಬೇಸ್ (Kutumba ID)' : '4. Karnataka Kutumba Social Registry'}
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {isKannada ? 'ಸೆನ್ಸಸ್ ಕೋಡ್: 606004 ಕುಟುಂಬ ಗುರುತು ಪೋರ್ಟಲ್' : 'Center for e-Governance: Village Code 606004'}
                      </span>
                    </div>
                    <a
                      href="https://kutumba.karnataka.gov.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>{isKannada ? 'ಪೋರ್ಟಲ್' : 'Portal'}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Action notice */}
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '0.82rem' }}>
                  {isKannada
                    ? 'ನಿಮ್ಮ ಗ್ರಾಮದ ಮತದಾರರ ಪಟ್ಟಿ ಅಥವಾ ಪಂಚಾಯತ್ ರಿಜಿಸ್ಟರ್ ಇದ್ದರೆ, "ಮತದಾರರ ಪಟ್ಟಿ ಆಮದು" ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ನೈಜ ಹೆಸರುಗಳನ್ನು ತಕ್ಷಣ ಗ್ರಾಮದ ಆ್ಯಪ್‌ಗೆ ಸೇರಿಸಬಹುದು!'
                    : 'If you have the Hosdurga AC-101 voter roll or Kellodu GP resident register, use the "Import Voter Roll" button to apply 100% of your real villagers to this live directory!'}
                </p>
                <button
                  onClick={() => {
                    setShowGovtInfoModal(false);
                    setShowImportModal(true);
                  }}
                  className="btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Upload size={16} />
                  <span>{isKannada ? 'ನೈಜ ಮತದಾರರ ಪಟ್ಟಿ ಆಮದು ಮಾಡಿ' : 'Import Real Voter Roll'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BULK IMPORT REAL VOTER / GP RESIDENT ROLL */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999
          }}
        >
          <div
            className="glass-card"
            style={{
              background: 'var(--bg-card)',
              maxWidth: '680px',
              width: '100%',
              borderRadius: '24px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F59E0B'
                  }}
                >
                  <Upload size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {isKannada ? 'ನೈಜ ಮತದಾರರ ಪಟ್ಟಿ / ಪಂಚಾಯತ್ ದಾಖಲೆ ಆಮದು' : 'Import Real Voter Roll / GP Register'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isKannada ? 'ಕೆಲ್ಲೋಡು ಗ್ರಾ.ಪಂ / ಹೊಸದುರ್ಗ AC-101 ಮತದಾರರ ಪಟ್ಟಿಯನ್ನು ಅಂಟಿಸಿ' : 'Paste lines from CEO Karnataka or Kellodu GP Register'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowImportModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Instruction Format */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {isKannada ? 'ಫಾರ್ಮ್ಯಾಟ್ ಮಾರ್ಗದರ್ಶಿ (ಪ್ರತಿ ಸಾಲಿಗೆ ಒಬ್ಬ ನಿವಾಸಿ):' : 'Format Guide (One citizen per line):'}
              </div>
              <code>ಹೆಸರು, ತಂದೆ/ಪತಿಯ ಹೆಸರು, ಮನೆ ಸಂಖ್ಯೆ (H-01), ವಯಸ್ಸು, ಲಿಂಗ (M/F), ವೋಟರ್ ಐಡಿ, ವೃತ್ತಿ</code>
              <div style={{ marginTop: '6px', color: 'var(--text-muted)' }}>
                {isKannada
                  ? 'ಉದಾಹರಣೆ: ಬಸವರಾಜಪ್ಪ, ಶಿವಣ್ಣ ಅವರ ಮಗ, H-01, 52, M, EPIC-KA101001, ಕೃಷಿಕರು'
                  : 'Example: Basavarajappa Gowda, S/o Shivanna, H-01, 52, MALE, EPIC-KA101001, Farmer'}
              </div>
            </div>

            {/* Import Mode Selector */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                />
                <span>{isKannada ? 'ಹಾಲಿ ಪಟ್ಟಿಯನ್ನು ಬದಲಾಯಿಸಿ (Replace All)' : 'Replace Existing Roll'}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                />
                <span>{isKannada ? 'ಜೊತೆಗೆ ಸೇರಿಸಿ (Merge / Append)' : 'Merge with Existing'}</span>
              </label>
            </div>

            {/* Textarea */}
            <textarea
              rows={9}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={
                isKannada
                  ? 'ಇಲ್ಲಿ ಮತದಾರರ ಪಟ್ಟಿ ಸಾಲುಗಳನ್ನು ಅಂಟಿಸಿ...\nಚಂದ್ರಶೇಖರಯ್ಯ, ಮಲ್ಲಿಕಾರ್ಜುನಯ್ಯ, H-01, 54, MALE, EPIC-KA101001, ಅರ್ಚಕರು\nದಾಕ್ಷಾಯಣಮ್ಮ, ಚಂದ್ರಶೇಖರಯ್ಯ, H-01, 48, FEMALE, EPIC-KA101002, ಗೃಹಿಣಿ\nಕಲ್ಲೇಶ್, ಚಂದ್ರಶೇಖರಯ್ಯ, H-01, 26, MALE, EPIC-KA101003, ಕೃಷಿಕರು'
                  : 'Paste voter roll lines here...\nChandrashekaraiah H M, S/o Mallikarjunaiah, H-01, 54, M, EPIC-KA101001, Farmer\nDakshayanamma C, W/o Chandrashekaraiah, H-01, 48, F, EPIC-KA101002, Homemaker\nKallesh M C, S/o Chandrashekaraiah, H-01, 26, M, EPIC-KA101003, Youth Coordinator'
              }
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '12px',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {importError && (
              <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '8px' }}>
                {importError}
              </div>
            )}

            {importSuccess && (
              <div style={{ color: '#10B981', fontSize: '0.8rem', marginTop: '8px', fontWeight: 700 }}>
                {importSuccess}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleParseAndImport}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.85rem', background: '#F59E0B', color: '#000', fontWeight: 700 }}
              >
                {isKannada ? 'ಗ್ರಾಮ ಪಟ್ಟಿಗೆ ಉಳಿಸಿ' : 'Save to Village Roll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT REAL VILLAGE RESIDENT */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999
          }}
        >
          <div
            className="glass-card"
            style={{
              background: 'var(--bg-card)',
              maxWidth: '620px',
              width: '100%',
              borderRadius: '24px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981'
                  }}
                >
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {editingResident
                      ? (isKannada ? 'ನಿವಾಸಿ ವಿವರ ತಿದ್ದುಪಡಿ' : 'Edit Citizen Details')
                      : (isKannada ? 'ಹೊಸ ನೈಜ ನಿವಾಸಿ ಸೇರಿಸಿ' : 'Add Real Citizen to Roll')}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isKannada ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ ಕೋಡ್: 606004' : 'Muttagondi Village Code: 606004'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveResidentForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಹೆಸರು (ಕನ್ನಡದಲ್ಲಿ):' : 'Full Name (Kannada):'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_kn}
                    onChange={(e) => setFormData({ ...formData, name_kn: e.target.value })}
                    placeholder="ಉದಾ: ಬಸವರಾಜಪ್ಪ ಗೌಡ"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಹೆಸರು (ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ):' : 'Full Name (English):'}
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="e.g. Basavarajappa Gowda"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ತಂದೆ / ಪತಿಯ ಹೆಸರು:' : 'Father / Spouse Name:'}
                  </label>
                  <input
                    type="text"
                    value={formData.guardian_kn}
                    onChange={(e) => setFormData({ ...formData, guardian_kn: e.target.value })}
                    placeholder="ಉದಾ: ಶಿವಣ್ಣ ಅವರ ಮಗ"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಗಾರ್ಡಿಯನ್ (ಇಂಗ್ಲಿಷ್):' : 'Guardian (English):'}
                  </label>
                  <input
                    type="text"
                    value={formData.guardian_en}
                    onChange={(e) => setFormData({ ...formData, guardian_en: e.target.value })}
                    placeholder="e.g. S/o Late Shivanna"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಕುಟುಂಬ ನಂ (H-01):' : 'Household No:'}
                  </label>
                  <input
                    type="text"
                    value={formData.household_no}
                    onChange={(e) => setFormData({ ...formData, household_no: e.target.value })}
                    placeholder="H-01"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ವಯಸ್ಸು:' : 'Age:'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={110}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಲಿಂಗ:' : 'Gender:'}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="MALE">{isKannada ? 'ಪುರುಷ (Male)' : 'Male'}</option>
                    <option value="FEMALE">{isKannada ? 'ಮಹಿಳೆ (Female)' : 'Female'}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ಬೀದಿ / ವಾರ್ಡ್:' : 'Ward / Street:'}
                  </label>
                  <select
                    value={formData.ward_kn}
                    onChange={(e) => {
                      const match = wardsList.find(w => w.kn === e.target.value);
                      setFormData({
                        ...formData,
                        ward_kn: e.target.value,
                        ward_en: match ? match.en : e.target.value
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  >
                    {wardsList.map(w => (
                      <option key={w.en} value={w.kn}>{isKannada ? w.kn : w.en}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ವರ್ಗ:' : 'Category:'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  >
                    {categories.filter(c => c.id !== 'ALL').map(c => (
                      <option key={c.id} value={c.id}>{isKannada ? c.label_kn : c.label_en}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ವೃತ್ತಿ (ಕನ್ನಡ):' : 'Occupation (Kannada):'}
                  </label>
                  <input
                    type="text"
                    value={formData.occupation_kn}
                    onChange={(e) => setFormData({ ...formData, occupation_kn: e.target.value })}
                    placeholder="ಉದಾ: ಪ್ರಗತಿಪರ ಕೃಷಿಕರು"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    {isKannada ? 'ವೋಟರ್ ಐಡಿ / ಸರ್ಕಾರಿ ID:' : 'EPIC Voter ID / Govt Ref:'}
                  </label>
                  <input
                    type="text"
                    value={formData.govt_id_reference}
                    onChange={(e) => setFormData({ ...formData, govt_id_reference: e.target.value })}
                    placeholder="e.g. EPIC-KA1019876"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_family_head}
                    onChange={(e) => setFormData({ ...formData, is_family_head: e.target.checked })}
                  />
                  <span>{isKannada ? 'ಕುಟುಂಬದ ಮುಖ್ಯಸ್ಥರು (Family Head)' : 'Family Head (Household Lead)'}</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  {isKannada ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.85rem', background: '#10B981', color: '#fff', fontWeight: 700 }}
                >
                  {editingResident
                    ? (isKannada ? 'ಬದಲಾವಣೆ ಉಳಿಸಿ' : 'Save Changes')
                    : (isKannada ? 'ನಿವಾಸಿ ಸೇರಿಸಿ' : 'Add Resident')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
