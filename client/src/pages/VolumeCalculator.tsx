import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Mountain,
  Gem,
  Leaf,
  TreePine,
  RectangleHorizontal,
  Circle,
  Calculator,
  ArrowRight,
  Info,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface MaterialType {
  id: string;
  name: string;
  density: number;
  description: string;
  icon: typeof Mountain;
  categorySlug: string;
}

const materials: MaterialType[] = [
  {
    id: "grus-sand",
    name: "Grus & Sand",
    density: 1.5,
    description: "Indkørsler, fliseunderlag, dræn",
    icon: Mountain,
    categorySlug: "sand-grus",
  },
  {
    id: "granit",
    name: "Granitskærver",
    density: 1.6,
    description: "Havegange, pyntesten, gabioner",
    icon: Gem,
    categorySlug: "granitskaerver-sten-pyntesten",
  },
  {
    id: "muld",
    name: "Muld & Kompost",
    density: 1.0,
    description: "Bede, græsplæner, højbede",
    icon: Leaf,
    categorySlug: "muldjord",
  },
  {
    id: "traeflis",
    name: "Træflis & Bark",
    density: 0.4,
    description: "Bede, legepladser, stier",
    icon: TreePine,
    categorySlug: "traeflis",
  },
];

type ShapeType = "rectangle" | "circle";

export default function VolumeCalculator() {
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [shape, setShape] = useState<ShapeType>("rectangle");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [diameter, setDiameter] = useState("");
  const [depth, setDepth] = useState("");

  const material = materials.find((m) => m.id === selectedMaterial);

  const result = useMemo(() => {
    const d = parseFloat(depth);
    if (!material || isNaN(d) || d <= 0) return null;

    let volume: number;
    if (shape === "rectangle") {
      const l = parseFloat(length);
      const w = parseFloat(width);
      if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) return null;
      volume = l * w * d;
    } else {
      const dia = parseFloat(diameter);
      if (isNaN(dia) || dia <= 0) return null;
      volume = Math.PI * Math.pow(dia / 2, 2) * d;
    }

    const weightKg = volume * material.density * 1000;
    const bigbags1000 = Math.ceil(weightKg / 1000);
    const bigbags1700 = Math.ceil(weightKg / 1700);

    return { volume, weightKg, bigbags1000, bigbags1700 };
  }, [selectedMaterial, shape, length, width, diameter, depth, material]);

  const formatNumber = (n: number, decimals: number = 2) =>
    n.toLocaleString("da-DK", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1" style={{ paddingTop: "var(--header-h, 124px)" }}>
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1260px] mx-auto px-5 sm:px-6 py-3">
            <nav className="flex items-center gap-1.5 text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-900 transition-colors">
                Forside
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium">Volumenberegner</span>
            </nav>
          </div>
        </div>

        {/* Page header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1260px] mx-auto px-5 sm:px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Volumenberegner
                </h1>
                <p className="text-gray-500 mt-0.5">
                  Beregn hvor mange bigbags du har brug for til dit projekt
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calculator */}
        <div className="max-w-2xl mx-auto px-5 sm:px-6 py-8 sm:py-12">
          {/* Step 1: Material */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              1. Vælg materialetype
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {materials.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMaterial === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMaterial(m.id)}
                    className={`
                      relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all
                      ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      }
                    `}
                  >
                    <div
                      className={`
                        w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                        ${isSelected ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}
                      `}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className={`font-medium ${isSelected ? "text-emerald-900" : "text-gray-900"}`}>
                        {m.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{m.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Densitet: {m.density.toLocaleString("da-DK")} ton/m&sup3;
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Shape */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              2. Vælg form på arealet
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShape("rectangle")}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-medium transition-all
                  ${
                    shape === "rectangle"
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }
                `}
              >
                <RectangleHorizontal className="w-5 h-5" />
                Rektangel
              </button>
              <button
                onClick={() => setShape("circle")}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-medium transition-all
                  ${
                    shape === "circle"
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }
                `}
              >
                <Circle className="w-5 h-5" />
                Cirkel
              </button>
            </div>
          </div>

          {/* Step 3: Dimensions */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              3. Indtast mål (i meter)
            </h2>
            <Card>
              <CardContent className="p-5 space-y-4">
                {shape === "rectangle" ? (
                  <>
                    <div>
                      <Label htmlFor="length" className="text-gray-700">
                        Længde (m)
                      </Label>
                      <Input
                        id="length"
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="f.eks. 10"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="width" className="text-gray-700">
                        Bredde (m)
                      </Label>
                      <Input
                        id="width"
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="f.eks. 5"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor="diameter" className="text-gray-700">
                      Diameter (m)
                    </Label>
                    <Input
                      id="diameter"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="f.eks. 6"
                      value={diameter}
                      onChange={(e) => setDiameter(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="depth" className="text-gray-700">
                    Dybde / tykkelse (m)
                  </Label>
                  <Input
                    id="depth"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="f.eks. 0.10"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    Typisk 5-15 cm (0,05-0,15 m) for indkørsel, 20-30 cm (0,20-0,30 m) for fundament
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 4: Results */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={`${selectedMaterial}-${shape}-${length}-${width}-${diameter}-${depth}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="mb-8"
              >
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                  4. Resultat
                </h2>
                <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white overflow-hidden">
                  <CardContent className="p-5 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                      <div className="bg-white rounded-lg p-4 border border-emerald-100">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Volumen</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(result.volume)} <span className="text-base font-medium text-gray-500">m&sup3;</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-emerald-100">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vægt</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(result.weightKg, 0)} <span className="text-base font-medium text-gray-500">kg</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-emerald-100 mb-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                        Anbefalede bigbags
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 text-center py-3 bg-emerald-50 rounded-lg">
                          <div className="text-3xl font-bold text-emerald-700">{result.bigbags1000}</div>
                          <div className="text-sm text-emerald-600 font-medium">stk. 1000 kg bigbags</div>
                        </div>
                        <div className="text-center text-sm text-gray-400 font-medium">eller</div>
                        <div className="flex-1 text-center py-3 bg-emerald-50 rounded-lg">
                          <div className="text-3xl font-bold text-emerald-700">{result.bigbags1700}</div>
                          <div className="text-sm text-emerald-600 font-medium">stk. 1700 kg bigbags</div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                      Vi anbefaler at bestille lidt ekstra (5-10%) for at sikre nok materiale.
                    </p>
                  </CardContent>
                </Card>

                {/* CTA */}
                {material && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-5"
                  >
                    <Link href={`/shop/${material.categorySlug}`}>
                      <Button
                        size="lg"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 text-base"
                      >
                        Se vores {material.name.toLowerCase()} produkter
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
