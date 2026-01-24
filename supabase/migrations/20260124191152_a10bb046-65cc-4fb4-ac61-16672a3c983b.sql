-- Add updated_at column to relationships table for tracking modifications
ALTER TABLE public.relationships 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_relationships_updated_at
BEFORE UPDATE ON public.relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();