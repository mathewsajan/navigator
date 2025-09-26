@@ .. @@
 -- Property media policies
 CREATE POLICY "Team members can view property media"
   ON property_media FOR SELECT
   USING (EXISTS (
     SELECT 1 FROM properties p
     JOIN team_members tm ON tm.team_id = p.team_id
-    WHERE p.id = property_media.property_id AND tm.user_id = uid()
+    WHERE p.id = property_media.property_id AND tm.user_id = auth.uid()
   ));

 CREATE POLICY "Team members can upload property media"
   ON property_media FOR INSERT
   WITH CHECK (
-    uploaded_by = uid() AND
+    uploaded_by = auth.uid() AND
     EXISTS (
       SELECT 1 FROM properties p
       JOIN team_members tm ON tm.team_id = p.team_id
-      WHERE p.id = property_media.property_id AND tm.user_id = uid()
+      WHERE p.id = property_media.property_id AND tm.user_id = auth.uid()
     )
   );

 CREATE POLICY "Users can update their own property media"
   ON property_media FOR UPDATE
-  USING (uploaded_by = uid() AND EXISTS (
+  USING (uploaded_by = auth.uid() AND EXISTS (
     SELECT 1 FROM properties p
     JOIN team_members tm ON tm.team_id = p.team_id
-    WHERE p.id = property_media.property_id AND tm.user_id = uid()
+    WHERE p.id = property_media.property_id AND tm.user_id = auth.uid()
   ));

 CREATE POLICY "Users can delete their own property media"
   ON property_media FOR DELETE
-  USING (uploaded_by = uid() AND EXISTS (
+  USING (uploaded_by = auth.uid() AND EXISTS (
     SELECT 1 FROM properties p
     JOIN team_members tm ON tm.team_id = p.team_id
-    WHERE p.id = property_media.property_id AND tm.user_id = uid()
+    WHERE p.id = property_media.property_id AND tm.user_id = auth.uid()
   ));