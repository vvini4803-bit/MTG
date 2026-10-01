// ===============================================================
// 🌾 MTG VILLAGE — PRIVATE FARMER & FAMILY SERVICE
// Strictly isolated per authenticated Firebase user
// Backend-enforced via Firestore Security Rules
// ===============================================================

import { db } from './firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  Unsubscribe
} from 'firebase/firestore';
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
  FarmerYearSummary
} from '../types/farmer';

class FarmerService {
  private cachePrefix = 'mtg_farmer_cache_';

  // Helper to ensure userId is present
  private checkAuth(userId: string | undefined): string {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Authentication required: Private records can only be accessed with a valid user session.');
    }
    return userId.trim();
  }

  // Local storage cache helpers
  private getLocalCache<T>(userId: string, key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`${this.cachePrefix}${userId}_${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  private setLocalCache<T>(userId: string, key: string, data: T) {
    try {
      localStorage.setItem(`${this.cachePrefix}${userId}_${key}`, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }

  public clearUserState(userId: string) {
    try {
      const prefix = `${this.cachePrefix}${userId}_`;
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error clearing farmer user cache', e);
    }
  }

  // -------------------------------------------------------------
  // 📅 YEAR MANAGEMENT
  // -------------------------------------------------------------
  public async getAvailableYears(userId: string): Promise<number[]> {
    const uid = this.checkAuth(userId);
    const defaults = [2026, 2025, 2024, 2023];
    const cached = this.getLocalCache<number[]>(uid, 'years', defaults);

    if (db) {
      try {
        const colRef = collection(db, 'users', uid, 'farmerSummary');
        const snap = await getDocs(colRef);
        const yearsSet = new Set<number>(defaults);
        snap.forEach((d) => {
          const y = parseInt(d.id, 10);
          if (!isNaN(y)) yearsSet.add(y);
        });
        const result = Array.from(yearsSet).sort((a, b) => b - a);
        this.setLocalCache(uid, 'years', result);
        return result;
      } catch (err) {
        console.warn('Error reading years from Firestore, using cache', err);
      }
    }
    return cached;
  }

  public async addYear(userId: string, year: number): Promise<number[]> {
    const uid = this.checkAuth(userId);
    const current = await this.getAvailableYears(uid);
    if (!current.includes(year)) {
      current.push(year);
      current.sort((a, b) => b - a);
      this.setLocalCache(uid, 'years', current);
      if (db) {
        try {
          const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString());
          await setDoc(docRef, { year, created_at: new Date().toISOString() }, { merge: true });
        } catch (e) {
          console.warn('Failed to persist new year to firestore', e);
        }
      }
    }
    return current;
  }

  // -------------------------------------------------------------
  // 🌱 CROPS (Private)
  // -------------------------------------------------------------
  public subscribeCrops(userId: string, year: number, callback: (crops: FarmerCrop[]) => void): Unsubscribe {
    const uid = this.checkAuth(userId);
    const cacheKey = `crops_${year}`;
    const initial = this.getLocalCache<FarmerCrop[]>(uid, cacheKey, []);
    callback(initial);

    if (!db) return () => {};

    const colRef = collection(db, 'users', uid, 'farmerSummary', year.toString(), 'crops');
    return onSnapshot(query(colRef), (snapshot) => {
      const items: FarmerCrop[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as FarmerCrop);
      });
      items.sort((a, b) => b.created_at.localeCompare(a.created_at));
      this.setLocalCache(uid, cacheKey, items);
      callback(items);
      this.recalculateYearSummary(uid, year);
    }, (err) => {
      console.warn('Firestore crops read error:', err);
    });
  }

  public async saveCrop(userId: string, crop: FarmerCrop): Promise<void> {
    const uid = this.checkAuth(userId);
    const total_expense =
      (Number(crop.expense_seeds) || 0) +
      (Number(crop.expense_fertilizer) || 0) +
      (Number(crop.expense_pesticides) || 0) +
      (Number(crop.expense_labour) || 0) +
      (Number(crop.expense_irrigation) || 0) +
      (Number(crop.expense_electricity) || 0) +
      (Number(crop.expense_tractor) || 0) +
      (Number(crop.expense_machinery) || 0) +
      (Number(crop.expense_transport) || 0) +
      (Number(crop.expense_other) || 0);

    const total_income = Number(crop.total_income) || (Number(crop.actual_production) * Number(crop.selling_price)) || 0;
    const profit_loss = total_income - total_expense;

    const finalizedCrop: FarmerCrop = {
      ...crop,
      total_expense,
      total_income,
      profit_loss,
      created_at: crop.created_at || new Date().toISOString()
    };

    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', crop.year.toString(), 'crops', finalizedCrop.id);
      await setDoc(docRef, finalizedCrop, { merge: true });
    }

    // Update local cache
    const cacheKey = `crops_${crop.year}`;
    const items = this.getLocalCache<FarmerCrop[]>(uid, cacheKey, []);
    const idx = items.findIndex((c) => c.id === finalizedCrop.id);
    if (idx >= 0) items[idx] = finalizedCrop;
    else items.unshift(finalizedCrop);
    this.setLocalCache(uid, cacheKey, items);

    await this.recalculateYearSummary(uid, crop.year);
  }

  public async deleteCrop(userId: string, year: number, cropId: string): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString(), 'crops', cropId);
      await deleteDoc(docRef);
    }
    const cacheKey = `crops_${year}`;
    const items = this.getLocalCache<FarmerCrop[]>(uid, cacheKey, []).filter((c) => c.id !== cropId);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, year);
  }

  // -------------------------------------------------------------
  // 💰 INCOME (Private)
  // -------------------------------------------------------------
  public subscribeIncome(userId: string, year: number, callback: (incomes: FarmerIncome[]) => void): Unsubscribe {
    const uid = this.checkAuth(userId);
    const cacheKey = `incomes_${year}`;
    callback(this.getLocalCache<FarmerIncome[]>(uid, cacheKey, []));

    if (!db) return () => {};

    const colRef = collection(db, 'users', uid, 'farmerSummary', year.toString(), 'income');
    return onSnapshot(query(colRef), (snapshot) => {
      const items: FarmerIncome[] = [];
      snapshot.forEach((d) => items.push(d.data() as FarmerIncome));
      items.sort((a, b) => b.date.localeCompare(a.date));
      this.setLocalCache(uid, cacheKey, items);
      callback(items);
      this.recalculateYearSummary(uid, year);
    }, (err) => console.warn('Income subscription error:', err));
  }

  public async saveIncome(userId: string, income: FarmerIncome): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', income.year.toString(), 'income', income.id);
      await setDoc(docRef, income, { merge: true });
    }
    const cacheKey = `incomes_${income.year}`;
    const items = this.getLocalCache<FarmerIncome[]>(uid, cacheKey, []);
    const idx = items.findIndex((i) => i.id === income.id);
    if (idx >= 0) items[idx] = income;
    else items.unshift(income);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, income.year);
  }

  public async deleteIncome(userId: string, year: number, incomeId: string): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString(), 'income', incomeId);
      await deleteDoc(docRef);
    }
    const cacheKey = `incomes_${year}`;
    const items = this.getLocalCache<FarmerIncome[]>(uid, cacheKey, []).filter((i) => i.id !== incomeId);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, year);
  }

  // -------------------------------------------------------------
  // 💸 GENERAL EXPENSES (Private)
  // -------------------------------------------------------------
  public subscribeExpenses(userId: string, year: number, callback: (expenses: FarmerExpense[]) => void): Unsubscribe {
    const uid = this.checkAuth(userId);
    const cacheKey = `expenses_${year}`;
    callback(this.getLocalCache<FarmerExpense[]>(uid, cacheKey, []));

    if (!db) return () => {};

    const colRef = collection(db, 'users', uid, 'farmerSummary', year.toString(), 'expenses');
    return onSnapshot(query(colRef), (snapshot) => {
      const items: FarmerExpense[] = [];
      snapshot.forEach((d) => items.push(d.data() as FarmerExpense));
      items.sort((a, b) => b.date.localeCompare(a.date));
      this.setLocalCache(uid, cacheKey, items);
      callback(items);
      this.recalculateYearSummary(uid, year);
    }, (err) => console.warn('Expense subscription error:', err));
  }

  public async saveExpense(userId: string, expense: FarmerExpense): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', expense.year.toString(), 'expenses', expense.id);
      await setDoc(docRef, expense, { merge: true });
    }
    const cacheKey = `expenses_${expense.year}`;
    const items = this.getLocalCache<FarmerExpense[]>(uid, cacheKey, []);
    const idx = items.findIndex((e) => e.id === expense.id);
    if (idx >= 0) items[idx] = expense;
    else items.unshift(expense);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, expense.year);
  }

  public async deleteExpense(userId: string, year: number, expenseId: string): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString(), 'expenses', expenseId);
      await deleteDoc(docRef);
    }
    const cacheKey = `expenses_${year}`;
    const items = this.getLocalCache<FarmerExpense[]>(uid, cacheKey, []).filter((e) => e.id !== expenseId);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, year);
  }

  // -------------------------------------------------------------
  // 👨👩👧 MY FAMILY (Strictly Private)
  // -------------------------------------------------------------
  public subscribeFamily(userId: string, year: number, callback: (members: FarmerFamilyMember[]) => void): Unsubscribe {
    const uid = this.checkAuth(userId);
    const cacheKey = `family_${year}`;
    callback(this.getLocalCache<FarmerFamilyMember[]>(uid, cacheKey, []));

    if (!db) return () => {};

    const colRef = collection(db, 'users', uid, 'farmerSummary', year.toString(), 'family');
    return onSnapshot(query(colRef), (snapshot) => {
      const items: FarmerFamilyMember[] = [];
      snapshot.forEach((d) => items.push(d.data() as FarmerFamilyMember));
      this.setLocalCache(uid, cacheKey, items);
      callback(items);
    }, (err) => console.warn('Family subscription error:', err));
  }

  public async saveFamilyMember(userId: string, year: number, member: FarmerFamilyMember): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString(), 'family', member.id);
      await setDoc(docRef, member, { merge: true });
    }
    const cacheKey = `family_${year}`;
    const items = this.getLocalCache<FarmerFamilyMember[]>(uid, cacheKey, []);
    const idx = items.findIndex((m) => m.id === member.id);
    if (idx >= 0) items[idx] = member;
    else items.push(member);
    this.setLocalCache(uid, cacheKey, items);
  }

  public async deleteFamilyMember(userId: string, year: number, memberId: string): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString(), 'family', memberId);
      await deleteDoc(docRef);
    }
    const cacheKey = `family_${year}`;
    const items = this.getLocalCache<FarmerFamilyMember[]>(uid, cacheKey, []).filter((m) => m.id !== memberId);
    this.setLocalCache(uid, cacheKey, items);
  }

  // -------------------------------------------------------------
  // 🎓 EDUCATION EXPENSES (Private)
  // -------------------------------------------------------------
  public subscribeEducation(userId: string, year: number, callback: (items: FarmerEducationExpense[]) => void): Unsubscribe {
    const uid = this.checkAuth(userId);
    const cacheKey = `education_${year}`;
    callback(this.getLocalCache<FarmerEducationExpense[]>(uid, cacheKey, []));

    if (!db) return () => {};

    const colRef = collection(db, 'users', uid, 'farmerSummary', year.toString(), 'education');
    return onSnapshot(query(colRef), (snapshot) => {
      const items: FarmerEducationExpense[] = [];
      snapshot.forEach((d) => items.push(d.data() as FarmerEducationExpense));
      this.setLocalCache(uid, cacheKey, items);
      callback(items);
      this.recalculateYearSummary(uid, year);
    }, (err) => console.warn('Education subscription error:', err));
  }

  public async saveEducation(userId: string, item: FarmerEducationExpense): Promise<void> {
    const uid = this.checkAuth(userId);
    const total_expense =
      (Number(item.fee_tuition) || 0) +
      (Number(item.fee_hostel) || 0) +
      (Number(item.fee_books) || 0) +
      (Number(item.fee_uniform) || 0) +
      (Number(item.fee_transport) || 0) +
      (Number(item.fee_exam) || 0) +
      (Number(item.fee_other) || 0);

    const finalized: FarmerEducationExpense = { ...item, total_expense };

    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', item.year.toString(), 'education', item.id);
      await setDoc(docRef, finalized, { merge: true });
    }
    const cacheKey = `education_${item.year}`;
    const items = this.getLocalCache<FarmerEducationExpense[]>(uid, cacheKey, []);
    const idx = items.findIndex((e) => e.id === item.id);
    if (idx >= 0) items[idx] = finalized;
    else items.unshift(finalized);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, item.year);
  }

  public async deleteEducation(userId: string, year: number, itemId: string): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString(), 'education', itemId);
      await deleteDoc(docRef);
    }
    const cacheKey = `education_${year}`;
    const items = this.getLocalCache<FarmerEducationExpense[]>(uid, cacheKey, []).filter((e) => e.id !== itemId);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, year);
  }

  // -------------------------------------------------------------
  // 🏠 FAMILY EXPENSES (Private)
  // -------------------------------------------------------------
  public subscribeFamilyExpenses(userId: string, year: number, callback: (items: FarmerFamilyExpense[]) => void): Unsubscribe {
    const uid = this.checkAuth(userId);
    const cacheKey = `family_exp_${year}`;
    callback(this.getLocalCache<FarmerFamilyExpense[]>(uid, cacheKey, []));

    if (!db) return () => {};

    const colRef = collection(db, 'users', uid, 'farmerSummary', year.toString(), 'family_expenses');
    return onSnapshot(query(colRef), (snapshot) => {
      const items: FarmerFamilyExpense[] = [];
      snapshot.forEach((d) => items.push(d.data() as FarmerFamilyExpense));
      this.setLocalCache(uid, cacheKey, items);
      callback(items);
      this.recalculateYearSummary(uid, year);
    }, (err) => console.warn('Family expense subscription error:', err));
  }

  public async saveFamilyExpense(userId: string, item: FarmerFamilyExpense): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', item.year.toString(), 'family_expenses', item.id);
      await setDoc(docRef, item, { merge: true });
    }
    const cacheKey = `family_exp_${item.year}`;
    const items = this.getLocalCache<FarmerFamilyExpense[]>(uid, cacheKey, []);
    const idx = items.findIndex((e) => e.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, item.year);
  }

  public async deleteFamilyExpense(userId: string, year: number, itemId: string): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString(), 'family_expenses', itemId);
      await deleteDoc(docRef);
    }
    const cacheKey = `family_exp_${year}`;
    const items = this.getLocalCache<FarmerFamilyExpense[]>(uid, cacheKey, []).filter((e) => e.id !== itemId);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, year);
  }

  // -------------------------------------------------------------
  // 🏥 MEDICAL EXPENSES (Private)
  // -------------------------------------------------------------
  public subscribeMedical(userId: string, year: number, callback: (items: FarmerMedicalExpense[]) => void): Unsubscribe {
    const uid = this.checkAuth(userId);
    const cacheKey = `medical_${year}`;
    callback(this.getLocalCache<FarmerMedicalExpense[]>(uid, cacheKey, []));

    if (!db) return () => {};

    const colRef = collection(db, 'users', uid, 'farmerSummary', year.toString(), 'medical');
    return onSnapshot(query(colRef), (snapshot) => {
      const items: FarmerMedicalExpense[] = [];
      snapshot.forEach((d) => items.push(d.data() as FarmerMedicalExpense));
      this.setLocalCache(uid, cacheKey, items);
      callback(items);
      this.recalculateYearSummary(uid, year);
    }, (err) => console.warn('Medical subscription error:', err));
  }

  public async saveMedical(userId: string, item: FarmerMedicalExpense): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', item.year.toString(), 'medical', item.id);
      await setDoc(docRef, item, { merge: true });
    }
    const cacheKey = `medical_${item.year}`;
    const items = this.getLocalCache<FarmerMedicalExpense[]>(uid, cacheKey, []);
    const idx = items.findIndex((m) => m.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, item.year);
  }

  public async deleteMedical(userId: string, year: number, itemId: string): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString(), 'medical', itemId);
      await deleteDoc(docRef);
    }
    const cacheKey = `medical_${year}`;
    const items = this.getLocalCache<FarmerMedicalExpense[]>(uid, cacheKey, []).filter((m) => m.id !== itemId);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, year);
  }

  // -------------------------------------------------------------
  // 🏦 LOANS (Private)
  // -------------------------------------------------------------
  public subscribeLoans(userId: string, year: number, callback: (items: FarmerLoan[]) => void): Unsubscribe {
    const uid = this.checkAuth(userId);
    const cacheKey = `loans_${year}`;
    callback(this.getLocalCache<FarmerLoan[]>(uid, cacheKey, []));

    if (!db) return () => {};

    const colRef = collection(db, 'users', uid, 'farmerSummary', year.toString(), 'loans');
    return onSnapshot(query(colRef), (snapshot) => {
      const items: FarmerLoan[] = [];
      snapshot.forEach((d) => items.push(d.data() as FarmerLoan));
      this.setLocalCache(uid, cacheKey, items);
      callback(items);
      this.recalculateYearSummary(uid, year);
    }, (err) => console.warn('Loans subscription error:', err));
  }

  public async saveLoan(userId: string, item: FarmerLoan): Promise<void> {
    const uid = this.checkAuth(userId);
    const original = Number(item.original_amount) || 0;
    const paid = Number(item.amount_paid) || 0;
    const rate = Number(item.interest_rate) || 0;
    const remaining_amount = Math.max(0, original - paid);
    const interest_paid = Math.round((original * (rate / 100)));

    const finalized: FarmerLoan = {
      ...item,
      remaining_amount,
      interest_paid: item.interest_paid || interest_paid
    };

    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', item.year.toString(), 'loans', item.id);
      await setDoc(docRef, finalized, { merge: true });
    }
    const cacheKey = `loans_${item.year}`;
    const items = this.getLocalCache<FarmerLoan[]>(uid, cacheKey, []);
    const idx = items.findIndex((l) => l.id === item.id);
    if (idx >= 0) items[idx] = finalized;
    else items.unshift(finalized);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, item.year);
  }

  public async deleteLoan(userId: string, year: number, itemId: string): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString(), 'loans', itemId);
      await deleteDoc(docRef);
    }
    const cacheKey = `loans_${year}`;
    const items = this.getLocalCache<FarmerLoan[]>(uid, cacheKey, []).filter((l) => l.id !== itemId);
    this.setLocalCache(uid, cacheKey, items);
    await this.recalculateYearSummary(uid, year);
  }

  // -------------------------------------------------------------
  // 💵 SAVINGS (Private)
  // -------------------------------------------------------------
  public subscribeSavings(userId: string, year: number, callback: (items: FarmerSaving[]) => void): Unsubscribe {
    const uid = this.checkAuth(userId);
    const cacheKey = `savings_${year}`;
    callback(this.getLocalCache<FarmerSaving[]>(uid, cacheKey, []));

    if (!db) return () => {};

    const colRef = collection(db, 'users', uid, 'farmerSummary', year.toString(), 'savings');
    return onSnapshot(query(colRef), (snapshot) => {
      const items: FarmerSaving[] = [];
      snapshot.forEach((d) => items.push(d.data() as FarmerSaving));
      this.setLocalCache(uid, cacheKey, items);
      callback(items);
    }, (err) => console.warn('Savings subscription error:', err));
  }

  public async saveSaving(userId: string, item: FarmerSaving): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', item.year.toString(), 'savings', item.id);
      await setDoc(docRef, item, { merge: true });
    }
    const cacheKey = `savings_${item.year}`;
    const items = this.getLocalCache<FarmerSaving[]>(uid, cacheKey, []);
    const idx = items.findIndex((s) => s.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    this.setLocalCache(uid, cacheKey, items);
  }

  public async deleteSaving(userId: string, year: number, itemId: string): Promise<void> {
    const uid = this.checkAuth(userId);
    if (db) {
      const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString(), 'savings', itemId);
      await deleteDoc(docRef);
    }
    const cacheKey = `savings_${year}`;
    const items = this.getLocalCache<FarmerSaving[]>(uid, cacheKey, []).filter((s) => s.id !== itemId);
    this.setLocalCache(uid, cacheKey, items);
  }

  // -------------------------------------------------------------
  // 📈 AUTOMATIC YEAR-SUMMARY CALCULATION
  // -------------------------------------------------------------
  public async recalculateYearSummary(userId: string, year: number): Promise<FarmerYearSummary> {
    const uid = this.checkAuth(userId);

    const crops = this.getLocalCache<FarmerCrop[]>(uid, `crops_${year}`, []);
    const incomes = this.getLocalCache<FarmerIncome[]>(uid, `incomes_${year}`, []);
    const expenses = this.getLocalCache<FarmerExpense[]>(uid, `expenses_${year}`, []);
    const education = this.getLocalCache<FarmerEducationExpense[]>(uid, `education_${year}`, []);
    const familyExp = this.getLocalCache<FarmerFamilyExpense[]>(uid, `family_exp_${year}`, []);
    const medical = this.getLocalCache<FarmerMedicalExpense[]>(uid, `medical_${year}`, []);
    const loans = this.getLocalCache<FarmerLoan[]>(uid, `loans_${year}`, []);

    // 1. Total Income
    const incomeFromEntries = incomes.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    const incomeFromCrops = crops.reduce((sum, c) => sum + (Number(c.total_income) || 0), 0);
    const total_income = incomeFromEntries + incomeFromCrops;

    // 2. Farm/Crop Expenses
    const farmCategories = ['Fertilizer', 'Pesticides', 'Seeds', 'Labour', 'Irrigation', 'Electricity', 'Tractor', 'Machinery', 'Transport'];
    const cropDirectExpenses = crops.reduce((sum, c) => sum + (Number(c.total_expense) || 0), 0);
    const farmGeneralExpenses = expenses
      .filter((e) => farmCategories.includes(e.category))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const crop_expenses = cropDirectExpenses + farmGeneralExpenses;

    // 3. Family Expenses
    const familyCategories = ['Food', 'House', 'Travel', 'Clothing', 'Festival', 'Emergency'];
    const familyHouseholdExpenses = familyExp.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const familyGeneralExpenses = expenses
      .filter((e) => familyCategories.includes(e.category))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const family_expenses = familyHouseholdExpenses + familyGeneralExpenses;

    // 4. Education Expenses
    const education_expenses = education.reduce((sum, ed) => sum + (Number(ed.total_expense) || 0), 0);

    // 5. Medical Expenses
    const medical_expenses = medical.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

    // 6. Loan Payments
    const loan_payments = loans.reduce((sum, l) => sum + (Number(l.amount_paid) || 0), 0);

    // 7. Other Expenses
    const other_expenses = expenses
      .filter((e) => e.category === 'Other')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 8. Net Profit / Loss
    const total_outflows = crop_expenses + family_expenses + education_expenses + medical_expenses + other_expenses;
    const net_profit_loss = total_income - total_outflows;

    const summary: FarmerYearSummary = {
      year,
      total_income,
      crop_expenses,
      family_expenses,
      education_expenses,
      medical_expenses,
      loan_payments,
      other_expenses,
      net_profit_loss,
      updated_at: new Date().toISOString()
    };

    this.setLocalCache(uid, `summary_${year}`, summary);

    if (db) {
      try {
        const docRef = doc(db, 'users', uid, 'farmerSummary', year.toString());
        await setDoc(docRef, summary, { merge: true });
      } catch (err) {
        console.warn('Failed to update year summary doc:', err);
      }
    }

    return summary;
  }

  public getCachedSummary(userId: string, year: number): FarmerYearSummary {
    const uid = this.checkAuth(userId);
    return this.getLocalCache<FarmerYearSummary>(uid, `summary_${year}`, {
      year,
      total_income: 0,
      crop_expenses: 0,
      family_expenses: 0,
      education_expenses: 0,
      medical_expenses: 0,
      loan_payments: 0,
      other_expenses: 0,
      net_profit_loss: 0,
      updated_at: new Date().toISOString()
    });
  }

  // -------------------------------------------------------------
  // 🗑️ EXPORT & PERMANENT DELETE (User Data Management)
  // -------------------------------------------------------------
  public async exportUserData(userId: string): Promise<{ json: string; csv: string }> {
    const uid = this.checkAuth(userId);
    const years = await this.getAvailableYears(uid);

    const fullData: any = {
      exported_at: new Date().toISOString(),
      user_id: uid,
      years: {}
    };

    let csv = 'Year,Record Type,Name/Source,Category,Income,Expense,Profit/Loss,Details\n';

    for (const y of years) {
      const summary = await this.recalculateYearSummary(uid, y);
      const crops = this.getLocalCache<FarmerCrop[]>(uid, `crops_${y}`, []);
      const incomes = this.getLocalCache<FarmerIncome[]>(uid, `incomes_${y}`, []);
      const expenses = this.getLocalCache<FarmerExpense[]>(uid, `expenses_${y}`, []);
      const family = this.getLocalCache<FarmerFamilyMember[]>(uid, `family_${y}`, []);
      const education = this.getLocalCache<FarmerEducationExpense[]>(uid, `education_${y}`, []);
      const familyExp = this.getLocalCache<FarmerFamilyExpense[]>(uid, `family_exp_${y}`, []);
      const medical = this.getLocalCache<FarmerMedicalExpense[]>(uid, `medical_${y}`, []);
      const loans = this.getLocalCache<FarmerLoan[]>(uid, `loans_${y}`, []);
      const savings = this.getLocalCache<FarmerSaving[]>(uid, `savings_${y}`, []);

      fullData.years[y] = {
        summary,
        crops,
        incomes,
        expenses,
        family,
        education,
        familyExp,
        medical,
        loans,
        savings
      };

      csv += `${y},Summary,Yearly Net Profit/Loss,Net,${summary.total_income},${summary.crop_expenses + summary.family_expenses + summary.education_expenses + summary.medical_expenses + summary.other_expenses},${summary.net_profit_loss},Total Income: ${summary.total_income}\n`;

      crops.forEach((c) => {
        csv += `${y},Crop,"${c.crop_name} (${c.variety})",Farming,${c.total_income},${c.total_expense},${c.profit_loss},"Area: ${c.land_area} ${c.land_unit}"\n`;
      });
      incomes.forEach((i) => {
        csv += `${y},Income,"${i.source}",${i.category},${i.amount},0,${i.amount},"Date: ${i.date}"\n`;
      });
      expenses.forEach((e) => {
        csv += `${y},Expense,"${e.expense_name}",${e.category},0,${e.amount},-${e.amount},"Date: ${e.date}"\n`;
      });
      education.forEach((ed) => {
        csv += `${y},Education,"${ed.student_name}",${ed.class_course},0,${ed.total_expense},-${ed.total_expense},"School: ${ed.school_college}"\n`;
      });
      loans.forEach((l) => {
        csv += `${y},Loan,"${l.loan_name}",${l.lender_type},0,${l.amount_paid},-${l.remaining_amount},"Total: ${l.original_amount}, Remaining: ${l.remaining_amount}"\n`;
      });
    }

    return {
      json: JSON.stringify(fullData, null, 2),
      csv
    };
  }

  public async deleteAllUserData(userId: string): Promise<void> {
    const uid = this.checkAuth(userId);
    const years = await this.getAvailableYears(uid);

    if (db) {
      for (const y of years) {
        try {
          const docRef = doc(db, 'users', uid, 'farmerSummary', y.toString());
          await deleteDoc(docRef);
        } catch (e) {
          console.warn('Failed to delete year doc', y, e);
        }
      }
    }
    this.clearUserState(uid);
  }

  // =============================================================
  // 🔐 CONTROLLED BACKEND TOOLS FOR GEMINI FARMER AI LIVE
  // Strictly enforce `userId` - no arbitrary client override
  // =============================================================

  public async getCurrentYearSummary(userId: string): Promise<any> {
    const uid = this.checkAuth(userId);
    const summary = await this.recalculateYearSummary(uid, 2026);
    return {
      year: 2026,
      totalIncome: `₹${summary.total_income.toLocaleString('en-IN')}`,
      cropExpenses: `₹${summary.crop_expenses.toLocaleString('en-IN')}`,
      familyExpenses: `₹${summary.family_expenses.toLocaleString('en-IN')}`,
      educationExpenses: `₹${summary.education_expenses.toLocaleString('en-IN')}`,
      medicalExpenses: `₹${summary.medical_expenses.toLocaleString('en-IN')}`,
      loanPayments: `₹${summary.loan_payments.toLocaleString('en-IN')}`,
      otherExpenses: `₹${summary.other_expenses.toLocaleString('en-IN')}`,
      netProfitLoss: `₹${summary.net_profit_loss.toLocaleString('en-IN')}`,
      isProfit: summary.net_profit_loss >= 0
    };
  }

  public async getCropSummary(userId: string, cropName?: string, year: number = 2026): Promise<any> {
    const uid = this.checkAuth(userId);
    const crops = this.getLocalCache<FarmerCrop[]>(uid, `crops_${year}`, []);

    if (cropName && cropName.trim()) {
      const q = cropName.toLowerCase().trim();
      const matched = crops.filter((c) =>
        c.crop_name.toLowerCase().includes(q) ||
        c.variety.toLowerCase().includes(q)
      );
      if (matched.length === 0) {
        return { message: `No crop found matching '${cropName}' for year ${year}. Active crops: ${crops.map((c) => c.crop_name).join(', ') || 'None'}` };
      }
      return matched.map((c) => ({
        cropName: c.crop_name,
        variety: c.variety,
        season: c.season,
        area: `${c.land_area} ${c.land_unit}`,
        production: `${c.actual_production} ${c.production_unit}`,
        income: `₹${c.total_income.toLocaleString('en-IN')}`,
        expense: `₹${c.total_expense.toLocaleString('en-IN')}`,
        profitLoss: `₹${c.profit_loss.toLocaleString('en-IN')}`,
        status: c.profit_loss >= 0 ? 'PROFIT' : 'LOSS',
        expenseBreakdown: {
          seeds: c.expense_seeds,
          fertilizer: c.expense_fertilizer,
          pesticides: c.expense_pesticides,
          labour: c.expense_labour,
          irrigation: c.expense_irrigation,
          tractor: c.expense_tractor,
          machinery: c.expense_machinery,
          transport: c.expense_transport
        }
      }));
    }

    return crops.map((c) => ({
      cropName: c.crop_name,
      income: `₹${c.total_income.toLocaleString('en-IN')}`,
      expense: `₹${c.total_expense.toLocaleString('en-IN')}`,
      profit: `₹${c.profit_loss.toLocaleString('en-IN')}`
    }));
  }

  public async getYearSummary(userId: string, year: number): Promise<any> {
    const uid = this.checkAuth(userId);
    const summary = await this.recalculateYearSummary(uid, year);
    return {
      year,
      totalIncome: `₹${summary.total_income.toLocaleString('en-IN')}`,
      cropExpenses: `₹${summary.crop_expenses.toLocaleString('en-IN')}`,
      familyExpenses: `₹${summary.family_expenses.toLocaleString('en-IN')}`,
      educationExpenses: `₹${summary.education_expenses.toLocaleString('en-IN')}`,
      medicalExpenses: `₹${summary.medical_expenses.toLocaleString('en-IN')}`,
      loanPayments: `₹${summary.loan_payments.toLocaleString('en-IN')}`,
      netProfitLoss: `₹${summary.net_profit_loss.toLocaleString('en-IN')}`,
      isProfit: summary.net_profit_loss >= 0
    };
  }

  public async getIncomeSummary(userId: string, year: number = 2026): Promise<any> {
    const uid = this.checkAuth(userId);
    const incomes = this.getLocalCache<FarmerIncome[]>(uid, `incomes_${year}`, []);
    const crops = this.getLocalCache<FarmerCrop[]>(uid, `crops_${year}`, []);
    const totalEntries = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalCropIncome = crops.reduce((s, c) => s + (Number(c.total_income) || 0), 0);

    return {
      year,
      totalIncome: `₹${(totalEntries + totalCropIncome).toLocaleString('en-IN')}`,
      fromCrops: `₹${totalCropIncome.toLocaleString('en-IN')}`,
      otherSources: incomes.map((i) => ({ source: i.source, category: i.category, amount: `₹${i.amount.toLocaleString('en-IN')}`, date: i.date }))
    };
  }

  public async getExpenseSummary(userId: string, year: number = 2026): Promise<any> {
    const uid = this.checkAuth(userId);
    const summary = await this.recalculateYearSummary(uid, year);
    const expenses = this.getLocalCache<FarmerExpense[]>(uid, `expenses_${year}`, []);

    return {
      year,
      totalExpenses: `₹${(summary.crop_expenses + summary.family_expenses + summary.education_expenses + summary.medical_expenses + summary.other_expenses).toLocaleString('en-IN')}`,
      breakdown: {
        farming: `₹${summary.crop_expenses.toLocaleString('en-IN')}`,
        family: `₹${summary.family_expenses.toLocaleString('en-IN')}`,
        education: `₹${summary.education_expenses.toLocaleString('en-IN')}`,
        medical: `₹${summary.medical_expenses.toLocaleString('en-IN')}`,
        loans: `₹${summary.loan_payments.toLocaleString('en-IN')}`,
        other: `₹${summary.other_expenses.toLocaleString('en-IN')}`
      },
      topRecentExpenses: expenses.slice(0, 5).map((e) => ({
        name: e.expense_name,
        category: e.category,
        amount: `₹${e.amount.toLocaleString('en-IN')}`
      }))
    };
  }

  public async getFamilyDetails(userId: string, year: number = 2026): Promise<any> {
    const uid = this.checkAuth(userId);
    const family = this.getLocalCache<FarmerFamilyMember[]>(uid, `family_${year}`, []);
    return {
      memberCount: family.length,
      members: family.map((m) => ({
        name: m.name,
        relationship: m.relationship,
        age: m.age,
        gender: m.gender,
        occupation: m.occupation,
        education: m.education
      }))
    };
  }

  public async getFamilyExpenses(userId: string, year: number = 2026): Promise<any> {
    const uid = this.checkAuth(userId);
    const familyExp = this.getLocalCache<FarmerFamilyExpense[]>(uid, `family_exp_${year}`, []);
    const total = familyExp.reduce((s, f) => s + (Number(f.amount) || 0), 0);
    return {
      year,
      totalFamilyExpense: `₹${total.toLocaleString('en-IN')}`,
      items: familyExp.map((f) => ({ name: f.expense_name, category: f.category, amount: `₹${f.amount.toLocaleString('en-IN')}`, date: f.date }))
    };
  }

  public async getEducationExpenses(userId: string, year: number = 2026): Promise<any> {
    const uid = this.checkAuth(userId);
    const items = this.getLocalCache<FarmerEducationExpense[]>(uid, `education_${year}`, []);
    const total = items.reduce((s, ed) => s + (Number(ed.total_expense) || 0), 0);
    return {
      year,
      totalEducationExpense: `₹${total.toLocaleString('en-IN')}`,
      students: items.map((ed) => ({
        studentName: ed.student_name,
        relationship: ed.relationship,
        schoolCollege: ed.school_college,
        course: ed.class_course,
        tuitionFee: `₹${ed.fee_tuition.toLocaleString('en-IN')}`,
        hostelFee: `₹${ed.fee_hostel.toLocaleString('en-IN')}`,
        books: `₹${ed.fee_books.toLocaleString('en-IN')}`,
        total: `₹${ed.total_expense.toLocaleString('en-IN')}`
      }))
    };
  }

  public async getMedicalExpenses(userId: string, year: number = 2026): Promise<any> {
    const uid = this.checkAuth(userId);
    const items = this.getLocalCache<FarmerMedicalExpense[]>(uid, `medical_${year}`, []);
    const total = items.reduce((s, m) => s + (Number(m.amount) || 0), 0);
    return {
      year,
      totalMedicalExpense: `₹${total.toLocaleString('en-IN')}`,
      records: items.map((m) => ({
        familyMember: m.family_member,
        expenseType: m.expense_type,
        hospital: m.hospital_clinic,
        amount: `₹${m.amount.toLocaleString('en-IN')}`,
        date: m.date
      }))
    };
  }

  public async getLoanSummary(userId: string, year: number = 2026): Promise<any> {
    const uid = this.checkAuth(userId);
    const loans = this.getLocalCache<FarmerLoan[]>(uid, `loans_${year}`, []);
    const totalOriginal = loans.reduce((s, l) => s + (Number(l.original_amount) || 0), 0);
    const totalPaid = loans.reduce((s, l) => s + (Number(l.amount_paid) || 0), 0);
    const totalRemaining = loans.reduce((s, l) => s + (Number(l.remaining_amount) || 0), 0);
    const totalInterestPaid = loans.reduce((s, l) => s + (Number(l.interest_paid) || 0), 0);

    return {
      totalOriginalDebt: `₹${totalOriginal.toLocaleString('en-IN')}`,
      totalPaid: `₹${totalPaid.toLocaleString('en-IN')}`,
      totalRemainingDebt: `₹${totalRemaining.toLocaleString('en-IN')}`,
      totalInterestPaid: `₹${totalInterestPaid.toLocaleString('en-IN')}`,
      activeLoanCount: loans.filter((l) => l.status === 'Active').length,
      loans: loans.map((l) => ({
        name: l.loan_name,
        lender: l.lender_type,
        original: `₹${l.original_amount.toLocaleString('en-IN')}`,
        remaining: `₹${l.remaining_amount.toLocaleString('en-IN')}`,
        interestRate: `${l.interest_rate}%`,
        status: l.status
      }))
    };
  }

  public async getSavingsSummary(userId: string, year: number = 2026): Promise<any> {
    const uid = this.checkAuth(userId);
    const savings = this.getLocalCache<FarmerSaving[]>(uid, `savings_${year}`, []);
    const total = savings.reduce((s, sv) => s + (Number(sv.amount) || 0), 0);

    return {
      year,
      totalSavings: `₹${total.toLocaleString('en-IN')}`,
      items: savings.map((s) => ({
        type: s.type,
        category: s.category,
        amount: `₹${s.amount.toLocaleString('en-IN')}`,
        date: s.date
      }))
    };
  }

  public async compareYears(userId: string, year1: number, year2: number): Promise<any> {
    const uid = this.checkAuth(userId);
    const s1 = await this.recalculateYearSummary(uid, year1);
    const s2 = await this.recalculateYearSummary(uid, year2);

    const profitDiff = s2.net_profit_loss - s1.net_profit_loss;
    const incomeDiff = s2.total_income - s1.total_income;

    return {
      [year1]: {
        income: `₹${s1.total_income.toLocaleString('en-IN')}`,
        expenses: `₹${(s1.crop_expenses + s1.family_expenses + s1.education_expenses + s1.medical_expenses + s1.other_expenses).toLocaleString('en-IN')}`,
        profit: `₹${s1.net_profit_loss.toLocaleString('en-IN')}`
      },
      [year2]: {
        income: `₹${s2.total_income.toLocaleString('en-IN')}`,
        expenses: `₹${(s2.crop_expenses + s2.family_expenses + s2.education_expenses + s2.medical_expenses + s2.other_expenses).toLocaleString('en-IN')}`,
        profit: `₹${s2.net_profit_loss.toLocaleString('en-IN')}`
      },
      comparison: {
        profitDifference: `₹${Math.abs(profitDiff).toLocaleString('en-IN')} (${profitDiff >= 0 ? 'Increase' : 'Decrease'})`,
        incomeDifference: `₹${Math.abs(incomeDiff).toLocaleString('en-IN')} (${incomeDiff >= 0 ? 'Increase' : 'Decrease'})`
      }
    };
  }
}

export const farmerService = new FarmerService();
