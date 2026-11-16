# AUR-K EV website + private image manager

This is a deployable starter project for the AUR-K EV site. The `/admin` page lets an authenticated administrator upload and delete photos. Uploaded photos are stored in Supabase Storage and the public website reads the image list from Supabase.

## Important
This is a new starter project based on the AUR-K EV details shared in chat. It is not yet connected to your existing GitHub repository or Vercel deployment. To preserve and update your exact existing website, merge these files into that project or share its repository.

## 1. Create Supabase backend
1. Create a project at https://supabase.com.
2. Open SQL Editor, paste `supabase-setup.sql`, and run it.
3. Open Project Settings -> API. Copy the Project URL and anon/public key.
4. Paste both into `config.js`. Do not use the `service_role` key in browser code.
5. In Authentication -> Users, add your own admin user with your email and a strong password. Disable public sign-ups in Authentication settings so strangers cannot create accounts.

## 2. Deploy
1. Upload the project files to your GitHub repository (root folder).
2. Import/push the repository to Vercel, or let Vercel redeploy the connected repository.
3. No build command is required. Framework preset: Other; output directory: leave blank / `.`.
4. Open `https://YOUR-DOMAIN/admin.html` to sign in.

## 3. Manage photos
- Sign in at `/admin.html`.
- Enter a title, choose Product image / Homepage banner / Gallery image, select a JPG/PNG/WebP image (max 8 MB), then Upload image.
- Product images appear in the product section. A homepage banner image replaces the hero image.
- Delete removes the record and stored image.

## Security notes
- Only authenticated users can upload/delete through the admin interface.
- Public visitors can view images.
- Keep your admin password private. Never put Supabase service-role credentials in frontend files.
- For stronger production security, restrict admin access to a specific admin user ID with custom RLS policies before opening the admin route publicly.

## Current contact details
AUR-K EV BIKE EXPERT, Mansoorabad, Near Total Petrol Pump, Jhumra Road, Faisalabad, Pakistan.
WhatsApp / Call: 0323-9661747.
