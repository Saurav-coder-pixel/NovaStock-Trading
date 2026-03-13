import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { Candle } from '../../types';

interface LightweightChartProps {
  data: Candle[];
  symbol: string;
}

const LightweightChart: React.FC<LightweightChartProps> = ({ data, symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    if (chartContainerRef.current.clientWidth === 0 || chartContainerRef.current.clientHeight === 0) {
       const observer = new ResizeObserver(() => {
          if (chartContainerRef.current && chartContainerRef.current.clientHeight > 0) {
             setIsReady(true);
             observer.disconnect();
          }
       });
       observer.observe(chartContainerRef.current);
       return () => observer.disconnect();
    } else {
       if (!isReady) setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current || !isReady) return;

    let chart: IChartApi | null = null;

    try {
      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0A0B0E' },
          textColor: '#64748b',
          fontFamily: "'JetBrains Mono', monospace",
        },
        grid: {
          vertLines: { color: '#1E293B', style: 1 },
          horzLines: { color: '#1E293B', style: 1 },
        },
        crosshair: {
          mode: 0, 
          vertLine: { color: '#475569', labelBackgroundColor: '#1E293B' },
          horzLine: { color: '#475569', labelBackgroundColor: '#1E293B' },
        },
        rightPriceScale: {
          borderColor: '#1E293B',
        },
        timeScale: {
          borderColor: '#1E293B',
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        autoSize: true,
      });

      chartRef.current = chart;

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00D084',
        downColor: '#FF3B5C',
        borderVisible: false,
        wickUpColor: '#00D084',
        wickDownColor: '#FF3B5C',
      });
      candleSeriesRef.current = candleSeries;

      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '', 
      });
      
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;

      const uniqueTimes = new Set<number>();
      
      const cleanData = data
        .map(d => ({
           ...d, 
           timeSec: Math.floor(new Date(d.time).getTime() / 1000)
        }))
        .filter(d => !isNaN(d.timeSec))
        .sort((a,b) => a.timeSec - b.timeSec)
        .filter(d => {
           if (uniqueTimes.has(d.timeSec)) return false;
           uniqueTimes.add(d.timeSec);
           return true;
        });

      const formattedCandles = cleanData.map(d => ({
         time: d.timeSec as any,
         open: Number(d.open) || 0,
         high: Number(d.high) || 0,
         low: Number(d.low) || 0,
         close: Number(d.close) || 0
      }));

      const formattedVolume = cleanData.map(d => ({
         time: d.timeSec as any,
         value: Number(d.volume) || 0,
         color: d.close >= d.open ? 'rgba(0, 208, 132, 0.4)' : 'rgba(255, 59, 92, 0.4)'
      }));

      console.log(`[CHART DEBUG] Container: ${chartContainerRef.current.clientWidth}x${chartContainerRef.current.clientHeight}, Data: ${data.length}, Clean: ${cleanData.length}, Candles: ${formattedCandles.length}`);

      if (formattedCandles.length > 0) {
        candleSeries.setData(formattedCandles);
        volumeSeries.setData(formattedVolume as any);
        chart.timeScale().fitContent();

        // Tooltip logic
        chart.subscribeCrosshairMove((param) => {
          if (
            param.point === undefined ||
            !param.time ||
            param.point.x < 0 ||
            param.point.x > chartContainerRef.current!.clientWidth ||
            param.point.y < 0 ||
            param.point.y > chartContainerRef.current!.clientHeight
          ) {
            if (tooltipRef.current) tooltipRef.current.style.display = 'none';
            return;
          }

          const cData = param.seriesData.get(candleSeries) as any;
          const vData = param.seriesData.get(volumeSeries) as any;

          if (cData && tooltipRef.current) {
            tooltipRef.current.style.display = 'block';
            tooltipRef.current.style.left = param.point.x + 'px';
            tooltipRef.current.style.top = param.point.y + 'px';

            const timeStr = new Date((param.time as number) * 1000).toLocaleString();
            const colorClass = cData.close >= cData.open ? 'text-success' : 'text-danger';

            tooltipRef.current.innerHTML = `
              <div class="text-[10px] font-mono whitespace-nowrap">
                <div class="text-slate-400 mb-1 border-b border-[#1E293B] pb-1">${timeStr}</div>
                <div class="flex justify-between gap-4"><span class="text-slate-500">O</span><span class="text-slate-200">${cData.open.toFixed(2)}</span></div>
                <div class="flex justify-between gap-4"><span class="text-slate-500">H</span><span class="text-slate-200">${cData.high.toFixed(2)}</span></div>
                <div class="flex justify-between gap-4"><span class="text-slate-500">L</span><span class="text-slate-200">${cData.low.toFixed(2)}</span></div>
                <div class="flex justify-between gap-4"><span class="text-slate-500">C</span><span class="font-bold ${colorClass}">${cData.close.toFixed(2)}</span></div>
                <div class="flex justify-between gap-4 mt-1 pt-1 border-t border-[#1E293B]"><span class="text-slate-500">Vol</span><span class="text-indigo-400">${vData ? Number(vData.value).toLocaleString() : 'N/A'}</span></div>
              </div>
            `;
          } else if (tooltipRef.current) {
            tooltipRef.current.style.display = 'none';
          }
        });
      }
    } catch (err) {
      console.error("Fatal error during LightweightChart initialization/rendering:", err);
    }

    return () => {
      if (chart) {
        try { chart.remove(); } catch (e) {}
      }
    };
  }, [data, isReady]);

  return (
    <div className="w-full h-full relative" ref={chartContainerRef}>
      <div className="absolute top-4 left-4 z-10 pointer-events-none opacity-50 flex items-center gap-3">
         <span className="text-2xl font-bold font-sans text-white/20 tracking-tighter">{symbol}</span>
         <span className="text-xs font-mono text-white/10 px-2 py-0.5 border border-white/10 rounded">LIVE</span>
      </div>
      <div 
        ref={tooltipRef}
        className="absolute z-50 bg-[#111318] border border-[#1E293B] p-2 rounded shadow-2xl pointer-events-none transition-opacity duration-75"
        style={{ display: 'none', transform: 'translate(15px, 15px)' }}
      />
    </div>
  );
};

export default LightweightChart;
