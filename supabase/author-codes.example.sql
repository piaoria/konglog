-- User runs this privately in Supabase SQL Editor after replacing placeholders.
-- Do not send actual codes to chat or commit this file with real values.
-- The two codes must be different. Only bcrypt hashes enter the private table.
do $$
declare
  home_code text := '<KONGDOL_4_DIGITS>';
  away_code text := '<KONGSUN_4_DIGITS>';
begin
  if home_code !~ '^[0-9]{4}$' or away_code !~ '^[0-9]{4}$' or home_code = away_code then
    raise exception 'Set two distinct four-digit codes privately before running';
  end if;
  insert into private.author_codes (author, code_hash)
  values ('kongdol', extensions.crypt(home_code, extensions.gen_salt('bf', 10))),
         ('kongsun', extensions.crypt(away_code, extensions.gen_salt('bf', 10)))
  on conflict (author) do update set code_hash = excluded.code_hash;
end;
$$;
