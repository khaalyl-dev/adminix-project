// ScheduleMeeting.tsx
// This file provides the UI and logic for scheduling a Google Meet meeting, including guest management, date/time selection, and displaying the meeting link.
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import useGetWorkspaceMembers from '@/hooks/api/use-get-workspace-members';
import useWorkspaceId from '@/hooks/use-workspace-id';
import { FaVideo } from "react-icons/fa";
import { toast } from "@/hooks/use-toast";

const COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#A142F4'];

export default function ScheduleMeeting() {
  const { projectId } = useParams();
  const workspaceId = useWorkspaceId();
  // Fetch project members
  const [memberSearch, setMemberSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: memberData } = useGetWorkspaceMembers(workspaceId);
  const members = memberData?.members || [];
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [guests, setGuests] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState('');
  const [location, setLocation] = useState('');
  const [calendar, setCalendar] = useState('My Calendar');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [notificationType, setNotificationType] = useState('Email');
  const [notificationMinutes, setNotificationMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetLink, setMeetLink] = useState<string | null>(null);

  // Filter members for autocomplete
  const filteredMembers = memberSearch
    ? members.filter((m: any) =>
        m.userId.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.userId.name.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : [];

  const handleAddGuest = (email?: string) => {
    const toAdd = email || guestInput;
    if (toAdd && !guests.includes(toAdd)) {
      setGuests([...guests, toAdd]);
      setGuestInput('');
      setMemberSearch('');
      setShowDropdown(false);
    }
  };
  const handleRemoveGuest = (email: string) => {
    setGuests(guests.filter(g => g !== email));
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMeetLink(null);
    try {
      // Compose ISO datetime strings
      const start = date && startTime ? new Date(`${date}T${startTime}`).toISOString() : '';
      const end = date && endTime ? new Date(`${date}T${endTime}`).toISOString() : '';
      const response = await axios.post('/api/meetings/schedule', {
        title,
        start,
        end,
        guests,
        location,
        description,
        projectId, // <-- include projectId
      });
      setMeetLink(response.data.meetLink);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  // Mock events data (not used in form)

  return (
    <Card className="w-full max-w-xl p-0 shadow-lg border-0">
      <CardContent className="space-y-8 py-8 px-6">
        <form onSubmit={handleScheduleMeeting} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Meeting Title</label>
            <Input
              placeholder="e.g. Daily design meeting"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-base font-medium rounded-lg shadow-sm focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Date</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Start</label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">End</label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Guests</label>
            <div className="flex gap-2 relative">
              <Input
                placeholder="Add guest email"
                value={guestInput}
                onChange={e => {
                  setGuestInput(e.target.value);
                  setMemberSearch(e.target.value);
                  setShowDropdown(!!e.target.value);
                }}
                className="flex-1"
                onFocus={() => setShowDropdown(!!guestInput)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                onKeyDown={e => e.key === 'Enter' && handleAddGuest()}
              />
              <Button type="button" onClick={() => handleAddGuest()} size="sm" variant="outline">Add</Button>
              {showDropdown && filteredMembers.length > 0 && (
                <div className="absolute left-0 top-10 z-10 bg-white border rounded shadow w-full max-h-40 overflow-y-auto">
                  {filteredMembers.map((m: any) => (
                    <div
                      key={m.userId.email}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm flex items-center gap-2"
                      onMouseDown={() => handleAddGuest(m.userId.email)}
                    >
                      <span className="font-medium">{m.userId.name}</span>
                      <span className="text-xs text-gray-400">{m.userId.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {guests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {guests.map(email => (
                  <span key={email} className="bg-gray-100 rounded-full px-3 py-1 text-xs flex items-center gap-1 shadow-sm">
                    {email}
                    <button
                      onClick={() => handleRemoveGuest(email)}
                      className="text-gray-400 hover:text-red-500 font-bold ml-1"
                      aria-label="Remove guest"
                      type="button"
                    >&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[60px] shadow-sm focus:ring-2 focus:ring-primary"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Video call</label>
            {meetLink ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-3 mt-1 shadow-sm">
                <FaVideo color="#4285F4" size={22} className="mr-2" />
                <a href={meetLink} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold underline break-all text-base hover:text-blue-900 transition-colors">
                  {meetLink}
                </a>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => {navigator.clipboard.writeText(meetLink); toast({ title: 'Copied', description: 'Meeting link copied to clipboard', variant: 'success' });}}
                  className="ml-2"
                  aria-label="Copy link"
                  title="Copy meeting link"
                >📋</Button>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Google Meet link will appear here</span>
            )}
          </div>
          {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
          <Button className="w-full mt-4 text-base font-semibold h-12 rounded-lg shadow" size="lg" type="submit" disabled={loading}>
            {loading ? 'Scheduling...' : 'Schedule Meeting'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 