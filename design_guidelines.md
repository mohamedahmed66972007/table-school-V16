# تصميم موقع جدول الحصص - Design Guidelines

## Design Approach
**System-Based Approach** with Arabic-first considerations. Drawing inspiration from modern productivity tools like Notion and Linear, adapted for RTL (Right-to-Left) Arabic interface with enhanced readability and smooth interactions.

## Core Design Principles
- **Arabic-First**: Full RTL support with proper Arabic typography
- **Dark Theme**: Primary dark interface that's easy on the eyes
- **Smooth Interactions**: Fluid animations that enhance usability without distraction
- **Clear Hierarchy**: Strong visual organization for complex scheduling data

---

## Typography System

### Arabic Fonts (Use variety via Google Fonts)
- **Primary Headers**: Cairo (Bold 700) - modern, clean Arabic headlines
- **Secondary Headers**: Tajawal (SemiBold 600) - readable sub-headers
- **Body Text**: IBM Plex Sans Arabic (Regular 400) - excellent readability for long content
- **Data Display**: Almarai (Medium 500) - clear for schedule grids and tables
- **Accent/Instructions**: Noto Kufi Arabic (Regular 400) - friendly for help sections

### Font Sizes
- **Hero/Main Title**: text-5xl md:text-6xl (60px desktop)
- **Section Headers**: text-3xl md:text-4xl (36px desktop)
- **Card Headers**: text-xl md:text-2xl (24px desktop)
- **Body Text**: text-base md:text-lg (18px desktop)
- **Small Labels**: text-sm (14px)
- **Tiny Details**: text-xs (12px)

---

## Layout System

### Spacing Units
Primary spacing palette using Tailwind units: **2, 3, 4, 6, 8, 12, 16**
- Tight spacing: p-2, gap-3
- Standard spacing: p-4, gap-4, m-6
- Section spacing: py-8, py-12, py-16
- Large gaps: gap-8, mb-12

### Container Structure
- Full-width sections with inner `max-w-7xl mx-auto px-4 md:px-6`
- Grid-based schedule tables: Full width within container
- Form sections: `max-w-2xl mx-auto` for focused input areas
- Dashboard cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

---

## Component Library

### Navigation
**Top Navigation Bar** (sticky)
- Dark background (bg-gray-900/95 backdrop-blur-sm)
- Logo on right (RTL), navigation items center-left
- User menu/language selector on far left
- Height: h-16 md:h-20
- Border bottom: border-b border-gray-800

### Buttons

**Primary Button** (+ Create Schedule, Save, Export)
- Rounded: rounded-lg
- Padding: px-6 py-3
- Font: font-semibold text-base
- Hover Animation: Transform scale-105, smooth transition (duration-200)
- Active state: scale-95
- Glow effect on hover: shadow-lg shadow-blue-500/50

**Secondary Button** (Cancel, Back)
- Same dimensions as primary
- Subtle hover: opacity-80
- Border variant: border-2 with hover border color shift

**Icon Button** (Edit, Delete, View)
- Square: w-10 h-10
- Rounded: rounded-md
- Icon size: 20px
- Hover: Background color shift with scale-110

### Cards

**Schedule Grid Card**
- Border: border border-gray-800
- Rounded: rounded-xl
- Padding: p-6
- Hover: Subtle border-gray-700 transition
- Header with icon + title

**Teacher Schedule Card**
- Compact design: p-4
- Badge showing subject/name
- Quick action buttons on hover (Edit, PDF)
- Status indicator (Complete/Incomplete)

**Class Schedule Display Card**
- Table layout with 7 periods × 5 days
- Cell padding: p-3
- Alternating row backgrounds for readability
- Subject name with optional teacher name below in smaller text

### Forms

**Subject/Grade/Section Selectors**
- Custom styled dropdowns (not default browser)
- Height: h-12
- Border: border-2 focus:border-blue-500
- Rounded: rounded-lg
- Clear labels above each field with mb-2
- Help text below in text-sm text-gray-400

**Schedule Grid Input**
- Interactive table cells
- Click to select/edit
- Visual feedback: Hover highlight, selected state with border-2
- Empty cells with dashed border and "+" icon
- Filled cells showing grade/section with small font

### Data Display

**Timetable Grid**
- Table structure with clear headers
- Day names in bold on right (RTL)
- Period numbers across top (1-7)
- Grid lines: border-collapse with border-gray-700
- Cell size: min-h-20 for comfortable reading
- Zebra striping for rows

**PDF Export Preview**
- Modal overlay showing preview
- Options checkboxes: Include teacher names, All classes at once
- Export button with download icon

### Modals & Overlays

**Create New Schedule Modal**
- Centered overlay: backdrop blur
- Max width: max-w-md
- Animation: Slide from top with fade-in
- Close button (X) on top-left corner (RTL)

**Instructions Overlay**
- Side panel: Slide from right (RTL)
- Full height, scrollable
- Width: w-96
- Step-by-step with numbered sections
- Illustrations/icons for each step

---

## Animation Guidelines

### Button Interactions
- All buttons: `transition-all duration-200 ease-out`
- Hover: `hover:scale-105`
- Active: `active:scale-95`
- Focus rings with offset for accessibility

### Page Transitions
- Minimal, smooth fade-ins for content loading
- Stagger animations for card grids: Sequential reveal with 50ms delay

### Interactive Elements
- Dropdown menus: Slide down with fade (duration-150)
- Tooltips: Fade in (duration-100)
- Schedule cell selection: Instant visual feedback with pulse effect

### Restricted Animations
- No auto-playing animations
- No parallax effects
- No continuous/infinite animations
- Animations only on user interaction

---

## Instructions Page Layout

### Structure
Single-column layout with max-w-4xl, divided into clear sections:

1. **Welcome Section** (py-16)
   - Large greeting with illustration
   - Brief overview paragraph

2. **Step-by-Step Guide** (grid of cards)
   - Each step in a numbered card
   - Icon + Title + Description + Screenshot placeholder
   - 3-column grid on desktop: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

3. **FAQ Accordion** (py-12)
   - Collapsible questions with + icon that rotates
   - Answers with padding revealed on click

4. **Video Tutorial Embed** (if needed)
   - Centered video player: max-w-3xl
   - Rounded corners with shadow

5. **Contact Support Section** (py-8)
   - Simple contact form or email link
   - Bordered card with subtle background

---

## Images

**Hero Section Image**: Not applicable - This is a productivity tool without marketing needs. Focus on immediate functionality.

**Instructional Images**:
- Screenshot placeholders showing: Empty schedule grid, Teacher filling schedule, Generated class timetable, PDF export dialog
- Place within instruction cards with rounded-lg border-2
- Aspect ratio: 16:9 for consistency

**Icons**: Use Heroicons CDN (outline style) for:
- Plus icon (+) for create new
- Calendar icon for schedules
- Download icon for PDF
- User icon for teachers
- Document icon for class schedules
- Question mark for help/instructions
- Check/X for status indicators

---

## Accessibility

- All interactive elements: min-h-12 for touch targets
- Focus indicators: ring-2 ring-offset-2 ring-blue-500
- Semantic HTML throughout
- Proper ARIA labels for all form inputs
- Screen reader friendly table structures
- High contrast text on dark backgrounds

---

## Responsive Behavior

**Mobile (base)**
- Single column layouts
- Full-width buttons
- Collapsible schedule grid (horizontal scroll with sticky headers)
- Bottom navigation for quick actions

**Tablet (md:)**
- 2-column grids for cards
- Side-by-side forms where appropriate

**Desktop (lg:)**
- 3-column grids
- Full schedule grid visible without scroll
- Expanded navigation

---

This design creates a professional, smooth, and highly functional Arabic-first scheduling system with excellent dark theme aesthetics and intuitive interactions.