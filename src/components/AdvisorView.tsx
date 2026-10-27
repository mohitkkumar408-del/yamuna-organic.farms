import React, { useState } from 'react';
import {
  BookOpen,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { growthGuide } from '../data/initialData';
import { MushroomVariety } from '../types';
import { useFarm } from '../context/FarmContext';

export const AdvisorView: React.FC = () => {
  const { t } = useFarm();
  const [selectedVariety, setSelectedVariety] = useState<MushroomVariety>('Oyster (Dhingri)');

  const currentGuide = growthGuide.find((g) => g.variety === selectedVariety) || growthGuide[0];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 tracking-tight">
          {t.cultivationAdvisorTitle}
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          {t.advisorSubtitle}. Grounded in ICAR-Directorate of Mushroom Research (DMR) Solan agronomic protocols.
        </p>
      </div>

      {/* Variety Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {growthGuide.map((g) => (
          <button
            key={g.variety}
            onClick={() => setSelectedVariety(g.variety)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedVariety === g.variety
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {g.variety}
          </button>
        ))}
      </div>

      {/* Main Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Spawn Run Temperature */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-500 mb-2">
            <Thermometer className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium">{t.optimumTempSpawn}</span>
          </div>
          <div className="text-xl font-bold font-mono text-neutral-900">
            {currentGuide.optimumTempSpawnRun}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Dark spawn run incubation period: {currentGuide.spawnRunDays}
          </p>
        </div>

        {/* Fruiting Temperature */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-500 mb-2">
            <Thermometer className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-medium">{t.optimumTempFruiting}</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-800">
            {currentGuide.optimumTempFruiting}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Optimal temperature for pinhead initiation and cap growth
          </p>
        </div>

        {/* Relative Humidity */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-500 mb-2">
            <Droplets className="h-4 w-4 text-teal-600" />
            <span className="text-xs font-medium">{t.optimumHumidity}</span>
          </div>
          <div className="text-xl font-bold font-mono text-teal-700">
            {currentGuide.optimumHumidity}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Maintain with ultrasonic humidifiers or fine nozzle foggers
          </p>
        </div>

        {/* Biological Efficiency Benchmark */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-500 mb-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium">Expected Yield (B.E. %)</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-700">
            {currentGuide.biologicalEfficiencyExpected}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Fresh mushroom kg / dry substrate kg
          </p>
        </div>
      </div>

      {/* Substrate Preparation & Growth Stage Protocols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Substrate & Environmental Specifications */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            Substrate Formulation & Sterilization
          </h3>

          <div className="rounded-lg bg-neutral-50 p-3 space-y-1.5 border border-neutral-100">
            <span className="font-semibold text-neutral-800 block">Recommended Base:</span>
            <p className="text-neutral-700">{currentGuide.substrate}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-neutral-800">Fresh Air & CO2 Ventilation Rules:</h4>
            <p className="text-neutral-600 leading-relaxed">{currentGuide.co2Level}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-neutral-800">Photoperiod & Light:</h4>
            <p className="text-neutral-600 leading-relaxed">{currentGuide.lightRequirement}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-neutral-800">Cropping Cycle & Flushes:</h4>
            <p className="text-neutral-600 leading-relaxed">{currentGuide.fruitingDays}</p>
          </div>
        </div>

        {/* Right Column: Agronomic Contamination & Troubleshooting */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Farm Contamination Management & Prevention
          </h3>

          <div className="space-y-3">
            <div className="rounded-lg border border-neutral-200 p-3">
              <span className="font-bold text-neutral-900 block text-xs">
                1. Green Mold (Trichoderma harzianum)
              </span>
              <p className="text-neutral-600 mt-1">
                <strong>Symptoms:</strong> Patchy emerald-green spores on substrate surface before or during pinning.
              </p>
              <p className="text-neutral-600 mt-0.5">
                <strong>Corrective Action:</strong> Isolate contaminated bags immediately. Apply 0.1% Carbendazim/Bavistin spot treatment; increase chamber sanitation and ensure 65°C core pasteurization for 2 hours.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 p-3">
              <span className="font-bold text-neutral-900 block text-xs">
                2. Bacterial Blotch (Pseudomonas tolaasii)
              </span>
              <p className="text-neutral-600 mt-1">
                <strong>Symptoms:</strong> Yellowish-brown sunken lesions on mushroom caps, slimy texture.
              </p>
              <p className="text-neutral-600 mt-0.5">
                <strong>Corrective Action:</strong> Never mist directly over open caps within 4 hours before harvest. Increase exhaust fan speed to evaporate standing water film on cap surfaces within 45 minutes.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 p-3">
              <span className="font-bold text-neutral-900 block text-xs">
                3. Long Stems / Small Caps (Excess CO2)
              </span>
              <p className="text-neutral-600 mt-1">
                <strong>Symptoms:</strong> Thick elongated stalks with stunted tiny caps (drumstick phenotype).
              </p>
              <p className="text-neutral-600 mt-0.5">
                <strong>Corrective Action:</strong> CO2 is exceeding 1200 ppm. Run fresh air exhaust cycles for 10 minutes every hour during fruiting stage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
