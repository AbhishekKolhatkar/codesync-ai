import mongoose from 'mongoose';

const ProblemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true,
    },
    description: {
        type: String, // Can store HTML or Markdown
        required: true,
    },
    topics: {
        type: [String],
        default: [],
    },
    starterCode: {
        type: Map,
        of: String, // Language -> Code
        default: {},
    },
    testCases: [
        {
            input: String,
            expectedOutput: String,
            isHidden: {
                type: Boolean,
                default: false,
            }
        }
    ]
}, { timestamps: true });

export default mongoose.model('Problem', ProblemSchema);
