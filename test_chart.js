import { createChart } from 'lightweight-charts';
const div = document.createElement('div');
const chart = createChart(div);
console.log("CHART METHODS:", Object.keys(chart));
