import React from "react";
// Import semua ikon MUI yang dibutuhkan
import WorkIcon from '@mui/icons-material/WorkRounded';
import LaptopIcon from '@mui/icons-material/LaptopRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcardRounded';
import AttachMoneyIcon from '@mui/icons-material/AttachMoneyRounded';
import RestaurantIcon from '@mui/icons-material/RestaurantRounded';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCarRounded';
import HomeIcon from '@mui/icons-material/HomeRounded';
import LightbulbIcon from '@mui/icons-material/LightbulbRounded';
import SportsEsportsIcon from '@mui/icons-material/SportsEsportsRounded';
import FavoriteIcon from '@mui/icons-material/FavoriteRounded';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBagRounded';
import SchoolIcon from '@mui/icons-material/SchoolRounded';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoffRounded';
import MoreHorizIcon from '@mui/icons-material/MoreHorizRounded';

export type TransactionType = "income" | "expense";

export type Category =
  | "salary"
  | "freelance"
  | "investment"
  | "gift"
  | "other_income"
  | "food"
  | "transport"
  | "housing"
  | "utilities"
  | "entertainment"
  | "health"
  | "shopping"
  | "education"
  | "travel"
  | "other_expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  note: string;
  date: string; // ISO string
  createdAt: string;
}

export interface Budget {
  id: string;
  category: Category;
  limit: number;
  month: string;
  userId: string;
}

export interface MonthSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, number>;
}

// Menggunakan JSX.Element agar bisa menyimpan komponen ikon MUI
export const INCOME_CATEGORIES: { value: Category; label: string; icon: JSX.Element }[] = [
  { value: "salary", label: "Salary", icon: <WorkIcon fontSize="small" /> },
  { value: "freelance", label: "Freelance", icon: <LaptopIcon fontSize="small" /> },
  { value: "investment", label: "Investment", icon: <TrendingUpIcon fontSize="small" /> },
  { value: "gift", label: "Gift", icon: <CardGiftcardIcon fontSize="small" /> },
  { value: "other_income", label: "Other", icon: <AttachMoneyIcon fontSize="small" /> },
];

export const EXPENSE_CATEGORIES: { value: Category; label: string; icon: JSX.Element }[] = [
  { value: "food", label: "Food", icon: <RestaurantIcon fontSize="small" /> },
  { value: "transport", label: "Transport", icon: <DirectionsCarIcon fontSize="small" /> },
  { value: "housing", label: "Housing", icon: <HomeIcon fontSize="small" /> },
  { value: "utilities", label: "Utilities", icon: <LightbulbIcon fontSize="small" /> },
  { value: "entertainment", label: "Fun", icon: <SportsEsportsIcon fontSize="small" /> },
  { value: "health", label: "Health", icon: <FavoriteIcon fontSize="small" /> },
  { value: "shopping", label: "Shopping", icon: <ShoppingBagIcon fontSize="small" /> },
  { value: "education", label: "Education", icon: <SchoolIcon fontSize="small" /> },
  { value: "travel", label: "Travel", icon: <FlightTakeoffIcon fontSize="small" /> },
  { value: "other_expense", label: "Other", icon: <MoreHorizIcon fontSize="small" /> },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryMeta(cat: Category) {
  return ALL_CATEGORIES.find((c) => c.value === cat) ?? { 
    label: cat, 
    icon: <MoreHorizIcon fontSize="small" />, 
    value: cat 
  };
}