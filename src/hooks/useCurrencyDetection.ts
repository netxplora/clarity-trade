import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

export const useCurrencyDetection = () => {
    const { user, setCurrency, setExchangeRates, displayCurrency } = useStore();

    useEffect(() => {
        const detectAndFetch = async () => {
            // 1. Fetch Exchange Rates - Using store defaults or optional public API
            // (Localhost 5001 removed for stability)
            setExchangeRates({ USD: 1, EUR: 0.92, GBP: 0.79 });

            // 2. Detect Location if no preference
            const hasSetPreference = localStorage.getItem('currency_preference_set');
            
            if (!hasSetPreference || !user?.preferred_currency) {
                try {
                    const geoResp = await fetch('https://ipwho.is/');
                    const geoData = await geoResp.json();
                    
                    let detected = 'USD';
                    if (geoData.country_code === 'GB') detected = 'GBP';
                    else if (['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'RO'].includes(geoData.country_code)) detected = 'EUR';

                    if (detected !== displayCurrency) {
                        setCurrency(detected, false); // Don't persist to DB yet, just session
                        toast.info(`We've set your currency to ${detected} based on your location`, {
                            action: {
                                label: 'Change',
                                onClick: () => {
                                    // Trigger selector or settings
                                }
                            }
                        });
                    }
                    localStorage.setItem('currency_preference_set', 'true');
                } catch (err) {
                    if (!displayCurrency) setCurrency('USD', false);
                }
            } else if (user?.preferred_currency) {
                setCurrency(user.preferred_currency, false);
            }
        };

        detectAndFetch();
    }, [user?.id]);
};
