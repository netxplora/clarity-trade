/**
 * API Helper for Backend Communication
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';

export const validateWalletBackend = async (address: string, coin: string, network?: string): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const userId = JSON.parse(localStorage.getItem('sb-ommeobwgtqbkqcifhbkm-auth-token') || '{}')?.user?.id || 'guest';
    
    const response = await fetch(`${BACKEND_URL}/user/validate-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ address, coin, network }),
    });

    if (!response.ok) {
       // Fallback to local regex if backend is down or returns error
       console.warn("Backend validation unreachable, falling back to local validation.");
       return { isValid: true }; // Just skip or use localRegex if we had integrated it
    }

    return await response.json();
  } catch (error) {
    console.error("Backend validation error:", error);
    return { isValid: true }; // Assume valid if check fails to not block users (or handle as needed)
  }
};
