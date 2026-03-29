import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Sun, 
  Moon, 
  Pencil,
  Info,
  Download,
  Upload
} from 'lucide-react';
import './App.css';

const VACATION_TYPES = {
  WYPOCZYNKOWY: { label: 'Wypoczynkowy', color: 'var(--type-wypoczynkowy)', bg: 'var(--type-wypoczynkowy-bg)', skipFreeDays: true },
  L4: { label: 'Chorobowe (L4)', color: 'var(--type-l4)', bg: 'var(--type-l4-bg)', skipFreeDays: false },
  NA_ZADANIE: { label: 'Na żądanie', color: 'var(--type-zadanie)', bg: 'var(--type-zadanie-bg)', skipFreeDays: true },
  BEZPLATNY: { label: 'Bezpłatny', color: 'var(--type-bezplatny)', bg: 'var(--type-bezplatny-bg)', skipFreeDays: true },
  PRACA_WEEKEND: { label: 'Praca weekend', color: 'var(--type-weekend)', bg: 'var(--type-weekend-bg)', skipFreeDays: false },
  ODBIOR: { label: 'Odbiór wolnego', color: 'var(--type-odbior)', bg: 'var(--type-odbior-bg)', skipFreeDays: true },
  INNE: { label: 'Inne', color: 'var(--type-inne)', bg: 'var(--type-inne-bg)', skipFreeDays: false },
};

const getPolishHolidays = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  const easter = new Date(year, month - 1, day);
  const easterMonday = new Date(year, month - 1, day + 1);
  const corpusChristi = new Date(year, month - 1, day + 60);

  const format = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return [
    `${year}-01-01`, `${year}-01-06`, `${year}-05-01`, `${year}-05-03`,
    `${year}-08-15`, `${year}-11-01`, `${year}-11-11`, `${year}-12-25`, `${year}-12-26`,
    format(easter), format(easterMonday), format(corpusChristi)
  ];
};

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  const [vacations, setVacations] = useState(() => {
    const saved = localStorage.getItem('vacations');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('WYPOCZYNKOWY');
  const [leaveNote, setLeaveNote] = useState('');
  
  const [totalVacationDays, setTotalVacationDays] = useState(() => {
    const saved = localStorage.getItem('totalVacationDays');
    return saved ? JSON.parse(saved) : 26;
  });
  const [isEditingTotal, setIsEditingTotal] = useState(false);

  useEffect(() => {
    localStorage.setItem('vacations', JSON.stringify(vacations));
  }, [vacations]);

  useEffect(() => {
    localStorage.setItem('totalVacationDays', JSON.stringify(totalVacationDays));
  }, [totalVacationDays]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const emptyDays = Array((firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1)).fill(null);
  const currentHolidays = getPolishHolidays(currentDate.getFullYear());

  const isHoliday = (date) => {
    const format = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return currentHolidays.includes(format(date));
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
    const tzOffset = day.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(day - tzOffset)).toISOString().split('T')[0];
    setEndDate(localISOTime);
    setIsModalOpen(true);
  };

  const handleSaveVacation = () => {
    if (!selectedDate) return;
    const start = new Date(selectedDate);
    const end = endDate ? new Date(endDate) : new Date(selectedDate);
    
    if (end < start) {
      alert('Data końcowa nie może być wcześniejsza niż początkowa.');
      return;
    }

    let loopDate = new Date(start);
    const newEntries = [];
    const datesToRemove = [];
    const typeConfig = VACATION_TYPES[leaveType];

    while (loopDate <= end) {
      const isWeekendDay = loopDate.getDay() === 0 || loopDate.getDay() === 6;
      const isHolidayDay = isHoliday(loopDate);
      if (typeConfig.skipFreeDays && (isWeekendDay || isHolidayDay)) {
        loopDate.setDate(loopDate.getDate() + 1);
        continue;
      }
      datesToRemove.push(loopDate.toDateString());
      newEntries.push({
        id: Date.now().toString() + Math.random().toString(),
        date: new Date(loopDate).toISOString(),
        type: leaveType,
        note: leaveNote,
      });
      loopDate.setDate(loopDate.getDate() + 1);
    }

    if (newEntries.length === 0) {
      alert('Wybrany zakres obejmuje wyłącznie dni wolne.');
      setIsModalOpen(false);
      return;
    }

    const filteredVocations = vacations.filter(v => !datesToRemove.includes(new Date(v.date).toDateString()));
    setVacations([...filteredVocations, ...newEntries]);
    setIsModalOpen(false);
    setLeaveNote('');
  };

  const handleDeleteBlock = (ids) => setVacations(vacations.filter(v => !ids.includes(v.id)));
  const getVacationForDay = (date) => vacations.find(v => new Date(v.date).toDateString() === date.toDateString());

  const usedVacationDays = vacations.filter(v => v.type === 'WYPOCZYNKOWY').length;
  const remainingVacationDays = totalVacationDays - usedVacationDays;
  const weekendDaysWorked = vacations.filter(v => v.type === 'PRACA_WEEKEND').length;
  const weekendDaysRecovered = vacations.filter(v => v.type === 'ODBIOR').length;
  const daysToRecover = weekendDaysWorked - weekendDaysRecovered;

  const getVacationBlocks = () => {
    if (vacations.length === 0) return [];
    const sorted = [...vacations].sort((a, b) => new Date(a.date) - new Date(b.date));
    const blocks = [];
    let currentBlock = { ...sorted[0], endDate: sorted[0].date, ids: [sorted[0].id] };

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      const prevDate = new Date(currentBlock.endDate);
      const currDate = new Date(curr.date);
      const diffDays = Math.round(Math.abs(currDate - prevDate) / (1000 * 60 * 60 * 24));
      const typeConfig = VACATION_TYPES[currentBlock.type];
      const isContinuous = typeConfig.skipFreeDays ? diffDays <= 4 : diffDays === 1;

      if (isContinuous && curr.type === currentBlock.type && curr.note === currentBlock.note) {
        currentBlock.endDate = curr.date;
        currentBlock.ids.push(curr.id);
      } else {
        blocks.push(currentBlock);
        currentBlock = { ...curr, endDate: curr.date, ids: [curr.id] };
      }
    }
    blocks.push(currentBlock);
    return blocks;
  };

  const formatBlockDate = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    if (s.toDateString() === e.toDateString()) return s.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
    return `${s.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} - ${e.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const handleExport = () => {
    const dataToExport = {
      vacations,
      totalVacationDays
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Urlopy-Backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.vacations && Array.isArray(data.vacations)) {
          setVacations(data.vacations);
        }
        if (data.totalVacationDays !== undefined) {
          setTotalVacationDays(data.totalVacationDays);
        }
        alert('Kopia zapasowa wczytana pomyślnie!');
      } catch (err) {
        alert('Wystąpił błąd podczas czytania pliku JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input so the same file could be loaded again
  };

  const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
  const dayNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

  return (
    <div className="app-container">
      <header>
        <div className="header-top">
          <div className="logo">
            <CalendarIcon size={24} />
            <h1>Mój Urlop</h1>
          </div>
          <div className="stats-pill">
            <span>Urlop: {usedVacationDays}/</span>
            {isEditingTotal ? (
              <input 
                type="number" 
                value={totalVacationDays}
                onChange={(e) => setTotalVacationDays(Number(e.target.value))}
                onBlur={() => setIsEditingTotal(false)}
                autoFocus
                style={{ width: '40px', padding: '2px', borderRadius: '4px', color: '#0f172a' }}
              />
            ) : (
              <span onClick={() => setIsEditingTotal(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {totalVacationDays} <Pencil size={10} />
              </span>
            )}
            <span style={{ marginLeft: '8px', opacity: 0.8, paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.3)' }}>
              Zostało: <strong>{remainingVacationDays}</strong>
            </span>
          </div>
          <button className="btn-icon" onClick={toggleTheme} style={{ color: 'white' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        
        <div className="header-bottom">
          {daysToRecover > 0 && <div className="recovery-pill">Dni do odbioru za weekend: {daysToRecover}</div>}
        </div>
      </header>

      <main>
        <div className="card">
          <div className="calendar-header">
            <button className="btn-icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
              <ChevronLeft size={24} />
            </button>
            <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <button className="btn-icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="weekday-grid">
            {dayNames.map(d => <div key={d} className="weekday">{d}</div>)}
          </div>

          <div className="calendar-grid">
            {emptyDays.map((_, i) => <div key={`e-${i}`} className="empty-cell" />)}
            {daysInMonth.map(day => {
              const vacation = getVacationForDay(day);
              const isToday = new Date().toDateString() === day.toDateString();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isHol = isHoliday(day);
              
              return (
                <button 
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`day-cell ${isToday ? 'today' : ''} ${isWeekend || isHol ? 'weekend' : ''} ${vacation ? 'has-vacation' : ''}`}
                  style={vacation ? { backgroundColor: VACATION_TYPES[vacation.type].bg, color: VACATION_TYPES[vacation.type].color } : {}}
                >
                  {day.getDate()}
                  {vacation && <div className="vacation-dot" style={{ backgroundColor: VACATION_TYPES[vacation.type].color }} />}
                </button>
              );
            })}
          </div>
        </div>

        <section>
          <h3 className="section-title">Zaplanowane przerwy</h3>
          {getVacationBlocks().length === 0 ? (
            <div className="text-center" style={{ padding: '2rem', opacity: 0.5, fontSize: '0.9rem' }}>Brak zaplanowanych urlopów</div>
          ) : (
            getVacationBlocks().map(block => (
              <div key={block.id} className="vacation-block">
                <div className="block-info">
                  <div className="block-indicator" style={{ backgroundColor: VACATION_TYPES[block.type].color }} />
                  <div>
                    <div className="block-date">{formatBlockDate(block.date, block.endDate)}</div>
                    <div className="block-label">{VACATION_TYPES[block.type].label} {block.ids.length > 1 && `(${block.ids.length} dni)`}</div>
                    {block.note && <div className="block-note">{block.note}</div>}
                  </div>
                </div>
                <button className="btn-icon" onClick={() => handleDeleteBlock(block.ids)}><Trash2 size={18} /></button>
              </div>
            ))
          )}
        </section>

        <section className="backup-section">
          <h3 className="section-title">Kopia zapasowa danych (Local-First)</h3>
          <div className="backup-actions">
            <button className="btn btn-secondary backup-btn" onClick={handleExport}>
              <Download size={18} /> Zapisz układ w .json
            </button>
            <label className="btn btn-secondary backup-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
              <Upload size={18} /> Wczytaj układ z kopii
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
          <p className="backup-info">
            Twoje dane są bezpieczne i nigdy nie opuszczają Twojej przeglądarki. 
            Wczytaj kopię klikając przycisk wyżej, jeżeli straciłeś dostęp do starych urlopów na nowym telefonie.
          </p>
        </section>
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dodaj nieobecność</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <div className="date-inputs">
              <div className="input-group">
                <label>Od:</label>
                <div className="date-display">{selectedDate?.toLocaleDateString('pl-PL')}</div>
              </div>
              <div className="input-group">
                <label>Do:</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  min={selectedDate ? new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0] : ''}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Typ:</label>
              <div className="type-selector">
                {Object.entries(VACATION_TYPES).map(([key, val]) => (
                  <button 
                    key={key} 
                    className={`type-btn ${leaveType === key ? 'active' : ''}`}
                    onClick={() => setLeaveType(key)}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Notatka:</label>
              <input type="text" value={leaveNote} onChange={e => setLeaveNote(e.target.value)} placeholder="np. Wyjazd..." />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Anuluj</button>
              <button className="btn btn-primary" onClick={handleSaveVacation}>Zapisz urlop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
