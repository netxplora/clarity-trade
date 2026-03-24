import { useEffect, useRef, memo } from "react";
import { useTheme } from "./ThemeProvider";

interface TradingViewWidgetProps {
  symbol?: string;
  interval?: string;
}

const TradingViewWidget = memo(({ symbol = "BINANCE:BTCUSDT", interval = "60" }: TradingViewWidgetProps) => {
  const container = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(255, 255, 255, 0)",
      gridColor: "rgba(0, 0, 0, 0.06)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
      support_host: "https://www.tradingview.com",
    });

    container.current.appendChild(script);
  }, [symbol, interval, theme]);

  return (
    <div className="tradingview-widget-container h-[500px] w-full" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full" />
    </div>
  );
});

TradingViewWidget.displayName = "TradingViewWidget";

export default TradingViewWidget;
