import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ReferenceLine } from 'recharts';

const CarbonIncentivesCalculator = () => {
  // Constants for calculations
  const electricityEmissionsFactor = 0.000015742; // MTCO2e/kWh from Ashland data
  const gasEmissionsFactor = 0.005; // MTCO2e/therm
  const incentiveRatesPerMT = [367.5, 551.25, 735]; // From EV incentive analysis
  const incentiveLabels = ["1-year value", "Mid-range value", "Lifecycle value"];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Initial state for inputs and results
  const [inputs, setInputs] = useState({
    spaceHeating: {
      gasHeaterCost: 3000,
      gasInstallationCost: 1000,
      heatPumpCost: 7000,
      heatPumpInstallationCost: 1500,
      currentIncentive: 700,
      federalTaxCredit: 2000,
      annualGasUsage: 567, // therms per year
      heatingPercentage: 53, // % of gas used for heating
      gasFurnaceEfficiency: 0.85,
      heatPumpCOP: 3.0,
      electricityRate: 0.11, // $/kWh
      gasRate: 1.50, // $/therm
      equipmentLifespan: 15, // years
      discountRate: 3, // %
      annualMaintenanceGas: 150, // $
      annualMaintenanceHP: 100, // $
      futureUtilityRateIncrease: 2 // % annual increase
    },
    waterHeating: {
      gasWaterHeaterCost: 1200,
      gasInstallationCost: 600,
      heatPumpWaterHeaterCost: 2000,
      heatPumpInstallationCost: 500,
      currentIncentive: 300,
      federalTaxCredit: 600,
      annualGasUsage: 567, // therms per year
      waterHeatingPercentage: 20, // % of gas used for water heating
      gasWaterHeaterEfficiency: 0.65,
      heatPumpWaterHeaterEF: 3.5,
      electricityRate: 0.11, // $/kWh
      gasRate: 1.50, // $/therm
      equipmentLifespan: 12, // years
      discountRate: 3, // %
      annualMaintenanceGas: 50, // $
      annualMaintenanceHP: 25, // $
      futureUtilityRateIncrease: 2 // % annual increase
    },
    bundleDiscount: 10, // % discount when installing both technologies
    viewMode: 'consumer' // 'consumer' or 'program' view
  });

  // Add results state
  const [results, setResults] = useState({
    spaceHeating: {},
    waterHeating: {},
    combined: {},
    comparisonData: []
  });

  // Add state for scenarios and comparison
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState('');
  const [compareScenarios, setCompareScenarios] = useState([]);

  // Load saved inputs
  useEffect(() => {
    const savedInputs = localStorage.getItem('carbonCalculatorInputs');
    if (savedInputs) {
      try {
        setInputs(JSON.parse(savedInputs));
      } catch (e) {
        console.error("Error loading saved data:", e);
      }
    }
  }, []);

  // Save inputs to local storage
  useEffect(() => {
    localStorage.setItem('carbonCalculatorInputs', JSON.stringify(inputs));
  }, [inputs]);

  // Load saved scenarios on component mount
  useEffect(() => {
    const savedScenarioData = localStorage.getItem('carbonCalculatorScenarios');
    if (savedScenarioData) {
      try {
        setSavedScenarios(JSON.parse(savedScenarioData));
      } catch (e) {
        console.error("Error loading saved scenarios:", e);
      }
    }
  }, []);

  // Reset function
  const resetToDefaults = () => {
    // Define your default values
    const defaultInputs = {
      spaceHeating: {
        gasHeaterCost: 3000,
        gasInstallationCost: 1000,
        heatPumpCost: 7000,
        heatPumpInstallationCost: 1500,
        currentIncentive: 700,
        federalTaxCredit: 2000,
        annualGasUsage: 567,
        heatingPercentage: 53,
        gasFurnaceEfficiency: 0.85,
        heatPumpCOP: 3.0,
        electricityRate: 0.11,
        gasRate: 1.50,
        equipmentLifespan: 15,
        discountRate: 3,
        annualMaintenanceGas: 150,
        annualMaintenanceHP: 100,
        futureUtilityRateIncrease: 2
      },
      waterHeating: {
        gasWaterHeaterCost: 1200,
        gasInstallationCost: 600,
        heatPumpWaterHeaterCost: 2000,
        heatPumpInstallationCost: 500,
        currentIncentive: 300,
        federalTaxCredit: 600,
        annualGasUsage: 567,
        waterHeatingPercentage: 20,
        gasWaterHeaterEfficiency: 0.65,
        heatPumpWaterHeaterEF: 3.5,
        electricityRate: 0.11,
        gasRate: 1.50,
        equipmentLifespan: 12,
        discountRate: 3,
        annualMaintenanceGas: 50,
        annualMaintenanceHP: 25,
        futureUtilityRateIncrease: 2
      },
      bundleDiscount: 10,
      viewMode: 'consumer'
    };
    
    setInputs(defaultInputs);
    localStorage.removeItem('carbonCalculatorInputs');
  };

  // Export functions
  const exportToCSV = () => {
    // Ensure results are available
    if (!results.spaceHeating || !results.waterHeating || !results.combined) {
      alert("Please calculate results first");
      return;
    }
    
    // Prepare data for CSV export
    const rows = [
      ['Category', 'Parameter', 'Value'],
      ['Space Heating', 'Annual Emissions Reduction', results.spaceHeating.netEmissionsReduction],
      ['Space Heating', 'Lifecycle Emissions Reduction', results.spaceHeating.lifetimeEmissionsReduction],
      ['Space Heating', 'Annual Savings', results.spaceHeating.annualSavings],
      ['Space Heating', 'Payback Period', results.spaceHeating.simplePaybackYears],
      ['Water Heating', 'Annual Emissions Reduction', results.waterHeating.netEmissionsReduction],
      ['Water Heating', 'Lifecycle Emissions Reduction', results.waterHeating.lifetimeEmissionsReduction],
      ['Water Heating', 'Annual Savings', results.waterHeating.annualSavings],
      ['Water Heating', 'Payback Period', results.waterHeating.simplePaybackYears],
      ['Combined', 'Annual Emissions Reduction', results.combined.netEmissionsReduction],
      ['Combined', 'Lifecycle Emissions Reduction', results.combined.lifetimeEmissionsReduction],
      ['Combined', 'Total Incentive', results.combined.totalIncentive],
      ['Combined', 'Payback Period', results.combined.paybackPeriod]
    ];
    
    // Convert to CSV format
    const csvContent = "data:text/csv;charset=utf-8," + 
      rows.map(row => row.join(',')).join('\n');
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "carbon_reduction_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      inputs: inputs,
      results: results
    }, null, 2));
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", dataStr);
    downloadLink.setAttribute("download", "carbon_calculator_data.json");
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Scenario management functions
  const saveCurrentScenario = () => {
    if (!scenarioName) {
      alert("Please enter a name for this scenario");
      return;
    }
    
    // Make sure results are populated
    if (!results || !results.spaceHeating || !results.waterHeating) {
      alert("Please ensure calculations are complete before saving");
      return;
    }
    
    const newScenario = {
      id: Date.now(),
      name: scenarioName,
      inputs: JSON.parse(JSON.stringify(inputs)),
      results: JSON.parse(JSON.stringify(results))
    };
    
    setSavedScenarios(prev => [...prev, newScenario]);
    setScenarioName('');
    
    // Save to localStorage
    const allScenarios = [...savedScenarios, newScenario];
    localStorage.setItem('carbonCalculatorScenarios', JSON.stringify(allScenarios));
  };

  const loadScenario = (scenario) => {
    setInputs(JSON.parse(JSON.stringify(scenario.inputs)));
  };

  const deleteScenario = (id) => {
    const updatedScenarios = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updatedScenarios);
    localStorage.setItem('carbonCalculatorScenarios', JSON.stringify(updatedScenarios));
  };

  const toggleCompareScenario = (scenario) => {
    if (compareScenarios.some(s => s.id === scenario.id)) {
      setCompareScenarios(prev => prev.filter(s => s.id !== scenario.id));
    } else {
      if (compareScenarios.length < 3) {
        setCompareScenarios(prev => [...prev, scenario]);
      } else {
        alert("You can compare up to 3 scenarios at a time");
      }
    }
  };
  
  // Scenario Manager component
  const ScenarioManager = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Scenario Manager</h3>
          
          <div className="flex items-center mb-4">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Scenario Name"
              className="flex-grow p-2 border rounded mr-2"
            />
            <button 
              onClick={saveCurrentScenario}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Save Scenario
            </button>
          </div>
          
          {savedScenarios.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Space Heating</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Water Heating</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Combined Reduction</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {savedScenarios.map((scenario) => (
                    <tr key={scenario.id}>
                      <td className="px-4 py-2 whitespace-nowrap">{scenario.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatNumber(scenario.results.spaceHeating.netEmissionsReduction)} MTCO2e/yr
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatNumber(scenario.results.waterHeating.netEmissionsReduction)} MTCO2e/yr
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatNumber(scenario.results.combined.netEmissionsReduction)} MTCO2e/yr
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => loadScenario(scenario)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                          >
                            Load
                          </button>
                          <button 
                            onClick={() => toggleCompareScenario(scenario)}
                            className={`px-2 py-1 text-white text-xs rounded ${
                              compareScenarios.some(s => s.id === scenario.id) 
                                ? 'bg-green-600' 
                                : 'bg-gray-500'
                            }`}
                          >
                            Compare
                          </button>
                          <button 
                            onClick={() => deleteScenario(scenario.id)}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No saved scenarios yet. Create your first one!</p>
          )}
        </div>
        
        {compareScenarios.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Scenario Comparison</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-sm mb-2">Annual Emissions Reduction</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={compareScenarios.map(s => ({
                        name: s.name,
                        spaceHeating: s.results.spaceHeating.netEmissionsReduction,
                        waterHeating: s.results.waterHeating.netEmissionsReduction,
                        combined: s.results.combined.netEmissionsReduction
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis label={{ value: 'MTCO2e/year', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => `${formatNumber(value, 2)} MTCO2e`} />
                      <Legend />
                      <Bar dataKey="spaceHeating" name="Space Heating" stackId="a" fill="#2563EB" />
                      <Bar dataKey="waterHeating" name="Water Heating" stackId="a" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Payback Period</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={compareScenarios.map(s => ({
                        name: s.name,
                        spaceHeating: s.results.spaceHeating.simplePaybackYears,
                        waterHeating: s.results.waterHeating.simplePaybackYears,
                        combined: s.results.combined.paybackPeriod
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis label={{ value: 'Years', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => `${formatNumber(value, 1)} years`} />
                      <Legend />
                      <Bar dataKey="spaceHeating" name="Space Heating" fill="#2563EB" />
                      <Bar dataKey="waterHeating" name="Water Heating" fill="#10B981" />
                      <Bar dataKey="combined" name="Combined" fill="#F97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Formatting helpers
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Calculate results for a single technology (space heating or water heating)
  const calculateResults = (category, params) => {
    // Determine which percentage field to use based on category
    const percentageField = category === 'spaceHeating' ? 'heatingPercentage' : 'waterHeatingPercentage';
    
    // Calculate therms used for this purpose (heating or water heating)
    const therms = params.annualGasUsage * (params[percentageField] / 100);
    
    // Calculate emissions for gas system
    const annualEmissionsGas = therms * gasEmissionsFactor;
    
    // Calculate equivalent electricity usage for heat pump
    const efficiencyField = category === 'spaceHeating' ? 'heatPumpCOP' : 'heatPumpWaterHeaterEF';
    const kwhEquivalent = (therms * 29.3) / params[efficiencyField];
    
    // Calculate emissions for heat pump
    const annualEmissionsHP = kwhEquivalent * electricityEmissionsFactor;
    
    // Calculate net emissions reduction
    const netEmissionsReduction = annualEmissionsGas - annualEmissionsHP;
    const lifetimeEmissionsReduction = netEmissionsReduction * params.equipmentLifespan;
    
    // Calculate annual operating costs
    const annualCostGas = therms * params.gasRate + params.annualMaintenanceGas;
    const annualCostHP = kwhEquivalent * params.electricityRate + params.annualMaintenanceHP;
    const annualSavings = annualCostGas - annualCostHP;
    
    // Calculate initial costs
    const systemCostField = category === 'spaceHeating' ? 'gasHeaterCost' : 'gasWaterHeaterCost';
    const hpCostField = category === 'spaceHeating' ? 'heatPumpCost' : 'heatPumpWaterHeaterCost';
    
    const initialCostGas = params[systemCostField] + params.gasInstallationCost;
    const initialCostHP = params[hpCostField] + params.heatPumpInstallationCost - params.currentIncentive - params.federalTaxCredit;
        
    // Calculate simple payback period
    const additionalCost = initialCostHP - initialCostGas;
    const simplePaybackYears = additionalCost / annualSavings;
    
    // Calculate payback period without incentives
    const additionalCostNoIncentives = (params[hpCostField] + params.heatPumpInstallationCost) - initialCostGas;
    const simplePaybackWithIncentive = additionalCost / annualSavings;
    const simplePaybackNoIncentive = additionalCostNoIncentives / annualSavings;
    
    // Calculate NPV with utility rate increases
    let npv = -additionalCost;
    let currentSavings = annualSavings;
    
    for (let year = 1; year <= params.equipmentLifespan; year++) {
      // Increase savings by utility rate increase percentage
      currentSavings *= (1 + params.futureUtilityRateIncrease / 100);
      
      // Add discounted savings to NPV
      npv += currentSavings / Math.pow(1 + (params.discountRate / 100), year);
    }
    
    // Calculate optimal incentives based on carbon reduction
    const optimalIncentives = incentiveRatesPerMT.map(rate => 
      (netEmissionsReduction * rate).toFixed(2)
    );
    
    // Calculate year-by-year data for charts
    const yearByYearData = [];
    let cumulativeCostGas = initialCostGas;
    let cumulativeCostHP = initialCostHP;
    currentSavings = annualSavings;
    
    for (let year = 0; year <= params.equipmentLifespan; year++) {
      if (year > 0) {
        // Apply utility rate increase each year
        if (year > 1) {
          currentSavings *= (1 + params.futureUtilityRateIncrease / 100);
        }
        
        // Update cumulative costs
        cumulativeCostGas += (therms * params.gasRate * Math.pow(1 + params.futureUtilityRateIncrease / 100, year - 1)) + params.annualMaintenanceGas;
        cumulativeCostHP += (kwhEquivalent * params.electricityRate * Math.pow(1 + params.futureUtilityRateIncrease / 100, year - 1)) + params.annualMaintenanceHP;
      }
      
      yearByYearData.push({
        year,
        cumulativeCostGas,
        cumulativeCostHP,
        savings: cumulativeCostGas - cumulativeCostHP,
        cumulativeEmissionsGas: year * annualEmissionsGas,
        cumulativeEmissionsHP: year * annualEmissionsHP,
        cumulativeEmissionsSavings: year * netEmissionsReduction
      });
    }
    
    return {
      annualEmissionsGas,
      annualEmissionsHP,
      netEmissionsReduction,
      lifetimeEmissionsReduction,
      annualCostGas,
      annualCostHP,
      annualSavings,
      simplePaybackYears,
      simplePaybackWithIncentive,
      simplePaybackNoIncentive,
      netPresentValue: npv,
      optimalIncentives,
      yearByYearData,
      initialCostGas,
      initialCostHP,
      additionalCost
    };
  };

  // Calculate combined results for both technologies
  const calculateCombinedResults = (spaceHeating, waterHeating) => {
    const bundleDiscount = (inputs.spaceHeating.currentIncentive + inputs.waterHeating.currentIncentive) * (inputs.bundleDiscount / 100);
    const totalIncentive = inputs.spaceHeating.currentIncentive + inputs.waterHeating.currentIncentive + bundleDiscount;
    
    const netEmissionsReduction = spaceHeating.netEmissionsReduction + waterHeating.netEmissionsReduction;
    const lifetimeEmissionsReduction = spaceHeating.lifetimeEmissionsReduction + waterHeating.lifetimeEmissionsReduction;
    
    const costPerMTCO2e = totalIncentive / netEmissionsReduction;
    
    // Calculate combined payback considering bundle discount
    const combinedAdditionalCost = 
      (spaceHeating.additionalCost + waterHeating.additionalCost) - bundleDiscount;
    const combinedAnnualSavings = spaceHeating.annualSavings + waterHeating.annualSavings;
    const paybackPeriod = combinedAdditionalCost / combinedAnnualSavings;
    
    return {
      bundleDiscount,
      totalIncentive,
      netEmissionsReduction,
      lifetimeEmissionsReduction,
      costPerMTCO2e,
      paybackPeriod
    };
  };

  // Generate comparison data for different technologies
  const generateComparisonData = (spaceHeatingResults, waterHeatingResults) => {
    return [
      {
        name: 'Space Heating HP',
        annualReduction: spaceHeatingResults.netEmissionsReduction,
        lifetimeReduction: spaceHeatingResults.lifetimeEmissionsReduction,
        incentiveCost: inputs.spaceHeating.currentIncentive,
        costPerTon: inputs.spaceHeating.currentIncentive / spaceHeatingResults.netEmissionsReduction,
        lifetimeCostPerTon: inputs.spaceHeating.currentIncentive / spaceHeatingResults.lifetimeEmissionsReduction,
        payback: spaceHeatingResults.simplePaybackWithIncentive
      },
      {
        name: 'Water Heating HP',
        annualReduction: waterHeatingResults.netEmissionsReduction,
        lifetimeReduction: waterHeatingResults.lifetimeEmissionsReduction,
        incentiveCost: inputs.waterHeating.currentIncentive,
        costPerTon: inputs.waterHeating.currentIncentive / waterHeatingResults.netEmissionsReduction,
        lifetimeCostPerTon: inputs.waterHeating.currentIncentive / waterHeatingResults.lifetimeEmissionsReduction,
        payback: waterHeatingResults.simplePaybackWithIncentive
      },
      {
        name: 'EV (Reference)',
        annualReduction: 2.72,  // From spreadsheet
        lifetimeReduction: 32.64, // From spreadsheet (12 years)
        incentiveCost: 1000,    // Base incentive
        costPerTon: 367.5,      // Base incentive per ton
        lifetimeCostPerTon: 30.63, // From spreadsheet
        payback: 3.5           // Estimated payback
      },
      {
        name: 'E-Bike (Reference)',
        annualReduction: 0.567, // From spreadsheet
        lifetimeReduction: 5.67, // Assuming 10 year life
        incentiveCost: 300,     // Base incentive
        costPerTon: 529.1,      // Calculated from data
        lifetimeCostPerTon: 52.91, // Calculated
        payback: 2.5           // Estimated payback
      }
    ];
  };

  // Update results when inputs change
  useEffect(() => {
    const spaceHeatingResults = calculateResults('spaceHeating', inputs.spaceHeating);
    const waterHeatingResults = calculateResults('waterHeating', inputs.waterHeating);
    
    const combinedResults = calculateCombinedResults(spaceHeatingResults, waterHeatingResults);
    const comparisonData = generateComparisonData(spaceHeatingResults, waterHeatingResults);
    
    setResults({
      spaceHeating: spaceHeatingResults,
      waterHeating: waterHeatingResults,
      combined: combinedResults,
      comparisonData
    });
  }, [inputs]);

  // Handle input changes
  const handleInputChange = (category, name, value) => {
    setInputs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [name]: parseFloat(value)
      }
    }));
  };

  // Handle bundle discount changes
  const handleBundleDiscountChange = (value) => {
    setInputs(prev => ({
      ...prev,
      bundleDiscount: parseFloat(value)
    }));
  };

  // Handle view mode changes
  const handleViewModeChange = (mode) => {
    setInputs(prev => ({
      ...prev,
      viewMode: mode
    }));
  };

  // Input field component
  const InputField = ({ category, label, name, value, min, max, step = 1, unit = '' }) => (
    <div className="flex flex-col mb-3">
      <label className="text-sm font-medium mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleInputChange(category, name, e.target.value)}
          className="flex-grow"
        />
        <div className="flex items-center">
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(category, name, e.target.value)}
            className="w-20 p-1 border rounded text-sm"
          />
          {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
        </div>
      </div>
    </div>
  );

  // Sensitivity analysis component
 // Sensitivity analysis component
 const SensitivityAnalysis = () => {
  const [parameter, setParameter] = useState('gasRate');
  const [technology, setTechnology] = useState('spaceHeating');
  const [range, setRange] = useState(50); // percentage +/-
  
  // Generate data points for sensitivity analysis
  const generateSensitivityData = () => {
    const currentValue = inputs[technology][parameter];
    const parameterLabel = getParameterLabel(parameter);
    const data = [];
    
    // Generate 9 data points centered around current value
    for (let i = -range; i <= range; i += (range/4)) {
      // Calculate new value based on percentage change
      const newValue = currentValue * (1 + (i / 100));
      
      // Create a copy of inputs with this parameter changed
      const newInputs = { ...inputs };
      newInputs[technology][parameter] = newValue;
      
      // Calculate results with this new value
      const results = calculateResults(technology, newInputs[technology]);
      
      data.push({
        changePercent: i,
        parameterValue: newValue,
        paybackYears: results.simplePaybackYears,
        annualEmissions: results.netEmissionsReduction,
        npv: results.netPresentValue
      });
    }
    
    return { data, parameterLabel };
  };
  
  const { data, parameterLabel } = generateSensitivityData();
  
  // Helper function to get user-friendly label
  function getParameterLabel(param) {
    const labels = {
      'gasRate': 'Gas Rate ($/therm)',
      'electricityRate': 'Electricity Rate ($/kWh)',
      'heatPumpCOP': 'Heat Pump COP',
      'heatPumpWaterHeaterEF': 'HPWH Efficiency Factor',
      'gasHeaterCost': 'Gas Furnace Cost',
      'heatPumpCost': 'Heat Pump Cost',
      'currentIncentive': 'Incentive Amount'
    };
    return labels[param] || param;
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Sensitivity Analysis</h3>
        <p className="text-sm text-gray-600 mb-4">
          Analyze how changes in key parameters affect outcomes.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Technology</label>
            <select 
              value={technology} 
              onChange={(e) => setTechnology(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="spaceHeating">Space Heating</option>
              <option value="waterHeating">Water Heating</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parameter</label>
            <select 
              value={parameter} 
              onChange={(e) => setParameter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="gasRate">Gas Rate</option>
              <option value="electricityRate">Electricity Rate</option>
              {technology === 'spaceHeating' ? (
                <option value="heatPumpCOP">Heat Pump COP</option>
              ) : (
                <option value="heatPumpWaterHeaterEF">Water Heater Efficiency</option>
              )}
              <option value="currentIncentive">Incentive Amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Range (±%)</label>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={range}
              onChange={(e) => setRange(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm">±{range}%</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-sm mb-2">Impact on Payback Period</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="changePercent" 
                  label={{ value: `% Change in ${parameterLabel}`, position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Payback Period (Years)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${formatNumber(value, 1)} years`, 'Payback Period']}
                  labelFormatter={(value) => `${value}% change in ${parameterLabel}`}
                />
                <Line
                  type="monotone"
                  dataKey="paybackYears"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <ReferenceLine x={0} stroke="#666" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium text-sm mb-2">Impact on Emissions Reduction</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="changePercent" 
                  label={{ value: `% Change in ${parameterLabel}`, position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Annual Emissions Reduction (MTCO2e)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${formatNumber(value, 2)} MTCO2e`, 'Emissions Reduction']}
                  labelFormatter={(value) => `${value}% change in ${parameterLabel}`}
                />
                <Line
                  type="monotone"
                  dataKey="annualEmissions"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <ReferenceLine x={0} stroke="#666" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="font-medium text-sm mb-2">Impact on Net Present Value</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="changePercent" 
                label={{ value: `% Change in ${parameterLabel}`, position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Net Present Value ($)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Net Present Value']}
                labelFormatter={(value) => `${value}% change in ${parameterLabel}`}
              />
              <Line
                type="monotone"
                dataKey="npv"
                stroke="#F97316"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <ReferenceLine x={0} stroke="#666" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};