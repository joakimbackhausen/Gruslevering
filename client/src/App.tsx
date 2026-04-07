import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/contexts/CartContext";
import { lazy, Suspense } from "react";

// Only Home is eagerly loaded (landing page), everything else is lazy
import Home from "@/pages/Home";

const Shop = lazy(() => import("@/pages/Shop"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const VolumeCalculator = lazy(() => import("@/pages/VolumeCalculator"));
const Delivery = lazy(() => import("@/pages/Delivery"));
const Article = lazy(() => import("@/pages/Article"));

// Lazy-load toast system (rarely needed on first render)
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));

function Router() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-[var(--grus-green)] border-t-transparent rounded-full animate-spin" /></div>}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={Shop} />
        <Route path="/shop/:kategori" component={Shop} />
        <Route path="/shop/:kategori/:underkategori" component={Shop} />
        <Route path="/produkt/:id" component={ProductDetail} />
        <Route path="/volumenberegner" component={VolumeCalculator} />
        <Route path="/levering" component={Delivery} />
        <Route path="/om-os" component={About} />
        <Route path="/kontakt" component={Contact} />
        <Route path="/guide/:slug" component={Article} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/ordre-bekraeftelse" component={OrderConfirmation} />
        <Route component={Home} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Router />
        <Suspense fallback={null}>
          <Toaster />
        </Suspense>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
