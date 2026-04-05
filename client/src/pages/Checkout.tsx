import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart, getEffectivePrice } from '@/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Minus,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  ShoppingBag,
  Truck,
  MapPin,
  Loader2,
} from 'lucide-react';

function formatPrice(price: number): string {
  return price.toLocaleString('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type DeliveryMethod = 'bigbag' | 'tipvogn' | 'pickup';

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  zip: string;
  city: string;
}

interface FormErrors {
  [key: string]: string;
}

const emptyCustomer: CustomerForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  zip: '',
  city: '',
};

const stepLabels = [
  { num: 1, label: 'Kurv' },
  { num: 2, label: 'Oplysninger' },
  { num: 3, label: 'Levering' },
];

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, updateQuantity, removeItem, totalPrice } = useCart();
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('bigbag');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function getItemKey(item: { id: string; variant?: string }) {
    return item.variant ? `${item.id}-${item.variant}` : item.id;
  }

  /* ── Validation ─────────────────────────────────────────── */
  function validateCustomerForm(): boolean {
    const errors: FormErrors = {};
    if (!customer.firstName.trim()) errors.firstName = 'Fornavn er p\u00e5kr\u00e6vet';
    if (!customer.lastName.trim()) errors.lastName = 'Efternavn er p\u00e5kr\u00e6vet';
    if (!customer.email.trim()) {
      errors.email = 'Email er p\u00e5kr\u00e6vet';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      errors.email = 'Ugyldig email-adresse';
    }
    if (!customer.phone.trim()) {
      errors.phone = 'Telefon er p\u00e5kr\u00e6vet';
    } else if (!/^[\d\s+()-]{8,}$/.test(customer.phone)) {
      errors.phone = 'Ugyldigt telefonnummer';
    }
    if (!customer.address.trim()) errors.address = 'Adresse er p\u00e5kr\u00e6vet';
    if (!customer.zip.trim()) {
      errors.zip = 'Postnummer er p\u00e5kr\u00e6vet';
    } else if (!/^\d{4}$/.test(customer.zip.trim())) {
      errors.zip = 'Postnummer skal v\u00e6re 4 cifre';
    }
    if (!customer.city.trim()) errors.city = 'By er p\u00e5kr\u00e6vet';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /* ── Submit order ───────────────────────────────────────── */
  async function submitOrder() {
    setSubmitting(true);
    setSubmitError('');

    // Map frontend keys to DB enum values
    const deliveryMethodMap: Record<DeliveryMethod, string> = {
      bigbag: 'bigbag',
      tipvogn: 'tipvogn',
      pickup: 'afhentning',
    };

    try {
      const body = {
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        customerZip: customer.zip,
        customerCity: customer.city,
        customerCompany: customer.company || undefined,
        deliveryMethod: deliveryMethodMap[deliveryMethod],
        lines: items.map((item) => ({
          productId: item.id,
          title: item.title,
          sku: item.sku || '',
          qty: item.quantity,
          unitPrice: getEffectivePrice(item),
          variantSelections: item.variantSelections,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Kunne ikke oprette ordren');
      }

      const result = await res.json();
      if (result.paymentUrl) {
        // Redirect to Worldline payment page
        window.location.href = result.paymentUrl;
      } else {
        // No payment needed (free order / pickup)
        navigate(`/ordre-bekraeftelse?order_id=${result.orderId}`);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Der opstod en fejl. Pr\u00f8v igen.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Step indicator ─────────────────────────────────────── */
  function StepIndicator() {
    return (
      <div className="flex items-center justify-center gap-0 mb-10">
        {stepLabels.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <button
              onClick={() => s.num < step && setStep(s.num)}
              className={`flex items-center gap-2 ${s.num < step ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  s.num < step
                    ? 'bg-green-500 text-white'
                    : s.num === step
                      ? 'bg-[#1a1a1a] text-white'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {s.num < step ? <Check className="w-4 h-4" /> : s.num}
              </span>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  s.num === step
                    ? 'text-[#1a1a1a] font-bold'
                    : s.num < step
                      ? 'text-green-600'
                      : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </button>
            {i < stepLabels.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-3 rounded-full ${
                  s.num < step ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  /* ── Step 1: Cart ───────────────────────────────────────── */
  function StepCart() {
    if (items.length === 0) {
      return (
        <div className="text-center py-16">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-[20px] font-semibold text-[#1a1a1a] mb-2">
            Din kurv er tom
          </p>
          <p className="text-gray-500 mb-6">
            Du har ikke tilf&oslash;jet nogen produkter endnu.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            G&aring; til shop
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-[22px] font-bold text-[#1a1a1a] mb-6">Din kurv</h2>
        <div className="space-y-3">
          {items.map((item) => {
            const key = getItemKey(item);
            const effectivePrice = getEffectivePrice(item);
            const hasTiered = item.tieredPricing && item.tieredPricing.length > 0 && effectivePrice !== item.price;
            return (
              <div
                key={key}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-50"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[#1a1a1a] truncate">
                    {item.title}
                  </p>
                  {item.variant && (
                    <p className="text-[13px] text-gray-500">{item.variant}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[14px] text-gray-500">
                      {formatPrice(effectivePrice)} kr
                    </p>
                    {hasTiered && (
                      <span className="text-[11px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                        M&aelig;ngderabat
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(key, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(key, Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-10 h-8 text-center text-[14px] border border-gray-200 rounded-md focus:outline-none focus:border-green-500"
                  />
                  <button
                    onClick={() => updateQuantity(key, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
                <p className="text-[15px] font-semibold text-[#1a1a1a] w-24 text-right">
                  {formatPrice(effectivePrice * item.quantity)} kr
                </p>
                <button
                  onClick={() => removeItem(key)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[15px] text-gray-500">Subtotal (ekskl. moms)</span>
          <span className="text-[17px] font-semibold text-[#1a1a1a]">
            {formatPrice(totalPrice)} kr
          </span>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link
            href="/shop"
            className="text-[14px] text-gray-500 hover:text-[#1a1a1a] transition-colors"
          >
            &larr; Tilbage til shop
          </Link>
          <button
            onClick={() => setStep(2)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 px-8 rounded-lg transition-colors"
          >
            Forts&aelig;t
          </button>
        </div>
      </div>
    );
  }

  /* ── Step 2: Customer Details ───────────────────────────── */
  function StepCustomerDetails() {
    const inputClass =
      'w-full px-4 py-3 border rounded-lg text-[15px] focus:outline-none transition-colors';
    const labelClass = 'text-[14px] font-medium text-[#1a1a1a] mb-1.5 block';

    function inputClasses(field: string) {
      return `${inputClass} ${
        formErrors[field]
          ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200'
          : 'border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-200'
      }`;
    }

    function upd(field: keyof CustomerForm) {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomer({ ...customer, [field]: e.target.value });
        if (formErrors[field]) {
          setFormErrors({ ...formErrors, [field]: '' });
        }
      };
    }

    function handleContinue() {
      if (validateCustomerForm()) {
        setStep(3);
      }
    }

    return (
      <div>
        <h2 className="text-[22px] font-bold text-[#1a1a1a] mb-6">
          Dine oplysninger
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <label htmlFor="fn" className={labelClass}>
              Fornavn <span className="text-red-500">*</span>
            </label>
            <input
              id="fn"
              type="text"
              value={customer.firstName}
              onChange={upd('firstName')}
              className={inputClasses('firstName')}
              placeholder="Fornavn"
            />
            {formErrors.firstName && (
              <p className="text-[12px] text-red-500 mt-1">{formErrors.firstName}</p>
            )}
          </div>
          <div>
            <label htmlFor="ln" className={labelClass}>
              Efternavn <span className="text-red-500">*</span>
            </label>
            <input
              id="ln"
              type="text"
              value={customer.lastName}
              onChange={upd('lastName')}
              className={inputClasses('lastName')}
              placeholder="Efternavn"
            />
            {formErrors.lastName && (
              <p className="text-[12px] text-red-500 mt-1">{formErrors.lastName}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={customer.email}
              onChange={upd('email')}
              className={inputClasses('email')}
              placeholder="din@email.dk"
            />
            {formErrors.email && (
              <p className="text-[12px] text-red-500 mt-1">{formErrors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Telefon <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={customer.phone}
              onChange={upd('phone')}
              className={inputClasses('phone')}
              placeholder="+45 12 34 56 78"
            />
            {formErrors.phone && (
              <p className="text-[12px] text-red-500 mt-1">{formErrors.phone}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="company" className={labelClass}>
              Firma
            </label>
            <input
              id="company"
              type="text"
              value={customer.company}
              onChange={upd('company')}
              className={inputClasses('company')}
              placeholder="Valgfrit"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="addr" className={labelClass}>
              Adresse <span className="text-red-500">*</span>
            </label>
            <input
              id="addr"
              type="text"
              value={customer.address}
              onChange={upd('address')}
              className={inputClasses('address')}
              placeholder="Gadenavn og nummer"
            />
            {formErrors.address && (
              <p className="text-[12px] text-red-500 mt-1">{formErrors.address}</p>
            )}
          </div>
          <div>
            <label htmlFor="zip" className={labelClass}>
              Postnummer <span className="text-red-500">*</span>
            </label>
            <input
              id="zip"
              type="text"
              value={customer.zip}
              onChange={upd('zip')}
              className={inputClasses('zip')}
              placeholder="1234"
            />
            {formErrors.zip && (
              <p className="text-[12px] text-red-500 mt-1">{formErrors.zip}</p>
            )}
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>
              By <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              type="text"
              value={customer.city}
              onChange={upd('city')}
              className={inputClasses('city')}
              placeholder="By"
            />
            {formErrors.city && (
              <p className="text-[12px] text-red-500 mt-1">{formErrors.city}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="country" className={labelClass}>
              Land
            </label>
            <input
              id="country"
              type="text"
              value="Danmark"
              disabled
              className={`${inputClass} border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed`}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep(1)}
            className="border border-gray-200 text-[#1a1a1a] font-medium py-3.5 px-8 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Tilbage
          </button>
          <button
            onClick={handleContinue}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 px-8 rounded-lg transition-colors"
          >
            Forts&aelig;t
          </button>
        </div>
      </div>
    );
  }

  /* ── Step 3: Delivery ───────────────────────────────────── */
  function StepDelivery() {
    const options: {
      key: DeliveryMethod;
      icon: React.ReactNode;
      title: string;
      price: string;
      desc: string;
    }[] = [
      {
        key: 'bigbag',
        icon: <Truck className="w-6 h-6" />,
        title: 'Bigbag-levering',
        price: 'Fri',
        desc: 'Leveres med kran direkte til din adresse',
      },
      {
        key: 'tipvogn',
        icon: <Truck className="w-6 h-6" />,
        title: 'Tipvogn-levering',
        price: 'Pris efter aftale',
        desc: 'For st\u00f8rre ordrer, kontakt os',
      },
      {
        key: 'pickup',
        icon: <MapPin className="w-6 h-6" />,
        title: 'Afhentning i Tylstrup',
        price: 'Gratis',
        desc: 'Tylstrupvej 1, 9382 Tylstrup',
      },
    ];

    return (
      <div>
        <h2 className="text-[22px] font-bold text-[#1a1a1a] mb-6">
          V&aelig;lg leveringsmetode
        </h2>

        <div className="space-y-3 mb-8">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDeliveryMethod(opt.key)}
              className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                deliveryMethod === opt.key
                  ? 'border-green-500 bg-green-50/50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 flex-shrink-0 mt-0.5">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    deliveryMethod === opt.key
                      ? 'border-green-500'
                      : 'border-gray-300'
                  }`}
                >
                  {deliveryMethod === opt.key && (
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  )}
                </div>
                <span
                  className={
                    deliveryMethod === opt.key ? 'text-green-600' : 'text-gray-400'
                  }
                >
                  {opt.icon}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-[#1a1a1a]">
                    {opt.title}
                  </span>
                  <span
                    className={`text-[14px] font-medium ${
                      opt.price === 'Fri' || opt.price === 'Gratis'
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {opt.price}
                  </span>
                </div>
                <p className="text-[13px] text-gray-500 mt-1">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {submitError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-[14px] text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(2)}
            className="border border-gray-200 text-[#1a1a1a] font-medium py-3.5 px-8 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Tilbage
          </button>
          <button
            onClick={submitOrder}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3.5 px-8 rounded-lg transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Behandler...
              </>
            ) : (
              'Afgiv ordre'
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ── Order summary sidebar ──────────────────────────────── */
  function OrderSummary() {
    if (items.length === 0) return null;

    return (
      <div
        className="bg-white rounded-xl border border-gray-200 p-6"
        style={{ position: 'sticky', top: 'calc(var(--header-h, 124px) + 24px)' }}
      >
        <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-4">Ordreoversigt</h3>

        <div className="space-y-3 mb-4">
          {items.map((item) => {
            const key = getItemKey(item);
            const effectivePrice = getEffectivePrice(item);
            return (
              <div key={key} className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-10 h-10 object-cover rounded-md flex-shrink-0 bg-gray-50"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1a1a1a] truncate">
                    {item.title}
                  </p>
                  <p className="text-[12px] text-gray-500">
                    {item.quantity} &times; {formatPrice(effectivePrice)} kr
                  </p>
                </div>
                <p className="text-[13px] font-medium text-[#1a1a1a] flex-shrink-0">
                  {formatPrice(effectivePrice * item.quantity)} kr
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2.5">
          <div className="flex justify-between text-[14px]">
            <span className="text-gray-500">Subtotal (ekskl. moms)</span>
            <span className="text-[#1a1a1a]">{formatPrice(totalPrice)} kr</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-gray-500">Moms (25%)</span>
            <span className="text-[#1a1a1a]">
              {formatPrice(totalPrice * 0.25)} kr
            </span>
          </div>
          {step >= 3 && (
            <div className="flex justify-between text-[14px]">
              <span className="text-gray-500">Levering</span>
              <span className="text-green-600 font-medium">
                {deliveryMethod === 'tipvogn' ? 'Efter aftale' : 'Gratis'}
              </span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="text-[16px] font-bold text-[#1a1a1a]">
              Total (inkl. moms)
            </span>
            <span className="text-[18px] font-bold text-[#1a1a1a]">
              {formatPrice(totalPrice * 1.25)} kr
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
      <Header />
      <main
        className="min-h-screen bg-[#f9f9f9]"
        style={{ paddingTop: 'var(--header-h, 124px)' }}
      >
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10">
          <StepIndicator />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className={`${step === 1 ? 'lg:col-span-12' : 'lg:col-span-7'}`}>
              <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8">
                {step === 1 && <StepCart />}
                {step === 2 && <StepCustomerDetails />}
                {step === 3 && <StepDelivery />}
              </div>
            </div>
            {step >= 2 && (
              <div className="lg:col-span-5">
                <OrderSummary />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
