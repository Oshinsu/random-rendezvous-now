-- Clean up test groups and their participants
DELETE FROM public.group_participants WHERE group_id IN (
  '35f27db5-89c6-42ad-8234-9eaed61ec712',
  '9ac99ee8-e47d-4277-9d94-98bc54f9f41e', 
  '04dd5593-e94a-4e7e-881d-bf7bb2762c54'
);

DELETE FROM public.groups WHERE id IN (
  '35f27db5-89c6-42ad-8234-9eaed61ec712',
  '9ac99ee8-e47d-4277-9d94-98bc54f9f41e',
  '04dd5593-e94a-4e7e-881d-bf7bb2762c54'
);