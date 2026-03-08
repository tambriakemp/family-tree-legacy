
-- 1. Convert 'child' relationships to 'parent' by swapping direction
UPDATE relationships 
SET from_person_id = to_person_id, 
    to_person_id = from_person_id, 
    relationship_type = 'parent' 
WHERE relationship_type = 'child';

-- 2. Delete sibling relationships (now inferred from shared parents)
DELETE FROM relationships WHERE relationship_type = 'sibling';

-- 3. Update the enum to remove 'child' and 'sibling'
ALTER TYPE public.relationship_type RENAME TO relationship_type_old;

CREATE TYPE public.relationship_type AS ENUM ('parent', 'spouse', 'partner');

ALTER TABLE relationships 
  ALTER COLUMN relationship_type TYPE public.relationship_type 
  USING relationship_type::text::public.relationship_type;

DROP TYPE public.relationship_type_old;
