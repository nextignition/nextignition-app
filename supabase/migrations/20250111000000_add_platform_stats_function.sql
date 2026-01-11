-- Create a function to get platform statistics
-- This function can be called by unauthenticated users for the login page

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  investor_count bigint;
  founder_count bigint;
  capital_raised numeric;
  result json;
BEGIN
  -- Count active investors
  SELECT COUNT(*) INTO investor_count
  FROM public.profiles
  WHERE role = 'investor';
  
  -- Count founders and co-founders
  SELECT COUNT(*) INTO founder_count
  FROM public.profiles
  WHERE role IN ('founder', 'cofounder');
  
  -- Calculate total capital raised from confirmed/paid commitments
  SELECT COALESCE(SUM(committed_amount), 0) INTO capital_raised
  FROM public.investor_commitments
  WHERE status IN ('confirmed', 'paid');
  
  -- Build result JSON
  result := json_build_object(
    'investor_count', investor_count,
    'founder_count', founder_count,
    'capital_raised', capital_raised
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to anonymous users (for login page)
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;

