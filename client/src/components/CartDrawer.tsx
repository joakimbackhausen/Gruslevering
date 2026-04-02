import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, getEffectivePrice } from "../contexts/CartContext";
import { Link } from "wouter";

function formatPrice(price: number): string {
  return (
    price.toLocaleString("da-DK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " DKK"
  );
}

export default function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    isOpen,
    setIsOpen,
    totalItems,
    totalPrice,
  } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer panel */}
          <motion.aside
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-[400px] flex-col bg-white shadow-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[#1a1a1a]">
                  Indkøbskurv
                </h2>
                {totalItems > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3f9b3f] px-1.5 text-xs font-medium text-white">
                    {totalItems}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Luk kurv"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {items.length === 0 ? (
              /* Empty state */
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5">
                <ShoppingBag className="h-16 w-16 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">
                  Din kurv er tom
                </p>
                <Link
                  href="/shop"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg bg-[#3f9b3f] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#358535]"
                >
                  Se produkter
                </Link>
              </div>
            ) : (
              <>
                {/* Item list */}
                <ul className="flex-1 divide-y overflow-y-auto px-5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const itemKey = item.variant
                        ? `${item.id}-${item.variant}`
                        : item.id;
                      const effectivePrice = getEffectivePrice(item);
                      const hasDiscount = effectivePrice < item.price;

                      return (
                        <motion.li
                          key={itemKey}
                          className="flex gap-3 py-4"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Product image */}
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-12 w-12 shrink-0 rounded-md border object-cover"
                          />

                          {/* Details */}
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[#1a1a1a]">
                                  {item.title}
                                </p>
                                {item.variantSelections && Object.keys(item.variantSelections).length > 0 && (
                                  <p className="truncate text-xs text-gray-500">
                                    {Object.entries(item.variantSelections)
                                      .map(([key, val]) => `${key}: ${val}`)
                                      .join(" / ")}
                                  </p>
                                )}
                                {!item.variantSelections && item.variant && (
                                  <p className="truncate text-xs text-gray-500">
                                    {item.variant}
                                  </p>
                                )}
                                {hasDiscount && (
                                  <span className="mt-0.5 inline-block rounded bg-[#3f9b3f]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#3f9b3f]">
                                    Mængderabat!
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => removeItem(itemKey)}
                                className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                aria-label={`Fjern ${item.title}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between">
                              {/* Quantity controls */}
                              <div className="flex items-center gap-0">
                                <button
                                  onClick={() =>
                                    updateQuantity(itemKey, item.quantity - 1)
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-full border text-gray-600 transition-colors hover:bg-gray-100"
                                  aria-label="Fjern én"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-8 text-center text-sm font-medium text-[#1a1a1a]">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(itemKey, item.quantity + 1)
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-full border text-gray-600 transition-colors hover:bg-gray-100"
                                  aria-label="Tilføj én"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {/* Line price */}
                              <div className="text-right">
                                {hasDiscount && (
                                  <p className="text-[10px] text-gray-400 line-through">
                                    {formatPrice(item.price * item.quantity)}
                                  </p>
                                )}
                                <p className="text-sm font-medium text-[#1a1a1a]">
                                  {formatPrice(effectivePrice * item.quantity)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>

                {/* Footer */}
                <div className="border-t px-5 py-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Subtotal (ekskl. moms)
                    </span>
                    <span className="text-base font-semibold text-[#1a1a1a]">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="block w-full rounded-lg bg-[#3f9b3f] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#358535]"
                  >
                    Gå til kassen
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
