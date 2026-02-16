-- Function: Get Daily Recap for Current User
-- Calculates total amount per shift for TODAY (Asia/Jakarta Timezone)
create or replace function get_my_daily_recap()
returns table (
  shift_type text,
  total_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    t.shift as shift_type,
    coalesce(sum(t.amount), 0) as total_amount
  from
    transactions t
  where
    t.user_id = auth.uid() -- Only own data
    and (t.created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date
  group by
    t.shift;
end;
$$;
