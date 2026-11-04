[README.md](https://github.com/user-attachments/files/34344170/README.md)# Email Shaker

Paste a parent recruitment email template, add the experimenter's, parent's and child's names, and get a fresh version to copy into your email. Every link, email address, dollar amount, time, number and `[[locked]]` passage is checked against the original.

## What's in this repo

| File | What it does |
| --- | --- |
| `index.html` | The whole web page (works on its own). |
| `api/shake.js` | A small server function that asks Claude for a rewrite. It keeps your API key secret. |
| `vercel.json`, `package.json` | Settings for Vercel. |

## Writing a template

- Put names in as `[experimenter's name]`, `[parent's name]`, `[child's name]` (or use the Insert buttons).
- Wrap wording that must not change, such as consent or IRB language, in `[[double brackets]]`.
- Start the first line with `Subject:` to set the subject line.
- Type the actual names in the **Names** boxes, not in the template.
- Quick shuffle picks an opener line from **Opener lines for Quick shuffle**. Edit that list to add your own, one per line; `{weekday}` becomes today's day. Your list is saved in your browser.

Real names never leave the browser. The server and Claude only see the bracketed placeholders.

---

## Step 1: Put the files on GitHub

**Using the website (no command line):**

1. Go to [github.com/new](https://github.com/new), name the repository `email-shaker`, and click **Create repository**.
2. On the new repo page, click **uploading an existing file**.
3. Drag in everything from this folder, including the `api` folder. Click **Commit changes**.

**Using git:**

```bash
cd email-shaker
git init
git add .
git commit -m "Email Shaker"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/email-shaker.git
git push -u origin main
```

## Step 2, option A: Full version on Vercel (recommended)

This is the version where **Shake it up** works. Vercel is free for a project this size and redeploys every time you push to GitHub.

1. Get an API key at [console.anthropic.com](https://console.anthropic.com) → **API Keys**. While you're there, set a monthly spend limit under **Billing**.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, click **Add New… → Project**, and import `email-shaker`.
3. Before deploying, open **Environment Variables** and add:
   - `ANTHROPIC_API_KEY`: your key from step 1
   - `LAB_PASSCODE`: a passcode you share with labmates (recommended, so strangers can't use your key)
   - `CLAUDE_MODEL` (optional): defaults to `claude-sonnet-5-5`
4. Click **Deploy**. You get a link like `email-shaker.vercel.app`.

If you add or change an environment variable later, redeploy from the Vercel dashboard (**Deployments → ⋯ → Redeploy**).

Each shake is one Claude API call and is billed to your Anthropic account. A recruitment email costs a fraction of a cent to a few cents per shake, depending on the model.

## Step 2, option B: GitHub Pages only (free, no API key)

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, and click **Save**.
3. After a minute, the site is live at `https://YOUR-USERNAME.github.io/email-shaker/`.

GitHub Pages can't run the server function, so **Shake it up** shows a note and only **Quick shuffle** works (it swaps the greeting, opener and sign-off).

## Never put your API key in the code

The key lives only in Vercel's Environment Variables. If a key ever ends up in a commit, delete it in the Anthropic Console and make a new one.

## Before you send rewritten emails

Recruitment emails are usually part of your IRB protocol. Check whether reworded versions are allowed. If they aren't, keep the approved text inside `[[ ]]` or use Quick shuffle.
