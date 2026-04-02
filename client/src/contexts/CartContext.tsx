import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;          // Final price including variant diff
  quantity: number;
  image: string;
  sku?: string;
  variant?: string;       // Display string, e.g. "1000kg"
  variantSelections?: Record<string, string>;  // { "Mængde": "1000kg" }
  unit?: string;          // bigbag, sæk, etc.
  tieredPricing?: { minQty: number; maxQty: number | null; price: number }[] | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const getEffectivePrice = (item: CartItem): number => {
  if (!item.tieredPricing || item.tieredPricing.length === 0) return item.price;

  // Find matching tier based on quantity
  const tier = item.tieredPricing.find(t =>
    item.quantity >= t.minQty && (t.maxQty === null || item.quantity <= t.maxQty)
  );

  return tier ? tier.price : item.price;
};

const STORAGE_KEY = "gruslevering-cart";

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const key = newItem.variant ? `${newItem.id}-${newItem.variant}` : newItem.id;
      const existing = prev.find((i) => (i.variant ? `${i.id}-${i.variant}` : i.id) === key);
      if (existing) {
        return prev.map((i) =>
          (i.variant ? `${i.id}-${i.variant}` : i.id) === key
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => (i.variant ? `${i.id}-${i.variant}` : i.id) !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems((prev) =>
      prev.map((i) =>
        (i.variant ? `${i.id}-${i.variant}` : i.id) === id ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + getEffectivePrice(i) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, isOpen, setIsOpen, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
