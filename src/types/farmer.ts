// ===============================================================
// 🌾 MTG VILLAGE — PRIVATE FARMER & FAMILY TYPES
// Strictly Private & User-Owned Data Models
// ===============================================================

export type LandUnit = 'Acres' | 'Guntas' | 'Cents' | 'Hectares';
export type ProductionUnit = 'Quintals' | 'Tonnes' | 'Bags' | 'Kgs';

export interface FarmerCrop {
  id: string;
  year: number;
  crop_name: string;
  variety: string;
  season: 'Kharif' | 'Rabi' | 'Summer' | 'Annual' | string;
  land_area: number;
  land_unit: LandUnit;
  planting_date: string;
  harvest_date: string;
  expected_production: number;
  actual_production: number;
  production_unit: ProductionUnit;
  selling_price: number;
  total_income: number;

  // Detailed Crop Expenses
  expense_seeds: number;
  expense_fertilizer: number;
  expense_pesticides: number;
  expense_labour: number;
  expense_irrigation: number;
  expense_electricity: number;
  expense_tractor: number;
  expense_machinery: number;
  expense_transport: number;
  expense_other: number;

  total_expense: number;
  profit_loss: number;
  notes?: string;
  created_at: string;
}

export type IncomeCategory =
  | 'Crop'
  | 'Dairy'
  | 'Milk'
  | 'Livestock'
  | 'Poultry'
  | 'Business'
  | 'Salary'
  | 'Daily work'
  | 'Rental'
  | 'Government assistance/subsidy'
  | 'Other';

export interface FarmerIncome {
  id: string;
  year: number;
  source: string;
  category: IncomeCategory;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

export type GeneralExpenseCategory =
  | 'Fertilizer'
  | 'Pesticides'
  | 'Seeds'
  | 'Labour'
  | 'Irrigation'
  | 'Electricity'
  | 'Tractor'
  | 'Machinery'
  | 'Transport'
  | 'House'
  | 'Food'
  | 'Travel'
  | 'Clothing'
  | 'Festival'
  | 'Emergency'
  | 'Other';

export interface FarmerExpense {
  id: string;
  year: number;
  expense_name: string;
  category: GeneralExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

export type FamilyRelationship =
  | 'Father'
  | 'Mother'
  | 'Husband/Wife'
  | 'Son'
  | 'Daughter'
  | 'Brother'
  | 'Sister'
  | 'Grandfather'
  | 'Grandmother'
  | 'Other';

export interface FarmerFamilyMember {
  id: string;
  name: string;
  relationship: FamilyRelationship;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  occupation: string;
  education: string;
  phone?: string;
  notes?: string;
  created_at: string;
}

export interface FarmerEducationExpense {
  id: string;
  year: number;
  student_name: string;
  relationship: string;
  school_college: string;
  class_course: string;
  academic_year: string;
  fee_tuition: number;
  fee_hostel: number;
  fee_books: number;
  fee_uniform: number;
  fee_transport: number;
  fee_exam: number;
  fee_other: number;
  total_expense: number;
  notes?: string;
  created_at: string;
}

export type FamilyExpenseCategory =
  | 'Food'
  | 'Electricity'
  | 'Water'
  | 'Gas'
  | 'House maintenance'
  | 'Clothing'
  | 'Travel'
  | 'Festivals'
  | 'Marriage'
  | 'Emergency'
  | 'Other';

export interface FarmerFamilyExpense {
  id: string;
  year: number;
  expense_name: string;
  category: FamilyExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface FarmerMedicalExpense {
  id: string;
  year: number;
  family_member: string;
  expense_type: string;
  hospital_clinic: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

export type LenderType =
  | 'Bank'
  | 'Cooperative'
  | 'Private'
  | 'SHG/Stree Shakthi'
  | 'Friend/Relative'
  | 'Other';

export interface FarmerLoan {
  id: string;
  year: number;
  loan_name: string;
  purpose: string;
  lender_type: LenderType;
  original_amount: number;
  interest_rate: number;
  amount_paid: number;
  remaining_amount: number;
  monthly_payment: number;
  interest_paid: number;
  start_date: string;
  end_date: string;
  status: 'Active' | 'Closed';
  notes?: string;
  created_at: string;
}

export type SavingsCategory = 'Bank' | 'Cash' | 'Post Office' | 'Other';

export interface FarmerSaving {
  id: string;
  year: number;
  category: SavingsCategory;
  type: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface FarmerYearSummary {
  year: number;
  total_income: number;
  crop_expenses: number;
  family_expenses: number;
  education_expenses: number;
  medical_expenses: number;
  loan_payments: number;
  other_expenses: number;
  net_profit_loss: number;
  updated_at: string;
}
