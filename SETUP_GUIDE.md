# Prime Builder — Setup Guide

This is your real estate website for **Prime Builder**, built for 2BHK, 3BHK and
4BHK homes in West Delhi. It has three parts:

1. **The main website** — what your customers see (Home, Properties, Gallery, Contact)
2. **The admin panel** — a separate page only you can access, to add/edit properties and gallery photos
3. **The backend + database** — runs on a server, stores everything permanently (not in the browser)

This guide assumes you have **never used Node.js before**. Follow every step in order.

---

## Part 1 — Install Node.js (one-time, on your computer)

1. Go to **https://nodejs.org**
2. Download the **LTS** version (the button that says "Recommended for most users")
3. Run the installer, click Next through all steps with default options
4. To check it worked, open:
   - **Windows**: search for "Command Prompt" in the Start menu and open it
   - **Mac**: search for "Terminal" using Spotlight (Cmd + Space) and open it
5. Type this and press Enter:
   ```
   node --version
   ```
   You should see something like `v22.x.x`. If you see an error, restart your computer and try again.

---

## Part 2 — Get the project files onto your computer

1. Download/extract the `prime-builder` folder you received from this chat to somewhere easy to find, like your Desktop.
2. Open Command Prompt / Terminal.
3. Navigate into the folder. Type `cd ` (with a space after) then drag the `prime-builder` folder into the terminal window, then press Enter. It should look like:
   ```
   cd /Users/yourname/Desktop/prime-builder
   ```

---

## Part 3 — Install the project's dependencies

Still inside the `prime-builder` folder in your terminal, type:

```
npm install
```

Press Enter and wait. This downloads the small pieces of code (Express, etc.) the website needs to run. It may take 1–3 minutes. You'll see a folder called `node_modules` appear — that's normal, don't touch it.

Everything this project uses is plain JavaScript with no extra compiling step, so `npm install` should complete cleanly on any Windows or Mac machine with Node.js installed — no extra build tools needed.

---

## Part 4 — Set up your configuration file

1. In the `prime-builder` folder, find the file named `.env.example`.
2. Make a copy of it and rename the copy to exactly `.env` (no `.example` at the end).
3. Open `.env` in any text editor (Notepad, TextEdit, VS Code, etc.) and fill in:
   - `JWT_SECRET` — replace with any long random sentence, e.g. `purple-tiger-jumps-7392-delhi-west`
   - `ADMIN_USERNAME` and `ADMIN_PASSWORD` — choose your own admin login (don't keep the defaults once live)
   - WhatsApp numbers are already set to your numbers (9310812957 and 8587820230)
4. Save the file.

**Keep `.env` private.** Never share it or upload it anywhere public — it has your admin password.

### Setting up your database (required)

This site stores its data (properties, settings, blog posts, testimonials, inquiries, gallery info) in a free **Supabase** database. Photos and videos themselves still go to Cloudinary as before — Supabase only stores the text/structured data.

1. Go to **https://supabase.com**, create a free account, and create a new project (pick any name and a strong database password — save that password somewhere safe, you won't need it day-to-day but it's good to have).
2. Once the project is ready, open the **SQL Editor** (left sidebar) → **New Query**.
3. Open the included `supabase-schema.sql` file from this project, copy its entire contents, paste into the SQL Editor, and click **Run**. This creates all the tables the site needs. You only need to do this once.
4. Go to **Settings → API** (left sidebar, gear icon).
5. Copy the **Project URL** and paste it into `.env`:
   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   ```
6. Copy the **service_role** key (NOT the `anon` key — scroll to find "service_role" under Project API keys) and paste it into `.env`:
   ```
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```

⚠️ **The service_role key is highly sensitive** — it can read and write your entire database with no restrictions. Never share it, never commit it to GitHub, never paste it anywhere public. It only ever goes in your private `.env` file (locally) and your hosting provider's environment variables (when deployed).

7. Run `npm run seed` once to load starter properties, testimonials, and blog posts into your new database.

If you ever need to wipe and restart your data, you can run the SQL `truncate` commands in the Supabase SQL Editor for the relevant tables, then run `npm run seed` again.

### Setting up email confirmations (optional but recommended)

When someone submits the contact form, the site can automatically email them a confirmation and email you a notification. This uses a free service called **Resend**.

1. Go to **https://resend.com** and create a free account (3,000 emails/month free — more than enough).
2. In the Resend dashboard, go to **API Keys** → **Create API Key**. Copy the key.
3. Open your `.env` file and paste it in:
   ```
   RESEND_API_KEY=re_your_key_here
   ```
4. Leave `FROM_EMAIL` as the default for now — this lets you send immediately using Resend's shared address while testing.
5. To send from your own domain later (e.g. `enquiry@primebuilder.in` instead of Resend's address):
   - In the Resend dashboard, go to **Domains** → **Add Domain**, enter `primebuilder.in`
   - Resend gives you 2-3 DNS records (TXT/CNAME) to add
   - Log into wherever you bought your domain (GoDaddy, Namecheap, etc.) → DNS settings → add those records
   - Wait for Resend to show the domain as "Verified" (usually a few minutes, sometimes longer)
   - Then update `.env`:
     ```
     FROM_EMAIL=Prime Builder <enquiry@primebuilder.in>
     ```
6. Make sure your **Contact Email** in the admin Settings page (or `OWNER_EMAIL` in `.env`) is the address where you want to receive new-enquiry notifications.

If you skip this section entirely, the contact form still works perfectly and inquiries still appear in your admin panel — you just won't get the automatic emails until you add a Resend API key.

---

## Part 5 — Add starter sample data (optional but recommended first time)

This adds 6 sample properties and 3 testimonials so the site isn't empty while you're testing. You can delete/edit them later from the admin panel.

```
npm run seed
```

You'll see a confirmation message. This is safe to run only once — running it again won't duplicate data if properties already exist.

---

## Part 6 — Start the website

```
npm start
```

You should see:
```
Prime Builder server running at http://localhost:3000
Admin panel available at  http://localhost:3000/admin.html
```

Now open your web browser and go to:
- **http://localhost:3000** → your main website
- **http://localhost:3000/admin** → your admin panel (log in with the username/password you set in `.env`)

To stop the server, go back to the terminal and press `Ctrl + C`.

Every time you want to test the site again later, just run `npm start` again from inside the `prime-builder` folder.

---

## Part 7 — Using the Admin Panel

Go to `http://localhost:3000/admin` and log in.

**Properties tab**: Add a property → fill in BHK, locality, price, area, etc → upload photos (you can select up to 10 at once) → Save. It appears on the live site immediately.

**Gallery tab**: Two ways to add content —
- **Upload a file**: pick any photo or short video from your computer/phone, optionally add a caption, click Upload. It's saved on your server and appears on the live Gallery page right away.
- **Add a YouTube video**: if you already have a video on YouTube, copy its video ID from the URL (e.g. in `youtube.com/watch?v=dQw4w9WgXcQ`, the ID is `dQw4w9WgXcQ`) and paste it in — no file upload needed.

**Inquiries tab**: Every contact form submission appears here. Click "WhatsApp" next to any entry to reply directly. If email confirmations are set up, the customer and you both get an email automatically the moment they submit the form.

**Homepage Videos tab**: Upload short video clips (with an optional cover image) to appear in a floating, auto-scrolling row near the bottom of the homepage. Each plays silently on loop until a visitor clicks "View" to watch it full-size with sound. Up to 7 at a time — delete an old one to add a new one.

**Testimonials tab**: Add client reviews shown on the Gallery page and on the matching locality page (e.g. a Janakpuri testimonial also shows on `/janakpuri.html`).

**Blog tab**: Write posts to publish on `/blog.html`. Use the "Post Content" box with simple `<h3>` and `<p>` tags to format your writing — see the sample posts already seeded for examples. Toggle "Published" off to save a draft without it going live. Posts you publish automatically get a clean URL slug from the title.

**Settings tab**: Update WhatsApp numbers, Instagram/Facebook links, office address/hours, email, RERA registration number, Google review link + rating, and the homepage stat numbers (properties sold, families, years) — all without touching code. Your Instagram (@primebuilders230) and Facebook page are pre-filled; the icons appear in the footer of every page and on the Contact page. Once you add your RERA number and Google review link here, they automatically appear in the site footer, the Contact page, and the Gallery page.

---

## Part 7.5 — New pages added: Localities & Blog

Two new things were added beyond the original site:

**Locality pages** — `/janakpuri.html`, `/rajouri-garden.html`, `/tilak-nagar.html`, `/vikaspuri.html`, `/paschim-vihar.html`, and `/uttam-nagar.html` are dedicated landing pages for each area, with their own title/description for search engines, locally-relevant copy, and a live feed of available properties in that locality (pulled automatically from whatever you've added in the Properties tab — no extra work needed). They're linked from the Properties page ("Browse by locality") and cross-link to each other.

**Blog** — `/blog.html` lists published posts; each post gets its own page at `/blog-post.html?slug=...`. Manage posts from the new Blog tab in the admin panel. Three starter posts are included via `npm run seed` so the page isn't empty on first run.

---

## Part 8 — Putting the website on the internet (so anyone can visit it)

Right now the site only works on your own computer (`localhost`). To make it a real public website, you need to host it somewhere. Two good free/cheap options for a Node.js site backed by Supabase + Cloudinary like this:

### Option A: Render.com (recommended — simplest)

1. Create a free account at **render.com**
2. Push your `prime-builder` folder to a GitHub repository (Render deploys from GitHub)
   - If you don't know Git yet: search "how to upload a folder to GitHub" — GitHub Desktop app is the easiest way for beginners
3. In Render, click **New → Web Service**, connect your GitHub repo
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add every value from your `.env` file — `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, your Cloudinary keys, and (if set up) your Resend email keys. Render has a section for this in the dashboard. **Don't skip `SUPABASE_URL` / `SUPABASE_SERVICE_KEY`** — without them the site has nowhere to read or save data.
6. Click Deploy. Render gives you a live URL like `prime-builder.onrender.com`.

Because all your real data lives in Supabase (not on Render's own disk) and all photos/videos live in Cloudinary, **redeploying or restarting the Render service never wipes your data** — you don't need a paid Render Disk for this. Pushing new code is always safe.

### Option B: Railway.app

Very similar process to Render — connect GitHub, set the same start command (`npm start`), add the same environment variables (including `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`), deploy. No persistent volume needed, for the same reason as Render above — your data lives in Supabase and Cloudinary, not on Railway's own disk.

### After deploying

- Your live site: `https://your-app-name.onrender.com`
- Your admin panel: `https://your-app-name.onrender.com/admin`
- If you want a custom domain (like `primebuilder.in`), buy it from any domain registrar and point it to your Render/Railway app using their custom domain settings (both platforms have a guide for this in their dashboard).

If any of this feels confusing when you get there, come back and ask — I can walk through the exact Render dashboard steps with you.

---

## Common Issues

**"npm: command not found"** → Node.js isn't installed correctly. Reinstall from nodejs.org and restart your computer.

**"Port 3000 is already in use"** → Another program is using that port. Either close it, or open `.env` and change `PORT=3000` to `PORT=3001`, then visit `http://localhost:3001` instead.

**Photos don't show up after uploading** → Check that your Cloudinary credentials in `.env` (or your hosting provider's environment variables) are correct — `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Photos and videos upload directly to Cloudinary, so a typo in these three values is the most common cause.

**Forgot admin password** → Open `.env`, find `ADMIN_PASSWORD`, change it to something new, save, and restart the server (`Ctrl+C` then `npm start` again).

**Properties/settings disappeared** → Your data lives in Supabase now, not in a local file, so it won't be wiped by restarting or redeploying the server. If something really is missing, check: (1) your `.env` (or hosting provider's environment variables) still has the correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` — wrong or swapped values will silently point at the wrong project, and (2) you're looking at the same Supabase project where you ran `supabase-schema.sql` and `npm run seed`.

---

## What's Inside (for reference)

```
prime-builder/
├── server/              ← backend code (Node.js + Express)
│   ├── db/               connects to Supabase (store.js) & sample data (seed.js)
│   ├── middleware/       admin login check, file upload handling
│   ├── routes/           API endpoints (properties, gallery, inquiries, settings, blog)
│   ├── uploads/          (legacy folder, kept for compatibility — actual files live on Cloudinary)
│   └── index.js          starts the whole server
├── public/               ← frontend (what visitors see in their browser)
│   ├── index.html        Home page
│   ├── properties.html   Property listings page
│   ├── gallery.html       Gallery page
│   ├── contact.html      Contact page
│   ├── blog.html          Blog listing page
│   ├── blog-post.html     Single blog post page
│   ├── janakpuri.html, rajouri-garden.html, tilak-nagar.html,
│   │   vikaspuri.html, paschim-vihar.html, uttam-nagar.html
│   │                      Locality landing pages
│   ├── admin.html        Admin panel (separate, password-protected)
│   ├── css/               styling
│   ├── js/                 page behavior
│   └── images/            logo & favicon
├── .env                  ← your private settings (passwords, Supabase keys, etc.) — you create this
├── .env.example           template for .env
├── supabase-schema.sql    ← run this once in the Supabase SQL Editor to create your tables
└── package.json           project info & dependency list
```

Your actual data (properties, settings, blog posts, testimonials, inquiries) lives in your Supabase project, not in this folder — that's what makes it safe across redeploys.
