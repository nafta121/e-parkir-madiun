
-- Function 1: Get total amount for filtered transactions
-- This is highly efficient as it performs aggregation on the database server.
create or replace function get_filtered_transactions_total(
  date_filter text,
  collector_id_filter uuid default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  total_amount numeric;
  start_of_day timestamptz;
  end_of_day timestamptz;
begin
  -- Note: Timezone is handled by the database's default setting for consistency
  start_of_day := (date_filter || 'T00:00:00Z')::timestamptz;
  end_of_day := (date_filter || 'T23:59:59Z')::timestamptz;

  select coalesce(sum(amount), 0)
  into total_amount
  from transactions
  where created_at >= start_of_day
    and created_at <= end_of_day
    and (collector_id_filter is null or user_id = collector_id_filter);

  return total_amount;
end;
$$;

-- Function 2: Get Collector Performance Analytics
-- This function aggregates transaction data over various time periods for each collector.
create or replace function get_collector_analytics()
returns table (
    collector_name text,
    total_today numeric,
    total_1week numeric,
    total_1month numeric,
    total_3months numeric,
    total_6months numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    p.full_name as collector_name,
    coalesce(sum(case when t.created_at >= date_trunc('day', now()) then t.amount else 0 end), 0) as total_today,
    coalesce(sum(case when t.created_at >= now() - interval '7 days' then t.amount else 0 end), 0) as total_1week,
    coalesce(sum(case when t.created_at >= now() - interval '1 month' then t.amount else 0 end), 0) as total_1month,
    coalesce(sum(case when t.created_at >= now() - interval '3 months' then t.amount else 0 end), 0) as total_3months,
    coalesce(sum(case when t.created_at >= now() - interval '6 months' then t.amount else 0 end), 0) as total_6months
  from
    public.profiles p
  left join
    public.transactions t on p.id = t.user_id
  where
    p.role = 'kolektor'
  group by
    p.full_name
  order by
    total_today desc;
end;
$$;
