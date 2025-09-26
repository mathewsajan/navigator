@@ .. @@
 -- User profiles policies
 CREATE POLICY "Users can view their own profile"
   ON user_profiles FOR SELECT
-  USING (id = uid());
+  USING (id = auth.uid());

 CREATE POLICY "Users can update their own profile"
   ON user_profiles FOR UPDATE
-  USING (id = uid());
+  USING (id = auth.uid());

 -- Teams policies
 CREATE POLICY "Team members can view their team"
   ON teams FOR SELECT
   USING (EXISTS (
     SELECT 1 FROM team_members 
-    WHERE team_id = teams.id AND user_id = uid()
+    WHERE team_id = teams.id AND user_id = auth.uid()
   ));

 CREATE POLICY "Team owners can update their team"
   ON teams FOR UPDATE
   USING (EXISTS (
     SELECT 1 FROM team_members 
-    WHERE team_id = teams.id AND user_id = uid() AND role = 'owner'
+    WHERE team_id = teams.id AND user_id = auth.uid() AND role = 'owner'
   ));

 CREATE POLICY "Team owners can delete their team"
   ON teams FOR DELETE
   USING (EXISTS (
     SELECT 1 FROM team_members 
-    WHERE team_id = teams.id AND user_id = uid() AND role = 'owner'
+    WHERE team_id = teams.id AND user_id = auth.uid() AND role = 'owner'
   ));

 CREATE POLICY "Authenticated users can create teams"
   ON teams FOR INSERT
-  WITH CHECK (created_by = uid());
+  WITH CHECK (created_by = auth.uid());

 -- Team members policies
 CREATE POLICY "Team members can view their team members"
   ON team_members FOR SELECT
   USING (EXISTS (
     SELECT 1 FROM team_members tm 
-    WHERE tm.team_id = team_members.team_id AND tm.user_id = uid()
+    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
   ));

 CREATE POLICY "Users can join teams"
   ON team_members FOR INSERT
-  WITH CHECK (user_id = uid());
+  WITH CHECK (user_id = auth.uid());

 CREATE POLICY "Team owners can manage team members"
   ON team_members FOR UPDATE
   USING (EXISTS (
     SELECT 1 FROM team_members tm 
-    WHERE tm.team_id = team_members.team_id AND tm.user_id = uid() AND tm.role = 'owner'
+    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid() AND tm.role = 'owner'
   ));

 CREATE POLICY "Team owners can remove team members"
   ON team_members FOR DELETE
   USING (EXISTS (
     SELECT 1 FROM team_members tm 
-    WHERE tm.team_id = team_members.team_id AND tm.user_id = uid() AND tm.role = 'owner'
+    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid() AND tm.role = 'owner'
   ));

 -- Properties policies
 CREATE POLICY "Team members can view properties"
   ON properties FOR SELECT
   USING (EXISTS (
     SELECT 1 FROM team_members 
-    WHERE team_id = properties.team_id AND user_id = uid()
+    WHERE team_id = properties.team_id AND user_id = auth.uid()
   ));

 CREATE POLICY "Team members can create properties"
   ON properties FOR INSERT
   WITH CHECK (EXISTS (
     SELECT 1 FROM team_members 
-    WHERE team_id = properties.team_id AND user_id = uid()
+    WHERE team_id = properties.team_id AND user_id = auth.uid()
   ));

 CREATE POLICY "Team members can update properties"
   ON properties FOR UPDATE
   USING (EXISTS (
     SELECT 1 FROM team_members 
-    WHERE team_id = properties.team_id AND user_id = uid()
+    WHERE team_id = properties.team_id AND user_id = auth.uid()
   ));

 CREATE POLICY "Team members can delete properties"
   ON properties FOR DELETE
   USING (EXISTS (
     SELECT 1 FROM team_members 
-    WHERE team_id = properties.team_id AND user_id = uid()
+    WHERE team_id = properties.team_id AND user_id = auth.uid()
   ));