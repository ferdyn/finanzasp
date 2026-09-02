import { Category } from '../types/finance';

export const DEFAULT_CATEGORIES: Category[] = [
  // Gastos
  { id: 'cat-alimentacion', name: 'Alimentación & Supermercado', icon: 'Utensils', color: '#f97316', type: 'expense', isDefault: true },
  { id: 'cat-vivienda', name: 'Vivienda & Alquiler', icon: 'Home', color: '#6366f1', type: 'expense', isDefault: true },
  { id: 'cat-servicios', name: 'Servicios & Facturas', icon: 'Zap', color: '#eab308', type: 'expense', isDefault: true },
  { id: 'cat-transporte', name: 'Transporte & Combustible', icon: 'Car', color: '#0ea5e9', type: 'expense', isDefault: true },
  { id: 'cat-ocio', name: 'Ocio & Restaurantes', icon: 'Coffee', color: '#ec4899', type: 'expense', isDefault: true },
  { id: 'cat-salud', name: 'Salud & Farmacia', icon: 'HeartPulse', color: '#10b981', type: 'expense', isDefault: true },
  { id: 'cat-educacion', name: 'Educación & Cursos', icon: 'GraduationCap', color: '#8b5cf6', type: 'expense', isDefault: true },
  { id: 'cat-compras', name: 'Compras & Ropa', icon: 'ShoppingBag', color: '#a855f7', type: 'expense', isDefault: true },
  { id: 'cat-suscripciones', name: 'Suscripciones & Streaming', icon: 'Tv', color: '#06b6d4', type: 'expense', isDefault: true },
  { id: 'cat-viajes', name: 'Viajes & Vacaciones', icon: 'Plane', color: '#14b8a6', type: 'expense', isDefault: true },
  { id: 'cat-mascotas', name: 'Mascotas', icon: 'PawPrint', color: '#d97706', type: 'expense', isDefault: true },
  { id: 'cat-impuestos', name: 'Impuestos & Tasas', icon: 'Receipt', color: '#64748b', type: 'expense', isDefault: true },
  { id: 'cat-gastos-otros', name: 'Otros Gastos', icon: 'MoreHorizontal', color: '#94a3b8', type: 'expense', isDefault: true },

  // Ingresos
  { id: 'cat-nomina', name: 'Nómina / Sueldo', icon: 'Briefcase', color: '#10b981', type: 'income', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance & Proyectos', icon: 'Laptop', color: '#06b6d4', type: 'income', isDefault: true },
  { id: 'cat-inversiones', name: 'Rendimientos / Dividendos', icon: 'TrendingUp', color: '#3b82f6', type: 'income', isDefault: true },
  { id: 'cat-ventas', name: 'Ventas de Artículos', icon: 'Tag', color: '#f59e0b', type: 'income', isDefault: true },
  { id: 'cat-regalos', name: 'Regalos & Bonos', icon: 'Gift', color: '#ec4899', type: 'income', isDefault: true },
  { id: 'cat-ingresos-otros', name: 'Otros Ingresos', icon: 'PlusCircle', color: '#84cc16', type: 'income', isDefault: true },
];

export const CATEGORY_ICON_LIST = [
  'Utensils', 'Home', 'Zap', 'Car', 'Coffee', 'HeartPulse', 'GraduationCap', 
  'ShoppingBag', 'Tv', 'Plane', 'PawPrint', 'Receipt', 'Briefcase', 'Laptop', 
  'TrendingUp', 'Tag', 'Gift', 'PlusCircle', 'Film', 'Music', 'Dumbbell', 
  'Smartphone', 'Wifi', 'Bus', 'Fuel', 'ShoppingBasket', 'CreditCard', 'ShieldCheck'
];
