// Generate an ICS file for calendar events
const generateICSFile = (title: string, startDate: Date, url?: string) => {
    // Set end time to 1 hour after start time
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    // Format dates for ICS file (YYYYMMDDTHHMMSSZ format)
    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
    };
    
    const startDateFormatted = formatDateForICS(startDate);
    const endDateFormatted = formatDateForICS(endDate);
    
    // Create ICS content
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${startDateFormatted}`,
      `DTEND:${endDateFormatted}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:Blitzed Out Game\\nhttps://blitzedout.com/PUBLIC${url ? `\\nVideo Link: ${url}` : ''}`,
      'STATUS:CONFIRMED',
    ];
    
    if (url) {
      icsContent.push(`URL:${url}`);
    }
    
    icsContent = icsContent.concat([
      'END:VEVENT',
      'END:VCALENDAR'
    ]);
    
    return icsContent.join('\r\n');
  };
  
  // Function to trigger calendar download
  export const downloadCalendarEvent = (title: string, date: Date, url?: string) => {
    const icsContent = generateICSFile(title, date, url);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = `blitzed-out-game-${date.toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };