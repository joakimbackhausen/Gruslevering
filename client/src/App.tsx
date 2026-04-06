import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { lazy, Suspense } from "react";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";

const VolumeCalculator = lazy(() => import("@/pages/VolumeCalculator"));
const Delivery = lazy(() => import("@/pages/Delivery"));

function Router() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Indlæser...</div>}>
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
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
