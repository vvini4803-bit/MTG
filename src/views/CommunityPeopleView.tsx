import React, { useState, useMemo } from 'react';
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
  FileCheck
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

  // Load official government register of Muttagondi residents
  const [residents] = useState<GovernmentVillageResident[]>(
    dbService.getGovernmentVillageResidents()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');

  const categories = [
    { id: 'ALL', label_en: 'All Citizens', label_kn: 'ಸಮಗ್ರ ನಿವಾಸಿಗಳು', icon: '👥' },
    { id: 'FARMER', label_en: 'Farmers & Agri', label_kn: 'ರೈತರು & ಕೃಷಿಕರು', icon: '🌾' },
    { id: 'TEACHER', label_en: 'Educators / Teachers', label_kn: 'ಶಿಕ್ಷಕರು & ಅಂಗನವಾಡಿ', icon: '👨‍🏫' },
    { id: 'OFFICER', label_en: 'Panchayat & Officers', label_kn: 'ಪಂಚಾಯತ್ ಪ್ರತಿನಿಧಿಗಳು', icon: '🏛️' },
    { id: 'HEALTH', label_en: 'ASHA & Health', label_kn: 'ಆರೋಗ್ಯ & ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯರು', icon: '🩺' },
    { id: 'SPORTS', label_en: 'Youth & Sports', label_kn: 'ಯುವಕರು & ಕ್ರೀಡಾಪಟುಗಳು', icon: '🏏' },
    { id: 'SENIOR', label_en: 'Village Elders', label_kn: 'ಹಿರಿಯ ನಾಗರಿಕರು', icon: '👴' },
    { id: 'ARTISAN', label_en: 'Village Artisans', label_kn: 'ಕುಶಲಕರ್ಮಿಗಳು', icon: '🛠️' },
    { id: 'RESIDENT', label_en: 'General Residents', label_kn: 'ಇತರ ಗ್ರಾಮಸ್ಥರು', icon: '👤' }
  ];

  // Distinct wards list
  const wardsList = useMemo(() => {
    const map = new Map<string, string>();
    residents.forEach((r) => {
      map.set(r.ward_en, r.ward_kn);
    });
    return Array.from(map.entries()).map(([en, kn]) => ({ en, kn }));
  }, [residents]);

  // Filtered residents
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      // Category filter
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) {
        return false;
      }

      // Ward filter
      if (selectedWard !== 'ALL' && r.ward_en !== selectedWard) {
        return false;
      }

      // Gender filter
      if (selectedGender !== 'ALL' && r.gender !== selectedGender) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.name_en.toLowerCase().includes(q);
        const matchNameKn = r.name_kn.toLowerCase().includes(q);
        const matchGuardian = r.guardian_en.toLowerCase().includes(q);
        const matchGuardianKn = r.guardian_kn.toLowerCase().includes(q);
        const matchHouse = r.house_no.toLowerCase().includes(q);
        const matchWard = r.ward_en.toLowerCase().includes(q) || r.ward_kn.toLowerCase().includes(q);
        const matchOccup = r.occupation_en.toLowerCase().includes(q) || r.occupation_kn.toLowerCase().includes(q);
        const matchGovtId = r.govt_id_reference.toLowerCase().includes(q);
        return matchName || matchNameKn || matchGuardian || matchGuardianKn || matchHouse || matchWard || matchOccup || matchGovtId;
      }

      return true;
    });
  }, [residents, selectedCategory, selectedWard, selectedGender, searchQuery]);

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

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: '960px' }}>
      {/* --- HERO HEADER: OFFICIAL MUTTAGONDI VILLAGE CITIZEN REGISTER --- */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 78, 59, 0.12) 50%, rgba(245, 158, 11, 0.12) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '24px',
          padding: '28px 24px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.45)'
                }}
              >
                <Users size={26} />
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
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ShieldCheck size={13} />
                    <span>{isKannada ? 'ಸರ್ಕಾರಿ ಅಧಿಕೃತ ಡೇಟಾ' : 'Govt Database Verified'}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                    {isKannada
                      ? 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ ಪಂಚತಂತ್ರ & ಕುಟುಂಬ ನಾಗರಿಕ ಡೇಟಾಬೇಸ್'
                      : 'Karnataka RDPR Panchamitra & Kutumba Resident Data Hub'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {isKannada
                      ? 'ಹೊಸದುರ್ಗ ತಾಲೂಕು, ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆ • ಪಿನ್‌ಕೋಡ್: 577533'
                      : 'Hosadurga Taluk, Chitradurga • PIN: 577533'}
                  </span>
                </div>
              </div>
            </div>

            <p style={{ margin: '10px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '680px', lineHeight: 1.55 }}>
              {isKannada
                ? 'ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮದ ಎಲ್ಲಾ ನಿವಾಸಿಗಳ ಅಧಿಕೃತ ಸಾರ್ವಜನಿಕ ಪಟ್ಟಿ. ಸರ್ಕಾರದ ಗ್ರಾಮ ಪಂಚಾಯತಿ ಕುಟುಂಬ ನೋಂದಣಿ, ಕೃಷಿ ಇಲಾಖೆ ಫ್ರೂಟ್ಸ್ ಹಾಗೂ ಜನಗಣತಿ ದಾಖಲೆಗಳಿಂದ ನೇರವಾಗಿ ಪಡೆದ ಅಧಿಕೃತ ಮಾಹಿತಿ.'
                : 'Official public register of all authentic residents of Muttagondi village, synchronized with Karnataka Grama Panchayat Kutumba resident registry and agriculture land records.'}
            </p>
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
              {isKannada ? 'ಅಧಿಕೃತ ಮೂಲ:' : 'Official Data Source:'}
            </strong>
            <span>
              {isKannada
                ? MUTTAGONDI_VILLAGE_OFFICIAL_METRICS.database_source_kn
                : MUTTAGONDI_VILLAGE_OFFICIAL_METRICS.database_source_en}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>
              {isKannada ? 'ಗ್ರಾ.ಪಂ ಕೋಡ್:' : 'GP Code:'} <strong>{MUTTAGONDI_VILLAGE_OFFICIAL_METRICS.grama_panchayat_code}</strong>
            </span>
            <span>•</span>
            <span>
              {isKannada ? 'ದಾಖಲೆ ದಿನಾಂಕ:' : 'Sync Date:'} <strong>{MUTTAGONDI_VILLAGE_OFFICIAL_METRICS.last_database_sync}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* --- CENSUS & REGISTER METRICS STRIP --- */}
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
            {isKannada ? 'ಜನಗಣತಿ ಜನಸಂಖ್ಯೆ' : 'Census Population'}
          </span>
          <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10B981' }}>
            {MUTTAGONDI_VILLAGE_OFFICIAL_METRICS.total_census_population.toLocaleString()}
          </strong>
        </div>

        <div className="glass-card" style={{ padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
            {isKannada ? 'ನೋಂದಾಯಿತ ಕುಟುಂಬಗಳು' : 'Registered Families'}
          </span>
          <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F59E0B' }}>
            {MUTTAGONDI_VILLAGE_OFFICIAL_METRICS.total_registered_households}
          </strong>
        </div>

        <div className="glass-card" style={{ padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
            {isKannada ? 'ಕುಟುಂಬ ಡೇಟಾ ದಾಖಲೆಗಳು' : 'Digitized Kutumba Records'}
          </span>
          <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38BDF8' }}>
            {MUTTAGONDI_VILLAGE_OFFICIAL_METRICS.active_govt_kutumba_records}
          </strong>
        </div>

        <div className="glass-card" style={{ padding: '14px', borderRadius: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
            {isKannada ? 'ಪ್ರಸ್ತುತ ಪಟ್ಟಿ' : 'Visible Roll Citizens'}
          </span>
          <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: '#A855F7' }}>
            {filteredResidents.length}
          </strong>
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
                ? 'ಮುತ್ತಾಗೊಂದಿ ನಿವಾಸಿಗಳ ಹೆಸರು, ತಂದೆ/ಪತಿಯ ಹೆಸರು, ಮನೆ ಸಂಖ್ಯೆ ಅಥವಾ ವೃತ್ತಿ ಮೂಲಕ ಹುಡುಕಿ...'
                : 'Search Muttagondi people by citizen name, father/spouse, house no, street, or profession...'
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

        {/* Filter Dropdowns: Ward & Gender */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                {isKannada ? 'ಎಲ್ಲಾ ಬೀದಿಗಳು / ವಾರ್ಡ್‌ಗಳು' : 'All Wards / Streets'}
              </option>
              {wardsList.map((w) => (
                <option key={w.en} value={w.en}>
                  {isKannada ? w.kn : w.en}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['ALL', 'MALE', 'FEMALE'] as const).map((g) => {
              const isActive = selectedGender === g;
              const label =
                g === 'ALL'
                  ? isKannada
                    ? 'ಎಲ್ಲರೂ'
                    : 'All'
                  : g === 'MALE'
                  ? isKannada
                    ? 'ಪುರುಷರು'
                    : 'Male'
                  : isKannada
                  ? 'ಮಹಿಳೆಯರು'
                  : 'Female';

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
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
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
            <p style={{ fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto' }}>
              {isKannada
                ? 'ಬೇರೆ ಕೀವರ್ಡ್ ಅಥವಾ ಬೀದಿ ಆಯ್ಕೆಮಾಡಿ ಹುಡುಕಿ ನೋಡಿ.'
                : 'Try adjusting your search query, ward, or category filters.'}
            </p>
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
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  background: 'var(--bg-card)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.16)',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Header: Avatar + Citizen Name */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    {resident.photoUrl ? (
                      <img
                        src={resident.photoUrl}
                        alt={resident.name_en}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #10B981',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
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

                  {/* House No & Ward */}
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
                        <Home size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        {isKannada ? 'ಮನೆ ಸಂಖ್ಯೆ:' : 'House No:'} <strong>{resident.house_no}</strong>
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
                    <span>{isKannada ? 'ಕುಟುಂಬ ದೃಢೀಕೃತ' : 'Govt Kutumba ID'}</span>
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
    </div>
  );
};
