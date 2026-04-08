import { useState, useEffect, useRef } from 'react';
import {
    getDaysInMonth,
    getFirstDayOfMonth,
    getMonthName,
    isSameDay,
    isDateBetween,
    loadNotes,
    saveNotes,
} from '../utils/dateHelpers';
import './Calendar.css';

const MONTH_IMAGES: Record<number, string> = {
    1: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775581729/jpeg_9_aehcwo.jpg",
    2: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775585569/Bunny_Wildlife_Photography_in_the_Forest_tvffcq.jpg",
    3: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775581733/Birds_Nature___Mother_s_love___Facebook_lzgrye.jpg",
    4: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775581786/Rabbit_nh7tgc.jpg",
    5: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775585794/jpeg_12_xvknlg.jpg",
    6: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775581776/jpeg_4_wyqwbx.jpg",
    7: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775581774/jpeg_5_tcla5d.jpg",
    8: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775581782/jpeg_2_jomczj.jpg",
    9: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775581784/jpeg_3_u5njtl.jpg",
    10: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775581749/jpeg_8_sxs1sy.jpg",
    11: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775581739/Peacock_iglq1y.jpg",
    12: "https://res.cloudinary.com/daja8t1u0/image/upload/q_auto/f_auto/v1775581765/jpeg_7_gyvu5s.jpg",
};

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const NOTE_LINES = 7;

const formatTodayLabel = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
};

export const Calendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectionRange, setSelectionRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>(loadNotes());
    const [flipKey, setFlipKey] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);
    const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');
    const heroRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const tiltRef = useRef<HTMLDivElement>(null);
    const lastScrollTime = useRef(0);
    const mousePos = useRef({ x: 0, y: 0 });
    const tiltAnimRef = useRef({ x: 0, y: 0 });

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthName = getMonthName(month);
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const emptyOffset = firstDay === 0 ? 6 : firstDay - 1;
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const displayDate = selectionRange.start || hoverDate || new Date();
    useEffect(() => {
        if (heroRef.current) {
            heroRef.current.classList.remove('flip-enter', 'flip-enter-backward', 'flip-enter-forward');
            void heroRef.current.offsetWidth;
            if (flipDirection === 'backward') {
                heroRef.current.classList.add('flip-enter-backward');
            } else {
                heroRef.current.classList.add('flip-enter-forward');
            }
        }
    }, [currentMonth, flipDirection]);

    // 3D TILT ANIMATION: Mouse-based 3D perspective effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!tiltRef.current) return;
            const rect = tiltRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            // Normalize to -1 to 1 range
            const deltaX = (e.clientX - centerX) / (rect.width / 2);
            const deltaY = (e.clientY - centerY) / (rect.height / 2);
            mousePos.current = { x: deltaX, y: deltaY };

            if (calendarRef.current) {
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                calendarRef.current.style.setProperty('--mouse-x', `${mouseX}px`);
                calendarRef.current.style.setProperty('--mouse-y', `${mouseY}px`);
            }
        };

        // 3D TILT ANIMATION: Continuous rotation easing based on mouse position
        const animateTilt = () => {
            if (!tiltRef.current) return;
            // Ease tilt: Y position → X rotation, X position → Y rotation
            tiltAnimRef.current.x += (mousePos.current.y * -6 - tiltAnimRef.current.x) * 0.08;
            tiltAnimRef.current.y += (mousePos.current.x * 8 - tiltAnimRef.current.y) * 0.08;
            // Apply 3D perspective transform
            tiltRef.current.style.transform = `perspective(1200px) rotateX(${4 + tiltAnimRef.current.x}deg) rotateY(${-3 + tiltAnimRef.current.y}deg)`;
            requestAnimationFrame(animateTilt);
        };

        window.addEventListener('mousemove', handleMouseMove);
        const animId = requestAnimationFrame(animateTilt);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animId);
        };
    }, []);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (isFlipping) return;
            const now = Date.now();
            if (now - lastScrollTime.current < 100) return;

            const deltaY = Math.abs(e.deltaY);
            if (deltaY < 30) return;

            lastScrollTime.current = now;
            setIsFlipping(true);

            if (e.deltaY > 0) {
                if (month > 0) {
                    setFlipDirection('backward');
                    setCurrentMonth(new Date(year, month - 1, 1));
                    setFlipKey((k) => k + 1);
                }
            } else {
                if (month < 11) {
                    setFlipDirection('forward');
                    setCurrentMonth(new Date(year, month + 1, 1));
                    setFlipKey((k) => k + 1);
                }
            }

            setTimeout(() => setIsFlipping(false), 650);
        };

        const calendarEl = calendarRef.current;
        if (calendarEl) {
            calendarEl.addEventListener('wheel', handleWheel, { passive: true });
        }

        return () => {
            if (calendarEl) {
                calendarEl.removeEventListener('wheel', handleWheel);
            }
        };
    }, [month, year, isFlipping]);

    useEffect(() => {
        let touchStartY = 0;
        let touchEndY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            touchEndY = e.touches[0].clientY;
        };

        const handleTouchEnd = () => {
            if (isFlipping) return;
            const delta = touchStartY - touchEndY;
            if (Math.abs(delta) < 50) return;

            setIsFlipping(true);

            if (delta > 0) {
                if (month < 11) {
                    setFlipDirection('forward');
                    setCurrentMonth(new Date(year, month + 1, 1));
                    setFlipKey((k) => k + 1);
                }
            } else {
                if (month > 0) {
                    setFlipDirection('backward');
                    setCurrentMonth(new Date(year, month - 1, 1));
                    setFlipKey((k) => k + 1);
                }
            }

            setTimeout(() => setIsFlipping(false), 650);
        };

        const calendarEl = calendarRef.current;
        if (calendarEl) {
            calendarEl.addEventListener('touchstart', handleTouchStart, { passive: true });
            calendarEl.addEventListener('touchmove', handleTouchMove, { passive: true });
            calendarEl.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            if (calendarEl) {
                calendarEl.removeEventListener('touchstart', handleTouchStart);
                calendarEl.removeEventListener('touchmove', handleTouchMove);
                calendarEl.removeEventListener('touchend', handleTouchEnd);
            }
        };
    }, [month, year, isFlipping]);

    // DATE RANGE LOGIC: Three-state selection (none → start → range)
    const handleDateClick = (date: Date) => {
        if (selectionRange.start && selectionRange.end) {
            setSelectionRange({ start: date, end: null });
        } else if (selectionRange.start && !selectionRange.end) {
            date < selectionRange.start
                ? setSelectionRange({ start: date, end: null })
                : setSelectionRange({ ...selectionRange, end: date });
        } else {
            setSelectionRange({ start: date, end: null });
        }
    };

    // DATE RANGE LOGIC: Highlight selected range and hover preview
    const getDayClass = (date: Date): string => {
        const c: string[] = ['dc'];
        if (isSameDay(date, new Date())) c.push('dc-today');
        const isStart = isSameDay(date, selectionRange.start);
        const isEnd = isSameDay(date, selectionRange.end);
        if (isStart || isEnd) c.push('dc-sel');
        if (isStart) c.push('dc-start');
        if (isEnd) c.push('dc-end');

        if (selectionRange.start && selectionRange.end) {
            if (isDateBetween(date, selectionRange.start, selectionRange.end)) c.push('dc-inrange');
        } else if (selectionRange.start && hoverDate && !selectionRange.end) {
            // DATE RANGE LOGIC: Preview range on hover
            if (isDateBetween(date, selectionRange.start, hoverDate)) c.push('dc-inrange', 'dc-hrange');
        }
        if (date.getDay() === 0 || date.getDay() === 6) c.push('dc-wkend');
        return c.join(' ');
    };

    // LOCAL STORAGE PERSISTENCE: Note key by date (if selected) or month
    const noteKey = selectionRange.start
        ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectionRange.start.getDate()).padStart(2, '0')}`
        : `${year}-${String(month + 1).padStart(2, '0')}`;

    // LOCAL STORAGE PERSISTENCE: Retrieve note line
    const getLine = (i: number) => notes[`${noteKey}_L${i}`] || '';
    
    // LOCAL STORAGE PERSISTENCE: Update note line and persist
    const setLine = (i: number, val: string) => {
        const updated = { ...notes, [`${noteKey}_L${i}`]: val };
        setNotes(updated);
        saveNotes(updated);
    };

    const paddingDays = Array.from({ length: emptyOffset }, (_, i) => prevMonthDays - emptyOffset + i + 1);
    const currentDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = Math.ceil((emptyOffset + daysInMonth) / 7) * 7;
    const trailingDays = Array.from({ length: totalSlots - emptyOffset - daysInMonth }, (_, i) => i + 1);

    return (
        <div className="calendar-scene">
            <div className="wall-nail">
                <div className="nail-head" />
            </div>

            <div className="hanging-thread" />

            <div className="calendar-tilt-wrapper" ref={tiltRef}>
            <div className="wall-calendar" ref={calendarRef}>
                <div className="spiral-binding">
                    <div className="spiral-bar" />
                    <div className="coil-container">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="coil-ring" />
                        ))}
                    </div>
                </div>

                <div className={`page-content month-${month + 1}`} ref={heroRef} key={flipKey}>
                <div className="hero-section">
                    <img
                        className="hero-photo"
                        src={MONTH_IMAGES[month + 1]}
                        alt={`${monthName} ${year}`}
                    />
                    <div className="accent-shape"></div>

                    <div className="today-chip">{formatTodayLabel(displayDate)}</div>

                    <div className="month-label-overlay">
                        <span className="label-year">{year}</span>
                        <span className="label-month">{monthName}</span>
                    </div>
                </div>

                <div className="bottom-half">
                    <div className="notes-col">
                        <div className="notes-wrapper">
                            <div className="notes-heading">Notes</div>
                            <div className="note-lines">
                                {Array.from({ length: NOTE_LINES }).map((_, i) => (
                                    <input
                                        key={`${noteKey}-${i}`}
                                        className="note-line"
                                        type="text"
                                        value={getLine(i)}
                                        onChange={(e) => setLine(i, e.target.value)}
                                        placeholder={i === 0 ? 'Add a note…' : ''}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="divider" />

                    <div className="grid-col">
                        <div className="wk-row">
                            {WEEKDAYS.map((d, i) => (
                                <div key={d} className={`wk-label${i >= 5 ? ' wk-end' : ''}`}>{d}</div>
                            ))}
                        </div>
                        <div className="day-grid" onMouseLeave={() => setHoverDate(null)}>
                            {paddingDays.map((d) => (
                                <div key={`p${d}`} className="dc dc-other">{d}</div>
                            ))}
                            {currentDays.map((d) => {
                                const date = new Date(year, month, d);
                                return (
                                    <div
                                        key={d}
                                        className={getDayClass(date)}
                                        onClick={() => handleDateClick(date)}
                                        onMouseEnter={() => setHoverDate(date)}
                                    >
                                        {d}
                                    </div>
                                );
                            })}
                            {trailingDays.map((d) => (
                                <div key={`n${d}`} className="dc dc-other">{d}</div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grey-strip" />
                </div>
            </div>
            </div>
        </div>
    );
};
