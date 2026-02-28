import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
    },
    code: {
        type: String,
        default: '// Welcome to CodeSync AI\n// Start typing your code here...',
    },
    language: {
        type: String,
        default: 'javascript',
    }
}, { timestamps: true });

export default mongoose.model('Room', RoomSchema);