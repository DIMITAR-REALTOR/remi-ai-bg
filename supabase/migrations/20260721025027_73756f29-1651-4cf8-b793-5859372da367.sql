
REVOKE EXECUTE ON FUNCTION public.is_confirmed_agency_member(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_agency_creator(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_agency_creator_as_member() FROM PUBLIC, anon, authenticated;
