# UPGB Recovery Portal

A web-based portal for the UPGB Recovery Department (Shahjahanpur Region) to manage staff contacts and send WhatsApp broadcasts.

## Features
*   **Staff Directory**: View and manage contact details of staff (BM, Clerk, etc.) synced with Google Sheets.
*   **Broadcast Messaging**: Send WhatsApp messages (via UltraMsg) to specific groups or individuals.
*   **Dynamic Groups**: Automatically fetches roles (e.g., Manager, Assistant) from the "Role" column in your Google Sheet.
*   **Review Recipients**: See exactly who will receive the message and uncheck individuals if needed.
*   **Status Tracking**: View history of sent messages and delivery status.

## How to Deploy (GitHub Pages)

1.  **Create a Repository**:
    *   Go to GitHub.com and create a new public repository.
2.  **Upload Files**:
    *   Upload all files in this folder (`index.html`, `dashboard.html`, `styles.css`, `app.js`, `background.png`) to the repository.
    *   *Note: `code.js` is for Google Apps Script and does not need to be uploaded, but you can keep it there for backup.*
3.  **Enable Pages**:
    *   Go to **Settings** > **Pages**.
    *   Under **Build and deployment** > **Source**, select **Deploy from a branch**.
    *   Select **main** (or **master**) branch and **/ (root)** folder.
    *   Click **Save**.
4.  **Done!**:
    *   GitHub will provide you a URL (e.g., `yourname.github.io/repo-name/`).
    *   Share this URL with your team.

## Configuration
*   **Frontend**: `app.js` contains the `SCRIPT_URL` which points to your Google Apps Script Web App.
*   **Backend**: The properties (Sheet ID, API Tokens) are managed in the Google Apps Script project (`code.js`).
