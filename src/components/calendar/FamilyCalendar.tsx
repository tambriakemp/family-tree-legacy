import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Cake, CalendarDays, Edit, Trash2, User } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, isSameMonth, parseISO } from "date-fns";
import type { CalendarEvent, TreeMember } from "@/types/database";
import { generateBirthdayEvents } from "@/hooks/useCalendarEvents";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FamilyCalendarProps {
  events: CalendarEvent[];
  members: TreeMember[];
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  isDeleting?: boolean;
}

export function FamilyCalendar({
  events,
  members,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  isDeleting,
}: FamilyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  // Combine regular events with birthday events
  const allEvents = useMemo(() => {
    const currentYear = currentMonth.getFullYear();
    const birthdayEvents = generateBirthdayEvents(members, currentYear);
    return [...events, ...birthdayEvents];
  }, [events, members, currentMonth]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const eventDate = parseISO(event.start_date_time);
      return isSameDay(eventDate, selectedDate);
    });
  }, [allEvents, selectedDate]);

  // Get dates that have events for calendar highlighting
  const eventDates = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    return allEvents
      .filter((event) => {
        const eventDate = parseISO(event.start_date_time);
        return isSameMonth(eventDate, currentMonth);
      })
      .map((event) => parseISO(event.start_date_time));
  }, [allEvents, currentMonth]);

  const getMemberName = (personId: string | null) => {
    if (!personId) return null;
    const member = members.find((m) => m.id === personId);
    return member ? `${member.first_name}${member.last_name ? ` ${member.last_name}` : ""}` : null;
  };

  const isBirthdayEvent = (event: CalendarEvent) => {
    return event.id.startsWith("birthday-");
  };

  const handleConfirmDelete = () => {
    if (deleteEventId) {
      onDeleteEvent(deleteEventId);
      setDeleteEventId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <div className="bg-card rounded-xl border border-border p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            onMonthChange={setCurrentMonth}
            className="w-full pointer-events-auto"
            modifiers={{
              hasEvent: eventDates,
            }}
            modifiersStyles={{
              hasEvent: {
                fontWeight: "bold",
              },
            }}
            components={{
              Day: ({ date, ...props }) => {
                const hasEvents = eventDates.some((d) => isSameDay(d, date));
                const isSelected = isSameDay(date, selectedDate);
                
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <button
                      {...props}
                      className={cn(
                        "w-9 h-9 rounded-md flex items-center justify-center text-sm transition-colors",
                        isSelected && "bg-primary text-primary-foreground",
                        !isSelected && "hover:bg-accent",
                        !isSameMonth(date, currentMonth) && "text-muted-foreground opacity-50"
                      )}
                      onClick={() => setSelectedDate(date)}
                    >
                      {date.getDate()}
                    </button>
                    {hasEvents && !isSelected && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                );
              },
            }}
          />
        </div>
      </div>

      {/* Events List */}
      <div className="lg:col-span-1">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">
              {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            <Button size="sm" onClick={onAddEvent}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            {selectedDateEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No events on this day
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      isBirthdayEvent(event)
                        ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                        : "bg-muted/50 border-border"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {isBirthdayEvent(event) ? (
                          <Cake className="w-4 h-4 text-amber-500" />
                        ) : (
                          <CalendarDays className="w-4 h-4 text-primary" />
                        )}
                        <span className="font-medium text-sm">{event.title}</span>
                      </div>
                      {!isBirthdayEvent(event) && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onEditEvent(event)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => setDeleteEventId(event.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        {event.description}
                      </p>
                    )}
                    {event.related_person_id && (
                      <div className="flex items-center gap-1 mt-2 ml-6">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {getMemberName(event.related_person_id)}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 ml-6">
                      {format(parseISO(event.start_date_time), "h:mm a")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this event from the calendar. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
