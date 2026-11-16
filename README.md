# Staff Movement — Google Sheets + Apps Script

A staff sign-out / sign-in web app. Google Sheets stores staff, destinations and movement history; Apps Script provides the web app backend.

## Install it from your Google Sheet

1. Open or create the Google Sheet that will hold the data.
2. Choose **Extensions → Apps Script**.
3. In the script editor, replace the contents of `Code.gs` with the code in this repository's `Code.gs`.
4. Click **+ → HTML**, name the file exactly `index` (Apps Script will display it as `index.html`), and paste in this repository's `index.html`.
5. Save, select `setupStaffMovement` and click **Run**. Approve the requested Google permissions.
6. Return to the spreadsheet. The setup creates **Staff**, **Locations**, and **Movement Log** tabs.
7. On the **Staff** tab, replace the grey example row with staff names, email addresses (optional), and set Active to TRUE. Add one person per row. On **Locations**, edit the destinations and set Active to TRUE for those in use.
8. In Apps Script choose **Deploy → New deployment → Web app**.
   - Execute as: **Me** (the spreadsheet owner)
   - Who has access: preferably **your school Google Workspace users**. If your school does not use Workspace, choose the narrowest access option suitable for your school.
9. Deploy, authorise, and share the web app URL with staff.

## Sheets created

- **Staff** — Staff Name, Email, Active
- **Locations** — Destination, Active
- **Movement Log** — append-only sign-out history with return time and duration

## Important privacy notes

- Restrict the spreadsheet and web app to authorised school staff. The web app executes as its deploying owner, so anyone with access to the app may write to the linked spreadsheet.
- Do not deploy publicly. Use your school's Google Workspace access restriction where available.
- Staff names are selected from the Staff tab. This starter version does not implement individual sign-in verification; add Google identity/domain checks or an approved authentication layer before using it for sensitive safeguarding or emergency procedures.
- The live board refreshes every 30 seconds. It is an operational aid, not a substitute for your school's official attendance, fire-register or safeguarding procedures.

## Updating

After changing Apps Script code, save and update the deployment (Deploy → Manage deployments → Edit → New version → Deploy).
