# Carbon Reduction Incentives Calculator

A comprehensive web tool for analyzing and comparing carbon reduction incentives for heat pumps and water heaters. This calculator helps homeowners and program administrators make informed decisions about clean energy investments.

## Features

- Compare gas heating systems to heat pump alternatives
- Calculate carbon emissions reduction for space heating and water heating
- Analyze financial impacts including payback periods and lifecycle costs
- View comprehensive visualizations of cost and emissions savings
- Compare different incentive approaches based on timeline considerations
- See combined package analysis with bundle discounts
- Toggle between homeowner and program administrator views

## Key Metrics Calculated

- Annual and lifetime carbon emissions reduction
- Operating cost savings
- Simple payback period
- Net present value
- Optimal incentives based on carbon value
- Cost per metric ton of CO2e reduced

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/[your-github-username]/IncentivesCalc.git
   cd IncentivesCalc
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

### Deployment

To deploy to GitHub Pages:

```
npm run deploy
```

## About

This tool was developed to assist the City of Ashland in optimizing incentives for carbon reduction technologies. It applies a standardized approach to valuing carbon reduction, using the current EV incentive as a baseline.

The calculator addresses key timeline considerations, offering three perspectives:
- Annual budget (1-year)
- Payback period (5-7 years)
- Equipment lifespan (10-15+ years)

## Key Assumptions

- Electricity emissions factor: 0.000015742 MTCO2e/kWh (Ashland Electric 10-year avg)
- Natural gas emissions factor: 0.005 MTCO2e/therm
- Base carbon value: $367.50 per MTCO2e reduced annually