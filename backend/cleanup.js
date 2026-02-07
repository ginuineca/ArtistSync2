import fs from 'fs';
import path from 'path';

const filesToDelete = [
    'src/app.ts',
    'src/server.ts',
    'src/routes/admin.ts',
    'src/routes/auth.ts',
    'src/routes/playlist.ts',
    'src/routes/superadmin.ts',
    'src/controllers/playlistController.ts'
];

filesToDelete.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    try {
        fs.unlinkSync(fullPath);
        console.log(`Deleted: ${file}`);
    } catch (err) {
        console.log(`Error deleting ${file}: ${err.message}`);
    }
});

export default filesToDelete;
