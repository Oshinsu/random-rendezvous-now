-- Enable Row Level Security and add tables to realtime publication for instant updates

-- Enable REPLICA IDENTITY FULL for complete row data during updates
ALTER TABLE public.groups REPLICA IDENTITY FULL;
ALTER TABLE public.group_participants REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication to enable real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_participants;