import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronDown, Search, ChevronLeft, ChevronRight, Check } from 'lucide-react'

// --- 1. SEARCHABLE DROPDOWN ---
export const SearchableSelect = ({ label, options, value, onChange, placeholder = "Select...", disabled }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedLabel = options.find(opt => opt.value === value)?.label || ''

  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
      
      <div className="relative">
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg 
            flex justify-between items-center cursor-pointer transition-all
            ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : 'hover:bg-gray-100'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span className={`text-sm ${value ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
            {value ? selectedLabel : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        onChange(opt.value)
                        setIsOpen(false)
                        setSearchTerm('')
                      }}
                      className={`
                        px-3 py-2 text-sm cursor-pointer flex justify-between items-center
                        ${opt.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      {opt.label}
                      {opt.value === value && <Check className="w-3 h-3" />}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-xs text-gray-400 text-center">No results found</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// --- 2. CUSTOM DATE PICKER (Updated with 'align' prop) ---
export const CustomDatePicker = ({ label, value, onChange, disabled, align = "left" }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  // NEW: State to toggle between calendar view and year list
  const [isYearSelection, setIsYearSelection] = useState(false) 
  
  const wrapperRef = useRef(null)
  
  const dateValue = value ? new Date(value) : new Date()
  const [currentMonth, setCurrentMonth] = useState(dateValue)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
        setIsYearSelection(false) // Reset view on close
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const handleDateClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const offset = newDate.getTimezoneOffset()
    const adjustedDate = new Date(newDate.getTime() - (offset * 60 * 1000))
    onChange(adjustedDate.toISOString().split('T')[0])
    setIsOpen(false)
  }

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1))
  }

  // NEW: Handle clicking a year from the list
  const handleYearChange = (year) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1))
    setIsYearSelection(false)
  }

  // Generate a range of years (e.g., 1950 - 2050)
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i)

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
      
      <div className="relative">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg 
            flex items-center gap-2 text-sm text-left transition-all
            ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : 'hover:bg-gray-100'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className={value ? 'text-gray-900 font-medium' : 'text-gray-400'}>
            {value ? new Date(value).toLocaleDateString() : 'mm/dd/yyyy'}
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={`
                absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 w-64
                ${align === 'right' ? 'right-0' : 'left-0'} 
              `}
            >
              {/* Header Navigation */}
              <div className="flex justify-between items-center mb-4">
                {/* Hide arrows during year selection to avoid confusion */}
                {!isYearSelection ? (
                   <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-4 h-4 text-gray-600"/></button>
                ) : <div className="w-6"></div>}
                
                {/* CHANGED: This is now a clickable button */}
                <button 
                  onClick={() => setIsYearSelection(!isYearSelection)}
                  className="font-semibold text-sm text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </button>

                {!isYearSelection ? (
                  <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight className="w-4 h-4 text-gray-600"/></button>
                ) : <div className="w-6"></div>}
              </div>

              {/* CONDITIONAL CONTENT */}
              {isYearSelection ? (
                // YEAR SELECTION VIEW
                <div className="h-48 overflow-y-auto grid grid-cols-3 gap-2 pr-1 custom-scrollbar">
                  {years.map(year => (
                    <button
                      key={year}
                      onClick={() => handleYearChange(year)}
                      className={`
                        text-xs py-2 rounded-md transition-colors
                        ${year === currentMonth.getFullYear() 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              ) : (
                // STANDARD CALENDAR VIEW (Your original code)
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['S','M','T','W','T','F','S'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-400 mb-2">{d}</div>
                  ))}
                  
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const isSelected = value && new Date(value).getDate() === day && 
                                     new Date(value).getMonth() === currentMonth.getMonth() &&
                                     new Date(value).getFullYear() === currentMonth.getFullYear()
                    
                    return (
                      <button
                        key={day}
                        onClick={() => handleDateClick(day)}
                        className={`
                          text-sm p-1.5 rounded-full hover:bg-blue-50 transition-colors
                          ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700'}
                        `}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}