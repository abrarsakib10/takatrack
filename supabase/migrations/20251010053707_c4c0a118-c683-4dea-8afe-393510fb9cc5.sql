-- Create categories table for user-customizable categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type transaction_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own categories"
ON public.categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
ON public.categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
ON public.categories FOR DELETE
USING (auth.uid() = user_id);

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default outflow categories
  INSERT INTO public.categories (user_id, name, type) VALUES
    (NEW.id, 'Transportation', 'outflow'),
    (NEW.id, 'Food', 'outflow'),
    (NEW.id, 'Medical', 'outflow'),
    (NEW.id, 'Home', 'outflow'),
    (NEW.id, 'Personal', 'outflow'),
    (NEW.id, 'Debt', 'outflow'),
    (NEW.id, 'Gifts', 'outflow'),
    (NEW.id, 'Others', 'outflow');
  
  -- Insert default inflow categories
  INSERT INTO public.categories (user_id, name, type) VALUES
    (NEW.id, 'Savings', 'inflow'),
    (NEW.id, 'Paycheck', 'inflow'),
    (NEW.id, 'Bonus', 'inflow'),
    (NEW.id, 'Interest', 'inflow'),
    (NEW.id, 'Other', 'inflow');
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create default categories when profile is created
CREATE TRIGGER on_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_categories();