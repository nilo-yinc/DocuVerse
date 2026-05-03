const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Project = require('./models/Project');

const USER_ID = '69f752139e7de9583e2ec20a';
const SAMPLE_DOC_PATH = path.resolve(__dirname, '../sample_SRS.docx');
const FILENAME = 'sample_report.docx';

async function seedSample() {
    try {
        if (!fs.existsSync(SAMPLE_DOC_PATH)) {
            console.error(`File not found: ${SAMPLE_DOC_PATH}`);
            process.exit(1);
        }

        const buffer = fs.readFileSync(SAMPLE_DOC_PATH);
        console.log(`Read file: ${SAMPLE_DOC_PATH} (${buffer.length} bytes)`);

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if sample already exists
        let project = await Project.findOne({ docxFilename: FILENAME });

        if (project) {
            console.log('Updating existing sample project...');
            project.docxBuffer = buffer;
            project.userId = USER_ID; // Ensure it's owned by the active user
            await project.save();
        } else {
            console.log('Creating new sample project...');
            project = new Project({
                userId: USER_ID,
                title: 'Sample Enterprise SRS',
                domain: 'enterprise',
                docxFilename: FILENAME,
                docxBuffer: buffer,
                techStack: {
                    frontend: 'React',
                    backend: 'Node.js/Python',
                    database: 'MongoDB'
                }
            });
            await project.save();
        }

        console.log(`✅ Sample report stored perfectly in MongoDB as ${FILENAME}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedSample();
