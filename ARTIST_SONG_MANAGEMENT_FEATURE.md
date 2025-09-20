# 🎵 Artist Song Management Feature

## **Overview**
Complete song management system for artists to upload, store, submit for approval, and manage their songs with vote preservation.

## **Key Features**

### **1. Private Song Storage**
- **Upload MP3 files** directly to artist dashboard
- **20 song limit** per artist
- **20MB file size limit** per song
- **Private storage** until submitted for approval
- **File metadata tracking** (size, upload date, genre)

### **2. Approval Workflow**
- **Submit for approval** button for private songs
- **Admin review process** in admin dashboard
- **Status tracking** (pending, approved, rejected)
- **Automatic public visibility** when approved

### **3. Public/Private Toggle**
- **Remove from public view** at any time
- **Vote count preservation** via database triggers
- **Re-submit for approval** with restored votes
- **Complete vote history** maintained

### **4. Database Schema**

#### **New Fields Added to `songs` table:**
```sql
file_url text                    -- Supabase Storage URL
file_size integer               -- File size in bytes
is_public boolean DEFAULT false -- Public visibility flag
submitted_for_approval boolean DEFAULT false -- Approval status
original_vote_count integer DEFAULT 0 -- Preserved vote count
removed_at timestamp with time zone -- Removal timestamp
```

#### **New `song_versions` table:**
```sql
id uuid PRIMARY KEY
song_id uuid REFERENCES songs(id)
version_number integer DEFAULT 1
vote_count integer DEFAULT 0
is_public boolean DEFAULT false
created_at timestamp with time zone
removed_at timestamp with time zone
```

#### **Database Triggers:**
- **Automatic vote preservation** when songs are removed
- **Vote restoration** when songs are re-approved
- **Version history tracking**

## **API Endpoints**

### **1. Upload Song**
```
POST /api/artist/upload-song
```
- File upload to Supabase Storage
- Database record creation
- File size and type validation
- Artist song limit enforcement

### **2. Submit for Approval**
```
POST /api/artist/submit-song
```
- Mark song as submitted for approval
- Update status to pending
- Admin notification (via existing system)

### **3. Remove from Public**
```
POST /api/artist/remove-song
```
- Remove from public view
- Preserve vote count automatically
- Update removal timestamp

## **Artist Dashboard Interface**

### **Song Management Tab**
1. **Upload Form**
   - Song title input
   - Genre selection
   - File upload (MP3)
   - Upload/Cancel buttons

2. **Private Songs Section**
   - List of uploaded songs
   - File size and upload date
   - "Submit for Approval" button

3. **Pending Approval Section**
   - Songs submitted for review
   - Submission date
   - Status indicator

4. **Public Songs Section**
   - Currently visible songs
   - Vote count and target
   - "Remove from Public" button

5. **Removed Songs Section**
   - Songs with preserved votes
   - Original vote count
   - "Re-submit for Approval" button

## **User Flow**

### **New Song Upload:**
1. Artist clicks "Upload New Song"
2. Fills in title, genre, selects MP3 file
3. File uploaded to Supabase Storage
4. Song appears in "Private Songs" section
5. Artist can submit for approval when ready

### **Approval Process:**
1. Artist clicks "Submit for Approval"
2. Song moves to "Pending Approval" section
3. Admin sees song in admin dashboard approvals
4. Admin approves/rejects song
5. If approved, song appears in "Public Songs" section

### **Remove from Public:**
1. Artist clicks "Remove from Public"
2. Confirmation dialog shows vote preservation info
3. Song removed from public view
4. Vote count preserved in database
5. Song appears in "Removed Songs" section

### **Re-submit Removed Song:**
1. Artist clicks "Re-submit for Approval"
2. Song goes through approval process again
3. If approved, original vote count is restored
4. Song appears in "Public Songs" with preserved votes

## **Technical Implementation**

### **File Storage**
- **Supabase Storage bucket**: `song-files`
- **File organization**: `{artistId}/{timestamp}-{random}.mp3`
- **Public URLs** for approved songs
- **Automatic cleanup** (future enhancement)

### **Vote Preservation**
- **Database trigger** automatically preserves votes
- **Version history** tracks all changes
- **Seamless restoration** when re-approved
- **No data loss** during remove/restore cycle

### **Security**
- **Artist ownership verification** on all operations
- **File type validation** (audio files only)
- **Size limits** enforced
- **Access control** via Supabase RLS

## **Next Steps**

### **Immediate Testing:**
1. Run the SQL migration in Supabase
2. Test song upload functionality
3. Test approval workflow
4. Test vote preservation

### **Future Enhancements:**
1. **Audio preview** in dashboard
2. **Bulk operations** (upload multiple songs)
3. **Song analytics** (play count, engagement)
4. **File compression** for storage optimization
5. **Advanced metadata** (duration, bitrate, etc.)

## **Database Migration**
Run the `artist_song_management.sql` file in your Supabase SQL editor to set up all required tables, fields, and triggers.

---

**This feature provides artists with complete control over their song lifecycle while maintaining data integrity and vote preservation!** 🚀 