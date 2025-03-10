import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

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

  const [results, setResults] = useState({
    spaceHeating: {
      annualEmissionsGas: 0,
      annualEmissionsHP: 0,
      netEmissionsReduction: 0,
      annualCostGas: 0,
      annualCostHP: 0,
      annualSavings: 0,
      simplePaybackYears: 0,
      simplePaybackWithIncentive: 0,
      netPresentValue: 0,
      optimalIncentives: [0, 0, 0],
      yearByYearData: [],
      lifetimeEmissionsReduction: 0
    },
    waterHeating: {
      annualEmissionsGas: 0,
      annualEmissionsHP: 0,
      netEmissionsReduction: 0,
      annualCostGas: 0,
      annualCostHP: 0,
      annualSavings: 0,
      simplePaybackYears: 0,
      simplePaybackWithIncentive: 0,
      netPresentValue: 0,
      optimalIncentives: [0, 0, 0],
      yearByYearData: [],
      lifetimeEmissionsReduction: 0
    },
    combined: {
      bundleDiscount: 0,
      totalIncentive: 0,
      netEmissionsReduction: 0,
      lifetimeEmissionsReduction: 0,
      costPerMTCO2e: 0,
      paybackPeriod: 0
    },
    comparisonData: [] // For comparing different technologies
  });

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

  // Formatting helpers
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Chart for cost comparison
  const CostComparisonChart = ({ data }) => (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: 'Cumulative Cost ($)', angle: -90, position: 'insideLeft', offset: -5 }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip 
            formatter={(value) => [`$${value.toLocaleString()}`, '']}
            labelFormatter={(value) => `Year ${value}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="cumulativeCostGas"
            name="Gas System"
            stroke="#F97316"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="cumulativeCostHP"
            name="Heat Pump"
            stroke="#2563EB"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // Chart for emissions comparison
  const EmissionsComparisonChart = ({ data }) => (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: 'Cumulative Emissions (MTCO2e)', angle: -90, position: 'insideLeft', offset: -5 }}
          />
          <Tooltip 
            formatter={(value) => [`${value.toFixed(2)} MTCO2e`, '']}
            labelFormatter={(value) => `Year ${value}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="cumulativeEmissionsGas"
            name="Gas System"
            stroke="#F97316"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="cumulativeEmissionsHP"
            name="Heat Pump"
            stroke="#2563EB"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="cumulativeEmissionsSavings"
            name="Emissions Savings"
            stroke="#10B981"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // Chart for technology comparison
  const TechnologyComparisonChart = ({ data, dataKey, name }) => (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={70}
          />
          <YAxis 
            label={{ value: name, angle: -90, position: 'insideLeft', offset: -5 }}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey={dataKey} fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  // Pie chart for program cost-effectiveness
  const IncentiveDistributionChart = ({ data }) => {
    const pieData = data.map(item => ({
      name: item.name,
      value: item.incentiveCost
    }));
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Technology parameter inputs component
  const TechnologyInputs = ({ category, params }) => {
    const isSH = category === 'spaceHeating';
    
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">{isSH ? 'Space' : 'Water'} Heating Parameters</h2>
        
        <div className="mb-4">
          <h3 className="font-medium text-sm text-gray-600 mb-2">Equipment Costs</h3>
          <InputField
            category={category}
            label={`Gas ${isSH ? 'Furnace' : 'Water Heater'} Cost`}
            name={isSH ? 'gasHeaterCost' : 'gasWaterHeaterCost'}
            value={params[isSH ? 'gasHeaterCost' : 'gasWaterHeaterCost']}
            min={isSH ? 1000 : 500}
            max={isSH ? 8000 : 3000}
            step={100}
            unit="$"
          />
          <InputField
            category={category}
            label="Gas Installation Cost"
            name="gasInstallationCost"
            value={params.gasInstallationCost}
            min={200}
            max={3000}
            step={100}
            unit="$"
          />
          <InputField
            category={category}
            label={`Heat Pump ${isSH ? '' : 'Water Heater'} Cost`}
            name={isSH ? 'heatPumpCost' : 'heatPumpWaterHeaterCost'}
            value={params[isSH ? 'heatPumpCost' : 'heatPumpWaterHeaterCost']}
            min={isSH ? 3000 : 1000}
            max={isSH ? 15000 : 5000}
            step={100}
            unit="$"
          />
          <InputField
            category={category}
            label="Heat Pump Installation Cost"
            name="heatPumpInstallationCost"
            value={params.heatPumpInstallationCost}
            min={200}
            max={3000}
            step={100}
            unit="$"
          />
          <InputField
            category={category}
            label="Current Incentive"
            name="currentIncentive"
            value={params.currentIncentive}
            min={0}
            max={5000}
            step={50}
            unit="$"
          />
          <InputField
            category={category}
            label="Federal Tax Credit"
            name="federalTaxCredit"
            value={params.federalTaxCredit}
            min={0}
            max={5000}
            step={50}
            unit="$"
          />
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium text-sm text-gray-600 mb-2">Usage & Efficiency</h3>
          <InputField
            category={category}
            label="Annual Gas Usage"
            name="annualGasUsage"
            value={params.annualGasUsage}
            min={100}
            max={1500}
            step={10}
            unit="therms"
          />
          <InputField
            category={category}
            label={`${isSH ? 'Heating' : 'Water Heating'} Percentage`}
            name={isSH ? 'heatingPercentage' : 'waterHeatingPercentage'}
            value={params[isSH ? 'heatingPercentage' : 'waterHeatingPercentage']}
            min={5}
            max={95}
            step={1}
            unit="%"
          />
          <InputField
            category={category}
            label={`Gas ${isSH ? 'Furnace' : 'Water Heater'} Efficiency`}
            name={isSH ? 'gasFurnaceEfficiency' : 'gasWaterHeaterEfficiency'}
            value={params[isSH ? 'gasFurnaceEfficiency' : 'gasWaterHeaterEfficiency']}
            min={0.5}
            max={0.99}
            step={0.01}
          />
          <InputField
            category={category}
            label={`Heat Pump ${isSH ? 'COP' : 'Efficiency Factor'}`}
            name={isSH ? 'heatPumpCOP' : 'heatPumpWaterHeaterEF'}
            value={params[isSH ? 'heatPumpCOP' : 'heatPumpWaterHeaterEF']}
            min={isSH ? 1.5 : 2.0}
            max={isSH ? 5.0 : 4.0}
            step={0.1}
          />
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium text-sm text-gray-600 mb-2">Economic Factors</h3>
          <InputField
            category={category}
            label="Electricity Rate"
            name="electricityRate"
            value={params.electricityRate}
            min={0.05}
            max={0.30}
            step={0.01}
            unit="$/kWh"
          />
          <InputField
            category={category}
            label="Gas Rate"
            name="gasRate"
            value={params.gasRate}
            min={0.5}
            max={3.0}
            step={0.1}
            unit="$/therm"
          />
          <InputField
            category={category}
            label="Equipment Lifespan"
            name="equipmentLifespan"
            value={params.equipmentLifespan}
            min={8}
            max={25}
            step={1}
            unit="years"
          />
          <InputField
            category={category}
            label="Discount Rate"
            name="discountRate"
            value={params.discountRate}
            min={1}
            max={10}
            step={0.5}
            unit="%"
          />
          <InputField
            category={category}
            label="Annual Utility Rate Increase"
            name="futureUtilityRateIncrease"
            value={params.futureUtilityRateIncrease}
            min={0}
            max={10}
            step={0.5}
            unit="%"
          />
        </div>
      </div>
    );
  };

  // Results summary component
  const ResultsSummary = ({ results, category }) => {
    const isSH = category === 'spaceHeating';
    
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Results Summary</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Emissions Impact</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Annual Gas Emissions:</span>
                <span className="font-medium">{formatNumber(results.annualEmissionsGas)} MTCO2e</span>
              </div>
              <div className="flex justify-between">
                <span>Annual Heat Pump Emissions:</span>
                <span className="font-medium">{formatNumber(results.annualEmissionsHP)} MTCO2e</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Annual Emissions Reduction:</span>
                <span className="font-medium">{formatNumber(results.netEmissionsReduction)} MTCO2e</span>
              </div>
              <div className="flex justify-between">
                <span>Lifecycle Emissions Reduction:</span>
                <span className="font-medium">{formatNumber(results.lifetimeEmissionsReduction)} MTCO2e</span>
              </div>
              <div className="flex justify-between">
                <span>Net Present Value:</span>
                <span className={`font-medium ${results.netPresentValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(results.netPresentValue)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="col-span-2 mt-4">
            <h4 className="font-medium text-sm mb-2">Recommended Incentives</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {results.optimalIncentives.map((incentive, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Based on ${incentiveRatesPerMT[index]}/MT</div>
                  <div className="font-medium text-green-600">{formatCurrency(incentive)}</div>
                  <div className="text-xs text-gray-500">{incentiveLabels[index]}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="col-span-2">
            <h4 className="font-medium text-sm mb-2">Financial Analysis</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Annual Gas Operating Cost:</span>
                <span className="font-medium">{formatCurrency(results.annualCostGas)}</span>
              </div>
              <div className="flex justify-between">
                <span>Annual Heat Pump Operating Cost:</span>
                <span className="font-medium">{formatCurrency(results.annualCostHP)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Annual Savings:</span>
                <span className="font-medium">{formatCurrency(results.annualSavings)}</span>
              </div>
              <div className="flex justify-between">
                <span>Simple Payback Period:</span>
                <span className="font-medium">{formatNumber(results.simplePaybackYears, 1)} years</span>
              </div>
              <div className="flex justify-between">
                <span>Payback with No Incentives:</span>
                <span className="font-medium">{formatNumber(results.simplePaybackNoIncentive, 1)} years</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Timeline comparison component
  const TimelineComparison = ({ results, category }) => {
    const data = [
      {
        name: "1-year Budget",
        value: parseFloat(results.optimalIncentives[0]),
        costPerTon: incentiveRatesPerMT[0]
      },
      {
        name: "Mid-term Value",
        value: parseFloat(results.optimalIncentives[1]),
        costPerTon: incentiveRatesPerMT[1]
      },
      {
        name: "Lifecycle Value",
        value: parseFloat(results.optimalIncentives[2]),
        costPerTon: incentiveRatesPerMT[2]
      }
    ];
    
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Incentive Timeline Analysis</h3>
        <p className="text-sm text-gray-600 mb-4">
          Different timeline perspectives affect the perceived value of carbon reduction.
        </p>
        
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" label={{ value: 'Incentive Amount ($)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Cost per MTCO2e ($)', angle: 90, position: 'insideRight' }} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'value' ? formatCurrency(value) : `$${value}`,
                  name === 'value' ? 'Incentive Amount' : 'Cost per MTCO2e'
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="value" name="Incentive Amount" fill="#2563EB" />
              <Bar yAxisId="right" dataKey="costPerTon" name="Cost per MTCO2e" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium mb-1">Annual Budget</h4>
            <p className="text-xs text-gray-600 mb-2">
              Focuses on first-year carbon reduction, useful for annual budget planning
            </p>
            <div className="flex justify-between">
              <span>Value per MTCO2e:</span>
              <span className="font-medium">${incentiveRatesPerMT[0]}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium mb-1">Payback Period</h4>
            <p className="text-xs text-gray-600 mb-2">
              Matches expected customer payback timeframe (typically 5-7 years)
            </p>
            <div className="flex justify-between">
              <span>Value per MTCO2e:</span>
              <span className="font-medium">${incentiveRatesPerMT[1]}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium mb-1">Equipment Lifespan</h4>
            <p className="text-xs text-gray-600 mb-2">
              Accounts for total lifetime carbon reduction from the investment
            </p>
            <div className="flex justify-between">
              <span>Value per MTCO2e:</span>
              <span className="font-medium">${incentiveRatesPerMT[2]}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Combined analysis component
  const CombinedAnalysis = () => {
    const { spaceHeating, waterHeating, combined } = results;
    
    return (
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Combined Package Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Total Impact</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Combined Annual Emissions Reduction</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(combined.netEmissionsReduction)} MTCO2e
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Combined Annual Cost Savings</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(spaceHeating.annualSavings + waterHeating.annualSavings)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Lifecycle Emissions Reduction</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(combined.lifetimeEmissionsReduction)} MTCO2e
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-sm text-gray-600">Bundle Discount (Additional)</div>
                <div className="text-xl font-bold text-blue-600">
                  {formatCurrency(combined.bundleDiscount)}
                </div>
                <div className="text-xs text-gray-500">
                  {inputs.bundleDiscount}% off when installing both systems together
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Bundle Discount</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={1}
                  value={inputs.bundleDiscount}
                  onChange={(e) => handleBundleDiscountChange(e.target.value)}
                  className="flex-grow"
                />
                <div className="flex items-center">
                  <input
                    type="number"
                    value={inputs.bundleDiscount}
                    onChange={(e) => handleBundleDiscountChange(e.target.value)}
                    className="w-20 p-1 border rounded text-sm"
                  />
                  <span className="ml-1 text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Combined Package Incentives</h3>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">Space Heating Incentive</div>
                <div className="text-green-600 font-medium">{formatCurrency(inputs.spaceHeating.currentIncentive)}</div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">Water Heating Incentive</div>
                <div className="text-green-600 font-medium">{formatCurrency(inputs.waterHeating.currentIncentive)}</div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">Bundle Discount</div>
                <div className="text-blue-600 font-medium">{formatCurrency(combined.bundleDiscount)}</div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm font-bold">Total Package Incentive</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(combined.totalIncentive)}</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-3">Financial Analysis</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>Combined Payback Period:</span>
                  <span className="font-medium">{formatNumber(combined.paybackPeriod, 1)} years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cost per MTCO2e Reduced:</span>
                  <span className="font-medium">${formatNumber(combined.costPerMTCO2e, 2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cost per Lifetime MTCO2e:</span>
                  <span className="font-medium">${formatNumber(combined.totalIncentive / combined.lifetimeEmissionsReduction, 2)}</span>
                </div>
                <div className="pt-2 text-xs text-gray-600">
                  <p>Combined installations offer improved economics through shared installation costs and bundle incentives, maximizing climate impact with optimized investment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Program comparison component
  const ProgramComparison = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Technology Comparison</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Annual Carbon Reduction</h4>
            <TechnologyComparisonChart 
              data={results.comparisonData} 
              dataKey="annualReduction" 
              name="MTCO2e Per Year"
            />
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">Cost per MTCO2e Reduced</h4>
            <TechnologyComparisonChart 
              data={results.comparisonData} 
              dataKey="costPerTon" 
              name="$ Per MTCO2e"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Incentive Distribution</h4>
            <IncentiveDistributionChart data={results.comparisonData} />
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">Payback Period (Years)</h4>
            <TechnologyComparisonChart 
              data={results.comparisonData} 
              dataKey="payback" 
              name="Years"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium text-sm mb-2">References for Comparison</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <h5 className="font-medium text-sm">Base Incentive Calculations</h5>
              <p className="text-xs text-gray-600 mt-1">
                The baseline used for carbon valuation is $367.50 per MTCO2e reduced annually, 
                derived from the city's EV incentive of $1,000 which yields a 2.72 MTCO2e reduction per year.
              </p>
              <p className="text-xs text-gray-600 mt-1">
                This standard helps create consistency across different climate programs and
                technologies while allowing for timeline flexibility.
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h5 className="font-medium text-sm">Timeline Considerations</h5>
              <p className="text-xs text-gray-600 mt-1">
                The calculator presents three timeline options for incentive design:
              </p>
              <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                <li>1-year Budget Period: Focuses on immediate carbon reduction</li>
                <li>Mid-term Value: Aligns with payback periods (5-7 years)</li>
                <li>Lifecycle Value: Accounts for full equipment lifespan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Final report for program administrators
  const ProgramReport = () => {
    return (
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">Program Administrator Summary</h2>
        <p className="text-sm text-gray-600 mb-4">
          This report summarizes key metrics for climate program decision-making.
        </p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technology
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Annual MTCO2e
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lifecycle MTCO2e
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Incentive
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  $/MTCO2e (Annual)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  $/MTCO2e (Lifecycle)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended Incentive
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.comparisonData.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(item.annualReduction)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(item.lifetimeReduction)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(item.incentiveCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatNumber(item.costPerTon)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatNumber(item.lifetimeCostPerTon)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index < 2 ? formatCurrency(parseFloat(results[index === 0 ? 'spaceHeating' : 'waterHeating'].optimalIncentives[1])) : '-'}
                  </td>
                </tr>
              ))}
              <tr className="bg-green-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Combined Package
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatNumber(results.combined.netEmissionsReduction)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatNumber(results.combined.lifetimeEmissionsReduction)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(results.combined.totalIncentive)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${formatNumber(results.combined.costPerMTCO2e)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${formatNumber(results.combined.totalIncentive / results.combined.lifetimeEmissionsReduction)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  {formatCurrency(results.combined.totalIncentive)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Key Findings</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Heat pump space heating provides the largest carbon reduction per unit</li>
              <li>Combined package offers the best overall value for climate impact</li>
              <li>Bundle discount of {inputs.bundleDiscount}% increases adoption potential</li>
              <li>Annual emissions reduction from package: {formatNumber(results.combined.netEmissionsReduction)} MTCO2e</li>
            </ul>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Recommendations</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Standardize on ${incentiveRatesPerMT[1]}/MTCO2e for program design</li>
              <li>Implement bundle incentives to maximize adoption</li>
              <li>Focus marketing on combined financial and environmental benefits</li>
              <li>Track actual performance to validate emission reduction estimates</li>
              <li>Consider targeted higher incentives for low-income households</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl p-4 mx-auto">
      <h1 className="text-2xl font-bold mb-4">Carbon Reduction Incentives Calculator</h1>
      <p className="text-gray-600 mb-6">
        Compare incentives for heat pumps and water heaters based on carbon reduction metrics and timeline considerations.
      </p>
      
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 rounded ${inputs.viewMode === 'consumer' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => handleViewModeChange('consumer')}
          >
            Homeowner View
          </button>
          <button 
            className={`px-4 py-2 rounded ${inputs.viewMode === 'program' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => handleViewModeChange('program')}
          >
            Program Administrator View
          </button>
        </div>
      </div>
      
      <Tabs defaultValue="spaceHeating" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="spaceHeating">Space Heating</TabsTrigger>
          <TabsTrigger value="waterHeating">Water Heating</TabsTrigger>
          <TabsTrigger value="combined">Combined Package</TabsTrigger>
          <TabsTrigger value="comparison">Program Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="spaceHeating">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TechnologyInputs category="spaceHeating" params={inputs.spaceHeating} />
            
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Cost Comparison</h3>
                <CostComparisonChart data={results.spaceHeating.yearByYearData} />
              </div>
              
              <ResultsSummary results={results.spaceHeating} category="spaceHeating" />
            </div>
          </div>
          
          <div className="mt-6">
            <TimelineComparison results={results.spaceHeating} category="spaceHeating" />
          </div>
          
          <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Emissions Reduction</h3>
            <EmissionsComparisonChart data={results.spaceHeating.yearByYearData} />
          </div>
        </TabsContent>
        
        <TabsContent value="waterHeating">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TechnologyInputs category="waterHeating" params={inputs.waterHeating} />
            
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Cost Comparison</h3>
                <CostComparisonChart data={results.waterHeating.yearByYearData} />
              </div>
              
              <ResultsSummary results={results.waterHeating} category="waterHeating" />
            </div>
          </div>
          
          <div className="mt-6">
            <TimelineComparison results={results.waterHeating} category="waterHeating" />
          </div>
          
          <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Emissions Reduction</h3>
            <EmissionsComparisonChart data={results.waterHeating.yearByYearData} />
          </div>
        </TabsContent>
        
        <TabsContent value="combined">
          <CombinedAnalysis />
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Combined Emissions Impact</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Annual',
                        spaceHeating: results.spaceHeating.netEmissionsReduction,
                        waterHeating: results.waterHeating.netEmissionsReduction,
                        total: results.combined.netEmissionsReduction
                      },
                      {
                        name: 'Lifetime',
                        spaceHeating: results.spaceHeating.lifetimeEmissionsReduction,
                        waterHeating: results.waterHeating.lifetimeEmissionsReduction,
                        total: results.combined.lifetimeEmissionsReduction
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'MTCO2e Reduced', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => `${formatNumber(value)} MTCO2e`} />
                    <Legend />
                    <Bar dataKey="spaceHeating" name="Space Heating" stackId="a" fill="#2563EB" />
                    <Bar dataKey="waterHeating" name="Water Heating" stackId="a" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Incentive Efficiency</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Per MTCO2e',
                        spaceHeating: inputs.spaceHeating.currentIncentive / results.spaceHeating.netEmissionsReduction,
                        waterHeating: inputs.waterHeating.currentIncentive / results.waterHeating.netEmissionsReduction,
                        combined: results.combined.totalIncentive / results.combined.netEmissionsReduction
                      },
                      {
                        name: 'Per Lifetime MTCO2e',
                        spaceHeating: inputs.spaceHeating.currentIncentive / results.spaceHeating.lifetimeEmissionsReduction,
                        waterHeating: inputs.waterHeating.currentIncentive / results.waterHeating.lifetimeEmissionsReduction,
                        combined: results.combined.totalIncentive / results.combined.lifetimeEmissionsReduction
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: '$ per MTCO2e', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => `$${formatNumber(value, 2)}`} />
                    <Legend />
                    <Bar dataKey="spaceHeating" name="Space Heating" fill="#2563EB" />
                    <Bar dataKey="waterHeating" name="Water Heating" fill="#10B981" />
                    <Bar dataKey="combined" name="Combined Package" fill="#F97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="comparison">
          <ProgramComparison />
          
          {inputs.viewMode === 'program' && <ProgramReport />}
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
        <h3 className="font-medium mb-2">About This Calculator</h3>
        <p className="mb-2">
          This tool was developed to assist the City of Ashland in optimizing incentives for carbon reduction technologies.
          It applies a standardized approach to valuing carbon reduction, using the current EV incentive as a baseline.
        </p>
        <p>
          The calculator addresses the key question of timeline considerations, offering three perspectives:
          annual budget (1-year), payback period (5-7 years), and equipment lifespan (10-15+ years).
        </p>
        <div className="mt-2 text-xs">
          <p>Key assumptions:</p>
          <ul className="list-disc list-inside">
            <li>Electricity emissions factor: {formatNumber(electricityEmissionsFactor * 1000000, 6)} MTCO2e/kWh (Ashland Electric 10-year avg)</li>
            <li>Natural gas emissions factor: {formatNumber(gasEmissionsFactor, 3)} MTCO2e/therm</li>
            <li>Base carbon value: ${incentiveRatesPerMT[0]} per MTCO2e reduced annually</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CarbonIncentivesCalculator;