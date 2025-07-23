import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#A142F4'];

export default function ScheduleMeeting() {
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

  const handleAddGuest = () => {
    if (guestInput && !guests.includes(guestInput)) {
      setGuests([...guests, guestInput]);
      setGuestInput('');
    }
  };
  const handleRemoveGuest = (email: string) => {
    setGuests(guests.filter(g => g !== email));
  };

  // Mock events data
  const events = [
    {
      id: 1,
      title: 'Daily design meeting',
      date: '2025-07-25',
      startTime: '10:00',
      endTime: '10:45',
      guests: ['alice@example.com', 'bob@example.com'],
    },
    {
      id: 2,
      title: 'Sprint planning',
      date: '2025-07-26',
      startTime: '14:00',
      endTime: '15:00',
      guests: ['carol@example.com'],
    },
  ];

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-xl p-0 mt-8">
        <CardHeader className="border-b">
          <CardTitle>Schedule a meeting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            placeholder="Daily design meeting — Meeting room no.1"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-lg font-medium"
          />
          <div className="flex gap-2">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1" />
            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-28" />
            <span className="self-center">-</span>
            <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-28" />
          </div>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Add guest email address"
              value={guestInput}
              onChange={e => setGuestInput(e.target.value)}
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleAddGuest()}
            />
            <Button type="button" onClick={handleAddGuest} size="sm">Add</Button>
          </div>
          {guests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {guests.map(email => (
                <span key={email} className="bg-gray-100 rounded-full px-3 py-1 text-xs flex items-center gap-1">
                  {email}
                  <button onClick={() => handleRemoveGuest(email)} className="text-gray-400 hover:text-red-500">&times;</button>
                </span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Where</label>
              <Input placeholder="Enter a location" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Video call</label>
              <a href="#" className="text-blue-600 hover:underline text-xs">Join meeting: (Google Meet link)</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Calendar</label>
              <select className="w-full border rounded px-2 py-1 text-sm" value={calendar} onChange={e => setCalendar(e.target.value)}>
                <option>My Calendar</option>
                <option>Team Calendar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Event color</label>
              <div className="flex gap-2 mt-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-5 h-5 rounded-full border-2 ${color === c ? 'border-black' : 'border-transparent'}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea
              className="w-full border rounded px-2 py-1 text-sm min-h-[60px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-xs font-medium">Notifications</label>
            <select className="border rounded px-2 py-1 text-sm" value={notificationType} onChange={e => setNotificationType(e.target.value)}>
              <option>Email</option>
              <option>Popup</option>
            </select>
            <Input
              type="number"
              min={0}
              value={notificationMinutes}
              onChange={e => setNotificationMinutes(Number(e.target.value))}
              className="w-16"
            />
            <span className="text-xs">Minutes before</span>
          </div>
          <Button className="w-full mt-4" size="lg">Schedule Meeting</Button>
        </CardContent>
      </Card>
    
    </div>
  );
} 