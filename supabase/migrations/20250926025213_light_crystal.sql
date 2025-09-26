@@ .. @@
 -- Evaluation categories policies
 CREATE POLICY "Anyone can view evaluation categories"
   ON evaluation_categories FOR SELECT
-  USING (true);
+  TO authenticated
+  USING (true);

 -- Property evaluations policies
 CREATE POLICY "Team members can view property evaluations"
   ON property_evaluations FOR SELECT
   USING (EXISTS (
     SELECT 1 FROM properties p
     JOIN team_members tm ON tm.team_id = p.team_id
-    WHERE p.id = property_evaluations.property_id AND tm.user_id = uid()
+    WHERE p.id = property_evaluations.property_id AND tm.user_id = auth.uid()
   ));

 CREATE POLICY "Team members can create property evaluations"
   ON property_evaluations FOR INSERT
   WITH CHECK (
-    user_id = uid() AND
+    user_id = auth.uid() AND
     EXISTS (
       SELECT 1 FROM properties p
       JOIN team_members tm ON tm.team_id = p.team_id
-      WHERE p.id = property_evaluations.property_id AND tm.user_id = uid()
+      WHERE p.id = property_evaluations.property_id AND tm.user_id = auth.uid()
     )
   );

 CREATE POLICY "Users can update their own evaluations"
   ON property_evaluations FOR UPDATE
-  USING (user_id = uid() AND EXISTS (
+  USING (user_id = auth.uid() AND EXISTS (
     SELECT 1 FROM properties p
     JOIN team_members tm ON tm.team_id = p.team_id
-    WHERE p.id = property_evaluations.property_id AND tm.user_id = uid()
+    WHERE p.id = property_evaluations.property_id AND tm.user_id = auth.uid()
   ));

 CREATE POLICY "Users can delete their own evaluations"
   ON property_evaluations FOR DELETE
-  USING (user_id = uid() AND EXISTS (
+  USING (user_id = auth.uid() AND EXISTS (
     SELECT 1 FROM properties p
     JOIN team_members tm ON tm.team_id = p.team_id
-    WHERE p.id = property_evaluations.property_id AND tm.user_id = uid()
+    WHERE p.id = property_evaluations.property_id AND tm.user_id = auth.uid()
   ));