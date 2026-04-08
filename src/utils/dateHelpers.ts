export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay();
    return day;
}

export function formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

export function isSameDay(date1: Date | null, date2: Date | null): boolean {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

// DATE RANGE LOGIC: Check if date falls within range (handles bidirectional selection)
export function isDateBetween(date: Date, start: Date | null, end: Date | null): boolean {
    if (!start || !end) return false;
    const dToTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

    const min = Math.min(startTime, endTime);
    const max = Math.max(startTime, endTime);
    return dToTime > min && dToTime < max;
}

export function getMonthName(month: number): string {
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    return months[month];
}

export interface NoteData {
    [dateKey: string]: string;
}

// LOCAL STORAGE PERSISTENCE: Retrieve notes from localStorage with error handling
export function loadNotes(): NoteData {
    try {
        const raw = localStorage.getItem('calendar_notes');
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

// LOCAL STORAGE PERSISTENCE: Save notes to localStorage
export function saveNotes(notes: NoteData): void {
    localStorage.setItem('calendar_notes', JSON.stringify(notes));
}
