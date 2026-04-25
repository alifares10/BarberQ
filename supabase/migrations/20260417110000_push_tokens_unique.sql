do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'push_tokens_user_id_expo_push_token_key'
  ) then
    alter table public.push_tokens
      add constraint push_tokens_user_id_expo_push_token_key
      unique (user_id, expo_push_token);
  end if;
end;
$$;
