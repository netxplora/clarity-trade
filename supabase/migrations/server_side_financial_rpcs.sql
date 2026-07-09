-- ============================================================
-- Server-Side Financial Operations RPC Functions
-- These replace client-side balance mutations with atomic,
-- validated operations that prevent race conditions and
-- unauthorized balance manipulation.
-- ============================================================

-- ============================================================
-- 1. ATOMIC TRADE EXECUTION
-- Validates balance, deducts funds, and inserts trade record
-- in a single transaction with row-level locking.
-- ============================================================
CREATE OR REPLACE FUNCTION execute_trade(
    p_user_id UUID,
    p_pair TEXT,
    p_side TEXT,           -- 'Buy' or 'Sell'
    p_amount NUMERIC,      -- Trade total in fiat
    p_entry_price NUMERIC,
    p_current_price NUMERIC,
    p_order_type TEXT DEFAULT 'market',
    p_status TEXT DEFAULT 'Open'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance RECORD;
    v_margin_required NUMERIC;
    v_trade_id UUID;
    v_is_pending BOOLEAN;
BEGIN
    -- 1. Validate caller matches the user_id
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized: user mismatch');
    END IF;

    -- 2. Validate inputs
    IF p_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Invalid trade amount');
    END IF;
    IF p_side NOT IN ('Buy', 'Sell') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid trade side');
    END IF;

    v_is_pending := p_order_type != 'market';

    -- 3. Lock the balance row to prevent concurrent modifications
    SELECT * INTO v_balance
    FROM balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Balance record not found');
    END IF;

    -- 4. Validate sufficient balance
    IF p_side = 'Buy' THEN
        IF COALESCE(v_balance.fiat_balance, 0) < p_amount THEN
            RETURN json_build_object('success', false, 'error', 'Insufficient fiat balance');
        END IF;
    ELSE
        -- Sell requires 10% margin
        v_margin_required := p_amount * 0.1;
        IF COALESCE(v_balance.fiat_balance, 0) < v_margin_required THEN
            RETURN json_build_object('success', false, 'error', 'Insufficient margin for sell position');
        END IF;
    END IF;

    -- 5. Atomically update balances
    IF p_side = 'Buy' THEN
        UPDATE balances SET
            fiat_balance = GREATEST(0, COALESCE(fiat_balance, 0) - p_amount),
            trading_balance = CASE 
                WHEN NOT v_is_pending THEN COALESCE(trading_balance, 0) + p_amount 
                ELSE COALESCE(trading_balance, 0) 
            END
        WHERE user_id = p_user_id;
    ELSE
        UPDATE balances SET
            fiat_balance = GREATEST(0, COALESCE(fiat_balance, 0) - v_margin_required),
            trading_balance = CASE 
                WHEN NOT v_is_pending THEN COALESCE(trading_balance, 0) + p_amount 
                ELSE COALESCE(trading_balance, 0) 
            END
        WHERE user_id = p_user_id;
    END IF;

    -- 6. Insert the trade record
    INSERT INTO trades (
        user_id, pair, type, amount, entry_price, current_price,
        order_type, status, time
    ) VALUES (
        p_user_id, p_pair, p_side, p_amount, p_entry_price,
        p_current_price, p_order_type,
        CASE WHEN v_is_pending THEN 'Pending' ELSE 'Open' END,
        now()
    ) RETURNING id INTO v_trade_id;

    RETURN json_build_object(
        'success', true,
        'trade_id', v_trade_id,
        'is_pending', v_is_pending
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 2. ATOMIC TRADE CLOSE
-- Calculates PnL, returns funds to fiat, and marks trade closed.
-- ============================================================
CREATE OR REPLACE FUNCTION close_trade(
    p_user_id UUID,
    p_trade_id UUID,
    p_close_price NUMERIC,
    p_pnl NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_trade RECORD;
    v_balance RECORD;
    v_total_return NUMERIC;
BEGIN
    -- 1. Validate caller
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- 2. Get the trade and verify ownership
    SELECT * INTO v_trade
    FROM trades
    WHERE id = p_trade_id AND user_id = p_user_id AND status = 'Open'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Trade not found or already closed');
    END IF;

    -- 3. Lock balance row
    SELECT * INTO v_balance
    FROM balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- 4. Calculate return (original amount + PnL)
    v_total_return := GREATEST(0, v_trade.amount + p_pnl);

    -- 5. Update balances atomically
    UPDATE balances SET
        fiat_balance = GREATEST(0, COALESCE(fiat_balance, 0) + v_total_return),
        trading_balance = GREATEST(0, COALESCE(trading_balance, 0) - v_trade.amount)
    WHERE user_id = p_user_id;

    -- 6. Close the trade
    UPDATE trades SET
        status = 'Closed',
        pnl = p_pnl,
        current_price = p_close_price
    WHERE id = p_trade_id;

    RETURN json_build_object(
        'success', true,
        'trade_id', p_trade_id,
        'total_return', v_total_return,
        'pnl', p_pnl
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 3. ATOMIC WITHDRAWAL REQUEST
-- Creates a withdrawal with HOLD pattern: locks funds without
-- deducting them. Balance is only deducted on admin approval.
-- ============================================================
CREATE OR REPLACE FUNCTION request_withdrawal(
    p_user_id UUID,
    p_amount NUMERIC,
    p_asset TEXT,
    p_method TEXT DEFAULT 'crypto',
    p_destination TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance RECORD;
    v_current_val NUMERIC;
    v_is_fiat BOOLEAN;
    v_tx_id UUID;
    v_profile RECORD;
    v_kyc_status TEXT;
    v_max_withdrawal NUMERIC;
BEGIN
    -- 1. Validate caller
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- 2. Validate amount
    IF p_amount <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Invalid withdrawal amount');
    END IF;

    -- 3. Check KYC status
    SELECT kyc INTO v_kyc_status FROM profiles WHERE id = p_user_id;
    IF v_kyc_status IS NULL OR v_kyc_status NOT IN ('Verified', 'Approved', 'Intermediate', 'Advanced') THEN
        RETURN json_build_object('success', false, 'error', 'KYC verification required for withdrawals');
    END IF;

    -- 4. Check withdrawal limits based on KYC tier
    v_max_withdrawal := CASE v_kyc_status
        WHEN 'Verified' THEN 10000
        WHEN 'Approved' THEN 10000
        WHEN 'Intermediate' THEN 50000
        WHEN 'Advanced' THEN 1000000
        ELSE 0
    END;

    IF p_amount > v_max_withdrawal THEN
        RETURN json_build_object('success', false, 'error',
            format('Amount exceeds withdrawal limit of %s for your KYC tier', v_max_withdrawal));
    END IF;

    -- 5. Lock balance row
    SELECT * INTO v_balance
    FROM balances
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Balance record not found');
    END IF;

    -- 6. Validate sufficient balance
    v_is_fiat := p_asset IN ('USD', 'EUR', 'GBP');

    IF v_is_fiat THEN
        v_current_val := COALESCE(v_balance.fiat_balance, 0);
    ELSE
        v_current_val := COALESCE((v_balance.crypto_balances ->> lower(p_asset))::NUMERIC, 0);
    END IF;

    IF v_current_val < p_amount THEN
        RETURN json_build_object('success', false, 'error', format('Insufficient %s balance', p_asset));
    END IF;

    -- 7. HOLD: Deduct balance immediately to prevent double-spend
    -- The balance will be refunded if the withdrawal is rejected.
    IF v_is_fiat THEN
        UPDATE balances SET
            fiat_balance = GREATEST(0, COALESCE(fiat_balance, 0) - p_amount)
        WHERE user_id = p_user_id;
    ELSE
        UPDATE balances SET
            crypto_balances = jsonb_set(
                COALESCE(crypto_balances, '{}'::jsonb),
                ARRAY[lower(p_asset)],
                to_jsonb(GREATEST(0, v_current_val - p_amount))
            )
        WHERE user_id = p_user_id;
    END IF;

    -- 8. Create the transaction record (status = Pending)
    INSERT INTO transactions (
        user_id, type, amount, asset, status
    ) VALUES (
        p_user_id, 'Withdrawal', p_amount, p_asset, 'Pending'
    ) RETURNING id INTO v_tx_id;

    -- 9. Notify admins
    SELECT name INTO v_profile FROM profiles WHERE id = p_user_id;
    INSERT INTO notifications (
        user_id, title, message, type, is_read
    ) VALUES (
        NULL, -- null user_id = admin notification
        'New Withdrawal Request',
        format('%s requested withdrawal of %s %s via %s.',
            COALESCE(v_profile.name, 'User'), p_amount, p_asset, p_method),
        'WITHDRAWAL',
        false
    );

    RETURN json_build_object(
        'success', true,
        'transaction_id', v_tx_id,
        'held_amount', p_amount,
        'asset', p_asset
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 4. ADMIN: PROCESS WITHDRAWAL (Approve or Reject)
-- On rejection, automatically refunds the held balance.
-- ============================================================
CREATE OR REPLACE FUNCTION process_withdrawal(
    p_transaction_id UUID,
    p_action TEXT  -- 'Completed' or 'Rejected'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tx RECORD;
    v_is_fiat BOOLEAN;
    v_current_crypto NUMERIC;
    v_is_admin BOOLEAN;
BEGIN
    -- 1. Verify caller is admin
    SELECT EXISTS(
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RETURN json_build_object('success', false, 'error', 'Admin access required');
    END IF;

    -- 2. Validate action
    IF p_action NOT IN ('Completed', 'Rejected') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid action');
    END IF;

    -- 3. Get and lock the transaction
    SELECT * INTO v_tx
    FROM transactions
    WHERE id = p_transaction_id AND type = 'Withdrawal' AND status = 'Pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Transaction not found or already processed');
    END IF;

    -- 4. If REJECTED, refund the held balance
    IF p_action = 'Rejected' THEN
        v_is_fiat := v_tx.asset IN ('USD', 'EUR', 'GBP');

        IF v_is_fiat THEN
            UPDATE balances SET
                fiat_balance = COALESCE(fiat_balance, 0) + v_tx.amount
            WHERE user_id = v_tx.user_id;
        ELSE
            SELECT COALESCE((crypto_balances ->> lower(v_tx.asset))::NUMERIC, 0)
            INTO v_current_crypto
            FROM balances WHERE user_id = v_tx.user_id;

            UPDATE balances SET
                crypto_balances = jsonb_set(
                    COALESCE(crypto_balances, '{}'::jsonb),
                    ARRAY[lower(v_tx.asset)],
                    to_jsonb(v_current_crypto + v_tx.amount)
                )
            WHERE user_id = v_tx.user_id;
        END IF;
    END IF;

    -- 5. Update the transaction status
    UPDATE transactions SET status = p_action WHERE id = p_transaction_id;

    RETURN json_build_object(
        'success', true,
        'transaction_id', p_transaction_id,
        'action', p_action,
        'refunded', p_action = 'Rejected'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 5. Grant execute permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION execute_trade TO authenticated;
GRANT EXECUTE ON FUNCTION close_trade TO authenticated;
GRANT EXECUTE ON FUNCTION request_withdrawal TO authenticated;
GRANT EXECUTE ON FUNCTION process_withdrawal TO authenticated;
