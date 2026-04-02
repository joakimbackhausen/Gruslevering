import { useEffect, useRef } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { Check, ArrowRight, Phone } from 'lucide-react';
import { useCart, getEffectivePrice } from '@/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function formatPrice(price: number): string {
  return price.toLocaleString('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function OrderConfirmation() {
  const { items, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);

  const orderNumber = params.get('order') || '';
  const deliveryMethod = params.get('delivery') || '';

  const savedItems = useRef(items);
  const hasCleared = useRef(false);

  useEffect(() => {
    if (!orderNumber && savedItems.current.length === 0) {
      setLocation('/shop');
      return;
    }
    if (!hasCleared.current) {
      hasCleared.current = true;
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cartItems = savedItems.current;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getEffectivePrice(item) * item.quantity,
    0
  );
  const moms = subtotal * 0.25;
  const total = subtotal + moms;

  return (
    <>
      <Header />
      <main
        className="min-h-screen bg-[#f9f9f9]"
        style={{ paddingTop: 'var(--header-h, 124px)' }}
      >
        <div className="mx-auto max-w-[600px] px-4 py-12">
          {/* Success icon */}
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Check className="h-10 w-10 text-green-600" strokeWidth={3} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center text-[32px] font-bold text-[#1a1a1a] mb-2">
            Tak for din ordre!
          </h1>

          {/* Order number */}
          {orderNumber && (
            <div className="flex justify-center mb-3">
              <span className="inline-block rounded-full bg-green-100 text-green-700 px-5 py-2 text-[15px] font-semibold">
                Ordrenr. {orderNumber}
              </span>
            </div>
          )}

          {/* Subtitle */}
          <p className="text-center text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
            Vi kontakter dig inden for 24 timer for at bekr&aelig;fte levering.
          </p>

          {/* Order summary card */}
          {cartItems.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
              <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-4">
                Ordreoversigt
              </h3>
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const key = item.variant
                    ? `${item.id}-${item.variant}`
                    : item.id;
                  const effectivePrice = getEffectivePrice(item);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-10 h-10 object-cover rounded-md flex-shrink-0 bg-gray-50"
                        />
                        <div className="min-w-0">
                          <p className="text-[#1a1a1a] font-medium truncate">
                            {item.title}
                          </p>
                          {item.variant && (
                            <p className="text-[12px] text-gray-400">
                              {item.variant}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-500 whitespace-nowrap ml-4">
                        {item.quantity} &times; {formatPrice(effectivePrice)} kr
                      </span>
                    </div>
                  );
                })}
              </div>

              <hr className="my-4 border-gray-100" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal (ekskl. moms)</span>
                  <span className="text-[#1a1a1a]">
                    {formatPrice(subtotal)} kr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Moms (25%)</span>
                  <span className="text-[#1a1a1a]">{formatPrice(moms)} kr</span>
                </div>
                {deliveryMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Levering</span>
                    <span className="text-[#1a1a1a]">{deliveryMethod}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-base">
                  <span className="text-[#1a1a1a]">Total (inkl. moms)</span>
                  <span className="text-[#1a1a1a]">{formatPrice(total)} kr</span>
                </div>
              </div>
            </div>
          )}

          {/* Contact info */}
          <div className="flex items-center justify-center gap-2 text-[14px] text-gray-500 mb-8">
            <Phone className="w-4 h-4" />
            <span>
              Sp&oslash;rgsm&aring;l? Ring{' '}
              <a
                href="tel:+4572494444"
                className="text-green-600 font-medium hover:underline"
              >
                +45 72 49 44 44
              </a>
            </span>
          </div>

          {/* Button */}
          <div className="flex justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 px-8 py-3.5 text-[15px] font-semibold text-white transition-colors"
            >
              Forts&aelig;t med at handle
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
