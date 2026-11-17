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

## Automatic Apps Script deployment (one-time setup)

I've added a GitHub Actions workflow. Once the two GitHub secrets below are set, every change to `Code.gs` will automatically upload the code to your existing Apps Script project and update the existing web-app deployment. You will not need to paste code into Apps Script again.

### One-time connection

**A. Enable the Apps Script API**

Open [Apps Script user settings](https://script.google.com/home/usersettings) and switch **Google Apps Script API** on.

**B. Create the Google sign-in credential (on a computer)**

1. Install Node.js if it is not already installed.
2. Open a terminal / command prompt.
3. Run `npm install -g @google/clasp`.
4. Run `clasp login` and sign in with the Google account that owns the Staff Movement Apps Script project.
5. Find the file named `.clasprc.json` in your user home folder. It contains a refresh token. Keep it private.

**C. Add two GitHub repository secrets**

Open this repository → **Settings → Secrets and variables → Actions → New repository secret**.

Add these exact names:

- `CLASPRC_JSON` — paste the entire contents of your private `.clasprc.json` file.
- `SCRIPT_ID` — in Apps Script, open **Project Settings** (gear icon) and copy the **Script ID**.

Do not paste the credential JSON into ChatGPT, commit it to GitHub, or share it with anyone. It grants access to your Google Apps Script account.

After both secrets are saved, open the repository's **Actions** tab and run **Deploy Google Apps Script** once using **Run workflow**. Future commits to `Code.gs` deploy automatically to the existing web app URL.

If the first run reports that the Apps Script API is disabled, enable it using step A and run the workflow again. If it reports an authorization error, sign in again with `clasp login` and replace the `CLASPRC_JSON` secret with the newly generated file.

