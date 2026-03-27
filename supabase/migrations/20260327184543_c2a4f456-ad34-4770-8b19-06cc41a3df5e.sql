
DROP POLICY "Service can insert notifications" ON public.notifications;
CREATE POLICY "Insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
