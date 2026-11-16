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


## Rohan's Hotel kiosk and manager dashboard

The project now includes two additional pages served by the same Apps Script deployment:

- **Staff kiosk:** open the deployed web app URL with `?page=kiosk`. This is the dark, front-desk screen branded for Rohan's Hotel. Staff can sign out / back in and see the live whereabouts board.
- **Manager admin:** open the deployed web app URL with `?page=admin`. Managers can add or edit staff, activate/deactivate staff, manage selectable destinations, view recent movement history, and mark someone as returned if they forget to sign back in.

### Configure the admin PIN

1. In the bound spreadsheet, open **Extensions → Apps Script**.
2. Select `setAdminPin` in the function list and click **Run**.
3. Enter a private PIN of at least 6 characters in the prompt. To change it later, run the same function again.
4. Give the PIN only to managers. The PIN is stored in the Apps Script project's Script Properties, not in the HTML files or spreadsheet cells.

After adding these files or changing Apps Script code, save and update the existing web app deployment to a new version. The kiosk and admin pages use the same underlying spreadsheet and movement log.

**Security:** the PIN gate protects the admin interface, but the standard kiosk sign-out functions are designed for staff using a shared terminal and do not verify each person's identity. Restrict the deployment to the intended organisation and do not use this as the sole emergency or safeguarding register.


## GitHub Pages connection

The GitHub Pages `index.html` and `kiosk.html` forward visitors to the deployed Google Apps Script kiosk URL. The GitHub Pages `admin.html` forwards managers to the Apps Script admin route. This is intentional: the actual data operations use `google.script.run`, which is available in the Apps Script-hosted pages, not on a normal static GitHub Pages site. The Apps Script deployment is therefore the live application and Google Sheet backend; GitHub Pages provides the public entry URLs.

Configured Apps Script deployment: https://script.google.com/macros/s/AKfycbx9Dvu2Z1Vq5HOl-x2RPsD5SkWCVvWhTZR258Qu8EijtTcY4XrnPUcMU_IcNjwx-YnL/exec

- Kiosk: `https://script.google.com/macros/s/AKfycbx9Dvu2Z1Vq5HOl-x2RPsD5SkWCVvWhTZR258Qu8EijtTcY4XrnPUcMU_IcNjwx-YnL/exec?page=kiosk`
- Admin: `https://script.google.com/macros/s/AKfycbx9Dvu2Z1Vq5HOl-x2RPsD5SkWCVvWhTZR258Qu8EijtTcY4XrnPUcMU_IcNjwx-YnL/exec?page=admin`

If you create a new Apps Script deployment later, update the destination URL in all three GitHub Pages HTML files.
