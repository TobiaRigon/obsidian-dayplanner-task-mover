module.exports = async (tp) => {
    const app = tp?.app ?? window.app;
    const file = app.workspace.getActiveFile();
    if (!file) {
        console.log("❌ No active file found.");
        return;
    }

    const currentFilename = file.basename.trim();

    // Date format: choose the one matching your filename format
    // Only ONE should be uncommented

    // ✅ Current: dd-mm-yyyy (e.g. 09-05-2025)
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const [, day, month, year] = currentFilename.match(dateRegex).map(Number);

    // ❌ yyyy-mm-dd (e.g. 2025-05-09)
    // const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    // const [, year, month, day] = currentFilename.match(dateRegex).map(Number);

    // ❌ mm-dd-yyyy (e.g. 05-09-2025)
    // const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    // const [, month, day, year] = currentFilename.match(dateRegex).map(Number);

    // ❌ dd/mm/yyyy (slashes instead of dashes, e.g. 09/05/2025)
    // const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    // const [, day, month, year] = currentFilename.match(dateRegex).map(Number);

    // ❌ yyyy.mm.dd (dots, e.g. 2025.05.09)
    // const dateRegex = /^(\d{4})\.(\d{2})\.(\d{2})$/;
    // const [, year, month, day] = currentFilename.match(dateRegex).map(Number);

    const currentDate = new Date(year, month - 1, day);

    //=== Skip weekends variant ===//
    const nextDate = new Date(currentDate);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    if (dayOfWeek === 5) {
        // If Friday, skip to Monday
        nextDate.setDate(currentDate.getDate() + 3);
    } else {
        // Otherwise, next day
        nextDate.setDate(currentDate.getDate() + 1);
    }
    //=== End skip weekends ===//

    //=== Don't skip weekends variant ===//
    // const nextDate = new Date(currentDate);
    // nextDate.setDate(currentDate.getDate() + 1);
    //=== End don't skip weekends ===//

    const pad = n => n.toString().padStart(2, '0');
    const nextFilename = `${pad(nextDate.getDate())}-${pad(nextDate.getMonth() + 1)}-${nextDate.getFullYear()}`;
    const nextFilePath = `${file.parent.path}/${nextFilename}.md`;

    let nextFile = app.vault.getAbstractFileByPath(nextFilePath);

    // If next day's file does not exist, create it from a template
    if (!nextFile) {
        const templatePath = "src/Templates/Daily Note Template.md";
        const templateFile = app.vault.getAbstractFileByPath(templatePath);

        if (!templateFile) {
            console.log(`❌ Template not found: ${templatePath}`);
            return;
        }

        const templateContent = await app.vault.read(templateFile);
        await app.vault.create(nextFilePath, templateContent);
        nextFile = app.vault.getAbstractFileByPath(nextFilePath);

        if (!nextFile) {
            console.log(`❌ Error creating file: ${nextFilename}`);
            return;
        }

        console.log(`📄 Created file ${nextFilename} from template.`);
    }

    console.log(`➡️ Copying tasks to: ${nextFilename}`);

    const currentContent = await app.vault.read(file);
    const nextContent = await app.vault.read(nextFile);

    const isHeader = line => /^#{1,6} /.test(line);
    const getHeaderKey = line => line.trim();
    const isTask = line => /^- \[( |\/)\]/.test(line.trim());
    const isIndented = line => /^\s+/.test(line);

    const currentLines = currentContent.split('\n');
    const headerTaskMap = {};
    let currentHeader = null;
    let i = 0;

    while (i < currentLines.length) {
        const line = currentLines[i];

        if (isHeader(line)) {
            currentHeader = getHeaderKey(line);
            if (!headerTaskMap[currentHeader]) headerTaskMap[currentHeader] = [];
            i++;
            continue;
        }

        if (isTask(line)) {
            if (!currentHeader) currentHeader = '__no_header__';
            if (!headerTaskMap[currentHeader]) headerTaskMap[currentHeader] = [];

            const block = [line.trim()];
            i++;
            while (i < currentLines.length && (isIndented(currentLines[i]) || currentLines[i].trim() === '')) {
                block.push(currentLines[i]);
                i++;
            }

            headerTaskMap[currentHeader].push(block.join('\n'));
        } else {
            i++;
        }
    }

    const nextLines = nextContent.split('\n');
    const existingTaskMap = {};
    let currentNextHeader = null;

    for (const line of nextLines) {
        if (isHeader(line)) {
            currentNextHeader = getHeaderKey(line);
            if (!existingTaskMap[currentNextHeader]) existingTaskMap[currentNextHeader] = new Set();
        } else if (isTask(line)) {
            if (!currentNextHeader) currentNextHeader = '__no_header__';
            if (!existingTaskMap[currentNextHeader]) existingTaskMap[currentNextHeader] = new Set();
            existingTaskMap[currentNextHeader].add(line.trim());
        }
    }

    const resultLines = [...nextLines];
    i = 0;

    while (i < resultLines.length) {
        const line = resultLines[i];

        if (isHeader(line)) {
            const headerKey = getHeaderKey(line);
            const newTasks = headerTaskMap[headerKey] || [];
            const existing = existingTaskMap[headerKey] || new Set();

            const filtered = newTasks.filter(block => {
                const firstLine = block.split('\n')[0];
                return !existing.has(firstLine.trim());
            });

            if (filtered.length > 0) {
                console.log(`🧩 Adding ${filtered.length} task(s) under ${headerKey}`);

                let insertAt = i + 1;
                while (insertAt < resultLines.length && !isHeader(resultLines[insertAt])) {
                    insertAt++;
                }

                resultLines.splice(insertAt, 0, ...filtered, '');
                i = insertAt + filtered.length;
            }
        }

        i++;
    }

    if (headerTaskMap['__no_header__']) {
        const already = existingTaskMap['__no_header__'] || new Set();
        const filtered = headerTaskMap['__no_header__'].filter(block => {
            const firstLine = block.split('\n')[0];
            return !already.has(firstLine.trim());
        });

        if (filtered.length > 0) {
            console.log(`🧩 Adding ${filtered.length} ungrouped task(s)`);
            const insertAt = resultLines.findIndex(line => isHeader(line));
            resultLines.splice(insertAt === -1 ? resultLines.length : insertAt, 0, ...filtered, '');
        }
    }

    await app.vault.modify(nextFile, resultLines.join('\n'));
    console.log(`✅ Tasks copied to ${nextFilename}`);
    new Notice(`✅ Tasks copied to ${nextFilename}`);
};
