import { useEffect, useRef } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { Check, ArrowRight, Phone, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface OrderResponse {
  id: number;
  status: string;
  total: string;
  paymentUrl: string | null;
  orderNumber: string;
}

const statusMap: Record<string, string> = {
  pending: 'Afventer betaling',
  processing: 'Behandles',
  'on-hold': 'Afventer',
  completed: 'Gennemfoert',
  cancelled: 'Annulleret',
  refunded: 'Refunderet',
  failed: 'Fejlet',
};

function formatPrice(price: number): string {
  return price.toLocaleString('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function OrderConfirmation() {
  const { clearCart } = useCart();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);

  // Support both order_id (new) and order (old) params
  const orderId = params.get('order_id') || params.get('order') || '';

  const hasCleared = useRef(false);

  // Clear cart on mount
  useEffect(() => {
    if (!orderId) {
      setLocation('/shop');
      return;
    }
    if (!hasCleared.current) {
      hasCleared.current = true;
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: order, isLoading, isError } = useQuery<OrderResponse>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error('Kunne ikke hente ordre');
      return res.json();
    },
    enabled: !!orderId,
    retry: 2,
  });

  const statusDanish = order ? (statusMap[order.status] || order.status) : '';
  const totalNum = order ? parseFloat(order.total) : 0;

  return (
    <>
      <Header />
      <main
        className="min-h-screen bg-[#f9f9f9]"
        style={{ paddingTop: 'var(--header-h, 124px)' }}
      >
        <div className="mx-auto max-w-[600px] px-4 py-12">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-green-600 mb-4" />
              <p className="text-gray-500">Henter ordreoplysninger...</p>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="text-center py-20">
              <div className="flex justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-10 w-10 text-green-600" strokeWidth={3} />
                </div>
              </div>
              <h1 className="text-[32px] font-bold text-[#1a1a1a] mb-2">
                Tak for din ordre!
              </h1>
              {orderId && (
                <div className="flex justify-center mb-3">
                  <span className="inline-block rounded-full bg-green-100 text-green-700 px-5 py-2 text-[15px] font-semibold">
                    Ordrenr. {orderId}
                  </span>
                </div>
              )}
              <p className="text-center text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                Vi kontakter dig inden for 24 timer for at bekr&aelig;fte levering.
              </p>
            </div>
          )}

          {/* Success state with order data */}
          {!isLoading && !isError && order && (
            <>
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
              <div className="flex justify-center mb-3">
                <span className="inline-block rounded-full bg-green-100 text-green-700 px-5 py-2 text-[15px] font-semibold">
                  Ordrenr. {order.orderNumber}
                </span>
              </div>

              {/* Subtitle */}
              <p className="text-center text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                Vi kontakter dig inden for 24 timer for at bekr&aelig;fte levering.
              </p>

              {/* Order details card */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
                <h3 className="text-[16px] font-bold text-[#1a1a1a] mb-4">
                  Ordredetaljer
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ordrenummer</span>
                    <span className="text-[#1a1a1a] font-medium">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="text-[#1a1a1a] font-medium">{statusDanish}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-base">
                    <span className="text-[#1a1a1a]">Total</span>
                    <span className="text-[#1a1a1a]">{formatPrice(totalNum)} kr</span>
                  </div>
                </div>
              </div>

              {/* Payment link if pending */}
              {order.paymentUrl && order.status === 'pending' && (
                <div className="flex justify-center mb-6">
                  <a
                    href={order.paymentUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 px-8 py-3.5 text-[15px] font-semibold text-white transition-colors"
                  >
                    Gaa til betaling
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}
            </>
          )}

          {/* No order_id and not loading */}
          {!isLoading && !orderId && (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-4">Ingen ordre fundet.</p>
            </div>
          )}

          {/* Contact info */}
          {!isLoading && (
            <>
              <div className="flex items-center justify-center gap-2 text-[14px] text-gray-500 mb-8">
                <Phone className="w-4 h-4" />
                <span>
                  Spoergsm&aring;l? Ring{' '}
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
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
