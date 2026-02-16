-- Function: Unassign Collector Street
-- Atomically removes a specific street assignment for a specific collector
create or replace function public.unassign_collector_street(
  target_user_id uuid,
  target_street text
)
returns void
language plpgsql
security definer -- Runs with elevated permissions to allow deletion in collector_assignments
set search_path = public
as $$
begin
  -- Perform deletion based on the composite matching of user_id and ruas_jalan
  delete from public.collector_assignments
  where user_id = target_user_id
  and ruas_jalan = target_street;
  
  -- Optionally check if anything was deleted, but 'void' return is standard for simple deletes
end;
$$;