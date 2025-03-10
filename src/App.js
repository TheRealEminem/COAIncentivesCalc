import React from 'react';
import CarbonIncentivesCalculator from './components/CarbonIncentivesCalculator';
import './App.css';

const App = () => {
  return (
    <div className="container">
      <header className="py-6">
        <h1 className="text-3xl font-bold">Carbon Reduction Incentives Calculator</h1>
        <p className="text-gray-600">
          Compare incentives for heat pumps and water heaters based on carbon reduction metrics.
        </p>
      </header>
      <main>
        <CarbonIncentivesCalculator />
      </main>
      <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Carbon Reduction Incentives Calculator</p>
        <p className="mt-1">
          <a href="https://github.com/[your-github-username]/COAIncentivesCalc" className="text-blue-600 hover:underline">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
};

export default App;