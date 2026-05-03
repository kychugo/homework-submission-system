# Zhiyun Homework System — Teacher Guide (English)

## Table of Contents
1. [Dashboard Overview](#1-dashboard-overview)
2. [Configure Subjects & Categories](#2-configure-subjects--categories)
3. [Assigning Homework](#3-assigning-homework)
4. [Viewing Submission Records](#4-viewing-submission-records)
5. [Marking & Returning Homework](#5-marking--returning-homework)
6. [Managing Student Accounts (Auto-Share)](#6-managing-student-accounts-auto-share)
7. [Google Drive Folder Structure](#7-google-drive-folder-structure)
8. [FAQ](#8-faq)

---

## 1. Dashboard Overview

When you open the **teacher dashboard URL**, you'll see three sections:

| Section | Buttons | Purpose |
|---------|---------|---------|
| **Folder Links** | Student Upload Zone, Pending Homework, Teacher Feedback, Returned Homework | Open the corresponding Google Drive folder directly |
| **System Functions** | Submission Records, Assign Homework, Raw Spreadsheet, Return Homework | Core teaching features |
| **Settings** | Subject/Category Settings, Auto-Share Management, Share Address Sheet | System configuration |

---

## 2. Configure Subjects & Categories

**Before first use**, it is recommended to configure your subjects and their homework categories.

1. Go to the dashboard → click **Subject/Category Settings**
2. To add a subject (e.g., English, Maths):
   - Type the subject name in the top input box → click **➕ Add Subject**
3. For each subject, add homework categories (e.g., Reading, Writing, Composition):
   - Type the category name in the subject's card → click **➕ Add Category**
4. To remove a subject or category, click the **🗑️ Delete** button
5. Click **💾 Save Settings** when done

> **Note:** Each subject has its own independent set of categories.

---

## 3. Assigning Homework

1. Go to the dashboard → click **Assign Homework**
2. Fill in the form:

   | Field | Description |
   |-------|-------------|
   | **Class** | Select the target class |
   | **Subject** | Select from your configured subjects |
   | **Category** | Select from the categories for that subject |
   | **Homework Name** | Full name of the assignment (e.g., The Treasure in the Soil) |
   | **Keyword** | Must be part of the homework name; used for auto-sorting files (e.g., Treasure) |
   | **Deadline** | Use the date picker or type manually (format: YYYY-MM-DD HH:MM) |

3. Click **Submit**
4. Review the confirmation popup and click **Confirm**

**Homework name format:**  
After submission, the system formats the name as:  
`「Subject」「Category」Homework Name【Keyword】`  
For example: `「Chinese」「Reading」The Treasure in the【Soil】`

This format is used for automatic folder sorting in Google Drive. **Do not manually edit homework names in the spreadsheet.**

---

## 4. Viewing Submission Records

1. Go to the dashboard → click **Submission Records**
2. Click a class button at the top to view that class's submission status
3. Colour guide:

   | Colour | Status |
   |--------|--------|
   | 🟩 Green | Submitted on time |
   | 🟨 Yellow | Submitted late |
   | 🟥 Red | Not submitted |

4. For more detail (e.g., submission time), open the raw spreadsheet: dashboard → **Raw: Submission/Assignment Sheet**

---

## 5. Marking & Returning Homework

### Marking Homework
1. Go to the dashboard → click **Pending Homework**
2. Navigate to the appropriate class → category → assignment subfolder
3. Open a student's file and add your feedback (annotate the file or create a new comment document)
4. Move the marked file to the **Teacher Feedback** folder (`3. 老師回饋區`)

### Automatic Return
The system automatically moves files from the Teacher Feedback folder to the correct student subfolder in **Returned Homework** every 15 minutes, based on the class and student name in the filename.

To return homework immediately, go to the dashboard and click **Return Homework Now**.

### Student Access
Students log in to their personal **Returned Homework** folder (access granted via the auto-share feature) to view teacher feedback.

---

## 6. Managing Student Accounts (Auto-Share)

### Adding Students
1. Go to the dashboard → click **Auto-Share Management**
2. Enter the student ID and name → click **➕ Add Student**
3. Repeat for all students
4. Click **▶ Run Auto-Share Now**

### Updating a Student Name
Enter the same student ID with the new name and click "Add Student" — the system will update the record automatically.

### Removing a Student
In the student list, click the **🗑️ Delete** button next to the student.  
(Note: This does not revoke any folder permissions already granted.)

---

## 7. Google Drive Folder Structure

```
📁 帙雲
├── 1. Upload Link (Students)    ← Temporary upload zone
├── 2. Pending Homework          ← Auto-sorted student submissions
│   └── [Class]
│       └── [Category]
│           └── [Assignment]     ← Student files are here
├── 3. Teacher Feedback          ← Place marked files here
└── 4. Returned Homework         ← Auto-distributed after marking
    └── 【Class】
        └── 【Student Name】     ← Shared with the student
            └── [Category]
                └── [Assignment]
```

---

## 8. FAQ

**Q: I assigned homework but the submission record hasn't updated**  
A: The system updates every 5 minutes. Wait a few minutes and refresh the page.

**Q: Students say their folder hasn't been shared with them**  
A: Go to Auto-Share Management, confirm the student is listed, and click "Run Auto-Share Now".

**Q: I want to change a homework deadline manually**  
A: Open the raw spreadsheet ("帙雲 - 繳交紀錄及課業佈置"), go to the correct class sheet, and edit the deadline in row 2 directly (format: `2025-04-24 23:59`).

**Q: How do I add a new class?**  
A: In the submission record spreadsheet, add a new sheet (tab), put the class name in cell A1, and list student names from A4 onwards.

**Q: Where can I see the overdue list?**  
A: In the "帙雲 - OverdueAssignments" spreadsheet — updated automatically every minute.
