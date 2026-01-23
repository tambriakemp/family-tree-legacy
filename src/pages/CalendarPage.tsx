import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFamilyTree } from "@/hooks/useFamilyTrees";
import { useTreeMembers } from "@/hooks/useTreeMembers";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { FamilyCalendar } from "@/components/calendar/FamilyCalendar";
import { EventFormDialog } from "@/components/calendar/EventFormDialog";
import type { CalendarEvent, CreateCalendarEventInput } from "@/types/database";

const CalendarPage = () => {
  const { treeId } = useParams<{ treeId: string }>();
  const navigate = useNavigate();
  const { data: tree, isLoading: treeLoading } = useFamilyTree(treeId);
  const { members, isLoading: membersLoading } = useTreeMembers(treeId);
  const { events, isLoading: eventsLoading, createEvent, updateEvent, deleteEvent } = useCalendarEvents(treeId);

  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const isLoading = treeLoading || membersLoading || eventsLoading;

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleEventSubmit = async (data: CreateCalendarEventInput) => {
    if (editingEvent) {
      await updateEvent.mutateAsync({ id: editingEvent.id, ...data });
    } else {
      await createEvent.mutateAsync(data);
    }
    setShowEventForm(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent.mutateAsync(eventId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-heavy border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/trees/${treeId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tree
              </Button>
            </Link>
            <h1 className="font-display text-lg font-semibold">
              {tree?.title} - Calendar
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FamilyCalendar
              events={events}
              members={members}
              onAddEvent={handleAddEvent}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              isDeleting={deleteEvent.isPending}
            />
          </motion.div>
        </div>
      </main>

      {/* Event Form Dialog */}
      <EventFormDialog
        open={showEventForm}
        onOpenChange={setShowEventForm}
        treeId={treeId || ""}
        members={members}
        event={editingEvent || undefined}
        onSubmit={handleEventSubmit}
        isLoading={createEvent.isPending || updateEvent.isPending}
      />
    </div>
  );
};

export default CalendarPage;
