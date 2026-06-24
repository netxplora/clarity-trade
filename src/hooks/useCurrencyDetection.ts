import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

export const useCurrencyDetection = () => {
    const { user, setCurrency, setExchangeRates, displayCurrency } = useStore();

    useEffect(() => {
        const detectAndFetch = async () => {
            setExchangeRates({ USD: 1, EUR: 0.92, GBP: 0.79 });

            const hasSetPreference = localStorage.getItem('currency_preference_set');
            
            if (!hasSetPreference || !user?.preferred_currency) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                    const geoResp = await fetch('https://ipwho.is/', { signal: controller.signal });
                    clearTimeout(timeoutId);
                    
                    if (!geoResp.ok) throw new Error('Currency API failed');
                    
                    const geoData = await geoResp.json();
                    
                    let detected = 'USD';
                    if (geoData.country_code === 'GB') detected = 'GBP';
                    else if (['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'RO'].includes(geoData.country_code)) detected = 'EUR';

                    if (detected !== displayCurrency) {
                        setCurrency(detected, false);
                        toast.info(`Currency set to ${detected} based on location`);
                    }
                    localStorage.setItem('currency_preference_set', 'true');
                } catch (err) {
                    console.warn("[Currency] Detection failed or timed out, falling back to USD");
                    if (!displayCurrency) setCurrency('USD', false);
                }
            } else if (user?.preferred_currency) {
                setCurrency(user.preferred_currency, false);
            }
        };

        detectAndFetch();
    }, [user?.id]);
};
