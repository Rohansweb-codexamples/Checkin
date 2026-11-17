# Rohan's Hotel Staff Movement

## Exact Google Sheet layout
Use the existing first tab named `Sheet1`:
- A1: `MEMBER`
- B1: `WHERE`
- A2 downward: one staff member per row
- B2 downward: leave blank when they are in; the kiosk writes their reason when they are out.

The screenshot you provided has the correct two-column header layout. Add staff names in column A before opening the kiosk.

## Apps Script
1. Open the Staff Movement spreadsheet → Extensions → Apps Script.
2. Replace all of `Code.gs` with this repository's `Code.gs`. No HTML files are needed in Apps Script.
3. Run `setupStaffMovement()` once and approve access.
4. Deploy → Manage deployments → Edit → New version → Deploy as a Web app. Execute as Me. Set access to the intended users.
5. Keep the deployed /exec URL in the API constant in `index.html` and `kiosk.html`.

## GitHub Pages
- Root `index.html` is the admin dashboard. It shows all staff as In or Out and their reason, with counts and a link to the kiosk.
- `kiosk.html` is the staff kiosk. Staff tap their name, choose Lunch, Break, Fresh air, Dinner or Breakfast, and tap their name again to sign back in.

The system writes directly to column B of the same sheet. Blank = In; a reason = Out. The admin refreshes automatically every 20 seconds.

Because this is a shared kiosk and admin page, restrict access to the intended organisation. It does not verify each person's identity and should not be the sole emergency or safeguarding register.