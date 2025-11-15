# **App Name**: Ephemeral Notes

## Core Features:

- Note Creation: Allow users to create simple text-based notes with custom URLs. The notes will expire after 30 days.
- Unique URL Generation: Generate short, unique URLs (e.g., x.com/XJUV) for each note.
- Note Storage: Store notes in Firestore, including content and expiry timestamps. Utilize separate security rules for data validation and access control.
- Note Expiration: Implement automatic deletion of notes older than 30 days using a scheduled function.
- User Authentication: Enable user registration/login via email/password and Google using Firebase Authentication.
- Note Listing: Provide a user interface to list the notes that created by the logged-in user

## Style Guidelines:

- Primary color: Soft purple (#A098D3) to suggest sophistication and dependability.
- Background color: Very light purple (#F3F2F8), for a muted, unobtrusive background.
- Accent color: Bluish-purple (#736DAB) for interactive elements, to make them clearly stand out.
- Body and headline font: 'Inter', a sans-serif with a modern and neutral appearance.
- Use simple, outline-style icons for note creation, listing, and user profile.
- Employ a clean, minimalist layout with ample whitespace for readability. Focus on a single-column layout for note display and creation on mobile.
- Use subtle animations for note creation, deletion, and login transitions to improve user engagement.