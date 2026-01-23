import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CalendarEvent, CreateCalendarEventInput, UpdateCalendarEventInput, TreeMember } from "@/types/database";
import { format, parseISO, setYear, isValid } from "date-fns";

export function useCalendarEvents(treeId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["calendar-events", treeId],
    queryFn: async () => {
      if (!treeId) return [];
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("family_tree_id", treeId)
        .order("start_date_time", { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!treeId && !!user,
  });

  const createEvent = useMutation({
    mutationFn: async (input: CreateCalendarEventInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          ...input,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", treeId] });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...input }: UpdateCalendarEventInput & { id: string }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", treeId] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", treeId] });
    },
  });

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}

// Helper to generate birthday events from tree members
export function generateBirthdayEvents(members: TreeMember[], currentYear: number): CalendarEvent[] {
  return members
    .filter((member) => member.birth_date)
    .map((member) => {
      const birthDate = parseISO(member.birth_date!);
      if (!isValid(birthDate)) return null;

      const birthdayThisYear = setYear(birthDate, currentYear);
      const age = currentYear - birthDate.getFullYear();

      return {
        id: `birthday-${member.id}-${currentYear}`,
        family_tree_id: member.family_tree_id,
        title: `🎂 ${member.first_name}'s Birthday`,
        description: `${member.first_name}${member.last_name ? ` ${member.last_name}` : ""} turns ${age}`,
        start_date_time: birthdayThisYear.toISOString(),
        end_date_time: null,
        related_person_id: member.id,
        created_by_user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as CalendarEvent;
    })
    .filter(Boolean) as CalendarEvent[];
}
