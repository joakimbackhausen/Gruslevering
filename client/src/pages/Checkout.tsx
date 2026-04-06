import { useState, useEffect, useCallback } from 'react';
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
  Package,
  Loader2,
  AlertCircle,
} from 'lucide-react';

function formatPrice(price: number): string {
  return price.toLocaleString('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface ShippingRate {
  rateId: string;
  name: string;
  description: string;
  methodId: string;
  instanceId: number;
  price: number;
  priceFormatted: string;
  deliveryTime: string;
  selected: boolean;
}

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
  const [selectedShippingRate, setSelectedShippingRate] = useState<ShippingRate | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
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

  /* ── Fetch shipping rates from WC Store API ─────────────── */
  const fetchShippingRates = useCallback(async () => {
    if (items.length === 0 || !customer.zip) return;

    setShippingLoading(true);
    setShippingError('');
    setShippingRates([]);
    setSelectedShippingRate(null);

    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            wcProductId: item.wcProductId || Number(item.id),
            wcVariationId: item.wcVariationId || undefined,
            quantity: item.quantity,
          })),
          address: {
            address_1: customer.address,
            city: customer.city,
            postcode: customer.zip.trim(),
            country: 'DK',
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Kunne ikke beregne fragtpriser');
      }

      const data = await res.json();
      const rates: ShippingRate[] = data.rates || [];

      setShippingRates(rates);

      // Auto-select the first rate (or the one WC marked as selected)
      const preSelected = rates.find((r) => r.selected) || rates[0];
      if (preSelected) {
        setSelectedShippingRate(preSelected);
      }
    } catch (err: any) {
      setShippingError(err.message || 'Kunne ikke hente fragtmuligheder');
    } finally {
      setShippingLoading(false);
    }
  }, [items, customer.zip, customer.address, customer.city]);

  // Fetch shipping rates when entering step 3
  useEffect(() => {
    if (step === 3) {
      fetchShippingRates();
    }
  }, [step, fetchShippingRates]);

  /* ── Submit order ───────────────────────────────────────── */
  async function submitOrder() {
    if (!selectedShippingRate) {
      setSubmitError('V\u00e6lg venligst en leveringsmetode');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    // Map shipping method to delivery method enum for our DB
    const methodId = selectedShippingRate.methodId;
    let deliveryMethod = 'bigbag';
    if (methodId === 'local_pickup') {
      deliveryMethod = 'afhentning';
    } else if (selectedShippingRate.name.toLowerCase().includes('tipvogn')) {
      deliveryMethod = 'tipvogn';
    }

    try {
      const body = {
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        customerZip: customer.zip,
        customerCity: customer.city,
        customerCompany: customer.company || undefined,
        deliveryMethod,
        shippingRateId: selectedShippingRate.rateId,
        shippingMethodTitle: selectedShippingRate.name,
        shippingTotal: selectedShippingRate.price.toFixed(2),
        lines: items.map((item) => ({
          productId: item.id,
          wcProductId: item.wcProductId || undefined,
          wcVariationId: item.wcVariationId || undefined,
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
        window.location.href = result.paymentUrl;
      } else {
        navigate(`/ordre-bekraeftelse?order_id=${result.orderId}`);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Der opstod en fejl. Pr\u00f8v igen.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Helpers for Step 2 form ─────────────────────────────── */
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

  function handleCustomerChange(field: keyof CustomerForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomer((prev) => ({ ...prev, [field]: e.target.value }));
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };
  }

  function handleCustomerContinue() {
    if (validateCustomerForm()) {
      setStep(3);
    }
  }

  /* ── Shipping icon helper ────────────────────────────────── */
  function getShippingIcon(rate: ShippingRate) {
    if (rate.methodId === 'local_pickup') return <MapPin className="w-6 h-6" />;
    if (rate.methodId === 'shipmondo') return <Package className="w-6 h-6" />;
    return <Truck className="w-6 h-6" />;
  }

  const shippingCost = selectedShippingRate?.price ?? 0;

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
      <Header />
      <main
        className="min-h-screen bg-[#f9f9f9]"
        style={{ paddingTop: 'var(--header-h, 124px)' }}
      >
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10">
          {/* ── Step indicator ── */}
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className={`${step === 1 ? 'lg:col-span-12' : 'lg:col-span-7'}`}>
              <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8">

                {/* ── Step 1: Cart ── */}
                {step === 1 && (
                  items.length === 0 ? (
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
                  ) : (
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
                  )
                )}

                {/* ── Step 2: Customer Details ── */}
                {step === 2 && (
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
                          onChange={handleCustomerChange('firstName')}
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
                          onChange={handleCustomerChange('lastName')}
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
                          onChange={handleCustomerChange('email')}
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
                          onChange={handleCustomerChange('phone')}
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
                          onChange={handleCustomerChange('company')}
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
                          onChange={handleCustomerChange('address')}
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
                          onChange={handleCustomerChange('zip')}
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
                          onChange={handleCustomerChange('city')}
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
                        onClick={handleCustomerContinue}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 px-8 rounded-lg transition-colors"
                      >
                        Forts&aelig;t
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Delivery ── */}
                {step === 3 && (
                  <div>
                    <h2 className="text-[22px] font-bold text-[#1a1a1a] mb-6">
                      V&aelig;lg leveringsmetode
                    </h2>

                    {/* Loading state */}
                    {shippingLoading && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-4" />
                        <p className="text-[15px] text-gray-500">Beregner fragtmuligheder...</p>
                        <p className="text-[13px] text-gray-400 mt-1">
                          Baseret p&aring; din adresse og kurv
                        </p>
                      </div>
                    )}

                    {/* Error state */}
                    {!shippingLoading && shippingError && (
                      <div className="mb-6 p-5 rounded-xl bg-red-50 border border-red-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[14px] font-medium text-red-700 mb-1">
                              Kunne ikke hente fragtmuligheder
                            </p>
                            <p className="text-[13px] text-red-600">{shippingError}</p>
                            <button
                              onClick={fetchShippingRates}
                              className="mt-3 text-[13px] font-medium text-red-700 underline hover:text-red-800"
                            >
                              Pr&oslash;v igen
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shipping rates */}
                    {!shippingLoading && shippingRates.length > 0 && (
                      <div className="space-y-3 mb-8">
                        {shippingRates.map((rate) => {
                          const isSelected = selectedShippingRate?.rateId === rate.rateId;
                          return (
                            <button
                              key={rate.rateId}
                              onClick={() => setSelectedShippingRate(rate)}
                              className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                  ? 'border-green-500 bg-green-50/50 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-shrink-0 mt-0.5">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isSelected ? 'border-green-500' : 'border-gray-300'
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                  )}
                                </div>
                                <span className={isSelected ? 'text-green-600' : 'text-gray-400'}>
                                  {getShippingIcon(rate)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[15px] font-semibold text-[#1a1a1a]">
                                    {rate.name}
                                  </span>
                                  <span
                                    className={`text-[14px] font-medium ${
                                      rate.price === 0 ? 'text-green-600' : 'text-[#1a1a1a]'
                                    }`}
                                  >
                                    {rate.priceFormatted}
                                  </span>
                                </div>
                                {(rate.description || rate.deliveryTime) && (
                                  <p className="text-[13px] text-gray-500 mt-1">
                                    {rate.deliveryTime || rate.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* No rates available */}
                    {!shippingLoading && !shippingError && shippingRates.length === 0 && (
                      <div className="mb-6 p-5 rounded-xl bg-yellow-50 border border-yellow-200">
                        <p className="text-[14px] text-yellow-700">
                          Ingen fragtmuligheder fundet for din adresse. Kontakt os p&aring;{' '}
                          <a href="tel:+4572494444" className="font-medium underline">
                            +45 72 49 44 44
                          </a>
                        </p>
                      </div>
                    )}

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
                        disabled={submitting || shippingLoading || !selectedShippingRate}
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
                )}

              </div>
            </div>
            {step >= 2 && (
              <div className="lg:col-span-5">
                {/* ── Order summary sidebar ── */}
                {items.length > 0 && (
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
                      {step >= 3 && selectedShippingRate && (
                        <div className="flex justify-between text-[14px]">
                          <span className="text-gray-500">Levering</span>
                          <span className={`font-medium ${shippingCost === 0 ? 'text-green-600' : 'text-[#1a1a1a]'}`}>
                            {selectedShippingRate.priceFormatted}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-gray-100 pt-3 flex justify-between">
                        <span className="text-[16px] font-bold text-[#1a1a1a]">
                          Total (inkl. moms)
                        </span>
                        <span className="text-[18px] font-bold text-[#1a1a1a]">
                          {formatPrice((totalPrice + shippingCost) * 1.25)} kr
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
