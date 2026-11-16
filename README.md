# Rohan's Hotel Staff Kiosk

The kiosk interface is hosted on GitHub Pages. Apps Script contains only the Google Sheets API in `Code.gs` — no Apps Script HTML files are required.

## Setup
1. Open the Google Sheet and choose **Extensions → Apps Script**.
2. Replace `Code.gs` with this repository's `Code.gs`.
3. Run `setupStaffMovement()` once and approve permissions.
4. On the **Staff** tab, replace the example row with staff names and set Active to TRUE.
5. Deploy as a **Web app**, execute as **Me**, and restrict access to your intended staff group.
6. Copy the deployed `/exec` URL into the `API` constant in `index.html`.
7. Publish with GitHub Pages.

Staff tap their name. If signed in, they choose **Lunch**, **Break**, **Fresh air**, **Dinner**, or **Breakfast**. If already signed out, they can tap **Sign back in**. The kiosk never displays a list of who is out. All movements are recorded in the Google Sheet's **Movement Log**.

After editing Apps Script, use **Deploy → Manage deployments → Edit → New version → Deploy**. A shared kiosk does not verify each staff member's identity; restrict access and do not use it as the sole emergency or safeguarding register.