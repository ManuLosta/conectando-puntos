-- Simple and safe RLS for tenant = Distributor
-- Uses app.distributor_id (text) and app.bypass_rls ('on' to bypass)

-- Namespace for session variables (no-op if already exists)
create schema if not exists app;

-- Enable and force RLS on tenant-scoped tables
alter table if exists distributors        enable row level security; alter table if exists distributors        force row level security;
alter table if exists user_tenant         enable row level security; alter table if exists user_tenant         force row level security;
alter table if exists salespeople         enable row level security; alter table if exists salespeople         force row level security;
alter table if exists products            enable row level security; alter table if exists products            force row level security;
alter table if exists inventory_items     enable row level security; alter table if exists inventory_items     force row level security;
alter table if exists client_distributors enable row level security; alter table if exists client_distributors force row level security;
alter table if exists orders              enable row level security; alter table if exists orders              force row level security;
alter table if exists order_items         enable row level security; alter table if exists order_items         force row level security;

-- Helper: convenience predicate for bypass
-- Current_setting returns text; compare to 'on'
-- Policies (drop-if-exists for re-runs)

-- distributors (tenant anchor: id)
drop policy if exists tenant_isolation on distributors;
create policy tenant_isolation on distributors
for all using (
  id = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
) with check (
  id = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
);

-- user_tenant (scoped by distributorId)
drop policy if exists tenant_isolation on user_tenant;
create policy tenant_isolation on user_tenant
for all using (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
) with check (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
);

-- salespeople
drop policy if exists tenant_isolation on salespeople;
create policy tenant_isolation on salespeople
for all using (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
) with check (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
);

-- products
drop policy if exists tenant_isolation on products;
create policy tenant_isolation on products
for all using (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
) with check (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
);

-- inventory_items
drop policy if exists tenant_isolation on inventory_items;
create policy tenant_isolation on inventory_items
for all using (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
) with check (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
);

-- client_distributors
drop policy if exists tenant_isolation on client_distributors;
create policy tenant_isolation on client_distributors
for all using (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
) with check (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
);

-- orders
drop policy if exists tenant_isolation on orders;
create policy tenant_isolation on orders
for all using (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
) with check (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
);

-- order_items
drop policy if exists tenant_isolation on order_items;
create policy tenant_isolation on order_items
for all using (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
) with check (
  "distributorId" = current_setting('app.distributor_id', true)
  or current_setting('app.bypass_rls', true) = 'on'
);



