import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, Wind, Droplets, Scale, X } from 'lucide-react';

interface MEPCalculatorsProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export default function MEPCalculators({ isOpen, onClose, theme }: MEPCalculatorsProps) {
  const [activeTab, setActiveTab] = useState<'duct' | 'pipe' | 'weight'>('duct');

  // --- Duct Sizer State ---
  const [cfm, setCfm] = useState<number>(1000);
  const [friction, setFriction] = useState<number>(0.1);
  const [ductWidth, setDuctWidth] = useState<number>(12);

  // --- Pipe Sizer State ---
  const [gpm, setGpm] = useState<number>(100);
  const [velocityLimit, setVelocityLimit] = useState<number>(6);

  // --- Duct Weight State ---
  const [wWidth, setWWidth] = useState<number>(24);
  const [wHeight, setWHeight] = useState<number>(12);
  const [wLength, setWLength] = useState<number>(100);
  const [gauge, setGauge] = useState<number>(22);
  const [waste, setWaste] = useState<number>(15);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // --- Calculations ---

  // 1. Duct Sizer (ASHRAE Fundamentals)
  const calcDuct = () => {
    const validCfm = Math.max(0.1, cfm);
    const validFriction = Math.max(0.001, friction);
    
    // Round Diameter (inches)
    const diameter = Math.pow((0.109136 * Math.pow(validCfm, 1.9)) / validFriction, 1 / 5.02);
    
    // Velocity (FPM)
    const areaSqFt = Math.PI * Math.pow(diameter / 24, 2);
    const velocity = validCfm / areaSqFt;

    // Rectangular Height (Binary search for equivalent diameter)
    const validWidth = Math.max(1, ductWidth);
    let low = 0.1;
    let high = 1000;
    let height = diameter;
    
    for (let i = 0; i < 50; i++) {
      height = (low + high) / 2;
      const de = 1.30 * Math.pow(validWidth * height, 0.625) / Math.pow(validWidth + height, 0.25);
      if (de > diameter) {
        high = height;
      } else {
        low = height;
      }
    }

    return {
      diameter: diameter.toFixed(1),
      velocity: Math.round(velocity),
      height: height.toFixed(1)
    };
  };

  // 2. Pipe Sizer (Water - Closed Loop)
  const calcPipe = () => {
    const validGpm = Math.max(0.1, gpm);
    const validVel = Math.max(0.1, velocityLimit);
    const cFactor = 120; // Steel pipe

    // Exact internal diameter required for velocity limit
    const exactDiameter = Math.sqrt((validGpm * 0.4085) / validVel);
    
    // Standard commercial sizes (inches)
    const standardSizes = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 24];
    const standardSize = standardSizes.find(s => s >= exactDiameter) || exactDiameter;

    // Actual velocity with standard size
    const actualVelocity = (validGpm * 0.4085) / Math.pow(standardSize, 2);
    
    // Friction loss (Hazen-Williams) ft/100ft
    const frictionLoss = 0.2083 * Math.pow(100 / cFactor, 1.85) * Math.pow(validGpm, 1.85) / Math.pow(standardSize, 4.865);

    return {
      exactDiameter: exactDiameter.toFixed(2),
      standardSize: standardSize.toFixed(2),
      actualVelocity: actualVelocity.toFixed(1),
      frictionLoss: frictionLoss.toFixed(2)
    };
  };

  // 3. Duct Weight
  const calcWeight = () => {
    const gaugeWeights: Record<number, number> = {
      26: 0.906,
      24: 1.156,
      22: 1.406,
      20: 1.656,
      18: 2.156,
      16: 2.656
    };

    const areaSqFt = (2 * (wWidth + wHeight) / 12) * wLength;
    const baseWeight = areaSqFt * (gaugeWeights[gauge] || 1.156);
    const totalWeightLbs = baseWeight * (1 + waste / 100);
    const totalWeightKg = totalWeightLbs * 0.453592;

    return {
      area: areaSqFt.toFixed(1),
      lbs: totalWeightLbs.toFixed(1),
      kg: totalWeightKg.toFixed(1)
    };
  };

  const ductResults = calcDuct();
  const pipeResults = calcPipe();
  const weightResults = calcWeight();

  const inputClass = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white/80 border-blue-200 text-slate-900'}`;
  const labelClass = `block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`;
  const resultBoxClass = `p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-blue-100 shadow-sm'}`;
  const resultLabelClass = `text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`;
  const resultValueClass = `text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#0f172a] border border-blue-900/50' : 'bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200'}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-blue-700 to-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-lg backdrop-blur-sm">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">MEP Engineering Tools</h2>
                  <p className="text-xs text-blue-100">Professional-grade calculators for MEP design</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full transition-colors hover:bg-white/20 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className={`flex overflow-x-auto border-b ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-blue-200/50 bg-white/50 backdrop-blur-sm'}`}>
              <button
                onClick={() => setActiveTab('duct')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'duct' ? 'border-b-2 border-blue-600 text-blue-600' : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Wind className="w-4 h-4" />
                Duct Sizer
              </button>
              <button
                onClick={() => setActiveTab('pipe')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'pipe' ? 'border-b-2 border-blue-600 text-blue-600' : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Droplets className="w-4 h-4" />
                Pipe Sizer
              </button>
              <button
                onClick={() => setActiveTab('weight')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'weight' ? 'border-b-2 border-blue-600 text-blue-600' : theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Scale className="w-4 h-4" />
                Duct Weight
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              
              {/* DUCT SIZER */}
              {activeTab === 'duct' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className={`text-sm font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Inputs</h3>
                      <div>
                        <label className={labelClass}>Airflow (CFM)</label>
                        <input type="number" value={cfm} onChange={e => setCfm(Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Friction Loss (in. wg / 100 ft)</label>
                        <input type="number" step="0.01" value={friction} onChange={e => setFriction(Number(e.target.value))} className={inputClass} />
                      </div>
                      <div className="pt-4 border-t border-dashed border-slate-300 dark:border-slate-700">
                        <label className={labelClass}>Rectangular Duct Width (inches)</label>
                        <input type="number" value={ductWidth} onChange={e => setDuctWidth(Number(e.target.value))} className={inputClass} />
                        <p className="text-[10px] mt-1 text-slate-500">Enter width to calculate equivalent height.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className={`text-sm font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Results</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className={resultBoxClass}>
                          <div className={resultLabelClass}>Round Diameter</div>
                          <div className={resultValueClass}>{ductResults.diameter}"</div>
                        </div>
                        <div className={resultBoxClass}>
                          <div className={resultLabelClass}>Velocity</div>
                          <div className={resultValueClass}>{ductResults.velocity} <span className="text-sm font-normal text-slate-500">FPM</span></div>
                        </div>
                        <div className={`col-span-2 ${resultBoxClass} bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50`}>
                          <div className={resultLabelClass}>Equivalent Rectangular Size</div>
                          <div className={`text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1`}>
                            {ductWidth}" <span className="text-lg text-slate-400 font-medium mx-1">x</span> {ductResults.height}"
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 text-right mt-2">* Calculations based on ASHRAE Fundamentals</p>
                    </div>
                  </div>
                </div>
              )}

              {/* PIPE SIZER */}
              {activeTab === 'pipe' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className={`text-sm font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Inputs (Water)</h3>
                      <div>
                        <label className={labelClass}>Flow Rate (GPM)</label>
                        <input type="number" value={gpm} onChange={e => setGpm(Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Max Velocity Limit (fps)</label>
                        <input type="number" step="0.1" value={velocityLimit} onChange={e => setVelocityLimit(Number(e.target.value))} className={inputClass} />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className={`text-sm font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Results</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`col-span-2 ${resultBoxClass} bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50`}>
                          <div className={resultLabelClass}>Recommended Standard Size</div>
                          <div className={`text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1`}>
                            {pipeResults.standardSize}"
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Exact internal diameter required: {pipeResults.exactDiameter}"</div>
                        </div>
                        <div className={resultBoxClass}>
                          <div className={resultLabelClass}>Actual Velocity</div>
                          <div className={resultValueClass}>{pipeResults.actualVelocity} <span className="text-sm font-normal text-slate-500">fps</span></div>
                        </div>
                        <div className={resultBoxClass}>
                          <div className={resultLabelClass}>Friction Loss</div>
                          <div className={resultValueClass}>{pipeResults.frictionLoss} <span className="text-sm font-normal text-slate-500">ft/100ft</span></div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 text-right mt-2">* Hazen-Williams formula (C=120 for Steel)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* DUCT WEIGHT */}
              {activeTab === 'weight' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className={`text-sm font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Dimensions & Specs</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Width (inches)</label>
                          <input type="number" value={wWidth} onChange={e => setWWidth(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Height (inches)</label>
                          <input type="number" value={wHeight} onChange={e => setWHeight(Number(e.target.value))} className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Length (feet)</label>
                        <input type="number" value={wLength} onChange={e => setWLength(Number(e.target.value))} className={inputClass} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-slate-300 dark:border-slate-700">
                        <div>
                          <label className={labelClass}>Galvanized Gauge</label>
                          <select value={gauge} onChange={e => setGauge(Number(e.target.value))} className={inputClass}>
                            <option value={26}>26 ga</option>
                            <option value={24}>24 ga</option>
                            <option value={22}>22 ga</option>
                            <option value={20}>20 ga</option>
                            <option value={18}>18 ga</option>
                            <option value={16}>16 ga</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Waste/Seams (%)</label>
                          <input type="number" value={waste} onChange={e => setWaste(Number(e.target.value))} className={inputClass} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className={`text-sm font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Results</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className={resultBoxClass}>
                          <div className={resultLabelClass}>Total Surface Area</div>
                          <div className={resultValueClass}>{weightResults.area} <span className="text-sm font-normal text-slate-500">sq ft</span></div>
                        </div>
                        <div className={`${resultBoxClass} bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50`}>
                          <div className={resultLabelClass}>Total Estimated Weight</div>
                          <div className="flex items-end gap-4 mt-1">
                            <div className={`text-4xl font-bold text-blue-600 dark:text-blue-400`}>
                              {weightResults.kg} <span className="text-xl font-medium text-blue-500/70">kg</span>
                            </div>
                            <div className={`text-2xl font-bold text-slate-400 dark:text-slate-500 mb-1`}>
                              {weightResults.lbs} <span className="text-sm font-medium">lbs</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 text-right mt-2">* Includes {waste}% allowance for seams, joints, and waste.</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
