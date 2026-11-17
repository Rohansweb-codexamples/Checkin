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

GitHub Actions can publish changes to `Code.gs` automatically. The GitHub Pages HTML files are not uploaded to Apps Script.

### Required GitHub Actions secrets

In the repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

- `CLASPRC_JSON`: the complete contents of the `.clasprc.json` file created by Google clasp after a one-time CI login.
- `SCRIPT_ID`: the Apps Script project Script ID from **Apps Script → Project Settings → IDs**.
- `DEPLOYMENT_ID`: the deployment ID from the web app URL, the part between `/s/` and `/exec`.

To create the clasp credentials, use a computer with Node.js installed:
1. Install clasp: `npm install -g @google/clasp`.
2. Run `clasp login` and sign in to the Google account that owns the Apps Script project.
3. Run `clasp login --status` to confirm the account, then use the clasp CI-login flow supported by your installed clasp version to create its `.clasprc.json` credentials file.
4. Add the complete JSON file contents as the `CLASPRC_JSON` repository secret. Never commit this credentials file to GitHub.

After these three secrets are added, every push that changes `Code.gs` triggers a push to Apps Script and updates the existing deployment. You can also run it manually from **Actions → Deploy Google Apps Script → Run workflow**.

**Important:** The manifest preserves the web app's public access setting as `ANYONE`. If your existing deployment is restricted to your organisation, keep its existing access setting instead and do not change it to public. The first automated deployment may require you to authorize clasp/API access. Do not share the credentials JSON in chat or commit it to the repository.
