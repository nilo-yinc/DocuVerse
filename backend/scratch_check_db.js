const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Project = require('./models/Project');

async function checkDb() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        const count = await Project.countDocuments();
        console.log(`Total projects: ${count}`);
        const samples = await Project.find({ docxFilename: 'sample_report.docx' });
        console.log(`Sample reports in DB: ${samples.length}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDb();
