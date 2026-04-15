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
       // Reject validation when backend is unreachable — do not auto-approve
       return { isValid: false, error: 'Validation service temporarily unavailable. Please try again.' };
    }

    return await response.json();
  } catch (error) {
    return { isValid: false, error: 'Unable to verify wallet address. Please try again.' };
  }
};
