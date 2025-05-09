# Obsidian Day Planner Task Rollover (README)

---

## 🎯 Purpose

Automate the rollover of incomplete tasks from one daily note to the next in Obsidian, preserving headers and skipping weekends if desired.

---

## ✅ Features

- Copies unchecked tasks (`[ ]`) from today’s note to the next.
- Preserves header structure (`#`, `##`, etc.).
- Skips weekends: Friday → Monday.
- Prevents duplication.
- Creates next day’s note from template if it doesn’t exist.

---

## 📦 Installation

1. Save the script as `rollover-tasks.js` in your vault.
2. Install the **QuickAdd** plugin.
3. In QuickAdd:

   - Create a new **Macro**.
   - Add an action: **User Script** → Select `rollover-tasks.js`.
   - Create a **Choice** of type `Macro`, link it to the macro.
   - Enable the ⚡ lightning bolt to make it appear in the command palette.

4. (Optional) Assign a hotkey.

---

## 📅 Date Format Configuration

Edit the script to match your date format. Only ONE of these lines should be active:

```js
// ✅ dd-mm-yyyy (default)
const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
const [, day, month, year] = currentFilename.match(dateRegex).map(Number);

// ❌ yyyy-mm-dd
// const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
// const [, year, month, day] = ...

// ❌ mm-dd-yyyy
// const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
// const [, month, day, year] = ...

// ❌ dd/mm/yyyy
// const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
// const [, day, month, year] = ...

// ❌ yyyy.mm.dd
// const dateRegex = /^(\d{4})\.(\d{2})\.(\d{2})$/;
// const [, year, month, day] = ...
```

---

## 🔁 Weekend Skipping

**Enabled by default**: If today is Friday, tasks are rolled over to Monday.

To disable weekend skipping (i.e. always go to the next day), comment out the skip logic and uncomment the simple increment:

```js
// const nextDate = new Date(currentDate);
// nextDate.setDate(currentDate.getDate() + 1);
```

---

## 🧩 Template Path

Make sure the template path in the script matches your vault:

```js
const templatePath = "src/Templates/Daily Note Template.md";
```

---

## 🚀 How to Use

- Open today’s daily note.
- Run the command via QuickAdd or your hotkey.
- Tasks will be copied forward and grouped under their original headings.

---

## 🧪 Notes

- Completed tasks (`[x]`) are ignored.
- Indented subitems and blank lines are preserved.
- Tasks not under any header are handled too.

---

**Author**: Tobia Rigon
