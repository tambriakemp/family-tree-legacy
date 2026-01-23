// Database types for FamilyFlow

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';
export type InviteStatus = 'pending' | 'accepted' | 'declined';
export type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling' | 'partner';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  subscription_status: string;
  plan_type: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyTree {
  id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreeMember {
  id: string;
  family_tree_id: string;
  created_by_user_id: string | null;
  first_name: string;
  last_name: string | null;
  birth_date: string | null;
  death_date: string | null;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  family_tree_id: string;
  from_person_id: string;
  to_person_id: string;
  relationship_type: RelationshipType;
  by_marriage: boolean;
  created_by_user_id: string | null;
  created_at: string;
}

export interface TreeCollaborator {
  id: string;
  family_tree_id: string;
  email: string;
  user_id: string | null;
  role: CollaboratorRole;
  invite_status: InviteStatus;
  invited_by_user_id: string;
  created_at: string;
}

export interface PersonNote {
  id: string;
  person_id: string;
  author_user_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  family_tree_id: string;
  uploaded_by_user_id: string | null;
  storage_path: string;
  url: string;
  caption: string | null;
  created_at: string;
}

export interface PhotoTag {
  id: string;
  photo_id: string;
  person_id: string;
  tagged_by_user_id: string | null;
  created_at: string;
}

export interface PhotoWithTags extends Photo {
  photo_tags: PhotoTag[];
}

export interface CalendarEvent {
  id: string;
  family_tree_id: string;
  title: string;
  description: string | null;
  start_date_time: string;
  end_date_time: string | null;
  related_person_id: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

// Form types
export interface CreateTreeMemberInput {
  family_tree_id: string;
  first_name: string;
  last_name?: string;
  birth_date?: string;
  death_date?: string;
  profile_photo_url?: string;
}

export interface UpdateTreeMemberInput {
  first_name?: string;
  last_name?: string;
  birth_date?: string | null;
  death_date?: string | null;
  profile_photo_url?: string | null;
}

export interface CreateRelationshipInput {
  family_tree_id: string;
  from_person_id: string;
  to_person_id: string;
  relationship_type: RelationshipType;
  by_marriage?: boolean;
}

export interface CreateFamilyTreeInput {
  title: string;
  description?: string;
}

export interface CreateCalendarEventInput {
  family_tree_id: string;
  title: string;
  description?: string;
  start_date_time: string;
  end_date_time?: string;
  related_person_id?: string;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string | null;
  start_date_time?: string;
  end_date_time?: string | null;
  related_person_id?: string | null;
}

export interface CreatePhotoInput {
  family_tree_id: string;
  storage_path: string;
  url: string;
  caption?: string;
}

export interface CreatePersonNoteInput {
  person_id: string;
  content: string;
}
