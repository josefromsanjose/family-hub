import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Calendar as CalendarIcon, Clock } from "lucide-react";

export const Route = createFileRoute("/calendar")({ component: Calendar });

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: "appointment" | "event" | "reminder";
}

const eventTypes = [
  { value: "appointment", label: "Appointment", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "event", label: "Event", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "reminder", label: "Reminder", color: "bg-orange-100 text-orange-800 border-orange-300" },
];

function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: selectedDate,
    time: "",
    type: "event" as Event["type"],
  });

  const addEvent = () => {
    if (!formData.title.trim()) return;

    const newEvent: Event = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description || undefined,
      date: formData.date,
      time: formData.time || undefined,
      type: formData.type,
    };

    setEvents([...events, newEvent]);
    setFormData({
      title: "",
      description: "",
      date: selectedDate,
      time: "",
      type: "event",
    });
    setShowAddForm(false);
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter((event) => event.id !== id));
  };

  const getEventsForDate = (date: string) => {
    return events.filter((event) => event.date === date).sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
  };

  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split("T")[0];
    return events
      .filter((event) => event.date >= today)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return 0;
      })
      .slice(0, 5);
  };

  const getEventTypeStyle = (type: Event["type"]) => {
    return eventTypes.find((et) => et.value === type)?.color || eventTypes[0].color;
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Calendar</h1>
            <p className="text-gray-600">Keep track of appointments, events, and reminders</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus size={20} />
            Add Event
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Event</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Doctor appointment, School play, Birthday party"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    setFormData({ ...formData, date: e.target.value });
                    setSelectedDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time (optional)</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as Event["type"] })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={addEvent}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Add Event
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Events by Date</h2>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No events scheduled yet</p>
                  </div>
                ) : (
                  Object.entries(
                    events.reduce((acc, event) => {
                      if (!acc[event.date]) acc[event.date] = [];
                      acc[event.date].push(event);
                      return acc;
                    }, {} as Record<string, Event[]>)
                  )
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, dateEvents]) => (
                      <div key={date} className="border-b border-gray-200 pb-4 last:border-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {new Date(date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h3>
                        <div className="space-y-2">
                          {dateEvents.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-start justify-between gap-4 p-3 rounded-lg border"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded border ${getEventTypeStyle(
                                      event.type
                                    )}`}
                                  >
                                    {eventTypes.find((et) => et.value === event.type)?.label}
                                  </span>
                                  {event.time && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <Clock size={14} />
                                      <span>{event.time}</span>
                                    </div>
                                  )}
                                </div>
                                <h4 className="font-medium text-gray-900">{event.title}</h4>
                                {event.description && (
                                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => deleteEvent(event.id)}
                                className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors flex-shrink-0"
                                aria-label="Delete event"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-600 text-sm">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded border ${getEventTypeStyle(
                            event.type
                          )}`}
                        >
                          {eventTypes.find((et) => et.value === event.type)?.label}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{event.title}</h4>
                      <p className="text-xs text-gray-600">
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {event.time && ` at ${event.time}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
