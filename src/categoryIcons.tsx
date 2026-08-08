import { ReactNode } from "react";
import {
  Utensils, Coffee, ShoppingCart, ShoppingBag,
  Car, TrainFront, Fuel, Plane,
  Clapperboard, Gamepad2, Music,
  House, Wifi, Zap, Wrench,
  Pill, HeartPulse,
  Shirt, BookOpen, GraduationCap,
  Wallet, CreditCard, PiggyBank,
  Package, Gift, PawPrint, Dumbbell, Briefcase,
  LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Utensils, Coffee, ShoppingCart, ShoppingBag,
  Car, TrainFront, Fuel, Plane,
  Clapperboard, Gamepad2, Music,
  House, Wifi, Zap, Wrench,
  Pill, HeartPulse,
  Shirt, BookOpen, GraduationCap,
  Wallet, CreditCard, PiggyBank,
  Package, Gift, PawPrint, Dumbbell, Briefcase,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export function getCategoryIcon(name: string): ReactNode {
  const Icon = CATEGORY_ICONS[name] ?? Package;
  return <Icon />;
}
