-- Add CHECK constraints for numeric validation on amounts
ALTER TABLE transactions ADD CONSTRAINT positive_amount CHECK (amount > 0 AND amount < 1000000000);
ALTER TABLE budgets ADD CONSTRAINT positive_planned_amount CHECK (planned_amount > 0 AND planned_amount < 1000000000);
ALTER TABLE recurring_transactions ADD CONSTRAINT positive_recurring_amount CHECK (amount > 0 AND amount < 1000000000);

-- Add CHECK constraints for date validation
ALTER TABLE budgets ADD CONSTRAINT valid_budget_period CHECK (period_start < period_end);
ALTER TABLE recurring_transactions ADD CONSTRAINT valid_recurring_period CHECK (end_date IS NULL OR start_date < end_date);
ALTER TABLE transactions ADD CONSTRAINT reasonable_transaction_date CHECK (date >= '2000-01-01' AND date <= CURRENT_DATE + INTERVAL '1 year');