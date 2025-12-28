-- Insert the "10 Hours Listener" decoration if it doesn't exist
INSERT INTO public.avatar_decorations (name, description, image_url, type, is_free)
SELECT '10 Hours Listener', 'Awarded for listening to 10+ hours of music', '/decorations/10h-listener.png', 'static', false
WHERE NOT EXISTS (
    SELECT 1 FROM public.avatar_decorations WHERE name = '10 Hours Listener'
);
