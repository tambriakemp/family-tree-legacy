-- Create app role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create collaborator role enum
CREATE TYPE public.collaborator_role AS ENUM ('owner', 'editor', 'viewer');

-- Create invite status enum
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'declined');

-- Create relationship type enum
CREATE TYPE public.relationship_type AS ENUM ('parent', 'child', 'spouse', 'sibling', 'partner');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  plan_type TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create family_trees table
CREATE TABLE public.family_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tree_collaborators table
CREATE TABLE public.tree_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role collaborator_role NOT NULL DEFAULT 'editor',
  invite_status invite_status NOT NULL DEFAULT 'pending',
  invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (family_tree_id, email)
);

-- Create tree_members table (people in the family tree)
CREATE TABLE public.tree_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  birth_date DATE,
  death_date DATE,
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create relationships table
CREATE TABLE public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  from_person_id UUID REFERENCES public.tree_members(id) ON DELETE CASCADE NOT NULL,
  to_person_id UUID REFERENCES public.tree_members(id) ON DELETE CASCADE NOT NULL,
  relationship_type relationship_type NOT NULL,
  by_marriage BOOLEAN DEFAULT false,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (from_person_id, to_person_id, relationship_type)
);

-- Create person_notes table
CREATE TABLE public.person_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES public.tree_members(id) ON DELETE CASCADE NOT NULL,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  uploaded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create photo_tags table
CREATE TABLE public.photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  person_id UUID REFERENCES public.tree_members(id) ON DELETE CASCADE NOT NULL,
  tagged_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (photo_id, person_id)
);

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_tree_id UUID REFERENCES public.family_trees(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date_time TIMESTAMP WITH TIME ZONE,
  related_person_id UUID REFERENCES public.tree_members(id) ON DELETE SET NULL,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has access to a tree (owner or collaborator)
CREATE OR REPLACE FUNCTION public.has_tree_access(_user_id UUID, _tree_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE id = _tree_id AND owner_user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.tree_collaborators 
    WHERE family_tree_id = _tree_id 
      AND user_id = _user_id 
      AND invite_status = 'accepted'
  )
$$;

-- Function to check if user can edit a tree
CREATE OR REPLACE FUNCTION public.can_edit_tree(_user_id UUID, _tree_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE id = _tree_id AND owner_user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.tree_collaborators 
    WHERE family_tree_id = _tree_id 
      AND user_id = _user_id 
      AND invite_status = 'accepted'
      AND role IN ('owner', 'editor')
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Family trees RLS policies
CREATE POLICY "Users can view trees they own or collaborate on"
ON public.family_trees FOR SELECT
USING (public.has_tree_access(auth.uid(), id));

CREATE POLICY "Users can create their own trees"
ON public.family_trees FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their trees"
ON public.family_trees FOR UPDATE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete their trees"
ON public.family_trees FOR DELETE
USING (auth.uid() = owner_user_id);

-- Tree collaborators RLS policies
CREATE POLICY "Users can view collaborators for accessible trees"
ON public.tree_collaborators FOR SELECT
USING (public.has_tree_access(auth.uid(), family_tree_id));

CREATE POLICY "Tree owners can insert collaborators"
ON public.tree_collaborators FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE id = family_tree_id AND owner_user_id = auth.uid()
  )
);

CREATE POLICY "Tree owners can update collaborators"
ON public.tree_collaborators FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE id = family_tree_id AND owner_user_id = auth.uid()
  )
);

CREATE POLICY "Tree owners can delete collaborators"
ON public.tree_collaborators FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.family_trees 
    WHERE id = family_tree_id AND owner_user_id = auth.uid()
  )
);

-- Tree members RLS policies
CREATE POLICY "Users can view members in accessible trees"
ON public.tree_members FOR SELECT
USING (public.has_tree_access(auth.uid(), family_tree_id));

CREATE POLICY "Editors can insert members"
ON public.tree_members FOR INSERT
WITH CHECK (public.can_edit_tree(auth.uid(), family_tree_id));

CREATE POLICY "Editors can update members"
ON public.tree_members FOR UPDATE
USING (public.can_edit_tree(auth.uid(), family_tree_id));

CREATE POLICY "Editors can delete members"
ON public.tree_members FOR DELETE
USING (public.can_edit_tree(auth.uid(), family_tree_id));

-- Relationships RLS policies
CREATE POLICY "Users can view relationships in accessible trees"
ON public.relationships FOR SELECT
USING (public.has_tree_access(auth.uid(), family_tree_id));

CREATE POLICY "Editors can insert relationships"
ON public.relationships FOR INSERT
WITH CHECK (public.can_edit_tree(auth.uid(), family_tree_id));

CREATE POLICY "Editors can update relationships"
ON public.relationships FOR UPDATE
USING (public.can_edit_tree(auth.uid(), family_tree_id));

CREATE POLICY "Editors can delete relationships"
ON public.relationships FOR DELETE
USING (public.can_edit_tree(auth.uid(), family_tree_id));

-- Person notes RLS policies
CREATE POLICY "Users can view notes in accessible trees"
ON public.person_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tree_members tm
    WHERE tm.id = person_id
      AND public.has_tree_access(auth.uid(), tm.family_tree_id)
  )
);

CREATE POLICY "Editors can insert notes"
ON public.person_notes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tree_members tm
    WHERE tm.id = person_id
      AND public.can_edit_tree(auth.uid(), tm.family_tree_id)
  )
);

CREATE POLICY "Authors can update their notes"
ON public.person_notes FOR UPDATE
USING (auth.uid() = author_user_id);

CREATE POLICY "Authors can delete their notes"
ON public.person_notes FOR DELETE
USING (auth.uid() = author_user_id);

-- Photos RLS policies
CREATE POLICY "Users can view photos in accessible trees"
ON public.photos FOR SELECT
USING (public.has_tree_access(auth.uid(), family_tree_id));

CREATE POLICY "Editors can insert photos"
ON public.photos FOR INSERT
WITH CHECK (public.can_edit_tree(auth.uid(), family_tree_id));

CREATE POLICY "Uploaders can update their photos"
ON public.photos FOR UPDATE
USING (auth.uid() = uploaded_by_user_id);

CREATE POLICY "Uploaders can delete their photos"
ON public.photos FOR DELETE
USING (auth.uid() = uploaded_by_user_id);

-- Photo tags RLS policies
CREATE POLICY "Users can view tags in accessible trees"
ON public.photo_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.photos p
    WHERE p.id = photo_id
      AND public.has_tree_access(auth.uid(), p.family_tree_id)
  )
);

CREATE POLICY "Editors can insert tags"
ON public.photo_tags FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.photos p
    WHERE p.id = photo_id
      AND public.can_edit_tree(auth.uid(), p.family_tree_id)
  )
);

CREATE POLICY "Taggers can delete their tags"
ON public.photo_tags FOR DELETE
USING (auth.uid() = tagged_by_user_id);

-- Calendar events RLS policies
CREATE POLICY "Users can view events in accessible trees"
ON public.calendar_events FOR SELECT
USING (public.has_tree_access(auth.uid(), family_tree_id));

CREATE POLICY "Editors can insert events"
ON public.calendar_events FOR INSERT
WITH CHECK (public.can_edit_tree(auth.uid(), family_tree_id));

CREATE POLICY "Editors can update events"
ON public.calendar_events FOR UPDATE
USING (public.can_edit_tree(auth.uid(), family_tree_id));

CREATE POLICY "Editors can delete events"
ON public.calendar_events FOR DELETE
USING (public.can_edit_tree(auth.uid(), family_tree_id));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_trees_updated_at
  BEFORE UPDATE ON public.family_trees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tree_members_updated_at
  BEFORE UPDATE ON public.tree_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_person_notes_updated_at
  BEFORE UPDATE ON public.person_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_family_trees_owner ON public.family_trees(owner_user_id);
CREATE INDEX idx_tree_members_tree ON public.tree_members(family_tree_id);
CREATE INDEX idx_tree_collaborators_tree ON public.tree_collaborators(family_tree_id);
CREATE INDEX idx_tree_collaborators_user ON public.tree_collaborators(user_id);
CREATE INDEX idx_relationships_tree ON public.relationships(family_tree_id);
CREATE INDEX idx_relationships_from ON public.relationships(from_person_id);
CREATE INDEX idx_relationships_to ON public.relationships(to_person_id);
CREATE INDEX idx_person_notes_person ON public.person_notes(person_id);
CREATE INDEX idx_photos_tree ON public.photos(family_tree_id);
CREATE INDEX idx_photo_tags_photo ON public.photo_tags(photo_id);
CREATE INDEX idx_photo_tags_person ON public.photo_tags(person_id);
CREATE INDEX idx_calendar_events_tree ON public.calendar_events(family_tree_id);
CREATE INDEX idx_calendar_events_person ON public.calendar_events(related_person_id);