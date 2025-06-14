
import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MeetingTimeCardProps } from './types';
import { formatMeetingTime, getTimeUntilMeeting } from './utils';

const MeetingTimeCard = ({ meetingTime }: MeetingTimeCardProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-200 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-1">Rendez-vous</h4>
          <p className="text-blue-700 font-medium capitalize mb-2">
            {formatMeetingTime(meetingTime)}
          </p>
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            {getTimeUntilMeeting(meetingTime)}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default MeetingTimeCard;
